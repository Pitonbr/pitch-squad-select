-- Only create missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_email_domain ON public.email_delivery_logs(email_domain);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_delivery_status ON public.email_delivery_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_created_at ON public.email_delivery_logs(created_at);

-- Recreate the stats function with corrected syntax
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