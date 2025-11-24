-- Enhance game_participants table for improved invite system
-- Add columns to track check-in time, invite time, and profile_id for non-team members

-- Add new columns to game_participants
ALTER TABLE public.game_participants 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_participants_profile_id 
ON public.game_participants(profile_id);

CREATE INDEX IF NOT EXISTS idx_game_participants_checked_in_at 
ON public.game_participants(checked_in_at);

-- Drop existing policies if they exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Users can check themselves in" ON public.game_participants;
DROP POLICY IF EXISTS "Users can update their own check-in" ON public.game_participants;
DROP POLICY IF EXISTS "Users can view game participants" ON public.game_participants;

-- Update RLS policies to allow users to check themselves in
CREATE POLICY "Users can check themselves in"
ON public.game_participants
FOR INSERT
WITH CHECK (
  profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own check-in"
ON public.game_participants
FOR UPDATE
USING (
  profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Allow users to view participants for games they're invited to
CREATE POLICY "Users can view game participants"
ON public.game_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_participants.game_id 
    AND is_team_member(auth.uid(), g.team_id)
  )
  OR profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

COMMENT ON COLUMN public.game_participants.checked_in_at IS 'Timestamp when the player confirmed their participation';
COMMENT ON COLUMN public.game_participants.invited_at IS 'Timestamp when the player was invited to the game';
COMMENT ON COLUMN public.game_participants.profile_id IS 'Profile ID for users who check-in before being added as team players';