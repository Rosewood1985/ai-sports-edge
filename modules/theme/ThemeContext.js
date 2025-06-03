/**
 * Theme Context
 *
 * Provides theme context for the application.
 */

import { createContext, useContext } from 'react';

/**
 * Theme context with default values
 */
export const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context
 */
export const useTheme = () => useContext(ThemeContext);
