-- Add jornada_id to quiniela_standings
ALTER TABLE quiniela_standings ADD COLUMN IF NOT EXISTS jornada_id UUID REFERENCES jornadas(id);
CREATE INDEX IF NOT EXISTS quiniela_standings_jornada_id_idx ON quiniela_standings(jornada_id); 