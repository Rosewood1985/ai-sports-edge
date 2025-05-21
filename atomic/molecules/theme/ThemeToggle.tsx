/**
 * Theme Toggle Molecule
 *
 * This component provides a standardized toggle button for switching between light and dark themes.
 * It follows the atomic design pattern and uses the ThemeContext from the atomic architecture.
 */

import React from 'react';
import { Text, StyleSheet, View, Switch } from 'react-native';
import { useTheme } from '../../molecules/themeContext';
import AccessibleTouchableOpacity from '../../atoms/AccessibleTouchableOpacity';

/**
 * ThemeToggle Props
 */
interface ThemeToggleProps {
  /**
   * Toggle style variant
   * - 'button': Renders as a button with text
   * - 'switch': Renders as a switch
   * - 'icon': Renders as an icon button (requires custom styling)
   */
  variant?: 'button' | 'switch' | 'icon';

  /**
   * Custom label for the toggle
   */
  label?: string;

  /**
   * Additional styles for the container
   */
  style?: object;

  /**
   * Additional styles for the text
   */
  textStyle?: object;

  /**
   * Callback function called after theme is toggled
   */
  onToggle?: (newTheme: string) => void;
}

/**
 * ThemeToggle Component
 *
 * @param props Component props
 * @returns ThemeToggle component
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  label,
  style,
  textStyle,
  onToggle,
}) => {
  // Get theme context
  const { theme, effectiveTheme, toggleTheme } = useTheme();

  // Handle toggle
  const handleToggle = () => {
    toggleTheme();
    if (onToggle) {
      // We need to pass the opposite of the current theme since toggleTheme hasn't taken effect yet
      onToggle(effectiveTheme === 'dark' ? 'light' : 'dark');
    }
  };

  // Get label text
  const getLabelText = () => {
    if (label) {
      return label;
    }

    return effectiveTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  };

  // Render based on variant
  switch (variant) {
    case 'switch':
      return (
        <View style={[styles.switchContainer, style]}>
          <Text style={[styles.switchLabel, textStyle]}>{getLabelText()}</Text>
          <Switch
            value={effectiveTheme === 'dark'}
            onValueChange={handleToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={effectiveTheme === 'dark' ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      );

    case 'icon':
      return (
        <AccessibleTouchableOpacity
          onPress={handleToggle}
          style={[styles.iconButton, style]}
          accessibilityLabel={getLabelText()}
          accessibilityRole="button"
          accessibilityHint="Toggles between light and dark theme"
        >
          <Text style={[styles.iconText, textStyle]}>
            {effectiveTheme === 'dark' ? '☀️' : '🌙'}
          </Text>
        </AccessibleTouchableOpacity>
      );

    case 'button':
    default:
      return (
        <AccessibleTouchableOpacity
          onPress={handleToggle}
          style={[styles.button, style]}
          accessibilityLabel={getLabelText()}
          accessibilityRole="button"
          accessibilityHint="Toggles between light and dark theme"
        >
          <Text style={[styles.buttonText, textStyle]}>{getLabelText()}</Text>
        </AccessibleTouchableOpacity>
      );
  }
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#475569',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
});

export default ThemeToggle;
