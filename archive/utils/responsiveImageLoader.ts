import { Dimensions, Platform, PixelRatio } from 'react-native';

/**
 * Utility for responsive image loading based on device resolution and screen size
 */

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate pixel ratio and width (dp)
const pixelRatio = PixelRatio.get();
const widthPixels = SCREEN_WIDTH * pixelRatio;
const heightPixels = SCREEN_HEIGHT * pixelRatio;

// Define resolution breakpoints
const RESOLUTION_BREAKPOINTS = {
  low: 1, // 1x devices
  medium: 2, // 2x devices (iPhone 6, 7, 8)
  high: 3, // 3x devices (iPhone X, 11, 12, 13)
  ultra: 4, // High-end Android devices
};

// Define screen size breakpoints
const SIZE_BREAKPOINTS = {
  small: 375, // iPhone SE
  medium: 414, // iPhone 8 Plus, XR
  large: 428, // iPhone 12 Pro Max
  tablet: 768, // iPad
};

/**
 * Get the appropriate image resolution suffix based on device
 * @returns Resolution suffix for image files
 */
export const getResolutionSuffix = (): string => {
  if (pixelRatio >= RESOLUTION_BREAKPOINTS.ultra) {
    return '@4x';
  } else if (pixelRatio >= RESOLUTION_BREAKPOINTS.high) {
    return '@3x';
  } else if (pixelRatio >= RESOLUTION_BREAKPOINTS.medium) {
    return '@2x';
  }
  return '';
};

/**
 * Get the appropriate image size category based on screen width
 * @returns Size category (small, medium, large, tablet)
 */
export const getSizeCategory = (): 'small' | 'medium' | 'large' | 'tablet' => {
  if (SCREEN_WIDTH >= SIZE_BREAKPOINTS.tablet) {
    return 'tablet';
  } else if (SCREEN_WIDTH >= SIZE_BREAKPOINTS.large) {
    return 'large';
  } else if (SCREEN_WIDTH >= SIZE_BREAKPOINTS.medium) {
    return 'medium';
  }
  return 'small';
};

/**
 * Get the appropriate image source based on device resolution and screen size
 * @param basePath Base path of the image without extension
 * @param extension Image extension (default: 'png')
 * @returns Full image path with appropriate resolution suffix
 */
export const getResponsiveImageSource = (
  basePath: string,
  extension: string = 'png'
): string => {
  const resolutionSuffix = getResolutionSuffix();
  const sizeCategory = getSizeCategory();
  
  // First try to load size-specific image with resolution suffix
  const sizeSpecificPath = `${basePath}_${sizeCategory}${resolutionSuffix}.${extension}`;
  
  // Fallback to just resolution-specific image
  const resolutionSpecificPath = `${basePath}${resolutionSuffix}.${extension}`;
  
  // Final fallback to base image
  const baseFallbackPath = `${basePath}.${extension}`;
  
  // Try to require each path in order of preference
  try {
    return sizeSpecificPath;
  } catch (e) {
    try {
      return resolutionSpecificPath;
    } catch (e) {
      return baseFallbackPath;
    }
  }
};

/**
 * Calculate responsive dimensions based on screen size
 * @param baseWidth Base width in design (default: 375)
 * @param baseHeight Base height in design (default: 812)
 * @param targetWidth Target width to scale
 * @param targetHeight Target height to scale
 * @returns Scaled dimensions {width, height}
 */
export const getResponsiveDimensions = (
  targetWidth: number,
  targetHeight: number,
  baseWidth: number = 375,
  baseHeight: number = 812
): { width: number; height: number } => {
  const widthRatio = SCREEN_WIDTH / baseWidth;
  const heightRatio = SCREEN_HEIGHT / baseHeight;
  
  return {
    width: targetWidth * widthRatio,
    height: targetHeight * heightRatio,
  };
};

/**
 * Determine if the current device is a high-end device capable of complex animations
 * Based on device memory, processor, and platform
 * @returns Boolean indicating if device is high-end
 */
export const isHighEndDevice = (): boolean => {
  // iOS devices are generally more performant
  if (Platform.OS === 'ios') {
    // Check for newer iOS devices based on screen dimensions and pixel ratio
    if (
      (SCREEN_HEIGHT >= 812 && pixelRatio >= 2) || // iPhone X and newer
      (SCREEN_WIDTH >= 768 && pixelRatio >= 2) // iPad Pro and newer
    ) {
      return true;
    }
  } else if (Platform.OS === 'android') {
    // For Android, we can only estimate based on pixel ratio and screen size
    // Higher-end Android devices typically have higher pixel ratios
    if (pixelRatio >= 3 && SCREEN_WIDTH >= 400) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get appropriate image quality setting based on device capabilities
 * @returns Quality setting (low, medium, high)
 */
export const getImageQuality = (): 'low' | 'medium' | 'high' => {
  if (isHighEndDevice()) {
    return 'high';
  } else if (pixelRatio >= RESOLUTION_BREAKPOINTS.medium) {
    return 'medium';
  }
  return 'low';
};

/**
 * Responsive image component props
 */
export interface ResponsiveImageProps {
  basePath: string;
  extension?: string;
  width?: number;
  height?: number;
  baseWidth?: number;
  baseHeight?: number;
  style?: any;
  fallbackBasePath?: string;
}