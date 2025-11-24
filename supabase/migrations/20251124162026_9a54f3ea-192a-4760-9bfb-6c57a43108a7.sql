-- Create password reset rate limiting table
CREATE TABLE IF NOT EXISTS public.password_reset_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_email ON public.password_reset_rate_limits(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_ip ON public.password_reset_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_window ON public.password_reset_rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.password_reset_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access for users (only via edge function)
CREATE POLICY "No direct access" ON public.password_reset_rate_limits
  FOR ALL USING (false);

-- Function to cleanup old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_password_reset_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_rate_limits
  WHERE created_at < (now() - INTERVAL '24 hours');
END;
$$;

-- Create cron job to run cleanup daily (requires pg_cron extension)
-- Note: This will be executed by Supabase's scheduled functions if pg_cron is enabled
COMMENT ON FUNCTION public.cleanup_password_reset_rate_limits() IS 'Scheduled to run daily to cleanup old password reset rate limit records';