import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { Bell, AlertTriangle, Info, CheckCircle2, MapPin, Target, Search, Activity } from 'lucide-react-native';
import AlertPriorityDashboard from '@/components/AlertPriorityDashboard';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { generateAnomalyAlerts, saveAnomalyAlerts } from '@/services/anomaly-alerts';

interface MockAlert {
  id: string;
  type: 'spike' | 'prediction' | 'info' | 'anomaly';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  location: string;
  virus: string;
  timestamp: string;
  read: boolean;
}

export default function AlertsScreen() {
  const { colors, theme } = useTheme();
  const [alerts, setAlerts] = useState<MockAlert[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showPriorityDashboard, setShowPriorityDashboard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAlerts, setFilteredAlerts] = useState<MockAlert[]>([]);

  useEffect(() => {
    loadRealAlerts();
    getUserLocation();
    loadAnomalyAlerts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAlerts(alerts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAlerts(
        alerts.filter(
          alert =>
            alert.location.toLowerCase().includes(query) ||
            alert.virus.toLowerCase().includes(query) ||
            alert.title.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, alerts]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadRealAlerts = async () => {
    try {
      const { data: readings } = await supabase
        .from('wastewater_readings')
        .select('*, sampling_sites(name, county), virus_types(name)')
        .contains('raw_data', { state: 'Texas' })
        .order('sample_date', { ascending: false })
        .limit(50);

      if (readings) {
        const generatedAlerts: MockAlert[] = [];

        readings.forEach((reading: any) => {
          const state = reading.raw_data?.state;
          if (state !== 'Texas') return;
          const county = reading.raw_data?.county || reading.sampling_sites?.county || 'Unknown';
          const location = `${county}, Texas`;
          const virusName = reading.virus_types?.name || 'COVID-19';

          if (reading.level_category === 'high') {
            generatedAlerts.push({
              id: reading.id,
              type: 'spike',
              severity: 'critical',
              title: `High ${virusName} Levels Detected`,
              message: `${virusName} concentration at ${reading.concentration_level.toFixed(1)}% (high level) in ${location}. Consider taking extra precautions.`,
              location: location,
              virus: virusName,
              timestamp: new Date(reading.sample_date).toISOString(),
              read: false,
            });
          } else if (reading.level_category === 'medium' && reading.trend === 'increasing') {
            generatedAlerts.push({
              id: reading.id,
              type: 'prediction',
              severity: 'warning',
              title: `${virusName} Rising Trend`,
              message: `${virusName} levels are increasing in ${location}. Current level: ${reading.concentration_level.toFixed(1)}%. Stay informed.`,
              location: location,
              virus: virusName,
              timestamp: new Date(reading.sample_date).toISOString(),
              read: false,
            });
          } else if (reading.level_category === 'low') {
            generatedAlerts.push({
              id: reading.id,
              type: 'info',
              severity: 'info',
              title: `${virusName} Levels Low`,
              message: `${virusName} wastewater levels remain low in ${location}. Continue following standard prevention guidelines.`,
              location: location,
              virus: virusName,
              timestamp: new Date(reading.sample_date).toISOString(),
              read: true,
            });
          }
        });

        setAlerts(generatedAlerts.slice(0, 30));
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnomalyAlerts = async () => {
    try {
      const anomalies = await generateAnomalyAlerts();

      if (anomalies.length > 0) {
        const anomalyAlertItems: MockAlert[] = anomalies.map(anomaly => ({
          id: anomaly.id,
          type: 'anomaly' as const,
          severity: anomaly.severity,
          title: `Anomaly Detected: ${anomaly.virus_name}`,
          message: anomaly.message,
          location: anomaly.site_name,
          virus: anomaly.virus_name,
          timestamp: anomaly.detected_at,
          read: false,
        }));

        setAlerts(prev => [...anomalyAlertItems, ...prev].slice(0, 30));

        await saveAnomalyAlerts(anomalies);
      }
    } catch (error) {
      console.error('Error loading anomaly alerts:', error);
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (type === 'anomaly') {
      return <Activity size={24} color="#dc2626" />;
    }
    if (severity === 'critical') {
      return <AlertTriangle size={24} color="#dc2626" />;
    }
    if (severity === 'warning') {
      return <Bell size={24} color="#f59e0b" />;
    }
    return <Info size={24} color="#3b82f6" />;
  };

  const getAlertColor = (severity: string) => {
    if (severity === 'critical') return '#fef2f2';
    if (severity === 'warning') return '#fffbeb';
    return '#eff6ff';
  };

  const getAlertBorderColor = (severity: string) => {
    if (severity === 'critical') return '#fecaca';
    if (severity === 'warning') return '#fde68a';
    return '#bfdbfe';
  };

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Alerts</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by city, state, or virus..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={[styles.viewToggle, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.card, borderColor: colors.border }, !showPriorityDashboard && styles.toggleButtonActive]}
          onPress={() => setShowPriorityDashboard(false)}>
          <Bell size={16} color={!showPriorityDashboard ? '#ffffff' : colors.textSecondary} />
          <Text style={[styles.toggleText, { color: colors.textSecondary }, !showPriorityDashboard && styles.toggleTextActive]}>
            Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.card, borderColor: colors.border }, showPriorityDashboard && styles.toggleButtonActive]}
          onPress={() => setShowPriorityDashboard(true)}>
          <Target size={16} color={showPriorityDashboard ? '#ffffff' : colors.textSecondary} />
          <Text style={[styles.toggleText, { color: colors.textSecondary }, showPriorityDashboard && styles.toggleTextActive]}>
            Priority Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {showPriorityDashboard ? (
        <AlertPriorityDashboard userLocation={userLocation} />
      ) : (
        <>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Bell size={20} color={colors.textSecondary} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
            thumbColor='#ffffff'
            ios_backgroundColor="#cbd5e1"
            style={{
              transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
            }}
          />
        </View>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          Receive real-time alerts when virus levels change significantly in your area
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle2 size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear!</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              No alerts at this time. We'll notify you if anything changes.
            </Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {filteredAlerts.map(alert => (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: getAlertColor(alert.severity),
                    borderColor: getAlertBorderColor(alert.severity),
                  },
                  !alert.read && styles.alertCardUnread,
                ]}
                onPress={() => markAsRead(alert.id)}>
                <View style={styles.alertHeader}>
                  {getAlertIcon(alert.type, alert.severity)}
                  <View style={styles.alertHeaderText}>
                    <Text style={[styles.alertTitle, { color: '#0f172a' }]}>{alert.title}</Text>
                    <Text style={[styles.alertTimestamp, { color: '#64748b' }]}>
                      {formatTimestamp(alert.timestamp)}
                    </Text>
                  </View>
                  {!alert.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={[styles.alertMessage, { color: '#475569' }]}>{alert.message}</Text>

                <View style={styles.alertFooter}>
                  <View style={styles.alertTag}>
                    <MapPin size={12} color="#64748b" />
                    <Text style={[styles.alertTagText, { color: '#64748b' }]}>{alert.location}</Text>
                  </View>
                  <View style={styles.alertTag}>
                    <Text style={[styles.alertTagText, { color: '#64748b' }]}>{alert.virus}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Info size={20} color="#3b82f6" />
            <Text style={styles.infoTitle}>About Alerts</Text>
          </View>
          <Text style={styles.infoText}>
            Alerts are generated based on wastewater surveillance data and predictive models. We notify you when:
          </Text>
          <View style={styles.infoList}>
            <Text style={styles.infoListItem}>• Virus levels spike suddenly</Text>
            <Text style={styles.infoListItem}>• Our models predict rising trends</Text>
            <Text style={styles.infoListItem}>• New pathogens are detected</Text>
            <Text style={styles.infoListItem}>• Public health advisories are issued</Text>
          </View>
        </View>
      </ScrollView>
        </>
      )}
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
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  alertsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  alertCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  alertCardUnread: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  alertMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  alertTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  alertTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  infoSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoList: {
    gap: 6,
  },
  infoListItem: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
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
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
});
