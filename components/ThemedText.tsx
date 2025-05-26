import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native'; // Import TextStyle
import { useUITheme } from './UIThemeProvider'; // Import the simplified theme hook
import { Colors } from '../constants/Colors'; // Import Colors directly for status access

// Define semantic types based on theme.typography keys
export type ThemedTextType =
  | 'h1' | 'h2' | 'h3'
  | 'bodyLg' | 'bodyStd'
  | 'label' | 'small'
  | 'button'
  | 'link'
  | 'default'; // Maps to bodyStd

// Define semantic color keys based on theme.colors keys
export type ThemedTextColor =
  | 'primary' | 'secondary' | 'tertiary'
  | 'action' | 'accent'
  | 'statusHigh' | 'statusMedium' | 'statusLow'
  | 'inherit'; // Allows color to be inherited from parent styles

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  color?: ThemedTextColor;
};

export function ThemedText({
  style,
  type = 'default',
  color = 'primary', // Default to primary text color
  ...rest
}: ThemedTextProps) {
  const { theme } = useUITheme(); // Get the theme object

  // Map semantic type to theme typography styles
  // Explicitly type the return as TextStyle to satisfy RN's expected types
  const getTextStyle = (): TextStyle => {
    const resolvedType = type === 'default' ? 'bodyStd' : type;
    switch (resolvedType) {
      case 'h1':
        return {
          fontFamily: theme.typography.fontFamily.heading,
          fontSize: theme.typography.fontSize.h1,
          fontWeight: theme.typography.fontWeight.bold as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.h1,
        };
      case 'h2':
        return {
          fontFamily: theme.typography.fontFamily.heading,
          fontSize: theme.typography.fontSize.h2,
          fontWeight: theme.typography.fontWeight.bold as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.h2,
        };
      case 'h3':
        return {
          fontFamily: theme.typography.fontFamily.heading,
          fontSize: theme.typography.fontSize.h3,
          fontWeight: theme.typography.fontWeight.medium as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.h3,
        };
      case 'bodyLg':
        return {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.fontSize.bodyLg,
          fontWeight: theme.typography.fontWeight.regular as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.bodyLg,
        };
      case 'bodyStd':
        return {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.fontSize.bodyStd,
          fontWeight: theme.typography.fontWeight.regular as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.bodyStd,
        };
      case 'label':
        return {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.fontSize.label,
          fontWeight: theme.typography.fontWeight.medium as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.label,
        };
      case 'small':
        return {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.fontSize.small,
          fontWeight: theme.typography.fontWeight.regular as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.small,
        };
      case 'button':
        return {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.fontSize.button,
          fontWeight: theme.typography.fontWeight.medium as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.button,
        };
      case 'link':
        return {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.fontSize.bodyStd,
          fontWeight: theme.typography.fontWeight.regular as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.bodyStd,
        };
      default: // Fallback to bodyStd
        return {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.fontSize.bodyStd,
          fontWeight: theme.typography.fontWeight.regular as TextStyle['fontWeight'], // Cast fontWeight
          lineHeight: theme.typography.lineHeight.bodyStd,
        };
    }
  };

  // Map semantic color prop to theme color values
  const getTextColor = () => {
    if (color === 'inherit') return undefined; // Don't apply color if 'inherit'

    // Handle link type specifically if color prop isn't overriding it
    if (type === 'link' && color === 'primary') {
       return theme.colors.primaryAction;
    }

    switch (color) {
      case 'primary': return theme.colors.primaryText;
      case 'secondary': return theme.colors.secondaryText;
      case 'tertiary': return theme.colors.tertiaryText;
      case 'action': return theme.colors.primaryAction;
      case 'accent': return theme.colors.accent;
      // Access status colors from the imported Colors object
      case 'statusHigh': return Colors.status.highConfidence;
      case 'statusMedium': return Colors.status.mediumConfidence;
      case 'statusLow': return Colors.status.lowConfidence;
      default: return theme.colors.primaryText; // Fallback
    }
  };

  const textStyle = getTextStyle();
  const textColor = getTextColor();

  return (
    <Text
      style={[
        textStyle, // Apply styles based on type
        textColor ? { color: textColor } : {}, // Apply color unless 'inherit'
        style, // Apply any custom styles passed in props
      ]}
      {...rest}
    />
  );
}
