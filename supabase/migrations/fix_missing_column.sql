-- ============================================================================
-- FIX: MISSING UPDATED_AT COLUMN
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add updated_at column if it doesn't exist
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

