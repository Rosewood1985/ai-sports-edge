/**
 * Theme Configuration
 *
 * Defines theme colors and styles for light and dark modes.
 */

import { DefaultTheme, DarkTheme } from '@react-navigation/native';

import { Colors } from '../../constants/Colors';

/**
 * Light theme configuration
 */
export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: '#f0f2f5',
    text: Colors.light.text,
    border: '#d1d5db',
    notification: '#FF3B30',
    icon: Colors.light.icon,
  },
};

/**
 * Dark theme configuration
 */
export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primaryAction,
    background: Colors.dark.primaryBackground,
    card: '#2a2c2d',
    text: Colors.dark.primaryText,
    border: Colors.dark.borderSubtle,
    notification: '#FF453A',
    icon: Colors.dark.iconPrimary,
  },
};

/**
 * Get theme by name
 * @param {string} themeName - Theme name ('light' or 'dark')
 * @returns {Object} Theme object
 */
export const getThemeByName = themeName => {
  return themeName === 'dark' ? darkTheme : lightTheme;
};
