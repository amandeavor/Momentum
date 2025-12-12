// Momentum Spacing Tokens
// Base unit: 4px

export const spacing = {
  // Base spacing scale
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,

  // Semantic spacing
  screenPadding: 16,    // Horizontal padding for screens
  cardPadding: 16,      // Inner padding for cards
  sectionGap: 24,       // Gap between sections
  itemGap: 12,          // Gap between list items
  inlineGap: 8,         // Gap between inline elements

  // Touch targets (accessibility)
  minTouchTarget: 44,   // Minimum tappable area
  buttonHeight: 48,     // Standard button height
  inputHeight: 52,      // Standard input height
  avatarSmall: 32,
  avatarMedium: 44,
  avatarLarge: 64,
  
  // Border radius (aliases for backward compatibility)
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusXxl: 24,
  radiusFull: 9999,
  radiusCard: 20,
} as const;

// Border radius tokens (separate export)
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,           // Pill shape
  card: 20,             // Standard card radius
  cardLg: 24,           // Large card radius
} as const;

// Shadow presets
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
export type Radii = typeof radii;
export type RadiiKey = keyof Radii;