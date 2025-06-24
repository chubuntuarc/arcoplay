-- Add active_jornada_id field to quinielas table
ALTER TABLE quinielas 
ADD COLUMN IF NOT EXISTS active_jornada_id UUID REFERENCES jornadas(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS quinielas_active_jornada_id_idx ON quinielas(active_jornada_id); 