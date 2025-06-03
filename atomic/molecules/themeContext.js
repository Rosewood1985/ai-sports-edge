/**
 * Theme Context Molecule
 * Provides theme context and hooks for the application.
 * Combines theme atoms into a usable context system.
 */

// External imports
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import React, { memo, useCallback, useMemo, createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

// Internal imports
import Colors from '../atoms/themeColors';
import ThemeTokens from '../atoms/themeTokens';

/**
 * Theme type
 * @typedef {'light' | 'dark' | 'system'} ThemeType
 */

/**
 * Theme context value
 * @typedef {Object} ThemeContextValue
 * @property {ThemeType} theme - Current theme ('light', 'dark', or 'system')
 * @property {ThemeType} effectiveTheme - Effective theme after resolving 'system' ('light' or 'dark')
 * @property {Function} setTheme - Function to set theme
 * @property {Function} toggleTheme - Function to toggle between light and dark themes
 * @property {Object} colors - Current theme colors
 * @property {Object} navigationTheme - Navigation theme for React Navigation
 * @property {Object} tokens - Theme tokens
 */

/**
 * Default theme context value
 * @type {ThemeContextValue}
 */
const defaultThemeContext = {
  theme: 'system',
  effectiveTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  colors: Colors.light,
  navigationTheme: DefaultTheme,
  tokens: ThemeTokens,
};

/**
 * Theme context
 * @type {React.Context<ThemeContextValue>}
 */
export const ThemeContext = createContext(defaultThemeContext);

/**
 * Custom hook to use theme context
 * @returns {ThemeContextValue} Theme context value
 */
export const useTheme = () => useContext(ThemeContext);

/**
 * Resolve theme type to effective theme
 *
 * @param {ThemeType} theme - Theme type
 * @param {string|null} systemTheme - System theme from useColorScheme
 * @returns {ThemeType} Effective theme ('light' or 'dark')
 */
export const resolveTheme = (theme, systemTheme) => {
  if (theme === 'system') {
    return systemTheme === 'dark' ? 'dark' : 'light';
  }
  return theme;
};

/**
 * Get theme colors based on theme type
 *
 * @param {ThemeType} themeType - Theme type
 * @returns {Object} Theme colors
 */
export const getThemeColors = themeType => {
  return themeType === 'dark' ? Colors.dark : Colors.light;
};

/**
 * Get navigation theme based on theme type
 *
 * @param {ThemeType} themeType - Theme type
 * @returns {Object} Navigation theme
 */
export const getNavigationTheme = themeType => {
  if (themeType === 'dark') {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: Colors.dark.background,
        card: Colors.dark.card,
        text: Colors.dark.text,
        border: Colors.dark.border,
        primary: Colors.dark.primary,
        notification: Colors.dark.error,
      },
    };
  }

  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
      primary: Colors.light.primary,
      notification: Colors.light.error,
    },
  };
};

/**
 * Get shadow style based on theme and size
 *
 * @param {ThemeType} themeType - Theme type
 * @param {string} size - Shadow size ('none', 'xs', 'sm', 'md', 'lg', 'xl')
 * @returns {Object} Shadow style
 */
export const getShadow = (themeType, size = 'md') => {
  const shadows = themeType === 'dark' ? ThemeTokens.shadowDark : ThemeTokens.shadowLight;
  return shadows[size] || shadows.md;
};

/**
 * Create text style based on variant
 *
 * @param {ThemeType} themeType - Theme type
 * @param {string} variant - Text variant ('heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'body', 'bodySmall', 'caption', 'button', 'label')
 * @param {Object} additionalStyle - Additional style to merge
 * @returns {Object} Text style
 */
export const createTextStyle = (themeType, variant = 'body', additionalStyle = {}) => {
  const colors = getThemeColors(themeType);
  const isDark = themeType === 'dark';
  const { fontSize, lineHeight, fontFamily, fontWeight } = ThemeTokens;

  // Apply variant-specific styles
  let variantStyle = {};

  if (variant.startsWith('heading')) {
    variantStyle = {
      fontFamily: fontFamily.bold,
      fontWeight: fontWeight.bold,
      color: colors.text,
    };
  } else if (variant === 'button') {
    variantStyle = {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeight.medium,
      textAlign: 'center',
    };
  } else if (variant === 'caption') {
    variantStyle = {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
    };
  } else if (variant === 'label') {
    variantStyle = {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeight.medium,
    };
  }

  const baseStyle = {
    fontFamily: fontFamily.regular,
    fontSize: fontSize[variant] || fontSize.body,
    lineHeight: lineHeight[variant] || lineHeight.body,
    color: colors.text,
  };

  return {
    ...baseStyle,
    ...variantStyle,
    ...additionalStyle,
  };
};
