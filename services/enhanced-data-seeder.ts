import { supabase } from '@/lib/supabase';
import type {
  VirusMetadata,
  OutbreakSite,
  PublicHealthResource,
  SitePopulationData,
  TimeSeriesSnapshot,
} from '@/types/database';

const TEXAS_CITIES = [
  { name: 'Houston', lat: 29.7604, lon: -95.3698, population: 2304000 },
  { name: 'Dallas', lat: 32.7767, lon: -96.7970, population: 1343000 },
  { name: 'Austin', lat: 30.2672, lon: -97.7431, population: 978000 },
  { name: 'San Antonio', lat: 29.4241, lon: -98.4936, population: 1547000 },
  { name: 'Fort Worth', lat: 32.7555, lon: -97.3308, population: 927000 },
  { name: 'El Paso', lat: 31.7619, lon: -106.4850, population: 679000 },
  { name: 'Arlington', lat: 32.7357, lon: -97.1081, population: 398000 },
  { name: 'Corpus Christi', lat: 27.8006, lon: -97.3964, population: 326000 },
  { name: 'Plano', lat: 33.0198, lon: -96.6989, population: 288000 },
  { name: 'Lubbock', lat: 33.5779, lon: -101.8552, population: 258000 },
];

export const seedVirusMetadata = async () => {
  try {
    const { data: viruses } = await supabase.from('virus_types').select('*');
    if (!viruses || viruses.length === 0) return;

    const virusData = viruses as Array<{ id: string; name: string }>;

    const metadataRecords: Partial<VirusMetadata>[] = [
      {
        virus_id: virusData.find((v) => v.name === 'RSV')?.id,
        etymology: 'Respiratory Syncytial Virus - named for the syncytia (multinucleated cells) formed when infected cells fuse together',
        taxonomy_family: 'Pneumoviridae',
        taxonomy_genus: 'Orthopneumovirus',
        taxonomy_species: 'Human orthopneumovirus',
        discovery_year: 1956,
        discovery_location: 'Maryland, USA',
        related_viruses: ['Human metapneumovirus', 'Parainfluenza'],
        attack_rate_per_100k: 2500,
        seasonality: 'Fall and winter, peaking November-January',
        incubation_period_days: '4-6 days',
        contagious_period_days: '3-8 days',
      },
      {
        virus_id: virusData.find((v) => v.name === 'COVID-19')?.id,
        etymology: 'Coronavirus Disease 2019 - named after corona (crown) due to the crown-like spikes on the viral surface',
        taxonomy_family: 'Coronaviridae',
        taxonomy_genus: 'Betacoronavirus',
        taxonomy_species: 'Severe acute respiratory syndrome coronavirus 2',
        discovery_year: 2019,
        discovery_location: 'Wuhan, China',
        related_viruses: ['SARS-CoV', 'MERS-CoV', 'Common cold coronaviruses'],
        attack_rate_per_100k: 3000,
        seasonality: 'Year-round with winter peaks',
        incubation_period_days: '2-14 days (median 5 days)',
        contagious_period_days: '2 days before to 10 days after symptoms',
      },
      {
        virus_id: virusData.find((v) => v.name === 'Influenza A')?.id,
        etymology: 'From Italian "influenza" meaning influence, originally attributed to the influence of the stars',
        taxonomy_family: 'Orthomyxoviridae',
        taxonomy_genus: 'Alphainfluenzavirus',
        taxonomy_species: 'Influenza A virus',
        discovery_year: 1933,
        discovery_location: 'London, England',
        related_viruses: ['Influenza B', 'Influenza C', 'Influenza D'],
        attack_rate_per_100k: 1800,
        seasonality: 'Winter months, October-March',
        incubation_period_days: '1-4 days',
        contagious_period_days: '1 day before to 5-7 days after symptoms',
      },
      {
        virus_id: virusData.find((v) => v.name === 'Influenza B')?.id,
        etymology: 'Named Influenza B to distinguish it from the earlier discovered Influenza A',
        taxonomy_family: 'Orthomyxoviridae',
        taxonomy_genus: 'Betainfluenzavirus',
        taxonomy_species: 'Influenza B virus',
        discovery_year: 1940,
        discovery_location: 'USA',
        related_viruses: ['Influenza A', 'Influenza C'],
        attack_rate_per_100k: 1200,
        seasonality: 'Late winter and spring',
        incubation_period_days: '1-4 days',
        contagious_period_days: '1 day before to 5-7 days after symptoms',
      },
      {
        virus_id: virusData.find((v) => v.name === 'Measles')?.id,
        etymology: 'From Middle English "maselen" or Latin "misellus" meaning miserable or wretched',
        taxonomy_family: 'Paramyxoviridae',
        taxonomy_genus: 'Morbillivirus',
        taxonomy_species: 'Measles morbillivirus',
        discovery_year: 1954,
        discovery_location: 'Boston, USA',
        related_viruses: ['Mumps', 'Rubella', 'Canine distemper virus'],
        attack_rate_per_100k: 90,
        seasonality: 'Late winter and spring',
        incubation_period_days: '10-14 days',
        contagious_period_days: '4 days before to 4 days after rash appears',
      },
      {
        virus_id: virusData.find((v) => v.name === 'Dengue')?.id,
        etymology: 'From Swahili "ki denga pepo" meaning disease caused by an evil spirit, or Spanish "dengue" meaning fastidious',
        taxonomy_family: 'Flaviviridae',
        taxonomy_genus: 'Flavivirus',
        taxonomy_species: 'Dengue virus',
        discovery_year: 1943,
        discovery_location: 'Japan/Hawaii',
        related_viruses: ['Zika virus', 'Yellow fever', 'West Nile virus'],
        attack_rate_per_100k: 200,
        seasonality: 'Year-round in tropical climates, summer peaks in subtropical areas',
        incubation_period_days: '4-10 days',
        contagious_period_days: 'Not directly contagious person-to-person',
      },
    ];

    for (const record of metadataRecords) {
      if (record.virus_id) {
        await supabase.from('virus_metadata').upsert(record as any, {
          onConflict: 'virus_id',
        });
      }
    }

    console.log('Virus metadata seeded successfully');
  } catch (error) {
    console.error('Error seeding virus metadata:', error);
  }
};

export const seedOutbreakSites = async () => {
  try {
    const { data: viruses } = await supabase.from('virus_types').select('*');
    if (!viruses || viruses.length === 0) return;

    const virusData = viruses as Array<{ id: string; name: string }>;

    const outbreakRecords: Partial<OutbreakSite>[] = [
      {
        site_type: 'school',
        name: 'Lincoln Elementary School',
        address: '1234 School Dr',
        latitude: 29.7704,
        longitude: -95.3798,
        city: 'Houston',
        county: 'Harris',
        virus_id: virusData.find((v) => v.name === 'RSV')?.id,
        case_count: 23,
        status: 'active',
        reported_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        severity: 'medium',
      },
      {
        site_type: 'nursing_home',
        name: 'Sunset Senior Living',
        address: '5678 Elder Care Ln',
        latitude: 32.7867,
        longitude: -96.8070,
        city: 'Dallas',
        county: 'Dallas',
        virus_id: virusData.find((v) => v.name === 'COVID-19')?.id,
        case_count: 12,
        status: 'contained',
        reported_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        severity: 'high',
      },
      {
        site_type: 'workplace',
        name: 'Tech Campus Building B',
        address: '9012 Innovation Blvd',
        latitude: 30.2772,
        longitude: -97.7531,
        city: 'Austin',
        county: 'Travis',
        virus_id: virusData.find((v) => v.name === 'Influenza A')?.id,
        case_count: 34,
        status: 'active',
        reported_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        severity: 'medium',
      },
      {
        site_type: 'school',
        name: 'Roosevelt High School',
        address: '3456 Education Way',
        latitude: 29.4341,
        longitude: -98.5036,
        city: 'San Antonio',
        county: 'Bexar',
        virus_id: virusData.find((v) => v.name === 'Influenza B')?.id,
        case_count: 45,
        status: 'active',
        reported_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        severity: 'high',
      },
      {
        site_type: 'restaurant',
        name: 'Main Street Diner',
        address: '7890 Main St',
        latitude: 32.7655,
        longitude: -97.3408,
        city: 'Fort Worth',
        county: 'Tarrant',
        virus_id: virusData.find((v) => v.name === 'COVID-19')?.id,
        case_count: 8,
        status: 'resolved',
        reported_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        resolved_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        severity: 'low',
      },
    ];

    await supabase.from('outbreak_sites').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('outbreak_sites').insert(outbreakRecords as any);

    console.log('Outbreak sites seeded successfully');
  } catch (error) {
    console.error('Error seeding outbreak sites:', error);
  }
};

export const seedPublicHealthResources = async () => {
  try {
    const resources: Partial<PublicHealthResource>[] = [
      {
        resource_type: 'vaccination_site',
        name: 'Houston Health Department Clinic',
        address: '8000 North Stadium Dr',
        latitude: 29.8011,
        longitude: -95.4107,
        city: 'Houston',
        county: 'Harris',
        phone: '(832) 393-5427',
        website: 'https://www.houstonhealth.org',
        services: ['COVID-19 vaccines', 'Flu shots', 'Routine immunizations'],
        hours_of_operation: 'Mon-Fri 8am-5pm',
        accepts_walkins: true,
        active: true,
      },
      {
        resource_type: 'hospital',
        name: 'Memorial Hermann Hospital',
        address: '6411 Fannin St',
        latitude: 29.7090,
        longitude: -95.3984,
        city: 'Houston',
        county: 'Harris',
        phone: '(713) 704-4000',
        website: 'https://www.memorialhermann.org',
        services: ['Emergency care', 'ICU', 'Infectious disease treatment'],
        hours_of_operation: '24/7',
        accepts_walkins: false,
        active: true,
      },
      {
        resource_type: 'testing_center',
        name: 'Dallas County Testing Site',
        address: '2377 Stemmons Freeway',
        latitude: 32.7942,
        longitude: -96.8353,
        city: 'Dallas',
        county: 'Dallas',
        phone: '(214) 819-2000',
        website: 'https://www.dallascounty.org',
        services: ['COVID-19 testing', 'Flu testing', 'RSV testing'],
        hours_of_operation: 'Mon-Sat 9am-4pm',
        accepts_walkins: true,
        active: true,
      },
      {
        resource_type: 'clinic',
        name: 'Austin Public Health Clinic',
        address: '15 Waller St',
        latitude: 30.2721,
        longitude: -97.7407,
        city: 'Austin',
        county: 'Travis',
        phone: '(512) 972-5520',
        website: 'https://www.austintexas.gov/health',
        services: ['Primary care', 'Immunizations', 'Health screenings'],
        hours_of_operation: 'Mon-Fri 7:30am-5:30pm',
        accepts_walkins: false,
        active: true,
      },
      {
        resource_type: 'vaccination_site',
        name: 'San Antonio Metro Health',
        address: '332 W Commerce St',
        latitude: 29.4246,
        longitude: -98.4951,
        city: 'San Antonio',
        county: 'Bexar',
        phone: '(210) 207-8780',
        website: 'https://www.sanantonio.gov/health',
        services: ['All vaccines', 'Travel immunizations', 'Flu clinic'],
        hours_of_operation: 'Mon-Fri 8am-5pm, Sat 9am-1pm',
        accepts_walkins: true,
        active: true,
      },
      {
        resource_type: 'antiviral_distribution',
        name: 'Fort Worth Community Pharmacy',
        address: '1201 Summit Ave',
        latitude: 32.7501,
        longitude: -97.3294,
        city: 'Fort Worth',
        county: 'Tarrant',
        phone: '(817) 392-6600',
        website: 'https://www.fortworthtexas.gov',
        services: ['Antiviral medications', 'Prescription fulfillment', 'Health consultations'],
        hours_of_operation: 'Mon-Fri 9am-6pm',
        accepts_walkins: true,
        active: true,
      },
      {
        resource_type: 'hospital',
        name: 'Dell Seton Medical Center',
        address: '1500 Red River St',
        latitude: 30.2794,
        longitude: -97.7352,
        city: 'Austin',
        county: 'Travis',
        phone: '(512) 324-7000',
        website: 'https://www.dellseton.net',
        services: ['Emergency care', 'ICU', 'Trauma center'],
        hours_of_operation: '24/7',
        accepts_walkins: false,
        active: true,
      },
      {
        resource_type: 'testing_center',
        name: 'El Paso Public Health',
        address: '5115 El Paso Dr',
        latitude: 31.7775,
        longitude: -106.4424,
        city: 'El Paso',
        county: 'El Paso',
        phone: '(915) 212-0333',
        website: 'https://www.epstrong.org',
        services: ['COVID-19 testing', 'Contact tracing', 'Health education'],
        hours_of_operation: 'Mon-Fri 8am-5pm',
        accepts_walkins: true,
        active: true,
      },
    ];

    await supabase.from('public_health_resources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('public_health_resources').insert(resources as any);

    console.log('Public health resources seeded successfully');
  } catch (error) {
    console.error('Error seeding public health resources:', error);
  }
};

export const seedSitePopulationData = async () => {
  try {
    const { data: sites } = await supabase.from('sampling_sites').select('*');
    if (!sites || sites.length === 0) return;

    const siteData = sites as Array<{ id: string; name: string; population: number }>;

    const populationRecords: Partial<SitePopulationData>[] = siteData.map((site) => {
      const cityData = TEXAS_CITIES.find((c) => site.name.includes(c.name)) || TEXAS_CITIES[0];

      return {
        site_id: site.id,
        total_population: cityData.population + Math.floor(Math.random() * 50000 - 25000),
        population_density: 800 + Math.random() * 1500,
        median_age: 32 + Math.random() * 8,
        vulnerable_population_pct: 15 + Math.random() * 10,
      };
    });

    for (const record of populationRecords) {
      await supabase.from('site_population_data').upsert(record as any, {
        onConflict: 'site_id',
      });
    }

    console.log('Site population data seeded successfully');
  } catch (error) {
    console.error('Error seeding site population data:', error);
  }
};

export const seedTimeSeriesSnapshots = async () => {
  try {
    const { data: sites } = await supabase.from('sampling_sites').select('*');
    const { data: viruses } = await supabase.from('virus_types').select('*');

    if (!sites || !viruses || sites.length === 0 || viruses.length === 0) return;

    const siteData = sites as Array<{ id: string }>;
    const virusData = viruses as Array<{ id: string }>;

    const snapshots: Partial<TimeSeriesSnapshot>[] = [];
    const daysBack = 30;

    for (const site of siteData) {
      for (const virus of virusData) {
        for (let day = 0; day < daysBack; day++) {
          const date = new Date();
          date.setDate(date.getDate() - (daysBack - day));

          const baseLevel = 100 + Math.random() * 400;
          const trendFactor = day / daysBack;
          const concentration = baseLevel + (trendFactor * 100) + (Math.random() * 50 - 25);

          const category = concentration < 150 ? 'low' : concentration < 300 ? 'medium' : 'high';
          const trend = day < daysBack / 2 ? 'increasing' : day < daysBack * 0.75 ? 'stable' : 'decreasing';

          let comparisonToPrevWeek = null;
          if (day >= 7) {
            const prevWeekConcentration = baseLevel + ((day - 7) / daysBack * 100);
            comparisonToPrevWeek = ((concentration - prevWeekConcentration) / prevWeekConcentration) * 100;
          }

          snapshots.push({
            site_id: site.id,
            virus_id: virus.id,
            snapshot_date: date.toISOString().split('T')[0],
            concentration_level: Math.round(concentration),
            level_category: category,
            trend_direction: trend,
            comparison_to_previous_week: comparisonToPrevWeek ? Math.round(comparisonToPrevWeek * 10) / 10 : null,
          });
        }
      }
    }

    await supabase.from('time_series_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const chunkSize = 100;
    for (let i = 0; i < snapshots.length; i += chunkSize) {
      const chunk = snapshots.slice(i, i + chunkSize);
      await supabase.from('time_series_snapshots').insert(chunk as any);
    }

    console.log('Time series snapshots seeded successfully');
  } catch (error) {
    console.error('Error seeding time series snapshots:', error);
  }
};

export const seedWastewaterReadings = async () => {
  try {
    const { data: sites } = await supabase.from('sampling_sites').select('*');
    const { data: viruses } = await supabase.from('virus_types').select('*');

    if (!sites || !viruses || sites.length === 0 || viruses.length === 0) return;

    const siteData = sites as Array<{ id: string; name: string; county: string; latitude: number; longitude: number }>;
    const virusData = viruses as Array<{ id: string; name: string }>;

    const readings: any[] = [];
    const daysBack = 60;

    for (const site of siteData) {
      const isTexasSite = site.latitude >= 25.8 && site.latitude <= 36.5 &&
                          site.longitude >= -106.65 && site.longitude <= -93.5;

      for (const virus of virusData) {
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

    console.log(`Preparing to insert ${readings.length} wastewater readings...`);

    const chunkSize = 500;
    for (let i = 0; i < readings.length; i += chunkSize) {
      const chunk = readings.slice(i, i + chunkSize);
      const { error } = await supabase.from('wastewater_readings').insert(chunk);
      if (error) {
        console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error);
      } else {
        console.log(`Inserted chunk ${i / chunkSize + 1} of ${Math.ceil(readings.length / chunkSize)}`);
      }
    }

    console.log('Wastewater readings seeded successfully');
  } catch (error) {
    console.error('Error seeding wastewater readings:', error);
  }
};

export const seedAllEnhancedData = async () => {
  console.log('Starting enhanced data seeding...');

  await seedVirusMetadata();
  await seedSitePopulationData();
  await seedOutbreakSites();
  await seedPublicHealthResources();
  await seedTimeSeriesSnapshots();
  await seedWastewaterReadings();

  console.log('All enhanced data seeded successfully!');
};
