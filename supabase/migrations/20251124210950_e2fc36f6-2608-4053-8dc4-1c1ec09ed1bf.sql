-- Create function to calculate player attendance statistics
CREATE OR REPLACE FUNCTION public.get_player_attendance_stats(_player_id uuid, _team_id uuid)
RETURNS TABLE(
  total_games_invited bigint,
  total_games_attended bigint,
  attendance_percentage numeric,
  last_30_days_invited bigint,
  last_30_days_attended bigint,
  last_30_days_percentage numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- All time stats
    COUNT(*) as total_games_invited,
    COUNT(CASE WHEN gp.status = 'confirmed' THEN 1 END) as total_games_attended,
    ROUND(
      (COUNT(CASE WHEN gp.status = 'confirmed' THEN 1 END)::numeric / 
       NULLIF(COUNT(*)::numeric, 0)) * 100, 
      1
    ) as attendance_percentage,
    
    -- Last 30 days stats
    COUNT(CASE WHEN g.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days_invited,
    COUNT(CASE WHEN gp.status = 'confirmed' AND g.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days_attended,
    ROUND(
      (COUNT(CASE WHEN gp.status = 'confirmed' AND g.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::numeric / 
       NULLIF(COUNT(CASE WHEN g.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::numeric, 0)) * 100,
      1
    ) as last_30_days_percentage
  FROM public.game_participants gp
  JOIN public.games g ON g.id = gp.game_id
  WHERE gp.player_id = _player_id
    AND g.team_id = _team_id
    AND g.date <= CURRENT_DATE  -- Only count past games
    AND g.status IN ('finished', 'cancelled'); -- Only count completed games
END;
$$;

-- Create function to get attendance stats for all team players
CREATE OR REPLACE FUNCTION public.get_team_attendance_stats(_team_id uuid)
RETURNS TABLE(
  player_id uuid,
  player_name text,
  player_position text,
  total_games_invited bigint,
  total_games_attended bigint,
  attendance_percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    p.position as player_position,
    COUNT(gp.id) as total_games_invited,
    COUNT(CASE WHEN gp.status = 'confirmed' THEN 1 END) as total_games_attended,
    ROUND(
      (COUNT(CASE WHEN gp.status = 'confirmed' THEN 1 END)::numeric / 
       NULLIF(COUNT(gp.id)::numeric, 0)) * 100,
      1
    ) as attendance_percentage
  FROM public.players p
  LEFT JOIN public.game_participants gp ON gp.player_id = p.id
  LEFT JOIN public.games g ON g.id = gp.game_id AND g.date <= CURRENT_DATE
  WHERE p.team_id = _team_id
    AND (g.status IS NULL OR g.status IN ('finished', 'cancelled'))
    AND is_team_member(auth.uid(), p.team_id)
  GROUP BY p.id, p.name, p.position
  ORDER BY attendance_percentage DESC NULLS LAST, p.name;
$$;

COMMENT ON FUNCTION public.get_player_attendance_stats IS 'Calculates attendance statistics for a specific player including all-time and last 30 days metrics';
COMMENT ON FUNCTION public.get_team_attendance_stats IS 'Returns attendance statistics for all players in a team, ordered by attendance percentage';