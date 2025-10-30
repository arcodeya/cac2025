import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw, Clock, AlertTriangle } from 'lucide-react-native';
import { tephiScraper } from '@/services/tephi-scraper';

interface DataFreshness {
  lastUpdate: string | null;
  isStale: boolean;
  daysSinceUpdate: number;
}

export function DataFreshnessIndicator() {
  const [freshness, setFreshness] = useState<DataFreshness | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFreshness();
  }, []);

  const checkFreshness = async () => {
    try {
      const data = await tephiScraper.getDataFreshness();
      setFreshness(data);
    } catch (error) {
      console.error('Failed to check data freshness:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await tephiScraper.refreshData();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await checkFreshness();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!freshness) return null;

  const getStatusColor = () => {
    if (freshness.isStale) return '#ef4444';
    if (freshness.daysSinceUpdate > 14) return '#f59e0b';
    return '#22c55e';
  };

  const getStatusText = () => {
    if (freshness.daysSinceUpdate === -1) return 'No data';
    if (freshness.daysSinceUpdate === 0) return 'Updated today';
    if (freshness.daysSinceUpdate === 1) return 'Updated yesterday';
    return `Updated ${freshness.daysSinceUpdate} days ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          {freshness.isStale ? (
            <AlertTriangle size={16} color={getStatusColor()} />
          ) : (
            <Clock size={16} color={getStatusColor()} />
          )}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
          onPress={handleRefresh}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            color="#ffffff"
            style={loading ? styles.spinning : undefined}
          />
          <Text style={styles.refreshText}>
            {loading ? 'Updating...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {freshness.isStale && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={14} color="#d97706" />
          <Text style={styles.warningText}>
            Data may be outdated. Tap Refresh to get latest information.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
  },
});
