-- Enable RLS just in case (idempotent)
ALTER TABLE discovered_personas ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it conflicts (or just create a new one with a unique name)
DROP POLICY IF EXISTS "Allow public read access" ON discovered_personas;

-- Allow everyone (anon + authenticated) to read personas
CREATE POLICY "Allow public read access"
ON discovered_personas
FOR SELECT
TO public
USING (true);
