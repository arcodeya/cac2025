import { TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={toggleTheme}
    >
      {theme === 'light' ? (
        <Moon size={20} color={colors.text} />
      ) : (
        <Sun size={20} color={colors.text} />
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
