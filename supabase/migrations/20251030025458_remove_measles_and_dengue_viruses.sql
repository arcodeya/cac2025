/*
  # Remove Measles and Dengue Virus Types

  ## Summary
  Removes Measles and Dengue virus types from the database as they are not relevant
  for wastewater surveillance monitoring in the United States.

  ## Changes Made
  1. Delete all wastewater readings for Measles and Dengue
  2. Delete all predictions for Measles and Dengue
  3. Delete all alerts for Measles and Dengue  
  4. Delete all virus metadata for Measles and Dengue
  5. Remove Measles and Dengue from virus_types table

  ## Reason
  - Measles: Not tracked via wastewater in U.S. (tracked through case reporting)
  - Dengue: Mosquito-borne disease, not a wastewater surveillance target in Texas

  ## Data Sources
  App now focuses on:
  - COVID-19 (real CDC data)
  - Influenza A (real CDC data)
  - Influenza B (simulated data)
  - RSV (simulated data)
*/

-- Delete wastewater readings for Measles and Dengue
DELETE FROM wastewater_readings 
WHERE virus_id IN (
  SELECT id FROM virus_types WHERE name IN ('Measles', 'Dengue')
);

-- Delete predictions for Measles and Dengue
DELETE FROM predictions 
WHERE virus_id IN (
  SELECT id FROM virus_types WHERE name IN ('Measles', 'Dengue')
);

-- Delete alerts for Measles and Dengue
DELETE FROM alerts 
WHERE virus_id IN (
  SELECT id FROM virus_types WHERE name IN ('Measles', 'Dengue')
);

-- Delete virus metadata for Measles and Dengue (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'virus_metadata') THEN
    DELETE FROM virus_metadata 
    WHERE virus_id IN (
      SELECT id FROM virus_types WHERE name IN ('Measles', 'Dengue')
    );
  END IF;
END $$;

-- Finally, remove the virus types themselves
DELETE FROM virus_types WHERE name IN ('Measles', 'Dengue');
