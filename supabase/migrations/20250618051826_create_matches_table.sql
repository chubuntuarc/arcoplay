-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    api_id BIGINT UNIQUE NOT NULL,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    status TEXT NOT NULL,
    score JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on tournament_id for faster lookups
CREATE INDEX IF NOT EXISTS matches_tournament_id_idx ON matches(tournament_id);

-- Create index on date for faster sorting
CREATE INDEX IF NOT EXISTS matches_date_idx ON matches(date);

-- Create index on api_id for faster lookups
CREATE INDEX IF NOT EXISTS matches_api_id_idx ON matches(api_id);

-- Add RLS policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read matches" ON matches;
DROP POLICY IF EXISTS "Allow admins to insert matches" ON matches;
DROP POLICY IF EXISTS "Allow admins to update matches" ON matches;
DROP POLICY IF EXISTS "Allow admins to delete matches" ON matches;

-- Allow all authenticated users to read matches
CREATE POLICY "Allow authenticated users to read matches"
    ON matches FOR SELECT
    TO authenticated
    USING (true);

-- Allow only admins to insert/update/delete matches
CREATE POLICY "Allow admins to insert matches"
    ON matches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.role = 'admin'
            AND users.id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
        )
    );

CREATE POLICY "Allow admins to update matches"
    ON matches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.role = 'admin'
            AND users.id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
        )
    );

CREATE POLICY "Allow admins to delete matches"
    ON matches FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.role = 'admin'
            AND users.id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
        )
    );

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
