-- Fix create_team_secure function to handle NULL phone values and improve error handling
DROP FUNCTION IF EXISTS public.create_team_secure(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_team_secure(_team_name text, _team_description text DEFAULT NULL::text, _state text DEFAULT NULL::text, _city text DEFAULT NULL::text, _public_description text DEFAULT NULL::text)
 RETURNS TABLE(team_id uuid, team_name text, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _profile_id UUID;
  _new_team_id UUID;
  _invite_code TEXT;
  _admin_profile RECORD;
BEGIN
  -- Get the authenticated user ID
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID as team_id,
      NULL::TEXT as team_name,
      false as success,
      'Usuário não autenticado' as message;
    RETURN;
  END IF;

  -- Get or create the user's profile
  SELECT * INTO _admin_profile
  FROM public.profiles 
  WHERE user_id = _user_id;
  
  IF _admin_profile.id IS NULL THEN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (_user_id, (SELECT email FROM auth.users WHERE id = _user_id))
    RETURNING * INTO _admin_profile;
  END IF;

  _profile_id := _admin_profile.id;

  -- Generate a unique invite code
  _invite_code := encode(extensions.gen_random_bytes(6), 'base64');
  
  -- Create the team
  INSERT INTO public.teams (name, description, admin_id, invite_code, state, city, public_description)
  VALUES (_team_name, _team_description, _profile_id, _invite_code, _state, _city, _public_description)
  RETURNING id INTO _new_team_id;

  -- Add the creator as a team member
  INSERT INTO public.team_members (team_id, profile_id, role)
  VALUES (_new_team_id, _profile_id, 'admin');
  
  -- Add the creator as a player with proper NULL handling
  INSERT INTO public.players (team_id, profile_id, name, nickname, position, phone, email)
  VALUES (
    _new_team_id, 
    _profile_id, 
    COALESCE(_admin_profile.display_name, 'Administrador'),
    COALESCE(_admin_profile.display_name, 'Admin'),
    'Administrador',
    COALESCE(_admin_profile.phone, 'Não informado'),
    (SELECT email FROM auth.users WHERE id = _user_id)
  );

  -- Log the successful team creation
  PERFORM public.create_audit_log(
    'CREATE_TEAM',
    'teams',
    _new_team_id,
    NULL,
    jsonb_build_object('team_name', _team_name, 'admin_id', _profile_id)
  );

  RETURN QUERY SELECT 
    _new_team_id as team_id,
    _team_name as team_name,
    true as success,
    'Time criado com sucesso!' as message;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      NULL::UUID as team_id,
      NULL::TEXT as team_name,
      false as success,
      ('Erro ao criar time: ' || SQLERRM) as message;
END;
$function$;

-- Add existing team admins as players if they are not already players
INSERT INTO public.players (team_id, profile_id, name, nickname, position, phone, email)
SELECT 
  t.id as team_id,
  t.admin_id as profile_id,
  COALESCE(p.display_name, 'Administrador') as name,
  COALESCE(p.display_name, 'Admin') as nickname,
  'Administrador' as position,
  COALESCE(p.phone, 'Não informado') as phone,
  u.email
FROM public.teams t
JOIN public.profiles p ON t.admin_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.players pl 
  WHERE pl.team_id = t.id AND pl.profile_id = t.admin_id
);