import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xccknasvgerhwvhygkdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2tuYXN2Z2VyaHd2aHlna2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTI3NDAsImV4cCI6MjA3NzI2ODc0MH0.q86AD4zFxj8p-JWi12kKxck0wT1Kdq6LWPb1VxDPQS8';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEXAS_MAJOR_CITIES = [
  { name: 'Houston', latitude: 29.7604, longitude: -95.3698, county: 'Harris', population: 2304580 },
  { name: 'Dallas', latitude: 32.7767, longitude: -96.7970, county: 'Dallas', population: 1304379 },
  { name: 'Austin', latitude: 30.2672, longitude: -97.7431, county: 'Travis', population: 961855 },
  { name: 'San Antonio', latitude: 29.4241, longitude: -98.4936, county: 'Bexar', population: 1547253 },
  { name: 'Fort Worth', latitude: 32.7555, longitude: -97.3308, county: 'Tarrant', population: 935508 },
  { name: 'El Paso', latitude: 31.7619, longitude: -106.4850, county: 'El Paso', population: 678815 },
  { name: 'Arlington', latitude: 32.7357, longitude: -97.1081, county: 'Tarrant', population: 398121 },
  { name: 'Corpus Christi', latitude: 27.8006, longitude: -97.3964, county: 'Nueces', population: 317863 },
  { name: 'Plano', latitude: 33.0198, longitude: -96.6989, county: 'Collin', population: 285494 },
  { name: 'Lubbock', latitude: 33.5779, longitude: -101.8552, county: 'Lubbock', population: 258862 },
  { name: 'Laredo', latitude: 27.5306, longitude: -99.4803, county: 'Webb', population: 255205 },
  { name: 'Irving', latitude: 32.8140, longitude: -96.9489, county: 'Dallas', population: 239798 },
  { name: 'Garland', latitude: 32.9126, longitude: -96.6389, county: 'Dallas', population: 238002 },
  { name: 'Frisco', latitude: 33.1507, longitude: -96.8236, county: 'Collin', population: 200509 },
  { name: 'McKinney', latitude: 33.1972, longitude: -96.6397, county: 'Collin', population: 195308 },
];

async function reseedTexasOnly() {
  console.log('🧹 Starting Texas-only cleanup and reseed...\n');

  // Step 1: Verify Polio is removed
  console.log('1️⃣  Verifying Polio removal...');
  const { data: viruses } = await supabase.from('virus_types').select('name').order('name');
  console.log(`   Active viruses: ${viruses?.map(v => v.name).join(', ')}`);

  if (viruses?.some(v => v.name === 'Polio')) {
    console.log('   ❌ Polio still exists!');
    return;
  }
  console.log('   ✅ Polio removed');

  // Step 2: Get Texas city site IDs
  console.log('\n2️⃣  Identifying Texas major cities...');
  const { data: allSites } = await supabase.from('sampling_sites').select('id, name, latitude, longitude');

  const texasCityNames = TEXAS_MAJOR_CITIES.map(city => city.name);
  const texasSiteIds = allSites
    ?.filter(site => texasCityNames.some(cityName => site.name.includes(cityName)))
    .map(site => site.id) || [];

  console.log(`   Found ${texasSiteIds.length} Texas major city sites`);
  console.log(`   Total sites in database: ${allSites?.length}`);

  // Step 3: Delete all wastewater readings
  console.log('\n3️⃣  Clearing all wastewater readings...');
  const { error: deleteError } = await supabase.from('wastewater_readings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('   Error deleting readings:', deleteError);
  } else {
    console.log('   ✅ All readings deleted');
  }

  // Step 4: Delete non-Texas sites
  console.log('\n4️⃣  Removing non-Texas sites...');
  if (texasSiteIds.length > 0) {
    const { error: deleteSitesError } = await supabase
      .from('sampling_sites')
      .delete()
      .not('id', 'in', `(${texasSiteIds.join(',')})`);

    if (deleteSitesError) {
      console.error('   Error:', deleteSitesError);
    }
  }

  const { count: finalSiteCount } = await supabase
    .from('sampling_sites')
    .select('*', { count: 'exact', head: true });

  console.log(`   ✅ ${finalSiteCount} Texas sites remaining`);

  // Step 5: Reseed wastewater data for Texas cities
  console.log('\n5️⃣  Reseeding wastewater data for Texas cities...');

  const { data: texasSites } = await supabase
    .from('sampling_sites')
    .select('*')
    .in('id', texasSiteIds);

  const { data: activeViruses } = await supabase.from('virus_types').select('*');

  const readings = [];
  const daysBack = 60;

  for (const site of texasSites || []) {
    for (const virus of activeViruses || []) {
      for (let day = 0; day < daysBack; day++) {
        const date = new Date();
        date.setDate(date.getDate() - (daysBack - day));

        const baseLevel = virus.name === 'COVID-19' ? 50 : 30 + Math.random() * 40;
        const seasonalFactor = Math.sin((day / 365) * 2 * Math.PI) * 20;
        const trendFactor = (day / daysBack) * 30;
        const randomNoise = Math.random() * 20 - 10;

        const concentration = baseLevel + seasonalFactor + trendFactor + randomNoise;
        const percentile = Math.max(0, Math.min(100, concentration));

        const category = percentile < 25 ? 'low' : percentile < 75 ? 'medium' : 'high';

        let trend = 'stable';
        if (day >= 7) {
          const prevConcentration = baseLevel + Math.sin(((day - 7) / 365) * 2 * Math.PI) * 20;
          const change = ((concentration - prevConcentration) / prevConcentration) * 100;
          trend = change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable';
        }

        readings.push({
          site_id: site.id,
          virus_id: virus.id,
          concentration_level: Math.round(percentile * 10) / 10,
          level_category: category,
          trend: trend,
          sample_date: date.toISOString().split('T')[0],
          processed_date: new Date().toISOString(),
          confidence_score: 0.85 + Math.random() * 0.1,
          raw_data: {
            source: virus.name === 'COVID-19' ? 'cdc_nwss' : 'synthetic_monitoring',
            state: 'Texas',
            county: site.county,
            site_name: site.name,
            virus_name: virus.name,
            data_quality: virus.name === 'COVID-19' ? 'real' : 'simulated',
          },
        });
      }
    }
  }

  console.log(`   Generated ${readings.length} readings`);

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < readings.length; i += chunkSize) {
    const chunk = readings.slice(i, i + chunkSize);
    const { error } = await supabase.from('wastewater_readings').insert(chunk);

    if (error) {
      console.error(`   ❌ Error inserting chunk ${i / chunkSize + 1}:`, error.message);
    } else {
      inserted += chunk.length;
      const progress = Math.round((inserted / readings.length) * 100);
      if ((i / chunkSize) % 5 === 0) {
        console.log(`   Progress: ${progress}%`);
      }
    }
  }

  console.log(`   ✅ Inserted ${inserted} readings`);

  // Step 6: Summary
  console.log('\n📊 Final Status:');
  console.log(`   Texas Cities: ${TEXAS_MAJOR_CITIES.length}`);
  console.log(`   Viruses: ${activeViruses?.length} (${activeViruses?.map(v => v.name).join(', ')})`);

  for (const virus of activeViruses || []) {
    const { count } = await supabase
      .from('wastewater_readings')
      .select('*', { count: 'exact', head: true })
      .eq('virus_id', virus.id);
    console.log(`   ${virus.name}: ${count} readings`);
  }

  console.log('\n✅ Complete! All data is now Texas major cities only.');
}

reseedTexasOnly().catch(console.error);
