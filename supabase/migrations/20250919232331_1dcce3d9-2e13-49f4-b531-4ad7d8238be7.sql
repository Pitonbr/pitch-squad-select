-- Create a table to track email delivery issues
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  email_domain TEXT NOT NULL,
  delivery_status TEXT NOT NULL, -- 'sent', 'failed', 'bounced', 'delivered'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  email_provider TEXT, -- 'resend', 'supabase-default'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email delivery logs (admin access only)
CREATE POLICY "Only admins can view email delivery logs" 
ON public.email_delivery_logs 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create index for better performance
CREATE INDEX idx_email_delivery_logs_email_domain ON public.email_delivery_logs(email_domain);
CREATE INDEX idx_email_delivery_logs_delivery_status ON public.email_delivery_logs(delivery_status);
CREATE INDEX idx_email_delivery_logs_created_at ON public.email_delivery_logs(created_at);

-- Create function to log email delivery attempts
CREATE OR REPLACE FUNCTION public.log_email_delivery(
  _user_id UUID,
  _email_address TEXT,
  _delivery_status TEXT,
  _error_message TEXT DEFAULT NULL,
  _retry_count INTEGER DEFAULT 0,
  _email_provider TEXT DEFAULT 'resend'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email_domain TEXT;
  _log_id UUID;
BEGIN
  -- Extract domain from email
  _email_domain := split_part(_email_address, '@', 2);
  
  -- Insert log entry
  INSERT INTO public.email_delivery_logs (
    user_id,
    email_address,
    email_domain,
    delivery_status,
    error_message,
    retry_count,
    email_provider
  ) VALUES (
    _user_id,
    _email_address,
    _email_domain,
    _delivery_status,
    _error_message,
    _retry_count,
    _email_provider
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_email_delivery_logs_updated_at
BEFORE UPDATE ON public.email_delivery_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get email delivery stats by domain
CREATE OR REPLACE FUNCTION public.get_email_delivery_stats(
  _days_back INTEGER DEFAULT 7
) RETURNS TABLE(
  email_domain TEXT,
  total_attempts BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  success_rate NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    edl.email_domain,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN edl.delivery_status = 'sent' THEN 1 END) as successful_deliveries,
    COUNT(CASE WHEN edl.delivery_status = 'failed' THEN 1 END) as failed_deliveries,
    ROUND(
      (COUNT(CASE WHEN edl.delivery_status = 'sent' THEN 1 END) * 100.0) / 
      NULLIF(COUNT(*), 0), 
      2
    ) as success_rate
  FROM public.email_delivery_logs edl
  WHERE edl.created_at >= (now() - (_days_back || ' days')::INTERVAL)
  GROUP BY edl.email_domain
  ORDER BY total_attempts DESC;
END;
$$;