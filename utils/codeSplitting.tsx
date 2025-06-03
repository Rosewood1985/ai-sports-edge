import React, { lazy, Suspense, ComponentType } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

/**
 * Creates a lazily loaded component with a loading fallback
 * @param importFunc Dynamic import function for the component
 * @param loadingProps Props to pass to the loading component
 * @returns Lazy loaded component with suspense
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loadingProps?: { size?: 'small' | 'large'; color?: string; text?: string }
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => {
    const { colors } = useTheme();

    return (
      <Suspense
        fallback={
          <LoadingFallback
            size={loadingProps?.size || 'large'}
            color={loadingProps?.color || colors.primary}
            text={loadingProps?.text}
          />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Loading fallback component for lazy loaded components
 */
interface LoadingFallbackProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ size, color, text }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={[styles.loadingText, { color: colors.text }]}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});
