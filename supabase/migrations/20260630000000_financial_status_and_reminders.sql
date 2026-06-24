-- ============================================================
-- Item 1.12: Gestão Financeira avançada
--   - status de 3 estados em player_payments (pending/paid/overdue),
--     substituindo o booleano "paid" como fonte de verdade
--   - vencimento configurável por período (payment_due_day)
--   - cobrança em lote: lembrete em broadcast para todos os
--     pendentes/atrasados do período, reaproveitando game_notifications
-- ============================================================

ALTER TABLE public.financial_periods
  ADD COLUMN IF NOT EXISTS payment_due_day integer NOT NULL DEFAULT 10
    CHECK (payment_due_day BETWEEN 1 AND 28);

ALTER TABLE public.player_payments
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue'));

-- Backfill: linhas já pagas refletem o status; due_date calculado a
-- partir do período + dia de vencimento (default 10, já existente
-- em todo período antigo via DEFAULT acima).
UPDATE public.player_payments pp
SET status = 'paid'
WHERE pp.paid = true AND pp.status = 'pending';

UPDATE public.player_payments pp
SET due_date = make_date(fp.period_year, fp.period_month, fp.payment_due_day)
FROM public.financial_periods fp
WHERE pp.financial_period_id = fp.id AND pp.due_date IS NULL;

UPDATE public.player_payments
SET status = 'overdue'
WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < CURRENT_DATE;

-- ── game_notifications: vira o canal também de avisos financeiros,
-- que não pertencem a um jogo específico.
ALTER TABLE public.game_notifications ALTER COLUMN game_id DROP NOT NULL;

ALTER TABLE public.game_notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.game_notifications ADD CONSTRAINT valid_notification_type
  CHECK (notification_type IN ('game_finished', 'game_cancelled', 'mvp_voting', 'other', 'payment_due'));

-- ── Atualiza pending → overdue cujo vencimento já passou. Chamado
-- de forma "lazy" ao abrir a tela financeira (não há cron nesta base).
CREATE OR REPLACE FUNCTION public.refresh_overdue_payments(p_team_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF NOT is_team_member(auth.uid(), p_team_id) THEN
    RAISE EXCEPTION 'Apenas membros do time podem atualizar o status de pagamentos';
  END IF;

  UPDATE public.player_payments pp
  SET status = 'overdue'
  FROM public.financial_periods fp
  WHERE pp.financial_period_id = fp.id
    AND fp.team_id = p_team_id
    AND pp.status = 'pending'
    AND pp.due_date IS NOT NULL
    AND pp.due_date < CURRENT_DATE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- ── Cobrança em lote: lembrete único em broadcast para todo
-- pendente/atrasado do período, + log individual em payment_reminders
-- (mesmo mecanismo de auditoria já usado no lembrete avulso).
CREATE OR REPLACE FUNCTION public.send_batch_payment_reminders(p_financial_period_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id      uuid;
  v_profile_id   uuid;
  v_pending_names text;
  v_total_due    numeric;
  v_count        integer;
BEGIN
  SELECT team_id INTO v_team_id FROM public.financial_periods WHERE id = p_financial_period_id;

  IF NOT has_financial_admin_access(auth.uid(), v_team_id) THEN
    RAISE EXCEPTION 'Apenas administradores/tesoureiros podem cobrar em lote';
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid();

  SELECT string_agg(DISTINCT p.nickname, ', '), COALESCE(SUM(pp.amount), 0), COUNT(*)
  INTO v_pending_names, v_total_due, v_count
  FROM public.player_payments pp
  JOIN public.players p ON p.id = pp.player_id
  WHERE pp.financial_period_id = p_financial_period_id
    AND pp.status IN ('pending', 'overdue');

  IF v_count = 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.game_notifications (game_id, team_id, title, message, notification_type, metadata)
  VALUES (
    NULL,
    v_team_id,
    'Lembrete de Pagamento',
    'Pendentes: ' || COALESCE(v_pending_names, '') || '. Total a receber: R$ ' || to_char(v_total_due, 'FM999990.00'),
    'payment_due',
    jsonb_build_object('financial_period_id', p_financial_period_id, 'kind', 'payment_due_batch')
  );

  INSERT INTO public.payment_reminders (player_payment_id, sent_by, message)
  SELECT pp.id, v_profile_id, 'Lembrete de pagamento em lote enviado'
  FROM public.player_payments pp
  WHERE pp.financial_period_id = p_financial_period_id
    AND pp.status IN ('pending', 'overdue');

  RETURN v_count;
END;
$$;
