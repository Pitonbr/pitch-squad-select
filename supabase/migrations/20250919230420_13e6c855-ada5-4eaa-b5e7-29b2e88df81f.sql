-- Create player_requests table for approval workflow
CREATE TABLE public.player_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  jersey_number INTEGER,
  profile_image TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to players table
ALTER TABLE public.players 
ADD COLUMN email TEXT,
ADD COLUMN jersey_number INTEGER,
ADD COLUMN profile_image TEXT;

-- Add unique constraint for jersey number per team
ALTER TABLE public.players 
ADD CONSTRAINT unique_jersey_per_team UNIQUE (team_id, jersey_number);

-- Create storage bucket for player images
INSERT INTO storage.buckets (id, name, public) VALUES ('player-images', 'player-images', true);

-- Enable RLS on player_requests
ALTER TABLE public.player_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_requests
CREATE POLICY "Team admins can manage player requests" 
ON public.player_requests 
FOR ALL 
USING (is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team members can view player requests" 
ON public.player_requests 
FOR SELECT 
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Users can create their own player requests" 
ON public.player_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND id = requested_by
  )
);

-- Storage policies for player images
CREATE POLICY "Anyone can view player images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'player-images');

CREATE POLICY "Authenticated users can upload player images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'player-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own player images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'player-images' AND auth.uid() IS NOT NULL);

-- Function to approve player request
CREATE OR REPLACE FUNCTION public.approve_player_request(
  _request_id UUID
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  player_id UUID
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _request RECORD;
  _new_player_id UUID;
  _admin_profile_id UUID;
BEGIN
  -- Get admin profile
  SELECT id INTO _admin_profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Get the request
  SELECT * INTO _request 
  FROM public.player_requests 
  WHERE id = _request_id AND status = 'pending';
  
  IF _request.id IS NULL THEN
    RETURN QUERY SELECT 
      false as success,
      'Solicitação não encontrada ou já processada' as message,
      NULL::UUID as player_id;
    RETURN;
  END IF;
  
  -- Check if user is team admin
  IF NOT is_team_admin(auth.uid(), _request.team_id) THEN
    RETURN QUERY SELECT 
      false as success,
      'Acesso negado: apenas administradores podem aprovar solicitações' as message,
      NULL::UUID as player_id;
    RETURN;
  END IF;
  
  -- Create the player
  INSERT INTO public.players (
    team_id, profile_id, name, nickname, position, phone, email, jersey_number, profile_image
  ) VALUES (
    _request.team_id, _request.requested_by, _request.name, _request.nickname, 
    _request.position, _request.phone, _request.email, _request.jersey_number, _request.profile_image
  ) RETURNING id INTO _new_player_id;
  
  -- Update request status
  UPDATE public.player_requests 
  SET status = 'approved', 
      reviewed_by = _admin_profile_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id;
  
  -- Log the approval
  PERFORM public.create_audit_log(
    'APPROVE_PLAYER_REQUEST',
    'player_requests',
    _request_id,
    NULL,
    jsonb_build_object(
      'player_name', _request.name,
      'player_id', _new_player_id,
      'team_id', _request.team_id
    )
  );
  
  RETURN QUERY SELECT 
    true as success,
    'Jogador aprovado e adicionado ao time!' as message,
    _new_player_id as player_id;
END;
$$;

-- Function to reject player request
CREATE OR REPLACE FUNCTION public.reject_player_request(
  _request_id UUID,
  _reason TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  FROM public.player_requests 
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
      'Acesso negado: apenas administradores podem rejeitar solicitações' as message;
    RETURN;
  END IF;
  
  -- Update request status
  UPDATE public.player_requests 
  SET status = 'rejected', 
      reviewed_by = _admin_profile_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id;
  
  -- Log the rejection
  PERFORM public.create_audit_log(
    'REJECT_PLAYER_REQUEST',
    'player_requests',
    _request_id,
    NULL,
    jsonb_build_object(
      'player_name', _request.name,
      'team_id', _request.team_id,
      'reason', _reason
    )
  );
  
  RETURN QUERY SELECT 
    true as success,
    'Solicitação rejeitada' as message;
END;
$$;

-- Function to get pending player requests for a team
CREATE OR REPLACE FUNCTION public.get_pending_player_requests(_team_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  nickname TEXT,
  position TEXT,
  phone TEXT,
  email TEXT,
  jersey_number INTEGER,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  requested_by_name TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    pr.id,
    pr.name,
    pr.nickname,
    pr.position,
    pr.phone,
    pr.email,
    pr.jersey_number,
    pr.profile_image,
    pr.created_at,
    p.display_name as requested_by_name
  FROM public.player_requests pr
  JOIN public.profiles p ON pr.requested_by = p.id
  WHERE pr.team_id = _team_id 
    AND pr.status = 'pending'
    AND is_team_admin(auth.uid(), pr.team_id)
  ORDER BY pr.created_at DESC;
$$;

-- Update trigger for player_requests
CREATE TRIGGER update_player_requests_updated_at
BEFORE UPDATE ON public.player_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();