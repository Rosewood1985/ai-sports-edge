import { DeviceType, Orientation, BREAKPOINTS, BASE_DIMENSIONS } from './responsiveUtils';

/**
 * Utility for testing responsive layouts across different device sizes
 */

// Define standard device presets for testing
export const DEVICE_PRESETS = {
  // Phones
  IPHONE_SE: {
    name: 'iPhone SE',
    width: 320,
    height: 568,
    deviceType: DeviceType.SMALL_PHONE,
    pixelRatio: 2,
  },
  IPHONE_8: {
    name: 'iPhone 8',
    width: 375,
    height: 667,
    deviceType: DeviceType.PHONE,
    pixelRatio: 2,
  },
  IPHONE_8_PLUS: {
    name: 'iPhone 8 Plus',
    width: 414,
    height: 736,
    deviceType: DeviceType.LARGE_PHONE,
    pixelRatio: 3,
  },
  IPHONE_11_PRO: {
    name: 'iPhone 11 Pro',
    width: 375,
    height: 812,
    deviceType: DeviceType.PHONE,
    pixelRatio: 3,
  },
  IPHONE_11_PRO_MAX: {
    name: 'iPhone 11 Pro Max',
    width: 414,
    height: 896,
    deviceType: DeviceType.LARGE_PHONE,
    pixelRatio: 3,
  },
  PIXEL_5: {
    name: 'Pixel 5',
    width: 393,
    height: 851,
    deviceType: DeviceType.PHONE,
    pixelRatio: 2.75,
  },
  SAMSUNG_GALAXY_S20: {
    name: 'Samsung Galaxy S20',
    width: 360,
    height: 800,
    deviceType: DeviceType.PHONE,
    pixelRatio: 3,
  },

  // Tablets
  IPAD_MINI: {
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    deviceType: DeviceType.SMALL_TABLET,
    pixelRatio: 2,
  },
  IPAD: {
    name: 'iPad',
    width: 810,
    height: 1080,
    deviceType: DeviceType.SMALL_TABLET,
    pixelRatio: 2,
  },
  IPAD_PRO_10_5: {
    name: 'iPad Pro 10.5"',
    width: 834,
    height: 1112,
    deviceType: DeviceType.TABLET,
    pixelRatio: 2,
  },
  IPAD_PRO_11: {
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    deviceType: DeviceType.TABLET,
    pixelRatio: 2,
  },
  IPAD_PRO_12_9: {
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    deviceType: DeviceType.LARGE_TABLET,
    pixelRatio: 2,
  },
  SAMSUNG_GALAXY_TAB_S7: {
    name: 'Samsung Galaxy Tab S7',
    width: 800,
    height: 1280,
    deviceType: DeviceType.SMALL_TABLET,
    pixelRatio: 2,
  },
};

// Font scale presets for testing
export const FONT_SCALE_PRESETS = {
  SMALL: 0.85,
  NORMAL: 1.0,
  LARGE: 1.15,
  EXTRA_LARGE: 1.3,
  HUGE: 1.5,
};

/**
 * Interface for mocking responsive dimensions
 */
export interface MockResponsiveDimensions {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  isTablet: boolean;
  fontScale: number;
}

/**
 * Creates mock responsive dimensions for testing
 * @param devicePreset Device preset to use
 * @param orientation Orientation to use
 * @param fontScale Font scale to use
 * @returns Mock responsive dimensions
 */
export function createMockResponsiveDimensions(
  devicePreset = DEVICE_PRESETS.IPHONE_11_PRO,
  orientation = Orientation.PORTRAIT,
  fontScale = FONT_SCALE_PRESETS.NORMAL
): MockResponsiveDimensions {
  // Get width and height based on orientation
  let width = devicePreset.width;
  let height = devicePreset.height;

  // Swap width and height for landscape orientation
  if (orientation === Orientation.LANDSCAPE) {
    [width, height] = [height, width];
  }

  return {
    width,
    height,
    deviceType: devicePreset.deviceType,
    orientation,
    isTablet: devicePreset.deviceType >= DeviceType.SMALL_TABLET,
    fontScale,
  };
}

/**
 * Creates a set of mock responsive dimensions for testing across multiple devices
 * @param orientations Orientations to include
 * @param fontScales Font scales to include
 * @returns Array of mock responsive dimensions
 */
export function createTestMatrix(
  devicePresets = Object.values(DEVICE_PRESETS),
  orientations = [Orientation.PORTRAIT, Orientation.LANDSCAPE],
  fontScales = [FONT_SCALE_PRESETS.NORMAL]
): MockResponsiveDimensions[] {
  const matrix: MockResponsiveDimensions[] = [];

  // Create a test case for each combination
  devicePresets.forEach(devicePreset => {
    orientations.forEach(orientation => {
      fontScales.forEach(fontScale => {
        matrix.push(createMockResponsiveDimensions(devicePreset, orientation, fontScale));
      });
    });
  });

  return matrix;
}

/**
 * Creates a subset of test cases for common device configurations
 * @returns Array of mock responsive dimensions for common device configurations
 */
export function createCommonTestCases(): MockResponsiveDimensions[] {
  return [
    // Small phone in portrait
    createMockResponsiveDimensions(DEVICE_PRESETS.IPHONE_SE, Orientation.PORTRAIT),

    // Standard phone in portrait
    createMockResponsiveDimensions(DEVICE_PRESETS.IPHONE_11_PRO, Orientation.PORTRAIT),

    // Large phone in portrait
    createMockResponsiveDimensions(DEVICE_PRESETS.IPHONE_11_PRO_MAX, Orientation.PORTRAIT),

    // Large phone in landscape
    createMockResponsiveDimensions(DEVICE_PRESETS.IPHONE_11_PRO_MAX, Orientation.LANDSCAPE),

    // Small tablet in portrait
    createMockResponsiveDimensions(DEVICE_PRESETS.IPAD, Orientation.PORTRAIT),

    // Small tablet in landscape
    createMockResponsiveDimensions(DEVICE_PRESETS.IPAD, Orientation.LANDSCAPE),

    // Large tablet in landscape
    createMockResponsiveDimensions(DEVICE_PRESETS.IPAD_PRO_12_9, Orientation.LANDSCAPE),

    // Standard phone with large font scale
    createMockResponsiveDimensions(
      DEVICE_PRESETS.IPHONE_11_PRO,
      Orientation.PORTRAIT,
      FONT_SCALE_PRESETS.LARGE
    ),
  ];
}

/**
 * Creates a subset of test cases for accessibility testing
 * @returns Array of mock responsive dimensions for accessibility testing
 */
export function createAccessibilityTestCases(): MockResponsiveDimensions[] {
  return [
    // Standard phone with normal font scale
    createMockResponsiveDimensions(
      DEVICE_PRESETS.IPHONE_11_PRO,
      Orientation.PORTRAIT,
      FONT_SCALE_PRESETS.NORMAL
    ),

    // Standard phone with large font scale
    createMockResponsiveDimensions(
      DEVICE_PRESETS.IPHONE_11_PRO,
      Orientation.PORTRAIT,
      FONT_SCALE_PRESETS.LARGE
    ),

    // Standard phone with extra large font scale
    createMockResponsiveDimensions(
      DEVICE_PRESETS.IPHONE_11_PRO,
      Orientation.PORTRAIT,
      FONT_SCALE_PRESETS.EXTRA_LARGE
    ),

    // Standard phone with huge font scale
    createMockResponsiveDimensions(
      DEVICE_PRESETS.IPHONE_11_PRO,
      Orientation.PORTRAIT,
      FONT_SCALE_PRESETS.HUGE
    ),

    // Tablet with normal font scale
    createMockResponsiveDimensions(
      DEVICE_PRESETS.IPAD,
      Orientation.PORTRAIT,
      FONT_SCALE_PRESETS.NORMAL
    ),

    // Tablet with large font scale
    createMockResponsiveDimensions(
      DEVICE_PRESETS.IPAD,
      Orientation.PORTRAIT,
      FONT_SCALE_PRESETS.LARGE
    ),
  ];
}
