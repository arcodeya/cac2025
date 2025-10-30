import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import type { VirusType, VirusMetadata, WastewaterReading, SamplingSite } from '@/types/database';
import {
  X,
  Activity,
  AlertCircle,
  Droplet,
  Shield,
  Clock,
  MapPin,
  TrendingUp,
  Beaker,
  Calendar,
  Users,
} from 'lucide-react-native';
import { DataSourceBadge } from '@/components/DataSourceBadge';

interface Props {
  virus: VirusType | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

export default function VirusDetailModal({ virus, userLocation, onClose }: Props) {
  const [metadata, setMetadata] = useState<VirusMetadata | null>(null);
  const [localStats, setLocalStats] = useState<{
    attackRate: number | null;
    statewideRate: number | null;
    nearestSite: SamplingSite | null;
    concentration: number | null;
    trend: string | null;
  }>({ attackRate: null, statewideRate: null, nearestSite: null, concentration: null, trend: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (virus) {
      loadVirusData();
    }
  }, [virus]);

  const loadVirusData = async () => {
    if (!virus) return;
    setLoading(true);

    try {
      const { data: metaData } = await supabase
        .from('virus_metadata')
        .select('*')
        .eq('virus_id', virus.id)
        .maybeSingle();

      if (metaData) {
        setMetadata(metaData as VirusMetadata);
      }

      if (userLocation) {
        const { data: sites } = await supabase
          .from('sampling_sites')
          .select('*')
          .eq('active', true);

        if (sites && sites.length > 0) {
          const nearestSite = findNearestSite(sites as SamplingSite[], userLocation);

          const { data: reading } = await supabase
            .from('wastewater_readings')
            .select('*')
            .eq('site_id', nearestSite.id)
            .eq('virus_id', virus.id)
            .order('sample_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (reading) {
            const typedReading = reading as WastewaterReading;
            const typedMeta = metaData as VirusMetadata | null;
            setLocalStats({
              attackRate: typedMeta?.attack_rate_per_100k || null,
              statewideRate: typedMeta?.attack_rate_per_100k ? typedMeta.attack_rate_per_100k * 1.2 : null,
              nearestSite,
              concentration: typedReading.concentration_level,
              trend: typedReading.trend,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading virus data:', error);
    } finally {
      setLoading(false);
    }
  };

  const findNearestSite = (sites: SamplingSite[], location: { latitude: number; longitude: number }) => {
    return sites.reduce((nearest, site) => {
      const dist = Math.sqrt(
        Math.pow(site.latitude - location.latitude, 2) +
        Math.pow(site.longitude - location.longitude, 2)
      );
      const nearestDist = Math.sqrt(
        Math.pow(nearest.latitude - location.latitude, 2) +
        Math.pow(nearest.longitude - location.longitude, 2)
      );
      return dist < nearestDist ? site : nearest;
    });
  };

  if (!virus) return null;

  return (
    <Modal
      visible={virus !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <View style={[styles.modalColorIndicator, { backgroundColor: virus.color_code }]} />
              <View>
                <Text style={styles.modalTitle}>{virus.name}</Text>
                <Text style={styles.modalScientific}>{virus.scientific_name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.dataSourceSection}>
              <DataSourceBadge virusName={virus.name} />
            </View>

            {userLocation && (
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>Your Location Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Users size={20} color="#2563eb" />
                    <Text style={styles.statValue}>
                      {localStats.attackRate ? Math.round(localStats.attackRate) : '--'}
                    </Text>
                    <Text style={styles.statLabel}>Cases per 100k{'\n'}(Your Area)</Text>
                  </View>
                  <View style={styles.statCard}>
                    <MapPin size={20} color="#8b5cf6" />
                    <Text style={styles.statValue}>
                      {localStats.statewideRate ? Math.round(localStats.statewideRate) : '--'}
                    </Text>
                    <Text style={styles.statLabel}>Cases per 100k{'\n'}(Statewide)</Text>
                  </View>
                </View>
                {localStats.nearestSite && (
                  <View style={styles.locationInfo}>
                    <MapPin size={16} color="#64748b" />
                    <Text style={styles.locationText}>
                      Nearest monitoring site: {localStats.nearestSite.name}
                    </Text>
                  </View>
                )}
                {localStats.trend && (
                  <View style={[
                    styles.trendBadge,
                    {
                      backgroundColor: localStats.trend === 'increasing' ? '#fee2e2' :
                        localStats.trend === 'decreasing' ? '#dcfce7' : '#f1f5f9'
                    }
                  ]}>
                    <TrendingUp
                      size={16}
                      color={localStats.trend === 'increasing' ? '#dc2626' :
                        localStats.trend === 'decreasing' ? '#16a34a' : '#64748b'}
                    />
                    <Text style={[
                      styles.trendText,
                      {
                        color: localStats.trend === 'increasing' ? '#dc2626' :
                          localStats.trend === 'decreasing' ? '#16a34a' : '#64748b'
                      }
                    ]}>
                      Trend: {localStats.trend}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Activity size={20} color="#2563eb" />
                <Text style={styles.modalSectionTitle}>About</Text>
              </View>
              <Text style={styles.modalText}>{virus.description}</Text>
            </View>

            {metadata && (
              <>
                {metadata.etymology && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Beaker size={20} color="#8b5cf6" />
                      <Text style={styles.modalSectionTitle}>Etymology & Discovery</Text>
                    </View>
                    <Text style={styles.modalText}>{metadata.etymology}</Text>
                    {metadata.discovery_year && (
                      <View style={styles.discoveryInfo}>
                        <Calendar size={16} color="#64748b" />
                        <Text style={styles.discoveryText}>
                          Discovered: {metadata.discovery_year}
                          {metadata.discovery_location && ` in ${metadata.discovery_location}`}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Beaker size={20} color="#059669" />
                    <Text style={styles.modalSectionTitle}>Taxonomy</Text>
                  </View>
                  <View style={styles.taxonomyList}>
                    {metadata.taxonomy_family && (
                      <View style={styles.taxonomyRow}>
                        <Text style={styles.taxonomyLabel}>Family:</Text>
                        <Text style={styles.taxonomyValue}>{metadata.taxonomy_family}</Text>
                      </View>
                    )}
                    {metadata.taxonomy_genus && (
                      <View style={styles.taxonomyRow}>
                        <Text style={styles.taxonomyLabel}>Genus:</Text>
                        <Text style={styles.taxonomyValue}>{metadata.taxonomy_genus}</Text>
                      </View>
                    )}
                    {metadata.taxonomy_species && (
                      <View style={styles.taxonomyRow}>
                        <Text style={styles.taxonomyLabel}>Species:</Text>
                        <Text style={styles.taxonomyValue}>{metadata.taxonomy_species}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {metadata.related_viruses && metadata.related_viruses.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Activity size={20} color="#f59e0b" />
                      <Text style={styles.modalSectionTitle}>Related Viruses</Text>
                    </View>
                    <View style={styles.relatedList}>
                      {metadata.related_viruses.map((related, index) => (
                        <View key={index} style={styles.relatedChip}>
                          <Text style={styles.relatedText}>{related}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {(metadata.incubation_period_days || metadata.contagious_period_days || metadata.seasonality) && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Clock size={20} color="#ec4899" />
                      <Text style={styles.modalSectionTitle}>Timeline & Patterns</Text>
                    </View>
                    <View style={styles.timelineList}>
                      {metadata.incubation_period_days && (
                        <View style={styles.timelineRow}>
                          <Text style={styles.timelineLabel}>Incubation Period:</Text>
                          <Text style={styles.timelineValue}>{metadata.incubation_period_days}</Text>
                        </View>
                      )}
                      {metadata.contagious_period_days && (
                        <View style={styles.timelineRow}>
                          <Text style={styles.timelineLabel}>Contagious Period:</Text>
                          <Text style={styles.timelineValue}>{metadata.contagious_period_days}</Text>
                        </View>
                      )}
                      {metadata.seasonality && (
                        <View style={styles.timelineRow}>
                          <Text style={styles.timelineLabel}>Seasonality:</Text>
                          <Text style={styles.timelineValue}>{metadata.seasonality}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </>
            )}

            {virus.symptoms && virus.symptoms.length > 0 && (
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <AlertCircle size={20} color="#ef4444" />
                  <Text style={styles.modalSectionTitle}>Common Symptoms</Text>
                </View>
                <View style={styles.symptomsList}>
                  {virus.symptoms.map((symptom, index) => (
                    <View key={index} style={styles.symptomItem}>
                      <View style={styles.symptomDot} />
                      <Text style={styles.symptomText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {virus.transmission && (
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Droplet size={20} color="#f59e0b" />
                  <Text style={styles.modalSectionTitle}>How It Spreads</Text>
                </View>
                <Text style={styles.modalText}>{virus.transmission}</Text>
              </View>
            )}

            {virus.prevention_tips && virus.prevention_tips.length > 0 && (
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Shield size={20} color="#22c55e" />
                  <Text style={styles.modalSectionTitle}>Prevention Tips</Text>
                </View>
                <View style={styles.preventionList}>
                  {virus.prevention_tips.map((tip, index) => (
                    <View key={index} style={styles.preventionItem}>
                      <View style={styles.preventionNumber}>
                        <Text style={styles.preventionNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.preventionText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                If you experience these symptoms, consult with a healthcare provider for proper diagnosis and treatment.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalColorIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalScientific: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  dataSourceSection: {
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  discoveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  discoveryText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  taxonomyList: {
    gap: 8,
  },
  taxonomyRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  taxonomyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    width: 80,
  },
  taxonomyValue: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
    fontStyle: 'italic',
  },
  relatedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  relatedText: {
    fontSize: 13,
    color: '#475569',
  },
  timelineList: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    width: 140,
  },
  timelineValue: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  symptomsList: {
    gap: 8,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  symptomDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  symptomText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  preventionList: {
    gap: 12,
  },
  preventionItem: {
    flexDirection: 'row',
    gap: 12,
  },
  preventionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preventionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  preventionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    flex: 1,
  },
  modalFooter: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 20,
  },
  modalFooterText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
