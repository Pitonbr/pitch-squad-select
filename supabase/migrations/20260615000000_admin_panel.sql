-- ============================================================
-- Admin panel: adicionar campos de controle em profiles
-- e função de listagem de usuários para o painel admin
-- ============================================================

-- ── Campos admin em profiles ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_notes text        DEFAULT NULL;

-- ── Política: master admin pode atualizar qualquer perfil ────
CREATE POLICY "Master admin update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_master_admin());

-- ── Política: master admin pode ler todos os perfis ──────────
CREATE POLICY "Master admin select all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_master_admin());

-- ── Função: lista de usuários para o painel admin ────────────
-- SECURITY DEFINER para acessar auth.users (dados de email,
-- last_sign_in_at etc. que ficam fora de public.*)
CREATE OR REPLACE FUNCTION public.get_admin_user_list(
  p_search  text    DEFAULT NULL,
  p_limit   integer DEFAULT 50,
  p_offset  integer DEFAULT 0
)
RETURNS TABLE(
  user_id         uuid,
  email           text,
  created_at      timestamptz,
  last_sign_in_at timestamptz,
  display_name    text,
  phone           text,
  blocked_at      timestamptz,
  admin_notes     text,
  teams_count     bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id                  AS user_id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    p.display_name,
    p.phone,
    p.blocked_at,
    p.admin_notes,
    COALESCE(t.cnt, 0)   AS teams_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN (
    SELECT admin_id, COUNT(*) AS cnt
    FROM public.teams
    GROUP BY admin_id
  ) t ON t.admin_id = u.id
  WHERE
    public.is_master_admin()
    AND (
      p_search IS NULL
      OR u.email ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    )
  ORDER BY u.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- ── Função: contagem de usuários (para paginação) ────────────
CREATE OR REPLACE FUNCTION public.get_admin_user_count(p_search text DEFAULT NULL)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE
    public.is_master_admin()
    AND (
      p_search IS NULL
      OR u.email ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    );
$$;

-- ── KPIs: função de resumo para o dashboard admin ───────────
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_users',        (SELECT COUNT(*) FROM auth.users),
    'active_teams',       (SELECT COUNT(*) FROM public.teams),
    'games_last_30d',     (
      SELECT COUNT(*) FROM public.games
      WHERE created_at >= now() - interval '30 days'
    ),
    'broadcasts_sent',    (
      SELECT COUNT(*) FROM public.admin_broadcasts
      WHERE sent_at IS NOT NULL
    ),
    'blocked_users',      (
      SELECT COUNT(*) FROM public.profiles
      WHERE blocked_at IS NOT NULL
    ),
    'new_users_7d',       (
      SELECT COUNT(*) FROM auth.users
      WHERE created_at >= now() - interval '7 days'
    )
  )
  WHERE public.is_master_admin();
$$;
