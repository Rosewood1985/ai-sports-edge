/**
 * Theme Tokens Atom
 * Defines design tokens for the application.
 * These are the primitive values used for spacing, typography, shadows, etc.
 */

// External imports
import { Platform } from 'react-native';

// Internal imports

/**
 * Font family tokens
 */
export const fontFamily = {
  // Base fonts
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'sans-serif-medium',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'sans-serif-bold',
  }),
  // Monospace font for code, numbers, etc.
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

/**
 * Font weight tokens
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/**
 * Font size tokens
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  // Specific use cases
  heading1: 32,
  heading2: 24,
  heading3: 20,
  heading4: 18,
  heading5: 16,
  body: 16,
  bodySmall: 14,
  caption: 12,
  button: 16,
  label: 14,
};

/**
 * Line height tokens
 */
export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 36,
  xxxl: 40,
  // Specific use cases
  heading1: 40,
  heading2: 32,
  heading3: 28,
  heading4: 24,
  heading5: 20,
  body: 24,
  bodySmall: 20,
  caption: 16,
  button: 24,
  label: 20,
};

/**
 * Spacing tokens
 * Used for margins, paddings, and layout spacing
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  // Specific use cases
  screenPadding: 16,
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 12,
  iconPadding: 8,
};

/**
 * Border radius tokens
 */
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
  // Specific use cases
  button: 8,
  card: 12,
  input: 8,
  chip: 16,
  dialog: 16,
  dropdown: 10,
};

/**
 * Shadow tokens for light theme
 */
export const shadowLight = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

/**
 * Shadow tokens for dark theme
 */
export const shadowDark = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

/**
 * Z-index tokens
 */
export const zIndex = {
  base: 0,
  above: 1,
  fixed: 200,
  sticky: 100,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
};

/**
 * Animation tokens
 */
export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Theme tokens object
 */
export const ThemeTokens = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  spacing,
  borderRadius,
  shadowLight,
  shadowDark,
  zIndex,
  animation,
};

export default ThemeTokens;
