import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import type { SamplingSite } from '@/types/database';

export class TEPHIScraper {
  private static instance: TEPHIScraper;

  private constructor() {}

  static getInstance(): TEPHIScraper {
    if (!TEPHIScraper.instance) {
      TEPHIScraper.instance = new TEPHIScraper();
    }
    return TEPHIScraper.instance;
  }

  async seedInitialData() {
    const sites = await this.seedSamplingSites();

    const existingReadings = await supabase
      .from('wastewater_readings')
      .select('id')
      .limit(1);

    if (!existingReadings.data || existingReadings.data.length === 0) {
      await this.triggerDataCollection();
    }

    return { success: true, sitesCreated: sites.length };
  }

  private async seedSamplingSites(): Promise<SamplingSite[]> {
    const texasCities: Array<{
      name: string;
      latitude: number;
      longitude: number;
      county: string;
      population: number;
    }> = [
      { name: 'Houston', latitude: 29.7604, longitude: -95.3698, county: 'Harris', population: 2304580 },
      { name: 'Austin', latitude: 30.2672, longitude: -97.7431, county: 'Travis', population: 961855 },
      { name: 'Dallas', latitude: 32.7767, longitude: -96.7970, county: 'Dallas', population: 1304379 },
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

    const existingSites = await supabase.from('sampling_sites').select('name');

    if (existingSites.data && existingSites.data.length > 0) {
      const { data } = await supabase.from('sampling_sites').select('*');
      return (data as SamplingSite[]) || [];
    }

    const { data, error } = await supabase
      .from('sampling_sites')
      .insert(texasCities as any)
      .select();

    if (error) {
      console.error('Error seeding sampling sites:', error);
      return [];
    }

    return (data as SamplingSite[]) || [];
  }

  private async triggerDataCollection(): Promise<void> {
    try {
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('Database configuration missing');
        return;
      }

      const collectorUrl = `${supabaseUrl}/functions/v1/data-collector`;

      const response = await fetch(collectorUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Collection failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Data collection completed:', result);
    } catch (error) {
      console.error('Failed to trigger data collection:', error);
    }
  }

  async refreshData(): Promise<void> {
    await this.triggerDataCollection();
  }

  async getLastCollectionRun(): Promise<any> {
    const { data } = await supabase
      .from('data_collection_runs')
      .select('*')
      .order('run_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  }

  async getDataFreshness(): Promise<{
    lastUpdate: string | null;
    isStale: boolean;
    daysSinceUpdate: number;
  }> {
    const lastRun = await this.getLastCollectionRun();

    if (!lastRun) {
      return {
        lastUpdate: null,
        isStale: true,
        daysSinceUpdate: -1,
      };
    }

    const lastUpdateDate = new Date(lastRun.run_date);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      lastUpdate: lastUpdateDate.toISOString(),
      isStale: daysDiff > 30,
      daysSinceUpdate: daysDiff,
    };
  }
}

export const tephiScraper = TEPHIScraper.getInstance();
