/**
 * Theme configuration for the app
 * 
 * This file contains all the theme-related constants used throughout the app,
 * including colors, typography, spacing, and other design elements.
 */

// Colors
export const colors = {
  // Background colors
  background: {
    primary: '#000000', // Pure black
    secondary: '#121212', // Very dark gray
    tertiary: '#1A1A1A', // Dark gray
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF', // White
    secondary: '#AAAAAA', // Light gray
    tertiary: '#666666', // Medium gray
    heading: '#FFFFFF', // White
  },
  
  // Neon colors
  neon: {
    blue: '#00E5FF', // Bright cyan
    cyan: '#00BFFF', // Deep sky blue
    green: '#00FF88', // Bright green
    purple: '#BF5AF2', // Bright purple
    pink: '#FF2D55', // Bright pink
    yellow: '#FFCC00', // Bright yellow
  },
  
  // Button colors
  button: {
    primary: '#00E5FF', // Bright cyan
    secondary: '#00FF88', // Bright green
    disabled: '#333333', // Dark gray
  },
  
  // Border colors
  border: {
    default: '#333333', // Dark gray
    focus: '#00E5FF', // Bright cyan
  },
  
  // Status colors
  status: {
    success: '#00FF88', // Bright green
    warning: '#FFCC00', // Bright yellow
    error: '#FF2D55', // Bright pink
    info: '#00E5FF', // Bright cyan
  },
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    heading: 'System',
    body: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    xs: 14,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 40,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Z-index
export const zIndex = {
  base: 0,
  above: 1,
  dropdown: 10,
  modal: 100,
  toast: 1000,
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
};