-- ============================================================
-- 1.4 — Placar ao Vivo: nomes e cores de time customizáveis por
-- partida, e assistência vinculada diretamente ao evento de gol
-- (para o feed combinado "⚽ X marcou! Assistência de Y — 30'").
-- ============================================================

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS home_team_name  text NOT NULL DEFAULT 'Time Casa',
  ADD COLUMN IF NOT EXISTS away_team_name  text NOT NULL DEFAULT 'Time Visitante',
  ADD COLUMN IF NOT EXISTS home_team_color text NOT NULL DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS away_team_color text NOT NULL DEFAULT '#ef4444';

ALTER TABLE public.match_events
  ADD COLUMN IF NOT EXISTS assist_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL;
