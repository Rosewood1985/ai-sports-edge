import React from 'react';
import { Dimensions, Platform, PixelRatio, ScaledSize } from 'react-native';

/**
 * Device Optimization Utilities
 * 
 * This file provides utilities for optimizing UI elements for different device sizes and platforms.
 * It helps ensure consistent appearance across various screen sizes and pixel densities.
 */

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design is based on these dimensions)
const BASE_WIDTH = 375; // iPhone X width
const BASE_HEIGHT = 812; // iPhone X height

// Device type detection
export enum DeviceType {
  PHONE_SMALL = 'PHONE_SMALL',   // < 360dp width
  PHONE = 'PHONE',               // 360dp - 480dp width
  PHONE_LARGE = 'PHONE_LARGE',   // 480dp - 600dp width
  TABLET = 'TABLET',             // 600dp - 840dp width
  TABLET_LARGE = 'TABLET_LARGE', // > 840dp width
}

/**
 * Get the device type based on screen width
 * @returns {DeviceType} The device type
 */
export const getDeviceType = (): DeviceType => {
  const { width } = Dimensions.get('window');
  
  if (width < 360) return DeviceType.PHONE_SMALL;
  if (width < 480) return DeviceType.PHONE;
  if (width < 600) return DeviceType.PHONE_LARGE;
  if (width < 840) return DeviceType.TABLET;
  return DeviceType.TABLET_LARGE;
};

/**
 * Scale a size based on the device's screen width
 * @param {number} size - Size to scale
 * @returns {number} - Scaled size
 */
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Scale a size based on the device's screen height
 * @param {number} size - Size to scale
 * @returns {number} - Scaled size
 */
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Scale a size based on the smaller dimension (width or height)
 * This ensures the element is visible on all screen sizes
 * @param {number} size - Size to scale
 * @returns {number} - Scaled size
 */
export const scaleSizeMin = (size: number): number => {
  return Math.min(scaleWidth(size), scaleHeight(size));
};

/**
 * Scale a font size based on the device's screen width
 * @param {number} size - Font size to scale
 * @returns {number} - Scaled font size
 */
export const scaleFontSize = (size: number): number => {
  const deviceType = getDeviceType();
  
  // Apply different scaling factors based on device type
  switch (deviceType) {
    case DeviceType.PHONE_SMALL:
      return size * 0.85;
    case DeviceType.PHONE:
      return size;
    case DeviceType.PHONE_LARGE:
      return size * 1.1;
    case DeviceType.TABLET:
      return size * 1.2;
    case DeviceType.TABLET_LARGE:
      return size * 1.3;
    default:
      return size;
  }
};

/**
 * Get spacing value based on device type
 * @param {number} baseSpacing - Base spacing value
 * @returns {number} - Adjusted spacing value
 */
export const getResponsiveSpacing = (baseSpacing: number): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case DeviceType.PHONE_SMALL:
      return baseSpacing * 0.8;
    case DeviceType.PHONE:
      return baseSpacing;
    case DeviceType.PHONE_LARGE:
      return baseSpacing * 1.1;
    case DeviceType.TABLET:
      return baseSpacing * 1.3;
    case DeviceType.TABLET_LARGE:
      return baseSpacing * 1.5;
    default:
      return baseSpacing;
  }
};

/**
 * Get adjusted shadow values based on device pixel ratio
 * @param {object} shadow - Shadow object with radius, opacity, etc.
 * @returns {object} - Adjusted shadow object
 */
export const getOptimizedShadow = (shadow: any): any => {
  const pixelRatio = PixelRatio.get();
  
  // Adjust shadow values based on pixel ratio
  if (pixelRatio <= 1) {
    // Low density screens
    return {
      ...shadow,
      shadowRadius: shadow.shadowRadius * 0.7,
      shadowOpacity: shadow.shadowOpacity * 0.8,
      elevation: shadow.elevation ? shadow.elevation * 0.7 : undefined,
    };
  } else if (pixelRatio <= 2) {
    // Medium density screens
    return shadow;
  } else {
    // High density screens
    return {
      ...shadow,
      shadowRadius: shadow.shadowRadius * 1.2,
      shadowOpacity: shadow.shadowOpacity * 1.1,
      elevation: shadow.elevation ? shadow.elevation * 1.2 : undefined,
    };
  }
};

/**
 * Hook to listen for dimension changes
 * @returns {ScaledSize} - Current window dimensions
 */
export const useDimensionsListener = (): ScaledSize => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));
  
  React.useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    
    return () => {
      // Clean up subscription
      subscription.remove();
    };
  }, []);
  
  return dimensions;
};

/**
 * Check if the device is a tablet
 * @returns {boolean} - True if the device is a tablet
 */
export const isTablet = (): boolean => {
  const deviceType = getDeviceType();
  return deviceType === DeviceType.TABLET || deviceType === DeviceType.TABLET_LARGE;
};

/**
 * Get optimized neon glow intensity based on device performance
 * @param {string} defaultIntensity - Default intensity ('low', 'medium', 'high')
 * @returns {string} - Optimized intensity
 */
export const getOptimizedGlowIntensity = (defaultIntensity: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' => {
  // Check if device is low-end
  const isLowEndDevice = Platform.OS === 'android' && PixelRatio.get() < 2;
  
  if (isLowEndDevice) {
    // Reduce glow intensity on low-end devices
    if (defaultIntensity === 'high') return 'medium';
    if (defaultIntensity === 'medium') return 'low';
    return 'low';
  }
  
  return defaultIntensity;
};

export default {
  getDeviceType,
  scaleWidth,
  scaleHeight,
  scaleSizeMin,
  scaleFontSize,
  getResponsiveSpacing,
  getOptimizedShadow,
  useDimensionsListener,
  isTablet,
  getOptimizedGlowIntensity,
};