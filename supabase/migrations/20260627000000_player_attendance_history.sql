-- ============================================================
-- Item 1.9: Histórico de Presença visual por jogador (barras mensais)
-- Reusa exatamente o mesmo critério de get_player_attendance_stats
-- (presente = status 'confirmed', jogos finished/cancelled até hoje)
-- mas retorna a lista jogo a jogo em vez do agregado.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_player_attendance_history(p_player_id uuid)
RETURNS TABLE(
  game_id uuid,
  game_date date,
  game_title text,
  present boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.date,
    g.title,
    (gp.status = 'confirmed') AS present
  FROM game_participants gp
  JOIN games g ON g.id = gp.game_id
  WHERE gp.player_id = p_player_id
    AND g.status IN ('finished', 'cancelled')
    AND g.date <= CURRENT_DATE
  ORDER BY g.date ASC;
$$;
