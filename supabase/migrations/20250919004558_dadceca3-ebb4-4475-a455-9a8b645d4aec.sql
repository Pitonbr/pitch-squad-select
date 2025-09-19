-- Create table for temporary SMS verification codes
CREATE TABLE public.sms_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  user_data JSONB NOT NULL, -- Store email, password, display_name temporarily
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.sms_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS verification codes
CREATE POLICY "Users can insert their own verification requests" 
ON public.sms_verification_codes 
FOR INSERT 
WITH CHECK (true); -- Public insert for verification requests

CREATE POLICY "No one can select verification codes directly" 
ON public.sms_verification_codes 
FOR SELECT 
USING (false); -- Prevent direct access, only through secure functions

-- Create function to request SMS verification
CREATE OR REPLACE FUNCTION public.request_sms_verification(
  _phone TEXT,
  _email TEXT,
  _password TEXT,
  _display_name TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT, verification_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _verification_id UUID;
  _code TEXT;
  _existing_count INTEGER;
BEGIN
  -- Check rate limiting (max 3 requests per phone per hour)
  SELECT COUNT(*) INTO _existing_count
  FROM sms_verification_codes
  WHERE phone = _phone 
    AND created_at > (now() - INTERVAL '1 hour');
    
  IF _existing_count >= 3 THEN
    RETURN QUERY SELECT 
      false as success,
      'Muitas tentativas. Tente novamente em 1 hora.' as message,
      NULL::UUID as verification_id;
    RETURN;
  END IF;
  
  -- Generate 6-digit code
  _code := LPAD(floor(random() * 1000000)::text, 6, '0');
  
  -- Clean up old expired codes for this phone
  DELETE FROM sms_verification_codes 
  WHERE phone = _phone AND expires_at < now();
  
  -- Insert new verification request
  INSERT INTO sms_verification_codes (phone, code, user_data)
  VALUES (
    _phone, 
    _code, 
    jsonb_build_object(
      'email', _email,
      'password', _password,
      'display_name', _display_name
    )
  )
  RETURNING id INTO _verification_id;
  
  RETURN QUERY SELECT 
    true as success,
    _code as message, -- Return code to be sent via SMS
    _verification_id as verification_id;
END;
$$;

-- Create function to verify SMS code
CREATE OR REPLACE FUNCTION public.verify_sms_code(
  _verification_id UUID,
  _code TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT, user_data JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record RECORD;
BEGIN
  -- Get verification record
  SELECT * INTO _record
  FROM sms_verification_codes
  WHERE id = _verification_id
    AND expires_at > now()
    AND NOT verified
    AND attempts < 5;
    
  IF _record.id IS NULL THEN
    RETURN QUERY SELECT 
      false as success,
      'Código inválido ou expirado' as message,
      NULL::JSONB as user_data;
    RETURN;
  END IF;
  
  -- Increment attempts
  UPDATE sms_verification_codes
  SET attempts = attempts + 1
  WHERE id = _verification_id;
  
  -- Check if code matches
  IF _record.code = _code THEN
    -- Mark as verified
    UPDATE sms_verification_codes
    SET verified = true
    WHERE id = _verification_id;
    
    RETURN QUERY SELECT 
      true as success,
      'Código verificado com sucesso!' as message,
      _record.user_data as user_data;
  ELSE
    RETURN QUERY SELECT 
      false as success,
      'Código incorreto' as message,
      NULL::JSONB as user_data;
  END IF;
END;
$$;

-- Create function to cleanup expired codes (to be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM sms_verification_codes 
  WHERE expires_at < now() OR verified = true;
END;
$$;