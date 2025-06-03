import React from 'react';
import { Text, TextProps, StyleSheet, PixelRatio, Dimensions, TextStyle } from 'react-native';

import { ThemedText, ThemedTextProps } from './ThemedText';
import {
  responsiveFontSize,
  useSystemFontScale,
  DeviceType,
  getDeviceType,
} from '../../utils/responsiveUtils';

/**
 * ResponsiveText component that automatically scales text based on screen size
 * and inherits all the theming capabilities of ThemedText.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */

export type ResponsiveTextProps = ThemedTextProps & {
  /**
   * Minimum font size allowed (default: 10)
   */
  minFontSize?: number;

  /**
   * Maximum font size allowed (default: 32)
   */
  maxFontSize?: number;

  /**
   * Override the default scale factor calculation
   */
  scaleFactorOverride?: number;

  /**
   * Whether to respect system font size settings (default: true)
   */
  respectSystemSettings?: boolean;

  /**
   * Base device type to scale from (default: DeviceType.PHONE)
   */
  baseDeviceType?: DeviceType;
};

export function ResponsiveText({
  style,
  children,
  minFontSize = 10,
  maxFontSize = 32,
  scaleFactorOverride,
  respectSystemSettings = true,
  baseDeviceType = DeviceType.PHONE,
  ...props
}: ResponsiveTextProps) {
  // Get the system font scale
  const systemFontScale = useSystemFontScale();

  // Calculate the normalized font size
  const calculateFontSize = (style: any) => {
    if (!style || !style.fontSize) return undefined;

    // Get the base font size from the style
    const baseFontSize = style.fontSize;

    // Calculate the responsive font size
    const scaledSize = responsiveFontSize(baseFontSize, respectSystemSettings);

    // Use the provided scale factor if available
    const finalSize =
      scaleFactorOverride !== undefined ? baseFontSize * scaleFactorOverride : scaledSize;

    // Ensure the font size is within the specified range
    return Math.min(Math.max(finalSize, minFontSize), maxFontSize);
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

  // Apply additional styles based on system font scale if respecting system settings
  const getSystemFontStyles = (): TextStyle | undefined => {
    if (!respectSystemSettings) return undefined;

    // Apply additional styles based on system font scale
    if (systemFontScale >= 1.3) {
      // For very large font sizes, adjust line height and letter spacing
      return {
        lineHeight: 1.4, // Increase line height for better readability
        letterSpacing: 0.5, // Increase letter spacing
      };
    }

    return undefined;
  };

  // Combine responsive style with system font styles
  const combinedStyles = React.useMemo(() => {
    const systemFontStyles = getSystemFontStyles();

    if (!responsiveStyle && !systemFontStyles) {
      return undefined;
    }

    if (!responsiveStyle) {
      return systemFontStyles;
    }

    if (!systemFontStyles) {
      return responsiveStyle;
    }

    // If responsiveStyle is an array, append systemFontStyles
    if (Array.isArray(responsiveStyle)) {
      return [...responsiveStyle, systemFontStyles];
    }

    // If responsiveStyle is an object, create an array
    return [responsiveStyle, systemFontStyles];
  }, [responsiveStyle, systemFontScale, respectSystemSettings]);

  // Render the ThemedText component with the responsive style
  return (
    <ThemedText style={combinedStyles} {...props}>
      {children}
    </ThemedText>
  );
}

export default ResponsiveText;
