-- ============================================================
-- Item 1.14: Itens de changelog
--   (a) Pênaltis perdidos — novo tipo de evento + stat
--   (b) Critério de desempate nos rankings
--   (c) Jogador flex — novo member_type "sob demanda"
--   (d) Aba Resenha — feed social do time (não ligado a um jogo)
-- (Previsão do tempo fica só no frontend, sem necessidade de schema)
-- ============================================================

-- ── (a) Pênaltis perdidos ──────────────────────────────────
ALTER TABLE public.match_events DROP CONSTRAINT IF EXISTS match_events_event_type_check;
ALTER TABLE public.match_events ADD CONSTRAINT match_events_event_type_check
  CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'tackle', 'save', 'foul', 'offside', 'penalty_missed'));

ALTER TABLE public.player_statistics ADD COLUMN IF NOT EXISTS penalties_missed integer DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_player_stats_on_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _team_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT team_id INTO _team_id FROM games WHERE id = NEW.game_id;

    INSERT INTO player_statistics (player_id, team_id)
    VALUES (NEW.player_id, _team_id)
    ON CONFLICT (player_id, team_id) DO NOTHING;

    UPDATE player_statistics SET
      goals           = goals           + CASE WHEN NEW.event_type = 'goal' THEN 1 ELSE 0 END,
      assists         = assists         + CASE WHEN NEW.event_type = 'assist' THEN 1 ELSE 0 END,
      yellow_cards    = yellow_cards    + CASE WHEN NEW.event_type = 'yellow_card' THEN 1 ELSE 0 END,
      red_cards       = red_cards       + CASE WHEN NEW.event_type = 'red_card' THEN 1 ELSE 0 END,
      tackles         = tackles         + CASE WHEN NEW.event_type = 'tackle' THEN 1 ELSE 0 END,
      saves           = saves           + CASE WHEN NEW.event_type = 'save' THEN 1 ELSE 0 END,
      fouls           = fouls           + CASE WHEN NEW.event_type = 'foul' THEN 1 ELSE 0 END,
      penalties_missed = penalties_missed + CASE WHEN NEW.event_type = 'penalty_missed' THEN 1 ELSE 0 END
    WHERE player_id = NEW.player_id AND team_id = _team_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT team_id INTO _team_id FROM games WHERE id = OLD.game_id;

    UPDATE player_statistics SET
      goals           = goals           - CASE WHEN OLD.event_type = 'goal' THEN 1 ELSE 0 END,
      assists         = assists         - CASE WHEN OLD.event_type = 'assist' THEN 1 ELSE 0 END,
      yellow_cards    = yellow_cards    - CASE WHEN OLD.event_type = 'yellow_card' THEN 1 ELSE 0 END,
      red_cards       = red_cards       - CASE WHEN OLD.event_type = 'red_card' THEN 1 ELSE 0 END,
      tackles         = tackles         - CASE WHEN OLD.event_type = 'tackle' THEN 1 ELSE 0 END,
      saves           = saves           - CASE WHEN OLD.event_type = 'save' THEN 1 ELSE 0 END,
      fouls           = fouls           - CASE WHEN OLD.event_type = 'foul' THEN 1 ELSE 0 END,
      penalties_missed = penalties_missed - CASE WHEN OLD.event_type = 'penalty_missed' THEN 1 ELSE 0 END
    WHERE player_id = OLD.player_id AND team_id = _team_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_player_career_stats(p_player_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'goals',            COALESCE(ps.goals, 0),
    'assists',          COALESCE(ps.assists, 0),
    'yellow_cards',     COALESCE(ps.yellow_cards, 0),
    'red_cards',        COALESCE(ps.red_cards, 0),
    'saves',            COALESCE(ps.saves, 0),
    'tackles',          COALESCE(ps.tackles, 0),
    'penalties_missed', COALESCE(ps.penalties_missed, 0),
    'games_played',     COALESCE(ps.games_played, 0),
    'avg_rating',       ps.avg_rating,
    'total_votes',  (
      SELECT COUNT(*)
      FROM game_player_ratings
      WHERE rated_player_id = p_player_id
    )
  )
  FROM player_statistics ps
  WHERE ps.player_id = p_player_id
  LIMIT 1;
$$;

-- ── (b) Critério de desempate nos rankings ─────────────────
-- Antes só "goals DESC, assists DESC" (empates ficavam em ordem
-- arbitrária do banco). Critério completo: gols, assistências,
-- menos cartões (disciplina), nome (determinístico).
CREATE OR REPLACE FUNCTION public.get_team_rankings(p_team_id uuid, p_period text DEFAULT 'career')
RETURNS TABLE(
  player_id uuid,
  player_name text,
  player_nickname text,
  goals bigint,
  assists bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_start_date date;
BEGIN
  v_start_date := CASE p_period
    WHEN 'month'    THEN (CURRENT_DATE - INTERVAL '30 days')::date
    WHEN 'quarter'  THEN (CURRENT_DATE - INTERVAL '90 days')::date
    WHEN 'semester' THEN (CURRENT_DATE - INTERVAL '180 days')::date
    WHEN 'year'     THEN (CURRENT_DATE - INTERVAL '365 days')::date
    ELSE NULL
  END;

  RETURN QUERY
  SELECT
    p.id, p.name, p.nickname,
    COUNT(*) FILTER (WHERE me.event_type = 'goal')   AS goals,
    COUNT(*) FILTER (WHERE me.event_type = 'assist') AS assists
  FROM players p
  JOIN match_events me ON me.player_id = p.id
  JOIN games g ON g.id = me.game_id
  WHERE p.team_id = p_team_id
    AND (v_start_date IS NULL OR g.date >= v_start_date)
  GROUP BY p.id, p.name, p.nickname
  ORDER BY
    goals DESC,
    assists DESC,
    COUNT(*) FILTER (WHERE me.event_type IN ('yellow_card', 'red_card')) ASC,
    p.name ASC;
END;
$$;

-- ── (c) Jogador flex ────────────────────────────────────────
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_member_type_check;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_member_type_check
  CHECK (member_type IN ('mensalista', 'diarista', 'convidado', 'flex'));
-- Nenhuma mudança necessária em confirm_game_participation(): a função já
-- tem um ramo "ELSIF member_type IN ('diarista','convidado') THEN aguarda
-- aprovação" e cai no ELSE (checagem de capacidade, sem aprovação) para
-- qualquer outro valor — 'flex' já se comporta como mensalista nesse fluxo.

ALTER TABLE public.game_notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.game_notifications ADD CONSTRAINT valid_notification_type
  CHECK (notification_type IN ('game_finished', 'game_cancelled', 'mvp_voting', 'other', 'payment_due', 'flex_call'));

-- ── Chama os jogadores flex do time quando o jogo está com poucos
-- confirmados, em vez de inscrevê-los automaticamente (decisão de
-- design: avisar e deixar o jogador confirmar, não comprometê-lo
-- sem consentimento).
CREATE OR REPLACE FUNCTION public.notify_flex_players(p_game_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id           uuid;
  v_confirmed         integer;
  v_max_outfield      integer;
  v_flex_count        integer;
BEGIN
  SELECT team_id, max_outfield_players INTO v_team_id, v_max_outfield
  FROM public.games WHERE id = p_game_id;

  IF NOT is_team_admin(auth.uid(), v_team_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem chamar jogadores flex';
  END IF;

  SELECT COUNT(*) INTO v_confirmed
  FROM public.game_participants
  WHERE game_id = p_game_id AND status IN ('confirmed', 'checked_in');

  IF v_max_outfield IS NOT NULL AND v_confirmed >= v_max_outfield THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_flex_count
  FROM public.team_members
  WHERE team_id = v_team_id AND member_type = 'flex';

  IF v_flex_count = 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.game_notifications (game_id, team_id, title, message, notification_type, metadata)
  VALUES (
    p_game_id,
    v_team_id,
    'Vagas abertas — chamada de flex',
    'O jogo está com poucos confirmados. Jogadores flex podem confirmar presença se tiverem disponibilidade.',
    'flex_call',
    jsonb_build_object('game_id', p_game_id, 'kind', 'flex_call')
  );

  RETURN v_flex_count;
END;
$$;

-- ── (d) Aba Resenha — feed social do time ──────────────────
CREATE TABLE public.team_feed_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view feed posts" ON public.team_feed_posts
  FOR SELECT USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can post to feed" ON public.team_feed_posts
  FOR INSERT WITH CHECK (
    is_team_member(auth.uid(), team_id)
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = profile_id AND pr.user_id = auth.uid())
  );

CREATE POLICY "Author or admin can delete feed posts" ON public.team_feed_posts
  FOR DELETE USING (
    is_team_admin(auth.uid(), team_id)
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = profile_id AND pr.user_id = auth.uid())
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.team_feed_posts;
