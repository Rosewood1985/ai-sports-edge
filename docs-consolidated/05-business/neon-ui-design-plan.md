# AI Sports Edge: Neon UI Design Plan

## Overview

This document outlines the plan for implementing a futuristic, high-tech sports analytics UI design with a neon aesthetic for the AI Sports Edge app. The design will create an immersive, cutting-edge experience that aligns with the app's advanced AI capabilities.

## Color Palette

### Primary Colors
- **Background**: Pure Black (#000000) - Creates depth and makes neon elements pop
- **Headings**: Neon Blue (#00FFFF or #00E5FF) - Glowing effect for titles
- **Primary Buttons**: Bright Cyan (#00D4FF) - Eye-catching call-to-action
- **Secondary Buttons**: Electric Green (#00FF88) - Complementary accent color
- **Success/Confirm**: Electric Green (#00FF88) - Positive feedback
- **Error**: Red (#FF4444) - Clear indication of errors
- **Warning**: Yellow (#FFD700) - Attention-grabbing alerts
- **Subtext & Labels**: Light Gray (#B0B0B0) - Readable secondary text
- **Body Text**: White (#FFFFFF) - Maximum readability on dark backgrounds

### Gradients
- **Primary Gradient**: Linear gradient from #000000 to #121212 - Adds depth to backgrounds
- **Accent Gradient**: Linear gradient from #00D4FF to #00FFFF - Creates dynamic button effects
- **Card Gradient**: Linear gradient from #121212 to #1A1A1A - Subtle depth for cards

## Typography

- **Headings**: Futuristic, clean sans-serif font (e.g., "Orbitron" or "Rajdhani")
- **Body Text**: High-readability sans-serif (e.g., "Inter" or "Roboto")
- **Data Values**: Monospace font for numbers and statistics (e.g., "Space Mono")

### Text Effects
- **Neon Glow**: Text shadows to create a glowing effect for headings
  ```css
  textShadow: '0 0 5px #00FFFF, 0 0 10px #00FFFF, 0 0 15px #00FFFF'
  ```
- **Gradient Text**: Linear gradient applied to important text elements

## UI Components

### Cards
- Slightly translucent black backgrounds with subtle gradients
- Thin neon borders (1px) in accent colors
- Rounded corners (8px radius)
- Subtle drop shadows with neon glow

### Buttons
- Primary: Bright Cyan (#00D4FF) with white text
- Secondary: Electric Green (#00FF88) with black text
- Disabled: Dark Gray (#333333) with Light Gray (#B0B0B0) text
- Hover/Active states with increased glow effect

### Inputs
- Dark backgrounds (#121212)
- Neon borders that glow on focus
- White text with cyan placeholders

### Charts and Data Visualization
- Neon color scheme for data points
- Dark backgrounds with grid lines in dark gray
- Glowing effect for highlighted data points
- Animated transitions between data states

### Loading Indicators
- Pulsing neon animations
- Circular or linear progress indicators with gradient effects

## Animation and Effects

### Transitions
- Smooth fade transitions between screens (300ms)
- Subtle scale effects for interactive elements
- Easing functions for natural movement

### Hover/Active States
- Increased glow effect
- Slight scale increase (1.05x)
- Color shifts to brighter variants

### Micro-interactions
- Subtle feedback animations for user actions
- Pulsing effects for notifications
- Particle effects for celebrations (e.g., successful bets)

## Implementation Plan

### 1. Create Global Styles File

Create a `styles/theme.ts` file to define the color palette, typography, and common styles:

```typescript
// styles/theme.ts
export const colors = {
  background: {
    primary: '#000000',
    secondary: '#121212',
    tertiary: '#1A1A1A',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    heading: '#00E5FF',
  },
  button: {
    primary: '#00D4FF',
    secondary: '#00FF88',
    disabled: '#333333',
  },
  status: {
    success: '#00FF88',
    error: '#FF4444',
    warning: '#FFD700',
  },
  neon: {
    blue: '#00E5FF',
    cyan: '#00D4FF',
    green: '#00FF88',
  },
};

export const typography = {
  fontFamily: {
    heading: 'Orbitron, sans-serif',
    body: 'Inter, sans-serif',
    mono: 'Space Mono, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const shadows = {
  neonBlue: '0 0 5px #00E5FF, 0 0 10px #00E5FF',
  neonGreen: '0 0 5px #00FF88, 0 0 10px #00FF88',
  neonCyan: '0 0 5px #00D4FF, 0 0 10px #00D4FF',
};

export const gradients = {
  background: ['#000000', '#121212'],
  accent: ['#00D4FF', '#00FFFF'],
  card: ['#121212', '#1A1A1A'],
};
```

### 2. Create Reusable UI Components

#### NeonText Component

```typescript
// components/ui/NeonText.tsx
import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { colors, typography } from '../../styles/theme';

interface NeonTextProps extends TextProps {
  color?: string;
  glow?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  type?: 'heading' | 'subheading' | 'body';
}

const NeonText: React.FC<NeonTextProps> = ({
  color = colors.text.heading,
  glow = true,
  intensity = 'medium',
  type = 'body',
  style,
  children,
  ...rest
}) => {
  // Implementation details
};

const styles = StyleSheet.create({
  // Style definitions
});

export default NeonText;
```

#### NeonButton Component

```typescript
// components/ui/NeonButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, borderRadius } from '../../styles/theme';
import LinearGradient from 'react-native-linear-gradient';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  disabled = false,
  style,
  textStyle,
}) => {
  // Implementation details
};

const styles = StyleSheet.create({
  // Style definitions
});

export default NeonButton;
```

#### NeonCard Component

```typescript
// components/ui/NeonCard.tsx
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, borderRadius, shadows } from '../../styles/theme';
import LinearGradient from 'react-native-linear-gradient';

interface NeonCardProps extends ViewProps {
  borderColor?: string;
  glowColor?: string;
}

const NeonCard: React.FC<NeonCardProps> = ({
  borderColor = colors.neon.blue,
  glowColor = colors.neon.blue,
  style,
  children,
  ...rest
}) => {
  // Implementation details
};

const styles = StyleSheet.create({
  // Style definitions
});

export default NeonCard;
```

### 3. Install Required Dependencies

```bash
npm install react-native-linear-gradient
npm install react-native-reanimated
npm install react-native-svg
npm install expo-font
```

### 4. Load Custom Fonts

```typescript
// App.tsx
import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { View, Text } from 'react-native';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Orbitron': require('./assets/fonts/Orbitron-Regular.ttf'),
        'Orbitron-Bold': require('./assets/fonts/Orbitron-Bold.ttf'),
        'Inter': require('./assets/fonts/Inter-Regular.ttf'),
        'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
        'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        'Space-Mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <View><Text>Loading...</Text></View>;
  }

  // Rest of the app
}
```

### 5. Apply Theme to Existing Components

#### Update FreemiumFeature Component

```typescript
// components/FreemiumFeature.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { hasPremiumAccess, hasViewedAdToday, markAdAsViewed } from '../services/subscriptionService';
import { colors, typography, borderRadius, shadows } from '../styles/theme';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import NeonText from './ui/NeonText';
import LinearGradient from 'react-native-linear-gradient';

// Component implementation with updated styles
```

#### Update OddsScreen Component

```typescript
// screens/OddsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { colors, typography, borderRadius, shadows, gradients } from '../styles/theme';
import LinearGradient from 'react-native-linear-gradient';
import NeonText from '../components/ui/NeonText';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';

// Component implementation with updated styles
```

## Component Mockups

### Header Component

```
┌────────────────────────────────────────────┐
│                                            │
│  [NEON BLUE] AI SPORTS EDGE                │
│  [LIGHT GRAY] Advanced betting analytics   │
│                                            │
└────────────────────────────────────────────┘
```

### Game Card Component

```
┌────────────────────────────────────────────┐
│                                            │
│  [WHITE] Lakers vs Warriors                │
│  [LIGHT GRAY] Today, 7:30 PM               │
│                                            │
│  ┌─────────────┐       ┌─────────────┐     │
│  │ Lakers      │       │ Warriors    │     │
│  │ [WHITE] -5.5│       │ [WHITE] +5.5│     │
│  └─────────────┘       └─────────────┘     │
│                                            │
│  [NEON BLUE] AI PREDICTION                 │
│  [ELECTRIC GREEN] Lakers -5.5              │
│  [LIGHT GRAY] 78% Confidence               │
│                                            │
│  [CYAN BUTTON] View Details                │
│                                            │
└────────────────────────────────────────────┘
```

### Daily Free Pick Component

```
┌────────────────────────────────────────────┐
│                                            │
│  [NEON BLUE] YOUR FREE DAILY PICK          │
│                                            │
│  [WHITE] Celtics vs Bucks                  │
│  [LIGHT GRAY] Today, 8:00 PM               │
│                                            │
│  [WHITE] AI Prediction:                    │
│  [ELECTRIC GREEN] Celtics -3.5             │
│  [LIGHT GRAY] High Confidence              │
│                                            │
│  [CYAN BUTTON] Unlock with Ad              │
│                                            │
└────────────────────────────────────────────┘
```

## Animation Specifications

### Button Hover Effect

```typescript
// Animation for button hover effect
const buttonScale = useAnimatedValue(1);

const onPressIn = () => {
  Animated.spring(buttonScale, {
    toValue: 1.05,
    friction: 7,
    tension: 40,
    useNativeDriver: true
  }).start();
};

const onPressOut = () => {
  Animated.spring(buttonScale, {
    toValue: 1,
    friction: 7,
    tension: 40,
    useNativeDriver: true
  }).start();
};

// Apply to component
const animatedStyle = {
  transform: [{ scale: buttonScale }]
};
```

### Neon Pulse Effect

```typescript
// Animation for neon pulse effect
const pulseOpacity = useAnimatedValue(0.5);

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseOpacity, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(pulseOpacity, {
        toValue: 0.5,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ])
  ).start();
}, []);

// Apply to component shadow
const animatedShadowStyle = {
  shadowOpacity: pulseOpacity
};
```

## Implementation Timeline

### Week 1: Foundation
- Create theme file with color palette, typography, and spacing
- Install required dependencies
- Set up custom fonts
- Create basic UI components (NeonText, NeonButton, NeonCard)

### Week 2: Core Components
- Update FreemiumFeature component with neon design
- Update DailyFreePick component with neon design
- Update BlurredPrediction component with neon design
- Update TrendingBets component with neon design

### Week 3: Screens and Navigation
- Update OddsScreen with neon design
- Update navigation components with transitions
- Implement animations for interactive elements
- Create loading screens and indicators

### Week 4: Polish and Testing
- Add micro-interactions and feedback animations
- Optimize performance
- Test on different devices
- Refine and adjust based on feedback

## Conclusion

This neon UI design plan provides a comprehensive approach to creating a futuristic, high-tech sports analytics experience for the AI Sports Edge app. By implementing this design, we'll create an immersive and visually striking interface that aligns with the app's advanced AI capabilities and enhances the user experience.

The combination of dark backgrounds, neon accents, and subtle animations will create a cutting-edge feel that appeals to sports betting enthusiasts and tech-savvy users. The consistent application of the design system across all components will ensure a cohesive and professional look throughout the app.