/**
 * ParlayOddsScreen Component
 *
 * Screen for displaying and managing parlay odds.
 * Allows users to select games, view parlay odds, and place bets.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';

import ParlayOddsCard from '../components/ParlayOddsCard';
import Colors from '../constants/Colors';
import { useThemeColor } from '../hooks/useThemeColor';
import { analyticsService } from '../services/analyticsService';
import { parlayOddsService } from '../services/parlayOddsService';

// Define the game object structure
interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  startTime: Date;
  league: string;
  isSelected?: boolean;
}

/**
 * ParlayOddsScreen Component
 */
const ParlayOddsScreen: React.FC<any> = ({ navigation, route }) => {
  // State
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#F8F8F8', dark: '#121212' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const cardColor = useThemeColor({ light: '#FFFFFF', dark: '#1A1A1A' }, 'background');

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user123';

  // Load games and check access on mount
  useEffect(() => {
    loadGames();
    checkAccess();

    // Track screen view
    analyticsService.trackEvent('screen_view', {
      screen_name: 'ParlayOddsScreen',
      userId,
    });
  }, []);

  /**
   * Check if user has access to parlay odds
   */
  const checkAccess = async () => {
    try {
      const access = await parlayOddsService.hasAccess(userId);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking parlay access:', error);
    }
  };

  /**
   * Load games from real API
   */
  const loadGames = async () => {
    try {
      setIsLoading(true);

      // Fetch games from Firebase function with parlay odds
      const response = await fetch(
        'https://us-central1-ai-sports-edge.cloudfunctions.net/featuredGames'
      );
      const data = await response.json();

      if (data.success) {
        // Transform the games data to match our interface
        const transformedGames: Game[] = data.games.map((game: any) => ({
          id: game.id,
          homeTeam: game.homeTeam?.name || 'Home',
          awayTeam: game.awayTeam?.name || 'Away',
          homeOdds: -110, // Default odds, should come from API
          awayOdds: +105, // Default odds, should come from API
          startTime: new Date(game.date),
          league: game.league || 'Unknown',
        }));

        setGames(transformedGames);
      } else {
        throw new Error('Failed to fetch games');
      }
    } catch (error) {
      console.error('Error loading games:', error);
      // Fallback to empty array instead of mock data
      setGames([]);
      Alert.alert('Error', 'Unable to load games. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle game selection
   */
  const handleGameSelect = (game: Game) => {
    // Check if game is already selected
    const isSelected = selectedGames.some(g => g.id === game.id);

    if (isSelected) {
      // Remove game from selection
      setSelectedGames(selectedGames.filter(g => g.id !== game.id));
    } else {
      // Add game to selection (max 4 games)
      if (selectedGames.length < 4) {
        setSelectedGames([...selectedGames, game]);
      } else {
        Alert.alert('Maximum Selection', 'You can select up to 4 games for a parlay.');
      }
    }

    // Track selection
    analyticsService.trackEvent('parlay_game_selection', {
      gameId: game.id,
      action: isSelected ? 'deselect' : 'select',
      userId,
    });
  };

  /**
   * Handle purchase success
   */
  const handlePurchaseSuccess = () => {
    // Update access status
    setHasAccess(true);

    // Track purchase success
    analyticsService.trackEvent('parlay_purchase_success', {
      userId,
      games: selectedGames.length,
    });
  };

  /**
   * Filter games by league
   */
  const getFilteredGames = () => {
    if (activeTab === 'all') {
      return games;
    }

    return games.filter(game => game.league === activeTab);
  };

  /**
   * Render game item
   */
  const renderGameItem = ({ item }: { item: Game }) => {
    const isSelected = selectedGames.some(g => g.id === item.id);

    return (
      <TouchableOpacity
        style={[
          styles.gameCard,
          { backgroundColor: cardColor },
          isSelected && styles.selectedGameCard,
        ]}
        onPress={() => handleGameSelect(item)}
      >
        <View style={styles.gameHeader}>
          <Text style={[styles.leagueLabel, { color: textColor }]}>{item.league}</Text>
          {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.neon.blue} />}
        </View>

        <View style={styles.matchupContainer}>
          <Text style={[styles.teamName, { color: textColor }]}>{item.homeTeam}</Text>
          <Text style={[styles.vsText, { color: textColor }]}>vs</Text>
          <Text style={[styles.teamName, { color: textColor }]}>{item.awayTeam}</Text>
        </View>

        <View style={styles.oddsContainer}>
          <View style={styles.oddsItem}>
            <Text style={[styles.oddsLabel, { color: textColor }]}>Home</Text>
            <Text style={[styles.oddsValue, { color: Colors.neon.blue }]}>
              {item.homeOdds > 0 ? `+${item.homeOdds}` : item.homeOdds}
            </Text>
          </View>

          <View style={styles.oddsItem}>
            <Text style={[styles.oddsLabel, { color: textColor }]}>Away</Text>
            <Text style={[styles.oddsValue, { color: Colors.neon.blue }]}>
              {item.awayOdds > 0 ? `+${item.awayOdds}` : item.awayOdds}
            </Text>
          </View>
        </View>

        <Text style={[styles.startTime, { color: textColor }]}>
          Starts: {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render league tabs
   */
  const renderLeagueTabs = () => {
    const leagues = ['all', 'NBA', 'NFL', 'MLB', 'NHL'];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {leagues.map(league => (
          <TouchableOpacity
            key={league}
            style={[styles.tab, activeTab === league && styles.activeTab]}
            onPress={() => setActiveTab(league)}
          >
            <Text style={[styles.tabText, activeTab === league && styles.activeTabText]}>
              {league === 'all' ? 'All Games' : league}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Parlay Builder</Text>
        <Text style={[styles.subtitle, { color: textColor }]}>
          Select 2-4 games to create a parlay
        </Text>
      </View>

      {renderLeagueTabs()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.neon.blue} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading games...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredGames()}
          renderItem={renderGameItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gamesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: textColor }]}>
                No games available for this league
              </Text>
            </View>
          }
        />
      )}

      {selectedGames.length >= 2 && (
        <View style={styles.parlayCardContainer}>
          <ParlayOddsCard
            games={selectedGames}
            userId={userId}
            hasAccess={hasAccess}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  tabsContainer: {
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeTab: {
    backgroundColor: Colors.neon.blue,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  gamesList: {
    padding: 16,
  },
  gameCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedGameCard: {
    borderWidth: 2,
    borderColor: Colors.neon.blue,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leagueLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  matchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  vsText: {
    fontSize: 14,
    marginHorizontal: 8,
    opacity: 0.7,
  },
  oddsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  oddsItem: {
    flex: 1,
  },
  oddsLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  oddsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  startTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
  parlayCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});

export default ParlayOddsScreen;
