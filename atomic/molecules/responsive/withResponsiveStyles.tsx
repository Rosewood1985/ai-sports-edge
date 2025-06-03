import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

import { useResponsiveDimensions, DeviceType, Orientation } from '../../../utils/responsiveUtils';

// Type for style objects
type StyleObject = ViewStyle | TextStyle | ImageStyle;

// Type for responsive style function
export type ResponsiveStyleFunction<P> = (params: {
  props: P;
  deviceType: DeviceType;
  orientation: Orientation;
  width: number;
  height: number;
  isTablet: boolean;
  fontScale: number;
}) => StyleObject | StyleObject[] | undefined;

/**
 * Higher-Order Component that adds responsive styling to any component
 * @param WrappedComponent The component to wrap
 * @param getResponsiveStyles Function that returns responsive styles based on device parameters and props
 * @returns A new component with responsive styling
 */
export function withResponsiveStyles<P extends object>(
  WrappedComponent: React.ComponentType<P & { style?: StyleObject | StyleObject[] }>,
  getResponsiveStyles: ResponsiveStyleFunction<P>
): React.FC<P & { style?: StyleObject | StyleObject[] }> {
  // Create a new component that wraps the original component
  const WithResponsiveStyles: React.FC<P & { style?: StyleObject | StyleObject[] }> = props => {
    // Get responsive dimensions and device info
    const dimensions = useResponsiveDimensions();

    // Calculate responsive styles
    const responsiveStyles = React.useMemo(() => {
      return getResponsiveStyles({
        props,
        deviceType: dimensions.deviceType,
        orientation: dimensions.orientation,
        width: dimensions.width,
        height: dimensions.height,
        isTablet: dimensions.isTablet,
        fontScale: dimensions.fontScale,
      });
    }, [
      props,
      dimensions.deviceType,
      dimensions.orientation,
      dimensions.width,
      dimensions.height,
      dimensions.isTablet,
      dimensions.fontScale,
    ]);

    // Combine the original style with the responsive styles
    const combinedStyles = React.useMemo(() => {
      if (!props.style && !responsiveStyles) {
        return undefined;
      }

      if (!props.style) {
        return responsiveStyles;
      }

      if (!responsiveStyles) {
        return props.style;
      }

      // If both styles are arrays, concatenate them
      if (Array.isArray(props.style) && Array.isArray(responsiveStyles)) {
        return [...props.style, ...responsiveStyles];
      }

      // If only props.style is an array, append responsiveStyles
      if (Array.isArray(props.style)) {
        return [...props.style, responsiveStyles];
      }

      // If only responsiveStyles is an array, prepend props.style
      if (Array.isArray(responsiveStyles)) {
        return [props.style, ...responsiveStyles];
      }

      // If both are objects, create an array
      return [props.style, responsiveStyles];
    }, [props.style, responsiveStyles]);

    // Render the wrapped component with the combined styles
    return <WrappedComponent {...props} style={combinedStyles} />;
  };

  // Set display name for debugging
  const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithResponsiveStyles.displayName = `withResponsiveStyles(${wrappedComponentName})`;

  return WithResponsiveStyles;
}

/**
 * Creates a responsive component with predefined styles for different device types and orientations
 * @param WrappedComponent The component to wrap
 * @param baseStyles Base styles for all devices and orientations
 * @param deviceTypeStyles Styles for specific device types
 * @param orientationStyles Styles for specific orientations
 * @returns A new component with responsive styling
 */
export function createResponsiveComponent<P extends object>(
  WrappedComponent: React.ComponentType<P & { style?: StyleObject | StyleObject[] }>,
  baseStyles?: StyleObject,
  deviceTypeStyles?: {
    smallPhone?: StyleObject;
    phone?: StyleObject;
    largePhone?: StyleObject;
    smallTablet?: StyleObject;
    tablet?: StyleObject;
    largeTablet?: StyleObject;
  },
  orientationStyles?: {
    landscape?: StyleObject;
    portrait?: StyleObject;
  }
): React.FC<P & { style?: StyleObject | StyleObject[] }> {
  return withResponsiveStyles(WrappedComponent, ({ deviceType, orientation }) => {
    // Start with base styles
    const styles: StyleObject[] = baseStyles ? [baseStyles] : [];

    // Add device-specific styles
    if (deviceTypeStyles) {
      switch (deviceType) {
        case DeviceType.SMALL_PHONE:
          if (deviceTypeStyles.smallPhone) {
            styles.push(deviceTypeStyles.smallPhone);
          }
          break;
        case DeviceType.PHONE:
          if (deviceTypeStyles.phone) {
            styles.push(deviceTypeStyles.phone);
          }
          break;
        case DeviceType.LARGE_PHONE:
          if (deviceTypeStyles.largePhone) {
            styles.push(deviceTypeStyles.largePhone);
          }
          break;
        case DeviceType.SMALL_TABLET:
          if (deviceTypeStyles.smallTablet) {
            styles.push(deviceTypeStyles.smallTablet);
          }
          break;
        case DeviceType.TABLET:
          if (deviceTypeStyles.tablet) {
            styles.push(deviceTypeStyles.tablet);
          }
          break;
        case DeviceType.LARGE_TABLET:
          if (deviceTypeStyles.largeTablet) {
            styles.push(deviceTypeStyles.largeTablet);
          }
          break;
      }
    }

    // Add orientation-specific styles
    if (orientationStyles) {
      if (orientation === Orientation.LANDSCAPE && orientationStyles.landscape) {
        styles.push(orientationStyles.landscape);
      } else if (orientation === Orientation.PORTRAIT && orientationStyles.portrait) {
        styles.push(orientationStyles.portrait);
      }
    }

    return styles.length > 0 ? styles : undefined;
  });
}

/**
 * Creates a responsive component with dynamic styles based on props and device parameters
 * @param WrappedComponent The component to wrap
 * @param styleFunction Function that returns styles based on props and device parameters
 * @returns A new component with responsive styling
 */
export function createDynamicResponsiveComponent<P extends object>(
  WrappedComponent: React.ComponentType<P & { style?: StyleObject | StyleObject[] }>,
  styleFunction: (params: {
    props: P;
    deviceType: DeviceType;
    orientation: Orientation;
    width: number;
    height: number;
    isTablet: boolean;
    fontScale: number;
  }) => StyleObject
): React.FC<P & { style?: StyleObject | StyleObject[] }> {
  return withResponsiveStyles(WrappedComponent, styleFunction);
}

/**
 * Creates a responsive component that respects system font size settings
 * @param WrappedComponent The component to wrap
 * @param baseStyles Base styles for all devices and orientations
 * @param fontScaleStyles Styles for different font scale factors
 * @returns A new component with responsive styling
 */
export function createAccessibleComponent<P extends object>(
  WrappedComponent: React.ComponentType<P & { style?: StyleObject | StyleObject[] }>,
  baseStyles?: StyleObject,
  fontScaleStyles?: {
    small?: StyleObject;
    medium?: StyleObject;
    large?: StyleObject;
    extraLarge?: StyleObject;
    huge?: StyleObject;
  }
): React.FC<P & { style?: StyleObject | StyleObject[] }> {
  return withResponsiveStyles(WrappedComponent, ({ fontScale }) => {
    // Start with base styles
    const styles: StyleObject[] = baseStyles ? [baseStyles] : [];

    // Add font scale-specific styles
    if (fontScaleStyles) {
      if (fontScale <= 0.85 && fontScaleStyles.small) {
        styles.push(fontScaleStyles.small);
      } else if (fontScale <= 1.15 && fontScaleStyles.medium) {
        styles.push(fontScaleStyles.medium);
      } else if (fontScale <= 1.3 && fontScaleStyles.large) {
        styles.push(fontScaleStyles.large);
      } else if (fontScale <= 1.5 && fontScaleStyles.extraLarge) {
        styles.push(fontScaleStyles.extraLarge);
      } else if (fontScale > 1.5 && fontScaleStyles.huge) {
        styles.push(fontScaleStyles.huge);
      }
    }

    return styles.length > 0 ? styles : undefined;
  });
}

export default withResponsiveStyles;
