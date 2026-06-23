-- ============================================================
-- Corrige bug pré-existente: update_player_stats_on_event() referenciava
-- NEW.player_id/NEW.game_id incondicionalmente, mas em DELETE o registro
-- NEW é nulo — isso quebrava a remoção de eventos de partida (botão
-- "remover" em RefereeControls) com erro de NOT NULL constraint.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_player_stats_on_event()
RETURNS TRIGGER AS $$
DECLARE
  _team_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT team_id INTO _team_id FROM public.games WHERE id = NEW.game_id;

    INSERT INTO public.player_statistics (player_id, team_id)
    VALUES (NEW.player_id, _team_id)
    ON CONFLICT (player_id, team_id) DO NOTHING;

    UPDATE public.player_statistics
    SET
      goals = goals + CASE WHEN NEW.event_type = 'goal' THEN 1 ELSE 0 END,
      assists = assists + CASE WHEN NEW.event_type = 'assist' THEN 1 ELSE 0 END,
      yellow_cards = yellow_cards + CASE WHEN NEW.event_type = 'yellow_card' THEN 1 ELSE 0 END,
      red_cards = red_cards + CASE WHEN NEW.event_type = 'red_card' THEN 1 ELSE 0 END,
      tackles = tackles + CASE WHEN NEW.event_type = 'tackle' THEN 1 ELSE 0 END,
      saves = saves + CASE WHEN NEW.event_type = 'save' THEN 1 ELSE 0 END,
      fouls = fouls + CASE WHEN NEW.event_type = 'foul' THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE player_id = NEW.player_id AND team_id = _team_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT team_id INTO _team_id FROM public.games WHERE id = OLD.game_id;

    UPDATE public.player_statistics
    SET
      goals = goals - CASE WHEN OLD.event_type = 'goal' THEN 1 ELSE 0 END,
      assists = assists - CASE WHEN OLD.event_type = 'assist' THEN 1 ELSE 0 END,
      yellow_cards = yellow_cards - CASE WHEN OLD.event_type = 'yellow_card' THEN 1 ELSE 0 END,
      red_cards = red_cards - CASE WHEN OLD.event_type = 'red_card' THEN 1 ELSE 0 END,
      tackles = tackles - CASE WHEN OLD.event_type = 'tackle' THEN 1 ELSE 0 END,
      saves = saves - CASE WHEN OLD.event_type = 'save' THEN 1 ELSE 0 END,
      fouls = fouls - CASE WHEN OLD.event_type = 'foul' THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE player_id = OLD.player_id AND team_id = _team_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
