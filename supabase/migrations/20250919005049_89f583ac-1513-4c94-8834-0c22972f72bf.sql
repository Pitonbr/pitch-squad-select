-- Add indexes for performance and security
CREATE INDEX idx_sms_verification_codes_phone_created ON public.sms_verification_codes(phone, created_at);
CREATE INDEX idx_sms_verification_codes_expires_at ON public.sms_verification_codes(expires_at) WHERE NOT verified;

-- Create trigger to auto-cleanup expired codes every hour
CREATE OR REPLACE FUNCTION public.auto_cleanup_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete codes older than 24 hours regardless of status
  DELETE FROM sms_verification_codes 
  WHERE created_at < (now() - INTERVAL '24 hours');
  
  -- Delete expired and verified codes
  DELETE FROM sms_verification_codes 
  WHERE expires_at < now() OR verified = true;
END;
$$;

-- Improve phone masking function with better security
CREATE OR REPLACE FUNCTION public.mask_phone_number(_phone text, _team_id uuid, _requesting_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the requesting user is a team admin or treasurer, return full phone number
  IF has_financial_admin_access(_requesting_user_id, _team_id) THEN
    RETURN _phone;
  END IF;
  
  -- Otherwise, mask the phone number more securely
  IF _phone IS NULL OR length(_phone) < 8 THEN
    RETURN '***-***-****';
  END IF;
  
  -- Show country code and last 2 digits only
  RETURN substring(_phone, 1, 3) || '***-***-' || right(_phone, 2);
END;
$$;

-- Add better audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operation(_action text, _details jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    profile_id,
    action,
    resource_type,
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
    _action,
    'security_event',
    _details,
    inet_client_addr()
  );
END;
$$;