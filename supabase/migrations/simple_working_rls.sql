-- ============================================================================
-- CRITICAL FIX: COMPLETE RLS RESET - SIMPLE & WORKING
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ==========================
-- 1. user_credits TABLE
-- ==========================
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admin can manage all credits" ON public.user_credits;
DROP POLICY IF EXISTS "Service role can manage all credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admin can view all credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admin full access" ON public.user_credits;

-- Simple policy: Users can manage their own data
CREATE POLICY "user_credits_select_own" ON public.user_credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_credits_update_own" ON public.user_credits
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_credits_insert_own" ON public.user_credits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================
-- 2. creations TABLE
-- ==========================
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can insert own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can delete own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can update own creations" ON public.creations;
DROP POLICY IF EXISTS "Admin can view all creations" ON public.creations;
DROP POLICY IF EXISTS "Public can view creations" ON public.creations;

-- Simple policies for regular users
CREATE POLICY "creations_select_own" ON public.creations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "creations_insert_own" ON public.creations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "creations_delete_own" ON public.creations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ==========================
-- 3. discovered_personas TABLE
-- ==========================
ALTER TABLE public.discovered_personas ENABLE ROW LEVEL SECURITY;

-- Drop existing
DROP POLICY IF EXISTS "Public can view all" ON public.discovered_personas;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.discovered_personas;

-- Anyone can read personas
CREATE POLICY "personas_read_all" ON public.discovered_personas
  FOR SELECT TO authenticated, anon
  USING (true);

-- Authenticated users can insert/update/delete
CREATE POLICY "personas_manage_authenticated" ON public.discovered_personas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================
-- 4. ADMIN USER - HARDCODE AS SUPERUSER
-- ==========================
-- Set your admin account to unlimited (no credit restrictions)
INSERT INTO public.user_credits (user_id, email, credits, is_unlimited, created_at, updated_at)
SELECT id, email, 999, TRUE, NOW(), NOW()
FROM auth.users
WHERE email = 'deepshal99@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  is_unlimited = TRUE,
  credits = 999,
  email = EXCLUDED.email;

