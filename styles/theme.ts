/**
 * Theme configuration for the app
 *
 * This file contains all the theme-related constants used throughout the app,
 * including colors, typography, spacing, and other design elements,
 * aligned with the AI Sports Edge design system.
 */

import { Colors } from '../constants/Colors'; // Import the updated Colors

// Re-export colors from the central definition for use within the theme object
export const colors = Colors.dark; // Assuming dark mode is default or primary
// If theme switching is implemented, this might need dynamic assignment

// Typography
export const typography = {
  // Font families (Ensure these fonts are loaded in the app via expo-font or similar)
  fontFamily: {
    heading: 'Orbitron', // Use Orbitron for headlines
    body: 'Inter', // Use Inter for body text and UI elements
  },

  // Font sizes (Semantic scale based on design system)
  fontSize: {
    // Based on ui-ux-strategy.md (using approximate mid-points for web/iOS)
    h1: 34, // Screen Titles (Orbitron)
    h2: 26, // Section Titles (Orbitron)
    h3: 21, // Card Titles/Key Metrics (Orbitron)
    bodyLg: 17, // Key Descriptions (Inter)
    bodyStd: 15, // General Text (Inter)
    button: 16, // Button Text (Inter)
    label: 13, // Labels/Captions (Inter)
    small: 12, // Small Text/Metadata (Inter)

    // Retaining t-shirt sizes for potential generic use, map to semantic values
    xs: 12, // small
    sm: 13, // label
    md: 15, // bodyStd
    lg: 17, // bodyLg
    xl: 21, // h3
    xxl: 26, // h2
    xxxl: 34, // h1
  },

  // Font weights (Standard weights)
  fontWeight: {
    light: '300',
    regular: '400', // Default for Inter body
    medium: '500', // Good for Orbitron H3, Inter Buttons/Labels
    semiBold: '600',
    bold: '700', // Good for Orbitron H1/H2
  },

  // Line heights (Calculated based on fontSize and multipliers)
  lineHeight: {
    h1: 40, // ~1.18 * 34
    h2: 32, // ~1.23 * 26
    h3: 28, // ~1.33 * 21
    bodyLg: 24, // ~1.4 * 17
    bodyStd: 21, // ~1.4 * 15
    button: 20, // ~1.25 * 16 (Buttons often have tighter leading)
    label: 18, // ~1.38 * 13
    small: 16, // ~1.33 * 12

    // T-shirt sizes mapped
    xs: 16, // small
    sm: 18, // label
    md: 21, // bodyStd
    lg: 24, // bodyLg
    xl: 28, // h3
    xxl: 32, // h2
    xxxl: 40, // h1
  },
};

// Spacing (8px base unit scale)
export const spacing = {
  xxs: 4, // Half base unit
  xs: 8, // 1 * base unit
  sm: 16, // 2 * base unit
  md: 24, // 3 * base unit
  lg: 32, // 4 * base unit
  xl: 40, // 5 * base unit (Added for more flexibility)
  xxl: 48, // 6 * base unit
  xxxl: 64, // 8 * base unit
};

// Border radius (Adjusted for sharper, flat aesthetic)
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4, // Default for most elements like cards/buttons
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999, // For circular elements
};

// Shadows (Defined but may be used sparingly in dark mode, relying on bg contrast)
export const shadows = {
  // Consider removing or reducing opacity/radius for dark mode polish
  small: {
    shadowColor: colors.primaryBackground, // Use black for shadow base
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Reduced opacity for dark mode
    shadowRadius: 3,
    elevation: 2, // Android elevation
  },
  medium: {
    shadowColor: colors.primaryBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, // Reduced opacity
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: colors.primaryBackground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, // Reduced opacity
    shadowRadius: 12,
    elevation: 8,
  },
};

// Z-index (Standard layering)
export const zIndex = {
  base: 0,
  above: 1,
  dropdown: 1000, // Ensure dropdowns are above most content
  modal: 10000, // Modals above everything else
  toast: 11000, // Toasts above modals
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
};
