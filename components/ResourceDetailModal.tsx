import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import {
  X,
  MapPin,
  Phone,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  List,
} from 'lucide-react-native';
import type { PublicHealthResource } from '@/types/database';

interface Props {
  resource: PublicHealthResource | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

export default function ResourceDetailModal({ resource, userLocation, onClose }: Props) {
  if (!resource) return null;

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vaccination_site: 'Vaccination Site',
      hospital: 'Hospital',
      testing_center: 'Testing Center',
      clinic: 'Health Clinic',
      antiviral_distribution: 'Antiviral Distribution',
    };
    return labels[type] || type;
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'vaccination_site':
        return '#2563eb';
      case 'hospital':
        return '#dc2626';
      case 'testing_center':
        return '#8b5cf6';
      case 'clinic':
        return '#22c55e';
      case 'antiviral_distribution':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const calculateDistance = () => {
    if (!userLocation) return null;

    const R = 6371;
    const dLat = (resource.latitude - userLocation.latitude) * (Math.PI / 180);
    const dLon = (resource.longitude - userLocation.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * (Math.PI / 180)) *
        Math.cos(resource.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = calculateDistance();

  const handlePhoneCall = () => {
    if (resource.phone) {
      Linking.openURL(`tel:${resource.phone}`);
    }
  };

  const handleWebsite = () => {
    if (resource.website) {
      Linking.openURL(resource.website);
    }
  };

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`;
    Linking.openURL(url);
  };

  return (
    <Modal visible={resource !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View
                style={[
                  styles.colorIndicator,
                  { backgroundColor: getResourceColor(resource.resource_type) },
                ]}
              />
              <View style={styles.titleContainer}>
                <Text style={styles.modalTitle}>{resource.name}</Text>
                <Text style={styles.resourceType}>{getResourceTypeLabel(resource.resource_type)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {!resource.active && (
              <View style={styles.warningBox}>
                <AlertCircle size={20} color="#dc2626" />
                <Text style={styles.warningText}>This facility is currently inactive or closed.</Text>
              </View>
            )}

            {distance && (
              <View style={styles.distanceCard}>
                <MapPin size={20} color="#2563eb" />
                <View style={styles.distanceInfo}>
                  <Text style={styles.distanceValue}>{distance.toFixed(1)} km</Text>
                  <Text style={styles.distanceLabel}>from your location</Text>
                </View>
                <TouchableOpacity onPress={handleDirections} style={styles.directionsButton}>
                  <Text style={styles.directionsText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color="#2563eb" />
                <Text style={styles.sectionTitle}>Address</Text>
              </View>
              {resource.address && <Text style={styles.infoText}>{resource.address}</Text>}
              <Text style={styles.infoText}>
                {resource.city}, {resource.county} County
              </Text>
            </View>

            {resource.phone && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Phone size={20} color="#22c55e" />
                  <Text style={styles.sectionTitle}>Contact</Text>
                </View>
                <TouchableOpacity onPress={handlePhoneCall} style={styles.contactButton}>
                  <Text style={styles.contactText}>{resource.phone}</Text>
                </TouchableOpacity>
              </View>
            )}

            {resource.hours_of_operation && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Clock size={20} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>Hours</Text>
                </View>
                <Text style={styles.infoText}>{resource.hours_of_operation}</Text>
                {resource.accepts_walkins && (
                  <View style={styles.walkinBadge}>
                    <CheckCircle size={16} color="#22c55e" />
                    <Text style={styles.walkinText}>Walk-ins accepted</Text>
                  </View>
                )}
              </View>
            )}

            {resource.services && resource.services.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <List size={20} color="#8b5cf6" />
                  <Text style={styles.sectionTitle}>Services</Text>
                </View>
                <View style={styles.servicesList}>
                  {resource.services.map((service, index) => (
                    <View key={index} style={styles.serviceItem}>
                      <View style={styles.serviceDot} />
                      <Text style={styles.serviceText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {resource.website && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Globe size={20} color="#2563eb" />
                  <Text style={styles.sectionTitle}>Website</Text>
                </View>
                <TouchableOpacity onPress={handleWebsite} style={styles.websiteButton}>
                  <Text style={styles.websiteText}>{resource.website}</Text>
                </TouchableOpacity>
              </View>
            )}
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  colorIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
  },
  titleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  resourceType: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    gap: 12,
  },
  distanceInfo: {
    flex: 1,
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  directionsButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  directionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  contactButton: {
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
  },
  walkinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  walkinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8b5cf6',
  },
  serviceText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  websiteButton: {
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  websiteText: {
    fontSize: 14,
    color: '#1e40af',
  },
});
