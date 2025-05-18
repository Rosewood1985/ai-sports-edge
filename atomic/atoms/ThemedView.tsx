import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

/**
 * ThemedView component that automatically uses the theme's background color
 * and accepts standard View props.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */
export type ThemedViewBackground =
  | 'primary' // Typically theme.colors.primaryBackground
  | 'surface' // Typically theme.colors.surfaceBackground
  | 'transparent'; // Default, no background color applied

export type ThemedViewProps = ViewProps & {
  background?: ThemedViewBackground;
};

export function ThemedView({
  style,
  background = 'transparent', // Default to transparent background
  children,
  ...otherProps
}: ThemedViewProps) {
  const { colors } = useTheme();

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

  const backgroundColor = getBackgroundColor();

  return (
    <View
      style={[
        backgroundColor !== 'transparent' ? { backgroundColor } : {}, // Apply background only if not transparent
        style, // Apply any custom styles passed in props
      ]}
      {...otherProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Add any necessary styles here
});

export default ThemedView;
