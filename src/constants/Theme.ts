/**
 * Theme constants for the application
 * This file defines the theme colors, spacing, typography, and other design tokens
 */

// Define theme colors
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Define spacing values
export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// Define typography values
export interface ThemeTypography {
  fontFamily: string;
  fontSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontWeights: {
    regular: string;
    medium: string;
    bold: string;
  };
}

// Define border radius values
export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
}

// Define shadows
export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
}

// Define the complete theme interface
export interface ThemeInterface {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
}

// Default light theme colors (from ThemeContext)
const lightColors: ThemeColors = {
  primary: '#0066FF',
  secondary: '#E6F0FF',
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Define the complete theme
export const Theme: ThemeInterface = {
  colors: lightColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontFamily: 'System',
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

export default Theme;