import React from 'react';
import {
  Dimensions,
  Platform,
  ScaledSize,
  AccessibilityInfo,
  TextStyle,
  ViewStyle,
  StyleSheet,
} from 'react-native';

// Device types with more granular categorization
export enum DeviceType {
  SMALL_PHONE, // Small phones (< 360dp width)
  PHONE, // Standard phones (360dp - 480dp width)
  LARGE_PHONE, // Large phones (480dp - 600dp width)
  SMALL_TABLET, // Small tablets (600dp - 768dp width)
  TABLET, // Standard tablets (768dp - 960dp width)
  LARGE_TABLET, // Large tablets (> 960dp width)
}

// Orientation types
export enum Orientation {
  PORTRAIT,
  LANDSCAPE,
}

// Screen size breakpoints with more granular options
export const BREAKPOINTS = {
  SMALL_PHONE: 360,
  PHONE: 480,
  LARGE_PHONE: 600,
  SMALL_TABLET: 768,
  TABLET: 960,
};

// Base dimensions for different device types
export const BASE_DIMENSIONS = {
  [DeviceType.SMALL_PHONE]: { width: 320, height: 568 }, // iPhone SE size
  [DeviceType.PHONE]: { width: 375, height: 667 }, // iPhone 8 size
  [DeviceType.LARGE_PHONE]: { width: 414, height: 736 }, // iPhone 8 Plus size
  [DeviceType.SMALL_TABLET]: { width: 768, height: 1024 }, // iPad size
  [DeviceType.TABLET]: { width: 834, height: 1112 }, // iPad Pro 10.5 size
  [DeviceType.LARGE_TABLET]: { width: 1024, height: 1366 }, // iPad Pro 12.9 size
};

// Font scale factors for different text sizes
export const FONT_SCALE = {
  SMALL: 0.8,
  MEDIUM: 1,
  LARGE: 1.15,
  EXTRA_LARGE: 1.3,
  HUGE: 1.5,
};

/**
 * Determines the device type based on screen width
 * @returns DeviceType enum value
 */
export const getDeviceType = (): DeviceType => {
  const { width, height } = Dimensions.get('window');
  const screenWidth = Math.min(width, height); // Use the smaller dimension for orientation-independent check

  // For iOS, we can use the idiom for basic tablet detection
  const isIpadDevice = Platform.OS === 'ios' && Platform.isPad;

  if (screenWidth < BREAKPOINTS.SMALL_PHONE) {
    return DeviceType.SMALL_PHONE;
  } else if (screenWidth < BREAKPOINTS.PHONE) {
    return DeviceType.PHONE;
  } else if (screenWidth < BREAKPOINTS.LARGE_PHONE) {
    return DeviceType.LARGE_PHONE;
  } else if (screenWidth < BREAKPOINTS.SMALL_TABLET || isIpadDevice) {
    return DeviceType.SMALL_TABLET;
  } else if (screenWidth < BREAKPOINTS.TABLET) {
    return DeviceType.TABLET;
  } else {
    return DeviceType.LARGE_TABLET;
  }
};

/**
 * Checks if the device is a tablet (any tablet size)
 * @returns boolean indicating if the device is a tablet
 */
export const isTablet = (): boolean => {
  const deviceType = getDeviceType();
  return deviceType >= DeviceType.SMALL_TABLET;
};

/**
 * Gets the current screen orientation
 * @returns Orientation enum value
 */
export const getOrientation = (): Orientation => {
  const { width, height } = Dimensions.get('window');
  return width > height ? Orientation.LANDSCAPE : Orientation.PORTRAIT;
};

/**
 * Gets the scale factor for the current device relative to the base dimensions
 * @param baseDeviceType Optional device type to use as the base for scaling
 * @returns Scale factor for width and height
 */
export const getScaleFactor = (
  baseDeviceType: DeviceType = DeviceType.PHONE
): { widthScale: number; heightScale: number } => {
  const { width, height } = Dimensions.get('window');
  const baseDimensions = BASE_DIMENSIONS[baseDeviceType];

  return {
    widthScale: width / baseDimensions.width,
    heightScale: height / baseDimensions.height,
  };
};

/**
 * Hook to get the system font scale setting
 * @returns System font scale factor
 */
export const useSystemFontScale = (): number => {
  const [fontScale, setFontScale] = React.useState<number>(1);

  React.useEffect(() => {
    // Get initial font scale
    const initialFontScale = Platform.OS === 'ios' ? 1 : PixelRatio.getFontScale();
    setFontScale(initialFontScale);

    // Listen for font scale changes on Android
    if (Platform.OS === 'android') {
      const subscription = AccessibilityInfo.addEventListener('boldTextChanged', () => {
        setFontScale(PixelRatio.getFontScale());
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return fontScale;
};

/**
 * Calculates responsive font size based on screen width and system font scale
 * @param size Base font size
 * @param respectSystemSettings Whether to respect system font size settings
 * @returns Adjusted font size
 */
export const responsiveFontSize = (size: number, respectSystemSettings: boolean = true): number => {
  const deviceType = getDeviceType();
  const { widthScale } = getScaleFactor();

  // Base scaling based on device type
  let scaledSize = size;

  if (deviceType <= DeviceType.SMALL_PHONE) {
    scaledSize = size * 0.85;
  } else if (deviceType === DeviceType.PHONE) {
    scaledSize = size;
  } else if (deviceType === DeviceType.LARGE_PHONE) {
    scaledSize = size * 1.1;
  } else if (deviceType === DeviceType.SMALL_TABLET) {
    scaledSize = size * 1.15;
  } else if (deviceType === DeviceType.TABLET) {
    scaledSize = size * 1.2;
  } else {
    scaledSize = size * 1.25;
  }

  // Apply system font scale if enabled
  if (respectSystemSettings) {
    const fontScale = Platform.OS === 'ios' ? 1 : PixelRatio.getFontScale();
    scaledSize *= fontScale;
  }

  return scaledSize;
};

/**
 * Calculates responsive spacing based on screen width
 * @param size Base spacing size
 * @returns Adjusted spacing size
 */
export const responsiveSpacing = (size: number): number => {
  const deviceType = getDeviceType();
  const { widthScale } = getScaleFactor();

  // Scale spacing based on device type
  if (deviceType <= DeviceType.SMALL_PHONE) {
    return size * 0.85;
  } else if (deviceType === DeviceType.PHONE) {
    return size;
  } else if (deviceType === DeviceType.LARGE_PHONE) {
    return size * 1.1;
  } else if (deviceType === DeviceType.SMALL_TABLET) {
    return size * 1.2;
  } else if (deviceType === DeviceType.TABLET) {
    return size * 1.3;
  } else {
    return size * 1.4;
  }
};

/**
 * Hook to get dimensions and recalculate on dimension changes
 * @returns Current window dimensions and device information
 */
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));
  const [deviceInfo, setDeviceInfo] = React.useState({
    isTablet: isTablet(),
    deviceType: getDeviceType(),
    orientation: getOrientation(),
    fontScale: Platform.OS === 'ios' ? 1 : PixelRatio.getFontScale(),
  });

  React.useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
      // Update device info in the state update function to avoid unnecessary re-renders
      setDeviceInfo({
        isTablet: isTablet(),
        deviceType: getDeviceType(),
        orientation: getOrientation(),
        fontScale: Platform.OS === 'ios' ? 1 : PixelRatio.getFontScale(),
      });
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    // Listen for font scale changes on Android
    let fontScaleSubscription: any;
    if (Platform.OS === 'android') {
      fontScaleSubscription = AccessibilityInfo.addEventListener('boldTextChanged', () => {
        setDeviceInfo(prev => ({
          ...prev,
          fontScale: PixelRatio.getFontScale(),
        }));
      });
    }

    return () => {
      subscription.remove();
      if (fontScaleSubscription) {
        fontScaleSubscription.remove();
      }
    };
  }, []);

  return {
    ...dimensions,
    ...deviceInfo,
  };
};

// Grid system for responsive layouts with more columns for larger screens
export const grid = {
  getColumns: () => {
    const deviceType = getDeviceType();

    if (deviceType <= DeviceType.SMALL_PHONE) {
      return 4;
    } else if (deviceType <= DeviceType.LARGE_PHONE) {
      return 6;
    } else if (deviceType === DeviceType.SMALL_TABLET) {
      return 8;
    } else if (deviceType === DeviceType.TABLET) {
      return 10;
    } else {
      return 12;
    }
  },

  getColumnWidth: (columns = 1, gutter = 16) => {
    const totalColumns = grid.getColumns();
    const { width } = Dimensions.get('window');
    const totalGutterSpace = gutter * (totalColumns - 1);
    const availableSpace = width - totalGutterSpace;
    const columnWidth = availableSpace / totalColumns;

    return columnWidth * columns + (columns - 1) * gutter;
  },
};

// Helper to create responsive styles based on device type
export function createResponsiveStyles<T>(
  baseStyles: T,
  smallPhoneStyles: Partial<T> = {},
  phoneStyles: Partial<T> = {},
  largePhoneStyles: Partial<T> = {},
  smallTabletStyles: Partial<T> = {},
  tabletStyles: Partial<T> = {},
  largeTabletStyles: Partial<T> = {}
): T {
  const deviceType = getDeviceType();

  let styles = { ...baseStyles };

  switch (deviceType) {
    case DeviceType.SMALL_PHONE:
      styles = { ...styles, ...smallPhoneStyles };
      break;
    case DeviceType.PHONE:
      styles = { ...styles, ...phoneStyles };
      break;
    case DeviceType.LARGE_PHONE:
      styles = { ...styles, ...largePhoneStyles };
      break;
    case DeviceType.SMALL_TABLET:
      styles = { ...styles, ...smallTabletStyles };
      break;
    case DeviceType.TABLET:
      styles = { ...styles, ...tabletStyles };
      break;
    case DeviceType.LARGE_TABLET:
      styles = { ...styles, ...largeTabletStyles };
      break;
  }

  return styles;
}

// Helper to create orientation-specific styles
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

// Helper to create fully responsive styles that adapt to both device type and orientation
export function createFullyResponsiveStyles<T>(
  baseStyles: T,
  deviceTypeStyles: {
    smallPhone?: Partial<T>;
    phone?: Partial<T>;
    largePhone?: Partial<T>;
    smallTablet?: Partial<T>;
    tablet?: Partial<T>;
    largeTablet?: Partial<T>;
  } = {},
  orientationStyles: {
    landscape?: Partial<T>;
    portrait?: Partial<T>;
  } = {}
): T {
  const deviceType = getDeviceType();
  const orientation = getOrientation();

  let styles = { ...baseStyles };

  // Apply device-specific styles
  switch (deviceType) {
    case DeviceType.SMALL_PHONE:
      if (deviceTypeStyles.smallPhone) {
        styles = { ...styles, ...deviceTypeStyles.smallPhone };
      }
      break;
    case DeviceType.PHONE:
      if (deviceTypeStyles.phone) {
        styles = { ...styles, ...deviceTypeStyles.phone };
      }
      break;
    case DeviceType.LARGE_PHONE:
      if (deviceTypeStyles.largePhone) {
        styles = { ...styles, ...deviceTypeStyles.largePhone };
      }
      break;
    case DeviceType.SMALL_TABLET:
      if (deviceTypeStyles.smallTablet) {
        styles = { ...styles, ...deviceTypeStyles.smallTablet };
      }
      break;
    case DeviceType.TABLET:
      if (deviceTypeStyles.tablet) {
        styles = { ...styles, ...deviceTypeStyles.tablet };
      }
      break;
    case DeviceType.LARGE_TABLET:
      if (deviceTypeStyles.largeTablet) {
        styles = { ...styles, ...deviceTypeStyles.largeTablet };
      }
      break;
  }

  // Apply orientation-specific styles
  if (orientation === Orientation.LANDSCAPE && orientationStyles.landscape) {
    styles = { ...styles, ...orientationStyles.landscape };
  } else if (orientation === Orientation.PORTRAIT && orientationStyles.portrait) {
    styles = { ...styles, ...orientationStyles.portrait };
  }

  return styles;
}

// Import PixelRatio for font scaling
import { PixelRatio } from 'react-native';
