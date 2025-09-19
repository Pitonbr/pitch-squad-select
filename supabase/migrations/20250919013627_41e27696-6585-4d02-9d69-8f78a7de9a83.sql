-- Ensure current authenticated user has a profile
DO $$
BEGIN
  -- Only run if we have an authenticated user
  IF auth.uid() IS NOT NULL THEN
    -- Insert profile if it doesn't exist
    INSERT INTO public.profiles (user_id, display_name, phone)
    SELECT 
      auth.uid(),
      COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'display_name',
        auth.email()
      ),
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'phone'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
    );
  END IF;
END $$;

-- Ensure all existing auth users have profiles
INSERT INTO public.profiles (user_id, display_name, phone)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data ->> 'display_name',
    au.email
  ),
  au.raw_user_meta_data ->> 'phone'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
);

-- Make sure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();