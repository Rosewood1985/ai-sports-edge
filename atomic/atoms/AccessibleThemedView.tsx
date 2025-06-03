import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

import accessibilityService, {
  AccessibilityPreferences,
} from '../../services/accessibilityService';

/**
 * AccessibleThemedView component that combines theming capabilities with accessibility features.
 *
 * This component extends ThemedView with accessibility features like high contrast
 * and reduced motion. It automatically adapts to the user's accessibility
 * preferences and provides proper accessibility attributes for screen readers.
 */
export type ThemedViewBackground =
  | 'primary' // Typically theme.colors.primaryBackground
  | 'surface' // Typically theme.colors.surfaceBackground
  | 'transparent'; // Default, no background color applied

export type AccessibleThemedViewProps = ViewProps & {
  background?: ThemedViewBackground;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Whether to apply high contrast styles
   */
  applyHighContrast?: boolean;

  /**
   * Whether to apply reduced motion styles
   */
  applyReducedMotion?: boolean;

  /**
   * High contrast style overrides
   */
  highContrastStyle?: any;
};

export function AccessibleThemedView({
  style,
  background = 'transparent', // Default to transparent background
  children,
  accessibilityLabel,
  accessibilityHint,
  applyHighContrast = true,
  applyReducedMotion = true,
  highContrastStyle,
  ...otherProps
}: AccessibleThemedViewProps) {
  const { colors } = useTheme();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );

  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener(newPreferences => {
      setPreferences(newPreferences);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Map semantic background prop to theme color values
  const getBackgroundColor = () => {
    switch (background) {
      case 'primary':
        return colors.background; // Use the theme's background color
      case 'surface':
        return colors.card; // Use the theme's card color
      case 'transparent':
      default:
        return 'transparent'; // Explicitly transparent
    }
  };

  // Determine if high contrast should be applied
  const shouldApplyHighContrast =
    applyHighContrast && (preferences.highContrast || accessibilityService.isHighContrastActive());

  // Determine if reduced motion should be applied
  const shouldApplyReducedMotion =
    applyReducedMotion && (preferences.reduceMotion || accessibilityService.isReduceMotionActive());

  // Get accessibility props
  const accessibilityProps = accessibilityLabel
    ? accessibilityService.getAccessibilityProps(
        accessibilityLabel,
        accessibilityHint,
        undefined,
        undefined
      )
    : {};

  const backgroundColor = getBackgroundColor();

  // Apply styles based on preferences
  const appliedStyle = [
    backgroundColor !== 'transparent' ? { backgroundColor } : {}, // Apply background only if not transparent
    style,
    shouldApplyHighContrast && styles.highContrast,
    shouldApplyHighContrast && highContrastStyle,
  ];

  return (
    <View style={appliedStyle} {...accessibilityProps} {...otherProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  highContrast: {
    borderWidth: 1,
    borderColor: '#000',
  },
});

export default AccessibleThemedView;
