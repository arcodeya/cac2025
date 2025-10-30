import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xccknasvgerhwvhygkdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2tuYXN2Z2VyaHd2aHlna2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTI3NDAsImV4cCI6MjA3NzI2ODc0MH0.q86AD4zFxj8p-JWi12kKxck0wT1Kdq6LWPb1VxDPQS8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMultiVirusData() {
  console.log('🚀 Starting multi-virus wastewater data seeding...\n');

  const { data: sites } = await supabase
    .from('sampling_sites')
    .select('*')
    .eq('active', true)
    .limit(50);

  const { data: viruses } = await supabase.from('virus_types').select('*');

  if (!sites || !viruses || sites.length === 0 || viruses.length === 0) {
    console.error('❌ No sites or viruses found');
    return;
  }

  console.log(`📍 Found ${sites.length} sampling sites`);
  console.log(`🦠 Found ${viruses.length} virus types`);

  const existingCovid = await supabase
    .from('wastewater_readings')
    .select('id', { count: 'exact', head: true })
    .eq('virus_id', viruses.find(v => v.name === 'COVID-19')?.id);

  console.log(`\n📊 Existing COVID-19 readings: ${existingCovid.count}`);

  const readings = [];
  const daysBack = 60;

  console.log(`\n⏳ Generating ${sites.length * viruses.length * daysBack} readings...`);

  for (const site of sites) {
    const isTexasSite =
      site.latitude >= 25.8 &&
      site.latitude <= 36.5 &&
      site.longitude >= -106.65 &&
      site.longitude <= -93.5;

    for (const virus of viruses) {
      if (virus.name === 'COVID-19') continue;

      for (let day = 0; day < daysBack; day++) {
        const date = new Date();
        date.setDate(date.getDate() - (daysBack - day));

        const baseLevel = 30 + Math.random() * 40;
        const seasonalFactor = Math.sin((day / 365) * 2 * Math.PI) * 20;
        const trendFactor = (day / daysBack) * 30;
        const randomNoise = Math.random() * 20 - 10;

        const concentration = baseLevel + seasonalFactor + trendFactor + randomNoise;
        const percentile = Math.max(0, Math.min(100, concentration));

        const category =
          percentile < 25 ? 'low' : percentile < 75 ? 'medium' : 'high';

        let trend = 'stable';
        if (day >= 7) {
          const prevConcentration =
            baseLevel + Math.sin(((day - 7) / 365) * 2 * Math.PI) * 20;
          const change =
            ((concentration - prevConcentration) / prevConcentration) * 100;
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
            source: 'synthetic_monitoring',
            state: isTexasSite ? 'Texas' : 'Unknown',
            county: site.county,
            site_name: site.name,
            virus_name: virus.name,
            data_quality: 'simulated',
          },
        });
      }
    }
  }

  console.log(`✅ Generated ${readings.length} readings`);
  console.log(`\n📤 Inserting readings in chunks...`);

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < readings.length; i += chunkSize) {
    const chunk = readings.slice(i, i + chunkSize);
    const { error } = await supabase.from('wastewater_readings').insert(chunk);

    if (error) {
      console.error(`❌ Error inserting chunk ${i / chunkSize + 1}:`, error.message);
    } else {
      inserted += chunk.length;
      const progress = Math.round((inserted / readings.length) * 100);
      console.log(`   Chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(readings.length / chunkSize)} - ${progress}% complete`);
    }
  }

  console.log(`\n✅ Successfully inserted ${inserted} readings`);

  console.log('\n📊 Verifying data distribution...');
  for (const virus of viruses) {
    const { count } = await supabase
      .from('wastewater_readings')
      .select('*', { count: 'exact', head: true })
      .eq('virus_id', virus.id);

    console.log(`   ${virus.name}: ${count} readings`);
  }

  console.log('\n🎉 Multi-virus data seeding complete!');
}

seedMultiVirusData().catch(console.error);
