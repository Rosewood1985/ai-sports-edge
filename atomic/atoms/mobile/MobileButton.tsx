import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useHaptics } from '../../../hooks/useMobile';

interface MobileButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'neon' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  [key: string]: any;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  haptic = true,
  style = {},
  textStyle = {},
  ...props
}) => {
  const haptics = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;

    if (haptic) haptics.lightImpact();

    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [disabled, loading, haptic, haptics, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const variants = {
    primary: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    secondary: {
      backgroundColor: '#6B7280',
      borderColor: '#6B7280',
    },
    neon: {
      backgroundColor: '#1F2937',
      borderColor: '#3B82F6',
      borderWidth: 1,
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: '#D1D5DB',
      borderWidth: 1,
    },
    danger: {
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
    },
  };

  const sizes = {
    sm: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    md: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    lg: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
    },
    xl: {
      paddingHorizontal: 32,
      paddingVertical: 20,
      borderRadius: 16,
    },
  };

  const textSizes = {
    sm: { fontSize: 14, fontWeight: '500' as const },
    md: { fontSize: 16, fontWeight: '600' as const },
    lg: { fontSize: 18, fontWeight: '600' as const },
    xl: { fontSize: 20, fontWeight: '700' as const },
  };

  const textColors = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    neon: '#3B82F6',
    outline: '#374151',
    danger: '#FFFFFF',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
          variants[variant],
          sizes[size],
          style,
        ]}
      >
        {loading && (
          <View style={{ marginRight: 8 }}>
            {/* Loading spinner would go here */}
            <Text style={{ color: textColors[variant] }}>...</Text>
          </View>
        )}

        {icon && <View style={{ marginRight: title ? 8 : 0 }}>{icon}</View>}

        {title && (
          <Text style={[textSizes[size], { color: textColors[variant] }, textStyle]}>{title}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default MobileButton;
