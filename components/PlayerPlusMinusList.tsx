import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';

import EmptyState from './EmptyState';
import ErrorMessage from './ErrorMessage';
import PlayerPlusMinusCard from './PlayerPlusMinusCard';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import {
  PlayerPlusMinus,
  getGamePlusMinus,
  listenToPlayerPlusMinus,
} from '../services/playerStatsService';

interface PlayerPlusMinusListProps {
  gameId: string;
  title?: string;
  onPlayerPress?: (player: PlayerPlusMinus) => void;
}

/**
 * Component to display a list of players' plus-minus statistics for a game
 */
const PlayerPlusMinusList: React.FC<PlayerPlusMinusListProps> = ({
  gameId,
  title = 'Player Plus/Minus',
  onPlayerPress,
}) => {
  const [players, setPlayers] = useState<PlayerPlusMinus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount

    // Initial fetch of player data
    const fetchPlayers = async () => {
      if (!isMounted) return;

      try {
        if (isMounted) setLoading(true);
        const playerData = await getGamePlusMinus(gameId);
        if (isMounted) {
          setPlayers(playerData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching player plus-minus data:', err);
        if (isMounted) setError('Failed to load player statistics');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPlayers();

    // Set up real-time listener for updates
    const unsubscribe = listenToPlayerPlusMinus(gameId, updatedPlayers => {
      if (isMounted) setPlayers(updatedPlayers);
    });

    // Clean up listener on unmount
    return () => {
      isMounted = false; // Prevent state updates after unmount
      unsubscribe();
    };
  }, [gameId]);

  // Sort players by plus-minus (highest to lowest)
  const sortedPlayers = [...players].sort((a, b) => b.plusMinus - a.plusMinus);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ActivityIndicator size="large" style={styles.loader} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ErrorMessage message={error} />
      </View>
    );
  }

  if (players.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <EmptyState message="No player statistics available. Check back during or after the game." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ThemedText style={styles.title}>{title}</ThemedText>

      <FlatList
        data={sortedPlayers}
        keyExtractor={item => `${item.gameId}_${item.playerId}`}
        renderItem={({ item }) => (
          <PlayerPlusMinusCard
            playerData={item}
            onPress={onPlayerPress ? () => onPlayerPress(item) : undefined}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
});

export default PlayerPlusMinusList;
