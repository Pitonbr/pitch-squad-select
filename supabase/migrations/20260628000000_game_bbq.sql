-- ============================================================
-- Item 1.10: Gestão de Churrascos
-- Um churrasco é opcionalmente habilitado por jogo. Tem itens com
-- responsável e status (trouxe/não trouxe), confirmações de presença
-- separadas da confirmação do jogo (usadas para o rateio), e pode ser
-- restrito a mensalistas.
-- ============================================================

CREATE TABLE public.game_bbqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL UNIQUE REFERENCES public.games(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  restrict_to_monthly boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bbq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bbq_id uuid NOT NULL REFERENCES public.game_bbqs(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  responsible_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  estimated_cost numeric(10,2) NOT NULL DEFAULT 0,
  brought boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bbq_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bbq_id uuid NOT NULL REFERENCES public.game_bbqs(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bbq_id, player_id)
);

ALTER TABLE public.game_bbqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bbq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bbq_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view bbqs" ON public.game_bbqs
  FOR SELECT USING (is_team_member(auth.uid(), team_id));
CREATE POLICY "Team admins manage bbqs" ON public.game_bbqs
  FOR ALL USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team members can view bbq items" ON public.bbq_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.game_bbqs b WHERE b.id = bbq_id AND is_team_member(auth.uid(), b.team_id)
  ));
CREATE POLICY "Team members can manage bbq items" ON public.bbq_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.game_bbqs b WHERE b.id = bbq_id AND is_team_member(auth.uid(), b.team_id)
  ));

CREATE POLICY "Team members can view bbq confirmations" ON public.bbq_confirmations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.game_bbqs b WHERE b.id = bbq_id AND is_team_member(auth.uid(), b.team_id)
  ));
CREATE POLICY "Player can confirm own attendance" ON public.bbq_confirmations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players p
      JOIN public.profiles pr ON pr.id = p.profile_id
      WHERE p.id = player_id AND pr.user_id = auth.uid()
    )
  );
CREATE POLICY "Player can remove own confirmation" ON public.bbq_confirmations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.players p
      JOIN public.profiles pr ON pr.id = p.profile_id
      WHERE p.id = player_id AND pr.user_id = auth.uid()
    )
  );

-- ── Habilita/configura o churrasco de um jogo (idempotente) ──
CREATE OR REPLACE FUNCTION public.upsert_game_bbq(p_game_id uuid, p_restrict_to_monthly boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_profile_id uuid;
  v_bbq_id uuid;
BEGIN
  SELECT team_id INTO v_team_id FROM public.games WHERE id = p_game_id;

  IF NOT is_team_admin(auth.uid(), v_team_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem configurar o churrasco';
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid();

  INSERT INTO public.game_bbqs (game_id, team_id, restrict_to_monthly, created_by)
  VALUES (p_game_id, v_team_id, p_restrict_to_monthly, v_profile_id)
  ON CONFLICT (game_id) DO UPDATE SET restrict_to_monthly = p_restrict_to_monthly
  RETURNING id INTO v_bbq_id;

  RETURN v_bbq_id;
END;
$$;

-- ── Resumo do churrasco: itens, confirmados, rateio por pessoa ──
CREATE OR REPLACE FUNCTION public.get_bbq_summary(p_bbq_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_cost numeric;
  v_confirmed_count integer;
  v_cost_per_person numeric;
BEGIN
  SELECT COALESCE(SUM(estimated_cost), 0) INTO v_total_cost
  FROM public.bbq_items WHERE bbq_id = p_bbq_id;

  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.bbq_confirmations WHERE bbq_id = p_bbq_id;

  v_cost_per_person := CASE WHEN v_confirmed_count > 0 THEN ROUND(v_total_cost / v_confirmed_count, 2) ELSE NULL END;

  RETURN jsonb_build_object(
    'total_cost', v_total_cost,
    'confirmed_count', v_confirmed_count,
    'cost_per_person', v_cost_per_person
  );
END;
$$;

-- ── Envia lembrete (broadcast) para quem ainda não confirmou ──
CREATE OR REPLACE FUNCTION public.send_bbq_reminder(p_bbq_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_id uuid;
  v_team_id uuid;
  v_pending_names text;
  v_pending_items text;
BEGIN
  SELECT game_id, team_id INTO v_game_id, v_team_id FROM public.game_bbqs WHERE id = p_bbq_id;

  IF NOT is_team_admin(auth.uid(), v_team_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem enviar lembretes';
  END IF;

  SELECT string_agg(p.nickname, ', ') INTO v_pending_names
  FROM public.players p
  JOIN public.team_members tm ON tm.profile_id = p.profile_id AND tm.team_id = v_team_id
  LEFT JOIN public.bbq_confirmations bc ON bc.bbq_id = p_bbq_id AND bc.player_id = p.id
  WHERE p.team_id = v_team_id
    AND bc.id IS NULL
    AND (NOT (SELECT restrict_to_monthly FROM public.game_bbqs WHERE id = p_bbq_id) OR tm.member_type = 'mensalista');

  SELECT string_agg(item_name, ', ') INTO v_pending_items
  FROM public.bbq_items WHERE bbq_id = p_bbq_id AND brought = false;

  INSERT INTO public.game_notifications (game_id, team_id, title, message, notification_type, metadata)
  VALUES (
    v_game_id,
    v_team_id,
    'Lembrete de Churrasco',
    'Faltam confirmar: ' || COALESCE(v_pending_names, 'ninguém') ||
      '. Itens pendentes: ' || COALESCE(v_pending_items, 'nenhum'),
    'other',
    jsonb_build_object('bbq_id', p_bbq_id, 'kind', 'bbq_reminder')
  );
END;
$$;
