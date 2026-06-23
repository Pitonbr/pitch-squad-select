-- ============================================================
-- Item 1.8: Log de Atividades visível ao jogador comum
-- audit_logs não tinha team_id (a política de leitura era admin-only
-- e nem filtrava por time). Agora derivamos team_id automaticamente
-- a partir do recurso logado, e liberamos a leitura para qualquer
-- membro do time (não só admin). Também passamos a logar jogos e
-- convocações/confirmações de jogo, que hoje não geram nenhum registro.
-- ============================================================

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id);

CREATE OR REPLACE FUNCTION public.create_audit_log(
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
  _team_id uuid;
BEGIN
  SELECT id INTO _profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();

  _team_id := CASE
    WHEN _resource_type = 'teams' THEN _resource_id
    WHEN COALESCE(_new_values, _old_values) ? 'team_id' THEN
      COALESCE((_new_values->>'team_id')::uuid, (_old_values->>'team_id')::uuid)
    WHEN _resource_type = 'game_participants' AND COALESCE(_new_values, _old_values) ? 'game_id' THEN
      (SELECT g.team_id FROM public.games g
       WHERE g.id = COALESCE((_new_values->>'game_id')::uuid, (_old_values->>'game_id')::uuid))
    ELSE NULL
  END;

  INSERT INTO public.audit_logs (
    user_id,
    profile_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    team_id
  ) VALUES (
    auth.uid(),
    _profile_id,
    _action,
    _resource_type,
    _resource_id,
    _old_values,
    _new_values,
    _team_id
  );
END;
$$;

-- ── Passa a logar criação/edição/remoção de jogos e de
-- convocações/confirmações de presença (game_participants) ──────
CREATE TRIGGER games_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER game_participants_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.game_participants
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- ── Libera leitura para qualquer membro do time (não só admin) ──
DROP POLICY IF EXISTS "Team admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Team members can view team activity log"
ON public.audit_logs
FOR SELECT
USING (
  (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
  OR auth.uid() = audit_logs.user_id
);
