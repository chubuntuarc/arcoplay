-- Tabla de jornadas
CREATE TABLE IF NOT EXISTS jornadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    torneo_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo TEXT,
    numero INTEGER,
    UNIQUE (torneo_id, nombre)
);

-- Relacionar partidos con jornadas
ALTER TABLE matches ADD COLUMN IF NOT EXISTS jornada_id UUID REFERENCES jornadas(id);
