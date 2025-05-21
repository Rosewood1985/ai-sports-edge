import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../screens/Onboarding/Context/ThemeContext';
import { AccessibleTouchableOpacity } from '../atomic/atoms';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const accessibilityLabel = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;

  return (
    <AccessibleTouchableOpacity
      onPress={toggleTheme}
      style={styles.button}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Toggles between light and dark theme"
    >
      <Text style={styles.text}>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</Text>
    </AccessibleTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 24,
    alignSelf: 'center',
    backgroundColor: '#475569',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  text: {
    color: '#f1f5f9',
    fontSize: 16,
  },
});

export default ThemeToggle;
