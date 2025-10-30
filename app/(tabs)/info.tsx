import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import type { VirusType } from '@/types/database';
import { ChevronRight, X, Shield, AlertCircle, Droplet, Activity } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function InfoScreen() {
  const { colors, theme } = useTheme();
  const [viruses, setViruses] = useState<VirusType[]>([]);
  const [selectedVirus, setSelectedVirus] = useState<VirusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViruses();
  }, []);

  const loadViruses = async () => {
    try {
      const { data } = await supabase
        .from('virus_types')
        .select('*')
        .order('name');

      if (data) {
        setViruses(data);
      }
    } catch (error) {
      console.error('Error loading viruses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading information...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Health Information</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Learn about tracked viruses and prevention</Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.aboutCard, { backgroundColor: theme === 'light' ? '#eff6ff' : '#1e3a5f', borderColor: theme === 'light' ? '#bfdbfe' : '#2563eb' }]}>
          <View style={styles.aboutHeader}>
            <View style={[styles.logoContainer, { backgroundColor: theme === 'light' ? '#f1f5f9' : '#1e293b' }]}>
              <Image source={require('@/assets/images/image.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={[styles.aboutTitle, { color: theme === 'light' ? '#1e40af' : '#60a5fa' }]}>About INFEX</Text>
          </View>
          <Text style={[styles.aboutText, { color: theme === 'light' ? '#475569' : '#cbd5e1' }]}>
            INFEX (Infectious-disease Forecasting & Epidemiology eXchange) provides real-time wastewater surveillance data for Texas using the CDC's National Wastewater Surveillance System (NWSS) API.
          </Text>
          <Text style={[styles.aboutText, { color: theme === 'light' ? '#475569' : '#cbd5e1' }]}>
            By analyzing wastewater samples from across Texas, we can detect virus presence in communities before widespread illness occurs, providing early warning signals for potential outbreaks.
          </Text>
        </View>


        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracked Viruses & Pathogens</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Tap any virus to learn about symptoms, transmission, and prevention
          </Text>

          <View style={styles.virusList}>
            {viruses.map(virus => (
              <TouchableOpacity
                key={virus.id}
                style={[styles.virusCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSelectedVirus(virus)}>
                <View style={styles.virusCardHeader}>
                  <View
                    style={[
                      styles.virusColorIndicator,
                      { backgroundColor: virus.color_code },
                    ]}
                  />
                  <View style={styles.virusCardContent}>
                    <Text style={[styles.virusCardTitle, { color: colors.text }]}>{virus.name}</Text>
                    <Text style={[styles.virusCardScientific, { color: colors.textSecondary }]}>{virus.scientific_name}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor:
                        virus.severity_level === 'high'
                          ? '#fee2e2'
                          : virus.severity_level === 'medium'
                          ? '#fef3c7'
                          : '#dcfce7',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.severityText,
                      {
                        color:
                          virus.severity_level === 'high'
                            ? '#dc2626'
                            : virus.severity_level === 'medium'
                            ? '#d97706'
                            : '#16a34a',
                      },
                    ]}>
                    {virus.severity_level === 'high'
                      ? 'High Risk'
                      : virus.severity_level === 'medium'
                      ? 'Moderate Risk'
                      : 'Low Risk'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Sample Collection</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Wastewater samples are collected from treatment facilities across Texas cities
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Laboratory Analysis</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Advanced sequencing technology identifies thousands of viruses and variants
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Data Processing</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Machine learning models analyze trends and generate outbreak predictions
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Alert Generation</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  You receive real-time notifications about virus levels in your area
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.disclaimerCard, { backgroundColor: theme === 'light' ? '#fffbeb' : '#422006', borderColor: theme === 'light' ? '#fde68a' : '#d97706' }]}>
          <View style={styles.disclaimerHeader}>
            <AlertCircle size={20} color="#d97706" />
            <Text style={[styles.disclaimerTitle, { color: theme === 'light' ? '#92400e' : '#fbbf24' }]}>Important Disclaimer</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: theme === 'light' ? '#78350f' : '#fcd34d' }]}>
            This app provides informational content based on wastewater surveillance data. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider with any questions regarding a medical condition.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={selectedVirus !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVirus(null)}>
        {selectedVirus && (
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.modalTitleContainer}>
                  <View
                    style={[
                      styles.modalColorIndicator,
                      { backgroundColor: selectedVirus.color_code },
                    ]}
                  />
                  <View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedVirus.name}</Text>
                    <Text style={[styles.modalScientific, { color: colors.textSecondary }]}>{selectedVirus.scientific_name}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedVirus(null)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Activity size={20} color={colors.primary} />
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>About</Text>
                  </View>
                  <Text style={[styles.modalText, { color: colors.textSecondary }]}>{selectedVirus.description}</Text>
                </View>

                {selectedVirus.symptoms && selectedVirus.symptoms.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <AlertCircle size={20} color="#ef4444" />
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Common Symptoms</Text>
                    </View>
                    <View style={styles.symptomsList}>
                      {selectedVirus.symptoms.map((symptom, index) => (
                        <View key={index} style={styles.symptomItem}>
                          <View style={styles.symptomDot} />
                          <Text style={[styles.symptomText, { color: colors.textSecondary }]}>{symptom}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedVirus.transmission && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Droplet size={20} color="#f59e0b" />
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>How It Spreads</Text>
                    </View>
                    <Text style={[styles.modalText, { color: colors.textSecondary }]}>{selectedVirus.transmission}</Text>
                  </View>
                )}

                {selectedVirus.prevention_tips && selectedVirus.prevention_tips.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Shield size={20} color="#22c55e" />
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Prevention Tips</Text>
                    </View>
                    <View style={styles.preventionList}>
                      {selectedVirus.prevention_tips.map((tip, index) => (
                        <View key={index} style={styles.preventionItem}>
                          <View style={styles.preventionNumber}>
                            <Text style={styles.preventionNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={[styles.preventionText, { color: colors.textSecondary }]}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={[styles.modalFooter, { backgroundColor: theme === 'light' ? '#f1f5f9' : '#1e293b' }]}>
                  <Text style={[styles.modalFooterText, { color: colors.textSecondary }]}>
                    If you experience these symptoms, consult with a healthcare provider for proper diagnosis and treatment.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  content: {
    flex: 1,
  },
  aboutCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
  },
  aboutText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  dataSourceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dataSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dataSourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  dataSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataSourceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dataSourceTextContainer: {
    flex: 1,
  },
  dataSourceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  dataSourceSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  dataSourceNote: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  virusList: {
    gap: 12,
  },
  virusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  virusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  virusColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  virusCardContent: {
    flex: 1,
  },
  virusCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  virusCardScientific: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepsList: {
    gap: 20,
  },
  step: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  disclaimerCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#78350f',
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
  },
  modalFooterText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
