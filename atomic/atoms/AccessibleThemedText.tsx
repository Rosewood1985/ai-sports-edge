import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import accessibilityService, {
  AccessibilityPreferences,
} from '../../services/accessibilityService';

/**
 * AccessibleThemedText component that combines theming capabilities with accessibility features.
 *
 * This component extends ThemedText with accessibility features like high contrast,
 * large text, and bold text. It automatically adapts to the user's accessibility
 * preferences and provides proper accessibility attributes for screen readers.
 */
export type AccessibleThemedTextProps = TextProps & {
  type?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'bodyStd'
    | 'bodySmall'
    | 'label'
    | 'button'
    | 'small'
    | 'defaultSemiBold';
  color?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'action'
    | 'statusHigh'
    | 'statusMedium'
    | 'statusLow';
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
  highContrastStyle?: any;

  /**
   * Large text style overrides
   */
  largeTextStyle?: any;

  /**
   * Bold text style overrides
   */
  boldTextStyle?: any;
};

export function AccessibleThemedText({
  style,
  children,
  type = 'bodyStd',
  color,
  accessibilityLabel,
  accessibilityHint,
  applyHighContrast = true,
  applyLargeText = true,
  applyBoldText = true,
  highContrastStyle,
  largeTextStyle,
  boldTextStyle,
  ...props
}: AccessibleThemedTextProps) {
  const { colors } = useTheme();
  const [preferences, setPreferences] = React.useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );

  // Subscribe to accessibility service changes
  React.useEffect(() => {
    const unsubscribe = accessibilityService.addListener(newPreferences => {
      setPreferences(newPreferences);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Get the text color based on the color prop or default to the theme's text color
  const getTextColor = () => {
    if (!color) return colors.text;

    switch (color) {
      case 'primary':
        return colors.text; // Use primary text color
      case 'secondary':
        return colors.text + 'B0'; // Add transparency for secondary text
      case 'tertiary':
        return colors.text + '80'; // Add more transparency for tertiary text
      case 'action':
        return colors.primary; // Use primary color for action text
      case 'statusHigh':
        return '#39FF14'; // Neon Green
      case 'statusMedium':
        return '#FFF000'; // Neon Yellow
      case 'statusLow':
        return '#FF1010'; // Neon Red
      default:
        return colors.text;
    }
  };

  // Get the text style based on the type prop
  const getTextStyle = () => {
    switch (type) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'h4':
        return styles.h4;
      case 'bodyStd':
        return styles.bodyStd;
      case 'bodySmall':
        return styles.bodySmall;
      case 'label':
        return styles.label;
      case 'button':
        return styles.button;
      case 'small':
        return styles.small;
      case 'defaultSemiBold':
        return styles.defaultSemiBold;
      default:
        return styles.bodyStd;
    }
  };

  // Generate a default accessibility label if none is provided
  const getDefaultAccessibilityLabel = () => {
    if (typeof children === 'string') {
      return children;
    }
    return undefined;
  };

  // Determine if high contrast should be applied
  const shouldApplyHighContrast =
    applyHighContrast && (preferences.highContrast || accessibilityService.isHighContrastActive());

  // Determine if large text should be applied
  const shouldApplyLargeText = applyLargeText && preferences.largeText;

  // Determine if bold text should be applied
  const shouldApplyBoldText =
    applyBoldText && (preferences.boldText || accessibilityService.isBoldTextActive());

  // Determine accessibility role based on type
  const getAccessibilityRole = () => {
    switch (type) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        return 'header';
      case 'button':
        return 'button';
      default:
        return 'text';
    }
  };

  // Get accessibility props
  const accessibilityProps =
    accessibilityLabel || getDefaultAccessibilityLabel()
      ? accessibilityService.getAccessibilityProps(
          accessibilityLabel || getDefaultAccessibilityLabel() || '',
          accessibilityHint,
          getAccessibilityRole(),
          undefined
        )
      : {};

  // Apply styles based on preferences
  const appliedStyle = [
    getTextStyle(),
    { color: getTextColor() },
    style,
    shouldApplyHighContrast && styles.highContrast,
    shouldApplyHighContrast && highContrastStyle,
    shouldApplyLargeText && styles.largeText,
    shouldApplyLargeText && largeTextStyle,
    shouldApplyBoldText && styles.boldText,
    shouldApplyBoldText && boldTextStyle,
  ];

  return (
    <Text style={appliedStyle} {...accessibilityProps} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bodyStd: {
    fontSize: 16,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
  },
  defaultSemiBold: {
    fontSize: 16,
    fontWeight: '600',
  },
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

export default AccessibleThemedText;
