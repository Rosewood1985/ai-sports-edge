import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';

/**
 * ThemedText component that automatically uses the theme's text color
 * and accepts standard Text props like numberOfLines.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */
export type ThemedTextProps = TextProps & {
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
};

export function ThemedText({
  style,
  children,
  type = 'bodyStd',
  color,
  ...props
}: ThemedTextProps) {
  const { colors } = useTheme();

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

  return (
    <Text style={[getTextStyle(), { color: getTextColor() }, style]} {...props}>
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
});

export default ThemedText;
