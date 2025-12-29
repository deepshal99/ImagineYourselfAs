-- ============================================================================
-- ADD REFERENCE IMAGE TO PERSONAS
-- ============================================================================

ALTER TABLE discovered_personas 
ADD COLUMN IF NOT EXISTS reference_image TEXT;
