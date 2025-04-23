import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { cacheService } from './cacheService';

// Cache keys
const CACHE_KEYS = {
  PICK_OF_DAY: 'ai_pick_of_day',
  TOP_PICKS: 'ai_top_picks',
};

// Cache TTL (time to live)
const CACHE_TTL = {
  PICK_OF_DAY: 15 * 60 * 1000, // 15 minutes
  TOP_PICKS: 15 * 60 * 1000, // 15 minutes
};

// App version for cache invalidation
const APP_VERSION = '1.0.0';

/**
 * Interface for AI Pick data
 */
export interface AIPickData {
  gameId: string;
  teamA: string;
  teamB: string;
  sport: string;
  league: string;
  startTime: Timestamp;
  confidence: number;
  momentumScore: number;
  aiInsightText: string;
  isAIPickOfDay?: boolean;
  pickOfDayTimestamp?: Timestamp;
}

/**
 * AI Pick Selector Service
 * Handles fetching and selecting AI picks from Firestore
 */
class AiPickSelector {
  /**
   * Get today's games from Firestore
   * @returns Promise resolving to array of games
   */
  async getTodaysGames(): Promise<AIPickData[]> {
    try {
      // Check cache first
      const cachedGames = await cacheService.get({
        key: CACHE_KEYS.TOP_PICKS,
        ttl: CACHE_TTL.TOP_PICKS,
        version: APP_VERSION,
      });

      if (cachedGames) {
        console.log('Using cached games');
        return cachedGames;
      }

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Convert to Firestore timestamps
      const todayTimestamp = Timestamp.fromDate(today);
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

      // Query games scheduled for today
      const gamesRef = collection(firestore, 'games');
      const gamesQuery = query(
        gamesRef,
        where('startTime', '>=', todayTimestamp),
        where('startTime', '<', tomorrowTimestamp),
        where('aiConfidence', '>', 0) // Only games with predictions
      );

      const gamesSnapshot = await getDocs(gamesQuery);

      if (gamesSnapshot.empty) {
        console.log('No games with predictions found for today');
        return [];
      }

      // Convert to array
      const games = gamesSnapshot.docs.map((doc) => ({
        gameId: doc.id,
        ...doc.data(),
      })) as AIPickData[];

      // Cache the result
      await cacheService.set({
        key: CACHE_KEYS.TOP_PICKS,
        ttl: CACHE_TTL.TOP_PICKS,
        version: APP_VERSION,
      }, games);

      return games;
    } catch (error) {
      console.error('Error getting today\'s games:', error);
      return [];
    }
  }

  /**
   * Get top picks based on confidence
   * @param limit Maximum number of picks to return
   * @param minConfidence Minimum confidence threshold
   * @returns Promise resolving to array of top picks
   */
  async getTopPicks(maxPicks: number = 3, minConfidence: number = 65): Promise<AIPickData[]> {
    try {
      // Get today's games
      const games = await this.getTodaysGames();

      // Sort by confidence (descending)
      const sortedGames = [...games].sort((a, b) => 
        (b.confidence || 0) - (a.confidence || 0)
      );

      // Filter by minimum confidence
      const topPicks = sortedGames.filter((game) => 
        (game.confidence || 0) >= minConfidence
      );

      // Limit to specified number
      return topPicks.slice(0, maxPicks);
    } catch (error) {
      console.error('Error getting top picks:', error);
      return [];
    }
  }

  /**
   * Get the AI Pick of the Day
   * @returns Promise resolving to the Pick of the Day or null if not found
   */
  async getPickOfTheDay(): Promise<AIPickData | null> {
    try {
      // Check cache first
      const cachedPick = await cacheService.get({
        key: CACHE_KEYS.PICK_OF_DAY,
        ttl: CACHE_TTL.PICK_OF_DAY,
        version: APP_VERSION,
      });

      if (cachedPick) {
        console.log('Using cached Pick of the Day');
        return cachedPick;
      }

      // Get today's games
      const games = await this.getTodaysGames();

      // Find the game marked as Pick of the Day
      const pickOfDay = games.find((game) => game.isAIPickOfDay);

      if (pickOfDay) {
        // Cache the result
        await cacheService.set({
          key: CACHE_KEYS.PICK_OF_DAY,
          ttl: CACHE_TTL.PICK_OF_DAY,
          version: APP_VERSION,
        }, pickOfDay);

        return pickOfDay;
      }

      // If no game is marked as Pick of the Day, get the top pick
      const topPicks = await this.getTopPicks(1);
      if (topPicks.length > 0) {
        // Cache the result
        await cacheService.set({
          key: CACHE_KEYS.PICK_OF_DAY,
          ttl: CACHE_TTL.PICK_OF_DAY,
          version: APP_VERSION,
        }, topPicks[0]);

        return topPicks[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting Pick of the Day:', error);
      return null;
    }
  }

  /**
   * Check if a user is following a pick
   * @param userId User ID
   * @param gameId Game ID
   * @returns Promise resolving to boolean indicating if user follows the pick
   */
  async isFollowingPick(userId: string, gameId: string): Promise<boolean> {
    try {
      // Query user's followed picks
      const userPicksRef = collection(firestore, 'userPicks');
      const userPickQuery = query(
        userPicksRef,
        where('userId', '==', userId),
        where('pickId', '==', gameId)
      );

      const userPickSnapshot = await getDocs(userPickQuery);
      return !userPickSnapshot.empty;
    } catch (error) {
      console.error('Error checking if user follows pick:', error);
      return false;
    }
  }

  /**
   * Follow or unfollow a pick
   * @param userId User ID
   * @param gameId Game ID
   * @param follow Whether to follow (true) or unfollow (false)
   * @returns Promise resolving to boolean indicating success
   */
  async toggleFollowPick(userId: string, gameId: string, follow: boolean): Promise<boolean> {
    try {
      // Implementation would depend on your Firestore structure
      // This is a simplified version
      if (follow) {
        // Add to userPicks collection
        // await addDoc(collection(firestore, 'userPicks'), {
        //   userId,
        //   pickId: gameId,
        //   followedAt: Timestamp.now(),
        //   notificationEnabled: true
        // });
      } else {
        // Remove from userPicks collection
        // const userPicksRef = collection(firestore, 'userPicks');
        // const userPickQuery = query(
        //   userPicksRef,
        //   where('userId', '==', userId),
        //   where('pickId', '==', gameId)
        // );
        // const userPickSnapshot = await getDocs(userPickQuery);
        // 
        // if (!userPickSnapshot.empty) {
        //   const batch = writeBatch(firestore);
        //   userPickSnapshot.docs.forEach(doc => {
        //     batch.delete(doc.ref);
        //   });
        //   await batch.commit();
        // }
      }

      return true;
    } catch (error) {
      console.error('Error toggling follow pick:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiPickSelector = new AiPickSelector();