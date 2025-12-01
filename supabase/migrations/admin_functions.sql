-- ============================================================================
-- ADMIN FUNCTIONS FOR POSTERME DASHBOARD
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add email column to user_credits if it doesn't exist (for easier admin lookup)
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================================================
-- DISCOVERED PERSONAS TABLE (for custom/admin-added personas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovered_personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Movie',
  cover TEXT,
  prompt TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add ALL columns if they don't exist (for existing tables with incomplete schema)
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Movie';
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS cover TEXT;
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE discovered_personas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure ID column is TEXT (not UUID) to support custom IDs like "game_minecraft"
ALTER TABLE discovered_personas ALTER COLUMN id TYPE TEXT;

-- Enable RLS
ALTER TABLE discovered_personas ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Anyone can view visible personas" ON discovered_personas;
DROP POLICY IF EXISTS "Authenticated users can view all personas" ON discovered_personas;
DROP POLICY IF EXISTS "Authenticated can insert personas" ON discovered_personas;
DROP POLICY IF EXISTS "Authenticated can update personas" ON discovered_personas;
DROP POLICY IF EXISTS "Authenticated can delete personas" ON discovered_personas;
DROP POLICY IF EXISTS "Allow all for authenticated" ON discovered_personas;
DROP POLICY IF EXISTS "Public can view visible" ON discovered_personas;
DROP POLICY IF EXISTS "Public can view all" ON discovered_personas;

-- Simple policy: authenticated users can do everything
CREATE POLICY "Allow all for authenticated" ON discovered_personas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public/anonymous users can only read visible personas
-- (Actually, we need public to read ALL so the frontend knows what to hide)
CREATE POLICY "Public can view all" ON discovered_personas
  FOR SELECT TO anon USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_discovered_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_discovered_personas_timestamp ON discovered_personas;
CREATE TRIGGER update_discovered_personas_timestamp
  BEFORE UPDATE ON discovered_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_discovered_personas_updated_at();

-- Function to add credits to a user (admin only)
CREATE OR REPLACE FUNCTION admin_add_credits(
  target_user_id UUID,
  credit_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM user_credits
  WHERE user_id = target_user_id;
  
  IF current_credits IS NULL THEN
    -- User doesn't have a credits row, create one
    INSERT INTO user_credits (user_id, credits, is_unlimited)
    VALUES (target_user_id, credit_amount, false);
  ELSE
    -- Update existing credits
    UPDATE user_credits
    SET credits = credits + credit_amount
    WHERE user_id = target_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to set a user's credits to a specific value
CREATE OR REPLACE FUNCTION admin_set_credits(
  target_user_id UUID,
  new_credits INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_credits
  SET credits = new_credits
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits, is_unlimited)
    VALUES (target_user_id, new_credits, false);
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to get platform stats
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM user_credits),
    'total_generations', (SELECT COUNT(*) FROM creations),
    'total_credits_remaining', (SELECT COALESCE(SUM(credits), 0) FROM user_credits WHERE NOT is_unlimited),
    'unlimited_users', (SELECT COUNT(*) FROM user_credits WHERE is_unlimited),
    'generations_today', (SELECT COUNT(*) FROM creations WHERE created_at >= CURRENT_DATE),
    'generations_this_week', (SELECT COUNT(*) FROM creations WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get user details with generation count
CREATE OR REPLACE FUNCTION get_user_details(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', uc.user_id,
    'email', uc.email,
    'credits', uc.credits,
    'is_unlimited', uc.is_unlimited,
    'created_at', uc.created_at,
    'generation_count', (SELECT COUNT(*) FROM creations WHERE user_id = target_user_id),
    'last_generation', (SELECT MAX(created_at) FROM creations WHERE user_id = target_user_id)
  ) INTO result
  FROM user_credits uc
  WHERE uc.user_id = target_user_id;
  
  RETURN result;
END;
$$;

-- Trigger to sync email from auth.users to user_credits
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_credits
  SET email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
  WHERE user_id = NEW.user_id AND email IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_email_on_credit_change ON user_credits;
CREATE TRIGGER sync_email_on_credit_change
  AFTER INSERT OR UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Update existing records with emails
UPDATE user_credits uc
SET email = u.email
FROM auth.users u
WHERE uc.user_id = u.id AND uc.email IS NULL;

-- ============================================================================
-- STORAGE POLICIES (Fix for "row-level security policy" error on upload)
-- ============================================================================

-- 1. Ensure the 'creations' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('creations', 'creations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow authenticated users (like admins) to upload files
-- We drop first to avoid conflicts if you run this multiple times
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'creations');

-- 3. Allow public to view files (needed for displaying covers)
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
CREATE POLICY "Allow public view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creations');

-- 4. Allow authenticated users to update/overwrite files
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'creations');

-- ============================================================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_creations_user_id ON creations(user_id);
CREATE INDEX IF NOT EXISTS idx_creations_created_at ON creations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creations_persona_id ON creations(persona_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
