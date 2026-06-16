-- ============================================================
-- Admin Fase 4: banners publicitários in-app
-- ============================================================

-- ── Bucket de imagens de banners ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-banners',
  'admin-banners',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Apenas master admin pode fazer upload/delete
DO $$ BEGIN
  CREATE POLICY "Master admin manage banner images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'admin-banners' AND public.is_master_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Qualquer pessoa (incluindo anon) pode ler imagens de banners
DO $$ BEGIN
  CREATE POLICY "Public read banner images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'admin-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabela admin_banners ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_banners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  image_url    text        NOT NULL,
  link_url     text        DEFAULT NULL,
  link_text    text        DEFAULT NULL,
  target       text        NOT NULL DEFAULT 'all',
  is_active    boolean     NOT NULL DEFAULT true,
  starts_at    timestamptz DEFAULT NULL,
  ends_at      timestamptz DEFAULT NULL,
  impressions  integer     NOT NULL DEFAULT 0,
  clicks       integer     NOT NULL DEFAULT 0,
  created_by   uuid        REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_banners_target_check
    CHECK (target IN ('all','dashboard','games','teams','financial'))
);

CREATE INDEX IF NOT EXISTS idx_admin_banners_active
  ON public.admin_banners(is_active, target, starts_at, ends_at);

ALTER TABLE public.admin_banners ENABLE ROW LEVEL SECURITY;

-- Master admin gerencia tudo
CREATE POLICY "Master admin full access banners"
  ON public.admin_banners FOR ALL
  USING (public.is_master_admin());

-- Usuários autenticados lêem banners ativos dentro do período
CREATE POLICY "Authenticated read active banners"
  ON public.admin_banners FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
  );

-- ── Função: registrar evento (impressão / clique) ─────────────
CREATE OR REPLACE FUNCTION public.track_banner_event(
  p_banner_id uuid,
  p_event     text   -- 'impression' | 'click'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.admin_banners
  SET
    impressions = CASE WHEN p_event = 'impression' THEN impressions + 1 ELSE impressions END,
    clicks      = CASE WHEN p_event = 'click'      THEN clicks + 1      ELSE clicks      END
  WHERE id = p_banner_id
    AND is_active = true
    AND auth.uid() IS NOT NULL;
$$;

-- ── Função: listar banners para o admin ───────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_banners()
RETURNS TABLE(
  id          uuid,
  title       text,
  image_url   text,
  link_url    text,
  link_text   text,
  target      text,
  is_active   boolean,
  starts_at   timestamptz,
  ends_at     timestamptz,
  impressions integer,
  clicks      integer,
  created_at  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, image_url, link_url, link_text, target,
         is_active, starts_at, ends_at, impressions, clicks, created_at
  FROM public.admin_banners
  WHERE public.is_master_admin()
  ORDER BY created_at DESC;
$$;

-- ── Função: banners ativos para um destino específico ─────────
CREATE OR REPLACE FUNCTION public.get_active_banners(p_target text DEFAULT 'all')
RETURNS TABLE(
  id        uuid,
  title     text,
  image_url text,
  link_url  text,
  link_text text,
  target    text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, image_url, link_url, link_text, target
  FROM public.admin_banners
  WHERE is_active = true
    AND (target = 'all' OR target = p_target)
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
    AND auth.uid() IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 3;
$$;
