/**
 * Atomic Atom: Loading Indicator
 * Basic loading component with customizable styling
 * Location: /atomic/atoms/LoadingIndicator.tsx
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: any;
  className?: string;
}

export function LoadingIndicator({
  size = 'large',
  color = '#3B82F6',
  text,
  style,
  className = '',
}: LoadingIndicatorProps) {
  return (
    <View style={[styles.container, style]} className={className}>
      <ActivityIndicator size={size} color={color} />
      {text && <ThemedText style={styles.text}>{text}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});