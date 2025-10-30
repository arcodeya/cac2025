import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import {
  X,
  MapPin,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
} from 'lucide-react-native';
import type { OutbreakSite } from '@/types/database';

interface Props {
  outbreak: (OutbreakSite & { virus_name?: string }) | null;
  onClose: () => void;
}

export default function OutbreakDetailModal({ outbreak, onClose }: Props) {
  if (!outbreak) return null;

  const getSiteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      school: 'School',
      nursing_home: 'Nursing Home',
      restaurant: 'Restaurant',
      workplace: 'Workplace',
      healthcare: 'Healthcare Facility',
      community: 'Community Center',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#dc2626';
      case 'contained':
        return '#f59e0b';
      case 'resolved':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <Modal visible={outbreak !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <Building size={24} color="#0f172a" />
                <View style={styles.titleContainer}>
                  <Text style={styles.modalTitle}>{outbreak.name}</Text>
                  <Text style={styles.siteType}>{getSiteTypeLabel(outbreak.site_type)}</Text>
                </View>
              </View>
              <View style={styles.badges}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(outbreak.status) }]}>
                  <Text style={styles.statusText}>{outbreak.status.toUpperCase()}</Text>
                </View>
                <View style={[styles.severityBadge, { borderColor: getSeverityColor(outbreak.severity) }]}>
                  <Text style={[styles.severityText, { color: getSeverityColor(outbreak.severity) }]}>
                    {outbreak.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Users size={20} color="#2563eb" />
                <Text style={styles.statValue}>{outbreak.case_count}</Text>
                <Text style={styles.statLabel}>Confirmed Cases</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={20} color="#f59e0b" />
                <Text style={styles.statValue}>{getDaysSince(outbreak.reported_date)}</Text>
                <Text style={styles.statLabel}>Days Since Report</Text>
              </View>
            </View>

            {outbreak.virus_name && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AlertCircle size={20} color="#dc2626" />
                  <Text style={styles.sectionTitle}>Pathogen</Text>
                </View>
                <Text style={styles.virusName}>{outbreak.virus_name}</Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color="#2563eb" />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              {outbreak.address && <Text style={styles.infoText}>{outbreak.address}</Text>}
              <Text style={styles.infoText}>
                {outbreak.city}, {outbreak.county} County
              </Text>
              <Text style={styles.coordsText}>
                {outbreak.latitude?.toFixed(4)}, {outbreak.longitude?.toFixed(4)}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Timeline</Text>
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Reported:</Text>
                <Text style={styles.timelineValue}>{formatDate(outbreak.reported_date)}</Text>
              </View>
              {outbreak.resolved_date && (
                <View style={styles.timelineItem}>
                  <Text style={styles.timelineLabel}>Resolved:</Text>
                  <Text style={styles.timelineValue}>{formatDate(outbreak.resolved_date)}</Text>
                </View>
              )}
            </View>

            {outbreak.status === 'active' && (
              <View style={styles.warningBox}>
                <AlertCircle size={20} color="#dc2626" />
                <Text style={styles.warningText}>
                  This outbreak is currently active. Follow local health department guidelines and take
                  appropriate precautions if you're in this area.
                </Text>
              </View>
            )}

            {outbreak.status === 'contained' && (
              <View style={styles.infoBox}>
                <AlertCircle size={20} color="#f59e0b" />
                <Text style={styles.infoBoxText}>
                  This outbreak is contained. Health officials are monitoring the situation and implementing
                  control measures.
                </Text>
              </View>
            )}

            {outbreak.status === 'resolved' && (
              <View style={styles.successBox}>
                <CheckCircle size={20} color="#22c55e" />
                <Text style={styles.successText}>
                  This outbreak has been resolved. No new cases have been reported in the specified time frame.
                </Text>
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
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  siteType: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
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
  virusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  timelineValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde047',
    marginTop: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  successBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
    marginTop: 8,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#14532d',
    lineHeight: 20,
  },
});
