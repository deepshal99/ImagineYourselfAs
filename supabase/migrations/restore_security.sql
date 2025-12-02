-- ============================================================================
-- RESTORE SECURITY: RE-ENABLE RLS & APPLY POLICIES
-- Run this to fix the "RLS Disabled" warnings in Supabase
-- ============================================================================

-- 1. Re-enable RLS on tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- 2. Apply User Credits Policies
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Apply Creations Policies
DROP POLICY IF EXISTS "Users can view own creations" ON public.creations;
CREATE POLICY "Users can view own creations" ON public.creations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own creations" ON public.creations;
CREATE POLICY "Users can insert own creations" ON public.creations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own creations" ON public.creations;
CREATE POLICY "Users can delete own creations" ON public.creations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Admin Policies (Ensure Admin can still see everything)
-- Using the email check for safety
DROP POLICY IF EXISTS "Admin can view all credits" ON public.user_credits;
CREATE POLICY "Admin can view all credits" ON public.user_credits
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  );

DROP POLICY IF EXISTS "Admin can view all creations" ON public.creations;
CREATE POLICY "Admin can view all creations" ON public.creations
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  );

