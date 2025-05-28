/**
 * Atomic Organism: Header
 * Complex header component with title and refresh functionality
 * Location: /atomic/organisms/layout/Header.tsx
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useUITheme } from '../../../components/UIThemeProvider';
import { useI18n } from '../i18n/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, ThemedView } from '../../atoms';

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
export const Header = ({
  title,
  onRefresh,
  isLoading,
  accessibilityHint
}: HeaderProps): JSX.Element => {
  const { theme } = useUITheme();
  const { t } = useI18n();
  
  const styles = StyleSheet.create({
    header: {
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginHorizontal: Platform.OS === 'web' ? 0 : theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    title: {
      marginBottom: theme.spacing.xs,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    refreshButtonDisabled: {
      opacity: 0.7,
    },
    refreshIcon: {
      marginRight: theme.spacing.xxs,
    },
    refreshButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.typography.fontSize.button,
      fontWeight: theme.typography.fontWeight.semiBold as '600',
      fontFamily: theme.typography.fontFamily.body,
    }
  });
  
  return (
    <ThemedView
      background="surface"
      style={styles.header}
      accessible={true}
      accessibilityRole="header"
    >
      <ThemedText
        type="h2"
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </ThemedText>
      <TouchableOpacity
        style={[
          styles.refreshButton,
          isLoading && styles.refreshButtonDisabled
        ]}
        onPress={onRefresh}
        disabled={isLoading}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('oddsComparison.refresh')}
        accessibilityHint={accessibilityHint || t('oddsComparison.accessibility.refreshButtonHint')}
        accessibilityState={{ disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <>
            <Ionicons 
              name="refresh" 
              size={16} 
              color={theme.colors.onPrimary}
              style={styles.refreshIcon} 
            />
            <ThemedText style={styles.refreshButtonText}>
              {t('oddsComparison.refresh')}
            </ThemedText>
          </>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
};

export default Header;