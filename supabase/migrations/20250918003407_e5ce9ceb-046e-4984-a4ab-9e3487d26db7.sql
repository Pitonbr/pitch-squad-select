-- Fix security issue by removing the SECURITY DEFINER view
DROP VIEW IF EXISTS public.players_view;

-- The get_team_players function is sufficient and safer
-- No need for additional changes as the function already provides the needed functionality