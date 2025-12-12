// Momentum Design Tokens - Dark-First Premium Theme
// Primary: Monochrome/White | Background: Deep Black

// Dark theme tokens (default)
const darkColors = {
  // === Base Surfaces ===
  background: '#0b0b0d',      // App background (core)
  surface: '#121417',         // Cards / sheets
  elevated: '#17181b',        // Slightly lighter for elevated surfaces
  border: 'rgba(255,255,255,0.08)', // Borders
  separator: 'rgba(255,255,255,0.06)', // Subtle lines

  // === Primary Accent (Monochrome White) ===
  primary: '#FFFFFF',         // Main accent - white
  primaryMuted: 'rgba(255,255,255,0.87)', // Slightly muted white
  primarySubtle: 'rgba(255,255,255,0.64)', // Subtle white
  onPrimary: '#0b0b0d',       // Text/icons on primary (dark)

  // === Blue Accent (Landing page / highlights) ===
  accentBlue: '#2563eb',      // Primary blue
  accentBlueMuted: '#3b82f6', // Muted blue
  accentBlueLight: '#60a5fa', // Light blue for highlights
  accentBluePale: '#93c5fd',  // Pale blue for subtle accents
  onAccentBlue: '#FFFFFF',    // Text on blue backgrounds

  // === Text Hierarchy ===
  text: '#E6E7EA',            // Primary text (canonical)
  textPrimary: '#E6E7EA',     // Alias for text
  textSecondary: 'rgba(230,231,234,0.72)', // Secondary text
  textMuted: 'rgba(230,231,234,0.64)',     // Muted text
  textTertiary: 'rgba(230,231,234,0.48)', // Tertiary/caption text
  textSubtle: 'rgba(230,231,234,0.48)',   // Alias for tertiary
  textInverse: '#0b0b0d',     // Text on light backgrounds

  // === Pastel Spot Accents (Avatars / Tags) ===
  pastelPink: '#ffb3c7',
  pastelBlue: '#8fcfff',
  pastelGreen: '#b8f2c2',
  pastelPurple: '#c4b5fd',
  pastelPeach: '#fcd5b5',
  pastelOrange: '#ffbe7d',
  pastelYellow: '#fef08a',
  pastelRed: '#fca5a5',

  // === Functional Colors ===
  success: '#3DDC84',
  successMuted: 'rgba(61,220,132,0.16)',
  warning: '#FFB86B',
  warningMuted: 'rgba(255,184,107,0.16)',
  error: '#FF5C5C',
  errorMuted: 'rgba(255,92,92,0.16)',
  info: '#8fcfff',
  infoMuted: 'rgba(143,207,255,0.16)',

  // === Alpha values ===
  whiteAlpha06: 'rgba(255,255,255,0.06)',
  whiteAlpha12: 'rgba(255,255,255,0.12)',
  whiteAlpha20: 'rgba(255,255,255,0.20)',
  blackAlpha40: 'rgba(0,0,0,0.40)',
  blackAlpha60: 'rgba(0,0,0,0.60)',

  // === Shadow ===
  shadow: 'rgba(0,0,0,0.28)',
} as const;

// Light theme tokens (for system theme auto-switch)
const lightColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  separator: 'rgba(0,0,0,0.06)',

  primary: '#0b0b0d',
  primaryMuted: 'rgba(11,11,13,0.87)',
  primarySubtle: 'rgba(11,11,13,0.64)',
  onPrimary: '#FFFFFF',

  text: '#1a1a1a',
  textPrimary: '#1a1a1a',
  textSecondary: 'rgba(26,26,26,0.64)',
  textMuted: 'rgba(26,26,26,0.56)',
  textTertiary: 'rgba(26,26,26,0.44)',
  textSubtle: 'rgba(26,26,26,0.44)',
  textInverse: '#FFFFFF',

  pastelPink: '#ff8fab',
  pastelBlue: '#64b5f6',
  pastelGreen: '#81c784',
  pastelPurple: '#b39ddb',
  pastelPeach: '#ffb74d',
  pastelOrange: '#ffa726',
  pastelYellow: '#fdd835',

  success: '#2e7d32',
  successMuted: 'rgba(46,125,50,0.12)',
  warning: '#f57c00',
  warningMuted: 'rgba(245,124,0,0.12)',
  error: '#c62828',
  errorMuted: 'rgba(198,40,40,0.12)',
  info: '#1976d2',
  infoMuted: 'rgba(25,118,210,0.12)',

  whiteAlpha06: 'rgba(255,255,255,0.06)',
  whiteAlpha12: 'rgba(255,255,255,0.12)',
  whiteAlpha20: 'rgba(255,255,255,0.20)',
  blackAlpha40: 'rgba(0,0,0,0.40)',
  blackAlpha60: 'rgba(0,0,0,0.60)',

  shadow: 'rgba(0,0,0,0.08)',
} as const;

// Export structured colors with dark/light namespaces
export const colors = {
  // Themed variants
  dark: darkColors,
  light: lightColors,
  
  // Flat exports (default to dark theme for convenience)
  ...darkColors,
} as const;

export type DarkColors = typeof darkColors;
export type LightColors = typeof lightColors;
export type ColorKey = keyof DarkColors;
export type Colors = typeof colors;