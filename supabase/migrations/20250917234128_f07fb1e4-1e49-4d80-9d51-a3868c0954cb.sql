-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID NOT NULL,
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('single_elimination', 'round_robin')),
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament participants table
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  player_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- Create tournament matches table
CREATE TABLE public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID NOT NULL,
  player2_id UUID,
  scheduled_date DATE,
  scheduled_time TIME,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  score1 INTEGER DEFAULT 0,
  score2 INTEGER DEFAULT 0,
  winner_id UUID,
  is_return_leg BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments table
CREATE POLICY "Team members can view tournaments" 
ON public.tournaments 
FOR SELECT 
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage tournaments" 
ON public.tournaments 
FOR ALL 
USING (is_team_admin(auth.uid(), team_id));

-- RLS Policies for tournament_participants table
CREATE POLICY "Team members can view tournament participants" 
ON public.tournament_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tournaments t 
  WHERE t.id = tournament_id AND is_team_member(auth.uid(), t.team_id)
));

CREATE POLICY "Team admins can manage tournament participants" 
ON public.tournament_participants 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM tournaments t 
  WHERE t.id = tournament_id AND is_team_admin(auth.uid(), t.team_id)
));

-- RLS Policies for tournament_matches table
CREATE POLICY "Team members can view tournament matches" 
ON public.tournament_matches 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tournaments t 
  WHERE t.id = tournament_id AND is_team_member(auth.uid(), t.team_id)
));

CREATE POLICY "Team admins can manage tournament matches" 
ON public.tournament_matches 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM tournaments t 
  WHERE t.id = tournament_id AND is_team_admin(auth.uid(), t.team_id)
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_matches_updated_at
BEFORE UPDATE ON public.tournament_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();