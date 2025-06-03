import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

import PremiumFeature from './PremiumFeature';
import PropBetList from './PropBetList';
import { Game, ConfidenceLevel } from '../types/odds';

// Corrected import paths for Neon components - importing directly
import NeonButton from './ui/NeonButton';
import NeonCard from './ui/NeonCard';
import NeonText from './ui/NeonText';
import { AccessibleTouchableOpacity } from '../atomic/atoms'; // Import AccessibleTouchableOpacity
import { Colors } from '../constants/Colors'; // Import base Colors for status
import theme from '../styles/theme'; // Import the full theme object

// Define navigation type
type RootStackParamList = {
  PlayerStats: { gameId: string; gameTitle: string };
  [key: string]: object | undefined;
};

type GameCardNavigationProp = StackNavigationProp<RootStackParamList>;

interface NeonGameCardProps {
  game: Game;
  onPress?: (game: Game) => void;
  isLocalGame?: boolean;
}

/**
 * NeonGameCard component displays information about a game and its odds with a neon design,
 * using the centralized theme and custom Neon UI components.
 * @param {NeonGameCardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const NeonGameCard = memo(({ game, onPress, isLocalGame }: NeonGameCardProps): JSX.Element => {
  const navigation = useNavigation<GameCardNavigationProp>();

  // Check if game object has required properties
  if (!game || !game.home_team || !game.away_team) {
    return (
      // Use NeonCard with theme status colors
      <NeonCard borderColor={Colors.status.lowConfidence} glowColor={Colors.status.lowConfidence}>
        {/* Use NeonText, assuming it handles basic text styling */}
        <NeonText type="body" color={Colors.status.lowConfidence}>
          Invalid game data
        </NeonText>
      </NeonCard>
    );
  }

  // Get confidence color based on level using theme status colors
  const getConfidenceColor = (level: ConfidenceLevel | 'unknown'): string => {
    switch (level) {
      case 'high':
        return Colors.status.highConfidence;
      case 'medium':
        return Colors.status.mediumConfidence;
      case 'low':
        return Colors.status.lowConfidence;
      case 'unknown':
      default:
        return theme.colors.tertiaryText; // Use theme color for default/unknown
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(game);
    }
  };

  // Check if the game is live or has started
  const isGameActive = () => {
    try {
      return (
        game.live_updates || (game.commence_time && new Date(game.commence_time) <= new Date())
      );
    } catch (e) {
      console.error('Invalid date format for commence_time:', game.commence_time);
      return !!game.live_updates;
    }
  };

  // Navigate to player stats screen
  const navigateToPlayerStats = () => {
    navigation.navigate('PlayerStats', {
      gameId: game.id,
      gameTitle: `${game.home_team} vs ${game.away_team}`,
    });
  };

  const confidenceLevel = game.ai_prediction?.confidence ?? 'unknown';
  const confidenceColor = getConfidenceColor(confidenceLevel);

  return (
    <NeonCard
      // Use theme colors for border and glow
      borderColor={isGameActive() ? theme.colors.primaryAction : theme.colors.borderSubtle}
      glowIntensity={isGameActive() ? 'medium' : 'low'}
      glowColor={isGameActive() ? theme.colors.primaryAction : 'transparent'}
      gradient
      // Use theme background colors for gradient
      gradientColors={[theme.colors.surfaceBackground, theme.colors.primaryBackground]}
      style={styles.card} // Apply base margin from StyleSheet
    >
      <AccessibleTouchableOpacity
        onPress={handlePress}
        activeOpacity={onPress ? 0.7 : 1}
        style={styles.cardContent} // Apply padding/layout from StyleSheet
        accessibilityLabel={`Game: ${game.home_team} vs ${game.away_team}`}
        accessibilityHint={`View details for ${game.home_team} vs ${game.away_team} game`}
        accessibilityRole="button"
      >
        {/* Game header */}
        <View style={styles.header}>
          <View style={styles.matchupContainer}>
            {/* Assuming NeonText type='subheading' maps roughly to theme.typography.h3 */}
            <NeonText type="subheading" glow color={theme.colors.primaryText}>
              {game.home_team} vs {game.away_team}
            </NeonText>

            {isLocalGame && (
              // Use theme colors for indicator
              <View
                style={[styles.localIndicator, { backgroundColor: Colors.status.highConfidence }]}
              >
                {/* Assuming NeonText type='caption' maps to theme.typography.small/label */}
                <NeonText type="caption" color={theme.colors.primaryBackground}>
                  LOCAL
                </NeonText>
              </View>
            )}
          </View>

          {/* Live score indicator */}
          {game.live_updates?.score && (
            <LinearGradient
              // Use theme status color or a dedicated live color
              colors={[Colors.status.lowConfidence, '#CC0000']} // Example gradient
              style={styles.liveScoreContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <NeonText type="body" color={theme.colors.primaryText} style={styles.liveScoreText}>
                {game.live_updates.score.home} - {game.live_updates.score.away}
              </NeonText>
              <View style={[styles.liveIndicator, { backgroundColor: theme.colors.primaryText }]} />
            </LinearGradient>
          )}
        </View>

        {/* Time */}
        <View style={styles.timeContainer}>
          <NeonText type="caption" color={theme.colors.secondaryText}>
            {game.commence_time ? new Date(game.commence_time).toLocaleString() : 'Time TBD'}
          </NeonText>

          {game.live_updates && (
            <NeonText type="caption" color={Colors.status.lowConfidence} glow>
              {game.live_updates.period} • {game.live_updates.time_remaining} remaining
            </NeonText>
          )}
        </View>

        {/* Bookmaker odds */}
        {game.bookmakers && game.bookmakers.length > 0 ? (
          <View style={styles.bookmakerContainer}>
            <NeonText type="caption" color={theme.colors.secondaryText}>
              {game.bookmakers[0].title}
            </NeonText>

            {game.bookmakers[0]?.markets[0]?.outcomes ? (
              <View style={styles.oddsContainer}>
                {game.bookmakers[0].markets[0].outcomes.map((outcome, idx) => (
                  <View key={idx} style={styles.outcomeRow}>
                    <NeonText type="body" color={theme.colors.primaryText} style={styles.teamName}>
                      {outcome.name}
                    </NeonText>
                    {/* Use primary action color for odds */}
                    <NeonText type="body" color={theme.colors.primaryAction} glow>
                      {outcome.price}
                    </NeonText>
                  </View>
                ))}
              </View>
            ) : (
              <NeonText type="caption" color={theme.colors.secondaryText} style={styles.noOdds}>
                No odds available
              </NeonText>
            )}
          </View>
        ) : (
          <NeonText type="caption" color={theme.colors.secondaryText} style={styles.noOdds}>
            No bookmaker data available
          </NeonText>
        )}

        {/* AI Prediction */}
        {game.ai_prediction && (
          <PremiumFeature>
            <View
              style={[
                styles.predictionContainer,
                // Use theme colors for border and background
                {
                  borderLeftColor: theme.colors.primaryAction,
                  backgroundColor: 'rgba(0, 229, 255, 0.05)', // Keep subtle background or use theme.colors.surfaceBackground
                },
              ]}
            >
              <View style={styles.predictionHeader}>
                <NeonText type="subheading" color={theme.colors.primaryAction} glow>
                  AI Prediction
                </NeonText>
                <View style={[styles.confidenceIndicator, { backgroundColor: confidenceColor }]}>
                  <NeonText type="caption" color={theme.colors.primaryBackground}>
                    {confidenceLevel.toUpperCase()}
                  </NeonText>
                </View>
              </View>

              <View style={styles.predictionRow}>
                <NeonText
                  type="body"
                  color={theme.colors.primaryText}
                  style={styles.predictionLabel}
                >
                  Pick:
                </NeonText>
                {/* Use appropriate status color for winner */}
                <NeonText type="body" color={Colors.status.highConfidence} glow>
                  {game.ai_prediction.predicted_winner}
                </NeonText>
              </View>

              <View style={styles.predictionRow}>
                <NeonText
                  type="body"
                  color={theme.colors.primaryText}
                  style={styles.predictionLabel}
                >
                  Reasoning:
                </NeonText>
                <NeonText
                  type="body"
                  color={theme.colors.secondaryText}
                  style={styles.predictionValue}
                >
                  {game.ai_prediction.reasoning}
                </NeonText>
              </View>

              <View style={styles.predictionRow}>
                <NeonText
                  type="body"
                  color={theme.colors.primaryText}
                  style={styles.predictionLabel}
                >
                  Historical Accuracy:
                </NeonText>
                {/* Use accent color for accuracy */}
                <NeonText type="body" color={theme.colors.accent} glow>
                  {game.ai_prediction.historical_accuracy}%
                </NeonText>
              </View>
            </View>
          </PremiumFeature>
        )}

        {/* Player Prop Predictions */}
        <PropBetList game={game} />

        {/* Player Stats Button */}
        {isGameActive() && (
          <NeonButton
            title="View Player Stats"
            onPress={navigateToPlayerStats}
            type="primary" // Assuming NeonButton uses theme internally for type='primary'
            icon={
              <Ionicons
                name="stats-chart"
                size={16}
                color={theme.colors.primaryBackground}
                style={styles.statsIcon}
              />
            } // Use black/dark text on neon button
            iconPosition="left"
            style={styles.statsButton} // Apply margin from StyleSheet
          />
        )}
      </AccessibleTouchableOpacity>
    </NeonCard>
  );
});

// Use theme constants in StyleSheet where possible
const styles = StyleSheet.create({
  card: {
    margin: theme.spacing.sm, // Use theme spacing
  },
  cardContent: {
    width: '100%',
    padding: theme.spacing.md, // Add padding inside the card content if NeonCard doesn't handle it
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  matchupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginRight: theme.spacing.sm,
  },
  localIndicator: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs, // Use theme radius
    marginLeft: theme.spacing.xs,
  },
  timeContainer: {
    marginBottom: theme.spacing.sm,
  },
  liveScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs, // Use theme radius
  },
  liveScoreText: {
    marginRight: theme.spacing.xs,
    fontWeight: 'bold', // Keep specific weight if needed
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    // Background color set dynamically
  },
  bookmakerContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  oddsContainer: {
    marginTop: theme.spacing.xs,
  },
  outcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  teamName: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  noOdds: {
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  predictionContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm, // Use theme radius
    borderLeftWidth: 3,
    // Background and border color set dynamically
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  confidenceIndicator: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs, // Use theme radius
  },
  predictionRow: {
    marginBottom: theme.spacing.xs,
    // Consider flex direction for label/value alignment if needed
  },
  predictionLabel: {
    fontWeight: '600', // Keep specific weight
    marginBottom: 2,
  },
  predictionValue: {
    // Line height might be handled by NeonText type='body'
  },
  statsButton: {
    marginTop: theme.spacing.sm,
  },
  statsIcon: {
    marginRight: theme.spacing.xs,
  },
});

export default NeonGameCard;
