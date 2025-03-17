import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Game, ConfidenceLevel } from '../types/odds';
import PremiumFeature from './PremiumFeature';
import PropBetList from './PropBetList';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NeonText, NeonCard, NeonButton } from './ui';
import { colors, spacing, borderRadius } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

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
 * NeonGameCard component displays information about a game and its odds with a neon design
 * @param {NeonGameCardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const NeonGameCard = memo(({ game, onPress, isLocalGame }: NeonGameCardProps): JSX.Element => {
  const navigation = useNavigation<GameCardNavigationProp>();
  
  // Check if game object has required properties
  if (!game || !game.home_team || !game.away_team) {
    return (
      <NeonCard borderColor={colors.status.error} glowColor={colors.status.error}>
        <NeonText type="body" color={colors.status.error}>Invalid game data</NeonText>
      </NeonCard>
    );
  }

  // Get confidence color based on level
  const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
      case 'high':
        return colors.status.success; // Green
      case 'medium':
        return colors.status.warning; // Yellow
      case 'low':
        return colors.status.error; // Red
      default:
        return colors.text.secondary; // Gray
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(game);
    }
  };
  
  // Check if the game is live or has started
  const isGameActive = () => {
    return game.live_updates || new Date(game.commence_time) <= new Date();
  };
  
  // Navigate to player stats screen
  const navigateToPlayerStats = () => {
    navigation.navigate('PlayerStats', {
      gameId: game.id,
      gameTitle: `${game.home_team} vs ${game.away_team}`
    });
  };

  return (
    <NeonCard
      borderColor={isGameActive() ? colors.neon.cyan : colors.border.default}
      glowIntensity={isGameActive() ? 'medium' : 'low'}
      glowColor={isGameActive() ? colors.neon.cyan : 'transparent'}
      gradient={true}
      gradientColors={[colors.background.secondary, colors.background.tertiary]}
      style={styles.card}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={onPress ? 0.7 : 1}
        style={styles.cardContent}
      >
        {/* Game header with teams and time */}
        <View style={styles.header}>
          <View style={styles.matchupContainer}>
            <NeonText type="subheading" glow={true}>
              {game.home_team} vs {game.away_team}
            </NeonText>
            
            {isLocalGame && (
              <View style={[styles.localIndicator, { backgroundColor: colors.status.success }]}>
                <NeonText type="caption" color="#000000">LOCAL</NeonText>
              </View>
            )}
          </View>
          
          {/* Live score indicator */}
          {game.live_updates?.score && (
            <LinearGradient
              colors={['#FF3333', '#CC0000']}
              style={styles.liveScoreContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <NeonText type="body" color="#FFFFFF" style={styles.liveScoreText}>
                {game.live_updates.score.home} - {game.live_updates.score.away}
              </NeonText>
              <View style={styles.liveIndicator} />
            </LinearGradient>
          )}
        </View>
        
        <View style={styles.timeContainer}>
          <NeonText type="caption" color={colors.text.secondary}>
            {new Date(game.commence_time).toLocaleString()}
          </NeonText>
          
          {/* Live game status */}
          {game.live_updates && (
            <NeonText type="caption" color={colors.status.error} glow={true}>
              {game.live_updates.period} • {game.live_updates.time_remaining} remaining
            </NeonText>
          )}
        </View>
        
        {/* Bookmaker odds */}
        {game.bookmakers && game.bookmakers.length > 0 ? (
          <View style={styles.bookmakerContainer}>
            <NeonText type="caption" color={colors.text.secondary}>
              {game.bookmakers[0].title}
            </NeonText>
            
            {game.bookmakers[0]?.markets[0]?.outcomes ? (
              <View style={styles.oddsContainer}>
                {game.bookmakers[0].markets[0].outcomes.map((outcome, idx) => (
                  <View key={idx} style={styles.outcomeRow}>
                    <NeonText type="body" color={colors.text.primary} style={styles.teamName}>
                      {outcome.name}
                    </NeonText>
                    <NeonText type="body" color={colors.neon.blue} glow={true}>
                      {outcome.price}
                    </NeonText>
                  </View>
                ))}
              </View>
            ) : (
              <NeonText type="caption" color={colors.text.secondary} style={styles.noOdds}>
                No odds available
              </NeonText>
            )}
          </View>
        ) : (
          <NeonText type="caption" color={colors.text.secondary} style={styles.noOdds}>
            No bookmaker data available
          </NeonText>
        )}
        
        {/* AI Prediction (Premium Feature) */}
        {game.ai_prediction && (
          <PremiumFeature>
            <View style={[
              styles.predictionContainer,
              { borderLeftColor: colors.neon.blue }
            ]}>
              <View style={styles.predictionHeader}>
                <NeonText type="subheading" color={colors.neon.blue} glow={true}>
                  AI Prediction
                </NeonText>
                <View
                  style={[
                    styles.confidenceIndicator,
                    { backgroundColor: getConfidenceColor(game.ai_prediction.confidence) }
                  ]}
                >
                  <NeonText type="caption" color="#000000">
                    {game.ai_prediction.confidence.toUpperCase()}
                  </NeonText>
                </View>
              </View>
              
              <View style={styles.predictionRow}>
                <NeonText type="body" color={colors.text.primary} style={styles.predictionLabel}>
                  Pick:
                </NeonText>
                <NeonText type="body" color={colors.neon.green} glow={true}>
                  {game.ai_prediction.predicted_winner}
                </NeonText>
              </View>
              
              <View style={styles.predictionRow}>
                <NeonText type="body" color={colors.text.primary} style={styles.predictionLabel}>
                  Reasoning:
                </NeonText>
                <NeonText type="body" color={colors.text.primary} style={styles.predictionValue}>
                  {game.ai_prediction.reasoning}
                </NeonText>
              </View>
              
              <View style={styles.predictionRow}>
                <NeonText type="body" color={colors.text.primary} style={styles.predictionLabel}>
                  Historical Accuracy:
                </NeonText>
                <NeonText type="body" color={colors.neon.cyan} glow={true}>
                  {game.ai_prediction.historical_accuracy}%
                </NeonText>
              </View>
            </View>
          </PremiumFeature>
        )}
        
        {/* Player Prop Predictions */}
        <PropBetList game={game} />
        
        {/* Player Stats Button - Only show for active games */}
        {isGameActive() && (
          <NeonButton
            title="View Player Stats"
            onPress={navigateToPlayerStats}
            type="primary"
            icon={<Ionicons name="stats-chart" size={16} color="#fff" style={styles.statsIcon} />}
            iconPosition="left"
            style={styles.statsButton}
          />
        )}
      </TouchableOpacity>
    </NeonCard>
  );
});

const styles = StyleSheet.create({
  card: {
    margin: spacing.sm,
  },
  cardContent: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  matchupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  localIndicator: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  timeContainer: {
    marginBottom: spacing.sm,
  },
  liveScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  liveScoreText: {
    marginRight: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  bookmakerContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  oddsContainer: {
    marginTop: spacing.xs,
  },
  outcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  teamName: {
    flex: 1,
  },
  noOdds: {
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  predictionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confidenceIndicator: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  predictionRow: {
    marginBottom: spacing.xs,
  },
  predictionLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  predictionValue: {
    lineHeight: 18,
  },
  statsButton: {
    marginTop: spacing.sm,
  },
  statsIcon: {
    marginRight: spacing.xs,
  },
});

export default NeonGameCard;