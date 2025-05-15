/**
 * Theme Provider Organism
 * This organism combines theme atoms and molecules to create a complete theme solution.
 * Provides theme state and functionality to the application.
 */

// External imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';

// Internal imports
import { 
  ThemeContext, 
  resolveTheme, 
  getThemeColors, 
  getNavigationTheme 
} from '../molecules/themeContext';

// Storage key for theme preference
const THEME_STORAGE_KEY = '@theme_preference';

/**
 * Theme Provider Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactNode} Theme Provider component
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme state
  const [theme, setThemeState] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get device color scheme
  const deviceTheme = useColorScheme();
  
  // Determine effective theme based on theme setting and device theme
  const effectiveTheme = resolveTheme(theme, deviceTheme);
  
  // Get theme colors and navigation theme based on effective theme
  const colors = useMemo(() => getThemeColors(effectiveTheme), [effectiveTheme]);
  const navigationTheme = useMemo(() => getNavigationTheme(effectiveTheme), [effectiveTheme]);
  
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
   * 
   * @param {string} newTheme - New theme ('light', 'dark', or 'system')
   */
  const setTheme = useCallback(newTheme => {
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
      setThemeState(newTheme);
    }
  }, []);
  
  /**
   * Toggle between light and dark themes
   * If current theme is system, it will switch to light or dark based on the effective theme
   */
  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => {
      if (prevTheme === 'system') {
        // If system, switch to the opposite of the effective theme
        return effectiveTheme === 'dark' ? 'light' : 'dark';
      } else {
        // Otherwise toggle between light and dark
        return prevTheme === 'dark' ? 'light' : 'dark';
      }
    });
  }, [effectiveTheme]);
  
  // Create theme context value
  const themeContextValue = useMemo(
    () => ({
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
      colors,
      navigationTheme,
    }),
    [theme, effectiveTheme, setTheme, toggleTheme, colors, navigationTheme]
  );
  
  // Show nothing while loading to prevent theme flash
  if (isLoading) {
    return null;
  }
  
  // Provide theme context to children
  return <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>;
};

/**
 * withTheme HOC
 * Higher-order component that injects theme props into the wrapped component
 * 
 * @param {React.ComponentType} WrappedComponent - Component to wrap
 * @returns {React.ComponentType} Wrapped component with theme props
 */
export const withTheme = WrappedComponent => {
  const WithTheme = props => {
    // Get theme context
    const themeContext = React.useContext(ThemeContext);
    
    // Pass theme context as props to wrapped component
    return <WrappedComponent {...props} theme={themeContext} />;
  };
  
  // Set display name for debugging
  WithTheme.displayName = `withTheme(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithTheme;
};

export default ThemeProvider;
