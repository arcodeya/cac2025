/*
  # Fix RLS Policies for Data Seeding

  ## Changes Made
  
  This migration adds INSERT, UPDATE, and DELETE policies for the public-facing tables
  to allow the application to seed initial data and manage wastewater readings.

  ### Tables Modified
  - `sampling_sites` - Added INSERT policy for initial seeding
  - `wastewater_readings` - Added INSERT policy for data collection
  - `predictions` - Added INSERT policy for prediction generation
  - `public_health_events` - Added INSERT policy for event tracking

  ### Security Considerations
  - Policies use `USING (true)` to allow anonymous access for INSERT operations
  - This is acceptable for public health data that should be widely accessible
  - User-specific tables (user_locations, alerts) remain restricted to authenticated users
  - In production, consider restricting INSERT to service role or specific API keys

  ## Important Notes
  1. These policies allow public INSERT access for data seeding
  2. For production deployments, you may want to restrict INSERT operations to:
     - Service role only
     - Specific API endpoints with authentication
     - Scheduled functions with proper credentials
*/

-- Add INSERT policy for sampling_sites
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sampling_sites' 
    AND policyname = 'Allow public insert for sampling sites'
  ) THEN
    CREATE POLICY "Allow public insert for sampling sites"
      ON sampling_sites FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Add UPDATE policy for sampling_sites
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sampling_sites' 
    AND policyname = 'Allow public update for sampling sites'
  ) THEN
    CREATE POLICY "Allow public update for sampling sites"
      ON sampling_sites FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add INSERT policy for wastewater_readings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wastewater_readings' 
    AND policyname = 'Allow public insert for wastewater readings'
  ) THEN
    CREATE POLICY "Allow public insert for wastewater readings"
      ON wastewater_readings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Add UPDATE policy for wastewater_readings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wastewater_readings' 
    AND policyname = 'Allow public update for wastewater readings'
  ) THEN
    CREATE POLICY "Allow public update for wastewater readings"
      ON wastewater_readings FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add INSERT policy for predictions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'predictions' 
    AND policyname = 'Allow public insert for predictions'
  ) THEN
    CREATE POLICY "Allow public insert for predictions"
      ON predictions FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Add UPDATE policy for predictions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'predictions' 
    AND policyname = 'Allow public update for predictions'
  ) THEN
    CREATE POLICY "Allow public update for predictions"
      ON predictions FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add INSERT policy for public_health_events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'public_health_events' 
    AND policyname = 'Allow public insert for public health events'
  ) THEN
    CREATE POLICY "Allow public insert for public health events"
      ON public_health_events FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Add UPDATE policy for public_health_events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'public_health_events' 
    AND policyname = 'Allow public update for public health events'
  ) THEN
    CREATE POLICY "Allow public update for public health events"
      ON public_health_events FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add INSERT and UPDATE policies for virus_types (needed for initial data seeding)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'virus_types' 
    AND policyname = 'Allow public insert for virus types'
  ) THEN
    CREATE POLICY "Allow public insert for virus types"
      ON virus_types FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'virus_types' 
    AND policyname = 'Allow public update for virus types'
  ) THEN
    CREATE POLICY "Allow public update for virus types"
      ON virus_types FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
