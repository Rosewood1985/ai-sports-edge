/**
 * Atomic Atom: Neon Container
 * Container component with gradient background using UI theme system
 * Location: /atomic/atoms/ui/NeonContainer.tsx
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
  SafeAreaView,
} from 'react-native';
import { useUITheme } from '../../../components/UIThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

interface NeonContainerProps extends ViewProps {
  gradient?: boolean;
  gradientColors?: string[];
  useSafeArea?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * NeonContainer component for creating a themed background container
 * @param {NeonContainerProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const NeonContainer: React.FC<NeonContainerProps> = ({
  gradient = true,
  gradientColors,
  useSafeArea = true,
  style,
  contentStyle,
  children,
  ...rest
}) => {
  const { theme } = useUITheme();
  
  // Use theme colors if no custom gradient colors provided
  const defaultGradientColors = gradientColors || [theme.colors.primaryBackground, theme.colors.surfaceBackground];

  // Render container content
  const renderContent = () => {
    return (
      <View style={[styles.content, { padding: theme.spacing.sm }, contentStyle]} {...rest}>
        {children}
      </View>
    );
  };

  // Render container with or without gradient
  const renderContainer = () => {
    if (gradient) {
      // Ensure we have at least two colors for the gradient
      const gradientColorsArray: readonly [string, string] = Array.isArray(defaultGradientColors) && defaultGradientColors.length >= 2
        ? [defaultGradientColors[0], defaultGradientColors[1]] as const
        : [theme.colors.primaryBackground, theme.colors.surfaceBackground] as const;
        
      return (
        <LinearGradient
          colors={gradientColorsArray}
          style={[styles.container, style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.primaryBackground,
          },
          style,
        ]}
      >
        {renderContent()}
      </View>
    );
  };

  // Use SafeAreaView if requested
  if (useSafeArea) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: defaultGradientColors[0],
          },
        ]}
      >
        {renderContainer()}
      </SafeAreaView>
    );
  }

  return renderContainer();
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    // padding handled dynamically with theme spacing
  },
});

export default NeonContainer;