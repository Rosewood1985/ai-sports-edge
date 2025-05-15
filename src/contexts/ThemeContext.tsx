import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

// Define available themes
export type ThemePreset = 'light' | 'dark' | 'team_colors';

// Theme context type
interface ThemeContextType {
  theme: ThemeColors;
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset) => void;
  setTeamColors: (teamId: string) => void;
}

// Default light theme
const lightTheme: ThemeColors = {
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
};

// Default dark theme
const darkTheme: ThemeColors = {
  primary: '#FFD700',
  secondary: '#333333',
  background: '#121212',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#374151',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themePreset: 'light',
  setThemePreset: () => {},
  setTeamColors: () => {},
});

// Storage key for theme preference
const THEME_STORAGE_KEY = 'theme_preset';
const TEAM_ID_STORAGE_KEY = 'theme_team_id';

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themePreset, setThemePreset] = useState<ThemePreset>('light');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeColors>(lightTheme);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemePreset = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const savedTeamId = await AsyncStorage.getItem(TEAM_ID_STORAGE_KEY);
        
        if (savedThemePreset) {
          setThemePreset(savedThemePreset as ThemePreset);
        } else if (colorScheme) {
          // Use system preference if no saved preference
          setThemePreset(colorScheme === 'dark' ? 'dark' : 'light');
        }
        
        if (savedTeamId) {
          setTeamId(savedTeamId);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, [colorScheme]);

  // Update theme when themePreset or teamId changes
  useEffect(() => {
    const updateTheme = async () => {
      if (themePreset === 'light') {
        setTheme(lightTheme);
      } else if (themePreset === 'dark') {
        setTheme(darkTheme);
      } else if (themePreset === 'team_colors' && teamId) {
        // In a real app, you would fetch team colors from an API or database
        // For now, we'll use a simple implementation
        const teamColors = getTeamColors(teamId);
        setTheme(teamColors);
      }
      
      // Save preference
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themePreset);
        if (teamId) {
          await AsyncStorage.setItem(TEAM_ID_STORAGE_KEY, teamId);
        }
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };
    
    updateTheme();
  }, [themePreset, teamId]);

  // Function to set team colors
  const setTeamColors = (newTeamId: string) => {
    setTeamId(newTeamId);
    setThemePreset('team_colors');
  };

  // Mock function to get team colors
  const getTeamColors = (teamId: string): ThemeColors => {
    // In a real app, you would fetch team colors from an API or database
    // For now, we'll use some predefined team colors
    const teamColorMap: Record<string, ThemeColors> = {
      'lakers': {
        ...darkTheme,
        primary: '#552583',
        secondary: '#FDB927',
        cardBackground: '#2A2A2A',
      },
      'celtics': {
        ...darkTheme,
        primary: '#007A33',
        secondary: '#BA9653',
        cardBackground: '#2A2A2A',
      },
      'heat': {
        ...darkTheme,
        primary: '#98002E',
        secondary: '#F9A01B',
        cardBackground: '#2A2A2A',
      },
      'default': {
        ...lightTheme,
        primary: '#0066FF',
        secondary: '#E6F0FF',
      },
    };
    
    return teamColorMap[teamId] || teamColorMap['default'];
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePreset,
        setThemePreset,
        setTeamColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;