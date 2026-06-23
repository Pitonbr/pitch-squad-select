-- ============================================================
-- Restaura acesso "à própria linha" em players, removido por engano
-- pela migration 20251121012121 (que deixou SELECT e o FOR ALL de
-- INSERT/UPDATE/DELETE restritos apenas a admins do time). Isso
-- quebrava em produção: o jogador não-admin não conseguia ver suas
-- próprias estatísticas no Dashboard nem editar seu próprio perfil
-- (PlayerProfileEditor), pois nem a leitura nem a atualização da
-- própria linha eram mais permitidas.
-- Reusa is_own_player() (criada para bbq_confirmations) para evitar
-- a mesma armadilha de RLS recursiva.
-- ============================================================

CREATE POLICY "Players can view own row" ON public.players
  FOR SELECT USING (is_own_player(id));

CREATE POLICY "Players can update own row" ON public.players
  FOR UPDATE USING (is_own_player(id)) WITH CHECK (is_own_player(id));
