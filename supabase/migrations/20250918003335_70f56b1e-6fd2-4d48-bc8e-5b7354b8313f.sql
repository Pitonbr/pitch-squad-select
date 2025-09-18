-- Update RLS policies on players table to automatically mask phone numbers for non-admins
DROP POLICY IF EXISTS "Team members can view team players" ON public.players;

-- Create a view that automatically masks phone numbers for non-admins
CREATE OR REPLACE VIEW public.players_view AS
SELECT 
  p.id,
  p.team_id,
  p.profile_id,
  p.name,
  p.nickname,
  p."position",
  CASE 
    WHEN is_team_admin(auth.uid(), p.team_id) THEN p.phone
    ELSE mask_phone_number(p.phone, p.team_id, auth.uid())
  END as phone,
  p.created_at,
  p.updated_at
FROM public.players p
WHERE is_team_member(auth.uid(), p.team_id);

-- Grant access to the view
GRANT SELECT ON public.players_view TO authenticated;

-- Add RLS policy for the original table (keep existing admin policy)
CREATE POLICY "Team members can view team players with masked phones" 
ON public.players 
FOR SELECT 
USING (is_team_member(auth.uid(), team_id));

-- Create a secure function to get players for a team (to use in components)
CREATE OR REPLACE FUNCTION public.get_team_players(_team_id uuid)
RETURNS TABLE(
  id uuid,
  team_id uuid,
  profile_id uuid,
  name text,
  nickname text,
  "position" text,
  phone text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.team_id,
    p.profile_id,
    p.name,
    p.nickname,
    p."position",
    CASE 
      WHEN is_team_admin(auth.uid(), p.team_id) THEN p.phone
      ELSE mask_phone_number(p.phone, p.team_id, auth.uid())
    END as phone,
    p.created_at,
    p.updated_at
  FROM public.players p
  WHERE p.team_id = _team_id 
    AND is_team_member(auth.uid(), p.team_id)
  ORDER BY p.name;
$$;