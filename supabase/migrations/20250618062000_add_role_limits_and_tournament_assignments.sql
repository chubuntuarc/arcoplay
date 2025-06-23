-- Create role_limits table for custom role configurations
CREATE TABLE IF NOT EXISTS role_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    max_quinielas INTEGER NOT NULL DEFAULT 1,
    max_participants INTEGER NOT NULL DEFAULT 5,
    max_tournaments INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create role_tournament_assignments table for specific tournament assignments per role
CREATE TABLE IF NOT EXISTS role_tournament_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name TEXT NOT NULL,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(role_name, tournament_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS role_limits_role_name_idx ON role_limits(role_name);
CREATE INDEX IF NOT EXISTS role_tournament_assignments_role_name_idx ON role_tournament_assignments(role_name);
CREATE INDEX IF NOT EXISTS role_tournament_assignments_tournament_id_idx ON role_tournament_assignments(tournament_id);

-- Enable RLS
ALTER TABLE role_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_tournament_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_limits
CREATE POLICY "Allow admins to manage role limits"
    ON role_limits FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- RLS Policies for role_tournament_assignments
CREATE POLICY "Allow admins to manage role tournament assignments"
    ON role_tournament_assignments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Create triggers for updated_at
CREATE TRIGGER update_role_limits_updated_at
    BEFORE UPDATE ON role_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default role limits
INSERT INTO role_limits (role_name, max_quinielas, max_participants, max_tournaments) VALUES
    ('user', 1, 5, 1),
    ('player', 3, 15, 3),
    ('pro', -1, 50, -1),
    ('premium', -1, -1, -1),
    ('admin', -1, -1, -1)
ON CONFLICT (role_name) DO NOTHING;

-- Insert default tournament assignments (all active tournaments for all roles)
INSERT INTO role_tournament_assignments (role_name, tournament_id)
SELECT 
    rl.role_name,
    t.id
FROM role_limits rl
CROSS JOIN tournaments t
WHERE t.is_active = true
ON CONFLICT (role_name, tournament_id) DO NOTHING; 