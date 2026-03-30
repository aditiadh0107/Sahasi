/**
 * Sahasi App Beautiful Pink Theme
 * Enhanced pink color palette for women's safety app
 */

import { Platform } from 'react-native';

// Global color constants — import T everywhere in the app
// Primary Pink: #FF6B9D | Light Pink: #FF8FAB | Pale BG: #FFF0F5
export const T = {
  primary: '#FF6B9D',   // primary pink buttons, active states, highlights
  light: '#FF8FAB',     // lighter pink for gradients and accents
  pale: '#FFF0F5',      // pale pink screen backgrounds
  card: '#FFD6E7',      // card accent, badges, soft fills
  white: '#FFFFFF',     // card backgrounds, inputs
  dark: '#2D2D2D',      // headings, primary text
  muted: '#6B6B6B',     // subtitles, secondary text
  border: '#F2D7E3',    // dividers, borders, input outlines
  success: '#4CAF50',   // health/BMI indicators only
  warning: '#FF9800',   // SOS / alerts / warnings only
};

const tintColorLight = '#FF1493'; // Deep pink
const tintColorDark = '#FF69B4';  // Hot pink

export const Colors = {
  light: {
    text: '#2D2D2D',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#E91E8C',              // Pink icons
    tabIconDefault: '#FF69B4',     // Pink default tabs
    tabIconSelected: tintColorLight,
    primary: '#FF1493',           // Deep pink primary
    secondary: '#FF69B4',         // Hot pink secondary
    tertiary: '#FFB6E1',          // Light pink tertiary
    success: '#FF69B4',           // Pink success (instead of green)
    warning: '#FF8C94',           // Pink warning
    danger: '#DC143C',            // Crimson danger
    gray100: '#FFF0F5',           // Pink-tinted white
    gray200: '#FFE4E6',           // Very light pink
    gray300: '#FFCCCB',           // Light pink gray
    gray400: '#F8BBD9',           // Pink gray
    gray500: '#E91E8C',           // Medium pink
    gray600: '#C2185B',           // Dark pink
  },
  dark: {
    text: '#FFFFFF',
    background: '#1A0A0F',         // Dark pink background
    tint: tintColorDark,
    icon: '#FF69B4',
    tabIconDefault: '#E91E8C',
    tabIconSelected: tintColorDark,
    primary: '#FF69B4',           // Hot pink primary
    secondary: '#FFB6C1',         // Light pink secondary
    tertiary: '#4A0E2F',          // Dark pink tertiary
    success: '#E91E8C',           // Pink success
    warning: '#FF8C94',           // Pink warning
    danger: '#FF6B6B',            // Light red danger
    gray100: '#2D1B20',           // Dark pink gray
    gray200: '#4A2C2A',           // Dark pink gray
    gray300: '#7B4173',           // Medium pink gray
    gray400: '#A569BD',           // Purple-pink gray
    gray500: '#E74C3C',           // Pink gray
    gray600: '#FF69B4',           // Hot pink gray
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
  full: 9999,      // Added missing full border radius
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    largeTitle: 32,
    hero: 40,        // Added missing hero size
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
