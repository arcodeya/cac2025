import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CollectionResult {
  success: boolean;
  recordsCollected: number;
  source: string;
  executionTime: number;
  byVirus: Record<string, number>;
  errors?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting multi-pathogen data collection from CDC NWSS...');

    const { data: viruses } = await supabase.from('virus_types').select('id, name');
    if (!viruses) {
      throw new Error('Failed to fetch virus types from database');
    }

    let totalRecords = 0;
    const recordsByVirus: Record<string, number> = {};

    const covidData = await collectCOVID19Data();
    console.log(`Collected ${covidData.length} COVID-19 records`);
    const covidProcessed = await processCOVID19Data(covidData, supabase, viruses);
    recordsByVirus['COVID-19'] = covidProcessed;
    totalRecords += covidProcessed;

    const fluData = await collectInfluenzaAData();
    console.log(`Collected ${fluData.length} Influenza A records`);
    const fluProcessed = await processInfluenzaAData(fluData, supabase, viruses);
    recordsByVirus['Influenza A'] = fluProcessed;
    totalRecords += fluProcessed;

    await supabase
      .from('data_source_configs')
      .update({
        last_successful_run: new Date().toISOString(),
        consecutive_failures: 0,
        updated_at: new Date().toISOString()
      })
      .eq('source_name', 'backup_feed');

    const executionTime = Date.now() - startTime;
    const dataQualityScore = calculateQualityScore(totalRecords);

    await supabase.from('data_collection_runs').insert({
      run_date: new Date().toISOString(),
      status: 'success',
      records_collected: totalRecords,
      source_identifier: 'cdc_nwss_multi_pathogen',
      execution_time_ms: executionTime,
      data_quality_score: dataQualityScore,
      error_details: errors.length > 0 ? { warnings: errors } : null,
    });

    const result: CollectionResult = {
      success: true,
      recordsCollected: totalRecords,
      source: 'cdc_nwss',
      executionTime,
      byVirus: recordsByVirus,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('Collection failed:', error.message);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('data_collection_runs').insert({
        run_date: new Date().toISOString(),
        status: 'failed',
        records_collected: 0,
        source_identifier: 'cdc_nwss',
        execution_time_ms: executionTime,
        error_details: { error: error.message, stack: errors },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        executionTime
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function collectCOVID19Data(): Promise<any[]> {
  const apiUrl = 'https://data.cdc.gov/resource/2ew6-ywp6.json';

  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    const url = `${apiUrl}?$where=date_end>'${dateFilter}'&$limit=50000&$order=date_end DESC`;

    console.log('Fetching COVID-19 data from CDC NWSS...');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PublicHealthMonitor/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CDC COVID-19 API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid COVID-19 data format from CDC');
    }

    return data;
  } catch (error: any) {
    console.error('COVID-19 collection error:', error.message);
    return [];
  }
}

async function collectInfluenzaAData(): Promise<any[]> {
  const apiUrl = 'https://data.cdc.gov/resource/ymmh-divb.json';

  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    const url = `${apiUrl}?$where=sample_collect_date>'${dateFilter}' AND pcr_target='fluav'&$limit=50000&$order=sample_collect_date DESC`;

    console.log('Fetching Influenza A data from CDC NWSS...');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PublicHealthMonitor/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CDC Influenza A API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid Influenza A data format from CDC');
    }

    return data;
  } catch (error: any) {
    console.error('Influenza A collection error:', error.message);
    return [];
  }
}

async function processCOVID19Data(rawData: any[], supabase: any, viruses: any[]): Promise<number> {
  if (rawData.length === 0) return 0;

  const covidVirus = viruses.find((v: any) => v.name === 'COVID-19');
  if (!covidVirus) {
    console.error('COVID-19 virus type not found in database');
    return 0;
  }

  const processedRecords = [];
  const latestByLocation = new Map<string, any>();

  for (const record of rawData) {
    if (!record.county_names || !record.percentile || !record.reporting_jurisdiction) continue;

    const key = `${record.reporting_jurisdiction}-${record.county_names}-${record.wwtp_id}`.toLowerCase();
    const existing = latestByLocation.get(key);

    if (!existing || new Date(record.date_end) > new Date(existing.date_end)) {
      latestByLocation.set(key, record);
    }
  }

  console.log(`Processing ${latestByLocation.size} unique COVID-19 locations`);

  for (const record of latestByLocation.values()) {
    const state = record.reporting_jurisdiction || record.wwtp_jurisdiction;
    const counties = record.county_names.split(',').map((c: string) => c.trim());
    const primaryCounty = counties[0];

    let site = await findOrCreateSite(supabase, primaryCounty, state, record);
    if (!site) continue;

    const percentile = parseFloat(record.percentile);
    const level = calculateLevelFromPercentile(percentile);

    processedRecords.push({
      site_id: site.id,
      virus_id: covidVirus.id,
      concentration_level: percentile,
      level_category: level,
      trend: record.ptc_15d ? calculateTrend(parseFloat(record.ptc_15d)) : 'stable',
      sample_date: record.date_end,
      processed_date: new Date().toISOString(),
      confidence_score: 0.95,
      raw_data: {
        source: 'cdc_nwss',
        dataset: '2ew6-ywp6',
        virus: 'COVID-19',
        wwtp_id: record.wwtp_id,
        state: state,
        county: record.county_names,
        population_served: record.population_served,
        detect_prop_15d: record.detect_prop_15d,
        ptc_15d: record.ptc_15d,
      },
    });
  }

  if (processedRecords.length > 0) {
    const { error } = await supabase
      .from('wastewater_readings')
      .upsert(processedRecords, {
        onConflict: 'site_id,virus_id,sample_date',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('COVID-19 database upsert error:', error);
      return 0;
    }

    console.log(`Inserted ${processedRecords.length} COVID-19 records`);
  }

  return processedRecords.length;
}

async function processInfluenzaAData(rawData: any[], supabase: any, viruses: any[]): Promise<number> {
  if (rawData.length === 0) return 0;

  const fluVirus = viruses.find((v: any) => v.name === 'Influenza A');
  if (!fluVirus) {
    console.error('Influenza A virus type not found in database');
    return 0;
  }

  const processedRecords = [];
  const latestByLocation = new Map<string, any>();

  for (const record of rawData) {
    if (!record.counties_served || !record.wwtp_jurisdiction) continue;

    const key = `${record.wwtp_jurisdiction}-${record.counties_served}-${record.sewershed_id}`.toLowerCase();
    const existing = latestByLocation.get(key);

    if (!existing || new Date(record.sample_collect_date) > new Date(existing.sample_collect_date)) {
      latestByLocation.set(key, record);
    }
  }

  console.log(`Processing ${latestByLocation.size} unique Influenza A locations`);

  for (const record of latestByLocation.values()) {
    const state = record.wwtp_jurisdiction;
    const counties = record.counties_served.split(',').map((c: string) => c.trim());
    const primaryCounty = counties[0];

    let site = await findOrCreateSite(supabase, primaryCounty, state, record);
    if (!site) continue;

    const concentration = parseFloat(record.pcr_target_avg_conc || '0');
    const level = calculateInfluenzaLevel(concentration);
    const trend = 'stable';

    processedRecords.push({
      site_id: site.id,
      virus_id: fluVirus.id,
      concentration_level: concentration,
      level_category: level,
      trend: trend,
      sample_date: record.sample_collect_date,
      processed_date: new Date().toISOString(),
      confidence_score: 0.90,
      raw_data: {
        source: 'cdc_nwss',
        dataset: 'ymmh-divb',
        virus: 'Influenza A',
        sewershed_id: record.sewershed_id,
        state: state,
        county: record.counties_served,
        population_served: record.population_served,
        pcr_type: record.pcr_type,
        concentration_method: record.concentration_method,
      },
    });
  }

  if (processedRecords.length > 0) {
    const { error } = await supabase
      .from('wastewater_readings')
      .upsert(processedRecords, {
        onConflict: 'site_id,virus_id,sample_date',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Influenza A database upsert error:', error);
      return 0;
    }

    console.log(`Inserted ${processedRecords.length} Influenza A records`);
  }

  return processedRecords.length;
}

async function findOrCreateSite(supabase: any, county: string, state: string, record: any): Promise<any> {
  const siteName = `${county} County, ${state}`;

  const { data: existing } = await supabase
    .from('sampling_sites')
    .select('id, name')
    .eq('name', siteName)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const coords = await getCountyCoordinates(county, state);

  if (!isValidTexasCoordinate(coords.lat, coords.lng)) {
    console.warn(`Skipping site with invalid Texas coordinates: ${siteName} (${coords.lat}, ${coords.lng})`);
    return null;
  }

  const { data: newSite, error } = await supabase
    .from('sampling_sites')
    .insert({
      name: siteName,
      county: county,
      state: state,
      latitude: coords.lat,
      longitude: coords.lng,
      zip_code: '00000',
      population: parseInt(record.population_served || '10000'),
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error(`Failed to create site for ${siteName}:`, error);
    return null;
  }

  console.log(`Created new site: ${siteName}`);
  return newSite;
}

function isValidTexasCoordinate(lat: number, lng: number): boolean {
  return lat >= 25.8 && lat <= 36.5 && lng >= -106.65 && lng <= -93.5;
}

async function getCountyCoordinates(county: string, state: string): Promise<{ lat: number; lng: number }> {
  const countyCoords: Record<string, { lat: number; lng: number }> = {
    'harris-texas': { lat: 29.7604, lng: -95.3698 },
    'dallas-texas': { lat: 32.7767, lng: -96.7970 },
    'travis-texas': { lat: 30.2672, lng: -97.7431 },
    'bexar-texas': { lat: 29.4241, lng: -98.4936 },
    'tarrant-texas': { lat: 32.7555, lng: -97.3308 },
    'collin-texas': { lat: 33.1972, lng: -96.6397 },
    'denton-texas': { lat: 33.2148, lng: -97.1331 },
    'el paso-texas': { lat: 31.7619, lng: -106.4850 },
    'fort bend-texas': { lat: 29.5697, lng: -95.7497 },
    'hidalgo-texas': { lat: 26.1998, lng: -98.1229 },
    'montgomery-texas': { lat: 30.3213, lng: -95.4776 },
    'williamson-texas': { lat: 30.6419, lng: -97.6038 },
    'cameron-texas': { lat: 26.1315, lng: -97.4962 },
    'nueces-texas': { lat: 27.8006, lng: -97.3964 },
    'bell-texas': { lat: 31.0696, lng: -97.4844 },
    'galveston-texas': { lat: 29.3013, lng: -94.7977 },
    'brazoria-texas': { lat: 29.1686, lng: -95.4316 },
    'webb-texas': { lat: 27.5306, lng: -99.4803 },
    'lubbock-texas': { lat: 33.5779, lng: -101.8552 },
    'los angeles-california': { lat: 34.0522, lng: -118.2437 },
    'cook-illinois': { lat: 41.8781, lng: -87.6298 },
    'maricopa-arizona': { lat: 33.4484, lng: -112.0740 },
    'king-washington': { lat: 47.6062, lng: -122.3321 },
    'miami-dade-florida': { lat: 25.7617, lng: -80.1918 },
  };

  const key = `${county.toLowerCase()}-${state.toLowerCase()}`;

  if (countyCoords[key]) {
    return countyCoords[key];
  }

  return { lat: 30.2672, lng: -97.7431 };
}

function calculateLevelFromPercentile(percentile: number): string {
  if (percentile < 25) return 'low';
  if (percentile < 75) return 'medium';
  return 'high';
}

function calculateInfluenzaLevel(concentration: number): string {
  if (concentration < 50) return 'low';
  if (concentration < 500) return 'medium';
  return 'high';
}

function calculateTrend(ptc15d: number): string {
  if (ptc15d > 100) return 'increasing';
  if (ptc15d < -100) return 'decreasing';
  return 'stable';
}

function calculateQualityScore(records: number): number {
  if (records === 0) return 0;
  const expectedRecords = 100;
  const completeness = Math.min(1, records / expectedRecords);
  return Math.max(0, Math.min(1, completeness));
}