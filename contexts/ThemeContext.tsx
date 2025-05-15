import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Define theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Define theme colors
export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  card: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
}

// Define light theme colors
export const lightColors: ThemeColors = {
  background: '#f8f9fa',
  text: '#333333',
  primary: '#3498db',
  secondary: '#2ecc71',
  card: '#ffffff',
  border: '#e0e0e0',
  notification: '#f39c12',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f39c12',
};

// Define dark theme colors
export const darkColors: ThemeColors = {
  background: '#121212',
  text: '#f5f5f5',
  primary: '#3498db',
  secondary: '#2ecc71',
  card: '#1e1e1e',
  border: '#333333',
  notification: '#f39c12',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f39c12',
};

// Define theme context
interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  colors: lightColors,
  isDark: false,
  setTheme: () => {},
});

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  
  // Initialize theme state
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Use useMemo to prevent recalculations on every render
  const themeData = React.useMemo(() => {
    // Determine if dark mode is active
    const isDark =
      theme === 'dark' || (theme === 'system' && deviceColorScheme === 'dark');
    
    // Get current theme colors
    const colors = isDark ? darkColors : lightColors;
    
    return { isDark, colors };
  }, [theme, deviceColorScheme]);
  
  // Load saved theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Set theme and save to storage
  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };
  
  return (
    <ThemeContext.Provider value={{
      theme,
      colors: themeData.colors,
      isDark: themeData.isDark,
      setTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;