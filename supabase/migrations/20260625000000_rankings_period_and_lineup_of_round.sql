-- ============================================================
-- Item 1.7: Rankings com pódio + filtro de período + Seleção da Rodada
-- ============================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS hide_negative_highlights boolean NOT NULL DEFAULT false;

-- ── Ranking de gols/assistências por período (não depende do
-- acumulado sem data em player_statistics; agrega match_events
-- direto, filtrando por games.date) ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_team_rankings(p_team_id uuid, p_period text DEFAULT 'career')
RETURNS TABLE(
  player_id uuid,
  player_name text,
  player_nickname text,
  goals bigint,
  assists bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    p.id,
    p.name,
    p.nickname,
    COUNT(*) FILTER (WHERE me.event_type = 'goal')   AS goals,
    COUNT(*) FILTER (WHERE me.event_type = 'assist') AS assists
  FROM players p
  JOIN match_events me ON me.player_id = p.id
  JOIN games g ON g.id = me.game_id
  WHERE p.team_id = p_team_id
    AND (v_start_date IS NULL OR g.date >= v_start_date)
  GROUP BY p.id, p.name, p.nickname
  ORDER BY goals DESC, assists DESC;
END;
$$;

-- ── Seleção da Rodada: melhor jogador (por nota média no jogo)
-- de cada posição registrada, entre quem foi avaliado na partida ──
CREATE OR REPLACE FUNCTION public.get_game_lineup_of_the_round(p_game_id uuid)
RETURNS TABLE(
  player_position text,
  player_id uuid,
  player_name text,
  player_nickname text,
  avg_rating numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (p.position)
    p.position AS player_position,
    p.id AS player_id,
    p.name AS player_name,
    p.nickname AS player_nickname,
    ROUND(AVG(gpr.rating)::numeric, 1) AS avg_rating
  FROM game_player_ratings gpr
  JOIN players p ON p.id = gpr.rated_player_id
  WHERE gpr.game_id = p_game_id
  GROUP BY p.position, p.id, p.name, p.nickname
  ORDER BY p.position, avg_rating DESC;
$$;

-- ── get_game_highlights passa a respeitar hide_negative_highlights ──
CREATE OR REPLACE FUNCTION public.get_game_highlights(p_game_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH team_settings AS (
    SELECT t.hide_negative_highlights AS hide_negative
    FROM games g JOIN teams t ON t.id = g.team_id
    WHERE g.id = p_game_id
  ),
  ratings_asc AS (
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
      CASE WHEN (SELECT hide_negative FROM team_settings) THEN NULL
        ELSE (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', avg_rating) FROM ratings_asc) END,
    'artilheiro',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_goal),
    'garcom',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_assist),
    'xerifao',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_tackle),
    'paredao',
      (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_save),
    'bola_murcha',
      CASE WHEN (SELECT hide_negative FROM team_settings) THEN NULL
        ELSE (SELECT jsonb_build_object('player_id', player_id, 'player_name', player_name, 'value', cnt) FROM top_foul) END
  );
$$;
