-- ============================================================================
-- ADD REFERENCE DESCRIPTION TO PERSONAS
-- ============================================================================

ALTER TABLE discovered_personas 
ADD COLUMN IF NOT EXISTS reference_description TEXT;
