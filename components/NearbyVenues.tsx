import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { geolocationService } from '../services/geolocationService';
import { venueService, Venue } from '../services/venueService';

interface NearbyVenuesProps {
  maxDistance?: number;
  limit?: number;
  onRefresh?: () => void;
}

/**
 * Component that displays nearby sports venues based on user's location
 */
const NearbyVenues: React.FC<NearbyVenuesProps> = ({ maxDistance = 50, limit = 5, onRefresh }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNearbyVenues();
  }, [maxDistance, limit]);

  /**
   * Load nearby venues based on user's location
   */
  const loadNearbyVenues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user location
      const location = await geolocationService.getUserLocation();

      if (!location) {
        setError('Unable to determine your location. Please check your location settings.');
        setLoading(false);
        return;
      }

      // Get nearby venues
      const nearbyVenues = await venueService.getNearbyVenues(location, maxDistance, limit);

      if (nearbyVenues.length === 0) {
        setError('No venues found near your location.');
        setLoading(false);
        return;
      }

      setVenues(nearbyVenues);
      setLoading(false);
    } catch (error) {
      console.error('Error loading nearby venues:', error);
      setError('An error occurred while loading nearby venues. Please try again later.');
      setLoading(false);
    }
  };

  /**
   * Handle refresh button press
   */
  const handleRefresh = () => {
    loadNearbyVenues();
    if (onRefresh) {
      onRefresh();
    }
  };

  /**
   * Open venue location in maps app
   */
  const openInMaps = (venue: Venue) => {
    const { latitude, longitude, name } = venue;
    const url = `https://maps.apple.com/?q=${name}&ll=${latitude},${longitude}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback for Android or if Apple Maps is not available
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          Linking.openURL(googleMapsUrl);
        }
      })
      .catch(err => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Finding nearby venues...</ThemedText>
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
   * Render venue item
   */
  const renderVenueItem = ({ item }: { item: Venue }) => {
    return (
      <ThemedView style={styles.venueItem}>
        <View style={styles.venueHeader}>
          <ThemedText style={styles.venueName}>{item.name}</ThemedText>
          <TouchableOpacity style={styles.mapButton} onPress={() => openInMaps(item)}>
            <Ionicons name="map-outline" size={24} color="#0a7ea4" />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.venueLocation}>
          {item.city}, {item.state}
        </ThemedText>

        <View style={styles.venueDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <ThemedText style={styles.detailText}>
              Capacity: {item.capacity.toLocaleString()}
            </ThemedText>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <ThemedText style={styles.detailText}>
              {item.distance ? `${item.distance.toFixed(1)} km away` : 'Distance unknown'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.teamsContainer}>
          <ThemedText style={styles.teamsTitle}>Home to:</ThemedText>
          {item.teams.map((team, index) => (
            <ThemedText key={index} style={styles.teamText}>
              • {team}
            </ThemedText>
          ))}
        </View>

        <View style={styles.sportsContainer}>
          {item.sports.map((sport, index) => (
            <View key={index} style={styles.sportBadge}>
              <ThemedText style={styles.sportText}>{sport}</ThemedText>
            </View>
          ))}
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <ThemedText style={styles.headerText}>Nearby Venues</ThemedText>
        <TouchableOpacity style={styles.refreshIcon} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={venues}
        renderItem={renderVenueItem}
        keyExtractor={item => item.id}
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
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshIcon: {
    padding: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  venueItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  mapButton: {
    padding: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  venueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  teamsContainer: {
    marginBottom: 12,
  },
  teamsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sportBadge: {
    backgroundColor: '#e6f7ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  sportText: {
    fontSize: 12,
    color: '#0a7ea4',
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

export default NearbyVenues;
