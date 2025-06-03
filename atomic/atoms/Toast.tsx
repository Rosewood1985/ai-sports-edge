/**
 * Atomic Atom: Toast
 * Basic toast notification component
 * Location: /atomic/atoms/Toast.tsx
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  visible: boolean;
  onHide?: () => void;
  position?: 'top' | 'bottom';
  className?: string;
}

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onHide,
  position = 'top',
  className = '',
}: ToastProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide?.();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return { background: '#10B981', icon: '#FFFFFF' };
      case 'error':
        return { background: '#EF4444', icon: '#FFFFFF' };
      case 'warning':
        return { background: '#F59E0B', icon: '#FFFFFF' };
      case 'info':
      default:
        return { background: '#3B82F6', icon: '#FFFFFF' };
    }
  };

  if (!visible) return null;

  const colors = getColors();
  const containerStyle = [
    styles.container,
    styles[position],
    { backgroundColor: colors.background },
  ];

  return (
    <Animated.View
      style={[containerStyle, { opacity: fadeAnim, transform: [{ translateY: fadeAnim }] }]}
      className={className}
    >
      <Ionicons name={getIcon()} size={20} color={colors.icon} style={styles.icon} />
      <Text style={[styles.message, { color: colors.icon }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  top: {
    top: 50,
  },
  bottom: {
    bottom: 50,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
