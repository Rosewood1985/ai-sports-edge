import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'firebase-functions';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

// Define Game interface
interface Game {
  id: string;
  teamA: string;
  teamB: string;
  sport: string;
  league: string;
  startTime: admin.firestore.Timestamp;
  aiConfidence?: number;
  aiInsightText?: string;
  aiPredictedWinner?: string;
  isAIPickOfDay?: boolean;
  pickOfDayTimestamp?: admin.firestore.Timestamp;
  [key: string]: any; // Allow for additional properties
}

/**
 * Firebase Cloud Function that runs daily to mark the top prediction
 * as the AI Pick of the Day.
 */
// Use a fixed schedule for now to ensure compatibility
export const markAIPickOfDay = functions.pubsub
  .schedule('every day 09:00') // More compatible format
  .timeZone('America/New_York')
  .onRun(async (context) => {
    logger.info('Starting markAIPickOfDay function');
    
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Convert to Firestore timestamps
      const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
      const tomorrowTimestamp = admin.firestore.Timestamp.fromDate(tomorrow);
      
      logger.info(`Fetching games scheduled between ${today.toISOString()} and ${tomorrow.toISOString()}`);
      
      // Query games scheduled for today that have AI predictions
      const gamesRef = firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('games');
      const gamesQuery = gamesRef
        .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('startTime', '>=', todayTimestamp)
        .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('startTime', '<', tomorrowTimestamp)
        .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('aiConfidence', '>', 0); // Only games with predictions
      
      const gamesSnapshot = await gamesQuery.get();
      
      if (gamesSnapshot.empty) {
        logger.info('No games with predictions found for today');
        return null;
      }
      
      logger.info(`Found ${gamesSnapshot.size} games with predictions for today`);
      
      // Convert to array and sort by confidence
      const games = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      
      // Sort by confidence (descending)
      const sortedGames = games.sort((a, b) =>
        (b.aiConfidence || 0) - (a.aiConfidence || 0)
      );
      
      // Get minimum confidence threshold from environment or use default
      const minConfidenceThreshold = parseInt(process.env.FUNCTIONS_CONFIG_MIN_CONFIDENCE_THRESHOLD || '65', 10);
      
      logger.info(`Using minimum confidence threshold: ${minConfidenceThreshold}%`);
      
      // Get top picks (confidence > threshold)
      const topPicks = sortedGames.filter(game =>
        (game.aiConfidence || 0) >= minConfidenceThreshold
      );
      
      if (topPicks.length === 0) {
        logger.info('No games with confidence >= 65% found for today');
        return null;
      }
      
      // Mark top pick as Pick of the Day
      const pickOfDay = topPicks[0];
      
      logger.info(`Marking game ${pickOfDay.id} as AI Pick of the Day: ${pickOfDay.teamA} vs ${pickOfDay.teamB} (${pickOfDay.aiConfidence}% confidence)`);
      
      // Update all games to reset isAIPickOfDay flag
      const batch = firestore.batch();
      
      for (const game of games) {
        const gameRef = firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('games').firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.doc(game.id);
        batch.update(gameRef, { isAIPickOfDay: false });
      }
      
      // Set the top pick as Pick of the Day
      const pickOfDayRef = firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('games').firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.doc(pickOfDay.id);
      batch.update(pickOfDayRef, { 
        isAIPickOfDay: true,
        pickOfDayTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      
      logger.info(`Successfully marked game ${pickOfDay.id} as AI Pick of the Day`);
      
      // Also save to a separate collection for historical tracking
      await firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('aiPicksOfDay').add({
        gameId: pickOfDay.id,
        teamA: pickOfDay.teamA,
        teamB: pickOfDay.teamB,
        sport: pickOfDay.sport,
        league: pickOfDay.league,
        startTime: pickOfDay.startTime,
        aiConfidence: pickOfDay.aiConfidence,
        aiInsightText: pickOfDay.aiInsightText,
        date: today.toISOString().split('T')[0],
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      logger.info('Added entry to aiPicksOfDay collection');
      
      // Return the pick of the day
      return {
        gameId: pickOfDay.id,
        teamA: pickOfDay.teamA,
        teamB: pickOfDay.teamB,
        aiConfidence: pickOfDay.aiConfidence,
        date: today.toISOString().split('T')[0]
      };
    } catch (error: any) {
      logger.error('Error in markAIPickOfDay function:', error);
      throw error;
    }
  });