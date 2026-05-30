-- ============================================================
-- Payment schema: subscriptions, transactions, pending payments
-- ============================================================

-- ── Extend teams table ───────────────────────────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS subscription_id        text,
  ADD COLUMN IF NOT EXISTS subscription_status    text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_plan      text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS subscription_trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- ── Subscriptions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id                 uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  stripe_customer_id      text NOT NULL,
  stripe_subscription_id  text UNIQUE,
  stripe_price_id         text,
  plan                    text NOT NULL DEFAULT 'monthly',  -- monthly | annual
  status                  text NOT NULL DEFAULT 'trialing', -- trialing | active | past_due | canceled | unpaid | readonly
  trial_end               timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_team_id ON public.subscriptions(team_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON public.subscriptions(status);

-- ── Payment transactions (full history) ──────────────────────
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                  uuid REFERENCES public.profiles(id),
  team_id                     uuid REFERENCES public.teams(id),
  type                        text NOT NULL,   -- subscription | join_fee | matchup_fee
  amount_cents                integer NOT NULL,
  currency                    text NOT NULL DEFAULT 'brl',
  stripe_payment_intent_id    text,
  stripe_session_id           text,
  status                      text NOT NULL DEFAULT 'pending', -- pending | succeeded | failed | refunded
  metadata                    jsonb NOT NULL DEFAULT '{}',
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_profile_id ON public.payment_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_team_id    ON public.payment_transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status     ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type       ON public.payment_transactions(type);

-- ── Pending payments (waiting for player/admin action) ────────
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                  uuid NOT NULL REFERENCES public.profiles(id),
  team_id                     uuid NOT NULL REFERENCES public.teams(id),
  type                        text NOT NULL,   -- join_fee | matchup_fee
  amount_cents                integer NOT NULL,
  stripe_payment_intent_id    text,
  stripe_session_id           text,
  expires_at                  timestamptz NOT NULL,
  status                      text NOT NULL DEFAULT 'pending', -- pending | paid | expired | cancelled
  metadata                    jsonb NOT NULL DEFAULT '{}',
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_profile_id ON public.pending_payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status     ON public.pending_payments(status);

-- ── RLS Policies ─────────────────────────────────────────────
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payments     ENABLE ROW LEVEL SECURITY;

-- Subscriptions: team admin can read their team's subscription
CREATE POLICY "Team admin reads own subscription"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = subscriptions.team_id
        AND tm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        AND tm.role = 'admin'
    )
  );

-- Payment transactions: player reads own, admin reads team's
CREATE POLICY "Users read own transactions"
  ON public.payment_transactions FOR SELECT
  USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = payment_transactions.team_id
        AND tm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        AND tm.role = 'admin'
    )
  );

-- Pending payments: player reads own
CREATE POLICY "Players read own pending payments"
  ON public.pending_payments FOR SELECT
  USING (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Service role has full access (edge functions use service role)
CREATE POLICY "Service role full access subscriptions"
  ON public.subscriptions FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

CREATE POLICY "Service role full access transactions"
  ON public.payment_transactions FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

CREATE POLICY "Service role full access pending"
  ON public.pending_payments FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- ── Helper: expire stale pending payments ────────────────────
CREATE OR REPLACE FUNCTION public.expire_pending_payments()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.pending_payments
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$;

-- ── View: team payment status (for frontend gate) ─────────────
CREATE OR REPLACE VIEW public.team_payment_status AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.subscription_status,
  t.subscription_plan,
  t.subscription_trial_end,
  t.subscription_period_end,
  CASE
    WHEN t.subscription_status IN ('active', 'trialing') THEN true
    WHEN t.subscription_status = 'readonly'              THEN true  -- can view
    ELSE false
  END AS can_access,
  CASE
    WHEN t.subscription_status IN ('active', 'trialing') THEN true
    ELSE false
  END AS can_create
FROM public.teams t;
