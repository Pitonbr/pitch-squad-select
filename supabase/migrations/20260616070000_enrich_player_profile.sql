-- ============================================================
-- Enriquecer perfil do jogador: pé dominante, time favorito
-- Nota média de carreira na tabela player_statistics
-- ============================================================

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS dominant_foot text
    CHECK (dominant_foot IN ('right', 'left', 'both')),
  ADD COLUMN IF NOT EXISTS favorite_team text;

ALTER TABLE public.player_statistics
  ADD COLUMN IF NOT EXISTS avg_rating numeric(3,1);

-- ── Trigger para manter avg_rating em player_statistics ──────
CREATE OR REPLACE FUNCTION public.update_player_avg_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Descobre o time do jogador avaliado
  SELECT team_id INTO v_team_id FROM players WHERE id = NEW.rated_player_id LIMIT 1;

  UPDATE player_statistics
  SET avg_rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM game_player_ratings
    WHERE rated_player_id = NEW.rated_player_id
  )
  WHERE player_id = NEW.rated_player_id AND team_id = v_team_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_player_avg_rating ON public.game_player_ratings;
CREATE TRIGGER trg_update_player_avg_rating
  AFTER INSERT OR UPDATE ON public.game_player_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_player_avg_rating();

-- ── Função: estatísticas completas do jogador (carreira) ─────
CREATE OR REPLACE FUNCTION public.get_player_career_stats(p_player_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'goals',        COALESCE(ps.goals, 0),
    'assists',      COALESCE(ps.assists, 0),
    'yellow_cards', COALESCE(ps.yellow_cards, 0),
    'red_cards',    COALESCE(ps.red_cards, 0),
    'saves',        COALESCE(ps.saves, 0),
    'tackles',      COALESCE(ps.tackles, 0),
    'games_played', COALESCE(ps.games_played, 0),
    'avg_rating',   ps.avg_rating,
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
