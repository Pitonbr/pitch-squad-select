-- Create game_notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.game_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'game_finished',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_notification_type CHECK (notification_type IN ('game_finished', 'game_cancelled', 'mvp_voting', 'other'))
);

-- Create index for faster queries
CREATE INDEX idx_game_notifications_team_id ON public.game_notifications(team_id);
CREATE INDEX idx_game_notifications_game_id ON public.game_notifications(game_id);
CREATE INDEX idx_game_notifications_created_at ON public.game_notifications(created_at DESC);

-- Create notification_reads table to track which users have read notifications
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.game_notifications(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(notification_id, profile_id)
);

CREATE INDEX idx_notification_reads_profile_id ON public.notification_reads(profile_id);
CREATE INDEX idx_notification_reads_notification_id ON public.notification_reads(notification_id);

-- Enable RLS
ALTER TABLE public.game_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_notifications
CREATE POLICY "Team members can view team notifications"
  ON public.game_notifications
  FOR SELECT
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can create notifications"
  ON public.game_notifications
  FOR INSERT
  WITH CHECK (is_team_admin(auth.uid(), team_id));

-- RLS Policies for notification_reads
CREATE POLICY "Users can view their own notification reads"
  ON public.notification_reads
  FOR SELECT
  USING (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can mark notifications as read"
  ON public.notification_reads
  FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_reads;