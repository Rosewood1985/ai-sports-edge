import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';

export interface HeaderProps {
  title: string;
  onRefresh: () => void;
  isLoading: boolean;
  accessibilityHint?: string;
}

/**
 * Header component with title and refresh button
 * @param {HeaderProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const Header = ({
  title,
  onRefresh,
  isLoading,
  accessibilityHint
}: HeaderProps): JSX.Element => {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: isDark ? '#1a1a1a' : '#f8f8f8' }
      ]}
      accessible={true}
      accessibilityRole="header"
    >
      <Text
        style={[
          styles.title,
          { color: colors.text }
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <TouchableOpacity
        style={[
          styles.refreshButton,
          { backgroundColor: colors.primary },
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
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="refresh" size={16} color="#fff" style={styles.refreshIcon} />
            <Text style={styles.refreshButtonText}>{t('oddsComparison.refresh')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: Platform.OS === 'web' ? 0 : 8,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshIcon: {
    marginRight: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  }
});

export default Header;