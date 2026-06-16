-- ============================================================
-- Admin Gestores: sistema de roles para painel administrativo
-- ============================================================

-- ── Tabela de gestores do painel admin ───────────────────────
CREATE TABLE IF NOT EXISTS public.admin_managers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text        NOT NULL UNIQUE,
  full_name    text        NOT NULL DEFAULT '',
  role         text        NOT NULL DEFAULT 'admin',
  is_active    boolean     NOT NULL DEFAULT true,
  notes        text        DEFAULT NULL,
  granted_by   uuid        REFERENCES auth.users(id),
  granted_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_managers_role_check
    CHECK (role IN ('master_admin', 'admin', 'viewer'))
);

CREATE INDEX IF NOT EXISTS idx_admin_managers_user_id
  ON public.admin_managers(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_managers_email
  ON public.admin_managers(email);

ALTER TABLE public.admin_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admin full access admin_managers"
  ON public.admin_managers FOR ALL
  USING (public.is_master_admin());

-- ── Seed: inserir Alex Piton como master_admin ───────────────
INSERT INTO public.admin_managers (user_id, email, full_name, role, notes)
VALUES (
  '72acb776-c076-4960-b1f6-0d4351055b65',
  'alexpiton@gmail.com',
  'Alex Piton',
  'master_admin',
  'Gestor master — proprietário da plataforma'
)
ON CONFLICT (email) DO UPDATE
  SET role = 'master_admin', is_active = true, full_name = 'Alex Piton';

-- ── Atualizar is_master_admin() para checar a tabela ─────────
-- Mantém fallback pelo email hardcoded para bootstrap.
-- Quando o admin está na tabela como master_admin, também é reconhecido.
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND (
      -- Fallback de bootstrap (nunca removível)
      u.email = 'alexpiton@gmail.com'
      -- Registro formal na tabela de gestores
      OR EXISTS (
        SELECT 1 FROM public.admin_managers am
        WHERE am.user_id = u.id
          AND am.role = 'master_admin'
          AND am.is_active = true
      )
    )
  );
$$;

-- ── Função: verificar se é qualquer gestor ativo ─────────────
CREATE OR REPLACE FUNCTION public.is_panel_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND (
      u.email = 'alexpiton@gmail.com'
      OR EXISTS (
        SELECT 1 FROM public.admin_managers am
        WHERE am.user_id = u.id AND am.is_active = true
      )
    )
  );
$$;

-- ── Função: retornar role do usuário atual ───────────────────
CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT am.role
      FROM public.admin_managers am
      JOIN auth.users u ON u.id = am.user_id
      WHERE u.id = auth.uid() AND am.is_active = true
      LIMIT 1
    ),
    CASE
      WHEN EXISTS (
        SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'alexpiton@gmail.com'
      ) THEN 'master_admin'
      ELSE NULL
    END
  );
$$;

-- ── Função: listar gestores do painel ────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_managers()
RETURNS TABLE(
  id           uuid,
  user_id      uuid,
  email        text,
  full_name    text,
  role         text,
  is_active    boolean,
  notes        text,
  granted_at   timestamptz,
  updated_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    am.id, am.user_id, am.email, am.full_name,
    am.role, am.is_active, am.notes,
    am.granted_at, am.updated_at
  FROM public.admin_managers am
  WHERE public.is_master_admin()
  ORDER BY
    CASE am.role WHEN 'master_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    am.granted_at;
$$;

-- ── Função: convidar/criar gestor ────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_admin_manager(
  p_email     text,
  p_full_name text,
  p_role      text DEFAULT 'admin',
  p_notes     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_manager_id uuid;
BEGIN
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Busca user_id pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  INSERT INTO public.admin_managers (user_id, email, full_name, role, notes, granted_by)
  VALUES (v_user_id, p_email, p_full_name, p_role, p_notes, auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        role       = EXCLUDED.role,
        notes      = EXCLUDED.notes,
        user_id    = EXCLUDED.user_id,
        is_active  = true,
        updated_at = now()
  RETURNING id INTO v_manager_id;

  RETURN jsonb_build_object(
    'id', v_manager_id,
    'email', p_email,
    'role', p_role,
    'user_found', v_user_id IS NOT NULL
  );
END;
$$;

-- ── Função: toggle ativo/inativo ─────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_admin_manager(
  p_manager_id uuid,
  p_active     boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.admin_managers
  SET is_active = p_active, updated_at = now()
  WHERE id = p_manager_id
    AND email != 'alexpiton@gmail.com'; -- protege o master original
END;
$$;
