import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertTriangle, TrendingUp, MapPin, Users, Activity } from 'lucide-react-native';
import { calculateAlertPriorities } from '@/services/alert-priority';
import type { AlertPriorityResult } from '@/services/alert-priority';

interface Props {
  userLocation: { latitude: number; longitude: number } | null;
  onSitePress?: (siteId: string, virusId: string) => void;
}

export default function AlertPriorityDashboard({ userLocation, onSitePress }: Props) {
  const [priorities, setPriorities] = useState<AlertPriorityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    if (userLocation) {
      loadPriorities();
    }
  }, [userLocation]);

  const loadPriorities = async () => {
    if (!userLocation) return;
    setLoading(true);

    try {
      const results = await calculateAlertPriorities(userLocation);
      setPriorities(results);
    } catch (error) {
      console.error('Error loading alert priorities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 20) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  };

  const getPriorityColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
    }
  };

  const filteredPriorities = priorities.filter((p) => {
    if (filter === 'all') return true;
    return getPriorityLevel(p.priorityScore) === filter;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Calculating alert priorities...</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.emptyContainer}>
        <MapPin size={48} color="#cbd5e1" />
        <Text style={styles.emptyText}>Enable location to see personalized alerts</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({priorities.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'high' && styles.filterButtonActive]}
          onPress={() => setFilter('high')}>
          <Text style={[styles.filterText, filter === 'high' && styles.filterTextActive]}>High</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'medium' && styles.filterButtonActive]}
          onPress={() => setFilter('medium')}>
          <Text style={[styles.filterText, filter === 'medium' && styles.filterTextActive]}>Medium</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'low' && styles.filterButtonActive]}
          onPress={() => setFilter('low')}>
          <Text style={[styles.filterText, filter === 'low' && styles.filterTextActive]}>Low</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredPriorities.map((item, index) => {
          const level = getPriorityLevel(item.priorityScore);
          const color = getPriorityColor(level);

          return (
            <TouchableOpacity
              key={`${item.siteId}-${item.virusId}`}
              style={styles.priorityCard}
              onPress={() => onSitePress?.(item.siteId, item.virusId)}>
              <View style={styles.cardHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={[styles.levelIndicator, { backgroundColor: color }]} />
                <View style={styles.cardInfo}>
                  <Text style={styles.virusName}>{item.virusName}</Text>
                  <Text style={styles.siteName}>{item.siteName}</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreValue, { color }]}>{item.priorityScore.toFixed(1)}</Text>
                  <Text style={styles.scoreLabel}>Priority</Text>
                </View>
              </View>

              <View style={styles.factorsGrid}>
                <View style={styles.factorItem}>
                  <AlertTriangle size={14} color="#64748b" />
                  <Text style={styles.factorLabel}>Danger</Text>
                  <View style={styles.factorBar}>
                    <View
                      style={[
                        styles.factorBarFill,
                        {
                          width: `${(item.factors.dangerLevel / 3) * 100}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.factorItem}>
                  <Activity size={14} color="#64748b" />
                  <Text style={styles.factorLabel}>Level</Text>
                  <View style={styles.factorBar}>
                    <View
                      style={[
                        styles.factorBarFill,
                        {
                          width: `${(item.factors.concentrationFactor / 10) * 100}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.factorItem}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.factorLabel}>Distance</Text>
                  <View style={styles.factorBar}>
                    <View
                      style={[
                        styles.factorBarFill,
                        {
                          width: `${(item.factors.proximityFactor / 10) * 100}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.factorItem}>
                  <TrendingUp size={14} color="#64748b" />
                  <Text style={styles.factorLabel}>Trend</Text>
                  <View style={styles.factorBar}>
                    <View
                      style={[
                        styles.factorBarFill,
                        {
                          width: `${(item.factors.trendFactor / 1.5) * 100}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.factorItem}>
                  <Users size={14} color="#64748b" />
                  <Text style={styles.factorLabel}>Population</Text>
                  <View style={styles.factorBar}>
                    <View
                      style={[
                        styles.factorBarFill,
                        {
                          width: `${(item.factors.populationFactor / 10) * 100}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredPriorities.length === 0 && (
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No alerts in this category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  priorityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  levelIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  cardInfo: {
    flex: 1,
  },
  virusName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  siteName: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  factorsGrid: {
    gap: 8,
    marginBottom: 12,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 70,
  },
  factorBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  distanceText: {
    fontSize: 12,
    color: '#64748b',
  },
});
