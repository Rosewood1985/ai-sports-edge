import React from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

// Device types
export enum DeviceType {
  PHONE,
  TABLET,
}

// Orientation types
export enum Orientation {
  PORTRAIT,
  LANDSCAPE,
}

// Screen size breakpoints
const TABLET_BREAKPOINT = 768; // Common tablet breakpoint

/**
 * Determines if the device is a tablet based on screen width
 * @returns boolean indicating if the device is a tablet
 */
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');
  const screenWidth = Math.min(width, height); // Use the smaller dimension for orientation-independent check
  
  // For iOS, we can use the idiom
  if (Platform.OS === 'ios' && Platform.isPad) {
    return true;
  }
  
  // For Android and other platforms, use screen width
  return screenWidth >= TABLET_BREAKPOINT;
};

/**
 * Gets the current device type
 * @returns DeviceType enum value
 */
export const getDeviceType = (): DeviceType => {
  return isTablet() ? DeviceType.TABLET : DeviceType.PHONE;
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
 * Calculates responsive font size based on screen width
 * @param size Base font size for mobile
 * @returns Adjusted font size
 */
export const responsiveFontSize = (size: number): number => {
  const deviceType = getDeviceType();
  
  if (deviceType === DeviceType.TABLET) {
    // Increase font size for tablets, but not linearly
    return size * 1.15;
  }
  
  return size;
};

/**
 * Calculates responsive spacing based on screen width
 * @param size Base spacing size for mobile
 * @returns Adjusted spacing size
 */
export const responsiveSpacing = (size: number): number => {
  const deviceType = getDeviceType();
  
  if (deviceType === DeviceType.TABLET) {
    // Increase spacing for tablets
    return size * 1.25;
  }
  
  return size;
};

/**
 * Hook to get dimensions and recalculate on dimension changes
 * @returns Current window dimensions and device information
 */
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));
  
  React.useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    
    return () => subscription.remove();
  }, []);
  
  return {
    ...dimensions,
    isTablet: isTablet(),
    deviceType: getDeviceType(),
    orientation: getOrientation(),
  };
};

// Grid system for responsive layouts
export const grid = {
  phoneColumns: 4,
  tabletColumns: 8,
  getColumns: () => isTablet() ? grid.tabletColumns : grid.phoneColumns,
  getColumnWidth: (columns = 1, gutter = 16) => {
    const totalColumns = grid.getColumns();
    const { width } = Dimensions.get('window');
    const totalGutterSpace = gutter * (totalColumns - 1);
    const availableSpace = width - totalGutterSpace;
    const columnWidth = availableSpace / totalColumns;
    
    return columnWidth * columns + (columns - 1) * gutter;
  }
};