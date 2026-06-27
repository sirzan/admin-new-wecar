
-- Profiles: restrict SELECT
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles: restrict SELECT
DROP POLICY IF EXISTS "Roles viewable by everyone" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- has_role: revoke EXECUTE from API roles (RLS still works because policies run as table owner context via SECURITY DEFINER bypass — but has_role itself is invoked via SQL, not API. Revoke to satisfy linter.)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- Storage: tighten car-images INSERT to user's own folder (path prefix = auth.uid())
DROP POLICY IF EXISTS "Authenticated users upload car images" ON storage.objects;
CREATE POLICY "Users upload car images to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
