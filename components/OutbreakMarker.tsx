import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { School, Home, Utensils, Briefcase, AlertTriangle } from 'lucide-react-native';
import type { OutbreakSite } from '@/types/database';

interface Props {
  outbreak: OutbreakSite & { virus_name?: string };
  onPress: () => void;
}

export default function OutbreakMarker({ outbreak, onPress }: Props) {
  const getIcon = () => {
    const iconProps = { size: 16, color: '#ffffff' };
    switch (outbreak.site_type) {
      case 'school':
        return <School {...iconProps} />;
      case 'nursing_home':
        return <Home {...iconProps} />;
      case 'restaurant':
        return <Utensils {...iconProps} />;
      case 'workplace':
        return <Briefcase {...iconProps} />;
      default:
        return <AlertTriangle {...iconProps} />;
    }
  };

  const getColor = () => {
    if (outbreak.status === 'resolved') return '#94a3b8';
    switch (outbreak.severity) {
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

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { backgroundColor: getColor() }]}>
      {getIcon()}
      {outbreak.case_count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{outbreak.case_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
});
