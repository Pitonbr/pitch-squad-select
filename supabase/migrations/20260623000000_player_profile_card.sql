-- ============================================================
-- Item 1.5: Perfil do jogador redesenhado
-- Registro de partidas (vitórias/empates/derrotas) + contestação
-- de estatísticas pelo próprio jogador, com aprovação do admin.
-- ============================================================

-- ── Registro de partidas: jogos disputados e taxa de vitória ──
-- games_played do player_statistics nunca é incrementado (não há
-- trigger para isso), então calculamos "jogos" a partir do check-in
-- real em jogos finalizados. Vitória/empate/derrota só pode ser
-- calculada para jogos com lineup (time definido), que é a única
-- fonte de "lado" do jogador numa partida hoje.
CREATE OR REPLACE FUNCTION public.get_player_match_record(p_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_games_played integer;
  v_wins integer;
  v_draws integer;
  v_losses integer;
BEGIN
  SELECT COUNT(DISTINCT gp.game_id) INTO v_games_played
  FROM game_participants gp
  JOIN games g ON g.id = gp.game_id
  WHERE gp.player_id = p_player_id
    AND gp.status = 'checked_in'
    AND g.status = 'finished';

  SELECT
    COUNT(*) FILTER (WHERE (ml.team_side = 'home' AND g.home_score > g.away_score) OR (ml.team_side = 'away' AND g.away_score > g.home_score)),
    COUNT(*) FILTER (WHERE g.home_score = g.away_score),
    COUNT(*) FILTER (WHERE (ml.team_side = 'home' AND g.home_score < g.away_score) OR (ml.team_side = 'away' AND g.away_score < g.home_score))
  INTO v_wins, v_draws, v_losses
  FROM match_lineups ml
  JOIN games g ON g.id = ml.game_id
  WHERE ml.player_id = p_player_id AND g.status = 'finished';

  v_wins := COALESCE(v_wins, 0);
  v_draws := COALESCE(v_draws, 0);
  v_losses := COALESCE(v_losses, 0);

  RETURN jsonb_build_object(
    'games_played', v_games_played,
    'wins', v_wins,
    'draws', v_draws,
    'losses', v_losses,
    'win_rate', CASE WHEN (v_wins + v_draws + v_losses) > 0
      THEN ROUND(v_wins::numeric / (v_wins + v_draws + v_losses) * 100, 1)
      ELSE NULL END
  );
END;
$$;

-- ── Contestação de estatísticas ──────────────────────────────
CREATE TABLE public.player_stat_disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  stat_field text NOT NULL CHECK (stat_field IN ('goals', 'assists', 'yellow_cards', 'red_cards', 'saves', 'tackles', 'fouls')),
  current_value integer NOT NULL,
  requested_value integer NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_stat_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view disputes"
ON public.player_stat_disputes
FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Admins manage disputes"
ON public.player_stat_disputes
FOR ALL
USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Player can create own dispute"
ON public.player_stat_disputes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.players p
    JOIN public.profiles pr ON pr.id = p.profile_id
    WHERE p.id = player_id AND pr.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.submit_stat_dispute(
  p_player_id uuid,
  p_stat_field text,
  p_requested_value integer,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_current_value integer;
  v_dispute_id uuid;
  v_profile_id uuid;
BEGIN
  SELECT pr.id INTO v_profile_id
  FROM public.players p
  JOIN public.profiles pr ON pr.id = p.profile_id
  WHERE p.id = p_player_id AND pr.user_id = auth.uid();

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Você só pode contestar suas próprias estatísticas';
  END IF;

  SELECT team_id INTO v_team_id FROM public.players WHERE id = p_player_id;

  EXECUTE format('SELECT %I FROM public.player_statistics WHERE player_id = $1 AND team_id = $2', p_stat_field)
    INTO v_current_value USING p_player_id, v_team_id;

  INSERT INTO public.player_stat_disputes (player_id, team_id, stat_field, current_value, requested_value, reason, created_by)
  VALUES (p_player_id, v_team_id, p_stat_field, COALESCE(v_current_value, 0), p_requested_value, p_reason, v_profile_id)
  RETURNING id INTO v_dispute_id;

  RETURN v_dispute_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_stat_dispute(p_dispute_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute record;
  v_resolver_profile_id uuid;
BEGIN
  SELECT * INTO v_dispute FROM public.player_stat_disputes WHERE id = p_dispute_id;

  IF v_dispute IS NULL THEN
    RAISE EXCEPTION 'Contestação não encontrada';
  END IF;

  IF NOT is_team_admin(auth.uid(), v_dispute.team_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar contestações';
  END IF;

  SELECT id INTO v_resolver_profile_id FROM public.profiles WHERE user_id = auth.uid();

  EXECUTE format('UPDATE public.player_statistics SET %I = $1 WHERE player_id = $2 AND team_id = $3', v_dispute.stat_field)
    USING v_dispute.requested_value, v_dispute.player_id, v_dispute.team_id;

  UPDATE public.player_stat_disputes
  SET status = 'approved', resolved_by = v_resolver_profile_id, resolved_at = now()
  WHERE id = p_dispute_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_stat_dispute(p_dispute_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_resolver_profile_id uuid;
BEGIN
  SELECT team_id INTO v_team_id FROM public.player_stat_disputes WHERE id = p_dispute_id;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Contestação não encontrada';
  END IF;

  IF NOT is_team_admin(auth.uid(), v_team_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar contestações';
  END IF;

  SELECT id INTO v_resolver_profile_id FROM public.profiles WHERE user_id = auth.uid();

  UPDATE public.player_stat_disputes
  SET status = 'rejected', resolved_by = v_resolver_profile_id, resolved_at = now()
  WHERE id = p_dispute_id;
END;
$$;
