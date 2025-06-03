import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import {
  DeviceType,
  Orientation,
  getDeviceType,
  getOrientation,
  useResponsiveDimensions,
} from '../utils/responsiveUtils';

type StylesFunction<T> = (params: {
  deviceType: DeviceType;
  orientation: Orientation;
  width: number;
  height: number;
  isTablet: boolean;
}) => T;

/**
 * Hook to create responsive styles that adapt to device type and orientation
 * @param stylesFunction Function that returns styles based on device parameters
 * @returns Memoized styles that update when dimensions change
 */
export function useResponsiveStyles<T>(stylesFunction: StylesFunction<T>): T {
  const dimensions = useResponsiveDimensions();

  return useMemo(() => {
    return stylesFunction({
      deviceType: dimensions.deviceType,
      orientation: dimensions.orientation,
      width: dimensions.width,
      height: dimensions.height,
      isTablet: dimensions.isTablet,
    });
  }, [
    dimensions.deviceType,
    dimensions.orientation,
    dimensions.width,
    dimensions.height,
    dimensions.isTablet,
    stylesFunction,
  ]);
}

/**
 * Creates responsive styles for different device types
 * @param baseStyles Base styles for all devices
 * @param tabletStyles Additional/override styles for tablets
 * @param phoneStyles Additional/override styles for phones
 * @returns Combined styles based on current device
 */
export function createResponsiveStyles<T>(
  baseStyles: T,
  tabletStyles: Partial<T> = {},
  phoneStyles: Partial<T> = {}
): T {
  const deviceType = getDeviceType();

  if (deviceType === DeviceType.TABLET) {
    return { ...baseStyles, ...tabletStyles };
  }

  return { ...baseStyles, ...phoneStyles };
}

/**
 * Creates orientation-specific styles
 * @param baseStyles Base styles for all orientations
 * @param landscapeStyles Additional/override styles for landscape orientation
 * @param portraitStyles Additional/override styles for portrait orientation
 * @returns Combined styles based on current orientation
 */
export function createOrientationStyles<T>(
  baseStyles: T,
  landscapeStyles: Partial<T> = {},
  portraitStyles: Partial<T> = {}
): T {
  const orientation = getOrientation();

  if (orientation === Orientation.LANDSCAPE) {
    return { ...baseStyles, ...landscapeStyles };
  }

  return { ...baseStyles, ...portraitStyles };
}

/**
 * Creates fully responsive styles that adapt to both device type and orientation
 * @param baseStyles Base styles for all devices and orientations
 * @param tabletStyles Tablet-specific styles
 * @param phoneStyles Phone-specific styles
 * @param landscapeStyles Landscape-specific styles
 * @param portraitStyles Portrait-specific styles
 * @returns Combined styles based on current device and orientation
 */
export function createFullyResponsiveStyles<T>(
  baseStyles: T,
  tabletStyles: Partial<T> = {},
  phoneStyles: Partial<T> = {},
  landscapeStyles: Partial<T> = {},
  portraitStyles: Partial<T> = {}
): T {
  const deviceType = getDeviceType();
  const orientation = getOrientation();

  let styles = { ...baseStyles };

  // Apply device-specific styles
  if (deviceType === DeviceType.TABLET) {
    styles = { ...styles, ...tabletStyles };
  } else {
    styles = { ...styles, ...phoneStyles };
  }

  // Apply orientation-specific styles
  if (orientation === Orientation.LANDSCAPE) {
    styles = { ...styles, ...landscapeStyles };
  } else {
    styles = { ...styles, ...portraitStyles };
  }

  return styles;
}
