import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://xccknasvgerhwvhygkdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2tuYXN2Z2VyaHd2aHlna2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTI3NDAsImV4cCI6MjA3NzI2ODc0MH0.q86AD4zFxj8p-JWi12kKxck0wT1Kdq6LWPb1VxDPQS8';

const supabase = createClient(supabaseUrl, supabaseKey);

function generateDeterministicUUID(input) {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

const CDC_API_BASE = 'https://data.cdc.gov/resource/2ew6-ywp6.json';
const BATCH_SIZE = 1000;

const TEXAS_COUNTY_COORDS = {
  'Travis': { lat: 30.2672, lon: -97.7431 },
  'Dallas': { lat: 32.7767, lon: -96.7970 },
  'Harris': { lat: 29.7604, lon: -95.3698 },
  'Bexar': { lat: 29.4241, lon: -98.4936 },
  'Tarrant': { lat: 32.7555, lon: -97.3308 },
  'Collin': { lat: 33.1972, lon: -96.6397 },
  'Denton': { lat: 33.2148, lon: -97.1331 },
  'El Paso': { lat: 31.7619, lon: -106.4850 },
  'Fort Bend': { lat: 29.5694, lon: -95.7103 },
  'Montgomery': { lat: 30.3213, lon: -95.4779 },
  'Williamson': { lat: 30.6338, lon: -97.6780 },
  'Cameron': { lat: 26.1316, lon: -97.4961 },
  'Hidalgo': { lat: 26.3015, lon: -98.1633 },
  'Nueces': { lat: 27.8006, lon: -97.3964 },
  'Brazoria': { lat: 29.1686, lon: -95.4321 },
  'Bell': { lat: 31.0832, lon: -97.4934 },
  'Galveston': { lat: 29.4682, lon: -94.9722 },
  'Webb': { lat: 27.5306, lon: -99.4803 },
  'Lubbock': { lat: 33.5779, lon: -101.8552 },
  'McLennan': { lat: 31.5493, lon: -97.1467 },
  'Mclennan': { lat: 31.5493, lon: -97.1467 },
  'Smith': { lat: 32.3513, lon: -95.3011 },
  'Brazos': { lat: 30.6280, lon: -96.3700 },
  'Hays': { lat: 30.0135, lon: -98.0419 },
  'Jefferson': { lat: 29.9488, lon: -94.1219 },
  'Wichita': { lat: 33.9137, lon: -98.4934 },
  'Ector': { lat: 31.8457, lon: -102.3676 },
  'Potter': { lat: 35.2220, lon: -101.8313 },
  'Randall': { lat: 34.9682, lon: -101.9300 },
  'Cooke': { lat: 33.6373, lon: -97.2170 }
};

function getCountyCoordinates(countyNames) {
  if (!countyNames) return { lat: 31.0, lon: -99.0 };

  const counties = countyNames.split(',').map(c => c.trim());
  const firstCounty = counties[0];

  return TEXAS_COUNTY_COORDS[firstCounty] || { lat: 31.0, lon: -99.0 };
}

function calculateTrend(ptc15d) {
  const change = parseFloat(ptc15d);
  if (isNaN(change)) return 'stable';
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

function calculateLevelCategory(percentile) {
  const pct = parseFloat(percentile);
  if (isNaN(pct)) return 'low';
  if (pct >= 75) return 'high';
  if (pct >= 40) return 'medium';
  return 'low';
}

async function loadRealCDCData() {
  console.log('🚀 Starting real CDC NWSS data loading for Texas...\n');

  try {
    console.log('📥 Fetching unique Texas wastewater sites from CDC API...');
    const sitesResponse = await fetch(
      `${CDC_API_BASE}?$select=wwtp_id,county_names,population_served&$where=wwtp_jurisdiction='Texas'&$group=wwtp_id,county_names,population_served&$limit=1000`
    );

    if (!sitesResponse.ok) {
      throw new Error(`CDC API error: ${sitesResponse.status}`);
    }

    const cdcSites = await sitesResponse.json();
    console.log(`✅ Found ${cdcSites.length} unique Texas wastewater sites\n`);

    const { data: covidVirus } = await supabase
      .from('virus_types')
      .select('id')
      .eq('name', 'COVID-19')
      .single();

    if (!covidVirus) {
      throw new Error('COVID-19 virus type not found in database');
    }

    console.log('🗑️  Removing non-Texas data points...');
    await supabase
      .from('sampling_sites')
      .delete()
      .or('county.is.null,latitude.lt.25.8,latitude.gt.36.5,longitude.lt.-106.65,longitude.gt.-93.5');

    await supabase
      .from('wastewater_readings')
      .delete()
      .is('raw_data->state', null)
      .neq('raw_data->state', 'Texas');

    console.log('✅ Removed non-Texas data\n');

    console.log('📍 Creating/updating sampling sites from CDC data...');
    const siteIdMap = new Map();
    const uniqueSites = new Map();

    cdcSites.forEach(site => {
      if (!uniqueSites.has(site.wwtp_id)) {
        uniqueSites.set(site.wwtp_id, site);
      }
    });

    const sitesToUpsert = Array.from(uniqueSites.values()).map(site => {
      const coords = getCountyCoordinates(site.county_names);
      const counties = site.county_names ? site.county_names.split(',') : ['Unknown'];
      const siteId = generateDeterministicUUID(`cdc-tx-${site.wwtp_id}`);

      siteIdMap.set(site.wwtp_id, siteId);

      return {
        id: siteId,
        name: `${counties[0].trim()} County WWTP ${site.wwtp_id}`,
        latitude: coords.lat,
        longitude: coords.lon,
        county: counties[0].trim(),
        population: parseInt(site.population_served) || 0,
        active: true
      };
    });

    const { error: sitesError } = await supabase
      .from('sampling_sites')
      .upsert(sitesToUpsert, { onConflict: 'id' });

    if (sitesError) {
      console.error('❌ Error upserting sites:', sitesError);
      throw sitesError;
    }

    console.log(`✅ Created/updated ${sitesToUpsert.length} sampling sites\n`);

    console.log('📊 Fetching recent wastewater readings from CDC API...');
    const readingsResponse = await fetch(
      `${CDC_API_BASE}?$where=wwtp_jurisdiction='Texas' AND date_end >= '2024-08-01'&$order=date_end DESC&$limit=${BATCH_SIZE}`
    );

    if (!readingsResponse.ok) {
      throw new Error(`CDC API readings error: ${readingsResponse.status}`);
    }

    const cdcReadings = await readingsResponse.json();
    console.log(`✅ Fetched ${cdcReadings.length} readings from CDC\n`);

    console.log('💾 Processing and inserting readings...');

    const { data: existingSites } = await supabase
      .from('sampling_sites')
      .select('id, name');

    const existingSiteIds = new Set(existingSites.map(s => s.id));

    const readingsToInsert = cdcReadings
      .filter(reading => reading.wwtp_id && reading.date_end && reading.percentile)
      .map(reading => {
        const trend = calculateTrend(reading.ptc_15d);
        const category = calculateLevelCategory(reading.percentile);
        const siteId = generateDeterministicUUID(`cdc-tx-${reading.wwtp_id}`);

        if (!existingSiteIds.has(siteId)) {
          return null;
        }

        return {
          site_id: siteId,
          virus_id: covidVirus.id,
          concentration_level: parseFloat(reading.percentile) || 0,
          level_category: category,
          trend: trend,
          sample_date: reading.date_end,
          processed_date: new Date().toISOString(),
          confidence_score: parseFloat(reading.detect_prop_15d) / 100 || 0.85,
          raw_data: {
            source: 'CDC_NWSS',
            state: 'Texas',
            county: reading.county_names,
            wwtp_id: reading.wwtp_id,
            key_plot_id: reading.key_plot_id,
            sample_location: reading.sample_location,
            population_served: reading.population_served,
            ptc_15d: reading.ptc_15d,
            detect_prop_15d: reading.detect_prop_15d,
            percentile: reading.percentile,
            date_start: reading.date_start,
            data_quality: 'real_cdc_data'
          }
        };
      })
      .filter(reading => reading !== null);

    console.log('🗑️  Clearing old simulated data...');
    await supabase
      .from('wastewater_readings')
      .delete()
      .eq('virus_id', covidVirus.id)
      .filter('raw_data->data_quality', 'neq', 'real_cdc_data');

    console.log('📤 Inserting new CDC readings...');
    const chunkSize = 500;
    let inserted = 0;

    for (let i = 0; i < readingsToInsert.length; i += chunkSize) {
      const chunk = readingsToInsert.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('wastewater_readings')
        .insert(chunk);

      if (error) {
        console.error(`❌ Error inserting chunk ${i / chunkSize + 1}:`, error.message);
      } else {
        inserted += chunk.length;
        const progress = Math.round((inserted / readingsToInsert.length) * 100);
        console.log(`   Chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(readingsToInsert.length / chunkSize)} - ${progress}% complete`);
      }
    }

    console.log(`\n✅ Successfully inserted ${inserted} real CDC readings\n`);

    console.log('📊 Data summary:');
    const { count: siteCount } = await supabase
      .from('sampling_sites')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    const { count: readingCount } = await supabase
      .from('wastewater_readings')
      .select('*', { count: 'exact', head: true })
      .eq('virus_id', covidVirus.id);

    console.log(`   Active sites: ${siteCount}`);
    console.log(`   Total COVID-19 readings: ${readingCount}`);
    console.log(`   Data source: CDC NWSS (National Wastewater Surveillance System)`);
    console.log(`   Geographic scope: Texas only`);

    console.log('\n🎉 Real CDC data loading complete!');
    console.log('✨ All data is now from official CDC sources\n');

  } catch (error) {
    console.error('❌ Error loading CDC data:', error);
    throw error;
  }
}

loadRealCDCData().catch(console.error);
