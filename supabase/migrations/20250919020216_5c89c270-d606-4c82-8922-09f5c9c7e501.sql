-- Fix the create_team_secure function to use extensions.gen_random_bytes
CREATE OR REPLACE FUNCTION public.create_team_secure(
  _team_name text,
  _team_description text DEFAULT NULL
) RETURNS TABLE(
  team_id uuid,
  team_name text,
  success boolean,
  message text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id uuid;
  _profile_id uuid;
  _new_team_id uuid;
  _invite_code text;
BEGIN
  -- Get the authenticated user ID
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid as team_id,
      NULL::text as team_name,
      false as success,
      'Usuário não autenticado' as message;
    RETURN;
  END IF;

  -- Get or create the user's profile
  SELECT id INTO _profile_id
  FROM public.profiles 
  WHERE user_id = _user_id;
  
  IF _profile_id IS NULL THEN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (_user_id, (SELECT email FROM auth.users WHERE id = _user_id))
    RETURNING id INTO _profile_id;
  END IF;

  -- Generate a unique invite code with correct schema prefix
  _invite_code := encode(extensions.gen_random_bytes(6), 'base64');
  
  -- Create the team
  INSERT INTO public.teams (name, description, admin_id, invite_code)
  VALUES (_team_name, _team_description, _profile_id, _invite_code)
  RETURNING id INTO _new_team_id;

  -- Add the creator as a team member
  INSERT INTO public.team_members (team_id, profile_id, role)
  VALUES (_new_team_id, _profile_id, 'admin');

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
      NULL::uuid as team_id,
      NULL::text as team_name,
      false as success,
      ('Erro ao criar time: ' || SQLERRM) as message;
END;
$$;