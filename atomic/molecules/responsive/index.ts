// Export the responsive HOC and utilities
export { default as withResponsiveStyles } from './withResponsiveStyles';
export {
  createResponsiveComponent,
  createDynamicResponsiveComponent,
  createAccessibleComponent,
} from './withResponsiveStyles';
export type { ResponsiveStyleFunction } from './withResponsiveStyles';

// Re-export responsive utilities from utils for convenience
export {
  DeviceType,
  Orientation,
  BREAKPOINTS,
  BASE_DIMENSIONS,
  FONT_SCALE,
  getDeviceType,
  isTablet,
  getOrientation,
  getScaleFactor,
  useSystemFontScale,
  responsiveFontSize,
  responsiveSpacing,
  useResponsiveDimensions,
  grid,
  createResponsiveStyles,
  createOrientationStyles,
  createFullyResponsiveStyles,
} from '../../../utils/responsiveUtils';
