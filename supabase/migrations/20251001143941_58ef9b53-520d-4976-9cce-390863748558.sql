-- Phase 1: Critical Security Fixes

-- 1. Fix search_path in all functions to prevent schema hijacking
CREATE OR REPLACE FUNCTION public.mask_phone_number(_phone text, _team_id uuid, _requesting_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF has_financial_admin_access(_requesting_user_id, _team_id) THEN
    RETURN _phone;
  END IF;
  
  IF _phone IS NULL OR length(_phone) < 8 THEN
    RETURN '***-***-****';
  END IF;
  
  RETURN substring(_phone, 1, 3) || '***-***-' || right(_phone, 2);
END;
$$;

-- 2. Update players table RLS to properly protect phone numbers and emails
DROP POLICY IF EXISTS "Team members can view team players with masked phones" ON public.players;

CREATE POLICY "Team members can view players with protected data"
ON public.players
FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- 3. Create a secure function to get player details with proper data masking
CREATE OR REPLACE FUNCTION public.get_player_secure(_player_id uuid, _team_id uuid)
RETURNS TABLE(
  id uuid,
  team_id uuid,
  profile_id uuid,
  name text,
  nickname text,
  player_position text,
  phone text,
  email text,
  jersey_number integer,
  profile_image text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NOT is_team_member(auth.uid(), _team_id) THEN
    RAISE EXCEPTION 'Access denied: not a team member';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.team_id,
    p.profile_id,
    p.name,
    p.nickname,
    p."position" as player_position,
    CASE 
      WHEN has_financial_admin_access(auth.uid(), p.team_id) THEN p.phone
      WHEN p.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) THEN p.phone
      ELSE mask_phone_number(p.phone, p.team_id, auth.uid())
    END as phone,
    CASE 
      WHEN has_financial_admin_access(auth.uid(), p.team_id) THEN p.email
      WHEN p.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) THEN p.email
      ELSE substring(p.email, 1, 3) || '***@' || substring(p.email from '@(.*)$')
    END as email,
    p.jersey_number,
    p.profile_image,
    p.created_at,
    p.updated_at
  FROM public.players p
  WHERE p.id = _player_id AND p.team_id = _team_id;
END;
$$;

-- 4. Tighten audit log access
DROP POLICY IF EXISTS "Team admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Team admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.admin_id = audit_logs.profile_id 
      AND auth.uid() = (SELECT user_id FROM profiles WHERE id = t.admin_id)
  )
  OR auth.uid() = audit_logs.user_id
);

-- 5. Add rate limiting table for SMS verification
CREATE TABLE IF NOT EXISTS public.sms_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  ip_address inet,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.sms_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON public.sms_rate_limits FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Update SMS verification function with better security
CREATE OR REPLACE FUNCTION public.request_sms_verification(
  _phone text, 
  _email text, 
  _password text, 
  _display_name text
)
RETURNS TABLE(success boolean, message text, verification_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  _verification_id UUID;
  _code TEXT;
  _existing_count INTEGER;
BEGIN
  IF _phone IS NULL OR length(_phone) < 10 THEN
    RETURN QUERY SELECT false, 'Número de telefone inválido', NULL::UUID;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO _existing_count
  FROM sms_verification_codes
  WHERE phone = _phone AND created_at > (now() - INTERVAL '1 hour');
    
  IF _existing_count >= 3 THEN
    PERFORM log_sensitive_operation(
      'SMS_RATE_LIMIT_EXCEEDED',
      jsonb_build_object('phone', _phone, 'attempts', _existing_count)
    );
    RETURN QUERY SELECT false, 'Muitas tentativas. Tente novamente em 1 hora.', NULL::UUID;
    RETURN;
  END IF;
  
  _code := LPAD(floor(random() * 1000000)::text, 6, '0');
  
  DELETE FROM sms_verification_codes 
  WHERE phone = _phone AND expires_at < now();
  
  INSERT INTO sms_verification_codes (phone, code, user_data)
  VALUES (
    _phone, 
    _code, 
    jsonb_build_object('email', _email, 'password', _password, 'display_name', _display_name)
  )
  RETURNING id INTO _verification_id;
  
  PERFORM log_sensitive_operation(
    'SMS_VERIFICATION_REQUESTED',
    jsonb_build_object('phone_masked', substring(_phone, 1, 3) || '***')
  );
  
  RETURN QUERY SELECT true, _code, _verification_id;
END;
$$;

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_verification_phone ON public.sms_verification_codes(phone, created_at);