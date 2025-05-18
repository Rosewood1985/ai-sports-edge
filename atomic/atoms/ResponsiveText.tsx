import React from 'react';
import { Text, TextProps, StyleSheet, PixelRatio, Dimensions } from 'react-native';
import { ThemedText, ThemedTextProps } from './ThemedText';

/**
 * ResponsiveText component that automatically scales text based on screen size
 * and inherits all the theming capabilities of ThemedText.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */

// Get the screen width
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Base width to scale from (iPhone 11 Pro width)
const BASE_WIDTH = 375;

// Scale factor based on screen width
const scale = SCREEN_WIDTH / BASE_WIDTH;

export type ResponsiveTextProps = ThemedTextProps & {
  minFontSize?: number;
  maxFontSize?: number;
  scaleFactorOverride?: number;
};

export function ResponsiveText({
  style,
  children,
  minFontSize = 10,
  maxFontSize = 32,
  scaleFactorOverride,
  ...props
}: ResponsiveTextProps) {
  // Calculate the normalized font size
  const calculateFontSize = (style: any) => {
    if (!style || !style.fontSize) return undefined;

    // Use the provided scale factor or the default one
    const scaleFactor = scaleFactorOverride !== undefined ? scaleFactorOverride : scale;

    // Calculate the scaled font size
    const scaledSize = style.fontSize * scaleFactor;

    // Ensure the font size is within the specified range
    return Math.min(Math.max(scaledSize, minFontSize), maxFontSize);
  };

  // Process the style to apply responsive font sizing
  const getResponsiveStyle = () => {
    if (!style) return undefined;

    // If style is an array, process each style object
    if (Array.isArray(style)) {
      // Merge all style objects into one
      const flattenedStyle = StyleSheet.flatten(style);

      // Calculate the responsive font size
      const fontSize = calculateFontSize(flattenedStyle);

      // Return the original style array with the responsive font size
      return fontSize ? [...style, { fontSize }] : style;
    }

    // If style is a single object, process it directly
    const fontSize = calculateFontSize(style);

    // Return the original style with the responsive font size
    return fontSize ? [style, { fontSize }] : style;
  };

  // Get the responsive style
  const responsiveStyle = getResponsiveStyle();

  // Render the ThemedText component with the responsive style
  return (
    <ThemedText style={responsiveStyle} {...props}>
      {children}
    </ThemedText>
  );
}

export default ResponsiveText;
