import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  console.log('[RootLayout] Rendering');
  useFrameworkReady();

  useEffect(() => {
    console.log('[RootLayout] Mounted');
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
