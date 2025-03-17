import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
  SafeAreaView,
} from 'react-native';
import { colors, spacing } from '../../styles/theme';
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
const NeonContainer: React.FC<NeonContainerProps> = ({
  gradient = true,
  gradientColors = [colors.background.primary, '#0D0D0D'],
  useSafeArea = true,
  style,
  contentStyle,
  children,
  ...rest
}) => {
  // Render container content
  const renderContent = () => {
    return (
      <View style={[styles.content, contentStyle]} {...rest}>
        {children}
      </View>
    );
  };

  // Render container with or without gradient
  const renderContainer = () => {
    if (gradient) {
      // Ensure we have at least two colors for the gradient
      const gradientColorsArray: readonly [string, string] = Array.isArray(gradientColors) && gradientColors.length >= 2
        ? [gradientColors[0], gradientColors[1]] as const
        : [colors.background.primary, '#0D0D0D'] as const;
        
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
            backgroundColor: colors.background.primary,
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
            backgroundColor: gradientColors[0],
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
    padding: spacing.md,
  },
});

export default NeonContainer;