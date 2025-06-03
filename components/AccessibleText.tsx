import React, { useEffect, useState } from 'react';
import { Text, TextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';

import { useThemeColor as useThemeColorHook } from '../hooks/useThemeColor';
import accessibilityService, { AccessibilityPreferences } from '../services/accessibilityService';

/**
 * Props for the AccessibleText component
 */
interface AccessibleTextProps extends TextProps {
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Accessibility role
   */
  accessibilityRole?:
    | 'text'
    | 'header'
    | 'link'
    | 'button'
    | 'search'
    | 'image'
    | 'summary'
    | 'alert'
    | 'checkbox'
    | 'combobox'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'scrollbar'
    | 'spinbutton'
    | 'switch'
    | 'tab'
    | 'tablist'
    | 'timer'
    | 'toolbar';

  /**
   * Accessibility state
   */
  accessibilityState?: Record<string, boolean>;

  /**
   * Whether to apply high contrast styles
   */
  applyHighContrast?: boolean;

  /**
   * Whether to apply large text styles
   */
  applyLargeText?: boolean;

  /**
   * Whether to apply bold text styles
   */
  applyBoldText?: boolean;

  /**
   * High contrast style overrides
   */
  highContrastStyle?: StyleProp<TextStyle>;

  /**
   * Large text style overrides
   */
  largeTextStyle?: StyleProp<TextStyle>;

  /**
   * Bold text style overrides
   */
  boldTextStyle?: StyleProp<TextStyle>;

  /**
   * Children
   */
  children: React.ReactNode;

  /**
   * Whether the component is important for accessibility
   */
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';

  /**
   * Whether to use the themed color
   */
  useThemedColor?: boolean;

  /**
   * Color scheme to use
   */
  colorScheme?: keyof typeof import('../constants/Colors').Colors.light &
    keyof typeof import('../constants/Colors').Colors.dark;
}

/**
 * A text component that adapts to accessibility settings
 */
const AccessibleText: React.FC<AccessibleTextProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  applyHighContrast = true,
  applyLargeText = true,
  applyBoldText = true,
  highContrastStyle,
  largeTextStyle,
  boldTextStyle,
  style,
  children,
  importantForAccessibility,
  useThemedColor = true,
  colorScheme = 'text',
  ...props
}) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );

  // Theme colors
  const color = useThemeColorHook({}, colorScheme);

  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener(newPreferences => {
      setPreferences(newPreferences);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Determine if high contrast should be applied
  const shouldApplyHighContrast =
    applyHighContrast && (preferences.highContrast || accessibilityService.isHighContrastActive());

  // Determine if large text should be applied
  const shouldApplyLargeText = applyLargeText && preferences.largeText;

  // Determine if bold text should be applied
  const shouldApplyBoldText =
    applyBoldText && (preferences.boldText || accessibilityService.isBoldTextActive());

  // Get accessibility props
  const accessibilityProps = accessibilityLabel
    ? accessibilityService.getAccessibilityProps(
        accessibilityLabel,
        accessibilityHint,
        accessibilityRole,
        accessibilityState
      )
    : {};

  // Apply styles based on preferences
  const appliedStyle = [
    useThemedColor && { color },
    style,
    shouldApplyHighContrast && styles.highContrast,
    shouldApplyHighContrast && highContrastStyle,
    shouldApplyLargeText && styles.largeText,
    shouldApplyLargeText && largeTextStyle,
    shouldApplyBoldText && styles.boldText,
    shouldApplyBoldText && boldTextStyle,
  ];

  return (
    <Text
      style={appliedStyle}
      importantForAccessibility={importantForAccessibility}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  highContrast: {
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  largeText: {
    fontSize: 18, // Base size, will be scaled
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default AccessibleText;
