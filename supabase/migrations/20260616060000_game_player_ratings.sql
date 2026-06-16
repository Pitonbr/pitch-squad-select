-- ============================================================
-- Avaliações de jogadores pós-jogo + 7 Destaques automáticos
-- ============================================================

-- ── Tabela de avaliações individuais por partida ─────────────
CREATE TABLE IF NOT EXISTS public.game_player_ratings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         uuid        NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  rater_player_id uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  rated_player_id uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  rating          integer     NOT NULL CHECK (rating BETWEEN 1 AND 10),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, rater_player_id, rated_player_id),
  CHECK (rater_player_id != rated_player_id)
);

CREATE INDEX IF NOT EXISTS idx_gpr_game_id   ON public.game_player_ratings(game_id);
CREATE INDEX IF NOT EXISTS idx_gpr_rater     ON public.game_player_ratings(rater_player_id);
CREATE INDEX IF NOT EXISTS idx_gpr_rated     ON public.game_player_ratings(rated_player_id);

ALTER TABLE public.game_player_ratings ENABLE ROW LEVEL SECURITY;

-- Leitura aberta para membros do time (controle via funções)
CREATE POLICY "gpr_select" ON public.game_player_ratings
  FOR SELECT USING (true);

-- Somente funções SECURITY DEFINER inserem
CREATE POLICY "gpr_insert_fn" ON public.game_player_ratings
  FOR INSERT WITH CHECK (false);

-- ── Função: submeter avaliações em lote ──────────────────────
CREATE OR REPLACE FUNCTION public.submit_game_ratings(
  p_game_id uuid,
  p_ratings  jsonb   -- [{player_id: uuid, rating: int}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rater_player_id uuid;
  v_game_status     text;
  v_item            jsonb;
  v_pid             uuid;
  v_rat             integer;
BEGIN
  SELECT status INTO v_game_status FROM games WHERE id = p_game_id;
  IF v_game_status != 'finished' THEN
    RAISE EXCEPTION 'Só é possível avaliar jogadores de jogos finalizados';
  END IF;

  -- Descobre o player_id do usuário atual neste jogo
  SELECT gp.player_id INTO v_rater_player_id
  FROM game_participants gp
  JOIN profiles pr ON pr.id = gp.profile_id
  WHERE gp.game_id = p_game_id
    AND pr.user_id = auth.uid()
    AND gp.status IN ('confirmed', 'checked_in')
  LIMIT 1;

  IF v_rater_player_id IS NULL THEN
    RAISE EXCEPTION 'Você não participou deste jogo ou não confirmou presença';
  END IF;

  -- Verifica se já avaliou
  IF EXISTS (
    SELECT 1 FROM game_player_ratings
    WHERE game_id = p_game_id AND rater_player_id = v_rater_player_id
  ) THEN
    RAISE EXCEPTION 'Você já avaliou os jogadores deste jogo';
  END IF;

  -- Insere cada avaliação
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_ratings)
  LOOP
    v_pid := (v_item->>'player_id')::uuid;
    v_rat := (v_item->>'rating')::integer;

    -- Ignora auto-avaliação
    CONTINUE WHEN v_pid = v_rater_player_id;

    INSERT INTO game_player_ratings (game_id, rater_player_id, rated_player_id, rating)
    VALUES (p_game_id, v_rater_player_id, v_pid, v_rat)
    ON CONFLICT (game_id, rater_player_id, rated_player_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ── Função: usuário já avaliou este jogo? ────────────────────
CREATE OR REPLACE FUNCTION public.has_user_rated_game(p_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM game_player_ratings gpr
    JOIN game_participants gp
      ON gp.player_id = gpr.rater_player_id AND gp.game_id = p_game_id
    JOIN profiles pr ON pr.id = gp.profile_id
    WHERE gpr.game_id = p_game_id
      AND pr.user_id = auth.uid()
  );
$$;

-- ── Função: resumo de notas por jogador num jogo ─────────────
CREATE OR REPLACE FUNCTION public.get_game_ratings_summary(p_game_id uuid)
RETURNS TABLE(
  player_id  uuid,
  player_name text,
  avg_rating  numeric,
  vote_count  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gpr.rated_player_id                          AS player_id,
    pl.name                                      AS player_name,
    ROUND(AVG(gpr.rating)::numeric, 1)           AS avg_rating,
    COUNT(*)::bigint                             AS vote_count
  FROM game_player_ratings gpr
  JOIN players pl ON pl.id = gpr.rated_player_id
  WHERE gpr.game_id = p_game_id
  GROUP BY gpr.rated_player_id, pl.name
  ORDER BY avg_rating DESC NULLS LAST;
$$;

-- ── Função: participantes de um jogo para exibir na tela de avaliação ──
CREATE OR REPLACE FUNCTION public.get_game_participants_for_rating(p_game_id uuid)
RETURNS TABLE(
  player_id   uuid,
  player_name text,
  nickname    text,
  player_position text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gp.player_id,
    pl.name       AS player_name,
    pl.nickname,
    pl.position   AS player_position
  FROM game_participants gp
  JOIN players pl ON pl.id = gp.player_id
  WHERE gp.game_id = p_game_id
    AND gp.status IN ('confirmed', 'checked_in')
    AND gp.player_id IS NOT NULL
  ORDER BY pl.name;
$$;

-- ── Função: 7 Destaques automáticos de um jogo ───────────────
CREATE OR REPLACE FUNCTION public.get_game_highlights(p_game_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ratings_asc AS (
    SELECT player_id, player_name, avg_rating
    FROM get_game_ratings_summary(p_game_id)
    ORDER BY avg_rating ASC NULLS LAST
    LIMIT 1
  ),
  ratings_desc AS (
    SELECT player_id, player_name, avg_rating
    FROM get_game_ratings_summary(p_game_id)
    ORDER BY avg_rating DESC NULLS LAST
    LIMIT 1
  ),
  event_counts AS (
    SELECT
      me.player_id,
      pl.name AS player_name,
      me.event_type,
      COUNT(*) AS cnt
    FROM match_events me
    JOIN players pl ON pl.id = me.player_id
    WHERE me.game_id = p_game_id AND me.player_id IS NOT NULL
    GROUP BY me.player_id, pl.name, me.event_type
  ),
  top_goal     AS (SELECT player_id, player_name, cnt FROM event_counts WHERE event_type = 'goal'   ORDER BY cnt DESC LIMIT 1),
  top_assist   AS (SELECT player_id, player_name, cnt FROM event_counts WHERE event_type = 'assist' ORDER BY cnt DESC LIMIT 1),
  top_tackle   AS (SELECT player_id, player_name, cnt FROM event_counts WHERE event_type = 'tackle' ORDER BY cnt DESC LIMIT 1),
  top_save     AS (SELECT player_id, player_name, cnt FROM event_counts WHERE event_type = 'save'   ORDER BY cnt DESC LIMIT 1),
  top_foul     AS (SELECT player_id, player_name, cnt FROM event_counts WHERE event_type = 'foul'   ORDER BY cnt DESC LIMIT 1)
  SELECT jsonb_build_object(
    'craque',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', avg_rating) FROM ratings_desc),
    'pereba',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', avg_rating) FROM ratings_asc),
    'artilheiro',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_goal),
    'garcom',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_assist),
    'xerifao',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_tackle),
    'paredao',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_save),
    'bola_murcha',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_foul)
  );
$$;
