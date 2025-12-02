-- ============================================================================
-- FIX: CREATIONS TABLE RLS POLICIES
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Enable RLS on creations table (good practice)
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to view their own creations
DROP POLICY IF EXISTS "Users can view own creations" ON public.creations;
CREATE POLICY "Users can view own creations" ON public.creations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Allow users to insert their own creations
DROP POLICY IF EXISTS "Users can insert own creations" ON public.creations;
CREATE POLICY "Users can insert own creations" ON public.creations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to delete their own creations
DROP POLICY IF EXISTS "Users can delete own creations" ON public.creations;
CREATE POLICY "Users can delete own creations" ON public.creations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Allow users to update their own creations (if needed)
DROP POLICY IF EXISTS "Users can update own creations" ON public.creations;
CREATE POLICY "Users can update own creations" ON public.creations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

