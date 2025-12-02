-- ============================================================================
-- FIX: ADMIN DASHBOARD POLICIES
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Ensure admin can view ALL data
-- The issue is likely missing policies for the 'creations' table and 'user_credits' table
-- for the admin user.

-- 1. Policy for Admin to view ALL creations
DROP POLICY IF EXISTS "Admin can view all creations" ON public.creations;
CREATE POLICY "Admin can view all creations" ON public.creations
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  );

-- 2. Policy for Admin to view ALL user credits
DROP POLICY IF EXISTS "Admin can view all credits" ON public.user_credits;
CREATE POLICY "Admin can view all credits" ON public.user_credits
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  );

-- 3. Policy for Admin to view ALL feedback
DROP POLICY IF EXISTS "Admin can view all feedback" ON public.generation_feedback;
CREATE POLICY "Admin can view all feedback" ON public.generation_feedback
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  );

-- 4. Ensure 'creations' table has user_id foreign key properly set up if not already
-- (This usually exists, but good to be safe if queries fail)
-- ALTER TABLE public.creations ADD FOREIGN KEY (user_id) REFERENCES auth.users(id);

