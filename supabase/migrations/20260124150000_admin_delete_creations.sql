-- Migration: Allow Admin to DELETE from creations table
-- Reason: Admin Dashboard enhancement to manage content
-- Date: 2026-01-24

-- Drop the previous "Select only" policy for admins if it exists
DROP POLICY IF EXISTS "Admin can view all creations" ON public.creations;
DROP POLICY IF EXISTS "Admin can manage all creations" ON public.creations;

-- Re-create policy with ALL permissions (Select, Insert, Update, Delete)
CREATE POLICY "Admin can manage all creations" ON public.creations
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'deepshal99@gmail.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'deepshal99@gmail.com'
  );
