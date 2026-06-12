-- ============================================================
-- Master admin enforcement + RLS hardening before production
-- ============================================================
-- Problem: the "master admin" concept (alexpiton@gmail.com) only
-- existed as a frontend constant in Settings.tsx. RLS policies for
-- admin_broadcasts and promo_codes only checked auth.uid() IS NOT NULL,
-- meaning ANY authenticated user could send platform-wide broadcasts
-- and read/manage promo codes via direct API calls.
-- ============================================================

-- ── Master admin check (server-side, based on email) ─────────
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'alexpiton@gmail.com'
  );
$$;

-- ── admin_broadcasts: only master admin can create broadcasts ─
DROP POLICY IF EXISTS "Authenticated insert broadcasts" ON public.admin_broadcasts;

CREATE POLICY "Master admin insert broadcasts"
  ON public.admin_broadcasts FOR INSERT
  WITH CHECK (public.is_master_admin());

-- ── promo_codes: only master admin can read/manage codes ─────
-- Previous policy leaked all active codes (and their discount
-- values/usage) to every authenticated user. Promo code redemption
-- is not yet implemented in the checkout flow, so there is no
-- legitimate need for regular users to read this table.
DROP POLICY IF EXISTS "Authenticated read active promo_codes" ON public.promo_codes;

CREATE POLICY "Master admin select promo_codes"
  ON public.promo_codes FOR SELECT
  USING (public.is_master_admin());

CREATE POLICY "Master admin insert promo_codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (public.is_master_admin());

CREATE POLICY "Master admin update promo_codes"
  ON public.promo_codes FOR UPDATE
  USING (public.is_master_admin());

CREATE POLICY "Master admin delete promo_codes"
  ON public.promo_codes FOR DELETE
  USING (public.is_master_admin());

-- promo_code_uses: master admin can read usage history
CREATE POLICY "Master admin select promo_code_uses"
  ON public.promo_code_uses FOR SELECT
  USING (public.is_master_admin());
