import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useUITheme } from '../../components/UIThemeProvider';
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
  const { theme } = useUITheme();
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

  // Get the text style based on the type prop using theme typography
  const getTextStyle = () => {
    switch (type) {
      case 'h1':
        return {
          fontSize: theme.typography.fontSize.h1,
          lineHeight: theme.typography.lineHeight.h1,
          fontWeight: theme.typography.fontWeight.bold,
          fontFamily: theme.typography.fontFamily.heading,
          marginBottom: theme.spacing.xs,
        };
      case 'h2':
        return {
          fontSize: theme.typography.fontSize.h2,
          lineHeight: theme.typography.lineHeight.h2,
          fontWeight: theme.typography.fontWeight.bold,
          fontFamily: theme.typography.fontFamily.heading,
          marginBottom: theme.spacing.xxs,
        };
      case 'h3':
        return {
          fontSize: theme.typography.fontSize.h3,
          lineHeight: theme.typography.lineHeight.h3,
          fontWeight: theme.typography.fontWeight.semiBold,
          fontFamily: theme.typography.fontFamily.heading,
          marginBottom: theme.spacing.xxs,
        };
      case 'h4':
        return {
          fontSize: theme.typography.fontSize.bodyLg,
          lineHeight: theme.typography.lineHeight.bodyLg,
          fontWeight: theme.typography.fontWeight.semiBold,
          fontFamily: theme.typography.fontFamily.body,
          marginBottom: theme.spacing.xxs,
        };
      case 'bodyStd':
        return {
          fontSize: theme.typography.fontSize.bodyStd,
          lineHeight: theme.typography.lineHeight.bodyStd,
          fontWeight: theme.typography.fontWeight.regular,
          fontFamily: theme.typography.fontFamily.body,
        };
      case 'bodySmall':
        return {
          fontSize: theme.typography.fontSize.label,
          lineHeight: theme.typography.lineHeight.label,
          fontWeight: theme.typography.fontWeight.regular,
          fontFamily: theme.typography.fontFamily.body,
        };
      case 'label':
        return {
          fontSize: theme.typography.fontSize.label,
          lineHeight: theme.typography.lineHeight.label,
          fontWeight: theme.typography.fontWeight.medium,
          fontFamily: theme.typography.fontFamily.body,
        };
      case 'button':
        return {
          fontSize: theme.typography.fontSize.button,
          lineHeight: theme.typography.lineHeight.button,
          fontWeight: theme.typography.fontWeight.semiBold,
          fontFamily: theme.typography.fontFamily.body,
        };
      case 'small':
        return {
          fontSize: theme.typography.fontSize.small,
          lineHeight: theme.typography.lineHeight.small,
          fontWeight: theme.typography.fontWeight.regular,
          fontFamily: theme.typography.fontFamily.body,
        };
      case 'defaultSemiBold':
        return {
          fontSize: theme.typography.fontSize.bodyStd,
          lineHeight: theme.typography.lineHeight.bodyStd,
          fontWeight: theme.typography.fontWeight.semiBold,
          fontFamily: theme.typography.fontFamily.body,
        };
      default:
        return {
          fontSize: theme.typography.fontSize.bodyStd,
          lineHeight: theme.typography.lineHeight.bodyStd,
          fontWeight: theme.typography.fontWeight.regular,
          fontFamily: theme.typography.fontFamily.body,
        };
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
    shouldApplyHighContrast && {
      color: '#000000',
      backgroundColor: '#ffffff',
    },
    shouldApplyHighContrast && highContrastStyle,
    shouldApplyLargeText && {
      fontSize: theme.typography.fontSize.bodyLg, // Scale up by one step
    },
    shouldApplyLargeText && largeTextStyle,
    shouldApplyBoldText && {
      fontWeight: theme.typography.fontWeight.bold,
    },
    shouldApplyBoldText && boldTextStyle,
  ];

  return (
    <Text style={appliedStyle} {...accessibilityProps} {...props}>
      {children}
    </Text>
  );
}

export default AccessibleThemedText;
