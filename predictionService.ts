// src/services/predictionService.ts
import { firebaseService } from './firebaseService';
import { GamePrediction, LineMovement, BettingAction } from '../types/predictions';

/**
 * Service for handling predictions and betting insights
 */
export const predictionService = {
  /**
   * Get AI win probability for a specific game
   * @param gameId The ID of the game
   * @returns Promise with the game prediction including win probability
   */
  getGamePrediction: async (gameId: string): Promise<GamePrediction | null> => {
    try {
      const doc = await firebaseService.firestore
        .collection('predictions')
        .doc(gameId)
        .get();
      
      if (!doc.exists) return null;
      return doc.data() as GamePrediction;
    } catch (error) {
      console.error('Error fetching game prediction:', error);
      throw error;
    }
  },

  /**
   * Get AI win probabilities for games matching criteria
   * @param sportId The sport ID to filter by (optional)
   * @param date The date to filter by (optional)
   * @returns Promise with an array of game predictions
   */
  getGamePredictions: async (
    sportId?: string, 
    date?: Date
  ): Promise<GamePrediction[]> => {
    try {
      let query = firebaseService.firestore.collection('predictions');
      
      if (sportId) {
        query = query.where('sportId', '==', sportId);
      }
      
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.where('gameDate', '>=', startOfDay)
                     .where('gameDate', '<=', endOfDay);
      }
      
      const querySnapshot = await query.get();
      
      return querySnapshot.docs.map(doc => doc.data() as GamePrediction);
    } catch (error) {
      console.error('Error fetching game predictions:', error);
      throw error;
    }
  },

  /**
   * Get line movement history for a specific game
   * @param gameId The ID of the game
   * @returns Promise with line movement history
   */
  getLineMovements: async (gameId: string): Promise<LineMovement[]> => {
    try {
      const querySnapshot = await firebaseService.firestore
        .collection('lineMovements')
        .where('gameId', '==', gameId)
        .orderBy('timestamp')
        .get();
      
      return querySnapshot.docs.map(doc => doc.data() as LineMovement);
    } catch (error) {
      console.error('Error fetching line movements:', error);
      throw error;
    }
  },

  /**
   * Get public betting percentages and sharp action for a game
   * @param gameId The ID of the game
   * @returns Promise with betting action data
   */
  getBettingAction: async (gameId: string): Promise<BettingAction | null> => {
    try {
      const doc = await firebaseService.firestore
        .collection('bettingAction')
        .doc(gameId)
        .get();
      
      if (!doc.exists) return null;
      return doc.data() as BettingAction;
    } catch (error) {
      console.error('Error fetching betting action:', error);
      throw error;
    }
  },

  /**
   * Calculate Kelly criterion bet size
   * @param probability AI predicted probability (0-1)
   * @param odds American odds format
   * @param bankrollPercentage Max percentage of bankroll to risk (default: 0.05)
   * @returns Recommended bet size as fraction of bankroll
   */
  calculateKellyStake: (
    probability: number, 
    odds: number, 
    bankrollPercentage: number = 0.05
  ): number => {
    // Convert American odds to decimal odds
    const decimalOdds = odds >= 0 
      ? (odds / 100) + 1 
      : (100 / Math.abs(odds)) + 1;
    
    // Calculate edge
    const edge = (probability * decimalOdds) - 1;
    
    // Kelly formula: f* = (bp - q) / b
    // where b = decimal odds - 1, p = probability of winning, q = probability of losing
    const b = decimalOdds - 1;
    const p = probability;
    const q = 1 - p;
    
    let kellyFraction = edge > 0 ? (b * p - q) / b : 0;
    
    // Cap at specified bankroll percentage
    return Math.min(kellyFraction, bankrollPercentage);
  }
};
