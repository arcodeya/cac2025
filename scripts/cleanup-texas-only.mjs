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

async function cleanup() {
  console.log('🧹 Starting cleanup for Texas-only data...\n');

  // Step 1: Delete Polio virus and all related data
  console.log('1️⃣  Removing Polio virus...');
  const { data: polio } = await supabase
    .from('virus_types')
    .select('id')
    .eq('name', 'Polio')
    .maybeSingle();

  if (polio) {
    console.log('   Deleting Polio readings...');
    await supabase.from('wastewater_readings').delete().eq('virus_id', polio.id);
    await supabase.from('time_series_snapshots').delete().eq('virus_id', polio.id);
    await supabase.from('predictions').delete().eq('virus_id', polio.id);
    await supabase.from('virus_metadata').delete().eq('virus_id', polio.id);
    await supabase.from('outbreak_sites').delete().eq('virus_id', polio.id);
    await supabase.from('alerts').delete().eq('virus_id', polio.id);
    await supabase.from('alert_priorities').delete().eq('virus_id', polio.id);

    console.log('   Deleting Polio virus type...');
    await supabase.from('virus_types').delete().eq('id', polio.id);
    console.log('   ✅ Polio removed');
  }

  // Step 2: Get all Texas city site IDs
  console.log('\n2️⃣  Identifying Texas sites...');
  const texasCityNames = TEXAS_MAJOR_CITIES.map(city => city.name);

  const { data: allSites } = await supabase.from('sampling_sites').select('id, name, latitude, longitude');

  const texasSiteIds = allSites
    ?.filter(site => {
      const isTexasCity = texasCityNames.some(cityName => site.name.includes(cityName));
      const inTexasBounds =
        site.latitude >= 25.8 && site.latitude <= 36.5 &&
        site.longitude >= -106.65 && site.longitude <= -93.5;
      return isTexasCity || inTexasBounds;
    })
    .map(site => site.id) || [];

  console.log(`   Found ${texasSiteIds.length} Texas sites`);
  console.log(`   Total sites: ${allSites?.length}`);

  // Step 3: Delete all wastewater readings for non-Texas sites
  console.log('\n3️⃣  Cleaning non-Texas readings...');
  const { count: totalReadings } = await supabase
    .from('wastewater_readings')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total readings before: ${totalReadings}`);

  if (texasSiteIds.length > 0) {
    await supabase
      .from('wastewater_readings')
      .delete()
      .not('site_id', 'in', `(${texasSiteIds.join(',')})`);
  }

  const { count: afterReadings } = await supabase
    .from('wastewater_readings')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total readings after: ${afterReadings}`);
  console.log(`   ✅ Removed ${totalReadings - afterReadings} non-Texas readings`);

  // Step 4: Delete non-Texas sites
  console.log('\n4️⃣  Removing non-Texas sites...');
  if (texasSiteIds.length > 0) {
    await supabase
      .from('time_series_snapshots')
      .delete()
      .not('site_id', 'in', `(${texasSiteIds.join(',')})`);

    await supabase
      .from('predictions')
      .delete()
      .not('site_id', 'in', `(${texasSiteIds.join(',')})`);

    await supabase
      .from('site_population_data')
      .delete()
      .not('site_id', 'in', `(${texasSiteIds.join(',')})`);

    await supabase
      .from('sampling_sites')
      .delete()
      .not('id', 'in', `(${texasSiteIds.join(',')})`);
  }

  const { count: finalSites } = await supabase
    .from('sampling_sites')
    .select('*', { count: 'exact', head: true });

  console.log(`   ✅ ${finalSites} Texas sites remaining`);

  // Step 5: Summary
  console.log('\n📊 Final Status:');
  const { data: viruses } = await supabase.from('virus_types').select('name').order('name');
  console.log(`   Viruses: ${viruses?.map(v => v.name).join(', ')}`);

  for (const virus of viruses || []) {
    const { count } = await supabase
      .from('wastewater_readings')
      .select('*', { count: 'exact', head: true })
      .eq('virus_id', (await supabase.from('virus_types').select('id').eq('name', virus.name).single()).data.id);
    console.log(`   ${virus.name}: ${count} readings`);
  }

  console.log('\n✅ Cleanup complete! All data is now Texas-only.');
}

cleanup().catch(console.error);
