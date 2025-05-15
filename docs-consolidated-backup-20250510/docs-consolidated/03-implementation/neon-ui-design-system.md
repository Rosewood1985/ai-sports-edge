# Neon UI Design System

This document outlines the design system for the AI Sports Edge app's neon UI theme.

## Overview

The Neon UI Design System creates a futuristic, high-tech aesthetic that aligns with the app's advanced AI capabilities. The design features dark backgrounds with vibrant neon accents, creating a visually striking interface that appeals to sports betting enthusiasts and tech-savvy users.

## Core Components

### NeonText

A text component with customizable neon glow effects.

**Props:**
- `color`: Text color (default: theme color)
- `glow`: Whether to apply glow effect (default: true)
- `intensity`: Glow intensity - 'low', 'medium', 'high' (default: 'medium')
- `type`: Text type - 'heading', 'subheading', 'body', 'caption' (default: 'body')

**Usage:**
```jsx
<NeonText type="heading" glow={true} color={colors.neon.blue}>
  Live Betting Odds
</NeonText>
```

### NeonButton

A button component with gradient backgrounds and neon glow effects.

**Props:**
- `title`: Button text
- `onPress`: Function to call when button is pressed
- `type`: Button type - 'primary', 'secondary', 'outline' (default: 'primary')
- `size`: Button size - 'small', 'medium', 'large' (default: 'medium')
- `disabled`: Whether button is disabled (default: false)
- `loading`: Whether to show loading indicator (default: false)
- `icon`: Optional icon component
- `iconPosition`: Icon position - 'left', 'right' (default: 'left')
- `gradientColors`: Optional custom gradient colors

**Usage:**
```jsx
<NeonButton
  title="Upgrade"
  onPress={handleUpgrade}
  type="primary"
  size="medium"
  icon={<Ionicons name="flash" size={16} color="#fff" />}
/>
```

### NeonCard

A card component with customizable borders and glow effects.

**Props:**
- `borderColor`: Border color (default: theme color)
- `glowColor`: Glow color (default: theme color)
- `glowIntensity`: Glow intensity - 'none', 'low', 'medium', 'high' (default: 'medium')
- `gradient`: Whether to use gradient background (default: false)
- `gradientColors`: Optional custom gradient colors
- `onPress`: Optional function to call when card is pressed
- `animated`: Whether to animate on press (default: true)

**Usage:**
```jsx
<NeonCard
  borderColor={colors.neon.blue}
  glowColor={colors.neon.blue}
  glowIntensity="medium"
  gradient={true}
  gradientColors={[colors.background.secondary, colors.background.tertiary]}
>
  <NeonText>Card Content</NeonText>
</NeonCard>
```

### NeonContainer

A container component for creating themed background containers.

**Props:**
- `gradient`: Whether to use gradient background (default: true)
- `gradientColors`: Optional custom gradient colors
- `useSafeArea`: Whether to use SafeAreaView (default: true)

**Usage:**
```jsx
<NeonContainer
  gradient={true}
  gradientColors={[colors.background.primary, '#0D0D0D']}
>
  <NeonText>Container Content</NeonText>
</NeonContainer>
```

## Animation Utilities

The design system includes animation utilities for creating interactive UI elements:

### useNeonPulse

Creates a pulsing animation for neon elements.

```jsx
const pulseAnim = useNeonPulse(1500, 0.5, 1);
```

### useHoverEffect

Creates a scale animation for hover/press effects.

```jsx
const { animatedStyle, onPressIn, onPressOut } = useHoverEffect(1.05);
```

### useGlowHoverEffect

Creates a glow intensity animation for hover/press effects.

```jsx
const { glowOpacity, glowRadius, onPressIn, onPressOut } = useGlowHoverEffect('low', 'medium');
```

## Device Optimization

The design system includes utilities for optimizing UI for different devices:

- `scaleFontSize`: Scales font sizes based on device size
- `getResponsiveSpacing`: Adjusts spacing based on device size
- `getOptimizedGlowIntensity`: Optimizes glow effects based on device performance
- `getOptimizedShadow`: Optimizes shadows based on device pixel ratio

## Color Palette

### Background Colors
- Primary: `#000000` (Pure black)
- Secondary: `#121212` (Very dark gray)
- Tertiary: `#1A1A1A` (Dark gray)

### Text Colors
- Primary: `#FFFFFF` (White)
- Secondary: `#AAAAAA` (Light gray)
- Tertiary: `#666666` (Medium gray)

### Neon Colors
- Blue: `#00E5FF` (Bright cyan)
- Cyan: `#00BFFF` (Deep sky blue)
- Green: `#00FF88` (Bright green)
- Purple: `#BF5AF2` (Bright purple)
- Pink: `#FF2D55` (Bright pink)
- Yellow: `#FFCC00` (Bright yellow)

### Status Colors
- Success: `#00FF88` (Bright green)
- Warning: `#FFCC00` (Bright yellow)
- Error: `#FF2D55` (Bright pink)
- Info: `#00E5FF` (Bright cyan)

## Typography

### Font Sizes
- xs: 10px
- sm: 12px
- md: 14px
- lg: 16px
- xl: 20px
- xxl: 24px
- xxxl: 32px

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- SemiBold: 600
- Bold: 700

## Spacing

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px
- xxxl: 64px

## Border Radius

- xs: 2px
- sm: 4px
- md: 8px
- lg: 16px
- xl: 24px
- round: 9999px (for circular elements)

## Implementation Guidelines

1. Use dark backgrounds with neon accents for contrast
2. Apply glow effects sparingly to highlight important elements
3. Use animations to provide feedback for user interactions
4. Optimize UI for different device sizes and performance capabilities
5. Maintain consistent spacing and typography throughout the app
6. Use gradient backgrounds to add depth and visual interest