import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors, Colors } from './colors';
import { typography, Typography } from './typography';
import { spacing, radii, Spacing, Radii } from './spacing';

// Re-export tokens
export { colors } from './colors';
export { typography } from './typography';
export { spacing, radii } from './spacing';
export type { Colors, ColorKey, DarkColors, LightColors } from './colors';
export type { Spacing, SpacingKey, Radii, RadiiKey } from './spacing';
export type { Typography, FontSize, TextStyle } from './typography';

// Theme modes
export type ThemeMode = 'dark' | 'light' | 'system';

// Complete theme type
export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof colors.dark | typeof colors.light;
  typography: Typography;
  spacing: Spacing;
  radii: Radii;
}

// Theme context type
interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// Create context with undefined default
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Animation timing constants
export const animation = {
  // Micro interactions
  microDuration: 120,
  microEasing: 'ease-out',

  // Standard transitions
  duration: 200,
  easing: 'ease-in-out',

  // Spring animations (for reanimated)
  spring: {
    stiffness: 800,
    damping: 35,
    mass: 1,
  },

  // Card entrance
  cardEntrance: {
    stiffness: 800,
    damping: 35,
  },

  // Breathing animation
  breathingInhale: 700,
  breathingExhale: 700,

  // Confetti
  confettiDuration: { min: 700, max: 1400 },

  // Progress ring
  ringProgress: 60, // FPS
} as const;

// Shadow presets
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialMode = 'dark' 
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  // Determine if we should use dark mode
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Build the complete theme object
  const theme: Theme = useMemo(() => ({
    mode: themeMode,
    isDark,
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    radii,
  }), [themeMode, isDark]);

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    setThemeMode,
    toggleTheme,
  }), [theme, toggleTheme]);

  return React.createElement(
    ThemeContext.Provider,
    { value: contextValue },
    children
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook for just colors
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Convenience hook for just spacing
export const useSpacing = (): Spacing => {
  const { theme } = useTheme();
  return theme.spacing;
};