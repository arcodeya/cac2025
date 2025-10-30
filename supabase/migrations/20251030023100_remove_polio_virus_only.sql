/*
  # Remove Polio Virus

  Removes the Polio virus type and all related wastewater readings.
*/

DELETE FROM wastewater_readings WHERE virus_id IN (SELECT id FROM virus_types WHERE name = 'Polio');
DELETE FROM predictions WHERE virus_id IN (SELECT id FROM virus_types WHERE name = 'Polio');
DELETE FROM alerts WHERE virus_id IN (SELECT id FROM virus_types WHERE name = 'Polio');
DELETE FROM virus_types WHERE name = 'Polio';
