-- ============================================================
-- 1.2 — Fila e Vagas: limites separados jogador/goleiro, fila com
-- motivo explícito, prioridade para mensalistas, inadimplente vai
-- automaticamente para a fila mesmo sendo mensalista.
-- ============================================================

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS member_type text NOT NULL DEFAULT 'mensalista'
    CHECK (member_type IN ('mensalista', 'diarista', 'convidado'));

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS waitlist_confirmation_hours integer NOT NULL DEFAULT 24
    CHECK (waitlist_confirmation_hours BETWEEN 1 AND 168);

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS max_outfield_players integer,
  ADD COLUMN IF NOT EXISTS max_goalkeepers integer;

ALTER TABLE public.game_participants
  DROP CONSTRAINT IF EXISTS game_participants_status_check;
ALTER TABLE public.game_participants
  ADD CONSTRAINT game_participants_status_check
    CHECK (status IN ('invited', 'confirmed', 'checked_in', 'absent', 'waitlist'));

ALTER TABLE public.game_participants
  ADD COLUMN IF NOT EXISTS slot_type text CHECK (slot_type IN ('player', 'goalkeeper')),
  ADD COLUMN IF NOT EXISTS waitlist_reason text,
  ADD COLUMN IF NOT EXISTS waitlist_position integer,
  ADD COLUMN IF NOT EXISTS confirm_by timestamptz;

-- ── Inadimplência: mensalidade vencida e não paga ──
CREATE OR REPLACE FUNCTION public.is_player_delinquent(_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM player_payments pp
    JOIN financial_periods fp ON fp.id = pp.financial_period_id
    WHERE pp.player_id = _player_id
      AND pp.payment_type = 'monthly_fee'
      AND pp.paid = false
      AND make_date(fp.period_year, fp.period_month, 1) <= date_trunc('month', now())::date
  );
$$;

-- ── Capacidade atual do jogo (para badge de vagas na UI) ──
CREATE OR REPLACE FUNCTION public.get_game_capacity(_game_id uuid)
RETURNS TABLE (
  confirmed_players      integer,
  confirmed_goalkeepers  integer,
  max_players            integer,
  max_goalkeepers        integer,
  waitlist_count         integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    (SELECT count(*)::int FROM game_participants gp WHERE gp.game_id = _game_id AND gp.status IN ('confirmed', 'checked_in') AND gp.slot_type = 'player'),
    (SELECT count(*)::int FROM game_participants gp WHERE gp.game_id = _game_id AND gp.status IN ('confirmed', 'checked_in') AND gp.slot_type = 'goalkeeper'),
    g.max_outfield_players,
    g.max_goalkeepers,
    (SELECT count(*)::int FROM game_participants gp WHERE gp.game_id = _game_id AND gp.status = 'waitlist')
  FROM games g WHERE g.id = _game_id;
$$;

-- ── Confirmação de presença com decisão de fila ──
CREATE OR REPLACE FUNCTION public.confirm_game_participation(_game_id uuid)
RETURNS TABLE (result_status text, result_reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id      uuid;
  v_team_id         uuid;
  v_player_id       uuid;
  v_position        text;
  v_slot_type       text;
  v_member_type     text;
  v_delinquent      boolean;
  v_confirmed_count integer;
  v_max             integer;
  v_status          text;
  v_reason          text;
  v_waitlist_pos    integer;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = auth.uid();
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  SELECT team_id INTO v_team_id FROM games WHERE id = _game_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Jogo não encontrado';
  END IF;

  SELECT id, position INTO v_player_id, v_position
  FROM players WHERE team_id = v_team_id AND profile_id = v_profile_id;
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Você precisa ser jogador deste time para confirmar presença';
  END IF;

  v_slot_type := CASE WHEN v_position ILIKE 'goleiro%' THEN 'goalkeeper' ELSE 'player' END;

  SELECT member_type INTO v_member_type
  FROM team_members WHERE team_id = v_team_id AND profile_id = v_profile_id;
  v_member_type := COALESCE(v_member_type, 'mensalista');

  v_delinquent := is_player_delinquent(v_player_id);

  IF v_delinquent THEN
    v_status := 'waitlist';
    v_reason := 'Saldo negativo pendente';
  ELSIF v_member_type IN ('diarista', 'convidado') THEN
    v_status := 'waitlist';
    v_reason := 'Aguardando aprovação';
  ELSE
    SELECT count(*) INTO v_confirmed_count
    FROM game_participants
    WHERE game_id = _game_id AND status IN ('confirmed', 'checked_in') AND slot_type = v_slot_type;

    SELECT CASE WHEN v_slot_type = 'goalkeeper' THEN max_goalkeepers ELSE max_outfield_players END
    INTO v_max FROM games WHERE id = _game_id;

    IF v_max IS NOT NULL AND v_confirmed_count >= v_max THEN
      v_status := 'waitlist';
      v_reason := 'Limite de vagas atingido';
    ELSE
      v_status := 'confirmed';
      v_reason := NULL;
    END IF;
  END IF;

  IF v_status = 'waitlist' THEN
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos
    FROM game_participants WHERE game_id = _game_id AND status = 'waitlist';
  ELSE
    v_waitlist_pos := NULL;
  END IF;

  INSERT INTO game_participants (game_id, player_id, profile_id, status, slot_type, waitlist_reason, waitlist_position, checked_in_at)
  VALUES (_game_id, v_player_id, v_profile_id, v_status, v_slot_type, v_reason, v_waitlist_pos,
          CASE WHEN v_status = 'confirmed' THEN now() ELSE NULL END)
  ON CONFLICT (game_id, player_id) DO UPDATE SET
    status            = EXCLUDED.status,
    slot_type         = EXCLUDED.slot_type,
    waitlist_reason   = EXCLUDED.waitlist_reason,
    waitlist_position = EXCLUDED.waitlist_position,
    checked_in_at     = EXCLUDED.checked_in_at,
    profile_id        = EXCLUDED.profile_id;

  RETURN QUERY SELECT v_status, v_reason;
END;
$$;

-- ── Admin aprova jogador da fila → promove a confirmado ──
CREATE OR REPLACE FUNCTION public.approve_waitlist_participant(_participant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_id uuid;
  v_team_id uuid;
BEGIN
  SELECT gp.game_id INTO v_game_id FROM game_participants gp WHERE gp.id = _participant_id;
  SELECT team_id INTO v_team_id FROM games WHERE id = v_game_id;

  IF NOT is_team_admin(auth.uid(), v_team_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar jogadores da fila';
  END IF;

  UPDATE game_participants
  SET status = 'confirmed',
      waitlist_reason = NULL,
      waitlist_position = NULL,
      confirm_by = now() + (SELECT waitlist_confirmation_hours FROM teams WHERE id = v_team_id) * interval '1 hour',
      checked_in_at = now()
  WHERE id = _participant_id;
END;
$$;

-- ── Admin rejeita jogador da fila → remove o registro ──
CREATE OR REPLACE FUNCTION public.reject_waitlist_participant(_participant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_id uuid;
  v_team_id uuid;
BEGIN
  SELECT gp.game_id INTO v_game_id FROM game_participants gp WHERE gp.id = _participant_id;
  SELECT team_id INTO v_team_id FROM games WHERE id = v_game_id;

  IF NOT is_team_admin(auth.uid(), v_team_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar jogadores da fila';
  END IF;

  DELETE FROM game_participants WHERE id = _participant_id AND status = 'waitlist';
END;
$$;
