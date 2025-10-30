import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import type { VirusType, WastewaterReading, Prediction } from '@/types/database';
import { TrendingUp, TrendingDown, Calendar, Activity, AlertTriangle, Target } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { predictionEngine } from '@/services/prediction-engine';

const { width } = Dimensions.get('window');

interface VirusData {
  virus: VirusType;
  readings: WastewaterReading[];
  trend: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  latestDate: string;
  predictions: Prediction[];
  hasAnomaly: boolean;
}

export default function TrendsScreen() {
  const { colors, theme } = useTheme();
  const [virusDataList, setVirusDataList] = useState<VirusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    loadAllVirusData();
  }, [timeRange]);

  const loadAllVirusData = async () => {
    setLoading(true);
    try {
      const virusesResult = await supabase
        .from('virus_types')
        .select('*')
        .order('name');

      const viruses = virusesResult.data as VirusType[] | null;

      if (!viruses || viruses.length === 0) {
        setLoading(false);
        return;
      }

      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateStr = startDate.toISOString().split('T')[0];

      const virusDataPromises = viruses.map(async (virus) => {
        const result = await supabase
          .from('wastewater_readings')
          .select('*')
          .eq('virus_id', virus.id)
          .gte('sample_date', startDateStr)
          .order('sample_date', { ascending: true });

        const readings = result.data as WastewaterReading[] | null;

        if (!readings || readings.length === 0) {
          return {
            virus,
            readings: [],
            trend: 'stable' as const,
            percentChange: 0,
            latestDate: 'No data',
            predictions: [],
            hasAnomaly: false,
          };
        }

        const groupedByDate = readings.reduce((acc, reading) => {
          const date = reading.sample_date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(reading);
          return acc;
        }, {} as Record<string, WastewaterReading[]>);

        const averagedReadings = Object.entries(groupedByDate).map(([date, dayReadings]) => {
          const avgLevel = dayReadings.reduce((sum, r) => sum + (r.concentration_level || 0), 0) / dayReadings.length;
          return {
            ...dayReadings[0],
            concentration_level: avgLevel,
            sample_date: date,
          };
        }).sort((a, b) => new Date(a.sample_date).getTime() - new Date(b.sample_date).getTime());

        const recent = averagedReadings.slice(-7);
        const older = averagedReadings.slice(-14, -7);

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let percentChange = 0;

        if (older.length > 0 && recent.length > 0) {
          const recentAvg = recent.reduce((sum, r) => sum + (r.concentration_level || 0), 0) / recent.length;
          const olderAvg = older.reduce((sum, r) => sum + (r.concentration_level || 0), 0) / older.length;

          if (olderAvg > 0) {
            percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;
            trend = percentChange > 5 ? 'increasing' : percentChange < -5 ? 'decreasing' : 'stable';
          }
        }

        const latestDate = averagedReadings[averagedReadings.length - 1]?.sample_date || 'Unknown';

        const firstReading = readings[0];
        const siteId = firstReading?.site_id || '';
        const predictions = siteId && firstReading ? await predictionEngine.generatePredictions(siteId, virus.id) : [];
        const hasAnomaly = siteId && firstReading ? await predictionEngine.detectAnomalies(siteId, virus.id) : false;

        return {
          virus,
          readings: averagedReadings,
          trend,
          percentChange: Math.abs(percentChange),
          latestDate,
          predictions,
          hasAnomaly,
        };
      });

      const allVirusData = await Promise.all(virusDataPromises);
      setVirusDataList(allVirusData.filter(vd => vd.readings.length > 0));
    } catch (error) {
      console.error('Error loading virus data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading trend data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Trends & Analysis</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Multi-pathogen wastewater surveillance • CDC NWSS</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={[styles.timeRangeContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                { backgroundColor: colors.background, borderColor: colors.border },
                timeRange === '7d' && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange('7d')}>
              <Text
                style={[
                  styles.timeRangeText,
                  { color: colors.text },
                  timeRange === '7d' && styles.timeRangeTextActive,
                ]}>
                7 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                { backgroundColor: colors.background, borderColor: colors.border },
                timeRange === '30d' && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange('30d')}>
              <Text
                style={[
                  styles.timeRangeText,
                  { color: colors.text },
                  timeRange === '30d' && styles.timeRangeTextActive,
                ]}>
                30 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                { backgroundColor: colors.background, borderColor: colors.border },
                timeRange === '90d' && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange('90d')}>
              <Text
                style={[
                  styles.timeRangeText,
                  { color: colors.text },
                  timeRange === '90d' && styles.timeRangeTextActive,
                ]}>
                90 Days
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {virusDataList.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No historical data available</Text>
          </View>
        ) : (
          virusDataList.map((virusData) => (
            <View key={virusData.virus.id} style={[styles.virusSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.virusHeader}>
                <View style={styles.virusHeaderLeft}>
                  <View style={[styles.virusIcon, { backgroundColor: virusData.virus.color_code + '20' }]}>
                    <Activity size={20} color={virusData.virus.color_code} />
                  </View>
                  <View>
                    <Text style={[styles.virusName, { color: colors.text }]}>{virusData.virus.name}</Text>
                    <Text style={[styles.virusDataCount, { color: colors.textSecondary }]}>
                      {virusData.readings.length} readings • Latest: {new Date(virusData.latestDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.trendBadge,
                    {
                      backgroundColor:
                        virusData.trend === 'increasing'
                          ? '#fee2e2'
                          : virusData.trend === 'decreasing'
                          ? '#dcfce7'
                          : '#f3f4f6',
                    },
                  ]}>
                  {virusData.trend === 'increasing' ? (
                    <TrendingUp size={14} color="#dc2626" />
                  ) : virusData.trend === 'decreasing' ? (
                    <TrendingDown size={14} color="#16a34a" />
                  ) : (
                    <Calendar size={14} color="#6b7280" />
                  )}
                  <Text
                    style={[
                      styles.trendBadgeText,
                      {
                        color:
                          virusData.trend === 'increasing'
                            ? '#dc2626'
                            : virusData.trend === 'decreasing'
                            ? '#16a34a'
                            : '#6b7280',
                      },
                    ]}>
                    {virusData.trend === 'increasing'
                      ? `↑ ${virusData.percentChange.toFixed(1)}%`
                      : virusData.trend === 'decreasing'
                      ? `↓ ${virusData.percentChange.toFixed(1)}%`
                      : 'Stable'}
                  </Text>
                </View>
              </View>

              <View style={styles.chartContainer}>
                {virusData.readings.map((reading, index) => {
                  const maxLevel = Math.max(...virusData.readings.map(r => r.concentration_level || 0));
                  const barHeight = maxLevel > 0 ? ((reading.concentration_level || 0) / maxLevel) * 100 : 0;
                  const showLabel = virusData.readings.length <= 14 || index % Math.ceil(virusData.readings.length / 7) === 0;

                  return (
                    <View key={`${reading.id}-${index}`} style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight || 3,
                            backgroundColor:
                              reading.level_category === 'high'
                                ? '#ef4444'
                                : reading.level_category === 'medium'
                                ? '#f59e0b'
                                : '#22c55e',
                          },
                        ]}
                      />
                      {showLabel && (
                        <Text style={styles.barLabel}>
                          {new Date(reading.sample_date).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.chartSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Average</Text>
                  <Text style={styles.summaryValue}>
                    {(virusData.readings.reduce((sum, r) => sum + (r.concentration_level || 0), 0) / virusData.readings.length).toFixed(1)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Peak</Text>
                  <Text style={styles.summaryValue}>
                    {Math.max(...virusData.readings.map(r => r.concentration_level || 0)).toFixed(1)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Data Points</Text>
                  <Text style={styles.summaryValue}>{virusData.readings.length}</Text>
                </View>
              </View>

              <Text style={styles.trendDescription}>
                {virusData.trend === 'increasing'
                  ? `${virusData.virus.name} levels are rising. Monitor closely for potential outbreak.`
                  : virusData.trend === 'decreasing'
                  ? `${virusData.virus.name} levels are declining. Situation improving.`
                  : `${virusData.virus.name} levels remain stable with minimal changes.`}
              </Text>

              {virusData.hasAnomaly && (
                <View style={[styles.anomalyAlert, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <Text style={[styles.anomalyText, { color: '#dc2626' }]}>
                    Anomaly detected: Unusual spike in recent readings
                  </Text>
                </View>
              )}

              {virusData.predictions.length > 0 && (
                <>
                  <TouchableOpacity
                    style={[styles.predictionToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowPredictions(!showPredictions)}>
                    <View style={styles.predictionToggleLeft}>
                      <Target size={18} color={colors.primary} />
                      <Text style={[styles.predictionToggleText, { color: colors.text }]}>
                        14-Day Forecast ({virusData.predictions.length} predictions)
                      </Text>
                    </View>
                    <TrendingUp size={16} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {showPredictions && (
                    <View style={[styles.predictionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.predictionsTitle, { color: colors.text }]}>
                        AI-Powered Predictions
                      </Text>
                      <Text style={[styles.predictionsSubtitle, { color: colors.textSecondary }]}>
                        Combining trend detection, exponential smoothing, and anomaly detection
                      </Text>

                      {virusData.predictions.slice(0, 7).map((prediction, idx) => {
                        const date = new Date(prediction.prediction_date);
                        const confidence = ((prediction.confidence_score || 0) * 100).toFixed(0);
                        const daysAhead = idx + 1;

                        return (
                          <View key={prediction.prediction_date} style={[styles.predictionRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.predictionLeft}>
                              <Text style={[styles.predictionDate, { color: colors.text }]}>
                                Day +{daysAhead}
                              </Text>
                              <Text style={[styles.predictionDateDetail, { color: colors.textSecondary }]}>
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>

                            <View style={styles.predictionCenter}>
                              <View
                                style={[
                                  styles.predictionLevelBadge,
                                  {
                                    backgroundColor:
                                      prediction.predicted_category === 'high'
                                        ? '#fef2f2'
                                        : prediction.predicted_category === 'medium'
                                        ? '#fef3c7'
                                        : '#f0fdf4',
                                  },
                                ]}>
                                <Text
                                  style={[
                                    styles.predictionLevelText,
                                    {
                                      color:
                                        prediction.predicted_category === 'high'
                                          ? '#dc2626'
                                          : prediction.predicted_category === 'medium'
                                          ? '#d97706'
                                          : '#16a34a',
                                    },
                                  ]}>
                                  {(prediction.predicted_category || 'unknown').toUpperCase()}
                                </Text>
                              </View>
                              <Text style={[styles.predictionLevel, { color: colors.text }]}>
                                {(prediction.predicted_level || 0).toFixed(1)}
                              </Text>
                            </View>

                            <View style={styles.predictionRight}>
                              <View style={[styles.confidenceBadge, { backgroundColor: colors.background }]}>
                                <Text style={[styles.confidenceText, { color: colors.text }]}>
                                  {confidence}%
                                </Text>
                              </View>
                              <Text style={[styles.confidenceLabel, { color: colors.textSecondary }]}>
                                confidence
                              </Text>
                            </View>
                          </View>
                        );
                      })}

                      <View style={[styles.modelInfo, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modelInfoText, { color: colors.textSecondary }]}>
                          Model: Multi-factor (Trend 30% + Time-Series 70%)
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          ))
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Data sourced from CDC National Wastewater Surveillance System (NWSS)
          </Text>
          <Text style={styles.footerText}>
            Readings averaged by date • Texas sites only
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  timeRangeTextActive: {
    color: '#2563eb',
  },
  virusSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  virusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  virusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  virusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  virusName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  virusDataCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    paddingTop: 20,
    paddingBottom: 32,
    marginBottom: 12,
  },
  barContainer: {
    flex: 1,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 3,
    maxWidth: 10,
  },
  barLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    width: 28,
  },
  chartSummary: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  trendDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  noDataContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  footerNote: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  anomalyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  anomalyText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  predictionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  predictionToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  predictionsContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  predictionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  predictionsSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  predictionLeft: {
    flex: 1,
  },
  predictionDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  predictionDateDetail: {
    fontSize: 11,
    marginTop: 2,
  },
  predictionCenter: {
    flex: 1,
    alignItems: 'center',
  },
  predictionLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  predictionLevelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  predictionLevel: {
    fontSize: 13,
    fontWeight: '600',
  },
  predictionRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confidenceLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  modelInfo: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  modelInfoText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
