import { supabase } from '@/lib/supabase';
import type {
  WastewaterReading,
  VirusType,
  SamplingSite,
  SitePopulationData,
} from '@/types/database';

export interface PriorityFactors {
  dangerLevel: number;
  concentrationFactor: number;
  proximityFactor: number;
  trendFactor: number;
  populationFactor: number;
}

export interface AlertPriorityResult {
  siteId: string;
  virusId: string;
  priorityScore: number;
  factors: PriorityFactors;
  siteName: string;
  virusName: string;
  distance: number;
}

const SEVERITY_WEIGHTS = {
  high: 3.0,
  medium: 2.0,
  low: 1.0,
};

const TREND_WEIGHTS = {
  increasing: 1.5,
  stable: 1.0,
  decreasing: 0.5,
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateProximityFactor = (distanceKm: number): number => {
  if (distanceKm < 10) return 10;
  if (distanceKm < 25) return 8;
  if (distanceKm < 50) return 6;
  if (distanceKm < 100) return 4;
  if (distanceKm < 200) return 2;
  return 1;
};

const calculateConcentrationFactor = (
  concentration: number | null,
  category: string
): number => {
  if (!concentration) {
    if (category === 'high') return 8;
    if (category === 'medium') return 5;
    return 2;
  }

  if (concentration > 1000) return 10;
  if (concentration > 500) return 8;
  if (concentration > 250) return 6;
  if (concentration > 100) return 4;
  if (concentration > 50) return 2;
  return 1;
};

const calculatePopulationFactor = (population: number): number => {
  if (population > 1000000) return 10;
  if (population > 500000) return 8;
  if (population > 250000) return 6;
  if (population > 100000) return 4;
  if (population > 50000) return 2;
  return 1;
};

export const calculateAlertPriorities = async (
  userLocation: { latitude: number; longitude: number }
): Promise<AlertPriorityResult[]> => {
  try {
    const { data: sites } = await supabase
      .from('sampling_sites')
      .select('*')
      .eq('active', true);

    if (!sites || sites.length === 0) return [];
    const typedSites = sites as SamplingSite[];

    const { data: viruses } = await supabase
      .from('virus_types')
      .select('*');

    if (!viruses || viruses.length === 0) return [];
    const typedViruses = viruses as VirusType[];

    const { data: readings } = await supabase
      .from('wastewater_readings')
      .select('*')
      .contains('raw_data', { state: 'Texas' })
      .order('sample_date', { ascending: false });

    if (!readings || readings.length === 0) return [];
    const typedReadings = readings as WastewaterReading[];

    const typedPopData: SitePopulationData[] = [];

    const priorities: AlertPriorityResult[] = [];

    for (const site of typedSites) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        site.latitude,
        site.longitude
      );

      const siteReadings = typedReadings.filter((r) => r.site_id === site.id);

      for (const virus of typedViruses) {
        const virusReading = siteReadings.find((r) => r.virus_id === virus.id);
        if (!virusReading) continue;

        const popData = typedPopData.find((p) => p.site_id === site.id);
        const population = popData?.total_population || site.population;

        const dangerLevel = SEVERITY_WEIGHTS[virus.severity_level as keyof typeof SEVERITY_WEIGHTS] || 1;
        const concentrationFactor = calculateConcentrationFactor(
          virusReading.concentration_level,
          virusReading.level_category
        );
        const proximityFactor = calculateProximityFactor(distance);
        const trendFactor = TREND_WEIGHTS[virusReading.trend as keyof typeof TREND_WEIGHTS] || 1;
        const populationFactor = calculatePopulationFactor(population);

        const priorityScore =
          dangerLevel * 0.3 * 10 +
          concentrationFactor * 0.25 +
          proximityFactor * 0.25 +
          trendFactor * 0.1 * 10 +
          populationFactor * 0.1;

        priorities.push({
          siteId: site.id,
          virusId: virus.id,
          priorityScore: Math.round(priorityScore * 10) / 10,
          factors: {
            dangerLevel,
            concentrationFactor,
            proximityFactor,
            trendFactor,
            populationFactor,
          },
          siteName: site.name,
          virusName: virus.name,
          distance: Math.round(distance * 10) / 10,
        });
      }
    }

    priorities.sort((a, b) => b.priorityScore - a.priorityScore);

    await savePriorities(priorities);

    return priorities;
  } catch (error) {
    console.error('Error calculating alert priorities:', error);
    return [];
  }
};

const savePriorities = async (priorities: AlertPriorityResult[]) => {
  try {
    const records = priorities.map((p) => ({
      site_id: p.siteId,
      virus_id: p.virusId,
      priority_score: p.priorityScore,
      danger_level: p.factors.dangerLevel,
      concentration_factor: p.factors.concentrationFactor,
      proximity_factor: p.factors.proximityFactor,
      trend_factor: p.factors.trendFactor,
      population_factor: p.factors.populationFactor,
    }));

    await supabase
      .from('alert_priorities')
      .delete()
      .lt('calculated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (records.length > 0) {
      await supabase.from('alert_priorities').upsert(records.slice(0, 50) as any);
    }
  } catch (error) {
    console.error('Error saving priorities:', error);
  }
};

export const getTopAlerts = async (
  limit: number = 10
): Promise<AlertPriorityResult[]> => {
  try {
    const { data } = await supabase
      .from('alert_priorities')
      .select(`
        *,
        sampling_sites(name),
        virus_types(name)
      `)
      .order('priority_score', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((item: any) => ({
      siteId: item.site_id,
      virusId: item.virus_id,
      priorityScore: item.priority_score,
      factors: {
        dangerLevel: item.danger_level,
        concentrationFactor: item.concentration_factor,
        proximityFactor: item.proximity_factor,
        trendFactor: item.trend_factor,
        populationFactor: item.population_factor,
      },
      siteName: item.sampling_sites?.name || 'Unknown',
      virusName: item.virus_types?.name || 'Unknown',
      distance: 0,
    }));
  } catch (error) {
    console.error('Error getting top alerts:', error);
    return [];
  }
};
