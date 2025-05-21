/**
 * Theme Toggle Example
 *
 * This example demonstrates how to use the enhanced theme toggle component
 * in a React component.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ThemeToggle } from 'atomic/molecules/theme';
import { useTheme } from 'atomic/molecules/themeContext';

// Define theme colors type for TypeScript
interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  [key: string]: string;
}

/**
 * ThemeToggleExample Component
 *
 * This component demonstrates the different variants of the ThemeToggle component
 * and how to use the theme context.
 */
const ThemeToggleExample = () => {
  // Get theme context
  const { effectiveTheme, colors: themeColors } = useTheme();

  // Cast colors to our interface to fix TypeScript errors
  const colors = themeColors as ThemeColors;

  // Determine if dark mode is active
  const isDarkMode = effectiveTheme === 'dark';

  // Handle theme toggle callback
  const handleThemeToggle = (newTheme: string) => {
    console.log(`Theme changed to: ${newTheme}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
        Theme Toggle Examples
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#e0e0e0' : '#333333' }]}>
          Button Variant (Default)
        </Text>
        <ThemeToggle />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#e0e0e0' : '#333333' }]}>
          Button Variant with Custom Label
        </Text>
        <ThemeToggle
          label={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Theme`}
          style={{ backgroundColor: '#0066cc' }}
          textStyle={{ color: '#ffffff', fontWeight: 'bold' }}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#e0e0e0' : '#333333' }]}>
          Switch Variant
        </Text>
        <ThemeToggle variant="switch" onToggle={handleThemeToggle} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#e0e0e0' : '#333333' }]}>
          Icon Variant
        </Text>
        <ThemeToggle
          variant="icon"
          style={{
            backgroundColor: isDarkMode ? '#333333' : '#f0f0f0',
            padding: 12,
            borderRadius: 24,
          }}
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { color: isDarkMode ? '#e0e0e0' : '#333333' }]}>
          Current Theme
        </Text>
        <Text style={[styles.infoText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
          Effective Theme: {effectiveTheme}
        </Text>
        <Text style={[styles.infoText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
          Primary Color: {colors.primary || 'Not defined'}
        </Text>
        <Text style={[styles.infoText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
          Background Color: {isDarkMode ? '#121212' : '#f5f5f5'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default ThemeToggleExample;
