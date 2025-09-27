-- Add checkin deadline field to games table
ALTER TABLE public.games ADD COLUMN checkin_deadline_minutes INTEGER DEFAULT 30;

-- Add invite_link field to games table for sharing
ALTER TABLE public.games ADD COLUMN invite_link TEXT;

-- Update games table comment
COMMENT ON COLUMN public.games.checkin_deadline_minutes IS 'Minutes before game start when check-in closes (1-59)';
COMMENT ON COLUMN public.games.invite_link IS 'Unique invite link for the game';