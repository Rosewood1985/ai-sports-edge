/**
 * API Caching Example
 *
 * This example demonstrates how to use the enhanced API caching mechanism
 * in a React component.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { apiService } from 'atomic/organisms';

/**
 * GamesList Component
 *
 * This component demonstrates how to use the enhanced API service with caching.
 */
const GamesList = () => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load games with caching
  const loadGames = async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Get games using the enhanced API service
      // The service will automatically use cache if available and not expired
      const gamesData = await apiService.getGames('all', useCache);

      setGames(gamesData);
    } catch (err) {
      console.error('Error loading games:', err);
      setError('Failed to load games. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load with cache
  useEffect(() => {
    loadGames(true);
  }, []);

  // Handle refresh - force reload without cache
  const handleRefresh = () => {
    setRefreshing(true);
    loadGames(false);
  };

  // Handle clear cache
  const handleClearCache = async () => {
    try {
      // Clear cache for games endpoint
      await apiService.clearCache('/games');

      // Reload games
      loadGames(true);
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError('Failed to clear cache. Please try again.');
    }
  };

  // Render game item
  const renderGameItem = ({ item }: { item: any }) => (
    <View style={styles.gameItem}>
      <Text style={styles.gameTitle}>{item.title}</Text>
      <Text style={styles.gameInfo}>
        {item.homeTeam} vs {item.awayTeam}
      </Text>
      <Text style={styles.gameTime}>{new Date(item.startTime).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Games</Text>
        <TouchableOpacity onPress={handleClearCache} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadGames(false)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={<Text style={styles.emptyText}>No games available</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 16,
  },
  gameItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  gameInfo: {
    fontSize: 16,
    marginBottom: 4,
    color: '#555',
  },
  gameTime: {
    fontSize: 14,
    color: '#777',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#cc0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default GamesList;
