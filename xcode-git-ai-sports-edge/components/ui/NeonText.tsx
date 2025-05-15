import React from 'react';
import { Text, StyleSheet, TextProps, StyleProp, TextStyle } from 'react-native';
import { colors, typography, shadows } from '../../styles/theme';
import { scaleFontSize, getOptimizedGlowIntensity } from '../../utils/deviceOptimization';

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
const NeonText: React.FC<NeonTextProps> = ({
  color = colors.text.heading,
  glow = true,
  intensity = 'medium',
  type = 'body',
  style,
  children,
  ...rest
}) => {
  // Determine font family based on type
  const getFontFamily = () => {
    switch (type) {
      case 'heading':
        return typography.fontFamily.heading;
      case 'subheading':
        return typography.fontFamily.heading;
      case 'body':
        return typography.fontFamily.body;
      case 'caption':
        return typography.fontFamily.body;
      default:
        return typography.fontFamily.body;
    }
  };

  // Determine font size based on type with device optimization
  const getFontSize = () => {
    let baseSize;
    switch (type) {
      case 'heading':
        baseSize = typography.fontSize.xl;
        break;
      case 'subheading':
        baseSize = typography.fontSize.lg;
        break;
      case 'body':
        baseSize = typography.fontSize.md;
        break;
      case 'caption':
        baseSize = typography.fontSize.sm;
        break;
      default:
        baseSize = typography.fontSize.md;
    }
    
    // Scale font size based on device
    return scaleFontSize(baseSize);
  };

  // Determine font weight based on type
  const getFontWeight = (): "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" => {
    switch (type) {
      case 'heading':
        return '700'; // bold
      case 'subheading':
        return '600'; // semiBold
      case 'body':
        return '400'; // regular
      case 'caption':
        return '400'; // regular
      default:
        return '400'; // regular
    }
  };

  // Create text shadow style for glow effect with device optimization
  const getTextShadow = () => {
    if (!glow) return {};
    
    // Optimize glow intensity based on device performance
    const optimizedIntensity = getOptimizedGlowIntensity(intensity);
    
    return {
      textShadowColor: color,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: optimizedIntensity === 'low' ? 2 : optimizedIntensity === 'medium' ? 5 : 10,
    };
  };

  return (
    <Text
      style={[
        styles.text,
        {
          color,
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