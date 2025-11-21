-- Drop existing SELECT policy for team members
DROP POLICY IF EXISTS "Team members can view players with protected data" ON public.players;

-- Create new restrictive SELECT policy - only admins can directly query players table
CREATE POLICY "Only team admins can directly view players"
ON public.players
FOR SELECT
USING (is_team_admin(auth.uid(), team_id));

-- Non-admin team members must use the get_team_players() function which provides masked data
COMMENT ON POLICY "Only team admins can directly view players" ON public.players IS 
'Direct SELECT restricted to admins. Non-admin team members should use get_team_players() function which masks sensitive contact information.';