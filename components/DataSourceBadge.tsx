import { View, Text, StyleSheet } from 'react-native';
import { Database, Sparkles } from 'lucide-react-native';

interface DataSourceBadgeProps {
  source?: string;
  virusName?: string;
}

export function DataSourceBadge({ source, virusName }: DataSourceBadgeProps) {
  const isRealData = virusName === 'COVID-19' || virusName === 'Influenza A';

  if (isRealData) {
    return (
      <View style={[styles.badge, styles.badgeReal]}>
        <Database size={12} color="#059669" />
        <Text style={[styles.badgeText, styles.badgeTextReal]}>
          CDC Data
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.badgeSynthetic]}>
      <Sparkles size={12} color="#7c3aed" />
      <Text style={[styles.badgeText, styles.badgeTextSynthetic]}>
        Simulated Data
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeReal: {
    backgroundColor: '#d1fae5',
  },
  badgeSynthetic: {
    backgroundColor: '#ede9fe',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextReal: {
    color: '#059669',
  },
  badgeTextSynthetic: {
    color: '#7c3aed',
  },
});
