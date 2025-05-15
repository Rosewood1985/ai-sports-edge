# Responsive Image Loading and Animation Optimization

This document provides an overview of the responsive image loading and animation optimization features implemented in the AI Sports Edge app.

## Table of Contents

1. [Responsive Image Loading](#responsive-image-loading)
   - [Overview](#overview)
   - [Implementation](#implementation)
   - [Usage](#usage)
   - [Best Practices](#best-practices)

2. [Animation Optimization](#animation-optimization)
   - [Overview](#overview-1)
   - [Implementation](#implementation-1)
   - [Usage](#usage-1)
   - [Best Practices](#best-practices-1)

3. [Example Component](#example-component)

4. [Performance Considerations](#performance-considerations)

5. [Testing](#testing)

## Responsive Image Loading

### Overview

The responsive image loading system automatically selects the appropriate image resolution based on the device's screen size and pixel density. This ensures that:

- Low-end devices load smaller, more efficient images
- High-end devices load high-resolution images for better visual quality
- Tablets and larger screens load appropriately sized images

### Implementation

The implementation consists of two main components:

1. **ResponsiveImageLoader Utility** (`utils/responsiveImageLoader.ts`)
   - Detects device capabilities (screen size, pixel ratio)
   - Determines appropriate image resolution
   - Provides helper functions for responsive dimensions

2. **ResponsiveImage Component** (`components/ResponsiveImage.tsx`)
   - React component that uses the utility
   - Handles loading states and errors
   - Automatically scales dimensions based on screen size

### Usage

To use the ResponsiveImage component:

```tsx
import ResponsiveImage from '../components/ResponsiveImage';

// Basic usage
<ResponsiveImage
  basePath="assets/images/card-background"
  width={300}
  height={200}
/>

// With additional props
<ResponsiveImage
  basePath="assets/images/profile"
  extension="jpg"
  width={100}
  height={100}
  style={styles.profileImage}
  resizeMode="cover"
/>
```

The system will look for images with the following naming convention:
- `card-background.png` (base image)
- `card-background@2x.png` (2x resolution)
- `card-background@3x.png` (3x resolution)
- `card-background_tablet.png` (tablet-specific)
- `card-background_tablet@2x.png` (tablet-specific, 2x resolution)

### Best Practices

1. **Provide multiple resolutions** for important images:
   - Base resolution (1x)
   - Medium resolution (2x)
   - High resolution (3x)

2. **Consider screen sizes** for layout-critical images:
   - `_small` suffix for small phones
   - `_medium` suffix for standard phones
   - `_large` suffix for large phones
   - `_tablet` suffix for tablets

3. **Use appropriate image formats**:
   - PNG for images with transparency
   - JPEG for photos and complex images
   - WebP for better compression (with fallbacks)

4. **Optimize all image assets** before including them in the app

## Animation Optimization

### Overview

The animation optimization system automatically adjusts animation parameters based on the device's capabilities. This ensures that:

- Low-end devices use simpler, more efficient animations
- High-end devices use smoother, more complex animations
- Battery life is preserved on all devices

### Implementation

The implementation consists of two main components:

1. **AnimationOptimizer Utility** (`utils/animationOptimizer.ts`)
   - Detects device performance capabilities
   - Provides optimized animation parameters (duration, easing)
   - Determines if complex animations should be enabled

2. **OptimizedAnimation Hooks** (`hooks/useOptimizedAnimation.ts`)
   - React hooks for common animation types (fade, slide, scale)
   - Automatically applies optimized parameters
   - Provides fallbacks for low-end devices

### Usage

To use the optimized animation hooks:

```tsx
import {
  useOptimizedFade,
  useOptimizedSlide,
  useOptimizedScale,
} from '../hooks/useOptimizedAnimation';

// Inside your component
const { fadeAnim, startFade } = useOptimizedFade();
const { slideAnim, startSlide } = useOptimizedSlide({ initialValue: -100 });

// Start animations
useEffect(() => {
  startFade();
  startSlide();
}, []);

// Use in your JSX
<Animated.View
  style={{
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }}
>
  {/* Your content */}
</Animated.View>
```

For more complex animations, use the stagger and sequence hooks:

```tsx
const { animatedValues, startStagger } = useOptimizedStagger(
  3, // Number of items
  () => new Animated.Value(0),
  300, // Duration
  100 // Stagger delay
);

// Use in your JSX
{items.map((item, index) => (
  <Animated.View
    key={item.id}
    style={{ opacity: animatedValues[index] }}
  >
    {/* Item content */}
  </Animated.View>
))}
```

### Best Practices

1. **Always check device capabilities** before using complex animations
   ```tsx
   import { shouldEnableComplexAnimations } from '../utils/animationOptimizer';
   
   // Conditionally render complex animations
   {shouldEnableComplexAnimations() && (
     <ComplexAnimationComponent />
   )}
   ```

2. **Provide simpler alternatives** for low-end devices
   ```tsx
   const animation = shouldEnableComplexAnimations()
     ? complexAnimation
     : simpleAnimation;
   ```

3. **Optimize animation performance**:
   - Use `useNativeDriver: true` whenever possible
   - Avoid animating layout properties (width, height, etc.)
   - Prefer transform animations over other properties

4. **Test on actual devices** across the performance spectrum

## Example Component

The `OptimizedCardView` component (`components/OptimizedCardView.tsx`) demonstrates both responsive image loading and animation optimization:

```tsx
import OptimizedCardView from '../components/OptimizedCardView';

// Usage
<OptimizedCardView
  title="Featured Event"
  description="Check out this upcoming sports event with AI predictions"
  imagePath="assets/images/event-card"
  onPress={() => handlePress()}
/>
```

This component:
- Loads the appropriate image resolution
- Uses optimized fade, scale, and slide animations
- Applies staggered text animations
- Disables complex animations on low-end devices

## Performance Considerations

1. **Memory Usage**
   - Higher resolution images consume more memory
   - The system balances quality and memory usage based on device capabilities

2. **CPU/GPU Usage**
   - Complex animations can tax the CPU/GPU
   - The system reduces animation complexity on lower-end devices

3. **Battery Impact**
   - Animations and image loading affect battery life
   - Optimizations help reduce battery drain on all devices

## Testing

To ensure the responsive and optimized UI works correctly across devices:

1. **Test on multiple physical devices** with varying:
   - Screen sizes
   - Resolutions
   - Performance capabilities

2. **Use device emulators/simulators** to test edge cases

3. **Monitor performance metrics**:
   - Frame rate during animations
   - Memory usage when loading images
   - Battery impact during extended use

4. **Implement A/B testing** to measure user engagement with different animation settings