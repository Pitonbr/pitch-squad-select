-- Remove the overly broad policy and replace with a secure function-based approach
DROP POLICY IF EXISTS "Users can find teams by invite code for joining" ON public.teams;

-- Create a secure function to find team by invite code and join it
CREATE OR REPLACE FUNCTION public.join_team_by_invite_code(
  _invite_code text,
  _profile_id uuid
)
RETURNS TABLE(
  team_id uuid,
  team_name text,
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _team_record record;
  _existing_member_count int;
BEGIN
  -- Find team by invite code
  SELECT t.id, t.name INTO _team_record
  FROM public.teams t
  WHERE t.invite_code = _invite_code;

  -- Check if team exists
  IF _team_record.id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid as team_id,
      NULL::text as team_name,
      false as success,
      'Código de convite inválido' as message;
    RETURN;
  END IF;

  -- Check if user is already a member
  SELECT COUNT(*) INTO _existing_member_count
  FROM public.team_members tm
  WHERE tm.team_id = _team_record.id 
    AND tm.profile_id = _profile_id;

  IF _existing_member_count > 0 THEN
    RETURN QUERY SELECT 
      _team_record.id as team_id,
      _team_record.name as team_name,
      false as success,
      'Você já faz parte deste time' as message;
    RETURN;
  END IF;

  -- Add user to team
  INSERT INTO public.team_members (team_id, profile_id, role)
  VALUES (_team_record.id, _profile_id, 'player');

  -- Return success
  RETURN QUERY SELECT 
    _team_record.id as team_id,
    _team_record.name as team_name,
    true as success,
    'Entrou no time com sucesso!' as message;
END;
$$;