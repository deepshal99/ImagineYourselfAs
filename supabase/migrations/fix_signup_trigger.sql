-- ============================================================================
-- FIX: NEW USER SIGNUP FLOW
-- Run this in your Supabase SQL Editor to ensure new users are properly initialized
-- ============================================================================

-- 1. Ensure user_credits table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  credits INTEGER DEFAULT 5, -- Give 5 free credits on signup
  is_unlimited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for user_credits
-- Allow users to read their own credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service_role (e.g. Edge Functions) to do everything
DROP POLICY IF EXISTS "Service role can manage all credits" ON public.user_credits;
CREATE POLICY "Service role can manage all credits" ON public.user_credits
  USING (true) WITH CHECK (true);

-- 4. Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_credits
  INSERT INTO public.user_credits (user_id, email, credits, is_unlimited)
  VALUES (
    NEW.id,
    NEW.email,
    5, -- Default free credits
    FALSE
  )
  ON CONFLICT (user_id) DO NOTHING; -- Handle case where it might already exist

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger on auth.users
-- This ensures that whenever a new user is created in Supabase Auth,
-- the corresponding row in user_credits is created.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

