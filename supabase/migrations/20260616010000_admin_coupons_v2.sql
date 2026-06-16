-- ============================================================
-- Admin Fase 3: expandir promo_codes com campos Stripe
-- e adicionar RLS via is_master_admin()
-- ============================================================

-- ── Campos Stripe em promo_codes ──────────────────────────────
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS stripe_coupon_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_promo_id  text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description      text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_promo_codes_stripe_coupon
  ON public.promo_codes(stripe_coupon_id) WHERE stripe_coupon_id IS NOT NULL;

-- ── Substituir política fraca por is_master_admin() ──────────
DROP POLICY IF EXISTS "Service role full access promo_codes"     ON public.promo_codes;
DROP POLICY IF EXISTS "Service role full access promo_code_uses" ON public.promo_code_uses;

CREATE POLICY "Master admin full access promo_codes"
  ON public.promo_codes FOR ALL
  USING (public.is_master_admin());

CREATE POLICY "Master admin full access promo_code_uses"
  ON public.promo_code_uses FOR ALL
  USING (public.is_master_admin());

-- ── Função: listar cupons para o painel admin ─────────────────
CREATE OR REPLACE FUNCTION public.get_admin_promo_codes()
RETURNS TABLE(
  id              uuid,
  code            text,
  description     text,
  type            text,
  value           integer,
  max_uses        integer,
  used_count      integer,
  expires_at      timestamptz,
  is_active       boolean,
  stripe_coupon_id text,
  stripe_promo_id  text,
  created_at      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, code, description, type, value, max_uses, used_count,
    expires_at, is_active, stripe_coupon_id, stripe_promo_id, created_at
  FROM public.promo_codes
  WHERE public.is_master_admin()
  ORDER BY created_at DESC;
$$;

-- ── Função: estatísticas de uso de cupons ────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_coupon_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_codes',   (SELECT COUNT(*) FROM public.promo_codes WHERE public.is_master_admin()),
    'active_codes',  (SELECT COUNT(*) FROM public.promo_codes WHERE is_active = true AND public.is_master_admin()),
    'total_uses',    (SELECT COALESCE(SUM(used_count), 0) FROM public.promo_codes WHERE public.is_master_admin()),
    'expired_codes', (SELECT COUNT(*) FROM public.promo_codes
                      WHERE expires_at IS NOT NULL AND expires_at < now() AND public.is_master_admin())
  )
  WHERE public.is_master_admin();
$$;
