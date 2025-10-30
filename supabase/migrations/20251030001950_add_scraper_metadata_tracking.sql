-- Add Scraper Metadata Tracking Schema
--
-- 1. New Tables
--    - data_collection_runs: Tracks each scraping execution
--    - data_source_configs: Manages data source configurations
--
-- 2. Security
--    - Enable RLS on both tables
--    - Service role can write, public can read run status
--
-- 3. Indexes for performance

-- Create data_collection_runs table
CREATE TABLE IF NOT EXISTS data_collection_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  records_collected integer DEFAULT 0,
  source_identifier text NOT NULL,
  execution_time_ms integer,
  error_details jsonb,
  data_quality_score numeric(3,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  created_at timestamptz DEFAULT now()
);

-- Create data_source_configs table
CREATE TABLE IF NOT EXISTS data_source_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 1,
  last_successful_run timestamptz,
  consecutive_failures integer DEFAULT 0,
  config_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collection_runs_date ON data_collection_runs(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_collection_runs_status ON data_collection_runs(status);
CREATE INDEX IF NOT EXISTS idx_collection_runs_source ON data_collection_runs(source_identifier);
CREATE INDEX IF NOT EXISTS idx_source_configs_priority ON data_source_configs(priority, is_active);

-- Enable RLS
ALTER TABLE data_collection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_collection_runs
CREATE POLICY "Public can view collection run status"
  ON data_collection_runs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert collection runs"
  ON data_collection_runs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for data_source_configs
CREATE POLICY "Public can view active data sources"
  ON data_source_configs
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Service role can manage data sources"
  ON data_source_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default data source configurations
INSERT INTO data_source_configs (source_name, is_active, priority, config_data)
VALUES 
  ('primary_feed', true, 1, '{"type": "web", "enabled": true}'::jsonb),
  ('backup_feed', true, 2, '{"type": "api", "enabled": true}'::jsonb),
  ('emergency_feed', false, 3, '{"type": "manual", "enabled": false}'::jsonb)
ON CONFLICT (source_name) DO NOTHING;