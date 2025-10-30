/*
  # Enhanced Features for Texas Wastewater Monitor

  ## Overview
  Adds comprehensive schema enhancements to support advanced features including:
  - Enhanced virus information with etymology and taxonomy
  - Outbreak site tracking (schools, nursing homes, restaurants)
  - Public health resource mapping (vaccination sites, clinics, hospitals)
  - Multi-pathogen comparison capabilities
  - Population-normalized metrics
  - Time-series historical data tracking
  - Alert priority ranking system

  ## New Tables

  ### 1. `virus_metadata`
  Extended virus information for educational component
  - `virus_id` (uuid, foreign key) - References virus_types
  - `etymology` (text) - Name origin and meaning
  - `taxonomy_family` (text) - Virus family classification
  - `taxonomy_genus` (text) - Genus classification
  - `taxonomy_species` (text) - Species classification
  - `discovery_year` (integer) - Year virus was discovered
  - `discovery_location` (text) - Where it was first identified
  - `related_viruses` (text[]) - Array of related virus names
  - `attack_rate_per_100k` (numeric) - Cases per 100k population
  - `seasonality` (text) - Seasonal patterns
  - `incubation_period_days` (text) - Typical incubation period
  - `contagious_period_days` (text) - How long patients are contagious

  ### 2. `outbreak_sites`
  Tracks specific locations with confirmed outbreaks
  - `id` (uuid, primary key)
  - `site_type` (text) - school, nursing_home, restaurant, workplace, etc.
  - `name` (text) - Name of facility
  - `address` (text) - Street address
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `city` (text) - City name
  - `county` (text) - County name
  - `virus_id` (uuid, foreign key) - References virus_types
  - `case_count` (integer) - Number of confirmed cases
  - `status` (text) - active, contained, resolved
  - `reported_date` (date) - When outbreak was reported
  - `resolved_date` (date) - When outbreak was resolved
  - `severity` (text) - low, medium, high, critical

  ### 3. `public_health_resources`
  Locations of vaccination sites, clinics, hospitals, testing centers
  - `id` (uuid, primary key)
  - `resource_type` (text) - vaccination_site, clinic, hospital, testing_center, antiviral_distribution
  - `name` (text) - Facility name
  - `address` (text) - Street address
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `city` (text) - City name
  - `county` (text) - County name
  - `phone` (text) - Contact phone
  - `website` (text) - Facility website
  - `services` (text[]) - Array of services offered
  - `hours_of_operation` (text) - Operating hours
  - `accepts_walkins` (boolean) - Walk-in availability
  - `active` (boolean) - Currently operational

  ### 4. `site_population_data`
  Population data for accurate per-capita calculations
  - `site_id` (uuid, foreign key) - References sampling_sites
  - `total_population` (integer) - Total population served
  - `population_density` (numeric) - People per square km
  - `median_age` (numeric) - Median age in area
  - `vulnerable_population_pct` (numeric) - % elderly/immunocompromised
  - `updated_at` (timestamptz) - Last data update

  ### 5. `alert_priorities`
  Stores calculated alert priority scores for ranking
  - `id` (uuid, primary key)
  - `site_id` (uuid, foreign key) - References sampling_sites
  - `virus_id` (uuid, foreign key) - References virus_types
  - `priority_score` (numeric) - Calculated priority (0-100)
  - `danger_level` (numeric) - Virus danger factor
  - `concentration_factor` (numeric) - Current concentration level
  - `proximity_factor` (numeric) - Distance to user
  - `trend_factor` (numeric) - Rate of change
  - `population_factor` (numeric) - Population at risk
  - `calculated_at` (timestamptz) - When score was calculated

  ### 6. `time_series_snapshots`
  Historical snapshots for time-series animation
  - `id` (uuid, primary key)
  - `site_id` (uuid, foreign key) - References sampling_sites
  - `virus_id` (uuid, foreign key) - References virus_types
  - `snapshot_date` (date) - Date of snapshot
  - `concentration_level` (numeric) - Level at that time
  - `level_category` (text) - Category at that time
  - `trend_direction` (text) - increasing, decreasing, stable
  - `comparison_to_previous_week` (numeric) - % change from prior week

  ## Indexes
  - Spatial indexes for location-based queries
  - Date indexes for time-series analysis
  - Foreign key indexes for joins

  ## Security
  - Enable RLS on all tables
  - Public read access for educational and map data
  - Allow public INSERT/UPDATE for data seeding and updates
*/

-- Create virus_metadata table
CREATE TABLE IF NOT EXISTS virus_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  virus_id uuid UNIQUE REFERENCES virus_types(id) ON DELETE CASCADE,
  etymology text,
  taxonomy_family text,
  taxonomy_genus text,
  taxonomy_species text,
  discovery_year integer,
  discovery_location text,
  related_viruses text[],
  attack_rate_per_100k numeric,
  seasonality text,
  incubation_period_days text,
  contagious_period_days text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create outbreak_sites table
CREATE TABLE IF NOT EXISTS outbreak_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_type text NOT NULL,
  name text NOT NULL,
  address text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  city text,
  county text,
  virus_id uuid REFERENCES virus_types(id) ON DELETE SET NULL,
  case_count integer DEFAULT 0,
  status text DEFAULT 'active',
  reported_date date NOT NULL,
  resolved_date date,
  severity text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create public_health_resources table
CREATE TABLE IF NOT EXISTS public_health_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  name text NOT NULL,
  address text,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  city text,
  county text,
  phone text,
  website text,
  services text[],
  hours_of_operation text,
  accepts_walkins boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_population_data table
CREATE TABLE IF NOT EXISTS site_population_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid UNIQUE REFERENCES sampling_sites(id) ON DELETE CASCADE,
  total_population integer NOT NULL,
  population_density numeric,
  median_age numeric,
  vulnerable_population_pct numeric,
  updated_at timestamptz DEFAULT now()
);

-- Create alert_priorities table
CREATE TABLE IF NOT EXISTS alert_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sampling_sites(id) ON DELETE CASCADE,
  virus_id uuid REFERENCES virus_types(id) ON DELETE CASCADE,
  priority_score numeric NOT NULL,
  danger_level numeric,
  concentration_factor numeric,
  proximity_factor numeric,
  trend_factor numeric,
  population_factor numeric,
  calculated_at timestamptz DEFAULT now()
);

-- Create time_series_snapshots table
CREATE TABLE IF NOT EXISTS time_series_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sampling_sites(id) ON DELETE CASCADE,
  virus_id uuid REFERENCES virus_types(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  concentration_level numeric,
  level_category text,
  trend_direction text,
  comparison_to_previous_week numeric,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_virus_metadata_virus ON virus_metadata(virus_id);
CREATE INDEX IF NOT EXISTS idx_outbreak_sites_virus ON outbreak_sites(virus_id);
CREATE INDEX IF NOT EXISTS idx_outbreak_sites_location ON outbreak_sites(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_outbreak_sites_status ON outbreak_sites(status);
CREATE INDEX IF NOT EXISTS idx_public_health_resources_type ON public_health_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_public_health_resources_location ON public_health_resources(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_alert_priorities_site ON alert_priorities(site_id);
CREATE INDEX IF NOT EXISTS idx_alert_priorities_score ON alert_priorities(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_time_series_date ON time_series_snapshots(snapshot_date DESC);

-- Enable Row Level Security
ALTER TABLE virus_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbreak_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_health_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_population_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_series_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Public can view virus metadata"
  ON virus_metadata FOR SELECT
  USING (true);

CREATE POLICY "Public can view outbreak sites"
  ON outbreak_sites FOR SELECT
  USING (true);

CREATE POLICY "Public can view public health resources"
  ON public_health_resources FOR SELECT
  USING (true);

CREATE POLICY "Public can view population data"
  ON site_population_data FOR SELECT
  USING (true);

CREATE POLICY "Public can view alert priorities"
  ON alert_priorities FOR SELECT
  USING (true);

CREATE POLICY "Public can view time series snapshots"
  ON time_series_snapshots FOR SELECT
  USING (true);

-- RLS Policies for public insert/update (for data seeding and automation)
CREATE POLICY "Allow public insert for virus metadata"
  ON virus_metadata FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for virus metadata"
  ON virus_metadata FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert for outbreak sites"
  ON outbreak_sites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for outbreak sites"
  ON outbreak_sites FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert for public health resources"
  ON public_health_resources FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for public health resources"
  ON public_health_resources FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert for population data"
  ON site_population_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for population data"
  ON site_population_data FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert for alert priorities"
  ON alert_priorities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for alert priorities"
  ON alert_priorities FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert for time series snapshots"
  ON time_series_snapshots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for time series snapshots"
  ON time_series_snapshots FOR UPDATE
  USING (true)
  WITH CHECK (true);
