import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native';

import ResponsiveImage from './ResponsiveImage';
import { useTheme } from '../contexts/ThemeContext';

interface ResponsiveSportIconProps {
  sportKey: string;
  iconName?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
}

/**
 * ResponsiveSportIcon component displays a responsive icon for a sport
 * that automatically adapts to different screen sizes and resolutions
 */
const ResponsiveSportIcon: React.FC<ResponsiveSportIconProps> = ({
  sportKey,
  iconName,
  size = 24,
  style,
  selected = false,
}) => {
  const { colors, isDark } = useTheme();

  // Extract sport category from sportKey (e.g., "basketball" from "basketball_nba")
  const sportCategory = sportKey.split('_')[0] || 'generic';

  // Get base path for the icon
  const basePath = `assets/images/sports/${sportCategory}`;

  // Determine icon color based on selection state and theme
  const iconColor = selected ? '#ffffff' : isDark ? '#e0e0e0' : '#333333';

  // Check if we should use a custom image or fallback to Ionicons
  const useCustomImage = !iconName;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {useCustomImage ? (
        <ResponsiveImage
          basePath={basePath}
          width={size}
          height={size}
          style={styles.icon}
          resizeMode="contain"
          fallbackBasePath="assets/images/sports/generic"
        />
      ) : (
        <Ionicons name={iconName as any} size={size} color={iconColor} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});

export default ResponsiveSportIcon;
