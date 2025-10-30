export type Database = {
  public: {
    Tables: {
      sampling_sites: {
        Row: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          county: string | null;
          population: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          latitude: number;
          longitude: number;
          county?: string | null;
          population?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          county?: string | null;
          population?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      virus_types: {
        Row: {
          id: string;
          name: string;
          scientific_name: string | null;
          description: string | null;
          symptoms: string[] | null;
          transmission: string | null;
          prevention_tips: string[] | null;
          severity_level: string;
          color_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          scientific_name?: string | null;
          description?: string | null;
          symptoms?: string[] | null;
          transmission?: string | null;
          prevention_tips?: string[] | null;
          severity_level?: string;
          color_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          scientific_name?: string | null;
          description?: string | null;
          symptoms?: string[] | null;
          transmission?: string | null;
          prevention_tips?: string[] | null;
          severity_level?: string;
          color_code?: string;
          created_at?: string;
        };
      };
      wastewater_readings: {
        Row: {
          id: string;
          site_id: string | null;
          virus_id: string | null;
          concentration_level: number | null;
          level_category: string;
          trend: string;
          sample_date: string;
          processed_date: string;
          confidence_score: number;
          raw_data: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          concentration_level?: number | null;
          level_category?: string;
          trend?: string;
          sample_date: string;
          processed_date?: string;
          confidence_score?: number;
          raw_data?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          concentration_level?: number | null;
          level_category?: string;
          trend?: string;
          sample_date?: string;
          processed_date?: string;
          confidence_score?: number;
          raw_data?: Record<string, any> | null;
          created_at?: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          site_id: string | null;
          virus_id: string | null;
          prediction_date: string;
          predicted_level: number | null;
          predicted_category: string | null;
          confidence_score: number | null;
          model_type: string;
          factors_used: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          prediction_date: string;
          predicted_level?: number | null;
          predicted_category?: string | null;
          confidence_score?: number | null;
          model_type?: string;
          factors_used?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          prediction_date?: string;
          predicted_level?: number | null;
          predicted_category?: string | null;
          confidence_score?: number | null;
          model_type?: string;
          factors_used?: Record<string, any> | null;
          created_at?: string;
        };
      };
      user_locations: {
        Row: {
          id: string;
          user_id: string;
          latitude: number | null;
          longitude: number | null;
          nearest_site_id: string | null;
          notification_radius_km: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude?: number | null;
          longitude?: number | null;
          nearest_site_id?: string | null;
          notification_radius_km?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number | null;
          longitude?: number | null;
          nearest_site_id?: string | null;
          notification_radius_km?: number;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          site_id: string | null;
          virus_id: string | null;
          alert_type: string;
          severity: string;
          message: string;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          site_id?: string | null;
          virus_id?: string | null;
          alert_type: string;
          severity?: string;
          message: string;
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          alert_type?: string;
          severity?: string;
          message?: string;
          sent_at?: string;
          read_at?: string | null;
        };
      };
      public_health_events: {
        Row: {
          id: string;
          event_type: string;
          title: string;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          severity: string;
          status: string;
          reported_at: string;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          title: string;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          severity?: string;
          status?: string;
          reported_at?: string;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          title?: string;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          severity?: string;
          status?: string;
          reported_at?: string;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      virus_metadata: {
        Row: {
          id: string;
          virus_id: string | null;
          etymology: string | null;
          taxonomy_family: string | null;
          taxonomy_genus: string | null;
          taxonomy_species: string | null;
          discovery_year: number | null;
          discovery_location: string | null;
          related_viruses: string[] | null;
          attack_rate_per_100k: number | null;
          seasonality: string | null;
          incubation_period_days: string | null;
          contagious_period_days: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          virus_id?: string | null;
          etymology?: string | null;
          taxonomy_family?: string | null;
          taxonomy_genus?: string | null;
          taxonomy_species?: string | null;
          discovery_year?: number | null;
          discovery_location?: string | null;
          related_viruses?: string[] | null;
          attack_rate_per_100k?: number | null;
          seasonality?: string | null;
          incubation_period_days?: string | null;
          contagious_period_days?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          virus_id?: string | null;
          etymology?: string | null;
          taxonomy_family?: string | null;
          taxonomy_genus?: string | null;
          taxonomy_species?: string | null;
          discovery_year?: number | null;
          discovery_location?: string | null;
          related_viruses?: string[] | null;
          attack_rate_per_100k?: number | null;
          seasonality?: string | null;
          incubation_period_days?: string | null;
          contagious_period_days?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      outbreak_sites: {
        Row: {
          id: string;
          site_type: string;
          name: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          city: string | null;
          county: string | null;
          virus_id: string | null;
          case_count: number;
          status: string;
          reported_date: string;
          resolved_date: string | null;
          severity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_type: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
          county?: string | null;
          virus_id?: string | null;
          case_count?: number;
          status?: string;
          reported_date: string;
          resolved_date?: string | null;
          severity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_type?: string;
          name?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
          county?: string | null;
          virus_id?: string | null;
          case_count?: number;
          status?: string;
          reported_date?: string;
          resolved_date?: string | null;
          severity?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      public_health_resources: {
        Row: {
          id: string;
          resource_type: string;
          name: string;
          address: string | null;
          latitude: number;
          longitude: number;
          city: string | null;
          county: string | null;
          phone: string | null;
          website: string | null;
          services: string[] | null;
          hours_of_operation: string | null;
          accepts_walkins: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resource_type: string;
          name: string;
          address?: string | null;
          latitude: number;
          longitude: number;
          city?: string | null;
          county?: string | null;
          phone?: string | null;
          website?: string | null;
          services?: string[] | null;
          hours_of_operation?: string | null;
          accepts_walkins?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resource_type?: string;
          name?: string;
          address?: string | null;
          latitude?: number;
          longitude?: number;
          city?: string | null;
          county?: string | null;
          phone?: string | null;
          website?: string | null;
          services?: string[] | null;
          hours_of_operation?: string | null;
          accepts_walkins?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_population_data: {
        Row: {
          id: string;
          site_id: string | null;
          total_population: number;
          population_density: number | null;
          median_age: number | null;
          vulnerable_population_pct: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id?: string | null;
          total_population: number;
          population_density?: number | null;
          median_age?: number | null;
          vulnerable_population_pct?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string | null;
          total_population?: number;
          population_density?: number | null;
          median_age?: number | null;
          vulnerable_population_pct?: number | null;
          updated_at?: string;
        };
      };
      alert_priorities: {
        Row: {
          id: string;
          site_id: string | null;
          virus_id: string | null;
          priority_score: number;
          danger_level: number | null;
          concentration_factor: number | null;
          proximity_factor: number | null;
          trend_factor: number | null;
          population_factor: number | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          priority_score: number;
          danger_level?: number | null;
          concentration_factor?: number | null;
          proximity_factor?: number | null;
          trend_factor?: number | null;
          population_factor?: number | null;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          priority_score?: number;
          danger_level?: number | null;
          concentration_factor?: number | null;
          proximity_factor?: number | null;
          trend_factor?: number | null;
          population_factor?: number | null;
          calculated_at?: string;
        };
      };
      time_series_snapshots: {
        Row: {
          id: string;
          site_id: string | null;
          virus_id: string | null;
          snapshot_date: string;
          concentration_level: number | null;
          level_category: string | null;
          trend_direction: string | null;
          comparison_to_previous_week: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          snapshot_date: string;
          concentration_level?: number | null;
          level_category?: string | null;
          trend_direction?: string | null;
          comparison_to_previous_week?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string | null;
          virus_id?: string | null;
          snapshot_date?: string;
          concentration_level?: number | null;
          level_category?: string | null;
          trend_direction?: string | null;
          comparison_to_previous_week?: number | null;
          created_at?: string;
        };
      };
      vaccination_locations: {
        Row: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          address: string;
          city: string;
          state: string;
          zip_code: string | null;
          phone: string | null;
          vaccines_available: any;
          hours_of_operation: string | null;
          walk_ins_accepted: boolean;
          appointment_required: boolean;
          capacity_per_day: number | null;
          website_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      healthcare_facilities: {
        Row: {
          id: string;
          name: string;
          facility_type: string;
          latitude: number;
          longitude: number;
          address: string;
          city: string;
          state: string;
          zip_code: string | null;
          phone: string | null;
          total_beds: number | null;
          icu_beds: number | null;
          emergency_services: boolean;
          testing_available: boolean;
          antiviral_distribution: boolean;
          accepts_insurance: any;
          hours_of_operation: string | null;
          website_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      pharmacies: {
        Row: {
          id: string;
          name: string;
          chain_name: string | null;
          latitude: number;
          longitude: number;
          address: string;
          city: string;
          state: string;
          zip_code: string | null;
          phone: string | null;
          antiviral_stock_status: string;
          has_drive_through: boolean;
          twenty_four_hour: boolean;
          accepts_insurance: any;
          hours_of_operation: string | null;
          website_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      sequencing_labs: {
        Row: {
          id: string;
          name: string;
          lab_type: string;
          latitude: number;
          longitude: number;
          address: string;
          city: string;
          state: string;
          zip_code: string | null;
          phone: string | null;
          sequencing_capabilities: any;
          sample_types_accepted: any;
          average_turnaround_days: number;
          max_daily_capacity: number | null;
          certification_level: string | null;
          website_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      sewersheds: {
        Row: {
          id: string;
          name: string;
          wastewater_utility: string;
          boundary_geojson: any;
          center_latitude: number;
          center_longitude: number;
          population_served: number;
          area_square_miles: number | null;
          treatment_plant_name: string | null;
          counties_covered: any;
          sampling_frequency: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};

export type SamplingSite = Database['public']['Tables']['sampling_sites']['Row'];
export type VirusType = Database['public']['Tables']['virus_types']['Row'];
export type WastewaterReading = Database['public']['Tables']['wastewater_readings']['Row'];
export type Prediction = Database['public']['Tables']['predictions']['Row'];
export type UserLocation = Database['public']['Tables']['user_locations']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type PublicHealthEvent = Database['public']['Tables']['public_health_events']['Row'];
export type VirusMetadata = Database['public']['Tables']['virus_metadata']['Row'];
export type OutbreakSite = Database['public']['Tables']['outbreak_sites']['Row'];
export type PublicHealthResource = Database['public']['Tables']['public_health_resources']['Row'];
export type SitePopulationData = Database['public']['Tables']['site_population_data']['Row'];
export type AlertPriority = Database['public']['Tables']['alert_priorities']['Row'];
export type TimeSeriesSnapshot = Database['public']['Tables']['time_series_snapshots']['Row'];
export type VaccinationLocation = Database['public']['Tables']['vaccination_locations']['Row'];
export type HealthcareFacility = Database['public']['Tables']['healthcare_facilities']['Row'];
export type Pharmacy = Database['public']['Tables']['pharmacies']['Row'];
export type SequencingLab = Database['public']['Tables']['sequencing_labs']['Row'];
export type Sewershed = Database['public']['Tables']['sewersheds']['Row'];
