-- ============================================================
-- Onboarding v2: figurinha do jogador, wizard de time em 5 etapas,
-- avaliações configuráveis por time, status de cobrança pending_payment
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sticker_url text;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'masculino' CHECK (category IN ('masculino','feminino','mista')),
  ADD COLUMN IF NOT EXISTS rating_window_hours integer DEFAULT 6 CHECK (rating_window_hours BETWEEN 2 AND 23),
  ADD COLUMN IF NOT EXISTS rating_scale integer DEFAULT 10 CHECK (rating_scale IN (5, 10)),
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS finished_at timestamptz;

-- ── submit_game_ratings: respeita o prazo configurável por time ──
CREATE OR REPLACE FUNCTION public.submit_game_ratings(
  p_game_id uuid,
  p_ratings  jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rater_player_id uuid;
  v_game_status      text;
  v_finished_at      timestamptz;
  v_team_id          uuid;
  v_window_hours     integer;
  v_item             jsonb;
  v_pid              uuid;
  v_rat              integer;
BEGIN
  SELECT status, finished_at, team_id INTO v_game_status, v_finished_at, v_team_id
  FROM games WHERE id = p_game_id;

  IF v_game_status != 'finished' THEN
    RAISE EXCEPTION 'Só é possível avaliar jogadores de jogos finalizados';
  END IF;

  SELECT COALESCE(rating_window_hours, 6) INTO v_window_hours
  FROM teams WHERE id = v_team_id;

  IF v_finished_at IS NOT NULL AND now() > v_finished_at + (v_window_hours || ' hours')::interval THEN
    RAISE EXCEPTION 'O prazo para avaliar os jogadores deste jogo expirou';
  END IF;

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

  IF EXISTS (
    SELECT 1 FROM game_player_ratings
    WHERE game_id = p_game_id AND rater_player_id = v_rater_player_id
  ) THEN
    RAISE EXCEPTION 'Você já avaliou os jogadores deste jogo';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_ratings)
  LOOP
    v_pid := (v_item->>'player_id')::uuid;
    v_rat := (v_item->>'rating')::integer;

    CONTINUE WHEN v_pid = v_rater_player_id;

    INSERT INTO game_player_ratings (game_id, rater_player_id, rated_player_id, rating)
    VALUES (p_game_id, v_rater_player_id, v_pid, v_rat)
    ON CONFLICT (game_id, rater_player_id, rated_player_id) DO NOTHING;
  END LOOP;
END;
$$;
