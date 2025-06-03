import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';

import { ThemedText } from './ThemedText'; // Import ThemedText
import { ThemedView } from './ThemedView'; // Import ThemedView
import { useUITheme } from './UIThemeProvider'; // Import the new theme hook
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext'; // Keep for backward compatibility

export interface HeaderProps {
  title: string;
  onRefresh: () => void;
  isLoading: boolean;
  accessibilityHint?: string;
}

/**
 * Header component with title and refresh button, using the centralized theme system
 * @param {HeaderProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const Header = ({ title, onRefresh, isLoading, accessibilityHint }: HeaderProps): JSX.Element => {
  const { colors, isDark } = useTheme(); // Keep for backward compatibility
  const { theme } = useUITheme(); // Use the new theme
  const { t } = useI18n();

  return (
    <ThemedView
      background="surface" // Use surface background from theme
      style={[
        styles.header,
        {
          marginBottom: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.sm,
          marginHorizontal: Platform.OS === 'web' ? 0 : theme.spacing.sm,
          marginTop: theme.spacing.sm,
        },
      ]}
      accessible
      accessibilityRole="header"
    >
      <ThemedText
        type="h2" // Use h2 type from theme
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </ThemedText>
      <TouchableOpacity
        style={[
          styles.refreshButton,
          {
            backgroundColor: theme.colors.primaryAction, // Use primary action color
            borderRadius: theme.borderRadius.sm,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
          },
          isLoading && styles.refreshButtonDisabled,
        ]}
        onPress={onRefresh}
        disabled={isLoading}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t('oddsComparison.refresh')}
        accessibilityHint={accessibilityHint || t('oddsComparison.accessibility.refreshButtonHint')}
        accessibilityState={{ disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primaryText} />
        ) : (
          <>
            <Ionicons
              name="refresh"
              size={16}
              color={theme.colors.primaryText}
              style={[styles.refreshIcon, { marginRight: theme.spacing.xs }]}
            />
            <ThemedText
              type="button"
              color="primary" // Use primary text color
              style={styles.refreshButtonText}
            >
              {t('oddsComparison.refresh')}
            </ThemedText>
          </>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
};

// Keep minimal StyleSheet for layout and non-theme styles
const styles = StyleSheet.create({
  header: {
    // Margin, padding, and border radius now applied dynamically
  },
  title: {
    marginBottom: 10, // Could use theme.spacing.sm
    // Font size, weight, and color now handled by ThemedText
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Background color, padding, and border radius now applied dynamically
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshIcon: {
    // Margin now applied dynamically
  },
  refreshButtonText: {
    // Color, font weight, and font size now handled by ThemedText
  },
});

export default Header;
