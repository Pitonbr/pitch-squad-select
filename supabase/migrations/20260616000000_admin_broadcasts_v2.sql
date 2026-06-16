-- ============================================================
-- Admin Fase 2: expandir admin_broadcasts + system_alerts
-- ============================================================

-- ── Expandir admin_broadcasts ─────────────────────────────────
ALTER TABLE public.admin_broadcasts
  ADD COLUMN IF NOT EXISTS channels        text[]  NOT NULL DEFAULT '{email}',
  ADD COLUMN IF NOT EXISTS status          text    NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS recipient_count integer          DEFAULT 0;

ALTER TABLE public.admin_broadcasts
  DROP CONSTRAINT IF EXISTS admin_broadcasts_status_check;

ALTER TABLE public.admin_broadcasts
  ADD CONSTRAINT admin_broadcasts_status_check
  CHECK (status IN ('draft', 'sending', 'sent', 'failed'));

-- Remover políticas fracas (qualquer auth.uid pode inserir/ler)
DROP POLICY IF EXISTS "Authenticated read broadcasts"  ON public.admin_broadcasts;
DROP POLICY IF EXISTS "Authenticated insert broadcasts" ON public.admin_broadcasts;

-- Apenas master admin gerencia broadcasts
CREATE POLICY "Master admin full access broadcasts"
  ON public.admin_broadcasts FOR ALL
  USING (public.is_master_admin());

-- Usuários autenticados lêem comunicados já enviados (para exibição futura in-app)
CREATE POLICY "Authenticated read sent broadcasts"
  ON public.admin_broadcasts FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'sent');

-- ── system_alerts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  message     text        NOT NULL,
  type        text        NOT NULL DEFAULT 'info',
  is_active   boolean     NOT NULL DEFAULT true,
  starts_at   timestamptz DEFAULT NULL,
  ends_at     timestamptz DEFAULT NULL,
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_alerts_type_check CHECK (type IN ('info','warning','error','success'))
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_active
  ON public.system_alerts(is_active, starts_at, ends_at);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Master admin gerencia todos os alertas
CREATE POLICY "Master admin full access system_alerts"
  ON public.system_alerts FOR ALL
  USING (public.is_master_admin());

-- Usuários autenticados lêem alertas ativos dentro do período
CREATE POLICY "Authenticated read active system_alerts"
  ON public.system_alerts FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
  );

-- ── Função: lista de comunicados para o admin ─────────────────
CREATE OR REPLACE FUNCTION public.get_admin_broadcasts(
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id              uuid,
  title           text,
  message         text,
  target          text,
  channels        text[],
  status          text,
  recipient_count integer,
  sent_at         timestamptz,
  created_at      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, title, message, target, channels, status, recipient_count, sent_at, created_at
  FROM public.admin_broadcasts
  WHERE public.is_master_admin()
  ORDER BY created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- ── Função: lista de alertas do sistema para o admin ──────────
CREATE OR REPLACE FUNCTION public.get_admin_system_alerts()
RETURNS TABLE(
  id        uuid,
  title     text,
  message   text,
  type      text,
  is_active boolean,
  starts_at timestamptz,
  ends_at   timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, message, type, is_active, starts_at, ends_at, created_at
  FROM public.system_alerts
  WHERE public.is_master_admin()
  ORDER BY created_at DESC;
$$;
