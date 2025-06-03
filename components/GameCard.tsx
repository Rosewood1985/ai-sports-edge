import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native'; // Keep View for specific layout needs if ThemedView isn't sufficient

import PremiumFeature from './PremiumFeature';
import PropBetList from './PropBetList';
import { ThemedText } from './ThemedText'; // Import ThemedText
import { ThemedView } from './ThemedView'; // Import ThemedView
import { useUITheme } from './UIThemeProvider'; // Import theme hook
import { AccessibleTouchableOpacity } from '../atomic/atoms'; // Import AccessibleTouchableOpacity
import { Colors } from '../constants/Colors'; // Import Colors for status
import { Game, ConfidenceLevel } from '../types/odds';

// Define navigation type
type RootStackParamList = {
  PlayerStats: { gameId: string; gameTitle: string };
  [key: string]: object | undefined;
};

type GameCardNavigationProp = StackNavigationProp<RootStackParamList>;

interface GameCardProps {
  game: Game;
  onPress?: (game: Game) => void;
  isLocalGame?: boolean;
}

/**
 * GameCard component displays information about a game and its odds, using the theme system.
 * @param {GameCardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const GameCard = memo(({ game, onPress, isLocalGame }: GameCardProps): JSX.Element => {
  const navigation = useNavigation<GameCardNavigationProp>();
  const { theme } = useUITheme(); // Get theme object

  // Check if game object has required properties
  if (!game || !game.home_team || !game.away_team) {
    return (
      // Use ThemedView for the card background
      <ThemedView style={styles.card} background="surface">
        <ThemedText color="statusLow">Invalid game data</ThemedText>
      </ThemedView>
    );
  }

  // Get confidence color based on level using theme status colors
  // Updated to handle 'unknown' explicitly
  const getConfidenceColor = (level: ConfidenceLevel | 'unknown'): string => {
    switch (level) {
      case 'high':
        return Colors.status.highConfidence;
      case 'medium':
        return Colors.status.mediumConfidence;
      case 'low':
        return Colors.status.lowConfidence;
      case 'unknown': // Handle unknown case
      default:
        return theme.colors.tertiaryText; // Use tertiary text color for unknown/default
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(game);
    }
  };

  // Check if the game is live or has started
  const isGameActive = () => {
    // Ensure commence_time is valid before comparing
    try {
      return (
        game.live_updates || (game.commence_time && new Date(game.commence_time) <= new Date())
      );
    } catch (e) {
      console.error('Invalid date format for commence_time:', game.commence_time);
      return !!game.live_updates; // Fallback based on live_updates only
    }
  };

  // Navigate to player stats screen
  const navigateToPlayerStats = () => {
    navigation.navigate('PlayerStats', {
      gameId: game.id,
      gameTitle: `${game.home_team} vs ${game.away_team}`,
    });
  };

  // Dynamic styles using theme
  const cardStyle = [
    styles.card,
    {
      padding: theme.spacing.md,
      margin: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      // Background color handled by ThemedView
      // Border can be added if needed:
      // borderWidth: 1,
      // borderColor: theme.colors.borderSubtle,
    },
  ];

  const localIndicatorStyle = [
    styles.localIndicator,
    {
      backgroundColor: Colors.status.highConfidence, // Example: Use status color
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2, // Keep small vertical padding
      borderRadius: theme.borderRadius.xs,
      marginLeft: theme.spacing.sm,
    },
  ];

  const liveScoreContainerStyle = [
    styles.liveScoreContainer,
    {
      backgroundColor: Colors.status.lowConfidence, // Example: Use status color
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.xs,
    },
  ];

  const predictionContainerStyle = [
    styles.predictionContainer,
    {
      marginTop: theme.spacing.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceBackground, // Use surface bg, slightly different shade?
      borderRadius: theme.borderRadius.sm,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primaryAction, // Use theme action color
    },
  ];

  const confidenceIndicatorStyle = [
    styles.confidenceIndicator,
    {
      // Pass the potentially 'unknown' value here, getConfidenceColor now handles it
      backgroundColor: getConfidenceColor(game.ai_prediction?.confidence ?? 'unknown'),
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.xs,
    },
  ];

  const statsButtonStyle = [
    styles.statsButton,
    {
      backgroundColor: theme.colors.primaryAction,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
  ];

  return (
    <AccessibleTouchableOpacity
      style={cardStyle} // Apply dynamic style here
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityLabel={`Game: ${game.home_team} vs ${game.away_team}`}
      accessibilityHint={`View details for ${game.home_team} vs ${game.away_team} game`}
      accessibilityRole="button"
      // Wrap content in ThemedView for background
    >
      <ThemedView background="surface">
        {/* Game header with teams and time */}
        <View style={styles.header}>
          <View style={styles.matchupContainer}>
            {/* Use ThemedText with appropriate types */}
            <ThemedText type="h3" style={styles.matchupText}>
              {game.home_team} vs {game.away_team}
            </ThemedText>

            {isLocalGame && (
              <View style={localIndicatorStyle}>
                <ThemedText type="small" color="primary" style={styles.localIndicatorText}>
                  LOCAL
                </ThemedText>
              </View>
            )}
          </View>

          {/* Live score indicator */}
          {game.live_updates?.score && (
            <View style={liveScoreContainerStyle}>
              <ThemedText type="label" color="primary" style={styles.liveScoreText}>
                {game.live_updates.score.home} - {game.live_updates.score.away}
              </ThemedText>
              <View style={[styles.liveIndicator, { backgroundColor: theme.colors.primaryText }]} />
            </View>
          )}
        </View>

        <View style={styles.timeContainer}>
          <ThemedText type="small" color="secondary">
            {/* Ensure date is valid before formatting */}
            {game.commence_time ? new Date(game.commence_time).toLocaleString() : 'Time TBD'}
          </ThemedText>

          {/* Live game status */}
          {game.live_updates && (
            <ThemedText type="small" color="statusLow" style={styles.liveStatus}>
              {game.live_updates.period} • {game.live_updates.time_remaining} remaining
            </ThemedText>
          )}
        </View>

        {/* Bookmaker odds */}
        {game.bookmakers && game.bookmakers.length > 0 ? (
          <View style={styles.bookmakerContainer}>
            <ThemedText type="label" color="secondary" style={styles.bookmakerTitle}>
              {game.bookmakers[0].title}
            </ThemedText>

            {game.bookmakers[0]?.markets[0]?.outcomes ? (
              <View style={styles.oddsContainer}>
                {game.bookmakers[0].markets[0].outcomes.map((outcome, idx) => (
                  <View key={idx} style={styles.outcomeRow}>
                    <ThemedText type="bodyStd" style={styles.teamName}>
                      {outcome.name}
                    </ThemedText>
                    <ThemedText type="bodyStd" style={styles.odds}>
                      {outcome.price}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText type="small" color="tertiary" style={styles.noOdds}>
                No odds available
              </ThemedText>
            )}
          </View>
        ) : (
          <ThemedText type="small" color="tertiary" style={styles.noOdds}>
            No bookmaker data available
          </ThemedText>
        )}

        {/* AI Prediction (Premium Feature) */}
        {game.ai_prediction && (
          <PremiumFeature>
            <View style={predictionContainerStyle}>
              <View style={styles.predictionHeader}>
                <ThemedText type="label" color="action" style={styles.predictionTitle}>
                  AI Prediction
                </ThemedText>
                {/* Confidence indicator rendering logic remains the same */}
                <View style={confidenceIndicatorStyle}>
                  <ThemedText type="small" color="primary" style={styles.confidenceText}>
                    {(game.ai_prediction.confidence ?? 'UNKNOWN').toUpperCase()} CONFIDENCE
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="bodyStd" color="secondary" style={styles.predictionText}>
                <ThemedText type="bodyStd" style={styles.bold}>
                  Pick:{' '}
                </ThemedText>
                {game.ai_prediction.predicted_winner}
              </ThemedText>

              <ThemedText type="bodyStd" color="secondary" style={styles.predictionText}>
                <ThemedText type="bodyStd" style={styles.bold}>
                  Reasoning:{' '}
                </ThemedText>
                {game.ai_prediction.reasoning}
              </ThemedText>

              <ThemedText type="bodyStd" color="secondary" style={styles.predictionText}>
                <ThemedText type="bodyStd" style={styles.bold}>
                  Historical Accuracy:{' '}
                </ThemedText>
                {game.ai_prediction.historical_accuracy}%
              </ThemedText>
            </View>
          </PremiumFeature>
        )}

        {/* Player Prop Predictions */}
        <PropBetList game={game} />

        {/* Player Stats Button - Only show for active games */}
        {isGameActive() && (
          <AccessibleTouchableOpacity
            style={statsButtonStyle}
            onPress={navigateToPlayerStats}
            accessibilityLabel="View Player Stats"
            accessibilityHint="View detailed statistics for players in this game"
            accessibilityRole="button"
          >
            <Ionicons
              name="stats-chart"
              size={16}
              color={theme.colors.primaryText}
              style={styles.statsIcon}
            />
            <ThemedText type="button" color="primary" style={styles.statsButtonText}>
              View Player Stats
            </ThemedText>
          </AccessibleTouchableOpacity>
        )}
      </ThemedView>
    </AccessibleTouchableOpacity>
  );
});

// Keep StyleSheet for layout and styles not directly covered by theme props
const styles = StyleSheet.create({
  card: {
    // Base card structure - background/padding/radius applied dynamically
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4, // Use theme.spacing?
  },
  matchupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginRight: 8, // Use theme.spacing?
  },
  matchupText: {
    // Font size/weight handled by ThemedText type='h3'
    flexShrink: 1, // Allow text to shrink
  },
  localIndicator: {
    // Background/padding/radius applied dynamically
  },
  localIndicatorText: {
    // Color/size handled by ThemedText
    fontWeight: 'bold', // Keep specific weight if needed
  },
  timeContainer: {
    marginBottom: 8, // Use theme.spacing?
  },
  // Time text style handled by ThemedText
  liveStatus: {
    // Color/size handled by ThemedText
    fontWeight: '500',
    marginTop: 2,
  },
  liveScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Background/padding/radius applied dynamically
  },
  liveScoreText: {
    // Color/size handled by ThemedText
    fontWeight: 'bold',
    marginRight: 4, // Use theme.spacing?
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    // Background applied dynamically
  },
  bookmakerContainer: {
    marginTop: 8, // Use theme.spacing?
  },
  bookmakerTitle: {
    // Color/size handled by ThemedText
    fontWeight: '500', // Keep specific weight
    marginBottom: 4, // Use theme.spacing?
  },
  oddsContainer: {
    marginTop: 5, // Use theme.spacing?
  },
  outcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  teamName: {
    // Font size handled by ThemedText
    flex: 1, // Keep flex
    marginRight: 8, // Add spacing
  },
  odds: {
    // Font size handled by ThemedText
    fontWeight: '500', // Keep specific weight
  },
  noOdds: {
    // Color/size handled by ThemedText
    fontStyle: 'italic', // Keep italic
  },
  predictionContainer: {
    // Background/padding/radius/border applied dynamically
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Use theme.spacing?
  },
  predictionTitle: {
    // Color/size handled by ThemedText
    fontWeight: 'bold', // Keep specific weight
  },
  confidenceIndicator: {
    // Background/padding/radius applied dynamically
  },
  confidenceText: {
    // Color/size handled by ThemedText
    fontWeight: 'bold', // Keep specific weight
  },
  predictionText: {
    // Color/size handled by ThemedText
    marginBottom: 4, // Use theme.spacing?
    // Line height handled by ThemedText
  },
  bold: {
    fontWeight: 'bold', // Keep bold style helper
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Background/padding/radius/marginTop applied dynamically
  },
  statsIcon: {
    marginRight: 6, // Use theme.spacing?
  },
  statsButtonText: {
    // Color/size handled by ThemedText
    fontWeight: 'bold', // Keep specific weight
  },
});

export default GameCard;
