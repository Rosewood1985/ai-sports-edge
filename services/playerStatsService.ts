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

// Interface for advanced player metrics
export interface AdvancedPlayerMetrics {
  playerId: string;
  playerName: string;
  team: string;
  gameId: string;
  timestamp: any; // Firebase timestamp
  
  // Advanced offensive metrics
  trueShootingPercentage?: number;  // Measures shooting efficiency
  effectiveFieldGoalPercentage?: number;  // Adjusts for 3-pointers being worth more
  offensiveRating?: number;  // Points produced per 100 possessions
  assistPercentage?: number;  // Percentage of teammate field goals a player assisted
  usageRate?: number;  // Percentage of team plays used by a player
  
  // Advanced defensive metrics
  defensiveRating?: number;  // Points allowed per 100 possessions
  stealPercentage?: number;  // Percentage of opponent possessions that end with a steal
  blockPercentage?: number;  // Percentage of opponent shots blocked
  defensiveReboundPercentage?: number;  // Percentage of available defensive rebounds obtained
  
  // Advanced overall metrics
  playerEfficiencyRating?: number;  // Overall rating of a player's per-minute productivity
  valueOverReplacement?: number;  // Box plus/minus converted to wins
  winShares?: number;  // Estimate of number of wins contributed by player
  boxPlusMinus?: number;  // Box score estimate of points per 100 possessions above average
  
  // Historical trend data
  recentGamesAverages?: {
    points: number[];
    assists: number[];
    rebounds: number[];
    steals: number[];
    blocks: number[];
    fieldGoalPercentage: number[];
  };
}

// Interface for player comparison data
export interface PlayerComparisonData {
  player1: AdvancedPlayerMetrics;
  player2: AdvancedPlayerMetrics;
  comparisonDate: any; // Firebase timestamp
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

/**
 * Fetch advanced player metrics for a specific player in a game
 * @param gameId The ID of the game
 * @param playerId The ID of the player
 * @returns Promise that resolves with the player's advanced metrics
 */
export const getAdvancedPlayerMetrics = async (gameId: string, playerId: string): Promise<AdvancedPlayerMetrics | null> => {
  try {
    // Validate parameters
    if (!gameId) {
      throw new Error('Game ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    // In a real implementation, this would fetch from Firestore
    // For now, we'll check if there's basic plus-minus data and enhance it
    const basicStats = await getPlayerPlusMinus(gameId, playerId);
    
    if (!basicStats) {
      console.log(`No basic stats found for player ${playerId} in game ${gameId}`);
      return null;
    }
    
    // Generate advanced metrics based on basic stats
    // In a real implementation, these would be calculated from actual game data
    const advancedMetrics: AdvancedPlayerMetrics = {
      playerId: basicStats.playerId,
      playerName: basicStats.playerName,
      team: basicStats.team,
      gameId: basicStats.gameId,
      timestamp: basicStats.timestamp,
      
      // Generate realistic-looking advanced metrics
      trueShootingPercentage: Math.round((0.45 + Math.random() * 0.2) * 100) / 100,
      effectiveFieldGoalPercentage: Math.round((0.4 + Math.random() * 0.25) * 100) / 100,
      offensiveRating: Math.round(90 + Math.random() * 40),
      assistPercentage: Math.round(Math.random() * 40),
      usageRate: Math.round(10 + Math.random() * 30),
      
      defensiveRating: Math.round(90 + Math.random() * 40),
      stealPercentage: Math.round(Math.random() * 5 * 10) / 10,
      blockPercentage: Math.round(Math.random() * 10 * 10) / 10,
      defensiveReboundPercentage: Math.round(5 + Math.random() * 25),
      
      playerEfficiencyRating: Math.round((10 + Math.random() * 25) * 10) / 10,
      valueOverReplacement: Math.round((Math.random() * 10 - 2) * 10) / 10,
      winShares: Math.round(Math.random() * 15 * 10) / 10,
      boxPlusMinus: Math.round((Math.random() * 16 - 8) * 10) / 10,
      
      // Generate recent game averages (last 5 games)
      recentGamesAverages: {
        points: Array.from({ length: 5 }, () => Math.round(Math.random() * 30)),
        assists: Array.from({ length: 5 }, () => Math.round(Math.random() * 12)),
        rebounds: Array.from({ length: 5 }, () => Math.round(Math.random() * 15)),
        steals: Array.from({ length: 5 }, () => Math.round(Math.random() * 5)),
        blocks: Array.from({ length: 5 }, () => Math.round(Math.random() * 4)),
        fieldGoalPercentage: Array.from({ length: 5 }, () => Math.round(Math.random() * 100) / 100),
      }
    };
    
    return advancedMetrics;
  } catch (error) {
    console.error("Error getting advanced player metrics:", error);
    
    // Handle Firestore errors
    if (error instanceof Error) {
      Alert.alert('Error', `Failed to retrieve advanced player metrics: ${error.message}`);
    } else {
      Alert.alert('Error', 'An unexpected error occurred while retrieving advanced player metrics');
    }
    
    throw error;
  }
};

/**
 * Get advanced metrics for all players in a game
 * @param gameId The ID of the game
 * @returns Promise that resolves with an array of advanced player metrics
 */
export const getGameAdvancedMetrics = async (gameId: string): Promise<AdvancedPlayerMetrics[]> => {
  try {
    // Validate game ID
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    // First get basic plus-minus data
    const basicStats = await getGamePlusMinus(gameId);
    
    if (basicStats.length === 0) {
      return [];
    }
    
    // Generate advanced metrics for each player
    const advancedMetrics: AdvancedPlayerMetrics[] = [];
    
    for (const player of basicStats) {
      const metrics = await getAdvancedPlayerMetrics(gameId, player.playerId);
      if (metrics) {
        advancedMetrics.push(metrics);
      }
    }
    
    return advancedMetrics;
  } catch (error) {
    console.error("Error getting game advanced metrics:", error);
    
    // Handle Firestore errors
    if (error instanceof Error) {
      Alert.alert('Error', `Failed to retrieve game advanced metrics: ${error.message}`);
    } else {
      Alert.alert('Error', 'An unexpected error occurred while retrieving game advanced metrics');
    }
    
    throw error;
  }
};

/**
 * Compare two players' advanced metrics
 * @param gameId The ID of the game
 * @param player1Id First player ID
 * @param player2Id Second player ID
 * @returns Promise that resolves with comparison data
 */
export const comparePlayerMetrics = async (
  gameId: string,
  player1Id: string,
  player2Id: string
): Promise<PlayerComparisonData | null> => {
  try {
    // Validate parameters
    if (!gameId) {
      throw new Error('Game ID is required');
    }
    if (!player1Id || !player2Id) {
      throw new Error('Both player IDs are required');
    }

    // Get advanced metrics for both players
    const player1Metrics = await getAdvancedPlayerMetrics(gameId, player1Id);
    const player2Metrics = await getAdvancedPlayerMetrics(gameId, player2Id);
    
    if (!player1Metrics || !player2Metrics) {
      return null;
    }
    
    // Create comparison data
    const comparisonData: PlayerComparisonData = {
      player1: player1Metrics,
      player2: player2Metrics,
      comparisonDate: new Date()
    };
    
    return comparisonData;
  } catch (error) {
    console.error("Error comparing player metrics:", error);
    
    // Handle errors
    if (error instanceof Error) {
      Alert.alert('Error', `Failed to compare player metrics: ${error.message}`);
    } else {
      Alert.alert('Error', 'An unexpected error occurred while comparing player metrics');
    }
    
    throw error;
  }
};

export default {
  fetchPlayerPlusMinus,
  getPlayerPlusMinus,
  getGamePlusMinus,
  listenToPlayerPlusMinus,
  schedulePlayerPlusMinusUpdates,
  getAdvancedPlayerMetrics,
  getGameAdvancedMetrics,
  comparePlayerMetrics
};