-- ============================================================================
-- FIX: UPDATE DEFAULT CREDITS & ADMIN LOGIC
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. UPDATE NEW USER HANDLER (Default 1 credit)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_credits with all necessary data
  INSERT INTO public.user_credits (user_id, email, credits, is_unlimited)
  VALUES (
    NEW.id,
    NEW.email,
    1, -- CHANGED: Default to 1 free credit instead of 5
    FALSE
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. UPDATE EXISTING USERS TO 1 CREDIT (Except Admin)
-- Reset all non-unlimited users to 1 credit, excluding the admin
UPDATE public.user_credits
SET credits = 1
WHERE 
  email != 'deepshal99@gmail.com' 
  AND is_unlimited = FALSE;

-- Optional: Ensure admin has enough credits or unlimited
UPDATE public.user_credits
SET is_unlimited = TRUE
WHERE email = 'deepshal99@gmail.com';

-- 3. ENSURE ADMIN CHECK WORKS ON PROD (RLS)
-- Sometimes RLS prevents reading other users' data even for admins if policies aren't set correctly.
-- We need a policy that allows the specific admin email to read/write ALL rows.

-- Drop existing service role policy if needed (it's good to keep, but we add admin specific one)
-- DROP POLICY IF EXISTS "Service role can manage all credits" ON public.user_credits;

-- Create policy for Admin to view/edit ALL credits
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

-- Also need this for the 'creations' table if admin needs to see all generations
DROP POLICY IF EXISTS "Admin can view all creations" ON public.creations;
CREATE POLICY "Admin can view all creations" ON public.creations
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  );

-- And for 'discovered_personas'
DROP POLICY IF EXISTS "Admin can manage discovered_personas" ON public.discovered_personas;
CREATE POLICY "Admin can manage discovered_personas" ON public.discovered_personas
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'deepshal99@gmail.com'
  );

