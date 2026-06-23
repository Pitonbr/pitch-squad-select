-- ============================================================
-- Corrige bbq_confirmations: a policy original fazia EXISTS direto
-- em "players", mas desde a migration 20251121012121 o SELECT em
-- "players" é restrito a admins do time — então jogadores comuns
-- nunca passavam a checagem e não conseguiam confirmar presença no
-- próprio churrasco. Usamos uma função SECURITY DEFINER (mesmo
-- padrão de is_team_admin/is_team_member) para contornar a RLS de
-- "players" apenas para essa verificação pontual.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_own_player(p_player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    JOIN public.profiles pr ON pr.id = p.profile_id
    WHERE p.id = p_player_id AND pr.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Player can confirm own attendance" ON public.bbq_confirmations;
DROP POLICY IF EXISTS "Player can remove own confirmation" ON public.bbq_confirmations;

CREATE POLICY "Player can confirm own attendance" ON public.bbq_confirmations
  FOR INSERT WITH CHECK (is_own_player(player_id));
CREATE POLICY "Player can remove own confirmation" ON public.bbq_confirmations
  FOR DELETE USING (is_own_player(player_id));
