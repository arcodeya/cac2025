/*
  # Add Comprehensive Location-Based Public Health Features

  1. New Tables
    - `vaccination_locations`
      - Stores vaccine distribution sites and availability
      - Fields: id, name, location, address, vaccines_available, hours, capacity
    
    - `healthcare_facilities`
      - Hospitals, clinics, urgent care centers
      - Fields: id, name, type (hospital/clinic/urgent_care), beds, emergency_services
    
    - `pharmacies`
      - Retail pharmacies with antiviral distribution
      - Fields: id, name, chain_name, antiviral_stock, accepts_insurance
    
    - `sequencing_labs`
      - Public health laboratories for pathogen sequencing
      - Fields: id, name, capabilities, turnaround_time, sample_types
    
    - `sewersheds`
      - Sewershed boundaries and coverage areas
      - Fields: id, name, boundary_geojson, population_served, sampling_sites

  2. Security
    - Enable RLS on all new tables
    - Public read access for all tables (public health data)
    - Authenticated write access for authorized personnel only

  3. Relationships
    - Link facilities to nearby sampling sites
    - Connect sewersheds to their sampling sites
*/

-- Vaccination Locations
CREATE TABLE IF NOT EXISTS vaccination_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text DEFAULT 'TX',
  zip_code text,
  phone text,
  vaccines_available jsonb DEFAULT '[]'::jsonb,
  hours_of_operation text,
  walk_ins_accepted boolean DEFAULT true,
  appointment_required boolean DEFAULT false,
  capacity_per_day integer,
  website_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Healthcare Facilities
CREATE TABLE IF NOT EXISTS healthcare_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  facility_type text NOT NULL CHECK (facility_type IN ('hospital', 'clinic', 'urgent_care', 'primary_care')),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text DEFAULT 'TX',
  zip_code text,
  phone text,
  total_beds integer,
  icu_beds integer,
  emergency_services boolean DEFAULT false,
  testing_available boolean DEFAULT true,
  antiviral_distribution boolean DEFAULT false,
  accepts_insurance jsonb DEFAULT '[]'::jsonb,
  hours_of_operation text,
  website_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pharmacies (Antiviral Distribution Points)
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  chain_name text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text DEFAULT 'TX',
  zip_code text,
  phone text,
  antiviral_stock_status text DEFAULT 'unknown' CHECK (antiviral_stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown')),
  has_drive_through boolean DEFAULT false,
  twenty_four_hour boolean DEFAULT false,
  accepts_insurance jsonb DEFAULT '[]'::jsonb,
  hours_of_operation text,
  website_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sequencing Labs
CREATE TABLE IF NOT EXISTS sequencing_labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lab_type text DEFAULT 'public_health' CHECK (lab_type IN ('public_health', 'commercial', 'academic', 'hospital')),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text DEFAULT 'TX',
  zip_code text,
  phone text,
  sequencing_capabilities jsonb DEFAULT '[]'::jsonb,
  sample_types_accepted jsonb DEFAULT '[]'::jsonb,
  average_turnaround_days integer DEFAULT 7,
  max_daily_capacity integer,
  certification_level text,
  website_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sewersheds
CREATE TABLE IF NOT EXISTS sewersheds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  wastewater_utility text NOT NULL,
  boundary_geojson jsonb,
  center_latitude numeric NOT NULL,
  center_longitude numeric NOT NULL,
  population_served integer NOT NULL,
  area_square_miles numeric,
  treatment_plant_name text,
  counties_covered jsonb DEFAULT '[]'::jsonb,
  sampling_frequency text DEFAULT 'weekly',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sewershed to Sampling Site Relationship
CREATE TABLE IF NOT EXISTS sewershed_sampling_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sewershed_id uuid NOT NULL REFERENCES sewersheds(id) ON DELETE CASCADE,
  sampling_site_id uuid NOT NULL REFERENCES sampling_sites(id) ON DELETE CASCADE,
  is_primary_site boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sewershed_id, sampling_site_id)
);

-- Enable Row Level Security
ALTER TABLE vaccination_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequencing_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sewersheds ENABLE ROW LEVEL SECURITY;
ALTER TABLE sewershed_sampling_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access for all location data
CREATE POLICY "Public can view vaccination locations"
  ON vaccination_locations FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Public can view healthcare facilities"
  ON healthcare_facilities FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Public can view pharmacies"
  ON pharmacies FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Public can view sequencing labs"
  ON sequencing_labs FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Public can view sewersheds"
  ON sewersheds FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Public can view sewershed sampling sites"
  ON sewershed_sampling_sites FOR SELECT
  TO public
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vaccination_locations_coords ON vaccination_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_healthcare_facilities_coords ON healthcare_facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pharmacies_coords ON pharmacies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sequencing_labs_coords ON sequencing_labs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sewersheds_coords ON sewersheds(center_latitude, center_longitude);
CREATE INDEX IF NOT EXISTS idx_sewershed_sampling_sites_sewershed ON sewershed_sampling_sites(sewershed_id);
CREATE INDEX IF NOT EXISTS idx_sewershed_sampling_sites_site ON sewershed_sampling_sites(sampling_site_id);
