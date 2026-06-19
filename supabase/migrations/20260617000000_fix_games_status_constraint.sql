-- ============================================================
-- Corrige constraint de status em games: o código da aplicação
-- (useMatchControl.startMatch/endHalf e mark_unrealized_games)
-- grava 'in_progress' e 'not_realized', mas a constraint só
-- permitia ('scheduled', 'live', 'finished', 'cancelled').
-- Isso bloqueava o início de partidas ao vivo em produção.
-- ============================================================

ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_status_check;

ALTER TABLE public.games ADD CONSTRAINT games_status_check
  CHECK (status IN ('scheduled', 'live', 'in_progress', 'finished', 'cancelled', 'not_realized'));
