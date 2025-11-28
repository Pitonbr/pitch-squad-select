-- Add game_id column to team_join_requests
ALTER TABLE team_join_requests 
ADD COLUMN game_id uuid REFERENCES games(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_team_join_requests_game_id ON team_join_requests(game_id);

-- Drop existing function
DROP FUNCTION IF EXISTS process_team_join_request(uuid, text, text);

-- Updated function to create player and game participant upon approval
CREATE OR REPLACE FUNCTION process_team_join_request(
  _request_id uuid,
  _action text,
  _admin_message text DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, player_email text, player_name text, team_name text, game_title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request RECORD;
  _admin_profile_id UUID;
  _new_player_id UUID;
  _requesting_profile RECORD;
  _team_record RECORD;
  _game_record RECORD;
BEGIN
  -- Get admin profile
  SELECT id INTO _admin_profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Get the request with game info
  SELECT tjr.*, g.title as game_title
  INTO _request 
  FROM public.team_join_requests tjr
  LEFT JOIN public.games g ON tjr.game_id = g.id
  WHERE tjr.id = _request_id AND tjr.status = 'pending';
  
  IF _request.id IS NULL THEN
    RETURN QUERY SELECT 
      false as success,
      'Solicitação não encontrada ou já processada' as message,
      NULL::text as player_email,
      NULL::text as player_name,
      NULL::text as team_name,
      NULL::text as game_title;
    RETURN;
  END IF;
  
  -- Check if user is team admin
  IF NOT is_team_admin(auth.uid(), _request.team_id) THEN
    RETURN QUERY SELECT 
      false as success,
      'Acesso negado: apenas administradores podem processar solicitações' as message,
      NULL::text as player_email,
      NULL::text as player_name,
      NULL::text as team_name,
      NULL::text as game_title;
    RETURN;
  END IF;
  
  -- Get requesting player profile
  SELECT p.*, u.email as user_email
  INTO _requesting_profile
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE p.id = _request.requesting_player_id;
  
  -- Get team info
  SELECT name INTO _team_record FROM public.teams WHERE id = _request.team_id;
  
  -- Process the request
  IF _action = 'approve' THEN
    -- Add to team members
    INSERT INTO public.team_members (team_id, profile_id, role)
    VALUES (_request.team_id, _request.requesting_player_id, 'player')
    ON CONFLICT (team_id, profile_id) DO NOTHING;
    
    -- Create player record
    INSERT INTO public.players (
      team_id, 
      profile_id, 
      name, 
      nickname, 
      position, 
      phone, 
      email
    )
    VALUES (
      _request.team_id,
      _request.requesting_player_id,
      COALESCE(_requesting_profile.display_name, 'Jogador'),
      COALESCE(_requesting_profile.display_name, 'Jogador'),
      'Jogador',
      COALESCE(_requesting_profile.phone, 'Não informado'),
      _requesting_profile.user_email
    )
    RETURNING id INTO _new_player_id;
    
    -- If request came from game invite, add to game participants
    IF _request.game_id IS NOT NULL THEN
      INSERT INTO public.game_participants (
        game_id,
        player_id,
        profile_id,
        status
      )
      VALUES (
        _request.game_id,
        _new_player_id,
        _request.requesting_player_id,
        'invited'
      )
      ON CONFLICT (game_id, player_id) DO NOTHING;
    END IF;
    
    -- Update request status
    UPDATE public.team_join_requests 
    SET status = 'approved',
        reviewed_by = _admin_profile_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = _request_id;
    
    RETURN QUERY SELECT 
      true as success,
      'Jogador aprovado e adicionado ao time!' as message,
      _requesting_profile.user_email as player_email,
      _requesting_profile.display_name as player_name,
      _team_record.name as team_name,
      _request.game_title as game_title;
      
  ELSIF _action = 'reject' THEN
    -- Update request status
    UPDATE public.team_join_requests 
    SET status = 'rejected',
        reviewed_by = _admin_profile_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = _request_id;
    
    RETURN QUERY SELECT 
      true as success,
      'Solicitação rejeitada' as message,
      _requesting_profile.user_email as player_email,
      _requesting_profile.display_name as player_name,
      _team_record.name as team_name,
      NULL::text as game_title;
  ELSE
    RETURN QUERY SELECT 
      false as success,
      'Ação inválida' as message,
      NULL::text as player_email,
      NULL::text as player_name,
      NULL::text as team_name,
      NULL::text as game_title;
  END IF;
END;
$$;

-- Function to create join request from game invite
CREATE OR REPLACE FUNCTION create_game_join_request(
  _team_id uuid,
  _game_id uuid,
  _message text DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, request_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id UUID;
  _new_request_id UUID;
  _existing_request_count INTEGER;
  _is_member BOOLEAN;
BEGIN
  -- Get current user's profile
  SELECT id INTO _profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF _profile_id IS NULL THEN
    RETURN QUERY SELECT 
      false as success,
      'Usuário não autenticado' as message,
      NULL::uuid as request_id;
    RETURN;
  END IF;
  
  -- Check if already a team member
  SELECT is_team_member(auth.uid(), _team_id) INTO _is_member;
  
  IF _is_member THEN
    RETURN QUERY SELECT 
      false as success,
      'Você já faz parte deste time' as message,
      NULL::uuid as request_id;
    RETURN;
  END IF;
  
  -- Check for existing pending requests
  SELECT COUNT(*) INTO _existing_request_count
  FROM public.team_join_requests
  WHERE team_id = _team_id 
    AND requesting_player_id = _profile_id
    AND status = 'pending';
  
  IF _existing_request_count > 0 THEN
    RETURN QUERY SELECT 
      false as success,
      'Você já possui uma solicitação pendente para este time' as message,
      NULL::uuid as request_id;
    RETURN;
  END IF;
  
  -- Create join request
  INSERT INTO public.team_join_requests (
    team_id,
    requesting_player_id,
    game_id,
    message,
    status
  )
  VALUES (
    _team_id,
    _profile_id,
    _game_id,
    _message,
    'pending'
  )
  RETURNING id INTO _new_request_id;
  
  RETURN QUERY SELECT 
    true as success,
    'Solicitação enviada com sucesso! Aguarde aprovação do administrador.' as message,
    _new_request_id as request_id;
END;
$$;