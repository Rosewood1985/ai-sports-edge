import React, { createContext, useContext, useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';

// Define UI theme types
export type UIThemeType = 'default' | 'neon' | 'minimal' | 'classic';

// Define UI theme context
interface UIThemeContextType {
  uiTheme: UIThemeType;
  setUITheme: (theme: UIThemeType) => void;
  cardStyle: any;
  buttonStyle: any;
  textStyle: any;
  headerStyle: any;
  shadowStyle: any;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
}

// Create UI theme context
const UIThemeContext = createContext<UIThemeContextType>({
  uiTheme: 'default',
  setUITheme: () => {},
  cardStyle: {},
  buttonStyle: {},
  textStyle: {},
  headerStyle: {},
  shadowStyle: {},
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
});

// UI Theme Provider props
interface UIThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: UIThemeType;
}

/**
 * UIThemeProvider component for consistent UI styling
 */
export const UIThemeProvider: React.FC<UIThemeProviderProps> = ({
  children,
  initialTheme = 'neon',
}) => {
  // State for UI theme
  const [uiTheme, setUITheme] = useState<UIThemeType>(initialTheme);
  
  // Get app theme (light/dark)
  const { isDark } = useTheme();
  
  // Define spacing and border radius (consistent across themes)
  const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };
  
  const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  };
  
  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (uiTheme) {
      case 'neon':
        return {
          cardStyle: {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: isDark ? '#333333' : '#E0E0E0',
            ...styles.neonShadow,
          },
          buttonStyle: {
            backgroundColor: Colors.neon.blue,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          },
          textStyle: {
            color: isDark ? '#FFFFFF' : '#333333',
            fontSize: 16,
          },
          headerStyle: {
            backgroundColor: isDark ? '#121212' : '#F8F8F8',
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          shadowStyle: styles.neonShadow,
        };
      case 'minimal':
        return {
          cardStyle: {
            backgroundColor: isDark ? '#121212' : '#FFFFFF',
            borderRadius: borderRadius.sm,
            padding: spacing.md,
            marginBottom: spacing.md,
            ...styles.minimalShadow,
          },
          buttonStyle: {
            backgroundColor: isDark ? '#333333' : '#F0F0F0',
            borderRadius: borderRadius.sm,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          },
          textStyle: {
            color: isDark ? '#FFFFFF' : '#333333',
            fontSize: 16,
          },
          headerStyle: {
            backgroundColor: isDark ? '#121212' : '#FFFFFF',
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          shadowStyle: styles.minimalShadow,
        };
      case 'classic':
        return {
          cardStyle: {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: isDark ? '#333333' : '#E0E0E0',
            ...styles.classicShadow,
          },
          buttonStyle: {
            backgroundColor: isDark ? '#3498db' : '#3498db',
            borderRadius: borderRadius.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          },
          textStyle: {
            color: isDark ? '#FFFFFF' : '#333333',
            fontSize: 16,
          },
          headerStyle: {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#333333' : '#E0E0E0',
          },
          shadowStyle: styles.classicShadow,
        };
      default: // default theme
        return {
          cardStyle: {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            ...styles.defaultShadow,
          },
          buttonStyle: {
            backgroundColor: '#3498db',
            borderRadius: borderRadius.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          },
          textStyle: {
            color: isDark ? '#FFFFFF' : '#333333',
            fontSize: 16,
          },
          headerStyle: {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#333333' : '#E0E0E0',
          },
          shadowStyle: styles.defaultShadow,
        };
    }
  };
  
  // Get current theme styles
  const themeStyles = getThemeStyles();
  
  // Update StatusBar based on theme
  useEffect(() => {
    let statusBarBgColor;
    
    // Set status bar background color based on theme
    switch (uiTheme) {
      case 'neon':
        statusBarBgColor = isDark ? '#121212' : '#F8F8F8';
        break;
      case 'minimal':
        statusBarBgColor = isDark ? '#121212' : '#FFFFFF';
        break;
      case 'classic':
        statusBarBgColor = isDark ? '#1E1E1E' : '#FFFFFF';
        break;
      default: // default theme
        statusBarBgColor = isDark ? '#1A1A1A' : '#FFFFFF';
        break;
    }
    
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(statusBarBgColor);
    }
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  }, [isDark, uiTheme]);
  
  return (
    <UIThemeContext.Provider
      value={{
        uiTheme,
        setUITheme,
        ...themeStyles,
        spacing,
        borderRadius,
      }}
    >
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </UIThemeContext.Provider>
  );
};

// Custom hook to use UI theme
export const useUITheme = () => useContext(UIThemeContext);

// Styles
const styles = StyleSheet.create({
  defaultShadow: Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    : {
        elevation: 3,
      },
  neonShadow: Platform.OS === 'ios'
    ? {
        shadowColor: Colors.neon.blue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      }
    : {
        elevation: 4,
      },
  minimalShadow: Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      }
    : {
        elevation: 1,
      },
  classicShadow: Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      }
    : {
        elevation: 4,
      },
});

export default UIThemeContext;