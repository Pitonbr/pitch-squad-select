-- ============================================================
-- Admin Fase 5: campanhas de marketing com segmentação
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_campaigns (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  description      text        DEFAULT NULL,
  type             text        NOT NULL DEFAULT 'email',
  status           text        NOT NULL DEFAULT 'draft',
  -- Audience filter (jsonb): { "segment": "all"|"admins"|"players"|
  --   "subscription_active"|"trial"|"inactive_days"|"new_days",
  --   "days": 30 }
  audience_filter  jsonb       NOT NULL DEFAULT '{"segment":"all"}',
  subject          text        NOT NULL DEFAULT '',
  message          text        NOT NULL DEFAULT '',
  cta_url          text        DEFAULT NULL,
  cta_text         text        DEFAULT NULL,
  starts_at        timestamptz DEFAULT NULL,
  ends_at          timestamptz DEFAULT NULL,
  sent_count       integer     NOT NULL DEFAULT 0,
  click_count      integer     NOT NULL DEFAULT 0,
  created_by       uuid        REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  launched_at      timestamptz DEFAULT NULL,
  CONSTRAINT admin_campaigns_type_check
    CHECK (type IN ('email','banner','both')),
  CONSTRAINT admin_campaigns_status_check
    CHECK (status IN ('draft','scheduled','running','paused','completed','failed'))
);

CREATE INDEX IF NOT EXISTS idx_admin_campaigns_status
  ON public.admin_campaigns(status, starts_at);

ALTER TABLE public.admin_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admin full access campaigns"
  ON public.admin_campaigns FOR ALL
  USING (public.is_master_admin());

-- ── Função: listar campanhas para o admin ─────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_campaigns()
RETURNS TABLE(
  id              uuid,
  name            text,
  description     text,
  type            text,
  status          text,
  audience_filter jsonb,
  subject         text,
  message         text,
  cta_url         text,
  cta_text        text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  sent_count      integer,
  click_count     integer,
  launched_at     timestamptz,
  created_at      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, description, type, status, audience_filter, subject,
         message, cta_url, cta_text, starts_at, ends_at, sent_count,
         click_count, launched_at, created_at
  FROM public.admin_campaigns
  WHERE public.is_master_admin()
  ORDER BY created_at DESC;
$$;

-- ── Função: estatísticas de campanhas ────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_campaign_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total',      (SELECT COUNT(*) FROM public.admin_campaigns WHERE public.is_master_admin()),
    'active',     (SELECT COUNT(*) FROM public.admin_campaigns WHERE status IN ('running','scheduled') AND public.is_master_admin()),
    'completed',  (SELECT COUNT(*) FROM public.admin_campaigns WHERE status = 'completed' AND public.is_master_admin()),
    'total_sent', (SELECT COALESCE(SUM(sent_count), 0) FROM public.admin_campaigns WHERE public.is_master_admin())
  )
  WHERE public.is_master_admin();
$$;
