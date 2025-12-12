// Momentum Typography Tokens
// Font: Inter (with system fallback)

export const typography = {
  // Font families
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    // System fallbacks
    system: 'System',
  },

  // Font sizes (with scaling support)
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },

  // Semantic text styles (nested)
  styles: {
    // Headers
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: 'Inter_700Bold',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 0,
    },
    h4: {
      fontSize: 17,
      lineHeight: 24,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 0,
    },
    // Body text
    bodyLarge: {
      fontSize: 17,
      lineHeight: 26,
      fontFamily: 'Inter_400Regular',
      letterSpacing: 0,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'Inter_400Regular',
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Inter_400Regular',
      letterSpacing: 0,
    },
    // Caption / Labels
    caption: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 0.25,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 0,
    },
    // Button text
    button: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 0.25,
    },
    buttonSmall: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 0.25,
    },
    // Numbers (for timers, streaks)
    number: {
      fontSize: 40,
      lineHeight: 48,
      fontFamily: 'Inter_700Bold',
      letterSpacing: -1,
    },
    numberLarge: {
      fontSize: 56,
      lineHeight: 64,
      fontFamily: 'Inter_700Bold',
      letterSpacing: -1.5,
    },
  },

  // Flat aliases for semantic text styles (convenient shortcuts)
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0,
  },
  h4: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.25,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.25,
  },
  buttonSmall: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.25,
  },
  number: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  numberLarge: {
    fontSize: 56,
    lineHeight: 64,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1.5,
  },
} as const;

export type Typography = typeof typography;
export type FontSize = keyof typeof typography.fontSize;
export type TextStyle = keyof typeof typography.styles;