import { supabase } from '@/lib/supabase';
import { predictionEngine } from './prediction-engine';
import type { VirusType, SamplingSite } from '@/types/database';

export interface AnomalyAlert {
  id: string;
  site_id: string;
  virus_id: string;
  site_name: string;
  virus_name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detected_at: string;
}

export const generateAnomalyAlerts = async (): Promise<AnomalyAlert[]> => {
  try {
    const sitesResult = await supabase
      .from('sampling_sites')
      .select('*')
      .eq('active', true);

    const sites = sitesResult.data as SamplingSite[] | null;

    if (!sites || sites.length === 0) return [];

    const virusesResult = await supabase
      .from('virus_types')
      .select('*');

    const viruses = virusesResult.data as VirusType[] | null;

    if (!viruses || viruses.length === 0) return [];

    const alerts: AnomalyAlert[] = [];

    for (const site of sites) {
      for (const virus of viruses) {
        const hasAnomaly = await predictionEngine.detectAnomalies(
          site.id,
          virus.id
        );

        if (hasAnomaly) {
          alerts.push({
            id: `${site.id}-${virus.id}-${Date.now()}`,
            site_id: site.id,
            virus_id: virus.id,
            site_name: site.name,
            virus_name: virus.name,
            severity: 'critical',
            message: `Anomaly detected: ${virus.name} levels show unusual spike at ${site.name}. Recent readings exceed 2 standard deviations above baseline.`,
            detected_at: new Date().toISOString(),
          });
        }
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error generating anomaly alerts:', error);
    return [];
  }
};

export const saveAnomalyAlerts = async (alerts: AnomalyAlert[]) => {
  try {
    if (alerts.length === 0) return;

    const alertRecords = alerts.map((alert) => ({
      site_id: alert.site_id,
      virus_id: alert.virus_id,
      alert_type: 'anomaly',
      severity: alert.severity,
      message: alert.message,
      read: false,
      created_at: alert.detected_at,
    }));

    const { error } = await supabase
      .from('alerts')
      .insert(alertRecords as any);

    if (error) {
      console.error('Error saving anomaly alerts:', error);
    }
  } catch (error) {
    console.error('Error in saveAnomalyAlerts:', error);
  }
};
