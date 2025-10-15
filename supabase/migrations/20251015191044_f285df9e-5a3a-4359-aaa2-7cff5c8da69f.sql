-- Create table for email delivery logs
CREATE TABLE public.email_delivery_logs_new (
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

-- Create indexes
CREATE INDEX idx_email_logs_new_email ON public.email_delivery_logs_new(recipient_email);
CREATE INDEX idx_email_logs_new_domain ON public.email_delivery_logs_new(email_domain);
CREATE INDEX idx_email_logs_new_status ON public.email_delivery_logs_new(status);
CREATE INDEX idx_email_logs_new_created ON public.email_delivery_logs_new(created_at DESC);

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
ALTER TABLE public.email_delivery_logs_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role only for security)
CREATE POLICY "Service role can manage email logs"
  ON public.email_delivery_logs_new
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage WhatsApp codes"
  ON public.whatsapp_verification_codes
  FOR ALL
  USING (auth.role() = 'service_role');