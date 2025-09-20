-- Add geographic fields to teams table
ALTER TABLE public.teams 
ADD COLUMN state TEXT,
ADD COLUMN city TEXT,
ADD COLUMN public_description TEXT,
ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Create team join requests table
CREATE TABLE public.team_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  requesting_player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, requesting_player_id)
);

-- Enable RLS on team join requests
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for team join requests
CREATE POLICY "Requesting players can view their own requests" 
ON public.team_join_requests 
FOR SELECT 
USING (requesting_player_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Team admins can view team join requests" 
ON public.team_join_requests 
FOR SELECT 
USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Authenticated users can create join requests" 
ON public.team_join_requests 
FOR INSERT 
WITH CHECK (requesting_player_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Team admins can update join requests" 
ON public.team_join_requests 
FOR UPDATE 
USING (is_team_admin(auth.uid(), team_id));

-- Add updated_at trigger
CREATE TRIGGER update_team_join_requests_updated_at
BEFORE UPDATE ON public.team_join_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to search teams by location and name
CREATE OR REPLACE FUNCTION public.search_teams(
  _search_term TEXT DEFAULT NULL,
  _state TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  public_description TEXT,
  state TEXT,
  city TEXT,
  member_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.name,
    t.description,
    t.public_description,
    t.state,
    t.city,
    COUNT(tm.id) as member_count,
    t.created_at
  FROM public.teams t
  LEFT JOIN public.team_members tm ON t.id = tm.team_id
  WHERE t.is_public = true
    AND (_search_term IS NULL OR LOWER(t.name) LIKE LOWER('%' || _search_term || '%'))
    AND (_state IS NULL OR LOWER(t.state) = LOWER(_state))
    AND (_city IS NULL OR LOWER(t.city) = LOWER(_city))
  GROUP BY t.id, t.name, t.description, t.public_description, t.state, t.city, t.created_at
  ORDER BY 
    member_count DESC,
    t.created_at DESC
  LIMIT _limit;
$$;

-- Function to handle team join requests
CREATE OR REPLACE FUNCTION public.process_team_join_request(
  _request_id UUID,
  _action TEXT,
  _admin_message TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request RECORD;
  _admin_profile_id UUID;
BEGIN
  -- Get admin profile
  SELECT id INTO _admin_profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Get the request
  SELECT * INTO _request 
  FROM public.team_join_requests 
  WHERE id = _request_id AND status = 'pending';
  
  IF _request.id IS NULL THEN
    RETURN QUERY SELECT 
      false as success,
      'Solicitação não encontrada ou já processada' as message;
    RETURN;
  END IF;
  
  -- Check if user is team admin
  IF NOT is_team_admin(auth.uid(), _request.team_id) THEN
    RETURN QUERY SELECT 
      false as success,
      'Acesso negado: apenas administradores podem processar solicitações' as message;
    RETURN;
  END IF;
  
  -- Process the request
  IF _action = 'approve' THEN
    -- Add player to team
    INSERT INTO public.team_members (team_id, profile_id, role)
    VALUES (_request.team_id, _request.requesting_player_id, 'player');
    
    -- Update request status
    UPDATE public.team_join_requests 
    SET status = 'approved',
        reviewed_by = _admin_profile_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = _request_id;
    
    RETURN QUERY SELECT 
      true as success,
      'Jogador aprovado e adicionado ao time!' as message;
      
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
      'Solicitação rejeitada' as message;
  ELSE
    RETURN QUERY SELECT 
      false as success,
      'Ação inválida' as message;
  END IF;
END;
$$;

-- Function to remove player from team
CREATE OR REPLACE FUNCTION public.remove_player_from_team(
  _player_id UUID,
  _team_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_profile_id UUID;
  _player_profile_id UUID;
BEGIN
  -- Get admin profile
  SELECT id INTO _admin_profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Check if user is team admin
  IF NOT is_team_admin(auth.uid(), _team_id) THEN
    RETURN QUERY SELECT 
      false as success,
      'Acesso negado: apenas administradores podem remover jogadores' as message;
    RETURN;
  END IF;
  
  -- Get player profile ID
  SELECT profile_id INTO _player_profile_id 
  FROM public.players 
  WHERE id = _player_id AND team_id = _team_id;
  
  IF _player_profile_id IS NULL THEN
    RETURN QUERY SELECT 
      false as success,
      'Jogador não encontrado no time' as message;
    RETURN;
  END IF;
  
  -- Check if trying to remove the team admin
  IF _player_profile_id = _admin_profile_id THEN
    RETURN QUERY SELECT 
      false as success,
      'Administradores não podem se remover do próprio time' as message;
    RETURN;
  END IF;
  
  -- Remove player from team (soft delete - keep player record but remove from team)
  DELETE FROM public.players WHERE id = _player_id AND team_id = _team_id;
  
  -- Remove from team members
  DELETE FROM public.team_members WHERE team_id = _team_id AND profile_id = _player_profile_id;
  
  -- Log the removal
  PERFORM public.create_audit_log(
    'REMOVE_PLAYER',
    'players',
    _player_id,
    NULL,
    jsonb_build_object('team_id', _team_id, 'removed_by', _admin_profile_id)
  );
  
  RETURN QUERY SELECT 
    true as success,
    'Jogador removido do time com sucesso' as message;
END;
$$;

-- Function to get Brazilian states
CREATE OR REPLACE FUNCTION public.get_brazilian_states()
RETURNS TABLE(
  code TEXT,
  name TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT * FROM (VALUES
    ('AC', 'Acre'),
    ('AL', 'Alagoas'),
    ('AP', 'Amapá'),
    ('AM', 'Amazonas'),
    ('BA', 'Bahia'),
    ('CE', 'Ceará'),
    ('DF', 'Distrito Federal'),
    ('ES', 'Espírito Santo'),
    ('GO', 'Goiás'),
    ('MA', 'Maranhão'),
    ('MT', 'Mato Grosso'),
    ('MS', 'Mato Grosso do Sul'),
    ('MG', 'Minas Gerais'),
    ('PA', 'Pará'),
    ('PB', 'Paraíba'),
    ('PR', 'Paraná'),
    ('PE', 'Pernambuco'),
    ('PI', 'Piauí'),
    ('RJ', 'Rio de Janeiro'),
    ('RN', 'Rio Grande do Norte'),
    ('RS', 'Rio Grande do Sul'),
    ('RO', 'Rondônia'),
    ('RR', 'Roraima'),
    ('SC', 'Santa Catarina'),
    ('SP', 'São Paulo'),
    ('SE', 'Sergipe'),
    ('TO', 'Tocantins')
  ) AS states(code, name)
  ORDER BY name;
$$;

-- Update create_team_secure function to add admin as player automatically
CREATE OR REPLACE FUNCTION public.create_team_secure(
  _team_name TEXT,
  _team_description TEXT DEFAULT NULL,
  _state TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _public_description TEXT DEFAULT NULL
)
RETURNS TABLE(team_id UUID, team_name TEXT, success BOOLEAN, message TEXT)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _profile_id UUID;
  _new_team_id UUID;
  _invite_code TEXT;
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
  SELECT id INTO _profile_id
  FROM public.profiles 
  WHERE user_id = _user_id;
  
  IF _profile_id IS NULL THEN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (_user_id, (SELECT email FROM auth.users WHERE id = _user_id))
    RETURNING id INTO _profile_id;
  END IF;

  -- Generate a unique invite code
  _invite_code := encode(extensions.gen_random_bytes(6), 'base64');
  
  -- Create the team
  INSERT INTO public.teams (name, description, admin_id, invite_code, state, city, public_description)
  VALUES (_team_name, _team_description, _profile_id, _invite_code, _state, _city, _public_description)
  RETURNING id INTO _new_team_id;

  -- Add the creator as a team member
  INSERT INTO public.team_members (team_id, profile_id, role)
  VALUES (_new_team_id, _profile_id, 'admin');
  
  -- Add the creator as a player
  INSERT INTO public.players (team_id, profile_id, name, nickname, position, phone)
  VALUES (
    _new_team_id, 
    _profile_id, 
    (SELECT display_name FROM public.profiles WHERE id = _profile_id),
    (SELECT display_name FROM public.profiles WHERE id = _profile_id),
    'Administrador',
    (SELECT phone FROM public.profiles WHERE id = _profile_id)
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
$$;