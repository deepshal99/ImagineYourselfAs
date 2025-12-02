-- ============================================================================
-- FIX: PERMISSION DENIED ERROR
-- We replace (SELECT email FROM auth.users...) with (auth.jwt() ->> 'email')
-- This prevents the "permission denied for table users" error.
-- ============================================================================

-- 1. Fix User Credits Admin Policy
DROP POLICY IF EXISTS "Admin can view all credits" ON public.user_credits;
CREATE POLICY "Admin can view all credits" ON public.user_credits
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'deepshal99@gmail.com'
  );

-- 2. Fix Creations Admin Policy
DROP POLICY IF EXISTS "Admin can view all creations" ON public.creations;
CREATE POLICY "Admin can view all creations" ON public.creations
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'deepshal99@gmail.com'
  );

-- 3. Fix Discovered Personas Admin Policy
DROP POLICY IF EXISTS "Admin can manage discovered_personas" ON public.discovered_personas;
CREATE POLICY "Admin can manage discovered_personas" ON public.discovered_personas
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'deepshal99@gmail.com'
  );

