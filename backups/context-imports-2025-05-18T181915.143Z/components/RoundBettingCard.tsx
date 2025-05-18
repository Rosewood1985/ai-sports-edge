import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { RoundBettingOption, FightOutcome, UFCFighter } from '../types/ufc';
import { ThemedText } from './ThemedText';

interface RoundBettingCardProps {
  fighter: UFCFighter;
  options: RoundBettingOption[];
  onSelectOption: (option: RoundBettingOption) => void;
  selectedOption?: RoundBettingOption;
}

const RoundBettingCard: React.FC<RoundBettingCardProps> = ({
  fighter,
  options,
  onSelectOption,
  selectedOption,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  // Group options by round
  const optionsByRound: { [round: number]: RoundBettingOption[] } = {};
  options.forEach(option => {
    if (!optionsByRound[option.round]) {
      optionsByRound[option.round] = [];
    }
    optionsByRound[option.round].push(option);
  });

  // Get outcome color
  const getOutcomeColor = (outcome: FightOutcome) => {
    switch (outcome) {
      case FightOutcome.KO:
      case FightOutcome.TKO:
        return isDark ? '#e74c3c80' : '#e74c3c20'; // Red with transparency
      case FightOutcome.SUBMISSION:
        return isDark ? '#3498db80' : '#3498db20'; // Blue with transparency
      case FightOutcome.DECISION:
        return isDark ? '#2ecc7180' : '#2ecc7120'; // Green with transparency
      case FightOutcome.DQ:
        return isDark ? '#f39c1280' : '#f39c1220'; // Orange with transparency
      default:
        return isDark ? '#95a5a680' : '#95a5a620'; // Gray with transparency
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#222222' : '#FFFFFF',
          borderColor: isDark ? '#333333' : '#EEEEEE',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.fighterInfo}>
          <ThemedText style={styles.fighterName}>{fighter.name}</ThemedText>
          {fighter.nickname && (
            <ThemedText style={styles.fighterNickname}>
              {t('ufc.round_betting_card.nickname_quotes', { nickname: fighter.nickname })}
            </ThemedText>
          )}
          <ThemedText style={styles.fighterRecord}>{fighter.record}</ThemedText>
        </View>

        {fighter.imageUrl && (
          <View style={styles.imageContainer}>
            <View style={[styles.imageWrapper, { borderColor: isDark ? '#333333' : '#EEEEEE' }]}>
              <Ionicons name="person" size={24} color={isDark ? '#BBBBBB' : '#666666'} />
            </View>
          </View>
        )}
      </View>

      <ScrollView style={styles.optionsContainer}>
        {Object.entries(optionsByRound).map(([round, roundOptions]) => (
          <View key={round} style={styles.roundContainer}>
            <View style={[styles.roundHeader, { backgroundColor: isDark ? '#333333' : '#F5F5F5' }]}>
              <ThemedText style={styles.roundTitle}>
                {t('ufc.round_betting_card.round', { round })}
              </ThemedText>
            </View>

            {roundOptions.map(option => (
              <TouchableOpacity
                key={`${option.id}`}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      selectedOption && selectedOption.id === option.id
                        ? colors.primary + '33' // Add transparency
                        : getOutcomeColor(option.outcome),
                  },
                ]}
                onPress={() => onSelectOption(option)}
              >
                <ThemedText style={styles.outcomeText}>{option.outcome}</ThemedText>
                <ThemedText style={[styles.oddsText, { color: colors.primary }]}>
                  {option.odds.toFixed(2)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  fighterInfo: {
    flex: 1,
  },
  fighterName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fighterNickname: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
    opacity: 0.7,
  },
  fighterRecord: {
    fontSize: 14,
    opacity: 0.8,
  },
  imageContainer: {
    marginLeft: 12,
  },
  imageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  optionsContainer: {
    maxHeight: 300,
  },
  roundContainer: {
    marginBottom: 12,
  },
  roundHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  oddsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RoundBettingCard;
