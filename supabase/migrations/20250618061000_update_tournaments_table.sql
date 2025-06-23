-- Add missing columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Only update the first tournament without a slug to avoid unique constraint errors
WITH to_update AS (
  SELECT id FROM tournaments WHERE slug IS NULL LIMIT 1
)
UPDATE tournaments
SET slug = 'ligamx-clausura-2025',
    is_active = true
WHERE id IN (SELECT id FROM to_update);

-- Assign a unique slug to all tournaments that still have slug IS NULL
UPDATE tournaments
SET slug = 'tournament-' || id
WHERE slug IS NULL;

-- Make slug NOT NULL after setting default values
ALTER TABLE tournaments ALTER COLUMN slug SET NOT NULL;

-- Create index on slug
CREATE INDEX IF NOT EXISTS tournaments_slug_idx ON tournaments(slug);

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tournaments_updated_at') THEN
        CREATE TRIGGER update_tournaments_updated_at
            BEFORE UPDATE ON tournaments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default tournament if it doesn't exist
INSERT INTO tournaments (name, slug, description, is_active) 
VALUES ('Liga MX - Clausura 2025', 'ligamx-clausura-2025', 'Torneo de Clausura 2025 de la Liga MX', true)
ON CONFLICT (slug) DO NOTHING; 