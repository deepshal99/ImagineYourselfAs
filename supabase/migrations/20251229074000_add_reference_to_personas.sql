-- ============================================================================
-- ADD REFERENCE SUPPORT TO DISCOVERED_PERSONAS
-- ============================================================================

ALTER TABLE discovered_personas 
ADD COLUMN IF NOT EXISTS reference_image TEXT,
ADD COLUMN IF NOT EXISTS reference_description TEXT;
