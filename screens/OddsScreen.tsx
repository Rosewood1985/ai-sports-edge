import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  SectionList
} from "react-native";
import useOddsData from "../hooks/useOddsData";
import GameCard from "../components/GameCard";
import Header from "../components/Header";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import { StackNavigationProp } from "@react-navigation/stack";
import { Game, ConfidenceLevel } from "../types/odds";
import PremiumFeature from "../components/PremiumFeature";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentLocation, filterLocalGames } from "../services/geolocationService";
import { Location } from "../services/geolocationService";
import { trackScreenView } from "../services/analyticsService";
import { useTheme } from "../contexts/ThemeContext";

type OddsScreenProps = {
  navigation: StackNavigationProp<any, 'Odds'>;
};

/**
 * OddsScreen component displays live betting odds
 * @param {OddsScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export default function OddsScreen({ navigation }: OddsScreenProps): JSX.Element {
  const [refreshing, setRefreshing] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [localGames, setLocalGames] = useState<Game[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'local'>('all');
  const { colors, isDark } = useTheme();
  
  // Use our custom hook to manage odds data, loading state, and errors
  const {
    data: odds,
    loading,
    error,
    refresh,
    dailyInsights,
    refreshLiveData
  } = useOddsData("americanfootball_nfl");
  
  // Track screen view
  useEffect(() => {
    trackScreenView('OddsScreen');
  }, []);
  
  // Get user location and filter local games
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        
        if (location && odds.length > 0) {
          const local = filterLocalGames(odds, location);
          setLocalGames(local);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };
    
    getLocation();
  }, [odds]);

  // Set up auto-refresh for live data
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshLiveData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [refreshLiveData]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

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

  // Navigate to game details
  const handleGamePress = (game: Game) => {
    // In a real app, this would navigate to a game details screen
    console.log("Game pressed:", game.id);
  };

  // Daily Insights Widget
  const renderDailyInsightsWidget = () => {
    if (!dailyInsights || !showInsights) return null;
    
    return (
      <PremiumFeature>
        <View style={styles.insightsContainer}>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsTitle}>Daily Betting Insights</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInsights(false)}
            >
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.insightsDate}>
            {new Date(dailyInsights.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          
          <Text style={styles.sectionTitle}>Top Picks</Text>
          {dailyInsights.top_picks.map((pick, index) => (
            <View key={index} style={styles.pickContainer}>
              <View style={styles.pickHeader}>
                <Text style={styles.pickMatchup}>
                  {pick.home_team} vs {pick.away_team}
                </Text>
                <View
                  style={[
                    styles.confidenceTag,
                    { backgroundColor: getConfidenceColor(pick.confidence) }
                  ]}
                >
                  <Text style={styles.confidenceTagText}>
                    {pick.confidence.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.pickText}>
                <Text style={styles.bold}>Pick: </Text>{pick.pick}
              </Text>
              <Text style={styles.pickReasoning}>
                {pick.reasoning}
              </Text>
            </View>
          ))}
          
          <Text style={styles.sectionTitle}>Trending Bets</Text>
          {dailyInsights.trending_bets.map((bet, index) => (
            <View key={index} style={styles.trendingBet}>
              <Ionicons name="trending-up" size={16} color="#3498db" />
              <Text style={styles.trendingBetText}>{bet.description}</Text>
            </View>
          ))}
        </View>
      </PremiumFeature>
    );
  };

  // For ScrollView implementation
  const renderScrollView = (): JSX.Element => (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={["#3498db"]}
        />
      }
    >
      <View style={styles.headerRow}>
        <Header
          title="Live Betting Odds"
          onRefresh={refresh}
          isLoading={loading}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.viewModeButton, 
              viewMode === 'all' && styles.activeViewModeButton
            ]}
            onPress={() => setViewMode('all')}
          >
            <Ionicons 
              name="globe-outline" 
              size={16} 
              color={viewMode === 'all' ? '#fff' : colors.primary} 
            />
            <Text 
              style={[
                styles.viewModeButtonText,
                viewMode === 'all' && styles.activeViewModeButtonText
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.viewModeButton, 
              viewMode === 'local' && styles.activeViewModeButton,
              localGames.length === 0 && styles.disabledButton
            ]}
            onPress={() => setViewMode('local')}
            disabled={localGames.length === 0}
          >
            <Ionicons 
              name="location-outline" 
              size={16} 
              color={viewMode === 'local' ? '#fff' : localGames.length === 0 ? '#ccc' : colors.primary} 
            />
            <Text 
              style={[
                styles.viewModeButtonText,
                viewMode === 'local' && styles.activeViewModeButtonText,
                localGames.length === 0 && styles.disabledButtonText
              ]}
            >
              Local
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.comparisonButton}
            onPress={() => navigation.navigate('BetComparison', { games: odds })}
          >
            <Ionicons name="analytics-outline" size={16} color="#fff" />
            <Text style={styles.comparisonButtonText}>Bet Comparison</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {userLocation && userLocation.city && viewMode === 'local' && (
        <Text style={styles.locationText}>
          <Ionicons name="location" size={14} color={colors.primary} />
          {' '}Showing games near {userLocation.city}, {userLocation.state}
        </Text>
      )}
      
      {/* Daily Insights Widget */}
      {renderDailyInsightsWidget()}
      
      {loading && !refreshing && <LoadingIndicator message="Loading odds..." />}
      
      {error && <ErrorMessage message={error} />}
      
      {!loading && viewMode === 'all' && odds.length === 0 && !error && (
        <EmptyState message="No odds data available" />
      )}
      
      {!loading && viewMode === 'local' && localGames.length === 0 && !error && (
        <EmptyState message="No local games found in your area" />
      )}
      
      {viewMode === 'all' && odds.map((game, index) => (
        <GameCard
          key={`game-${index}`}
          game={game}
          onPress={handleGamePress}
        />
      ))}
      
      {viewMode === 'local' && localGames.map((game, index) => (
        <GameCard
          key={`local-game-${index}`}
          game={game}
          onPress={handleGamePress}
          isLocalGame={true}
        />
      ))}
    </ScrollView>
  );

  // Use ScrollView for now since the list is likely small
  // Switch to renderFlatList() if the list becomes large
  return renderScrollView();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  activeViewModeButton: {
    backgroundColor: '#3498db',
  },
  disabledButton: {
    borderColor: '#ccc',
    opacity: 0.7,
  },
  viewModeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    marginLeft: 4,
  },
  activeViewModeButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#ccc',
  },
  comparisonButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  comparisonButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  insightsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  insightsDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 4,
  },
  pickContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickMatchup: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  confidenceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pickText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  pickReasoning: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  trendingBet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trendingBetText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
  },
  bold: {
    fontWeight: 'bold',
  }
});