import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Game, ConfidenceLevel } from '../types/odds';
import PremiumFeature from './PremiumFeature';
import PropBetList from './PropBetList';

interface GameCardProps {
  game: Game;
  onPress?: (game: Game) => void;
  isLocalGame?: boolean;
}

/**
 * GameCard component displays information about a game and its odds
 * @param {GameCardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const GameCard = memo(({ game, onPress, isLocalGame }: GameCardProps): JSX.Element => {
  // Check if game object has required properties
  if (!game || !game.home_team || !game.away_team) {
    return (
      <View style={styles.card}>
        <Text style={styles.error}>Invalid game data</Text>
      </View>
    );
  }

  // Get confidence color based on level
  const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
      case 'high':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FFC107'; // Yellow
      case 'low':
        return '#F44336'; // Red
      default:
        return '#757575'; // Gray
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(game);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Game header with teams and time */}
      <View style={styles.header}>
        <View style={styles.matchupContainer}>
          <Text style={styles.matchup}>{game.home_team} vs {game.away_team}</Text>
          
          {isLocalGame && (
            <View style={styles.localIndicator}>
              <Text style={styles.localIndicatorText}>LOCAL</Text>
            </View>
          )}
        </View>
        
        {/* Live score indicator */}
        {game.live_updates?.score && (
          <View style={styles.liveScoreContainer}>
            <Text style={styles.liveScoreText}>
              {game.live_updates.score.home} - {game.live_updates.score.away}
            </Text>
            <View style={styles.liveIndicator} />
          </View>
        )}
      </View>
      
      <View style={styles.timeContainer}>
        <Text style={styles.time}>
          {new Date(game.commence_time).toLocaleString()}
        </Text>
        
        {/* Live game status */}
        {game.live_updates && (
          <Text style={styles.liveStatus}>
            {game.live_updates.period} • {game.live_updates.time_remaining} remaining
          </Text>
        )}
      </View>
      
      {/* Bookmaker odds */}
      {game.bookmakers && game.bookmakers.length > 0 ? (
        <View style={styles.bookmakerContainer}>
          <Text style={styles.bookmakerTitle}>
            {game.bookmakers[0].title}
          </Text>
          
          {game.bookmakers[0]?.markets[0]?.outcomes ? (
            <View style={styles.oddsContainer}>
              {game.bookmakers[0].markets[0].outcomes.map((outcome, idx) => (
                <View key={idx} style={styles.outcomeRow}>
                  <Text style={styles.teamName}>{outcome.name}</Text>
                  <Text style={styles.odds}>{outcome.price}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noOdds}>No odds available</Text>
          )}
        </View>
      ) : (
        <Text style={styles.noOdds}>No bookmaker data available</Text>
      )}
      
      {/* AI Prediction (Premium Feature) */}
      {game.ai_prediction && (
        <PremiumFeature>
          <View style={styles.predictionContainer}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionTitle}>AI Prediction</Text>
              <View
                style={[
                  styles.confidenceIndicator,
                  { backgroundColor: getConfidenceColor(game.ai_prediction.confidence) }
                ]}
              >
                <Text style={styles.confidenceText}>
                  {game.ai_prediction.confidence.toUpperCase()} CONFIDENCE
                </Text>
              </View>
            </View>
            
            <Text style={styles.predictionText}>
              <Text style={styles.bold}>Pick: </Text>
              {game.ai_prediction.predicted_winner}
            </Text>
            
            <Text style={styles.predictionText}>
              <Text style={styles.bold}>Reasoning: </Text>
              {game.ai_prediction.reasoning}
            </Text>
            
            <Text style={styles.predictionText}>
              <Text style={styles.bold}>Historical Accuracy: </Text>
              {game.ai_prediction.historical_accuracy}%
            </Text>
          </View>
        </PremiumFeature>
      )}
      
      {/* Player Prop Predictions */}
      <PropBetList game={game} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 15,
    margin: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  matchup: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    flex: 1,
  },
  localIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  localIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeContainer: {
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  liveStatus: {
    fontSize: 12,
    color: '#e53935',
    fontWeight: '500',
    marginTop: 2,
  },
  liveScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e53935',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveScoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  bookmakerContainer: {
    marginTop: 8,
  },
  bookmakerTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  oddsContainer: {
    marginTop: 5,
  },
  outcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  teamName: {
    fontSize: 14,
    flex: 1,
  },
  odds: {
    fontSize: 14,
    fontWeight: '500',
  },
  noOdds: {
    fontStyle: 'italic',
    color: '#666',
  },
  error: {
    color: 'red',
    fontSize: 14,
  },
  predictionContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  confidenceIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  predictionText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
  }
});

export default GameCard;