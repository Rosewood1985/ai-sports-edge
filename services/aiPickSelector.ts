/**
 * AI Pick Selector Service
 *
 * This service handles the selection of AI picks, including:
 * - Querying today's games from Firestore
 * - Sorting games by confidence score
 * - Selecting top picks (with confidence > 65%)
 * - Returning formatted data for AIPickCard components
 */

import {
  getFirestore,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  CollectionReference,
  serverTimestamp,
} from 'firebase/firestore';

import logger from '../utils/logger';

// Initialize Firestore
const db = getFirestore();

// Define Game interface
export interface Game {
  id: string;
  teamA: string;
  teamB: string;
  sport: string;
  league: string;
  startTime: Timestamp;
  aiConfidence?: number;
  aiInsightText?: string;
  aiPredictedWinner?: string;
  isAIPickOfDay?: boolean;
  pickOfDayTimestamp?: Timestamp;
  momentumScore?: number;
  [key: string]: any; // Allow for additional properties
}

// Define AIPickData interface
export interface AIPickData {
  gameId: string;
  teamA: string;
  teamB: string;
  confidence: number;
  momentumScore: number;
  aiInsightText: string;
  isAIPickOfDay?: boolean;
  sport?: string;
  league?: string;
  startTime?: Timestamp;
  predictedWinner?: string;
}

/**
 * Get today's games from Firestore
 *
 * @returns Promise<Game[]> Array of today's games
 */
export async function getTodaysGames(): Promise<Game[]> {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Convert to Firestore timestamps
    const todayTimestamp = Timestamp.fromDate(today);
    const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

    logger.info(
      `Fetching games scheduled between ${today.toISOString()} and ${tomorrow.toISOString()}`
    );

    // Query games scheduled for today that have AI predictions
    const gamesCollection = collection(db, 'games');
    const gamesQuery = query(
      gamesCollection,
      where('startTime', '>=', todayTimestamp),
      where('startTime', '<', tomorrowTimestamp),
      where('aiConfidence', '>', 0) // Only games with predictions
    );

    const gamesSnapshot = await getDocs(gamesQuery);

    if (gamesSnapshot.empty) {
      logger.info('No games with predictions found for today');
      return [];
    }

    logger.info(`Found ${gamesSnapshot.size} games with predictions for today`);

    // Convert to array
    const games = gamesSnapshot.docs.map((docSnapshot: QueryDocumentSnapshot<DocumentData>) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as Game[];

    return games;
  } catch (error) {
    logger.error("Error fetching today's games:", error as Record<string, any>);
    throw error;
  }
}

/**
 * Get top AI picks from a list of games
 *
 * @param games Array of games
 * @param limit Maximum number of picks to return
 * @returns Array of AIPickData objects
 */
export function getTopPicks(games: Game[], limit: number = 3): AIPickData[] {
  try {
    if (!games || games.length === 0) {
      return [];
    }

    // Get minimum confidence threshold from environment or use default
    const minConfidenceThreshold = parseInt(process.env.MIN_CONFIDENCE_THRESHOLD || '65', 10);

    logger.info(`Using minimum confidence threshold: ${minConfidenceThreshold}%`);

    // Sort by confidence (descending)
    const sortedGames = [...games].sort((a, b) => (b.aiConfidence || 0) - (a.aiConfidence || 0));

    // Filter games with confidence above threshold
    const highConfidenceGames = sortedGames.filter(
      game => (game.aiConfidence || 0) >= minConfidenceThreshold
    );

    // Take top N games
    const topGames = highConfidenceGames.slice(0, limit);

    // Format as AIPickData
    const topPicks = topGames.map(game => ({
      gameId: game.id,
      teamA: game.teamA,
      teamB: game.teamB,
      confidence: game.aiConfidence || 0,
      momentumScore: game.momentumScore || 0,
      aiInsightText: game.aiInsightText || '',
      isAIPickOfDay: game.isAIPickOfDay || false,
      sport: game.sport,
      league: game.league,
      startTime: game.startTime,
      predictedWinner: game.aiPredictedWinner,
    }));

    logger.info(`Selected ${topPicks.length} top picks`);
    return topPicks;
  } catch (error) {
    logger.error('Error getting top picks:', error as Record<string, any>);
    throw error;
  }
}

/**
 * Mark a game as the AI Pick of the Day
 *
 * @param gameId ID of the game to mark
 * @returns Promise<void>
 */
export async function markPickOfDay(gameId: string): Promise<void> {
  try {
    logger.info(`Marking game ${gameId} as AI Pick of the Day`);

    // Get all games for today
    const games = await getTodaysGames();

    // Update all games to reset isAIPickOfDay flag
    const batch = writeBatch(db);

    for (const game of games) {
      const gameRef = doc(db, 'games', game.id);
      batch.update(gameRef, { isAIPickOfDay: false });
    }

    // Set the selected game as Pick of the Day
    const pickOfDayRef = doc(db, 'games', gameId);
    batch.update(pickOfDayRef, {
      isAIPickOfDay: true,
      pickOfDayTimestamp: serverTimestamp(),
    });

    // Commit the batch
    await batch.commit();

    logger.info(`Successfully marked game ${gameId} as AI Pick of the Day`);

    // Also save to a separate collection for historical tracking
    const game = games.find(g => g.id === gameId);
    if (game) {
      const aiPicksCollection = collection(db, 'aiPicksOfDay');
      await addDoc(aiPicksCollection, {
        gameId: game.id,
        teamA: game.teamA,
        teamB: game.teamB,
        sport: game.sport,
        league: game.league,
        startTime: game.startTime,
        aiConfidence: game.aiConfidence,
        aiInsightText: game.aiInsightText,
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp(),
      });

      logger.info('Added entry to aiPicksOfDay collection');
    }
  } catch (error) {
    logger.error('Error marking pick of day:', error as Record<string, any>);
    throw error;
  }
}

/**
 * Get the AI Pick of the Day
 *
 * @returns Promise<AIPickData | null> The AI Pick of the Day or null if not found
 */
export async function getPickOfDay(): Promise<AIPickData | null> {
  try {
    logger.info('Fetching AI Pick of the Day');

    // Query games marked as Pick of the Day
    const gamesCollection = collection(db, 'games');
    const gameQuery = query(
      gamesCollection,
      where('isAIPickOfDay', '==', true)
      // Limit to 1 result
    );

    const gameSnapshot = await getDocs(gameQuery);

    if (gameSnapshot.empty) {
      logger.info('No AI Pick of the Day found');
      return null;
    }

    // Get the game data
    const gameDoc = gameSnapshot.docs[0];
    const gameData = gameDoc.data();
    const game = {
      id: gameDoc.id,
      ...gameData,
    } as Game;

    // Format as AIPickData
    const pickOfDay: AIPickData = {
      gameId: game.id,
      teamA: game.teamA,
      teamB: game.teamB,
      confidence: game.aiConfidence || 0,
      momentumScore: game.momentumScore || 0,
      aiInsightText: game.aiInsightText || '',
      isAIPickOfDay: true,
      sport: game.sport,
      league: game.league,
      startTime: game.startTime,
      predictedWinner: game.aiPredictedWinner,
    };

    logger.info(`Found AI Pick of the Day: ${game.teamA} vs ${game.teamB}`);
    return pickOfDay;
  } catch (error) {
    logger.error('Error getting pick of day:', error as Record<string, any>);
    throw error;
  }
}

/**
 * Get historical AI Picks of the Day
 *
 * @param limit Maximum number of historical picks to return
 * @returns Promise<AIPickData[]> Array of historical AI Picks of the Day
 */
export async function getHistoricalPicks(limit: number = 10): Promise<AIPickData[]> {
  try {
    logger.info(`Fetching historical AI Picks of the Day (limit: ${limit})`);

    // Query historical picks
    const picksCollection = collection(db, 'aiPicksOfDay');
    const picksQuery = query(
      picksCollection
      // Order by timestamp descending
      // Limit to specified number of results
    );

    const picksSnapshot = await getDocs(picksQuery);

    if (picksSnapshot.empty) {
      logger.info('No historical AI Picks found');
      return [];
    }

    // Convert to AIPickData array
    const historicalPicks = picksSnapshot.docs.map(
      (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnapshot.data();
        return {
          gameId: data.gameId,
          teamA: data.teamA,
          teamB: data.teamB,
          confidence: data.aiConfidence || 0,
          momentumScore: data.momentumScore || 0,
          aiInsightText: data.aiInsightText || '',
          isAIPickOfDay: true,
          sport: data.sport,
          league: data.league,
          startTime: data.startTime,
          predictedWinner: data.aiPredictedWinner,
        } as AIPickData;
      }
    );

    logger.info(`Found ${historicalPicks.length} historical AI Picks`);
    return historicalPicks;
  } catch (error) {
    logger.error('Error getting historical picks:', error as Record<string, any>);
    throw error;
  }
}

// Export default object with all functions
export default {
  getTodaysGames,
  getTopPicks,
  markPickOfDay,
  getPickOfDay,
  getHistoricalPicks,
};
