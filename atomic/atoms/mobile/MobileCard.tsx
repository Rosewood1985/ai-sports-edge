import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';

import { useHaptics } from '../../../hooks/useMobile';

interface MobileCardProps {
  children: React.ReactNode;
  neon?: boolean;
  theme?: 'dark' | 'light';
  style?: ViewStyle;
  touchable?: boolean;
  onPress?: () => void;
  [key: string]: any;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  neon = false,
  theme = 'dark',
  style = {},
  touchable = false,
  onPress,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const haptics = useHaptics();

  const handlePressIn = useCallback(() => {
    if (!touchable) return;

    haptics.lightImpact();

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [touchable, haptics, scaleAnim, glowAnim]);

  const handlePressOut = useCallback(() => {
    if (!touchable) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [touchable, scaleAnim, glowAnim]);

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.4],
  });

  return touchable ? (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.95}
      {...props}
    >
      <Animated.View
        style={[
          {
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            borderWidth: neon ? 1 : 0,
            borderColor: neon ? '#3B82F6' : 'transparent',
            transform: [{ scale: scaleAnim }],
          },
          neon && {
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity,
            shadowRadius: 12,
            elevation: 8,
          },
          !neon && {
            shadowColor: theme === 'dark' ? '#000000' : '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme === 'dark' ? 0.25 : 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  ) : (
    <View {...props}>
      <Animated.View
        style={[
          {
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            borderWidth: neon ? 1 : 0,
            borderColor: neon ? '#3B82F6' : 'transparent',
          },
          !neon && {
            shadowColor: theme === 'dark' ? '#000000' : '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme === 'dark' ? 0.25 : 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default MobileCard;
