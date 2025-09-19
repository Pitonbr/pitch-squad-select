-- Create profile for current user if it doesn't exist
INSERT INTO public.profiles (user_id, display_name)
SELECT 
  auth.uid(),
  COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'display_name',
    (auth.jwt() ->> 'email')
  )
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
  );

-- Ensure trigger exists for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();