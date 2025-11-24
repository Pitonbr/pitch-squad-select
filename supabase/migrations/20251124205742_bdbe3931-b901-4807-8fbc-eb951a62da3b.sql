-- Fix security issue: Add search_path to all SECURITY DEFINER functions
-- This prevents schema poisoning attacks

-- Functions that need search_path added
ALTER FUNCTION public.join_team_by_invite_code(_invite_code text, _profile_id uuid) SET search_path = public;
ALTER FUNCTION public.mask_phone_number(_phone text, _team_id uuid, _requesting_user_id uuid) SET search_path = public;
ALTER FUNCTION public.create_audit_log(_action text, _resource_type text, _resource_id uuid, _old_values jsonb, _new_values jsonb) SET search_path = public;
ALTER FUNCTION public.audit_trigger_function() SET search_path = public;
ALTER FUNCTION public.get_team_players(_team_id uuid) SET search_path = public;
ALTER FUNCTION public.is_team_treasurer(_user_id uuid, _team_id uuid) SET search_path = public;
ALTER FUNCTION public.has_financial_admin_access(_user_id uuid, _team_id uuid) SET search_path = public;
ALTER FUNCTION public.request_sms_verification(_phone text, _email text, _password text, _display_name text) SET search_path = public;
ALTER FUNCTION public.verify_sms_code(_verification_id uuid, _code text) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_verification_codes() SET search_path = public;
ALTER FUNCTION public.auto_cleanup_verification_codes() SET search_path = public;
ALTER FUNCTION public.log_sensitive_operation(_action text, _details jsonb) SET search_path = public;
ALTER FUNCTION public.can_view_player_payment_status(_team_id uuid, _requesting_user_id uuid, _target_player_id uuid) SET search_path = public;
ALTER FUNCTION public.get_team_financial_summary(_team_id uuid, _period_year integer, _period_month integer) SET search_path = public;
ALTER FUNCTION public.log_email_delivery(_user_id uuid, _email_address text, _delivery_status text, _error_message text, _retry_count integer, _email_provider text) SET search_path = public;
ALTER FUNCTION public.get_email_delivery_stats(_days_back integer) SET search_path = public;
ALTER FUNCTION public.search_teams(_search_term text, _state text, _city text, _limit integer) SET search_path = public;
ALTER FUNCTION public.process_team_join_request(_request_id uuid, _action text, _admin_message text) SET search_path = public;
ALTER FUNCTION public.remove_player_from_team(_player_id uuid, _team_id uuid) SET search_path = public;
ALTER FUNCTION public.increment_verification_attempts(verification_id uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_verifications() SET search_path = public;
ALTER FUNCTION public.cleanup_password_reset_rate_limits() SET search_path = public;
ALTER FUNCTION public.get_player_secure(_player_id uuid, _team_id uuid) SET search_path = public;