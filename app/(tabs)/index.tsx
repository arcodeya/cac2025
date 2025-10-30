import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import type { SamplingSite, VirusType, WastewaterReading } from '@/types/database';
import { MapPin, X, TrendingUp, TrendingDown, Minus, CircleAlert as AlertCircle, Bug, Droplet, Shield, Activity, Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;
let WebMapView: any = null;

if (Platform.OS === 'web') {
  WebMapView = require('@/components/WebMapView').default;
} else {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
}

const { width, height } = Dimensions.get('window');

interface SiteWithReadings extends SamplingSite {
  readings?: WastewaterReading[];
}

export default function MapScreen() {
  const { colors, theme } = useTheme();
  const [sites, setSites] = useState<SiteWithReadings[]>([]);
  const [viruses, setViruses] = useState<VirusType[]>([]);
  const [selectedVirus, setSelectedVirus] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<SiteWithReadings | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState({
    latitude: 31.0,
    longitude: -99.0,
    latitudeDelta: 12,
    longitudeDelta: 12,
  });
  const [dataSeeded, setDataSeeded] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [showZipModal, setShowZipModal] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('Texas');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    initializeData();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (selectedVirus && sites.length > 0) {
      loadSiteReadings();
    }
  }, [selectedVirus, sites.length]);

  useEffect(() => {
    const states = new Set<string>();
    sites.forEach(site => {
      if (site.readings && site.readings.length > 0) {
        const state = site.readings[0].raw_data?.state;
        if (state) states.add(state);
      }
    });
    setAvailableStates(Array.from(states).sort());
  }, [sites]);

  const initializeData = async () => {
    try {
      setError(null);

      const [virusResult, siteResult] = await Promise.all([
        supabase.from('virus_types').select('*').order('name'),
        supabase.from('sampling_sites').select('*').eq('active', true),
      ]);

      if (virusResult.error) {
        throw new Error(`Failed to load virus types: ${virusResult.error.message}`);
      }

      if (siteResult.error) {
        throw new Error(`Failed to load sampling sites: ${siteResult.error.message}`);
      }

      if (virusResult.data) {
        const typedViruses = virusResult.data as VirusType[];
        setViruses(typedViruses);
        const covid19 = typedViruses.find(v => v.name.includes('COVID'));
        if (covid19) {
          setSelectedVirus(covid19.id);
        } else if (typedViruses.length > 0) {
          setSelectedVirus(typedViruses[0].id);
        }
      }

      if (siteResult.data) {
        setSites(siteResult.data as SamplingSite[]);
      }

    } catch (error) {
      console.error('Error initializing data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSiteReadings = async () => {
    if (!selectedVirus || sites.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('wastewater_readings')
      .select('*')
      .eq('virus_id', selectedVirus)
      .lte('sample_date', today)
      .order('sample_date', { ascending: false });

    if (error) {
      console.error('Error loading site readings:', error);
      return;
    }

    if (data) {
      if (data.length > 0) {
        setLastUpdated((data as WastewaterReading[])[0].sample_date);
      }

      const latestReadings = new Map();
      (data as WastewaterReading[]).forEach(reading => {
        if (!latestReadings.has(reading.site_id)) {
          latestReadings.set(reading.site_id, reading);
        }
      });

      const sitesWithReadings = sites.map(site => {
        const reading = latestReadings.get(site.id);
        return { ...site, readings: reading ? [reading] : [] };
      });

      setSites(sitesWithReadings);
    }
  };


  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 2,
          longitudeDelta: 2,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getMarkerColor = (site: SiteWithReadings): string => {
    if (!site.readings || site.readings.length === 0) return '#94a3b8';

    const reading = site.readings[0];
    const level = reading.level_category;

    if (level === 'high') return '#ef4444';
    if (level === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp size={16} color="#ef4444" />;
    if (trend === 'decreasing') return <TrendingDown size={16} color="#22c55e" />;
    return <Minus size={16} color="#64748b" />;
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  };

  const searchByZipCode = async () => {
    if (!zipCode || zipCode.length !== 5) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid 5-digit US zip code');
      } else {
        Alert.alert('Invalid Zip Code', 'Please enter a valid 5-digit US zip code');
      }
      return;
    }

    try {
      console.log('Searching for zip code:', zipCode);
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

      if (!response.ok) {
        console.log('Zip code API response not ok:', response.status);
        if (Platform.OS === 'web') {
          alert('Unable to find location for this zip code');
        } else {
          Alert.alert('Zip Code Not Found', 'Unable to find location for this zip code');
        }
        return;
      }

      const data = await response.json();
      console.log('Zip code data:', data);

      const lat = parseFloat(data.places[0].latitude);
      const lon = parseFloat(data.places[0].longitude);
      const placeName = data.places[0]['place name'];

      console.log(`Found location: ${placeName} at (${lat}, ${lon})`);

      const newRegion = {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

      console.log('Setting new region:', newRegion);
      setRegion(newRegion);

      setTimeout(() => {
        setShowZipModal(false);
        setZipCode('');

        if (Platform.OS === 'web') {
          alert(`Centered on ${placeName}`);
        }
      }, 800);
    } catch (error) {
      console.error('Zip code search error:', error);
      if (Platform.OS === 'web') {
        alert('Failed to search zip code. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to search zip code. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading monitoring data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <AlertCircle size={64} color="#ef4444" />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to Load Data</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          setLoading(true);
          initializeData();
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerGradient, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: theme === 'light' ? '#f1f5f9' : '#1e293b', borderRadius: 50 }]}>
              <Image source={require('@/assets/images/image.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>INFEX</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                Infectious-disease Forecasting & Epidemiology eXchange
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.controlsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.lastUpdatedContainer}>
          <Text style={[styles.lastUpdatedText, { color: '#10b981' }]}>
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Loading...'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle />
          <TouchableOpacity
            style={styles.zipSearchButtonSmall}
            onPress={() => setShowZipModal(true)}>
            <Search size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.virusSelector, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.virusSelectorContent}>
        {viruses.map(virus => {
          const getVirusIcon = () => {
            const iconColor = selectedVirus === virus.id ? '#ffffff' : colors.textSecondary;
            const iconSize = 18;
            const name = virus.name.toLowerCase();

            if (name.includes('covid')) return <Activity size={iconSize} color={iconColor} />;
            if (name.includes('flu') || name.includes('influenza')) return <Activity size={iconSize} color={iconColor} />;
            if (name.includes('rsv')) return <Shield size={iconSize} color={iconColor} />;
            if (name.includes('mpox')) return <AlertCircle size={iconSize} color={iconColor} />;
            return <Bug size={iconSize} color={iconColor} />;
          };

          return (
            <TouchableOpacity
              key={virus.id}
              style={[
                styles.virusSquare,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedVirus === virus.id && {
                  backgroundColor: virus.color_code,
                  borderColor: virus.color_code,
                },
              ]}
              onPress={() => setSelectedVirus(virus.id)}>
              <View style={styles.virusSquareIcon}>
                {getVirusIcon()}
              </View>
              <Text
                style={[
                  styles.virusSquareText,
                  { color: colors.text },
                  selectedVirus === virus.id && {
                    color: '#ffffff',
                    fontWeight: '700',
                  },
                ]}>
                {virus.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.stateFilterContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.stateFilterLabel, { color: colors.textSecondary }]}>Texas CDC Data • Powered by CDC NWSS API</Text>
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.map}>
          {WebMapView && (
            <WebMapView
              sites={sites.filter(site => {
                const hasTexasData = site.readings?.some(r => r.raw_data?.state === 'Texas');
                const validCoords = site.latitude >= 25 && site.latitude <= 37 &&
                                   site.longitude >= -107 && site.longitude <= -93;
                return hasTexasData && validCoords;
              })}
              userLocation={
                userLocation
                  ? {
                      latitude: userLocation.coords.latitude,
                      longitude: userLocation.coords.longitude,
                    }
                  : null
              }
              region={region}
              onSitePress={setSelectedSite}
              getMarkerColor={getMarkerColor}
            />
          )}
        </View>
      ) : (
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          provider={PROVIDER_DEFAULT}>
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              title="Your Location"
              pinColor="#2563eb"
            />
          )}

          {sites
            .filter(site => {
              const hasTexasData = site.readings?.some(r => r.raw_data?.state === 'Texas');
              const validCoords = site.latitude >= 25 && site.latitude <= 37 &&
                                 site.longitude >= -107 && site.longitude <= -93;
              return hasTexasData && validCoords;
            })
            .map(site => (
              <Marker
                key={site.id}
                coordinate={{
                  latitude: Number(site.latitude),
                  longitude: Number(site.longitude),
                }}
                onPress={() => setSelectedSite(site)}
                pinColor={getMarkerColor(site)}
              />
            ))}
        </MapView>
      )}


      <View style={[styles.legend, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>High</Text>
        </View>
      </View>

      <Modal
        visible={selectedSite !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSite(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedSite?.name}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedSite?.county} County</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSite(null)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Population Served:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {selectedSite?.population?.toLocaleString()}
                </Text>
              </View>

              {selectedSite?.readings && selectedSite.readings.length > 0 ? (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Virus Level</Text>

                  {selectedSite.readings.map(reading => {
                    const virus = viruses.find(v => v.id === reading.virus_id);
                    return (
                      <View key={reading.id} style={[styles.readingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.readingHeader}>
                          <Text style={[styles.virusName, { color: colors.text }]}>{virus?.name}</Text>
                          <View style={[styles.trendBadge, { backgroundColor: theme === 'light' ? '#f1f5f9' : '#1e293b' }]}>
                            {getTrendIcon(reading.trend)}
                            <Text style={[styles.trendText, { color: colors.textSecondary }]}>{reading.trend}</Text>
                          </View>
                        </View>

                        <View style={styles.levelRow}>
                          <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>Level:</Text>
                          <View
                            style={[
                              styles.levelBadge,
                              {
                                backgroundColor:
                                  reading.level_category === 'high'
                                    ? '#fee2e2'
                                    : reading.level_category === 'medium'
                                    ? '#fef3c7'
                                    : '#dcfce7',
                              },
                            ]}>
                            <Text
                              style={[
                                styles.levelBadgeText,
                                {
                                  color:
                                    reading.level_category === 'high'
                                      ? '#dc2626'
                                      : reading.level_category === 'medium'
                                      ? '#d97706'
                                      : '#16a34a',
                                },
                              ]}>
                              {reading.level_category.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.dateText}>
                          Sample date: {new Date(reading.sample_date).toLocaleDateString()}
                        </Text>
                        <Text style={styles.confidenceText}>
                          Confidence: {((reading.confidence_score || 0) * 100).toFixed(0)}%
                        </Text>
                      </View>
                    );
                  })}
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No recent data available</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showZipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowZipModal(false)}>
        <View style={[styles.zipModalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.zipModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.zipModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.zipModalTitle, { color: colors.text }]}>Search by Zip Code</Text>
              <TouchableOpacity onPress={() => setShowZipModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.zipModalDescription, { color: colors.textSecondary }]}>
              Enter a US zip code to view wastewater monitoring data in that area
            </Text>
            <TextInput
              style={[styles.zipInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="Enter 5-digit zip code"
              keyboardType="numeric"
              maxLength={5}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={styles.zipSearchSubmitButton}
              onPress={searchByZipCode}>
              <Search size={20} color="#ffffff" />
              <Text style={styles.zipSearchSubmitText}>Search Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  zipSearchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  lastUpdatedContainer: {
    flex: 1,
  },
  lastUpdatedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  zipSearchButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  virusSelector: {
    backgroundColor: '#f8fafc',
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  virusSelectorContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  virusSquare: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  virusSquareIcon: {
    marginBottom: 4,
  },
  virusSquareText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  stateFilterContainer: {
    backgroundColor: '#ffffff',
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 12,
    position: 'absolute',
    top: 238,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stateFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 3,
  },
  stateFilterScroll: {
    paddingHorizontal: 12,
  },
  stateFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  stateFilterChipActive: {
    backgroundColor: '#3b82f6',
  },
  stateFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stateFilterTextActive: {
    color: '#ffffff',
  },
  map: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  webMapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  locationButton: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  legend: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  readingCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  virusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  layerControls: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  layerButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  layerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  layerButtonTextActive: {
    color: '#ffffff',
  },
  zipModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  zipModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  zipModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zipModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  zipModalDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  zipInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  zipSearchSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
  },
  zipSearchSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
