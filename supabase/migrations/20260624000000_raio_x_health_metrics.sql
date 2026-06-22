-- ============================================================
-- Item 1.6: Raio-X — saúde do grupo e do jogador
-- Distingue taxa de confirmação (confirmou presença) de taxa de
-- comparecimento (efetivamente fez check-in), e calcula tendência
-- comparando o período atual com o período imediatamente anterior
-- de mesma duração.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_team_health_metrics(p_team_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start date := CURRENT_DATE - p_days;
  v_prev_start date := CURRENT_DATE - (p_days * 2);
  v_invited integer;
  v_confirmed integer;
  v_attended integer;
  v_prev_attendance_rate numeric;
  v_active_members integer;
  v_games_played integer;
  v_confirmation_rate numeric;
  v_attendance_rate numeric;
BEGIN
  SELECT COUNT(gp.id),
         COUNT(*) FILTER (WHERE gp.status IN ('confirmed', 'checked_in')),
         COUNT(*) FILTER (WHERE gp.status = 'checked_in')
    INTO v_invited, v_confirmed, v_attended
  FROM games g
  JOIN game_participants gp ON gp.game_id = g.id
  WHERE g.team_id = p_team_id AND g.status = 'finished'
    AND g.date > v_period_start AND g.date <= CURRENT_DATE
    AND gp.status != 'waitlist';

  v_confirmation_rate := CASE WHEN v_invited > 0 THEN ROUND(v_confirmed::numeric / v_invited * 100, 1) ELSE NULL END;
  v_attendance_rate := CASE WHEN v_invited > 0 THEN ROUND(v_attended::numeric / v_invited * 100, 1) ELSE NULL END;

  SELECT CASE WHEN COUNT(gp.id) > 0 THEN ROUND(COUNT(*) FILTER (WHERE gp.status = 'checked_in')::numeric / COUNT(gp.id) * 100, 1) ELSE NULL END
    INTO v_prev_attendance_rate
  FROM games g
  JOIN game_participants gp ON gp.game_id = g.id
  WHERE g.team_id = p_team_id AND g.status = 'finished'
    AND g.date > v_prev_start AND g.date <= v_period_start
    AND gp.status != 'waitlist';

  SELECT COUNT(DISTINCT gp.player_id) INTO v_active_members
  FROM games g
  JOIN game_participants gp ON gp.game_id = g.id
  WHERE g.team_id = p_team_id
    AND g.date > v_period_start AND g.date <= CURRENT_DATE
    AND gp.status IN ('confirmed', 'checked_in');

  SELECT COUNT(*) INTO v_games_played
  FROM games
  WHERE team_id = p_team_id AND status = 'finished'
    AND date > v_period_start AND date <= CURRENT_DATE;

  RETURN jsonb_build_object(
    'period_days', p_days,
    'games_played', v_games_played,
    'confirmation_rate', v_confirmation_rate,
    'attendance_rate', v_attendance_rate,
    'active_members', v_active_members,
    'previous_attendance_rate', v_prev_attendance_rate,
    'trend', CASE
      WHEN v_attendance_rate IS NULL OR v_prev_attendance_rate IS NULL THEN 'sem_dados'
      WHEN v_attendance_rate - v_prev_attendance_rate > 5 THEN 'subindo'
      WHEN v_attendance_rate - v_prev_attendance_rate < -5 THEN 'caindo'
      ELSE 'estavel'
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_player_health_metrics(p_player_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_period_start date := CURRENT_DATE - p_days;
  v_prev_start date := CURRENT_DATE - (p_days * 2);
  v_invited integer;
  v_confirmed integer;
  v_attended integer;
  v_prev_attendance_rate numeric;
  v_confirmation_rate numeric;
  v_attendance_rate numeric;
BEGIN
  SELECT team_id INTO v_team_id FROM players WHERE id = p_player_id;

  SELECT COUNT(gp.id),
         COUNT(*) FILTER (WHERE gp.status IN ('confirmed', 'checked_in')),
         COUNT(*) FILTER (WHERE gp.status = 'checked_in')
    INTO v_invited, v_confirmed, v_attended
  FROM games g
  JOIN game_participants gp ON gp.game_id = g.id
  WHERE gp.player_id = p_player_id AND g.status = 'finished'
    AND g.date > v_period_start AND g.date <= CURRENT_DATE
    AND gp.status != 'waitlist';

  v_confirmation_rate := CASE WHEN v_invited > 0 THEN ROUND(v_confirmed::numeric / v_invited * 100, 1) ELSE NULL END;
  v_attendance_rate := CASE WHEN v_invited > 0 THEN ROUND(v_attended::numeric / v_invited * 100, 1) ELSE NULL END;

  SELECT CASE WHEN COUNT(gp.id) > 0 THEN ROUND(COUNT(*) FILTER (WHERE gp.status = 'checked_in')::numeric / COUNT(gp.id) * 100, 1) ELSE NULL END
    INTO v_prev_attendance_rate
  FROM games g
  JOIN game_participants gp ON gp.game_id = g.id
  WHERE gp.player_id = p_player_id AND g.status = 'finished'
    AND g.date > v_prev_start AND g.date <= v_period_start
    AND gp.status != 'waitlist';

  RETURN jsonb_build_object(
    'period_days', p_days,
    'team_id', v_team_id,
    'games_invited', v_invited,
    'confirmation_rate', v_confirmation_rate,
    'attendance_rate', v_attendance_rate,
    'previous_attendance_rate', v_prev_attendance_rate,
    'trend', CASE
      WHEN v_attendance_rate IS NULL OR v_prev_attendance_rate IS NULL THEN 'sem_dados'
      WHEN v_attendance_rate - v_prev_attendance_rate > 5 THEN 'subindo'
      WHEN v_attendance_rate - v_prev_attendance_rate < -5 THEN 'caindo'
      ELSE 'estavel'
    END
  );
END;
$$;
