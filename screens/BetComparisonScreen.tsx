import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Game } from '../types/odds';
import { getGameResult } from '../services/aiPredictionService';
import { Ionicons } from '@expo/vector-icons';
import PremiumFeature from '../components/PremiumFeature';

type RootStackParamList = {
  BetComparison: { games: Game[] };
};

type BetComparisonScreenRouteProp = RouteProp<RootStackParamList, 'BetComparison'>;
type BetComparisonScreenNavigationProp = StackNavigationProp<any>;

/**
 * BetComparisonScreen component displays AI-generated bets alongside actual game results
 * @returns {JSX.Element} - Rendered component
 */
const BetComparisonScreen = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true);
  const [gamesWithResults, setGamesWithResults] = useState<Game[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    accuracy: 0,
    byConfidence: {
      high: { total: 0, correct: 0, accuracy: 0 },
      medium: { total: 0, correct: 0, accuracy: 0 },
      low: { total: 0, correct: 0, accuracy: 0 }
    }
  });
  
  const navigation = useNavigation<BetComparisonScreenNavigationProp>();
  const route = useRoute<BetComparisonScreenRouteProp>();
  
  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        
        // Get games from route params or use empty array if not provided
        const games = route.params?.games || [];
        
        // Get results for each game
        const gamesWithResultsData = await Promise.all(
          games.map(async (game) => {
            const result = await getGameResult(game.id);
            return {
              ...game,
              game_result: result || undefined
            } as Game;
          })
        );
        
        setGamesWithResults(gamesWithResultsData);
        
        // Calculate stats
        calculateStats(gamesWithResultsData);
      } catch (error) {
        console.error('Error loading game results:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadResults();
  }, [route.params?.games]);
  
  const calculateStats = (games: Game[]) => {
    // Filter games that have both predictions and results
    const completedGames = games.filter(
      game => game.ai_prediction && game.game_result && game.game_result.status === 'finished'
    );
    
    if (completedGames.length === 0) {
      return;
    }
    
    let correct = 0;
    const byConfidence = {
      high: { total: 0, correct: 0, accuracy: 0 },
      medium: { total: 0, correct: 0, accuracy: 0 },
      low: { total: 0, correct: 0, accuracy: 0 }
    };
    
    // Calculate correct predictions
    completedGames.forEach(game => {
      if (!game.ai_prediction || !game.game_result) return;
      
      const prediction = game.ai_prediction.predicted_winner;
      const result = game.game_result.winner;
      const confidence = game.ai_prediction.confidence;
      
      // Increment confidence level counters
      byConfidence[confidence].total++;
      
      // Check if prediction was correct
      const isCorrect = 
        (result === 'home' && prediction === game.home_team) || 
        (result === 'away' && prediction === game.away_team);
      
      if (isCorrect) {
        correct++;
        byConfidence[confidence].correct++;
      }
    });
    
    // Calculate accuracy percentages
    const accuracy = (correct / completedGames.length) * 100;
    
    Object.keys(byConfidence).forEach(level => {
      const confidenceLevel = level as keyof typeof byConfidence;
      const { total, correct } = byConfidence[confidenceLevel];
      byConfidence[confidenceLevel].accuracy = total > 0 ? (correct / total) * 100 : 0;
    });
    
    setStats({
      total: completedGames.length,
      correct,
      accuracy,
      byConfidence
    });
  };
  
  // Get color based on accuracy percentage
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 70) return '#4CAF50'; // Green
    if (accuracy >= 50) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };
  
  // Get icon based on prediction correctness
  const getPredictionIcon = (game: Game): JSX.Element => {
    if (!game.ai_prediction || !game.game_result || game.game_result.status !== 'finished') {
      return <Ionicons name="help-circle" size={24} color="#757575" />;
    }
    
    const prediction = game.ai_prediction.predicted_winner;
    const result = game.game_result.winner;
    
    const isCorrect = 
      (result === 'home' && prediction === game.home_team) || 
      (result === 'away' && prediction === game.away_team);
    
    return isCorrect ? 
      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" /> : 
      <Ionicons name="close-circle" size={24} color="#F44336" />;
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading bet comparisons...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bet Comparison</Text>
      <Text style={styles.subtitle}>
        Compare AI predictions with actual game results
      </Text>
      
      <PremiumFeature>
        {/* Overall Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Prediction Accuracy</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Games</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.correct}</Text>
              <Text style={styles.statLabel}>Correct Picks</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text 
                style={[
                  styles.statValue, 
                  { color: getAccuracyColor(stats.accuracy) }
                ]}
              >
                {stats.accuracy.toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
          
          <Text style={styles.confidenceTitle}>Accuracy by Confidence Level</Text>
          
          <View style={styles.confidenceContainer}>
            {Object.entries(stats.byConfidence).map(([level, data]) => (
              <View key={level} style={styles.confidenceItem}>
                <View 
                  style={[
                    styles.confidenceIndicator,
                    { 
                      backgroundColor: 
                        level === 'high' ? '#4CAF50' : 
                        level === 'medium' ? '#FFC107' : '#F44336'
                    }
                  ]}
                />
                <Text style={styles.confidenceLevel}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
                <Text style={styles.confidenceAccuracy}>
                  {data.accuracy.toFixed(1)}% ({data.correct}/{data.total})
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Game Comparisons */}
        <Text style={styles.sectionTitle}>Game by Game Comparison</Text>
        
        {gamesWithResults.length === 0 ? (
          <Text style={styles.noGamesText}>No games available for comparison</Text>
        ) : (
          gamesWithResults.map((game, index) => (
            <View key={index} style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <Text style={styles.gameMatchup}>
                  {game.home_team} vs {game.away_team}
                </Text>
                {getPredictionIcon(game)}
              </View>
              
              <View style={styles.comparisonContainer}>
                <View style={styles.predictionSide}>
                  <Text style={styles.sideTitle}>AI Prediction</Text>
                  
                  {game.ai_prediction ? (
                    <>
                      <Text style={styles.predictionText}>
                        <Text style={styles.bold}>Pick: </Text>
                        {game.ai_prediction.predicted_winner}
                      </Text>
                      
                      <View 
                        style={[
                          styles.confidenceTag,
                          { 
                            backgroundColor: 
                              game.ai_prediction.confidence === 'high' ? '#4CAF50' : 
                              game.ai_prediction.confidence === 'medium' ? '#FFC107' : '#F44336'
                          }
                        ]}
                      >
                        <Text style={styles.confidenceTagText}>
                          {game.ai_prediction.confidence.toUpperCase()} CONFIDENCE
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noPredictionText}>No prediction available</Text>
                  )}
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.resultSide}>
                  <Text style={styles.sideTitle}>Actual Result</Text>
                  
                  {game.game_result ? (
                    game.game_result.status === 'finished' ? (
                      <>
                        <Text style={styles.resultText}>
                          <Text style={styles.bold}>Score: </Text>
                          {game.home_team} {game.game_result.home_score} - {game.game_result.away_score} {game.away_team}
                        </Text>
                        
                        <Text style={styles.resultText}>
                          <Text style={styles.bold}>Winner: </Text>
                          {game.game_result.winner === 'home' ? game.home_team : game.away_team}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.resultStatus}>
                        Game {game.game_result.status.replace('_', ' ')}
                      </Text>
                    )
                  ) : (
                    <Text style={styles.noPredictionText}>No result available</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </PremiumFeature>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confidenceContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
  },
  confidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  confidenceLevel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    width: 70,
  },
  confidenceAccuracy: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  noGamesText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gameMatchup: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  comparisonContainer: {
    flexDirection: 'row',
  },
  predictionSide: {
    flex: 1,
    padding: 8,
  },
  resultSide: {
    flex: 1,
    padding: 8,
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  sideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 8,
  },
  predictionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noPredictionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  confidenceTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  }
});

export default BetComparisonScreen;