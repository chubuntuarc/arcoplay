-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create quinielas table
CREATE TABLE IF NOT EXISTS quinielas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create quiniela_participants table
CREATE TABLE IF NOT EXISTS quiniela_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiniela_id UUID NOT NULL REFERENCES quinielas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(quiniela_id, user_id)
);

-- Create quiniela_predictions table
CREATE TABLE IF NOT EXISTS quiniela_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiniela_id UUID NOT NULL REFERENCES quinielas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    home_score INTEGER,
    away_score INTEGER,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(quiniela_id, user_id, match_id)
);

-- Create quiniela_standings table for weekly rankings
CREATE TABLE IF NOT EXISTS quiniela_standings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiniela_id UUID NOT NULL REFERENCES quinielas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    exact_predictions INTEGER DEFAULT 0,
    week_number INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(quiniela_id, user_id, week_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS quinielas_creator_id_idx ON quinielas(creator_id);
CREATE INDEX IF NOT EXISTS quinielas_tournament_id_idx ON quinielas(tournament_id);
CREATE INDEX IF NOT EXISTS quiniela_participants_quiniela_id_idx ON quiniela_participants(quiniela_id);
CREATE INDEX IF NOT EXISTS quiniela_participants_user_id_idx ON quiniela_participants(user_id);
CREATE INDEX IF NOT EXISTS quiniela_predictions_quiniela_id_idx ON quiniela_predictions(quiniela_id);
CREATE INDEX IF NOT EXISTS quiniela_predictions_user_id_idx ON quiniela_predictions(user_id);
CREATE INDEX IF NOT EXISTS quiniela_predictions_match_id_idx ON quiniela_predictions(match_id);
CREATE INDEX IF NOT EXISTS quiniela_standings_quiniela_id_idx ON quiniela_standings(quiniela_id);
CREATE INDEX IF NOT EXISTS quiniela_standings_user_id_idx ON quiniela_standings(user_id);

-- Enable RLS on all tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quinielas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_standings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Allow all authenticated users to read tournaments"
    ON tournaments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admins to manage tournaments"
    ON tournaments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- RLS Policies for quinielas
CREATE POLICY "Allow users to read quinielas"
    ON quinielas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to create quinielas within their limits"
    ON quinielas FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (
                (users.role = 'user' AND (
                    SELECT COUNT(*) FROM quinielas 
                    WHERE creator_id = auth.uid()
                ) < 1) OR
                (users.role = 'player' AND (
                    SELECT COUNT(*) FROM quinielas 
                    WHERE creator_id = auth.uid()
                ) < 3) OR
                (users.role IN ('pro', 'premium', 'admin'))
            )
        )
    );

CREATE POLICY "Allow creators to update their quinielas"
    ON quinielas FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid());

CREATE POLICY "Allow creators to delete their quinielas"
    ON quinielas FOR DELETE
    TO authenticated
    USING (creator_id = auth.uid());

-- RLS Policies for quiniela_participants
CREATE POLICY "Allow users to read quiniela participants"
    ON quiniela_participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to join quinielas within their limits"
    ON quiniela_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN quinielas q ON q.id = quiniela_id
            WHERE u.id = auth.uid()
            AND (
                (u.role = 'user' AND (
                    SELECT COUNT(*) FROM quiniela_participants qp
                    JOIN quinielas q2 ON q2.id = qp.quiniela_id
                    WHERE qp.user_id = auth.uid()
                    AND q2.tournament_id = q.tournament_id
                ) < 5) OR
                (u.role = 'player' AND (
                    SELECT COUNT(*) FROM quiniela_participants qp
                    JOIN quinielas q2 ON q2.id = qp.quiniela_id
                    WHERE qp.user_id = auth.uid()
                    AND q2.tournament_id = q.tournament_id
                ) < 15) OR
                (u.role = 'pro' AND (
                    SELECT COUNT(*) FROM quiniela_participants qp
                    JOIN quinielas q2 ON q2.id = qp.quiniela_id
                    WHERE qp.user_id = auth.uid()
                    AND q2.tournament_id = q.tournament_id
                ) < 50) OR
                (u.role IN ('premium', 'admin'))
            )
        )
    );

CREATE POLICY "Allow users to leave quinielas"
    ON quiniela_participants FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for quiniela_predictions
CREATE POLICY "Allow users to read predictions"
    ON quiniela_predictions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow participants to create predictions"
    ON quiniela_predictions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quiniela_participants
            WHERE quiniela_id = quiniela_predictions.quiniela_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Allow participants to update their predictions"
    ON quiniela_predictions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for quiniela_standings
CREATE POLICY "Allow users to read standings"
    ON quiniela_standings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow system to update standings"
    ON quiniela_standings FOR ALL
    TO authenticated
    USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quinielas_updated_at
    BEFORE UPDATE ON quinielas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiniela_predictions_updated_at
    BEFORE UPDATE ON quiniela_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update current_participants count
CREATE OR REPLACE FUNCTION update_quiniela_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE quinielas 
        SET current_participants = current_participants + 1
        WHERE id = NEW.quiniela_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE quinielas 
        SET current_participants = current_participants - 1
        WHERE id = OLD.quiniela_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quiniela_participant_count_trigger
    AFTER INSERT OR DELETE ON quiniela_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_quiniela_participant_count(); 