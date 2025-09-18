-- Create a secure function to mask phone numbers for non-admin team members
CREATE OR REPLACE FUNCTION public.mask_phone_number(
  _phone text,
  _team_id uuid,
  _requesting_user_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the requesting user is a team admin, return full phone number
  IF is_team_admin(_requesting_user_id, _team_id) THEN
    RETURN _phone;
  END IF;
  
  -- Otherwise, mask the phone number (show only last 4 digits)
  IF _phone IS NULL OR length(_phone) < 4 THEN
    RETURN '***-***';
  END IF;
  
  RETURN '***-***-' || right(_phone, 4);
END;
$$;

-- Create audit log table for sensitive operations
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  profile_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only team admins can view audit logs for their teams
CREATE POLICY "Team admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.admin_id = profile_id 
    AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = t.admin_id)
  )
);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log(
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO _profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  INSERT INTO public.audit_logs (
    user_id,
    profile_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    _profile_id,
    _action,
    _resource_type,
    _resource_id,
    _old_values,
    _new_values
  );
END;
$$;

-- Create triggers for audit logging on sensitive tables
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_log(
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_log(
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_log(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to sensitive tables
CREATE TRIGGER teams_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER players_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER team_members_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();