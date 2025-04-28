import React, { createContext, useContext, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import theme from '../styles/theme'; // Import the centralized theme object
import { useTheme as useAppTheme } from '../contexts/ThemeContext'; // Alias to avoid naming conflict

// Define the structure of the theme context
// It will now provide the whole theme object
interface UIThemeContextType {
  theme: typeof theme;
  isDark: boolean; // Keep providing light/dark status if needed elsewhere
}

// Create UI theme context with default values matching the theme structure
const UIThemeContext = createContext<UIThemeContextType>({
  theme: theme, // Provide the imported theme as default
  isDark: true, // Assume dark mode default for context structure
});

// UI Theme Provider props
interface UIThemeProviderProps {
  children: React.ReactNode;
}

/**
 * UIThemeProvider component - Simplified to provide a single, centralized theme.
 */
export const UIThemeProvider: React.FC<UIThemeProviderProps> = ({ children }) => {
  // Get app theme (light/dark) status if needed for conditional logic elsewhere
  // Note: Our theme object itself is currently hardcoded to dark mode values
  const { isDark } = useAppTheme();

  // Update StatusBar based on the centralized theme
  useEffect(() => {
    // Use colors directly from the imported theme object
    const statusBarBgColor = theme.colors.primaryBackground; // Or surfaceBackground depending on header style
    const barStyle = isDark ? 'light-content' : 'dark-content'; // Keep this dynamic if light mode is ever added

    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(statusBarBgColor);
    }
    StatusBar.setBarStyle(barStyle);
  }, [isDark]); // Dependency on isDark remains if barStyle needs to change

  return (
    <UIThemeContext.Provider
      value={{
        theme: theme, // Provide the full theme object
        isDark: isDark,
      }}
    >
      {/* Apply base background color if desired, or handle in screen components */}
      <View style={{ flex: 1, backgroundColor: theme.colors.primaryBackground }}>
        {children}
      </View>
    </UIThemeContext.Provider>
  );
};

// Custom hook to use the simplified UI theme context
export const useUITheme = () => useContext(UIThemeContext);

// Local styles can be kept if needed for platform-specific overrides or non-theme styles
// Removed theme-specific shadow styles as shadows are now in theme.ts
const styles = StyleSheet.create({
  // Add any necessary non-theme related styles here
});

// Export the context itself if needed for direct consumption without the hook
export default UIThemeContext;