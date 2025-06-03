import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { useTheme } from '../atomic/molecules/themeContext';

/**
 * ThemeVerifier Component
 *
 * This component is used to verify the dark mode implementation.
 * It displays the current theme settings and allows the user to toggle between themes.
 */
const ThemeVerifier = () => {
  // Get theme context
  const { theme, effectiveTheme, setTheme, toggleTheme, colors } = useTheme();

  // Get device color scheme for comparison
  const deviceTheme = useColorScheme();

  // Create styles based on current theme
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    infoContainer: {
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: {
      color: colors.textSecondary,
    },
    value: {
      color: colors.text,
      fontWeight: 'bold',
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      padding: 10,
      borderRadius: 4,
      flex: 1,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontWeight: 'bold',
    },
    lightButton: {
      backgroundColor: theme === 'light' ? colors.primary : colors.gray[400],
    },
    darkButton: {
      backgroundColor: theme === 'dark' ? colors.primary : colors.gray[400],
    },
    systemButton: {
      backgroundColor: theme === 'system' ? colors.primary : colors.gray[400],
    },
    toggleButton: {
      backgroundColor: colors.secondary,
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theme Verifier</Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Current Theme Setting:</Text>
          <Text style={styles.value}>{theme}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Effective Theme:</Text>
          <Text style={styles.value}>{effectiveTheme}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Device Theme:</Text>
          <Text style={styles.value}>{deviceTheme || 'unknown'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Auto-Detection:</Text>
          <Text style={styles.value}>{theme === 'system' ? 'Enabled' : 'Disabled'}</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.lightButton]}
          onPress={() => setTheme('light')}
        >
          <Text style={styles.buttonText}>Light</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.darkButton]}
          onPress={() => setTheme('dark')}
        >
          <Text style={styles.buttonText}>Dark</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.systemButton]}
          onPress={() => setTheme('system')}
        >
          <Text style={styles.buttonText}>System</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.button, styles.toggleButton]} onPress={toggleTheme}>
        <Text style={styles.buttonText}>Toggle Theme</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ThemeVerifier;
