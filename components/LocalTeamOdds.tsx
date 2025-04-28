import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { geolocationService, LocationData, OddsSuggestion } from '../services/geolocationService';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useNavigation } from '@react-navigation/native';
import BetNowButton from './BetNowButton';

interface LocalTeamOddsProps {
  onRefresh?: () => void;
}

/**
 * Component that displays local team odds based on user's location
 */
const LocalTeamOdds: React.FC<LocalTeamOddsProps> = ({ onRefresh }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [localTeams, setLocalTeams] = useState<string[]>([]);
  const [oddsSuggestions, setOddsSuggestions] = useState<OddsSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadLocalTeamOdds();
  }, []);

  /**
   * Load local team odds based on user's location
   */
  const loadLocalTeamOdds = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize the geolocation service if not already initialized
      if (!geolocationService.isInitialized()) {
        // The API key should be set in the .env file or app.json
        geolocationService.initialize('');
      }

      // Get user location
      const locationData = await geolocationService.getUserLocation();
      setLocation(locationData);

      if (!locationData) {
        setError('Unable to determine your location. Please check your location settings.');
        setLoading(false);
        return;
      }

      // Get local teams
      const teams = await geolocationService.getLocalTeams(locationData);
      setLocalTeams(teams);

      if (teams.length === 0) {
        setError('No local teams found for your location.');
        setLoading(false);
        return;
      }

      // Get odds suggestions
      const suggestions = await geolocationService.getLocalizedOddsSuggestions(teams);
      setOddsSuggestions(suggestions);

      setLoading(false);
    } catch (error) {
      console.error('Error loading local team odds:', error);
      setError('An error occurred while loading local team odds. Please try again later.');
      setLoading(false);
    }
  };

  /**
   * Handle refresh button press
   */
  const handleRefresh = () => {
    loadLocalTeamOdds();
    if (onRefresh) {
      onRefresh();
    }
  };

  /**
   * Handle bet now button press
   */
  const handleBetNow = (suggestion: OddsSuggestion) => {
    Alert.alert(
      'Place Bet',
      `Would you like to place a bet on ${suggestion.game} with odds ${suggestion.odds.toFixed(2)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Bet Now',
          onPress: () => {
            // Navigate to betting screen or open affiliate link
            // This is a placeholder for the actual implementation
            Alert.alert('Betting', `Placing bet on ${suggestion.game}`);
          },
        },
      ]
    );
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Finding local teams...</ThemedText>
      </ThemedView>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <ThemedText style={styles.refreshButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  /**
   * Render odds suggestion item
   */
  const renderOddsSuggestion = ({ item }: { item: OddsSuggestion }) => {
    const isBetSuggested = item.suggestion === 'bet';

    return (
      <ThemedView style={[styles.oddsSuggestionItem, isBetSuggested ? styles.betSuggested : styles.avoidSuggested]}>
        <View style={styles.oddsSuggestionContent}>
          <ThemedText style={styles.gameText}>{item.game}</ThemedText>
          <View style={styles.oddsRow}>
            <ThemedText style={styles.oddsText}>Odds: {item.odds.toFixed(2)}</ThemedText>
            <View style={[styles.suggestionBadge, isBetSuggested ? styles.betBadge : styles.avoidBadge]}>
              <ThemedText style={styles.suggestionText}>
                {isBetSuggested ? 'Recommended' : 'Not Recommended'}
              </ThemedText>
            </View>
          </View>
        </View>
        {isBetSuggested && (
          <BetNowButton
            contentType="local-odds"
            gameId={item.team}
            style={styles.betButton}
            textStyle={styles.betButtonText}
          />
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <ThemedText style={styles.headerText}>Local Team Odds</ThemedText>
        {location && (
          <ThemedText style={styles.locationText}>
            {location.city}, {location.state}
          </ThemedText>
        )}
        <TouchableOpacity style={styles.refreshIcon} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={oddsSuggestions}
        renderItem={renderOddsSuggestion}
        keyExtractor={(item, index) => `odds-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    flex: 1,
  },
  refreshIcon: {
    padding: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  oddsSuggestionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  betSuggested: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  avoidSuggested: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  oddsSuggestionContent: {
    flex: 1,
  },
  gameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  oddsText: {
    fontSize: 16,
    color: '#666',
  },
  suggestionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  betBadge: {
    backgroundColor: '#2ecc71',
  },
  avoidBadge: {
    backgroundColor: '#e74c3c',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  betButton: {
    marginTop: 12,
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  betButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LocalTeamOdds;