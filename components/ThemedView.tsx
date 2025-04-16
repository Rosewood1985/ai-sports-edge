import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useUITheme } from './UIThemeProvider'; // Import the simplified theme hook

// Define semantic background types based on theme.colors keys
export type ThemedViewBackground =
  | 'primary'   // Typically theme.colors.primaryBackground
  | 'surface'   // Typically theme.colors.surfaceBackground
  | 'transparent'; // Default, no background color applied

export type ThemedViewProps = ViewProps & {
  background?: ThemedViewBackground;
  // lightColor and darkColor props are removed
};

export function ThemedView({
  style,
  background = 'transparent', // Default to transparent background
  ...otherProps
}: ThemedViewProps) {
  const { theme } = useUITheme(); // Get the theme object

  // Map semantic background prop to theme color values
  const getBackgroundColor = () => {
    switch (background) {
      case 'primary':
        return theme.colors.primaryBackground;
      case 'surface':
        return theme.colors.surfaceBackground;
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
    />
  );
}
