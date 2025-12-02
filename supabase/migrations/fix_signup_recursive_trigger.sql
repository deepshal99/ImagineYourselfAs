-- ============================================================================
-- FIX: RECURSIVE TRIGGER BUG & SIGNUP FLOW
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. DROP THE PROBLEMATIC RECURSIVE TRIGGER
-- This trigger was calling an UPDATE on user_credits inside an AFTER INSERT/UPDATE trigger on user_credits,
-- causing an infinite loop.
DROP TRIGGER IF EXISTS sync_email_on_credit_change ON user_credits;
DROP FUNCTION IF EXISTS sync_user_email();

-- 2. RE-CREATE THE NEW USER HANDLER (Just to be safe and ensure it's correct)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_credits with all necessary data
  -- We include email directly here so we don't need a separate sync trigger
  INSERT INTO public.user_credits (user_id, email, credits, is_unlimited)
  VALUES (
    NEW.id,
    NEW.email,
    5, -- Default free credits
    FALSE
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email; -- Update email if user exists but email changed/missing

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE THE TRIGGER ON AUTH.USERS EXISTS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. ENSURE RLS POLICIES ARE CORRECT (Idempotent)
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all credits" ON public.user_credits;
CREATE POLICY "Service role can manage all credits" ON public.user_credits
  USING (true) WITH CHECK (true);

