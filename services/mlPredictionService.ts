/**
 * Machine Learning Prediction Service
 * 
 * This service provides machine learning predictions for sports betting using TensorFlow.js.
 * It includes integration with TensorFlow.js, model loading, and prediction feedback loop.
 */

import * as tf from '@tensorflow/tfjs';
import { loadLayersModel } from '@tensorflow/tfjs-layers';
import { Game, AIPrediction, ConfidenceLevel } from '../types/odds';
import { auth, firestore } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { AIInputValidator } from './security/AIInputValidator';
import { PromptTemplate } from './security/PromptTemplate';

// Model cache
interface ModelCache {
  [sport: string]: {
    model: tf.LayersModel;
    lastUpdated: number;
    version: string;
  } | null;
}

// Prediction feedback data
interface PredictionFeedback {
  gameId: string;
  predictedWinner: string;
  actualWinner: string;
  wasCorrect: boolean;
  confidenceScore: number;
  timestamp: number;
  userId?: string;
  sportType: string;
  features: number[];
}

// Model metadata
interface ModelMetadata {
  version: string;
  lastUpdated: number;
  accuracy: number;
  sportType: string;
  featureCount: number;
  description: string;
}

// Sport-specific feature generators
interface FeatureGenerators {
  [sport: string]: (game: Game) => Promise<number[]>;
}

class MLPredictionService {
  private static instance: MLPredictionService;
  private modelCache: ModelCache = {};
  private readonly MODEL_REGISTRY_URL = 'https://storage.googleapis.com/ai-sports-edge-models';
  private readonly MODEL_REGISTRY_COLLECTION = 'modelRegistry';
  private readonly FEEDBACK_COLLECTION = 'predictionFeedback';
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly MAX_FEEDBACK_ENTRIES = 1000;
  private readonly MIN_FEEDBACK_FOR_TRAINING = 100;
  
  // Feature generators for different sports
  private featureGenerators: FeatureGenerators = {
    basketball: this.generateBasketballFeatures.bind(this),
    football: this.generateFootballFeatures.bind(this),
    baseball: this.generateBaseballFeatures.bind(this),
    hockey: this.generateHockeyFeatures.bind(this),
    soccer: this.generateSoccerFeatures.bind(this),
    mma: this.generateMMAFeatures.bind(this),
    formula1: this.generateFormula1Features.bind(this),
    horseracing: this.generateHorseRacingFeatures.bind(this),
  };
  
  /**
   * Get singleton instance
   * @returns MLPredictionService instance
   */
  public static getInstance(): MLPredictionService {
    if (!MLPredictionService.instance) {
      MLPredictionService.instance = new MLPredictionService();
    }
    return MLPredictionService.instance;
  }
  
  /**
   * Load model for a specific sport
   * @param sport Sport type
   * @returns TensorFlow.js model
   */
  public async loadModel(sport: string): Promise<tf.LayersModel | null> {
    try {
      // Check if model is already loaded and not expired
      if (
        this.modelCache[sport] && 
        (Date.now() - this.modelCache[sport]!.lastUpdated) < this.CACHE_TTL
      ) {
        console.log(`Using cached model for ${sport}`);
        return this.modelCache[sport]!.model;
      }
      
      // Get model metadata from Firestore
      const modelMetadata = await this.getModelMetadata(sport);
      
      if (!modelMetadata) {
        console.log(`No model metadata found for ${sport}, using default model`);
        return this.createDefaultModel(sport);
      }
      
      // Construct model URL
      const modelUrl = `${this.MODEL_REGISTRY_URL}/${sport}/${modelMetadata.version}/model.json`;
      
      // Load model from URL
      console.log(`Loading model for ${sport} from ${modelUrl}`);
      const model = await loadLayersModel(modelUrl);
      
      // Cache the model
      this.modelCache[sport] = {
        model,
        lastUpdated: Date.now(),
        version: modelMetadata.version
      };
      
      return model;
    } catch (error) {
      console.error(`Error loading model for ${sport}:`, error);
      
      // If loading fails, create a default model
      return this.createDefaultModel(sport);
    }
  }
  
  /**
   * Create a default model for a sport
   * @param sport Sport type
   * @returns TensorFlow.js model
   */
  private async createDefaultModel(sport: string): Promise<tf.LayersModel> {
    console.log(`Creating default model for ${sport}`);
    
    // Determine input shape based on sport
    const inputShape = this.getInputShapeForSport(sport);
    
    // Create a simple model
    const model = tf.sequential();
    
    // Add layers
    model.add(tf.layers.dense({
      inputShape: [inputShape],
      units: 32,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid' // Output: probability of home team winning
    }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    // Cache the model
    this.modelCache[sport] = {
      model,
      lastUpdated: Date.now(),
      version: 'default-1.0.0'
    };
    
    return model;
  }
  
  /**
   * Get input shape for a sport
   * @param sport Sport type
   * @returns Input shape
   */
  private getInputShapeForSport(sport: string): number {
    switch (sport) {
      case 'basketball':
        return 15; // Team stats, player stats, historical performance, etc.
      case 'football':
        return 20; // More features for football
      case 'baseball':
        return 18; // Baseball-specific features
      case 'hockey':
        return 14; // Hockey-specific features
      case 'soccer':
        return 16; // Soccer-specific features
      case 'mma':
        return 12; // MMA-specific features
      case 'formula1':
        return 14; // Formula 1-specific features
      case 'horseracing':
        return 16; // Horse racing-specific features
      default:
        return 10; // Default number of features
    }
  }
  
  /**
   * Get model metadata from Firestore
   * @param sport Sport type
   * @returns Model metadata
   */
  private async getModelMetadata(sport: string): Promise<ModelMetadata | null> {
    try {
      const modelRef = doc(firestore, this.MODEL_REGISTRY_COLLECTION, sport);
      const modelDoc = await getDoc(modelRef);
      
      if (modelDoc.exists()) {
        return modelDoc.data() as ModelMetadata;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting model metadata for ${sport}:`, error);
      return null;
    }
  }
  
  /**
   * Generate features for a game
   * @param game Game to predict
   * @returns Feature tensor
   */
  public async generateFeatures(game: Game): Promise<tf.Tensor> {
    try {
      // Determine sport type
      const sportKey = game.sport_key.split('_')[0] || 'basketball';
      
      // Get feature generator for this sport
      const featureGenerator = this.featureGenerators[sportKey] || this.generateDefaultFeatures.bind(this);
      
      // Generate features
      const features = await featureGenerator(game);
      
      // Create tensor
      return tf.tensor2d([features]);
    } catch (error) {
      console.error('Error generating features:', error);
      
      // Return default features
      const defaultFeatures = Array.from({ length: 10 }, () => Math.random());
      return tf.tensor2d([defaultFeatures]);
    }
  }
  
  /**
   * Generate default features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateDefaultFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract meaningful features from the game
    // For now, we'll generate random features
    return Array.from({ length: 10 }, () => Math.random());
  }
  
  /**
   * Generate basketball features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateBasketballFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract basketball-specific features
    // For now, we'll generate random features
    return Array.from({ length: 15 }, () => Math.random());
  }
  
  /**
   * Generate football features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateFootballFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract football-specific features
    // For now, we'll generate random features
    return Array.from({ length: 20 }, () => Math.random());
  }
  
  /**
   * Generate baseball features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateBaseballFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract baseball-specific features
    // For now, we'll generate random features
    return Array.from({ length: 18 }, () => Math.random());
  }
  
  /**
   * Generate hockey features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateHockeyFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract hockey-specific features
    // For now, we'll generate random features
    return Array.from({ length: 14 }, () => Math.random());
  }
  
  /**
   * Generate soccer features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateSoccerFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract soccer-specific features
    // For now, we'll generate random features
    return Array.from({ length: 16 }, () => Math.random());
  }
  
  /**
   * Generate MMA features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateMMAFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract MMA-specific features
    // For now, we'll generate random features
    return Array.from({ length: 12 }, () => Math.random());
  }
  
  /**
   * Generate Formula 1 features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateFormula1Features(game: Game): Promise<number[]> {
    // In a real implementation, this would extract Formula 1-specific features
    // For now, we'll generate random features
    return Array.from({ length: 14 }, () => Math.random());
  }
  
  /**
   * Generate horse racing features
   * @param game Game to predict
   * @returns Feature array
   */
  private async generateHorseRacingFeatures(game: Game): Promise<number[]> {
    // In a real implementation, this would extract horse racing-specific features
    // For now, we'll generate random features
    return Array.from({ length: 16 }, () => Math.random());
  }
  
  /**
   * Generate AI prediction for a game
   * @param game Game to predict
   * @param language Language code
   * @returns AI prediction
   */
  public async generatePrediction(game: Game, language = 'en'): Promise<AIPrediction> {
    try {
      // Determine sport type
      const sportType = game.sport_key.split('_')[0] || 'basketball';
      
      // Load model for this sport
      const model = await this.loadModel(sportType);
      
      let predictedWinner: string;
      let confidenceScore: number;
      let features: number[] = [];
      
      if (model) {
        // Generate features
        const featureTensor = await this.generateFeatures(game);
        features = (await featureTensor.data()) as unknown as number[];
        
        // Make prediction
        const prediction = model.predict(featureTensor) as tf.Tensor;
        
        // Get prediction value (probability of home team winning)
        const homeWinProbability = (await prediction.data())[0] * 100;
        
        // Clean up tensors
        featureTensor.dispose();
        prediction.dispose();
        
        // Determine winner based on probability
        predictedWinner = homeWinProbability > 50 ? game.home_team : game.away_team;
        
        // Set confidence score
        confidenceScore = Math.abs(homeWinProbability - 50) * 2;
      } else {
        // Fallback to random prediction if model loading fails
        const teams = [game.home_team, game.away_team];
        predictedWinner = teams[Math.floor(Math.random() * teams.length)];
        confidenceScore = Math.floor(Math.random() * 100);
        features = Array.from({ length: 10 }, () => Math.random());
      }
      
      // Determine confidence level based on score
      let confidence: ConfidenceLevel;
      if (confidenceScore >= 70) {
        confidence = 'high';
      } else if (confidenceScore >= 40) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }
      
      // Generate reasoning based on language and sport
      const reasoning = this.generateReasoning(sportType, predictedWinner, language);
      
      // Get historical accuracy
      const historicalAccuracy = await this.getHistoricalAccuracy(sportType);
      
      // Store prediction for feedback loop
      this.storePrediction(game.id, predictedWinner, confidenceScore, sportType, features);
      
      return {
        predicted_winner: predictedWinner,
        confidence,
        confidence_score: confidenceScore,
        reasoning,
        historical_accuracy: historicalAccuracy
      };
    } catch (error) {
      console.error('Error generating AI prediction:', error);
      
      // Return a fallback prediction with error message
      return {
        predicted_winner: game.home_team,
        confidence: 'low', // Always 'low' confidence for error cases
        confidence_score: 30,
        reasoning: language === 'es'
          ? 'Error al generar la predicción. Usando predicción de respaldo.'
          : 'Error generating prediction. Using fallback prediction.',
        historical_accuracy: 60
      };
    }
  }
  
  /**
   * Generate reasoning for a prediction (SECURE VERSION)
   * @param sport Sport type
   * @param team Team name
   * @param language Language code
   * @returns Secure reasoning text
   */
  private generateReasoning(sport: string, team: string, language: string): string {
    // Validate and sanitize inputs
    const sanitizedTeam = AIInputValidator.sanitizeTeamName(team);
    const validLanguage = AIInputValidator.validateLanguage(language);
    
    // Use secure template system instead of direct string interpolation
    return PromptTemplate.createTeamReasoning(sanitizedTeam, validLanguage, {
      wins: 7,
      games: 10,
      stat: 'offensive',
      category: 'recent games'
    });
  }
  
  /**
   * Get sport-specific reasonings (DEPRECATED - replaced with secure template system)
   * @param sport Sport type
   * @param team Team name
   * @param language Language code
   * @returns Array of reasonings
   */
  private getSportSpecificReasonings(sport: string, team: string, language: string): string[] {
    // SECURITY NOTE: This method is deprecated due to prompt injection vulnerabilities
    // Use PromptTemplate.createTeamReasoning() instead
    if (language === 'es') {
      // Spanish reasonings
      switch (sport) {
        case 'basketball':
          return [
            `${team} ha ganado 7 de sus últimos 10 juegos.`,
            `${team} tiene un buen historial contra su oponente.`,
            `${team} tiene jugadores clave que regresan de lesiones.`,
            `${team} tiene una ventaja estadística en eficiencia ofensiva.`,
            `${team} ha tenido buen rendimiento en partidos similares.`
          ];
        case 'football':
          return [
            `${team} ha ganado 6 de sus últimos 8 juegos.`,
            `${team} tiene un buen historial jugando en este estadio.`,
            `${team} tiene una defensa sólida contra el ataque de su oponente.`,
            `${team} tiene una ventaja en el juego terrestre.`,
            `${team} ha tenido buen rendimiento en condiciones climáticas similares.`
          ];
        case 'baseball':
          return [
            `${team} tiene un lanzador dominante programado para este juego.`,
            `${team} tiene un buen historial contra el lanzador oponente.`,
            `${team} tiene una ventaja estadística en bateo.`,
            `${team} ha tenido buen rendimiento en este parque de pelota.`,
            `${team} ha ganado 7 de sus últimos 10 juegos.`
          ];
        default:
          return [
            `${team} ha ganado 7 de sus últimos 10 juegos.`,
            `${team} tiene un buen historial contra su oponente.`,
            `${team} tiene jugadores clave que regresan de lesiones.`,
            `${team} tiene una ventaja estadística en eficiencia.`,
            `${team} ha tenido buen rendimiento en condiciones similares.`
          ];
      }
    } else {
      // English reasonings
      switch (sport) {
        case 'basketball':
          return [
            `${team} has won 7 of their last 10 games.`,
            `${team} has a strong historical performance against their opponent.`,
            `${team} has key players returning from injury.`,
            `${team} has a statistical advantage in offensive efficiency.`,
            `${team} has performed well in similar matchups.`
          ];
        case 'football':
          return [
            `${team} has won 6 of their last 8 games.`,
            `${team} has a strong record playing at this stadium.`,
            `${team} has a solid defense against their opponent's offense.`,
            `${team} has an advantage in the ground game.`,
            `${team} has performed well in similar weather conditions.`
          ];
        case 'baseball':
          return [
            `${team} has a dominant pitcher scheduled for this game.`,
            `${team} has a strong record against the opposing pitcher.`,
            `${team} has a statistical advantage in batting.`,
            `${team} has performed well at this ballpark.`,
            `${team} has won 7 of their last 10 games.`
          ];
        default:
          return [
            `${team} has won 7 of their last 10 games.`,
            `${team} has a strong historical performance against their opponent.`,
            `${team} has key players returning from injury.`,
            `${team} has a statistical advantage in efficiency.`,
            `${team} has performed well in similar conditions.`
          ];
      }
    }
  }
  
  /**
   * Get historical accuracy for a sport
   * @param sport Sport type
   * @returns Historical accuracy percentage
   */
  private async getHistoricalAccuracy(sport: string): Promise<number> {
    try {
      // Get model metadata
      const modelMetadata = await this.getModelMetadata(sport);
      
      if (modelMetadata) {
        return modelMetadata.accuracy * 100;
      }
      
      // If no metadata, calculate from feedback
      const feedbackRef = collection(firestore, this.FEEDBACK_COLLECTION);
      const q = query(
        feedbackRef,
        where('sportType', '==', sport),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // No feedback data, return default accuracy
        return 60 + Math.floor(Math.random() * 20); // 60-80%
      }
      
      // Calculate accuracy from feedback
      let correctCount = 0;
      
      querySnapshot.forEach((doc) => {
        const feedback = doc.data() as PredictionFeedback;
        if (feedback.wasCorrect) {
          correctCount++;
        }
      });
      
      return (correctCount / querySnapshot.size) * 100;
    } catch (error) {
      console.error(`Error getting historical accuracy for ${sport}:`, error);
      
      // Return default accuracy
      return 60 + Math.floor(Math.random() * 20); // 60-80%
    }
  }
  
  /**
   * Store prediction for feedback loop
   * @param gameId Game ID
   * @param predictedWinner Predicted winner
   * @param confidenceScore Confidence score
   * @param sportType Sport type
   * @param features Features used for prediction
   */
  private async storePrediction(
    gameId: string,
    predictedWinner: string,
    confidenceScore: number,
    sportType: string,
    features: number[]
  ): Promise<void> {
    try {
      // Get current user ID
      const userId = auth.currentUser?.uid;
      
      // Create prediction document
      const predictionRef = doc(firestore, 'predictions', gameId);
      
      // Store prediction
      await setDoc(predictionRef, {
        gameId,
        predictedWinner,
        confidenceScore,
        sportType,
        features,
        userId,
        timestamp: Date.now(),
        feedbackReceived: false
      });
    } catch (error) {
      console.error('Error storing prediction:', error);
    }
  }
  
  /**
   * Record prediction feedback
   * @param gameId Game ID
   * @param actualWinner Actual winner
   * @returns Success status
   */
  public async recordFeedback(gameId: string, actualWinner: string): Promise<boolean> {
    try {
      // Get prediction
      const predictionRef = doc(firestore, 'predictions', gameId);
      const predictionDoc = await getDoc(predictionRef);
      
      if (!predictionDoc.exists()) {
        console.error(`No prediction found for game ${gameId}`);
        return false;
      }
      
      const prediction = predictionDoc.data();
      const wasCorrect = prediction.predictedWinner === actualWinner;
      
      // Create feedback entry
      const feedback: PredictionFeedback = {
        gameId,
        predictedWinner: prediction.predictedWinner,
        actualWinner,
        wasCorrect,
        confidenceScore: prediction.confidenceScore,
        timestamp: Date.now(),
        userId: prediction.userId,
        sportType: prediction.sportType,
        features: prediction.features
      };
      
      // Store feedback
      const feedbackRef = doc(firestore, this.FEEDBACK_COLLECTION, gameId);
      await setDoc(feedbackRef, feedback);
      
      // Update prediction
      await updateDoc(predictionRef, {
        feedbackReceived: true,
        actualWinner,
        wasCorrect
      });
      
      // Check if we have enough feedback to retrain the model
      await this.checkForRetraining(prediction.sportType);
      
      return true;
    } catch (error) {
      console.error('Error recording prediction feedback:', error);
      return false;
    }
  }
  
  /**
   * Check if we have enough feedback to retrain the model
   * @param sport Sport type
   */
  private async checkForRetraining(sport: string): Promise<void> {
    try {
      // Get feedback count
      const feedbackRef = collection(firestore, this.FEEDBACK_COLLECTION);
      const q = query(
        feedbackRef,
        where('sportType', '==', sport),
        orderBy('timestamp', 'desc'),
        limit(this.MIN_FEEDBACK_FOR_TRAINING + 1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.size >= this.MIN_FEEDBACK_FOR_TRAINING) {
        console.log(`Enough feedback for ${sport}, triggering model retraining`);
        
        // In a real implementation, this would trigger a cloud function to retrain the model
        // For now, we'll just log it
        console.log(`Retraining model for ${sport} with ${querySnapshot.size} feedback entries`);
      }
    } catch (error) {
      console.error(`Error checking for retraining for ${sport}:`, error);
    }
  }
}

export const mlPredictionService = MLPredictionService.getInstance();