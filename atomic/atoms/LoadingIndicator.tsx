/**
 * Atomic Atom: Loading Indicator
 * Basic loading component with customizable styling
 * Location: /atomic/atoms/LoadingIndicator.tsx
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useUITheme } from '../../organisms/theme/UIThemeProvider';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: any;
}

export function LoadingIndicator({
  size = 'large',
  color,
  text,
  style,
}: LoadingIndicatorProps) {
  const { theme } = useUITheme();
  
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
    },
    text: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={color || theme.colors.primary} 
      />
      {text && <ThemedText style={styles.text}>{text}</ThemedText>}
    </View>
  );
}