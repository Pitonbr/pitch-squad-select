-- ============================================================
-- Admin Fase 6: dashboard financeiro — custos manuais + P&L
-- ============================================================

-- ── Tabela de lançamentos de custos ──────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_cost_entries (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category     text        NOT NULL DEFAULT 'infrastructure',
  description  text        NOT NULL,
  amount_brl   numeric(10,2) NOT NULL CHECK (amount_brl >= 0),
  period_month text        NOT NULL, -- YYYY-MM
  created_by   uuid        REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_cost_entries_category_check
    CHECK (category IN ('infrastructure','marketing','tools','personnel','other'))
);

CREATE INDEX IF NOT EXISTS idx_cost_entries_period
  ON public.admin_cost_entries(period_month DESC);

ALTER TABLE public.admin_cost_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admin full access cost_entries"
  ON public.admin_cost_entries FOR ALL
  USING (public.is_master_admin());

-- ── Função: resumo de receita (últimos 12 meses) ──────────────
CREATE OR REPLACE FUNCTION public.get_admin_revenue_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    -- Receita total (pagamentos confirmados, em centavos → R$)
    'total_revenue_brl',
      ROUND(COALESCE((
        SELECT SUM(amount_cents) / 100.0
        FROM public.payment_transactions
        WHERE status = 'succeeded'
      ), 0), 2),

    -- Receita dos últimos 30 dias
    'revenue_30d_brl',
      ROUND(COALESCE((
        SELECT SUM(amount_cents) / 100.0
        FROM public.payment_transactions
        WHERE status = 'succeeded'
          AND created_at >= now() - interval '30 days'
      ), 0), 2),

    -- Assinaturas ativas
    'active_subscriptions',
      (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),

    -- Em trial
    'trialing_subscriptions',
      (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'trialing'),

    -- Canceladas (total acumulado)
    'canceled_subscriptions',
      (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'canceled'),

    -- MRR estimado (assinaturas ativas × preço médio)
    'mrr_brl',
      ROUND(COALESCE((
        SELECT SUM(
          CASE
            WHEN plan = 'annual'  THEN 646.92 / 12.0
            ELSE 59.90
          END
        )
        FROM public.subscriptions
        WHERE status = 'active'
      ), 0), 2),

    -- Receita por mês (últimos 12 meses)
    'monthly_revenue',
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'month', TO_CHAR(m.month_start, 'YYYY-MM'),
            'label', TO_CHAR(m.month_start, 'Mon/YY'),
            'revenue_brl', ROUND(COALESCE(r.revenue, 0), 2)
          ) ORDER BY m.month_start
        )
        FROM (
          SELECT generate_series(
            date_trunc('month', now() - interval '11 months'),
            date_trunc('month', now()),
            '1 month'::interval
          ) AS month_start
        ) m
        LEFT JOIN (
          SELECT
            date_trunc('month', created_at) AS month_start,
            SUM(amount_cents) / 100.0       AS revenue
          FROM public.payment_transactions
          WHERE status = 'succeeded'
            AND created_at >= now() - interval '12 months'
          GROUP BY 1
        ) r ON r.month_start = m.month_start
      ), '[]'::jsonb)
  )
  WHERE public.is_master_admin();
$$;

-- ── Função: listar lançamentos de custo ───────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_cost_entries(
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id          uuid,
  category    text,
  description text,
  amount_brl  numeric,
  period_month text,
  created_at  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, category, description, amount_brl, period_month, created_at
  FROM public.admin_cost_entries
  WHERE public.is_master_admin()
  ORDER BY period_month DESC, created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- ── Função: P&L por mês (últimos 12 meses) ───────────────────
CREATE OR REPLACE FUNCTION public.get_admin_pl_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pl_by_month',
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'month',        m.period,
            'label',        TO_CHAR(TO_DATE(m.period, 'YYYY-MM'), 'Mon/YY'),
            'revenue_brl',  ROUND(COALESCE(r.revenue, 0), 2),
            'costs_brl',    ROUND(COALESCE(c.costs, 0), 2),
            'net_brl',      ROUND(COALESCE(r.revenue, 0) - COALESCE(c.costs, 0), 2)
          ) ORDER BY m.period
        )
        FROM (
          SELECT TO_CHAR(generate_series(
            date_trunc('month', now() - interval '11 months'),
            date_trunc('month', now()),
            '1 month'::interval
          ), 'YYYY-MM') AS period
        ) m
        LEFT JOIN (
          SELECT
            TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS period,
            SUM(amount_cents) / 100.0 AS revenue
          FROM public.payment_transactions
          WHERE status = 'succeeded'
          GROUP BY 1
        ) r ON r.period = m.period
        LEFT JOIN (
          SELECT period_month AS period, SUM(amount_brl) AS costs
          FROM public.admin_cost_entries
          GROUP BY 1
        ) c ON c.period = m.period
      ), '[]'::jsonb),

    -- Totais do período
    'total_revenue_brl',
      ROUND(COALESCE((
        SELECT SUM(amount_cents) / 100.0
        FROM public.payment_transactions
        WHERE status = 'succeeded'
          AND created_at >= now() - interval '12 months'
      ), 0), 2),
    'total_costs_brl',
      ROUND(COALESCE((
        SELECT SUM(amount_brl)
        FROM public.admin_cost_entries
        WHERE period_month >= TO_CHAR(now() - interval '12 months', 'YYYY-MM')
      ), 0), 2)
  )
  WHERE public.is_master_admin();
$$;
