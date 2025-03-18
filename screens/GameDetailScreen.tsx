/**
 * Game Detail Screen
 * 
 * Displays detailed information about a game, including odds if purchased.
 * Includes the OddsButton component for purchasing odds and betting on FanDuel.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Image,
  TouchableOpacity
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import OddsButton from '../components/OddsButton';
import Colors from '../constants/Colors';
import { useThemeColor } from '../hooks/useThemeColor';

// Mock user for demo purposes
const MOCK_USER = {
  id: 'user123',
  displayName: 'Demo User',
  email: 'demo@example.com',
};

/**
 * Game Detail Screen Component
 */
const GameDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { game } = (route.params as any) || {
    game: {
      id: 'game123',
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      homeScore: 105,
      awayScore: 98,
      quarter: 4,
      timeRemaining: '2:30',
      date: 'Mar 17, 2025',
      time: '8:00 PM',
      venue: 'Staples Center',
      homeTeamLogo: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
      awayTeamLogo: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
      sport: 'basketball',
      league: 'NBA',
      status: 'in-progress',
      homeOdds: '-110',
      awayOdds: '-110',
      overUnder: '220.5',
      homeLine: '-4.5',
      awayLine: '+4.5',
    }
  };

  // Define game stats interface
  interface GameStats {
    home: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
      fieldGoalPercentage: string;
      threePointPercentage: string;
    };
    away: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
      fieldGoalPercentage: string;
      threePointPercentage: string;
    };
  }

  // State
  const [hasPurchasedOdds, setHasPurchasedOdds] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  
  // Theme colors
  const backgroundColor = useThemeColor({ light: '#f5f5f5', dark: '#151718' }, 'background');
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#1e1f20' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#ffffff' }, 'text');
  const secondaryTextColor = useThemeColor({ light: '#666666', dark: '#a0a0a0' }, 'text');
  
  // Check if user has purchased odds for this game
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, this would use the actual user ID
        const userId = MOCK_USER.id;
        
        // Call Firebase function to check purchase status
        if (functions) {
          const checkStatus = httpsCallable(functions, 'checkPurchaseStatus');
          const result = await checkStatus({
            userId,
            gameId: game.id,
          });
          
          // Type assertion for result.data
          const data = result.data as { hasPurchased: boolean };
          setHasPurchasedOdds(data.hasPurchased);
        }
        
        // Fetch game stats
        // In a real app, this would call an API to get live stats
        setGameStats({
          home: {
            points: game.homeScore,
            rebounds: 42,
            assists: 23,
            steals: 7,
            blocks: 5,
            turnovers: 12,
            fieldGoalPercentage: '48.3%',
            threePointPercentage: '37.5%',
          },
          away: {
            points: game.awayScore,
            rebounds: 38,
            assists: 19,
            steals: 9,
            blocks: 3,
            turnovers: 15,
            fieldGoalPercentage: '45.1%',
            threePointPercentage: '33.3%',
          },
        });
      } catch (error) {
        console.error('Error checking purchase status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPurchaseStatus();
  }, [game.id]);
  
  // Handle purchase success
  const handlePurchaseSuccess = () => {
    console.log('GameDetailScreen: Purchase success callback triggered');
    setHasPurchasedOdds(true);
    console.log('GameDetailScreen: hasPurchasedOdds set to true');
  };
  
  // Render game header
  const renderGameHeader = () => (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      <View style={styles.gameStatus}>
        <ThemedText style={styles.gameStatusText}>
          {game.status === 'in-progress' 
            ? `Q${game.quarter} - ${game.timeRemaining}`
            : `${game.date} - ${game.time}`
          }
        </ThemedText>
      </View>
      
      <View style={styles.teamsContainer}>
        <View style={styles.teamContainer}>
          <Image source={{ uri: game.homeTeamLogo }} style={styles.teamLogo} />
          <ThemedText style={styles.teamName}>{game.homeTeam}</ThemedText>
          <ThemedText style={styles.teamScore}>{game.homeScore}</ThemedText>
        </View>
        
        <View style={styles.vsContainer}>
          <ThemedText style={styles.vsText}>VS</ThemedText>
        </View>
        
        <View style={styles.teamContainer}>
          <Image source={{ uri: game.awayTeamLogo }} style={styles.teamLogo} />
          <ThemedText style={styles.teamName}>{game.awayTeam}</ThemedText>
          <ThemedText style={styles.teamScore}>{game.awayScore}</ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.venueText}>{game.venue}</ThemedText>
    </View>
  );
  
  // Render game stats
  const renderGameStats = () => {
    if (!gameStats) return null;
    
    return (
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText style={styles.sectionTitle}>Game Stats</ThemedText>
        
        <View style={styles.statsHeader}>
          <ThemedText style={[styles.statsHeaderText, { flex: 2 }]}></ThemedText>
          <ThemedText style={styles.statsHeaderText}>{game.homeTeam}</ThemedText>
          <ThemedText style={styles.statsHeaderText}>{game.awayTeam}</ThemedText>
        </View>
        
        <View style={styles.statsRow}>
          <ThemedText style={[styles.statLabel, { flex: 2 }]}>Points</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.home.points}</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.away.points}</ThemedText>
        </View>
        
        <View style={styles.statsRow}>
          <ThemedText style={[styles.statLabel, { flex: 2 }]}>Rebounds</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.home.rebounds}</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.away.rebounds}</ThemedText>
        </View>
        
        <View style={styles.statsRow}>
          <ThemedText style={[styles.statLabel, { flex: 2 }]}>Assists</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.home.assists}</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.away.assists}</ThemedText>
        </View>
        
        <View style={styles.statsRow}>
          <ThemedText style={[styles.statLabel, { flex: 2 }]}>FG%</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.home.fieldGoalPercentage}</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.away.fieldGoalPercentage}</ThemedText>
        </View>
        
        <View style={styles.statsRow}>
          <ThemedText style={[styles.statLabel, { flex: 2 }]}>3PT%</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.home.threePointPercentage}</ThemedText>
          <ThemedText style={styles.statValue}>{gameStats.away.threePointPercentage}</ThemedText>
        </View>
      </View>
    );
  };
  
  // Render odds section
  const renderOddsSection = () => {
    console.log(`Rendering odds section. hasPurchasedOdds: ${hasPurchasedOdds}`);
    
    return (
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText style={styles.sectionTitle}>Betting Odds</ThemedText>
        
        {!hasPurchasedOdds ? (
          <View style={styles.oddsButtonContainer}>
            <ThemedText style={styles.oddsPromptText}>
              Get exclusive betting odds and insights for this game
            </ThemedText>
            
            <OddsButton
              key={`odds-button-${hasPurchasedOdds}`}
              game={game}
              userId={MOCK_USER.id}
              hasPurchasedOdds={hasPurchasedOdds}
              onPurchaseSuccess={handlePurchaseSuccess}
              size="large"
              style={styles.oddsButton}
            />
          </View>
        ) : (
          <View style={styles.oddsContainer}>
            <View style={styles.oddsRow}>
              <View style={styles.oddsLabelContainer}>
                <ThemedText style={styles.oddsLabel}>Spread</ThemedText>
              </View>
              <View style={styles.oddsValueContainer}>
                <ThemedText style={styles.oddsTeam}>{game.homeTeam}</ThemedText>
                <ThemedText style={styles.oddsValue}>{game.homeLine} ({game.homeOdds})</ThemedText>
              </View>
              <View style={styles.oddsValueContainer}>
                <ThemedText style={styles.oddsTeam}>{game.awayTeam}</ThemedText>
                <ThemedText style={styles.oddsValue}>{game.awayLine} ({game.awayOdds})</ThemedText>
              </View>
            </View>
            
            <View style={styles.oddsRow}>
              <View style={styles.oddsLabelContainer}>
                <ThemedText style={styles.oddsLabel}>Total</ThemedText>
              </View>
              <View style={styles.oddsValueContainer}>
                <ThemedText style={styles.oddsTeam}>Over</ThemedText>
                <ThemedText style={styles.oddsValue}>{game.overUnder} (-110)</ThemedText>
              </View>
              <View style={styles.oddsValueContainer}>
                <ThemedText style={styles.oddsTeam}>Under</ThemedText>
                <ThemedText style={styles.oddsValue}>{game.overUnder} (-110)</ThemedText>
              </View>
            </View>
            
            <View style={styles.oddsRow}>
              <View style={styles.oddsLabelContainer}>
                <ThemedText style={styles.oddsLabel}>Moneyline</ThemedText>
              </View>
              <View style={styles.oddsValueContainer}>
                <ThemedText style={styles.oddsTeam}>{game.homeTeam}</ThemedText>
                <ThemedText style={styles.oddsValue}>-180</ThemedText>
              </View>
              <View style={styles.oddsValueContainer}>
                <ThemedText style={styles.oddsTeam}>{game.awayTeam}</ThemedText>
                <ThemedText style={styles.oddsValue}>+150</ThemedText>
              </View>
            </View>
            
            <View style={styles.betNowContainer}>
              <OddsButton
                key={`bet-now-button-${hasPurchasedOdds}`}
                game={game}
                userId={MOCK_USER.id}
                hasPurchasedOdds={hasPurchasedOdds}
                size="large"
                style={styles.betNowButton}
              />
            </View>
          </View>
        )}
      </View>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.neon.blue} />
        <ThemedText style={styles.loadingText}>Loading game details...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView}>
        {renderGameHeader()}
        {renderGameStats()}
        {renderOddsSection()}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gameStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 2,
    alignItems: 'center',
  },
  teamLogo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  vsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  venueText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statLabel: {
    flex: 1,
  },
  statValue: {
    flex: 1,
    textAlign: 'center',
  },
  oddsButtonContainer: {
    alignItems: 'center',
    padding: 16,
  },
  oddsPromptText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  oddsButton: {
    width: '100%',
    maxWidth: 300,
  },
  oddsContainer: {
    marginTop: 8,
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  oddsLabelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  oddsLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  oddsValueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  oddsTeam: {
    fontSize: 14,
    marginBottom: 4,
  },
  oddsValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  betNowContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  betNowButton: {
    width: '100%',
    maxWidth: 300,
  },
});

export default GameDetailScreen;