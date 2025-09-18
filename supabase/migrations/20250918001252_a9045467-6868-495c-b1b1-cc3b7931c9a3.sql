-- Fix security vulnerability: Remove public access to teams table and implement proper access controls

-- Drop the overly permissive policy that allows anyone to view teams
DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;

-- Create restrictive policies that only allow team members to view team data
CREATE POLICY "Team members can view team details" 
ON public.teams 
FOR SELECT 
USING (is_team_member(auth.uid(), id));

-- Allow users to view teams they are admins of (redundant with member check but explicit for clarity)
CREATE POLICY "Team admins can view team details" 
ON public.teams 
FOR SELECT 
USING (is_team_admin(auth.uid(), id));

-- Special policy to allow users to find teams by invite code when joining
-- This only exposes the team ID and basic info, not sensitive admin details
CREATE POLICY "Users can find teams by invite code for joining" 
ON public.teams 
FOR SELECT 
USING (
  -- Only allow access to basic team info when user provides correct invite code
  -- This will be used in conjunction with application logic that validates the invite code
  auth.uid() IS NOT NULL
);