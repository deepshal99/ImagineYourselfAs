-- ============================================================================
-- FIX: FINAL RLS POLICIES FOR USER CREDITS AND CREATIONS
-- Run this in your Supabase SQL Editor to resolve 403 errors
-- ============================================================================

-- 1. USER CREDITS TABLE
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own credits (optional, usually handled by server/Edge Functions, but safe if just checking user_id)
-- We strictly restrict updates to service role or specific functions usually, but for now we might leave it to service role/Edge Functions.
-- The Edge Function uses service role key, so it bypasses RLS. 
-- The client only needs SELECT.

-- 2. CREATIONS TABLE
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own creations
DROP POLICY IF EXISTS "Users can view own creations" ON public.creations;
CREATE POLICY "Users can view own creations" ON public.creations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own creations
DROP POLICY IF EXISTS "Users can insert own creations" ON public.creations;
CREATE POLICY "Users can insert own creations" ON public.creations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own creations
DROP POLICY IF EXISTS "Users can delete own creations" ON public.creations;
CREATE POLICY "Users can delete own creations" ON public.creations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. GENERATION FEEDBACK TABLE (If used)
ALTER TABLE public.generation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.generation_feedback;
CREATE POLICY "Users can insert own feedback" ON public.generation_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. STORAGE POLICIES (For creations bucket)
-- Ensure authenticated users can upload and view
-- NOTE: We skip enabling RLS on storage.objects as it requires superuser/owner permissions.
-- We only add policies which should work if you are the project owner.

-- Allow users to upload to their own folder in 'creations' bucket
DROP POLICY IF EXISTS "Users can upload own creations" ON storage.objects;
CREATE POLICY "Users can upload own creations" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'creations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own creations
DROP POLICY IF EXISTS "Users can view own creation files" ON storage.objects;
CREATE POLICY "Users can view own creation files" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'creations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to view creations (if sharing is allowed)
-- OR keep it private. Based on app logic, generated images might need to be public for sharing?
-- For now, let's allow public read for 'creations' if that fits the app model, or restrict.
-- The previous error didn't mention storage, but good to be safe.

