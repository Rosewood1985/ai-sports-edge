import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import ncaaBasketballService, { 
  NcaaBasketballGame, 
  NcaaBasketballGender,
  NcaaBasketballRankings
} from '../services/ncaaBasketballService';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';

// Import the RootStackParamList from the navigator file
type RootStackParamList = {
  NcaaBasketball: { gender?: NcaaBasketballGender };
  PlayerStats: { gameId: string; gameTitle?: string };
  AdvancedPlayerStats: { gameId: string; gameTitle?: string };
  // Add other routes as needed
  [key: string]: object | undefined;
};

type NcaaBasketballScreenProps = StackScreenProps<RootStackParamList, 'NcaaBasketball'>;

/**
 * Screen to display NCAA Basketball games and data
 */
const NcaaBasketballScreen: React.FC<NcaaBasketballScreenProps> = ({
  route,
  navigation
}) => {
  const { gender = 'mens' } = route.params || {};
  const [selectedGender, setSelectedGender] = useState<NcaaBasketballGender>(gender);
  const [games, setGames] = useState<NcaaBasketballGame[]>([]);
  const [rankings, setRankings] = useState<NcaaBasketballRankings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = '#0a7ea4';
  
  // Load NCAA basketball data
  useEffect(() => {
    loadData();
  }, [selectedGender]);
  
  // Load NCAA basketball data
  const loadData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Get current date
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      
      // Fetch schedule for today
      const gamesData = await ncaaBasketballService.fetchSchedule(
        year,
        month,
        day,
        selectedGender
      );
      
      setGames(gamesData);
      
      // Fetch rankings (AP poll)
      try {
        const rankingsData = await ncaaBasketballService.fetchRankings(
          'AP',
          selectedGender
        );
        setRankings(rankingsData);
      } catch (rankingsError) {
        console.error('Error fetching rankings:', rankingsError);
        // Don't set error state for rankings, just log it
      }
    } catch (error) {
      console.error('Error loading NCAA basketball data:', error);
      setError('Failed to load NCAA basketball data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadData(true);
  };
  
  // Toggle between men's and women's basketball
  const toggleGender = () => {
    setSelectedGender(selectedGender === 'mens' ? 'womens' : 'mens');
  };
  
  // Navigate to player stats screen
  const navigateToPlayerStats = (gameId: string, gameTitle: string) => {
    navigation.navigate('PlayerStats', { gameId, gameTitle });
  };
  
  // Format date for display
  const formatGameTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            NCAA {selectedGender === 'mens' ? "Men's" : "Women's"} Basketball
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={toggleGender}
          >
            <ThemedText style={styles.toggleButtonText}>
              Switch to {selectedGender === 'mens' ? "Women's" : "Men's"}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading games...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            NCAA {selectedGender === 'mens' ? "Men's" : "Women's"} Basketball
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={toggleGender}
          >
            <ThemedText style={styles.toggleButtonText}>
              Switch to {selectedGender === 'mens' ? "Women's" : "Men's"}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <ErrorMessage message={error} />
        
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: primaryColor }]}
          onPress={() => loadData()}
        >
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          NCAA {selectedGender === 'mens' ? "Men's" : "Women's"} Basketball
        </ThemedText>
        
        <TouchableOpacity 
          style={[styles.toggleButton, { borderColor: primaryColor }]}
          onPress={toggleGender}
        >
          <ThemedText style={[styles.toggleButtonText, { color: primaryColor }]}>
            Switch to {selectedGender === 'mens' ? "Women's" : "Men's"}
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
      >
        {/* Today's Games Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Today's Games</ThemedText>
          
          {games.length === 0 ? (
            <EmptyState
              message="No games scheduled for today."
            />
          ) : (
            games.map((game) => (
              <TouchableOpacity 
                key={game.id}
                style={[styles.gameCard, { borderColor: '#444' }]}
                onPress={() => navigateToPlayerStats(game.id, `${game.away.name} @ ${game.home.name}`)}
              >
                <View style={styles.gameHeader}>
                  <ThemedText style={styles.gameStatus}>
                    {game.status === 'scheduled' 
                      ? formatGameTime(game.scheduled) 
                      : game.status.toUpperCase()}
                  </ThemedText>
                  
                  {game.venue && (
                    <ThemedText style={styles.gameVenue}>
                      {game.venue.name}, {game.venue.city}
                    </ThemedText>
                  )}
                </View>
                
                <View style={styles.teamRow}>
                  <View style={styles.teamInfo}>
                    <ThemedText style={styles.teamName}>
                      {game.away.rank ? `#${game.away.rank} ` : ''}{game.away.name}
                    </ThemedText>
                    <ThemedText style={styles.teamMarket}>{game.away.market}</ThemedText>
                  </View>
                  
                  <ThemedText style={styles.teamScore}>
                    {game.status !== 'scheduled' ? game.away_points : '-'}
                  </ThemedText>
                </View>
                
                <View style={styles.teamRow}>
                  <View style={styles.teamInfo}>
                    <ThemedText style={styles.teamName}>
                      {game.home.rank ? `#${game.home.rank} ` : ''}{game.home.name}
                    </ThemedText>
                    <ThemedText style={styles.teamMarket}>{game.home.market}</ThemedText>
                  </View>
                  
                  <ThemedText style={styles.teamScore}>
                    {game.status !== 'scheduled' ? game.home_points : '-'}
                  </ThemedText>
                </View>
                
                {game.tournament && (
                  <View style={styles.tournamentTag}>
                    <ThemedText style={styles.tournamentText}>
                      {game.tournament.name} - {game.tournament.round}
                    </ThemedText>
                  </View>
                )}
                
                <View style={styles.statsButton}>
                  <Ionicons name="stats-chart" size={16} color={primaryColor} />
                  <ThemedText style={[styles.statsButtonText, { color: primaryColor }]}>
                    View Player Stats
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        
        {/* Rankings Section */}
        {rankings && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {rankings.poll_name} Rankings
            </ThemedText>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {rankings.teams.slice(0, 25).map((team) => (
                <View 
                  key={team.id}
                  style={[styles.rankingCard, { borderColor: '#444' }]}
                >
                  <ThemedText style={styles.rankingNumber}>#{team.rank}</ThemedText>
                  <ThemedText style={styles.rankingTeamName}>{team.name}</ThemedText>
                  <ThemedText style={styles.rankingTeamMarket}>{team.market}</ThemedText>
                  <ThemedText style={styles.rankingRecord}>
                    {team.wins}-{team.losses}
                  </ThemedText>
                  
                  {team.previous_rank && team.previous_rank !== team.rank && (
                    <View style={styles.rankingChange}>
                      <Ionicons 
                        name={team.previous_rank > team.rank ? "arrow-up" : "arrow-down"} 
                        size={12} 
                        color={team.previous_rank > team.rank ? "#34C759" : "#FF3B30"} 
                      />
                      <ThemedText 
                        style={[
                          styles.rankingChangeText,
                          { 
                            color: team.previous_rank > team.rank ? "#34C759" : "#FF3B30" 
                          }
                        ]}
                      >
                        {Math.abs(team.previous_rank - team.rank)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 8,
  },
  gameCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameVenue: {
    fontSize: 12,
    opacity: 0.7,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
  },
  teamMarket: {
    fontSize: 14,
    opacity: 0.7,
  },
  teamScore: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  tournamentTag: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  tournamentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  statsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  rankingCard: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rankingTeamName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  rankingTeamMarket: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 4,
  },
  rankingRecord: {
    fontSize: 14,
    fontWeight: '500',
  },
  rankingChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rankingChangeText: {
    fontSize: 12,
    marginLeft: 2,
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
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NcaaBasketballScreen;