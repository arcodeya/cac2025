import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { TimeSeriesSnapshot } from '@/types/database';

interface Props {
  siteId: string;
  virusId: string;
  onSnapshotChange: (snapshot: TimeSeriesSnapshot) => void;
}

export default function TimeSeriesPlayer({ siteId, virusId, onSnapshotChange }: Props) {
  const [snapshots, setSnapshots] = useState<TimeSeriesSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadSnapshots();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [siteId, virusId]);

  useEffect(() => {
    if (snapshots.length > 0 && currentIndex < snapshots.length) {
      onSnapshotChange(snapshots[currentIndex]);
    }
  }, [currentIndex, snapshots]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 800);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, snapshots.length]);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('time_series_snapshots')
        .select('*')
        .eq('site_id', siteId)
        .eq('virus_id', virusId)
        .order('snapshot_date', { ascending: true });

      if (data) {
        setSnapshots(data as TimeSeriesSnapshot[]);
        setCurrentIndex(Math.max(0, data.length - 1));
      }
    } catch (error) {
      console.error('Error loading time series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1));
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getLevelColor = (category: string | null) => {
    switch (category) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#94a3b8';
    }
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'increasing':
        return '↗';
      case 'decreasing':
        return '↘';
      case 'stable':
        return '→';
      default:
        return '–';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  if (snapshots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No historical data available</Text>
      </View>
    );
  }

  const currentSnapshot = snapshots[currentIndex];
  const progress = ((currentIndex + 1) / snapshots.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#64748b" />
          <Text style={styles.dateText}>{formatDate(currentSnapshot.snapshot_date)}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getLevelColor(currentSnapshot.level_category) },
            ]}>
            <Text style={styles.levelText}>
              {currentSnapshot.level_category?.toUpperCase() || 'N/A'}
            </Text>
          </View>
          <View style={styles.trendContainer}>
            <Text style={styles.trendIcon}>{getTrendIcon(currentSnapshot.trend_direction)}</Text>
            {currentSnapshot.comparison_to_previous_week !== null && (
              <Text style={styles.comparisonText}>
                {currentSnapshot.comparison_to_previous_week > 0 ? '+' : ''}
                {currentSnapshot.comparison_to_previous_week.toFixed(1)}%
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Day {currentIndex + 1} of {snapshots.length}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handleRestart} style={styles.controlButton}>
          <SkipBack size={20} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePrevious} style={styles.controlButton} disabled={currentIndex === 0}>
          <SkipBack size={16} color={currentIndex === 0 ? '#cbd5e1' : '#475569'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          {isPlaying ? <Pause size={24} color="#ffffff" /> : <Play size={24} color="#ffffff" />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={styles.controlButton}
          disabled={currentIndex === snapshots.length - 1}>
          <SkipForward
            size={16}
            color={currentIndex === snapshots.length - 1 ? '#cbd5e1' : '#475569'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCurrentIndex(snapshots.length - 1)}
          style={styles.controlButton}>
          <SkipForward size={20} color="#475569" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: {
    fontSize: 18,
    color: '#64748b',
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
