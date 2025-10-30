import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Syringe, Building2, Beaker, Heart, Package } from 'lucide-react-native';
import type { PublicHealthResource } from '@/types/database';

interface Props {
  resource: PublicHealthResource;
  onPress: () => void;
}

export default function ResourceMarker({ resource, onPress }: Props) {
  const getIcon = () => {
    const iconProps = { size: 18, color: '#ffffff' };
    switch (resource.resource_type) {
      case 'vaccination_site':
        return <Syringe {...iconProps} />;
      case 'hospital':
        return <Building2 {...iconProps} />;
      case 'testing_center':
        return <Beaker {...iconProps} />;
      case 'clinic':
        return <Heart {...iconProps} />;
      case 'antiviral_distribution':
        return <Package {...iconProps} />;
      default:
        return <Building2 {...iconProps} />;
    }
  };

  const getColor = () => {
    if (!resource.active) return '#94a3b8';
    switch (resource.resource_type) {
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

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { backgroundColor: getColor() }]}>
      {getIcon()}
      {resource.accepts_walkins && resource.active && (
        <View style={styles.indicator} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  indicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
