-- Function to calculate points for a prediction
CREATE OR REPLACE FUNCTION calculate_prediction_points(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER
) RETURNS INTEGER AS $$
BEGIN
  -- Exact prediction: 3 points
  IF predicted_home = actual_home AND predicted_away = actual_away THEN
    RETURN 3;
  END IF;
  
  -- Correct result (win/loss/draw): 1 point
  IF (predicted_home > predicted_away AND actual_home > actual_away) OR
     (predicted_home < predicted_away AND actual_home < actual_away) OR
     (predicted_home = predicted_away AND actual_home = actual_away) THEN
    RETURN 1;
  END IF;
  
  -- Wrong prediction: 0 points
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update standings for a specific jornada
CREATE OR REPLACE FUNCTION update_standings_for_jornada(
  p_quiniela_id UUID,
  p_jornada_id UUID
) RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  user_points INTEGER;
  user_correct INTEGER;
  user_exact INTEGER;
BEGIN
  -- Get all participants for this quiniela
  FOR user_record IN 
    SELECT DISTINCT qp.user_id 
    FROM quiniela_participants qp 
    WHERE qp.quiniela_id = p_quiniela_id
  LOOP
    -- Calculate points for this user in this jornada
    SELECT 
      COALESCE(SUM(
        calculate_prediction_points(
          qp.home_score, 
          qp.away_score, 
          (m.score->>'home')::INTEGER, 
          (m.score->>'away')::INTEGER
        )
      ), 0) INTO user_points
    FROM quiniela_predictions qp
    JOIN matches m ON m.id = qp.match_id
    WHERE qp.quiniela_id = p_quiniela_id 
      AND qp.user_id = user_record.user_id
      AND m.jornada_id = p_jornada_id
      AND m.status = 'FT';
    
    -- Calculate correct predictions (1 point)
    SELECT 
      COALESCE(SUM(
        CASE WHEN 
          calculate_prediction_points(
            qp.home_score, 
            qp.away_score, 
            (m.score->>'home')::INTEGER, 
            (m.score->>'away')::INTEGER
          ) >= 1 THEN 1 ELSE 0 END
      ), 0) INTO user_correct
    FROM quiniela_predictions qp
    JOIN matches m ON m.id = qp.match_id
    WHERE qp.quiniela_id = p_quiniela_id 
      AND qp.user_id = user_record.user_id
      AND m.jornada_id = p_jornada_id
      AND m.status = 'FT';
    
    -- Calculate exact predictions (3 points)
    SELECT 
      COALESCE(SUM(
        CASE WHEN 
          calculate_prediction_points(
            qp.home_score, 
            qp.away_score, 
            (m.score->>'home')::INTEGER, 
            (m.score->>'away')::INTEGER
          ) = 3 THEN 1 ELSE 0 END
      ), 0) INTO user_exact
    FROM quiniela_predictions qp
    JOIN matches m ON m.id = qp.match_id
    WHERE qp.quiniela_id = p_quiniela_id 
      AND qp.user_id = user_record.user_id
      AND m.jornada_id = p_jornada_id
      AND m.status = 'FT';
    
    -- Insert or update standings for this jornada
    INSERT INTO quiniela_standings (
      quiniela_id, 
      user_id, 
      total_points, 
      correct_predictions, 
      exact_predictions, 
      week_number,
      jornada_id,
      updated_at
    ) VALUES (
      p_quiniela_id,
      user_record.user_id,
      user_points,
      user_correct,
      user_exact,
      1, -- Default week number, you might want to calculate this based on jornada
      p_jornada_id,
      NOW()
    )
    ON CONFLICT (quiniela_id, user_id, week_number)
    DO UPDATE SET
      total_points = EXCLUDED.total_points,
      correct_predictions = EXCLUDED.correct_predictions,
      exact_predictions = EXCLUDED.exact_predictions,
      jornada_id = EXCLUDED.jornada_id,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update general standings (all jornadas combined)
CREATE OR REPLACE FUNCTION update_general_standings(
  p_quiniela_id UUID
) RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  user_total_points INTEGER;
  user_total_correct INTEGER;
  user_total_exact INTEGER;
BEGIN
  -- Get all participants for this quiniela
  FOR user_record IN 
    SELECT DISTINCT qp.user_id 
    FROM quiniela_participants qp 
    WHERE qp.quiniela_id = p_quiniela_id
  LOOP
    -- Calculate total points across all jornadas
    SELECT 
      COALESCE(SUM(
        calculate_prediction_points(
          qp.home_score, 
          qp.away_score, 
          (m.score->>'home')::INTEGER, 
          (m.score->>'away')::INTEGER
        )
      ), 0) INTO user_total_points
    FROM quiniela_predictions qp
    JOIN matches m ON m.id = qp.match_id
    WHERE qp.quiniela_id = p_quiniela_id 
      AND qp.user_id = user_record.user_id
      AND m.status = 'FT';
    
    -- Calculate total correct predictions
    SELECT 
      COALESCE(SUM(
        CASE WHEN 
          calculate_prediction_points(
            qp.home_score, 
            qp.away_score, 
            (m.score->>'home')::INTEGER, 
            (m.score->>'away')::INTEGER
          ) >= 1 THEN 1 ELSE 0 END
      ), 0) INTO user_total_correct
    FROM quiniela_predictions qp
    JOIN matches m ON m.id = qp.match_id
    WHERE qp.quiniela_id = p_quiniela_id 
      AND qp.user_id = user_record.user_id
      AND m.status = 'FT';
    
    -- Calculate total exact predictions
    SELECT 
      COALESCE(SUM(
        CASE WHEN 
          calculate_prediction_points(
            qp.home_score, 
            qp.away_score, 
            (m.score->>'home')::INTEGER, 
            (m.score->>'away')::INTEGER
          ) = 3 THEN 1 ELSE 0 END
      ), 0) INTO user_total_exact
    FROM quiniela_predictions qp
    JOIN matches m ON m.id = qp.match_id
    WHERE qp.quiniela_id = p_quiniela_id 
      AND qp.user_id = user_record.user_id
      AND m.status = 'FT';
    
    -- Insert or update general standings (week_number = 0 for general)
    INSERT INTO quiniela_standings (
      quiniela_id, 
      user_id, 
      total_points, 
      correct_predictions, 
      exact_predictions, 
      week_number,
      jornada_id,
      updated_at
    ) VALUES (
      p_quiniela_id,
      user_record.user_id,
      user_total_points,
      user_total_correct,
      user_total_exact,
      0, -- 0 for general standings
      NULL, -- NULL for general standings
      NOW()
    )
    ON CONFLICT (quiniela_id, user_id, week_number)
    DO UPDATE SET
      total_points = EXCLUDED.total_points,
      correct_predictions = EXCLUDED.correct_predictions,
      exact_predictions = EXCLUDED.exact_predictions,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update standings when match status changes to 'FT'
CREATE OR REPLACE FUNCTION trigger_update_standings_on_match_finish()
RETURNS TRIGGER AS $$
DECLARE
  quiniela_record RECORD;
BEGIN
  -- Only trigger when status changes to 'FT' (finished)
  IF NEW.status = 'FT' AND (OLD.status IS NULL OR OLD.status != 'FT') THEN
    -- Get all quinielas that have predictions for this match
    FOR quiniela_record IN
      SELECT DISTINCT qp.quiniela_id
      FROM quiniela_predictions qp
      WHERE qp.match_id = NEW.id
    LOOP
      -- Update standings for the specific jornada
      IF NEW.jornada_id IS NOT NULL THEN
        PERFORM update_standings_for_jornada(quiniela_record.quiniela_id, NEW.jornada_id);
      END IF;
      
      -- Update general standings
      PERFORM update_general_standings(quiniela_record.quiniela_id);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on matches table
DROP TRIGGER IF EXISTS update_standings_on_match_finish ON matches;
CREATE TRIGGER update_standings_on_match_finish
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_standings_on_match_finish();

-- Add unique constraint for quiniela_standings to prevent duplicates
ALTER TABLE quiniela_standings 
ADD CONSTRAINT unique_quiniela_user_jornada 
UNIQUE (quiniela_id, user_id, jornada_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS quiniela_standings_jornada_user_idx 
ON quiniela_standings(quiniela_id, user_id, jornada_id); 