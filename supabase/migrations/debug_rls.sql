-- ============================================================================
-- DEBUG: DISABLE RLS TEMPORARILY
-- Run this to check if 403 errors persist without security
-- ============================================================================

-- 1. Disable RLS on creations table
ALTER TABLE public.creations DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on user_credits table
ALTER TABLE public.user_credits DISABLE ROW LEVEL SECURITY;

-- If this fixes the 403 errors, we know for sure it's the specific Policy logic.
-- After confirming, we will re-enable it with a simpler "Allow All" policy to test auth.

