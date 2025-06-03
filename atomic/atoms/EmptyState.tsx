/**
 * Atomic Atom: Empty State
 * Simple empty state component with optional icon using UI theme system
 * Location: /atomic/atoms/EmptyState.tsx
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from './ThemedText';
import { useUITheme } from '../../components/UIThemeProvider';

interface EmptyStateProps {
  /**
   * Message to display
   */
  message: string;

  /**
   * Optional icon component to display above the message
   */
  icon?: React.ReactNode;

  /**
   * Optional style overrides
   */
  style?: ViewStyle;
}

/**
 * EmptyState component displays a message when there's no data to show
 * @param {EmptyStateProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const EmptyState = ({ message, icon, style }: EmptyStateProps): JSX.Element => {
  const { theme } = useUITheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      marginVertical: theme.spacing.md,
    },
    iconContainer: {
      marginBottom: theme.spacing.sm,
    },
    message: {
      fontSize: theme.typography.fontSize.bodyStd,
      fontStyle: 'italic',
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.body,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <ThemedText style={styles.message}>{message}</ThemedText>
    </View>
  );
};

export default EmptyState;
