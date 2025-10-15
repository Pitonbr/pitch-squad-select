-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.email_delivery_logs CASCADE;
DROP TABLE IF EXISTS public.whatsapp_verification_codes CASCADE;
DROP FUNCTION IF EXISTS public.increment_verification_attempts CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_verifications CASCADE;

-- Create table for email delivery logs
CREATE TABLE public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  email_domain TEXT,
  attempt_number INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('attempting', 'delivered', 'failed', 'bounced')),
  provider_response TEXT,
  error_message TEXT,
  delivery_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_email_logs_email ON public.email_delivery_logs(recipient_email);
CREATE INDEX idx_email_logs_domain ON public.email_delivery_logs(email_domain);
CREATE INDEX idx_email_logs_status ON public.email_delivery_logs(status);
CREATE INDEX idx_email_logs_created ON public.email_delivery_logs(created_at DESC);

-- Create table for WhatsApp verification codes
CREATE TABLE public.whatsapp_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'verified', 'failed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for WhatsApp verification
CREATE INDEX idx_whatsapp_codes_phone ON public.whatsapp_verification_codes(phone);
CREATE INDEX idx_whatsapp_codes_status ON public.whatsapp_verification_codes(status);
CREATE INDEX idx_whatsapp_codes_expires ON public.whatsapp_verification_codes(expires_at);

-- Function to increment verification attempts
CREATE OR REPLACE FUNCTION public.increment_verification_attempts(verification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.whatsapp_verification_codes 
  SET attempts = attempts + 1
  WHERE id = verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on both tables
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_delivery_logs (service only)
CREATE POLICY "Service role can manage email logs"
  ON public.email_delivery_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for whatsapp_verification_codes (service only)
CREATE POLICY "Service role can manage WhatsApp codes"
  ON public.whatsapp_verification_codes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-cleanup expired verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.whatsapp_verification_codes
  WHERE expires_at < now() - INTERVAL '24 hours';
  
  DELETE FROM public.email_delivery_logs
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;