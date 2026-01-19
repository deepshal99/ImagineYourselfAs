-- Drop redundant/conflicting read policies
DROP POLICY IF EXISTS "Everyone can see discovered personas" ON discovered_personas;
DROP POLICY IF EXISTS "personas_read_all" ON discovered_personas;

-- Drop insecure write policy (ANY authenticated user could write!)
DROP POLICY IF EXISTS "personas_manage_authenticated" ON discovered_personas;

-- At this point, only "Admin can manage discovered_personas" and "Allow public read access" should remain.
