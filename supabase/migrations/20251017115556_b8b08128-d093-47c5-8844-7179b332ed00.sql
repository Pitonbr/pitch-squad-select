-- Fix security warnings for increment_verification_attempts function
CREATE OR REPLACE FUNCTION public.increment_verification_attempts(verification_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.whatsapp_verification_codes 
  SET attempts = attempts + 1
  WHERE id = verification_id;
END;
$$;

-- Fix security warnings for cleanup_expired_verifications function
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.whatsapp_verification_codes
  WHERE expires_at < now() - INTERVAL '24 hours';
  
  DELETE FROM public.email_delivery_logs
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;