-- ============================================================
-- Admin features: promo_codes, admin_broadcasts
-- Update team_challenges for dual-payment matchup flow
-- ============================================================

-- ── Promo codes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text        UNIQUE NOT NULL,
  type        text        NOT NULL DEFAULT 'free_trial',  -- free_trial | discount_percent
  value       integer     NOT NULL DEFAULT 30,            -- days or percent
  max_uses    integer     DEFAULT NULL,                   -- null = unlimited
  used_count  integer     NOT NULL DEFAULT 0,
  expires_at  timestamptz DEFAULT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_code_uses (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id    uuid        NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  team_id    uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  used_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code      ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON public.promo_codes(is_active);

ALTER TABLE public.promo_codes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Master admin (service role) has full access
CREATE POLICY "Service role full access promo_codes"
  ON public.promo_codes FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

CREATE POLICY "Service role full access promo_code_uses"
  ON public.promo_code_uses FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- Authenticated users can read active promo codes (to validate at checkout)
CREATE POLICY "Authenticated read active promo_codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- ── Admin broadcasts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  message     text        NOT NULL,
  target      text        NOT NULL DEFAULT 'all',  -- all | admins | players
  sent_at     timestamptz DEFAULT NULL,
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_created_at ON public.admin_broadcasts(created_at DESC);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access broadcasts"
  ON public.admin_broadcasts FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- Master admin can manage broadcasts (identified by email in application layer)
CREATE POLICY "Authenticated read broadcasts"
  ON public.admin_broadcasts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated insert broadcasts"
  ON public.admin_broadcasts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Update team_challenges for dual-payment flow ─────────────
-- Add columns to track individual payments
ALTER TABLE public.team_challenges
  ADD COLUMN IF NOT EXISTS challenger_paid_at  timestamptz,
  ADD COLUMN IF NOT EXISTS challenged_paid_at  timestamptz;

-- Update the status check to include new states
ALTER TABLE public.team_challenges
  DROP CONSTRAINT IF EXISTS team_challenges_status_check;

ALTER TABLE public.team_challenges
  ADD CONSTRAINT team_challenges_status_check
  CHECK (status IN ('pending','accepted','rejected','challenger_paid','challenged_paid','confirmed','cancelled'));

CREATE INDEX IF NOT EXISTS idx_team_challenges_challenger_paid ON public.team_challenges(challenger_paid_at)
  WHERE challenger_paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_challenges_challenged_paid ON public.team_challenges(challenged_paid_at)
  WHERE challenged_paid_at IS NOT NULL;
