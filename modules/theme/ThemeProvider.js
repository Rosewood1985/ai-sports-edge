/**
 * Theme Provider
 *
 * Provides theme state and functionality to the application.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { ThemeContext } from './ThemeContext';

// Storage key for theme preference
const THEME_STORAGE_KEY = '@theme_preference';

/**
 * Theme Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactNode} Theme Provider component
 */
export const ThemeProvider = ({ children }) => {
  // Get device color scheme
  const deviceTheme = useColorScheme();

  // Initialize theme state
  const [theme, setThemeState] = useState(deviceTheme || 'light');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };

    if (!isLoading) {
      saveThemePreference();
    }
  }, [theme, isLoading]);

  /**
   * Set theme
   * @param {string} newTheme - New theme ('light' or 'dark')
   */
  const setTheme = newTheme => {
    setThemeState(newTheme);
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Provide theme context to children
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
