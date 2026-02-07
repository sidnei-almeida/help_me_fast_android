/**
 * Tema do Help Me Fast — adaptado para React Native (valores numéricos).
 * Mesmas cores e proporções do app Electron.
 */
export const theme = {
  colors: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
      muted: '#B2BEC3',
    },
    accent: '#FF7675',
    success: '#00B894',
    warning: '#FDCB6E',
    danger: '#D63031',
    phases: {
      anabolic: '#38B2AC',
      catabolic: '#ECC94B',
      fatBurn: '#ED8936',
      ketosis: '#D53F8C',
    },
    gradient: {
      start: '#FF9966',
      end: '#FF5E62',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 12,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  /** Inter font (loaded via @expo-google-fonts/inter). Same as desktop app. */
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
  },
};

export type Theme = typeof theme;
