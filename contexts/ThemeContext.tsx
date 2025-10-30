import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    card: string;
    cardBorder: string;
    headerBackground: string;
    modalOverlay: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemColorScheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light'
    ? {
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        primary: '#2563eb',
        card: '#ffffff',
        cardBorder: '#e2e8f0',
        headerBackground: '#ffffff',
        modalOverlay: 'rgba(0, 0, 0, 0.5)',
      }
    : {
        background: '#0a0e1a',
        surface: '#0f1419',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: '#1e293b',
        primary: '#3b82f6',
        card: '#0f1419',
        cardBorder: '#1e293b',
        headerBackground: '#0f1419',
        modalOverlay: 'rgba(0, 0, 0, 0.85)',
      };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
