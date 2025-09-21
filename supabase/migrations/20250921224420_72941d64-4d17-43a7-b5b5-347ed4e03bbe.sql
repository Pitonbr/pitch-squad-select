-- Fix get_team_players function to include profile_image and all necessary fields
CREATE OR REPLACE FUNCTION public.get_team_players(_team_id uuid)
 RETURNS TABLE(
   id uuid, 
   team_id uuid, 
   profile_id uuid, 
   name text, 
   nickname text, 
   "position" text, 
   phone text, 
   email text,
   jersey_number integer,
   profile_image text,
   created_at timestamp with time zone, 
   updated_at timestamp with time zone
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    p.email,
    p.jersey_number,
    p.profile_image,
    p.created_at,
    p.updated_at
  FROM public.players p
  WHERE p.team_id = _team_id 
    AND is_team_member(auth.uid(), p.team_id)
  ORDER BY p.name;
$function$