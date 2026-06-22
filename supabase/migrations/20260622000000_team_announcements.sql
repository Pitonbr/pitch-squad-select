-- ============================================================
-- 1.3 — Mural de Avisos: avisos simples ou enquetes (até 5 opções),
-- reações like/dislike, galeria de fotos (fotos anexadas aos avisos).
-- Só admins do time podem postar; todo membro pode ver, reagir e votar.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('team-announcements', 'team-announcements', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view announcement photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-announcements');

CREATE POLICY "Authenticated users can upload announcement photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-announcements' AND auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.team_announcements (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id            uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  author_profile_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body               text        NOT NULL,
  photo_urls         text[]      NOT NULL DEFAULT '{}',
  poll_options       text[],
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_announcements_poll_size CHECK (
    poll_options IS NULL OR array_length(poll_options, 1) BETWEEN 2 AND 5
  )
);

CREATE INDEX IF NOT EXISTS idx_team_announcements_team ON public.team_announcements(team_id, created_at DESC);

ALTER TABLE public.team_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view announcements"
  ON public.team_announcements FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage announcements"
  ON public.team_announcements FOR ALL
  USING (public.is_team_admin(auth.uid(), team_id));

-- ── Reações like/dislike (1 reação por usuário por aviso) ──
CREATE TABLE IF NOT EXISTS public.team_announcement_reactions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id  uuid        NOT NULL REFERENCES public.team_announcements(id) ON DELETE CASCADE,
  profile_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type    text        NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, profile_id)
);

ALTER TABLE public.team_announcement_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view reactions"
  ON public.team_announcement_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_announcements ta
    WHERE ta.id = announcement_id AND public.is_team_member(auth.uid(), ta.team_id)
  ));

CREATE POLICY "Members can manage their own reaction"
  ON public.team_announcement_reactions FOR ALL
  USING (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- ── Votos de enquete (1 voto por usuário por aviso, pode trocar) ──
CREATE TABLE IF NOT EXISTS public.team_poll_votes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id  uuid        NOT NULL REFERENCES public.team_announcements(id) ON DELETE CASCADE,
  profile_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index     integer     NOT NULL CHECK (option_index >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, profile_id)
);

ALTER TABLE public.team_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view poll votes"
  ON public.team_poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_announcements ta
    WHERE ta.id = announcement_id AND public.is_team_member(auth.uid(), ta.team_id)
  ));

CREATE POLICY "Members can manage their own vote"
  ON public.team_poll_votes FOR ALL
  USING (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- ── Listagem enriquecida: contagens de reação + resultado da enquete + voto/reação do próprio usuário ──
CREATE OR REPLACE FUNCTION public.get_team_announcements(_team_id uuid)
RETURNS TABLE (
  id                uuid,
  body              text,
  photo_urls        text[],
  poll_options      text[],
  poll_votes        integer[],
  my_vote           integer,
  author_name       text,
  author_photo_url  text,
  like_count        integer,
  dislike_count     integer,
  my_reaction       text,
  created_at        timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF NOT is_team_member(auth.uid(), _team_id) THEN
    RAISE EXCEPTION 'Você não é membro deste time';
  END IF;

  SELECT pr.id INTO v_profile_id FROM profiles pr WHERE pr.user_id = auth.uid();

  RETURN QUERY
  SELECT
    ta.id,
    ta.body,
    ta.photo_urls,
    ta.poll_options,
    CASE WHEN ta.poll_options IS NULL THEN NULL ELSE (
      SELECT array_agg(cnt ORDER BY idx)
      FROM (
        SELECT gs.idx, COUNT(tpv.id)::integer AS cnt
        FROM generate_series(0, array_length(ta.poll_options, 1) - 1) AS gs(idx)
        LEFT JOIN team_poll_votes tpv ON tpv.announcement_id = ta.id AND tpv.option_index = gs.idx
        GROUP BY gs.idx
      ) sub
    ) END AS poll_votes,
    (SELECT option_index FROM team_poll_votes WHERE announcement_id = ta.id AND profile_id = v_profile_id) AS my_vote,
    COALESCE(p.name, pr.display_name, 'Administrador') AS author_name,
    p.profile_image AS author_photo_url,
    (SELECT COUNT(*)::integer FROM team_announcement_reactions WHERE announcement_id = ta.id AND reaction_type = 'like'),
    (SELECT COUNT(*)::integer FROM team_announcement_reactions WHERE announcement_id = ta.id AND reaction_type = 'dislike'),
    (SELECT reaction_type FROM team_announcement_reactions WHERE announcement_id = ta.id AND profile_id = v_profile_id),
    ta.created_at
  FROM team_announcements ta
  JOIN profiles pr ON pr.id = ta.author_profile_id
  LEFT JOIN players p ON p.profile_id = ta.author_profile_id AND p.team_id = ta.team_id
  WHERE ta.team_id = _team_id
  ORDER BY ta.created_at DESC;
END;
$$;

-- ── Alternar reação (clicar de novo remove; trocar tipo substitui) ──
CREATE OR REPLACE FUNCTION public.toggle_announcement_reaction(_announcement_id uuid, _reaction_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_existing   text;
BEGIN
  IF _reaction_type NOT IN ('like', 'dislike') THEN
    RAISE EXCEPTION 'Tipo de reação inválido';
  END IF;

  SELECT id INTO v_profile_id FROM profiles WHERE user_id = auth.uid();
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  SELECT reaction_type INTO v_existing
  FROM team_announcement_reactions
  WHERE announcement_id = _announcement_id AND profile_id = v_profile_id;

  IF v_existing IS NULL THEN
    INSERT INTO team_announcement_reactions (announcement_id, profile_id, reaction_type)
    VALUES (_announcement_id, v_profile_id, _reaction_type);
    RETURN _reaction_type;
  ELSIF v_existing = _reaction_type THEN
    DELETE FROM team_announcement_reactions WHERE announcement_id = _announcement_id AND profile_id = v_profile_id;
    RETURN NULL;
  ELSE
    UPDATE team_announcement_reactions SET reaction_type = _reaction_type
    WHERE announcement_id = _announcement_id AND profile_id = v_profile_id;
    RETURN _reaction_type;
  END IF;
END;
$$;

-- ── Votar (ou trocar voto) numa enquete ──
CREATE OR REPLACE FUNCTION public.vote_announcement_poll(_announcement_id uuid, _option_index integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_option_count integer;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = auth.uid();
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  SELECT array_length(poll_options, 1) INTO v_option_count
  FROM team_announcements WHERE id = _announcement_id;

  IF v_option_count IS NULL THEN
    RAISE EXCEPTION 'Este aviso não tem enquete';
  END IF;
  IF _option_index < 0 OR _option_index >= v_option_count THEN
    RAISE EXCEPTION 'Opção inválida';
  END IF;

  INSERT INTO team_poll_votes (announcement_id, profile_id, option_index)
  VALUES (_announcement_id, v_profile_id, _option_index)
  ON CONFLICT (announcement_id, profile_id) DO UPDATE SET option_index = EXCLUDED.option_index;
END;
$$;
