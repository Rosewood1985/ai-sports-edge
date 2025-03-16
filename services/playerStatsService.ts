import { firebase, firestore } from '../config/firebase';
import axios from 'axios';
import sportRadarApi from '../config/sportRadarApi';
import { Alert } from 'react-native';

// Interface for player plus-minus data
export interface PlayerPlusMinus {
  playerId: string;
  playerName: string;
  team: string;
  plusMinus: number;
  timestamp: any; // Firebase timestamp
  gameId: string;
}

/**
 * Fetch real-time +/- stats for players in a game
 * @param gameId The ID of the game to fetch stats for
 * @returns Promise that resolves when stats are stored in Firestore
 */
export const fetchPlayerPlusMinus = async (gameId: string): Promise<void> => {
  try {
    // Validate game ID
    if (!gameId) {
      throw new Error(sportRadarApi.ERROR_MESSAGES.INVALID_GAME_ID);
    }

    // Build API URL
    const apiUrl = sportRadarApi.buildApiUrl(
      sportRadarApi.ENDPOINTS.NBA.GAME_SUMMARY,
      { game_id: gameId }
    );

    // Configure request with timeout
    const requestConfig = {
      timeout: sportRadarApi.REQUEST_TIMEOUT,
    };

    // Make API request to get game data
    const response = await axios.get(apiUrl, requestConfig);
    
    // Validate response data
    if (!response.data || !response.data.statistics || !response.data.statistics.players) {
      throw new Error(sportRadarApi.ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
    }
    
    const players = response.data.statistics.players;

    // Batch write to Firestore for better performance
    const batch = firestore.batch();

    // Process each player's stats
    for (const player of players) {
      // Validate player data
      if (!player.id || !player.full_name || typeof player.plus_minus !== 'number') {
        console.warn(`Skipping player with invalid data: ${JSON.stringify(player)}`);
        continue;
      }

      // Create document reference
      const docRef = firestore.collection('playerPlusMinus').doc(`${gameId}_${player.id}`);
      
      // Prepare player data
      const playerData: PlayerPlusMinus = {
        playerId: player.id,
        playerName: player.full_name,
        team: player.team,
        plusMinus: player.plus_minus,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        gameId: gameId
      };
      
      // Add to batch
      batch.set(docRef, playerData);
    }

    // Commit the batch
    await batch.commit();
    
    console.log(`Updated plus-minus stats for ${players.length} players in game ${gameId}`);
    return;
  } catch (error) {
    console.error("Error fetching player plus-minus stats:", error);
    
    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(sportRadarApi.ERROR_MESSAGES.TIMEOUT_ERROR);
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 429) {
          console.error(sportRadarApi.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
          Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
        } else {
          console.error(`API Error: ${error.response.status} - ${error.response.data}`);
          Alert.alert('Error', 'Failed to fetch player statistics. Please try again.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error(sportRadarApi.ERROR_MESSAGES.NETWORK_ERROR);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
    
    throw error;
  }
};

/**
 * Get plus-minus stats for a specific player in a game
 * @param gameId The ID of the game
 * @param playerId The ID of the player
 * @returns Promise that resolves with the player's plus-minus data
 */
export const getPlayerPlusMinus = async (gameId: string, playerId: string): Promise<PlayerPlusMinus | null> => {
  try {
    // Validate parameters
    if (!gameId) {
      throw new Error('Game ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    const docRef = firestore.collection('playerPlusMinus').doc(`${gameId}_${playerId}`);
    const doc = await docRef.get();
    
    if (doc.exists) {
      return doc.data() as PlayerPlusMinus;
    } else {
      console.log(`No plus-minus data found for player ${playerId} in game ${gameId}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting player plus-minus stats:", error);
    
    // Handle Firestore errors
    if (error instanceof Error) {
      Alert.alert('Error', `Failed to retrieve player statistics: ${error.message}`);
    } else {
      Alert.alert('Error', 'An unexpected error occurred while retrieving player statistics');
    }
    
    throw error;
  }
};

/**
 * Get plus-minus stats for all players in a game
 * @param gameId The ID of the game
 * @returns Promise that resolves with an array of player plus-minus data
 */
export const getGamePlusMinus = async (gameId: string): Promise<PlayerPlusMinus[]> => {
  try {
    // Validate game ID
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const querySnapshot = await firestore
      .collection('playerPlusMinus')
      .where('gameId', '==', gameId)
      .get();
    
    const players: PlayerPlusMinus[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Validate data before adding to the array
      if (data && data.playerId && data.playerName) {
        players.push(data as PlayerPlusMinus);
      } else {
        console.warn(`Skipping invalid player data: ${JSON.stringify(data)}`);
      }
    });
    
    // Sort players by plus-minus (highest to lowest)
    players.sort((a, b) => b.plusMinus - a.plusMinus);
    
    return players;
  } catch (error) {
    console.error("Error getting game plus-minus stats:", error);
    
    // Handle Firestore errors
    if (error instanceof Error) {
      Alert.alert('Error', `Failed to retrieve game statistics: ${error.message}`);
    } else {
      Alert.alert('Error', 'An unexpected error occurred while retrieving game statistics');
    }
    
    throw error;
  }
};

/**
 * Set up a real-time listener for plus-minus updates
 * @param gameId The ID of the game to listen for updates
 * @param callback Function to call when updates occur
 * @param onError Optional error callback
 * @returns Unsubscribe function to stop listening
 */
export const listenToPlayerPlusMinus = (
  gameId: string,
  callback: (players: PlayerPlusMinus[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  // Validate game ID
  if (!gameId) {
    const error = new Error('Game ID is required');
    if (onError) {
      onError(error);
    } else {
      console.error("Error setting up player plus-minus listener:", error);
      Alert.alert('Error', 'Failed to set up real-time updates: Game ID is required');
    }
    // Return a no-op function as unsubscribe
    return () => {};
  }

  try {
    const unsubscribe = firestore
      .collection('playerPlusMinus')
      .where('gameId', '==', gameId)
      .onSnapshot(snapshot => {
        const players: PlayerPlusMinus[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          // Validate data before adding to the array
          if (data && data.playerId && data.playerName) {
            players.push(data as PlayerPlusMinus);
          } else {
            console.warn(`Skipping invalid player data: ${JSON.stringify(data)}`);
          }
        });
        
        // Sort players by plus-minus (highest to lowest)
        players.sort((a, b) => b.plusMinus - a.plusMinus);
        
        callback(players);
      }, error => {
        console.error("Error listening to player plus-minus updates:", error);
        
        if (onError) {
          onError(error);
        } else {
          Alert.alert('Error', 'Failed to receive real-time updates. Please try again.');
        }
      });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up player plus-minus listener:", error);
    
    if (error instanceof Error && onError) {
      onError(error);
    } else {
      Alert.alert('Error', 'Failed to set up real-time updates. Please try again.');
    }
    
    // Return a no-op function as unsubscribe
    return () => {};
  }
};

/**
 * Schedule regular updates for player plus-minus stats during a live game
 * @param gameId The ID of the game to update
 * @param intervalMinutes How often to update (in minutes)
 * @param onError Optional error callback
 * @returns Function to stop the scheduled updates
 */
export const schedulePlayerPlusMinusUpdates = (
  gameId: string,
  intervalMinutes: number = 1,
  onError?: (error: Error) => void
): (() => void) => {
  // Validate parameters
  if (!gameId) {
    const error = new Error('Game ID is required');
    if (onError) {
      onError(error);
    } else {
      console.error("Error scheduling player plus-minus updates:", error);
      Alert.alert('Error', 'Failed to schedule updates: Game ID is required');
    }
    // Return a no-op function
    return () => {};
  }

  if (intervalMinutes <= 0) {
    console.warn(`Invalid interval: ${intervalMinutes} minutes. Using default of 1 minute.`);
    intervalMinutes = 1;
  }

  // Track consecutive errors
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  // Function to handle errors
  const handleError = (error: any) => {
    consecutiveErrors++;
    console.error(`Error in player plus-minus fetch (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error);
    
    if (onError && error instanceof Error) {
      onError(error);
    }
    
    // If we've had too many consecutive errors, stop the updates
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`Too many consecutive errors (${consecutiveErrors}). Stopping updates.`);
      clearInterval(intervalId);
      Alert.alert(
        'Updates Stopped',
        'Player statistics updates have been stopped due to repeated errors. Please try again later.'
      );
    }
  };

  // Function to fetch data
  const fetchData = async () => {
    try {
      await fetchPlayerPlusMinus(gameId);
      // Reset error count on success
      consecutiveErrors = 0;
    } catch (error) {
      handleError(error);
    }
  };

  // Initial fetch
  fetchData();
  
  // Set up interval for regular updates
  const intervalId = setInterval(fetchData, intervalMinutes * 60 * 1000);
  
  // Return function to clear the interval
  return () => clearInterval(intervalId);
};

export default {
  fetchPlayerPlusMinus,
  getPlayerPlusMinus,
  getGamePlusMinus,
  listenToPlayerPlusMinus,
  schedulePlayerPlusMinusUpdates
};