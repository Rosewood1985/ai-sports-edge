/**
 * Theme Colors Atom
 *
 * Defines the color palette for the application.
 * These are the primitive color values used throughout the app.
 */

/**
 * Base color palette
 * These are the raw color values that serve as the foundation for the theme
 */
export const palette = {
  // Primary colors
  blue: {
    50: '#e6f0ff',
    100: '#b3d1ff',
    200: '#80b3ff',
    300: '#4d94ff',
    400: '#1a75ff',
    500: '#0066ff', // Primary brand color
    600: '#0052cc',
    700: '#003d99',
    800: '#002966',
    900: '#001433',
  },

  // Neutral colors
  gray: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#868e96',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },

  // Semantic colors
  green: {
    50: '#e6f7e6',
    100: '#c3eac3',
    200: '#9fdd9f',
    300: '#7ccf7c',
    400: '#58c258',
    500: '#35b535', // Success
    600: '#2a9d2a',
    700: '#1f851f',
    800: '#156c15',
    900: '#0a540a',
  },

  red: {
    50: '#ffe6e6',
    100: '#ffb3b3',
    200: '#ff8080',
    300: '#ff4d4d',
    400: '#ff1a1a',
    500: '#ff0000', // Error
    600: '#cc0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },

  yellow: {
    50: '#fffbe6',
    100: '#fff3b3',
    200: '#ffec80',
    300: '#ffe54d',
    400: '#ffdd1a',
    500: '#ffd600', // Warning
    600: '#ccab00',
    700: '#998100',
    800: '#665600',
    900: '#332b00',
  },

  // Additional colors
  orange: {
    500: '#ff9500', // Highlight
  },

  purple: {
    500: '#5856d6', // Secondary accent
  },

  teal: {
    500: '#5ac8fa', // Tertiary accent
  },

  // Base colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

/**
 * Light theme colors
 */
export const light = {
  // UI colors
  background: palette.white,
  surface: palette.gray[50],
  surfaceVariant: palette.gray[100],

  // Text colors
  text: palette.gray[900],
  textSecondary: palette.gray[700],
  textTertiary: palette.gray[600],
  textDisabled: palette.gray[500],

  // Interactive colors
  primary: palette.blue[500],
  primaryVariant: palette.blue[700],
  secondary: palette.purple[500],
  accent: palette.teal[500],

  // Border colors
  border: palette.gray[300],
  borderLight: palette.gray[200],
  borderFocus: palette.blue[300],

  // Status colors
  success: palette.green[500],
  error: palette.red[500],
  warning: palette.yellow[500],
  info: palette.blue[400],

  // Component colors
  card: palette.white,
  dialog: palette.white,
  tint: palette.blue[500],
  icon: palette.gray[700],
  divider: palette.gray[200],

  // Betting-specific colors
  win: palette.green[500],
  loss: palette.red[500],
  draw: palette.gray[500],
  odds: palette.blue[700],
  boost: palette.orange[500],
};

/**
 * Dark theme colors
 */
export const dark = {
  // UI colors
  background: palette.gray[900],
  surface: palette.gray[800],
  surfaceVariant: palette.gray[700],

  // Text colors
  text: palette.gray[50],
  textSecondary: palette.gray[300],
  textTertiary: palette.gray[400],
  textDisabled: palette.gray[500],

  // Interactive colors
  primary: palette.blue[400],
  primaryVariant: palette.blue[300],
  secondary: palette.purple[500],
  accent: palette.teal[500],

  // Border colors
  border: palette.gray[600],
  borderLight: palette.gray[700],
  borderFocus: palette.blue[400],

  // Status colors
  success: palette.green[400],
  error: palette.red[400],
  warning: palette.yellow[400],
  info: palette.blue[300],

  // Component colors
  card: palette.gray[800],
  dialog: palette.gray[800],
  tint: palette.blue[400],
  icon: palette.gray[300],
  divider: palette.gray[700],

  // Betting-specific colors
  win: palette.green[400],
  loss: palette.red[400],
  draw: palette.gray[400],
  odds: palette.blue[300],
  boost: palette.orange[500],

  // Additional dark theme specific colors
  primaryBackground: palette.gray[900],
  primaryText: palette.gray[50],
  primaryAction: palette.blue[400],
  borderSubtle: palette.gray[700],
  iconPrimary: palette.gray[300],
};

/**
 * Colors object with light and dark themes
 */
export const Colors = {
  palette,
  light,
  dark,
};

export default Colors;
