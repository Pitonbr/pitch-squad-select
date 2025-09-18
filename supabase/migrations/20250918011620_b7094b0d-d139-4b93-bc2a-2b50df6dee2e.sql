-- Extend games table with referee and match control fields
ALTER TABLE public.games 
ADD COLUMN referee_id uuid REFERENCES public.players(id),
ADD COLUMN match_time_started timestamp with time zone,
ADD COLUMN match_time_paused timestamp with time zone,
ADD COLUMN current_half integer DEFAULT 1 CHECK (current_half IN (1, 2)),
ADD COLUMN home_score integer DEFAULT 0,
ADD COLUMN away_score integer DEFAULT 0,
ADD COLUMN match_duration_minutes integer DEFAULT 0,
ADD COLUMN is_match_active boolean DEFAULT false;

-- Create match_events table for all game events
CREATE TABLE public.match_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id),
  event_type text NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'tackle', 'save', 'foul', 'offside')),
  minute integer NOT NULL DEFAULT 0,
  description text,
  team_side text CHECK (team_side IN ('home', 'away')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.players(id)
);

-- Create match_lineups table for team formations
CREATE TABLE public.match_lineups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  team_side text NOT NULL CHECK (team_side IN ('home', 'away')),
  player_id uuid NOT NULL REFERENCES public.players(id),
  position text NOT NULL,
  is_starter boolean DEFAULT true,
  substituted_at integer,
  substituted_by uuid REFERENCES public.players(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(game_id, team_side, player_id)
);

-- Create player_statistics table for accumulated stats
CREATE TABLE public.player_statistics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  goals integer DEFAULT 0,
  assists integer DEFAULT 0,
  yellow_cards integer DEFAULT 0,
  red_cards integer DEFAULT 0,
  tackles integer DEFAULT 0,
  saves integer DEFAULT 0,
  fouls integer DEFAULT 0,
  games_played integer DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(player_id, team_id)
);

-- Enable RLS on new tables
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;

-- RLS policies for match_events
CREATE POLICY "Team members can view match events" 
ON public.match_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.games g 
  WHERE g.id = match_events.game_id 
  AND is_team_member(auth.uid(), g.team_id)
));

CREATE POLICY "Referees and admins can manage match events" 
ON public.match_events 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.games g 
  WHERE g.id = match_events.game_id 
  AND (is_team_admin(auth.uid(), g.team_id) OR g.referee_id IN (
    SELECT p.id FROM public.players p 
    JOIN public.profiles pr ON p.profile_id = pr.id 
    WHERE pr.user_id = auth.uid()
  ))
));

-- RLS policies for match_lineups
CREATE POLICY "Team members can view lineups" 
ON public.match_lineups 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.games g 
  WHERE g.id = match_lineups.game_id 
  AND is_team_member(auth.uid(), g.team_id)
));

CREATE POLICY "Referees and admins can manage lineups" 
ON public.match_lineups 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.games g 
  WHERE g.id = match_lineups.game_id 
  AND (is_team_admin(auth.uid(), g.team_id) OR g.referee_id IN (
    SELECT p.id FROM public.players p 
    JOIN public.profiles pr ON p.profile_id = pr.id 
    WHERE pr.user_id = auth.uid()
  ))
));

-- RLS policies for player_statistics
CREATE POLICY "Team members can view statistics" 
ON public.player_statistics 
FOR SELECT 
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Admins can manage statistics" 
ON public.player_statistics 
FOR ALL 
USING (is_team_admin(auth.uid(), team_id));

-- Add triggers for updated_at
CREATE TRIGGER update_player_statistics_updated_at
BEFORE UPDATE ON public.player_statistics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update player statistics automatically
CREATE OR REPLACE FUNCTION public.update_player_stats_on_event()
RETURNS TRIGGER AS $$
DECLARE
  _player_stat_id uuid;
  _team_id uuid;
BEGIN
  -- Get team_id from the game
  SELECT team_id INTO _team_id 
  FROM public.games 
  WHERE id = NEW.game_id;

  -- Ensure player statistics record exists
  INSERT INTO public.player_statistics (player_id, team_id)
  VALUES (NEW.player_id, _team_id)
  ON CONFLICT (player_id, team_id) DO NOTHING;

  -- Update statistics based on event type
  IF TG_OP = 'INSERT' THEN
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

-- Create trigger for automatic statistics update
CREATE TRIGGER update_stats_on_match_event
AFTER INSERT OR DELETE ON public.match_events
FOR EACH ROW
EXECUTE FUNCTION public.update_player_stats_on_event();