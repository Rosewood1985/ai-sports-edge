/**
 * Atomic Atom: Neon Text
 * Text component with neon glow effect using UI theme system
 * Location: /atomic/atoms/ui/NeonText.tsx
 */
import React from 'react';
import { Text, StyleSheet, TextProps, StyleProp, TextStyle } from 'react-native';

import { useUITheme } from '../../../components/UIThemeProvider';
import { scaleFontSize, getOptimizedGlowIntensity } from '../../../utils/deviceOptimization';

interface NeonTextProps extends TextProps {
  color?: string;
  glow?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  type?: 'heading' | 'subheading' | 'body' | 'caption';
  style?: StyleProp<TextStyle>;
}

/**
 * NeonText component for displaying text with a neon glow effect
 * @param {NeonTextProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const NeonText: React.FC<NeonTextProps> = ({
  color,
  glow = true,
  intensity = 'medium',
  type = 'body',
  style,
  children,
  ...rest
}) => {
  const { theme } = useUITheme();

  // Use theme color if no color provided
  const textColor = color || theme.colors.primary;

  // Determine font family based on type
  const getFontFamily = () => {
    switch (type) {
      case 'heading':
      case 'subheading':
        return theme.typography.fontFamily.heading;
      case 'body':
      case 'caption':
        return theme.typography.fontFamily.body;
      default:
        return theme.typography.fontFamily.body;
    }
  };

  // Determine font size based on type with device optimization
  const getFontSize = () => {
    let baseSize;
    switch (type) {
      case 'heading':
        baseSize = theme.typography.fontSize.h1;
        break;
      case 'subheading':
        baseSize = theme.typography.fontSize.h2;
        break;
      case 'body':
        baseSize = theme.typography.fontSize.bodyStd;
        break;
      case 'caption':
        baseSize = theme.typography.fontSize.small;
        break;
      default:
        baseSize = theme.typography.fontSize.bodyStd;
    }

    // Scale font size based on device
    return scaleFontSize(baseSize);
  };

  // Determine font weight based on type
  const getFontWeight = ():
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900' => {
    switch (type) {
      case 'heading':
        return theme.typography.fontWeight.bold as '700';
      case 'subheading':
        return theme.typography.fontWeight.semiBold as '600';
      case 'body':
      case 'caption':
        return theme.typography.fontWeight.regular as '400';
      default:
        return theme.typography.fontWeight.regular as '400';
    }
  };

  // Create text shadow style for glow effect with device optimization
  const getTextShadow = () => {
    if (!glow) return {};

    // Optimize glow intensity based on device performance
    const optimizedIntensity = getOptimizedGlowIntensity(intensity);

    return {
      textShadowColor: textColor,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: optimizedIntensity === 'low' ? 2 : optimizedIntensity === 'medium' ? 5 : 10,
    };
  };

  return (
    <Text
      style={[
        styles.text,
        {
          color: textColor,
          fontFamily: getFontFamily(),
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
        },
        getTextShadow(),
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    // Base text styles
    letterSpacing: 0.5,
  },
});

export default NeonText;
