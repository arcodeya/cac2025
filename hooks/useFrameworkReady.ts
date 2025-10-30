import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[FrameworkReady] Checking for frameworkReady callback...');
      if (window.frameworkReady) {
        console.log('[FrameworkReady] Calling frameworkReady callback');
        window.frameworkReady();
      } else {
        console.log('[FrameworkReady] No frameworkReady callback found, app should be visible');
      }
    }
  }, []);
}
