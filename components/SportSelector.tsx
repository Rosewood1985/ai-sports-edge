import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';

import ResponsiveSportIcon from './ResponsiveSportIcon';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import { useTheme } from '../contexts/ThemeContext';

// Define available sports
export const AVAILABLE_SPORTS = [
  { key: 'basketball_nba', name: 'NBA Basketball', icon: 'basketball' },
  { key: 'basketball_ncaab', name: 'NCAA Basketball', icon: 'basketball-outline' },
  { key: 'football_nfl', name: 'NFL Football', icon: 'american-football' },
  { key: 'hockey_nhl', name: 'NHL Hockey', icon: 'snow' },
  { key: 'baseball_mlb', name: 'MLB Baseball', icon: 'baseball' },
  { key: 'soccer_epl', name: 'Premier League', icon: 'football' },
  { key: 'soccer_mls', name: 'MLS Soccer', icon: 'football-outline' },
  { key: 'mma_ufc', name: 'UFC MMA', icon: 'fitness' },
];

interface SportSelectorProps {
  selectedSport: string;
  onSelectSport: (sportKey: string) => void;
}

/**
 * SportSelector component allows users to select from available sports
 * with responsive icons and internationalization support
 */
const SportSelector: React.FC<SportSelectorProps> = ({ selectedSport, onSelectSport }) => {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{t('oddsComparison.selectSport')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {AVAILABLE_SPORTS.map(sport => {
          const isSelected = selectedSport === sport.key;
          return (
            <TouchableOpacity
              key={sport.key}
              style={[
                styles.sportButton,
                isSelected && [styles.selectedSport, { backgroundColor: colors.primary }],
                { backgroundColor: isDark ? '#333333' : '#f0f0f0' },
              ]}
              onPress={() => onSelectSport(sport.key)}
              accessible
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={t('oddsComparison.accessibility.selectSport', {
                sport: t(`sports.${sport.key}`),
              })}
              accessibilityHint={t('oddsComparison.accessibility.selectSportHint')}
            >
              <ResponsiveSportIcon
                sportKey={sport.key}
                iconName={sport.icon}
                size={20}
                selected={isSelected}
              />
              <Text
                style={[
                  styles.sportText,
                  isSelected && styles.selectedSportText,
                  { color: isSelected ? '#fff' : isDark ? '#e0e0e0' : '#333' },
                ]}
                numberOfLines={1}
              >
                {t(`sports.${sport.key}`) || sport.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scrollContent: {
    paddingRight: 16,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedSport: {
    backgroundColor: '#007BFF',
  },
  sportText: {
    fontSize: 14,
    marginLeft: 6,
  },
  selectedSportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SportSelector;
