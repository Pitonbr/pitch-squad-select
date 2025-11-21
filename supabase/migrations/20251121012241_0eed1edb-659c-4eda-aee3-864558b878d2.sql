-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own verification requests" ON public.sms_verification_codes;

-- Block all direct inserts - users must use the request_sms_verification() function
CREATE POLICY "No direct inserts - use request_sms_verification function"
ON public.sms_verification_codes
FOR INSERT
WITH CHECK (false);

-- Service role can manage codes for cleanup and internal operations
CREATE POLICY "Service role can manage verification codes"
ON public.sms_verification_codes
FOR ALL
USING (auth.role() = 'service_role');

-- Add comment explaining the security model
COMMENT ON POLICY "No direct inserts - use request_sms_verification function" ON public.sms_verification_codes IS 
'Direct INSERT blocked to prevent abuse. All verification requests must go through request_sms_verification() function which enforces rate limiting (max 3 attempts per hour per phone number) and proper validation.';

-- Ensure rate limiting table has proper constraints
ALTER TABLE public.sms_rate_limits
DROP CONSTRAINT IF EXISTS sms_rate_limits_phone_unique;

ALTER TABLE public.sms_rate_limits
ADD CONSTRAINT sms_rate_limits_phone_unique UNIQUE (phone);

-- Create indexes for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_phone ON public.sms_rate_limits(phone);
CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_blocked_until ON public.sms_rate_limits(blocked_until);