-- Migration to convert custom_ persona IDs to semantic IDs
-- This migration:
-- 1. Creates new records with semantic IDs
-- 2. Updates any references in generations table
-- 3. Deletes old custom_ records

-- First, let's see what we're dealing with
DO $$
DECLARE
    persona RECORD;
    new_id TEXT;
    prefix TEXT;
    slug TEXT;
BEGIN
    FOR persona IN 
        SELECT * FROM discovered_personas 
        WHERE id LIKE 'custom_%'
    LOOP
        -- Generate semantic ID
        prefix := lower(persona.category);
        slug := lower(persona.name);
        -- Remove special characters and replace spaces
        slug := regexp_replace(slug, '[^a-z0-9\s]', '', 'g');
        slug := regexp_replace(slug, '\s+', '_', 'g');
        slug := substring(slug, 1, 30);
        new_id := prefix || '_' || slug;
        
        RAISE NOTICE 'Migrating: % → %', persona.id, new_id;
        
        -- Check if new ID already exists
        IF EXISTS (SELECT 1 FROM discovered_personas WHERE id = new_id) THEN
            RAISE NOTICE 'Skipping % - already exists', new_id;
            CONTINUE;
        END IF;
        
        -- Insert new record with semantic ID
        INSERT INTO discovered_personas (
            id, name, category, cover, reference_image, reference_description,
            prompt, is_visible, display_order, created_at, updated_at
        ) VALUES (
            new_id, persona.name, persona.category, persona.cover, 
            persona.reference_image, persona.reference_description,
            persona.prompt, persona.is_visible, persona.display_order,
            persona.created_at, NOW()
        );
        
        -- Update any references in creations table
        UPDATE creations SET persona_id = new_id WHERE persona_id = persona.id;
        
        -- Delete old record
        DELETE FROM discovered_personas WHERE id = persona.id;
        
        RAISE NOTICE 'Successfully migrated: % → %', persona.id, new_id;
    END LOOP;
END $$;
