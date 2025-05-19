# Responsive Design Implementation Guide

This guide outlines the responsive design system implemented in AI Sports Edge, providing developers with the tools and patterns to create consistent, adaptive UI components that work across different device sizes and orientations.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Responsive Utilities](#responsive-utilities)
- [Responsive Components](#responsive-components)
- [Higher-Order Components](#higher-order-components)
- [Best Practices](#best-practices)
- [Testing](#testing)

## Overview

The responsive design system in AI Sports Edge is built to address several key requirements:

1. **Device Adaptability**: Components adapt to different device types and screen sizes
2. **Orientation Support**: Layouts adjust based on portrait or landscape orientation
3. **Accessibility**: UI respects system font size settings and accessibility preferences
4. **Consistency**: Standardized approach to responsive styling across the application
5. **Testability**: Tools for testing responsive layouts across different device configurations

## Core Concepts

### Device Types

The system recognizes multiple device types with different breakpoints:

```typescript
export enum DeviceType {
  SMALL_PHONE, // Small phones (< 360dp width)
  PHONE, // Standard phones (360dp - 480dp width)
  LARGE_PHONE, // Large phones (480dp - 600dp width)
  SMALL_TABLET, // Small tablets (600dp - 768dp width)
  TABLET, // Standard tablets (768dp - 960dp width)
  LARGE_TABLET, // Large tablets (> 960dp width)
}
```

### Breakpoints

Breakpoints define the width thresholds for different device types:

```typescript
export const BREAKPOINTS = {
  SMALL_PHONE: 360,
  PHONE: 480,
  LARGE_PHONE: 600,
  SMALL_TABLET: 768,
  TABLET: 960,
};
```

### Base Dimensions

Base dimensions provide reference sizes for scaling:

```typescript
export const BASE_DIMENSIONS = {
  [DeviceType.SMALL_PHONE]: { width: 320, height: 568 }, // iPhone SE size
  [DeviceType.PHONE]: { width: 375, height: 667 }, // iPhone 8 size
  [DeviceType.LARGE_PHONE]: { width: 414, height: 736 }, // iPhone 8 Plus size
  [DeviceType.SMALL_TABLET]: { width: 768, height: 1024 }, // iPad size
  [DeviceType.TABLET]: { width: 834, height: 1112 }, // iPad Pro 10.5 size
  [DeviceType.LARGE_TABLET]: { width: 1024, height: 1366 }, // iPad Pro 12.9 size
};
```

### Orientation

The system detects and adapts to device orientation:

```typescript
export enum Orientation {
  PORTRAIT,
  LANDSCAPE,
}
```

## Responsive Utilities

### Device Detection

```typescript
// Get the current device type
const deviceType = getDeviceType();

// Check if the device is a tablet
const isTabletDevice = isTablet();

// Get the current orientation
const orientation = getOrientation();
```

### Responsive Dimensions

```typescript
// Get responsive dimensions that update on device changes
const dimensions = useResponsiveDimensions();

// Access properties
const { width, height, deviceType, orientation, isTablet, fontScale } = dimensions;
```

### Responsive Sizing

```typescript
// Calculate responsive font size
const fontSize = responsiveFontSize(16, true); // Base size 16, respect system settings

// Calculate responsive spacing
const padding = responsiveSpacing(16); // Base spacing 16
```

### System Font Scale

```typescript
// Get the system font scale factor
const fontScale = useSystemFontScale();
```

### Grid System

```typescript
// Get the number of columns for the current device
const columns = grid.getColumns();

// Calculate column width for a specific number of columns
const twoColumnWidth = grid.getColumnWidth(2, 16); // 2 columns with 16px gutter
```

## Responsive Components

### ResponsiveText

`ResponsiveText` automatically scales text based on screen size and respects system font size settings:

```jsx
// Basic usage
<ResponsiveText>This text will scale based on screen size</ResponsiveText>

// With custom min/max sizes
<ResponsiveText minFontSize={12} maxFontSize={24}>
  This text has custom size limits
</ResponsiveText>

// With system font size settings disabled
<ResponsiveText respectSystemSettings={false}>
  This text ignores system font size settings
</ResponsiveText>
```

## Higher-Order Components

### withResponsiveStyles

The `withResponsiveStyles` HOC adds responsive styling to any component:

```jsx
// Create a responsive component
const ResponsiveView = withResponsiveStyles(View, ({ deviceType, orientation }) => {
  // Return styles based on device type and orientation
  if (deviceType <= DeviceType.PHONE) {
    return { padding: 10 };
  } else {
    return { padding: 20 };
  }
});

// Use the responsive component
<ResponsiveView>
  <Text>This view has responsive padding</Text>
</ResponsiveView>;
```

### createResponsiveComponent

Create a responsive component with predefined styles for different device types and orientations:

```jsx
// Create a responsive card component
const ResponsiveCard = createResponsiveComponent(
  View,
  // Base styles for all devices
  {
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  // Device-specific styles
  {
    smallPhone: { padding: 8 },
    phone: { padding: 12 },
    tablet: { padding: 24 },
  },
  // Orientation-specific styles
  {
    landscape: { marginHorizontal: 16 },
    portrait: { marginVertical: 16 },
  }
);

// Use the responsive card component
<ResponsiveCard>
  <Text>This card adapts to different devices and orientations</Text>
</ResponsiveCard>;
```

### createAccessibleComponent

Create a component that respects system font size settings:

```jsx
// Create an accessible button component
const AccessibleButton = createAccessibleComponent(
  TouchableOpacity,
  // Base styles
  {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'blue',
  },
  // Font scale-specific styles
  {
    large: { padding: 20 },
    extraLarge: { padding: 24 },
    huge: { padding: 28 },
  }
);

// Use the accessible button component
<AccessibleButton>
  <Text>This button adapts to system font size settings</Text>
</AccessibleButton>;
```

## Best Practices

### 1. Use Responsive Components

Always use responsive components like `ResponsiveText` instead of basic React Native components for text that needs to scale with screen size.

### 2. Apply Responsive Styling with HOCs

Use the `withResponsiveStyles` HOC or one of its variants to add responsive styling to components:

```jsx
// Bad: Hardcoded styles
const Card = () => (
  <View style={{ padding: 16 }}>
    <Text>Card content</Text>
  </View>
);

// Good: Responsive styles
const Card = withResponsiveStyles(View, ({ deviceType }) => ({
  padding: deviceType >= DeviceType.TABLET ? 24 : 16,
}));
```

### 3. Respect System Font Size Settings

Always respect system font size settings for accessibility:

```jsx
// Bad: Ignoring system font size settings
<Text style={{ fontSize: 16 }}>Fixed size text</Text>

// Good: Respecting system font size settings
<ResponsiveText>Responsive text</ResponsiveText>
```

### 4. Use Relative Units

Use relative units for spacing and sizing instead of fixed values:

```jsx
// Bad: Fixed values
<View style={{ padding: 16, width: 200 }}>
  <Text>Content</Text>
</View>

// Good: Relative values
<View style={{ padding: responsiveSpacing(16), width: grid.getColumnWidth(2) }}>
  <Text>Content</Text>
</View>
```

### 5. Test Across Different Devices

Use the responsive testing utilities to test your components across different device sizes and orientations:

```jsx
// Create test cases for common device configurations
const testCases = createCommonTestCases();

// Test your component with each test case
testCases.forEach(testCase => {
  // Render your component with the test case
  // ...
});
```

## Testing

The responsive design system includes utilities for testing components across different device sizes and orientations:

```jsx
import {
  createTestMatrix,
  DEVICE_PRESETS,
  Orientation,
  FONT_SCALE_PRESETS,
} from '../utils/responsiveTestUtils';

// Create a test matrix for specific devices, orientations, and font scales
const testMatrix = createTestMatrix(
  [DEVICE_PRESETS.IPHONE_SE, DEVICE_PRESETS.IPAD],
  [Orientation.PORTRAIT, Orientation.LANDSCAPE],
  [FONT_SCALE_PRESETS.NORMAL, FONT_SCALE_PRESETS.LARGE]
);

// Create common test cases
const commonTestCases = createCommonTestCases();

// Create accessibility test cases
const accessibilityTestCases = createAccessibilityTestCases();
```

For each test case, you can render your component with the mock dimensions and verify that it renders correctly.

## Related Resources

- [Component Guidelines](./component-guidelines.md)
- [Accessibility Implementation](./accessibility-implementation.md)
- [Component API Reference](../api-reference/component-api.md)
