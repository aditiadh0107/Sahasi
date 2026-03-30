// design system for sahasi app
// pink theme for women's safety app

export const ColorPalette = {
  primary: {
    pink: '#E91E8C',
    pinkLight: '#FF69B4',
    pinkSoft: '#FFB6C1',
    pinkPale: '#FFF0F5',
    rose: '#FF007F',
    roseGold: '#B76E79',
  },

  secondary: {
    lavender: '#E6E6FA',
    lavenderDark: '#9370DB',
    lilac: '#DDA0DD',
    violet: '#EE82EE',
    orchid: '#DA70D6',
    beige: '#FFF5EE',
    beigeLight: '#FFFAF5',
  },

  accent: {
    coral: '#FF7F7F',
    peach: '#FFCBA4',
    salmon: '#FFA07A',
    blush: '#FFE4E1',
    champagne: '#F7E7CE',
    purple: '#9B59B6',
    purpleSoft: '#E8DAEF',
  },

  success: {
    green: '#3CB371',
    greenLight: '#98FB98',
    greenSoft: '#F0FFF0',
    mint: '#98FF98',
    seafoam: '#71EEB8',
    greenPale: '#E8F5E9',
  },

  warning: {
    orange: '#FFB347',
    orangeLight: '#FFD89B',
    orangeSoft: '#FFF3E0',
    amber: '#FFBF00',
  },

  danger: {
    red: '#FF6B6B',
    redLight: '#FFB4B4',
    redSoft: '#FFEBEE',
    crimson: '#DC143C',
  },

  neutral: {
    white: '#FFFFFF',
    cream: '#FFFAFA',
    pearl: '#F5F5F5',
    beige: '#F5E6D3',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#2D2D2D',
    black: '#1A1A1A',
  },

  text: {
    primary: '#2D2D2D',
    secondary: '#6B6B6B',
    tertiary: '#9E9E9E',
    disabled: '#BDBDBD',
    white: '#FFFFFF',
    pink: '#E91E8C',
  },

  // gradients used in the app
  gradients: {
    pinkToLavender: ['#FFB6C1', '#E6E6FA'] as const,
    roseToPeach: ['#FFB6C1', '#FFCBA4'] as const,
    lavenderToBlush: ['#E6E6FA', '#FFE4E1'] as const,
    sunsetPink: ['#FF6B9D', '#FFB6C1', '#FFCBA4'] as const,
    candyPink: ['#E91E8C', '#FF69B4'] as const,
    pinkToBeige: ['#FFF0F5', '#FFF5EE'] as const,
    mintFresh: ['#E8F5E9', '#98FF98'] as const,
    purpleDream: ['#DDA0DD', '#E6E6FA'] as const,
  },
}

export const Typography = {
  fontFamily: {
    primary: 'Poppins',
    secondary: 'Inter',
    accent: 'Quicksand',
  },

  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    title: 32,
    hero: 40,
  },

  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
}

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 50,
  full: 9999,
}

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  sos: {
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
}

export const ButtonStyles: any = {
  primary: {
    backgroundColor: ColorPalette.primary.pink,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  secondary: {
    backgroundColor: ColorPalette.secondary.lavenderDark,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  success: {
    backgroundColor: ColorPalette.success.green,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ColorPalette.primary.pink,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  text: {
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
}

export const CardStyles: any = {
  standard: {
    backgroundColor: ColorPalette.neutral.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  beige: {
    backgroundColor: ColorPalette.secondary.beige,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  featured: {
    backgroundColor: ColorPalette.primary.pinkPale,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: ColorPalette.primary.pinkLight,
  },
  interactive: {
    backgroundColor: ColorPalette.neutral.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
}

export const InputStyles: any = {
  standard: {
    backgroundColor: ColorPalette.neutral.white,
    borderWidth: 1,
    borderColor: ColorPalette.neutral.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: ColorPalette.text.primary,
  },
  focused: {
    borderColor: ColorPalette.primary.pink,
    borderWidth: 2,
  },
  error: {
    borderColor: ColorPalette.danger.red,
    borderWidth: 2,
  },
}

// TODO: could add more styles here later
export const TextStyles = {
  heading1: {
    fontSize: Typography.fontSize.hero,
    fontWeight: Typography.fontWeight.bold,
    color: ColorPalette.text.primary,
  },
  body: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: ColorPalette.text.primary,
  },
}
