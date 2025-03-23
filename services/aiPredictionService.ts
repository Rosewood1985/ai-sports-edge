import { Game, AIPrediction, ConfidenceLevel, DailyInsight, GameResult } from '../types/odds';
import { PropBetLine, PropBetPrediction, PropBetType } from '../types/playerProps';
import { auth } from '../config/firebase';
import * as tf from '@tensorflow/tfjs';
import { loadLayersModel } from '@tensorflow/tfjs-layers';
import { useI18n } from '../contexts/I18nContext';
import {
  hasPremiumAccess,
  hasUsedFreeDailyPick,
  markFreeDailyPickAsUsed
} from './firebaseSubscriptionService';

// Model cache
let modelCache: {
  [sport: string]: tf.LayersModel | null;
} = {};

// Prediction feedback data
interface PredictionFeedback {
  gameId: string;
  predictedWinner: string;
  actualWinner: string;
  wasCorrect: boolean;
  confidenceScore: number;
  timestamp: number;
}

// Feedback cache
const feedbackCache: PredictionFeedback[] = [];

/**
 * Load TensorFlow.js model for a specific sport
 * @param sport - Sport name
 * @returns TensorFlow.js model
 */
export const loadModel = async (sport: string): Promise<tf.LayersModel | null> => {
  try {
    // Check if model is already loaded
    if (modelCache[sport]) {
      return modelCache[sport];
    }
    
    // In a real implementation, this would load a model from a URL or local storage
    // For now, we'll create a simple model for demonstration
    
    // Create a simple model
    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [10], // Input features: team stats, historical performance, etc.
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
    modelCache[sport] = model;
    
    return model;
  } catch (error) {
    console.error(`Error loading model for ${sport}:`, error);
    return null;
  }
};

/**
 * Generate features for prediction
 * @param game - Game to predict
 * @returns Feature tensor
 */
const generateFeatures = (game: Game): tf.Tensor => {
  // In a real implementation, this would extract meaningful features from the game
  // For now, we'll generate random features
  
  // Generate 10 random features
  const features = Array.from({ length: 10 }, () => Math.random());
  
  return tf.tensor2d([features]);
};

/**
 * Generate an AI prediction for a game
 * @param game - The game to predict
 * @param language - The language code (en or es)
 * @returns AI prediction
 */
export const generateAIPrediction = async (
  game: Game,
  language = 'en'
): Promise<AIPrediction> => {
  try {
    // Determine sport type
    const sport = game.sport_key.split('_')[0] || 'basketball';
    
    // Load model for this sport
    const model = await loadModel(sport);
    
    let predictedWinner: string;
    let confidenceScore: number;
    
    if (model) {
      // Generate features
      const features = generateFeatures(game);
      
      // Make prediction
      const prediction = model.predict(features) as tf.Tensor;
      
      // Get prediction value (probability of home team winning)
      const homeWinProbability = (await prediction.data())[0] * 100;
      
      // Clean up tensors
      features.dispose();
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
    let reasoning = '';
    if (language === 'es') {
      // Spanish reasoning
      const reasonings = [
        `${predictedWinner} ha ganado 7 de sus últimos 10 juegos.`,
        `${predictedWinner} tiene un buen historial contra su oponente.`,
        `${predictedWinner} tiene jugadores clave que regresan de lesiones.`,
        `${predictedWinner} tiene una ventaja estadística en eficiencia ofensiva.`,
        `${predictedWinner} ha tenido buen rendimiento en condiciones climáticas similares.`
      ];
      reasoning = reasonings[Math.floor(Math.random() * reasonings.length)];
    } else {
      // English reasoning
      const reasonings = [
        `${predictedWinner} has won 7 of their last 10 games.`,
        `${predictedWinner} has a strong historical performance against their opponent.`,
        `${predictedWinner} has key players returning from injury.`,
        `${predictedWinner} has a statistical advantage in offensive efficiency.`,
        `${predictedWinner} has performed well in similar weather conditions.`
      ];
      reasoning = reasonings[Math.floor(Math.random() * reasonings.length)];
    }
    
    // Get historical accuracy
    const historicalAccuracy = getHistoricalAccuracy(sport);
    
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
};

/**
 * Get AI predictions for a list of games
 * @param games - List of games
 * @returns Games with AI predictions
 */
export const getAIPredictions = async (games: Game[]): Promise<Game[]> => {
  try {
    // Check if user has premium access
    const userId = auth.currentUser?.uid;
    let hasPremium = false;
    
    if (userId) {
      hasPremium = await hasPremiumAccess(userId);
    }
    
    // If user doesn't have premium access, return games without predictions
    if (!hasPremium) {
      return games;
    }
    
    // Generate predictions for each game
    const gamesWithPredictions = await Promise.all(
      games.map(async (game) => {
        const prediction = await generateAIPrediction(game);
        return {
          ...game,
          ai_prediction: prediction
        };
      })
    );
    
    return gamesWithPredictions;
  } catch (error) {
    console.error('Error generating AI predictions:', error);
    return games;
  }
};

/**
 * Simulate real-time game updates
 * @param game - The game to update
 * @returns Updated game
 */
export const getLiveGameUpdates = (game: Game): Game => {
  // Check if game is in progress
  const gameTime = new Date(game.commence_time);
  const now = new Date();
  
  // If game hasn't started yet, return the original game
  if (gameTime > now) {
    return game;
  }
  
  // Simulate game in progress
  const homeScore = Math.floor(Math.random() * 30);
  const awayScore = Math.floor(Math.random() * 30);
  
  // Simulate time remaining
  const periods = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
  const period = periods[Math.floor(Math.random() * periods.length)];
  
  // Simulate minutes remaining (0-15)
  const minutesRemaining = Math.floor(Math.random() * 15);
  const timeRemaining = `${minutesRemaining}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
  
  return {
    ...game,
    live_updates: {
      score: {
        home: homeScore,
        away: awayScore
      },
      time_remaining: timeRemaining,
      period,
      last_update: new Date().toISOString()
    }
  };
};

/**
 * Get real-time updates for a list of games
 * @param games - List of games
 * @returns Games with real-time updates
 */
export const getLiveUpdates = (games: Game[]): Game[] => {
  return games.map(game => getLiveGameUpdates(game));
};

/**
 * Get game results for comparison with predictions
 * @param gameId - Game ID
 * @returns Game result
 */
export const getGameResult = async (gameId: string): Promise<GameResult | null> => {
  // In a real app, this would fetch actual game results from an API
  // For now, we'll simulate results
  
  // Randomly determine if the game is finished
  const statuses = ['scheduled', 'in_progress', 'finished', 'cancelled'];
  const status = statuses[Math.floor(Math.random() * statuses.length)] as GameResult['status'];
  
  if (status === 'finished') {
    const homeScore = Math.floor(Math.random() * 30);
    const awayScore = Math.floor(Math.random() * 30);
    
    return {
      home_score: homeScore,
      away_score: awayScore,
      status,
      winner: homeScore > awayScore ? 'home' : 'away',
      last_update: new Date().toISOString()
    };
  } else if (status === 'in_progress') {
    const homeScore = Math.floor(Math.random() * 20);
    const awayScore = Math.floor(Math.random() * 20);
    
    return {
      home_score: homeScore,
      away_score: awayScore,
      status,
      last_update: new Date().toISOString()
    };
  } else {
    return {
      status,
      last_update: new Date().toISOString()
    };
  }
};

/**
 * Get daily betting insights
 * @returns Daily insights
 */
export const getDailyInsights = async (): Promise<DailyInsight> => {
  // In a real app, this would fetch insights from an AI model or API
  // For now, we'll generate random insights
  
  // Generate random top picks
  const topPicks = Array.from({ length: 3 }, (_, i) => {
    const homeTeam = `Team ${String.fromCharCode(65 + i * 2)}`;
    const awayTeam = `Team ${String.fromCharCode(66 + i * 2)}`;
    const pick = Math.random() > 0.5 ? homeTeam : awayTeam;
    
    const confidenceLevels: ConfidenceLevel[] = ['high', 'medium', 'low'];
    const confidence = confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)];
    
    const reasonings = [
      `${pick} has a strong home field advantage.`,
      `${pick} has key players returning from injury.`,
      `${pick} has a statistical edge in this matchup.`,
      `${pick} has won the last 3 meetings against their opponent.`
    ];
    
    return {
      game_id: `game-${i}`,
      home_team: homeTeam,
      away_team: awayTeam,
      pick,
      confidence,
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)]
    };
  });
  
  // Generate trending bets
  const trendingBets = [
    { game_id: 'trend-1', description: 'Over 45.5 points in Lakers vs Warriors' },
    { game_id: 'trend-2', description: 'Chiefs to win by 7+ points' },
    { game_id: 'trend-3', description: 'Yankees to score in the first inning' }
  ];
  
  return {
    id: 'daily-insights',
    date: new Date().toISOString().split('T')[0],
    top_picks: topPicks,
    trending_bets: trendingBets
  };
};

/**
 * Generate an AI prediction for a player prop bet
 * @param propBet - The player prop bet to predict
 * @returns AI prediction for the player prop bet
 */
export const generatePropBetPrediction = async (propBet: PropBetLine): Promise<PropBetPrediction> => {
  // In a real app, this would call an AI model API
  // For now, we'll simulate AI predictions with random data
  
  // Randomly select over or under
  const prediction = Math.random() > 0.5 ? 'over' : 'under';
  
  // Generate a confidence score (0-100)
  const confidenceScore = Math.floor(Math.random() * 100);
  
  // Determine confidence level based on score
  let confidence: ConfidenceLevel;
  if (confidenceScore >= 70) {
    confidence = 'high';
  } else if (confidenceScore >= 40) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // Generate reasoning based on prop type
  let reasoning = '';
  switch (propBet.type) {
    case 'points':
      reasoning = prediction === 'over'
        ? `${propBet.player} has exceeded this points line in 7 of the last 10 games.`
        : `${propBet.player} has gone under this points line in 6 of the last 10 games.`;
      break;
    case 'rebounds':
      reasoning = prediction === 'over'
        ? `${propBet.player} has a favorable rebounding matchup against this opponent.`
        : `${propBet.player}'s rebounding numbers tend to decrease against this opponent.`;
      break;
    case 'assists':
      reasoning = prediction === 'over'
        ? `${propBet.player} has been more involved in the offense recently.`
        : `${propBet.player} may see reduced playmaking opportunities in this matchup.`;
      break;
    case 'touchdowns':
      reasoning = prediction === 'over'
        ? `${propBet.player} has scored in 3 consecutive games.`
        : `${propBet.player} faces a tough red zone defense.`;
      break;
    default:
      reasoning = prediction === 'over'
        ? `${propBet.player} has been performing above expectations recently.`
        : `${propBet.player} may struggle to reach this line based on recent performance.`;
  }
  
  // Simulate historical accuracy (60-95%)
  const historicalAccuracy = 60 + Math.floor(Math.random() * 35);
  
  // All prop bet predictions are premium content
  const isPremium = true;
  
  return {
    propBet,
    prediction,
    confidence,
    confidenceScore,
    reasoning,
    historicalAccuracy,
    isPremium
  };
};

/**
 * Get AI predictions for a list of player prop bets
 * @param propBets - List of player prop bets
 * @returns Player prop bets with AI predictions
 */
export const getPropBetPredictions = async (propBets: PropBetLine[]): Promise<PropBetPrediction[]> => {
  try {
    // Check if user has premium access
    const userId = auth.currentUser?.uid;
    let hasPremium = false;
    
    if (userId) {
      hasPremium = await hasPremiumAccess(userId);
    }
    
    // If user doesn't have premium access, return empty array
    if (!hasPremium) {
      return [];
    }
    
    // Generate predictions for each prop bet
    const predictions = await Promise.all(
      propBets.map(async (propBet) => {
        return await generatePropBetPrediction(propBet);
      })
    );
    
    return predictions;
  } catch (error) {
    console.error('Error generating prop bet predictions:', error);
    return [];
  }
};

/**
 * Get sample player prop bets for a game
 * @param game - The game to get prop bets for
 * @returns List of player prop bets
 */
export const getSamplePropBets = (game: Game): PropBetLine[] => {
  // In a real app, this would fetch actual prop bets from an API
  // For now, we'll generate sample prop bets
  
  // Generate player names based on team names
  const homeTeamPlayers = [
    `${game.home_team.split(' ')[game.home_team.split(' ').length - 1].charAt(0)}. Johnson`,
    `${game.home_team.split(' ')[game.home_team.split(' ').length - 1].charAt(0)}. Smith`,
    `${game.home_team.split(' ')[game.home_team.split(' ').length - 1].charAt(0)}. Williams`
  ];
  
  const awayTeamPlayers = [
    `${game.away_team.split(' ')[game.away_team.split(' ').length - 1].charAt(0)}. Brown`,
    `${game.away_team.split(' ')[game.away_team.split(' ').length - 1].charAt(0)}. Davis`,
    `${game.away_team.split(' ')[game.away_team.split(' ').length - 1].charAt(0)}. Miller`
  ];
  
  // Determine sport type based on game title
  let propTypes: PropBetType[] = [];
  if (game.sport_title.toLowerCase().includes('basketball')) {
    propTypes = ['points', 'rebounds', 'assists', 'threePointers'];
  } else if (game.sport_title.toLowerCase().includes('football')) {
    propTypes = ['passingYards', 'rushingYards', 'receivingYards', 'touchdowns'];
  } else if (game.sport_title.toLowerCase().includes('baseball')) {
    propTypes = ['hits', 'strikeouts', 'homeRuns'];
  } else if (game.sport_title.toLowerCase().includes('hockey')) {
    propTypes = ['goals', 'assists', 'saves'];
  } else {
    propTypes = ['points', 'assists', 'goals'];
  }
  
  // Generate prop bets
  const propBets: PropBetLine[] = [];
  
  // Home team props
  homeTeamPlayers.forEach(player => {
    const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
    let line = 0;
    
    // Set reasonable lines based on prop type
    switch (propType) {
      case 'points':
        line = 15.5 + Math.floor(Math.random() * 15);
        break;
      case 'rebounds':
        line = 5.5 + Math.floor(Math.random() * 10);
        break;
      case 'assists':
        line = 3.5 + Math.floor(Math.random() * 8);
        break;
      case 'threePointers':
        line = 1.5 + Math.floor(Math.random() * 5);
        break;
      case 'passingYards':
        line = 225.5 + Math.floor(Math.random() * 100);
        break;
      case 'rushingYards':
        line = 55.5 + Math.floor(Math.random() * 70);
        break;
      case 'receivingYards':
        line = 45.5 + Math.floor(Math.random() * 80);
        break;
      case 'touchdowns':
        line = 0.5 + Math.floor(Math.random() * 2);
        break;
      default:
        line = 9.5 + Math.floor(Math.random() * 10);
    }
    
    propBets.push({
      type: propType,
      player,
      team: game.home_team,
      line,
      overOdds: -110 + Math.floor(Math.random() * 40) - 20,
      underOdds: -110 + Math.floor(Math.random() * 40) - 20
    });
  });
  
  // Away team props
  awayTeamPlayers.forEach(player => {
    const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
    let line = 0;
    
    // Set reasonable lines based on prop type
    switch (propType) {
      case 'points':
        line = 15.5 + Math.floor(Math.random() * 15);
        break;
      case 'rebounds':
        line = 5.5 + Math.floor(Math.random() * 10);
        break;
      case 'assists':
        line = 3.5 + Math.floor(Math.random() * 8);
        break;
      case 'threePointers':
        line = 1.5 + Math.floor(Math.random() * 5);
        break;
      case 'passingYards':
        line = 225.5 + Math.floor(Math.random() * 100);
        break;
      case 'rushingYards':
        line = 55.5 + Math.floor(Math.random() * 70);
        break;
      case 'receivingYards':
        line = 45.5 + Math.floor(Math.random() * 80);
        break;
      case 'touchdowns':
        line = 0.5 + Math.floor(Math.random() * 2);
        break;
      default:
        line = 9.5 + Math.floor(Math.random() * 10);
    }
    
    propBets.push({
      type: propType,
      player,
      team: game.away_team,
      line,
      overOdds: -110 + Math.floor(Math.random() * 40) - 20,
      underOdds: -110 + Math.floor(Math.random() * 40) - 20
    });
  });
  
  return propBets;
};

/**
 * Get free AI prediction for a game (limited to one per day)
 * @param games - List of games
 * @returns Game with AI prediction
 */
export const getFreeDailyPick = async (games: Game[]): Promise<Game | null> => {
  try {
    // Check if user is logged in
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return null;
    }
    
    // Check if user has already used their free daily pick
    const hasUsedPick = await hasUsedFreeDailyPick(userId);
    if (hasUsedPick) {
      return null;
    }
    
    // Select a random game for the free pick
    if (games.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * games.length);
    const selectedGame = games[randomIndex];
    
    // Generate prediction for the selected game
    const prediction = await generateAIPrediction(selectedGame);
    
    // Mark the free daily pick as used
    await markFreeDailyPickAsUsed(userId, selectedGame.id);
    
    return {
      ...selectedGame,
      ai_prediction: prediction
    };
  } catch (error) {
    console.error('Error generating free daily pick:', error);
    return null;
  }
};

/**
 * Get blurred AI predictions for a list of games (for free users)
 * @param games - List of games
 * @returns Games with blurred AI predictions
 */
export const getBlurredPredictions = async (games: Game[]): Promise<Game[]> => {
  try {
    // Generate predictions for each game but blur the confidence scores
    const gamesWithBlurredPredictions = await Promise.all(
      games.map(async (game) => {
        const prediction = await generateAIPrediction(game);
        
        // Create a blurred version of the prediction
        const blurredPrediction = {
          ...prediction,
          confidence_score: -1, // Hide the actual score
          reasoning: 'Upgrade to premium to see detailed reasoning',
          historical_accuracy: -1 // Hide the actual accuracy
        };
        
        return {
          ...game,
          ai_prediction: blurredPrediction
        };
      })
    );
    
    return gamesWithBlurredPredictions;
  } catch (error) {
    console.error('Error generating blurred predictions:', error);
    return games;
  }
};

/**
 * Get trending bets data (available to free users)
 * @returns Trending bets data
 */
export const getTrendingBets = async (): Promise<{game_id: string, description: string, percentage: number}[]> => {
  // In a real app, this would fetch actual trending bets from an API
  // For now, we'll generate sample trending bets
  return [
    { game_id: 'trend-1', description: 'Lakers vs Warriors', percentage: 78 },
    { game_id: 'trend-2', description: 'Chiefs to win by 7+ points', percentage: 65 },
    { game_id: 'trend-3', description: 'Yankees to score in the first inning', percentage: 52 },
    { game_id: 'trend-4', description: 'Celtics vs Bucks under 220.5', percentage: 61 },
    { game_id: 'trend-5', description: 'Cowboys -3.5 vs Eagles', percentage: 57 }
  ];
};

/**
 * Get community poll data
 * @returns Community poll data
 */
export const getCommunityPolls = async (): Promise<{
  id: string;
  question: string;
  options: {id: string, text: string, votes: number}[];
  totalVotes: number;
  aiPrediction?: string;
}[]> => {
  // In a real app, this would fetch actual community polls from an API
  // For now, we'll generate sample polls
  return [
    {
      id: 'poll-1',
      question: 'Who will win tonight: Lakers or Warriors?',
      options: [
        { id: 'option-1', text: 'Lakers', votes: 342 },
        { id: 'option-2', text: 'Warriors', votes: 289 }
      ],
      totalVotes: 631,
      aiPrediction: 'Lakers'
    },
    {
      id: 'poll-2',
      question: 'Will the Chiefs cover the -7.5 spread vs Raiders?',
      options: [
        { id: 'option-1', text: 'Yes', votes: 187 },
        { id: 'option-2', text: 'No', votes: 213 }
      ],
      totalVotes: 400,
      aiPrediction: 'No'
    },
    {
      id: 'poll-3',
      question: 'Over/Under 220.5 points in Celtics vs Bucks?',
      options: [
        { id: 'option-1', text: 'Over', votes: 156 },
        { id: 'option-2', text: 'Under', votes: 178 }
      ],
      totalVotes: 334,
      aiPrediction: 'Under'
    }
  ];
};

/**
 * Get AI vs public betting leaderboard data
 * @returns Leaderboard data
 */
export const getAILeaderboard = async (): Promise<{
  date: string;
  aiAccuracy: number;
  publicAccuracy: number;
  isPremium: boolean;
}[]> => {
  // In a real app, this would fetch actual leaderboard data from an API
  // For now, we'll generate sample data
  const today = new Date();
  const entries = [];
  
  // Generate entries for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Format date as MM/DD
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
    
    // Generate random accuracy percentages
    const aiAccuracy = 55 + Math.floor(Math.random() * 25); // 55-80%
    const publicAccuracy = 45 + Math.floor(Math.random() * 15); // 45-60%
    
    // Make recent days premium-only
    const isPremium = i < 3;
    
    entries.push({
      date: formattedDate,
      aiAccuracy,
      publicAccuracy,
      isPremium
    });
  }
  
  return entries;
};

/**
 * Get sport-specific reasonings
 * @param sport - Sport name
 * @param team - Team name
 * @param language - Language code
 * @returns Array of reasonings
 */
const getSportSpecificReasonings = (sport: string, team: string, language: string): string[] => {
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
};

/**
 * Get historical accuracy for a sport
 * @param sport - Sport name
 * @returns Historical accuracy percentage
 */
const getHistoricalAccuracy = (sport: string): number => {
  // In a real implementation, this would calculate accuracy from feedback data
  // For now, we'll return a random value between 60-95%
  return 60 + Math.floor(Math.random() * 35);
};

/**
 * Record prediction feedback
 * @param gameId - Game ID
 * @param prediction - Prediction made
 * @param actualWinner - Actual winner
 * @returns Success status
 */
export const recordPredictionFeedback = async (
  gameId: string,
  prediction: AIPrediction,
  actualWinner: string
): Promise<boolean> => {
  try {
    const wasCorrect = prediction.predicted_winner === actualWinner;
    
    // Create feedback entry
    const feedback: PredictionFeedback = {
      gameId,
      predictedWinner: prediction.predicted_winner,
      actualWinner,
      wasCorrect,
      confidenceScore: prediction.confidence_score,
      timestamp: Date.now()
    };
    
    // Add to feedback cache
    feedbackCache.push(feedback);
    
    // In a real implementation, this would save feedback to a database
    // For now, we'll just log it
    console.log('Prediction feedback recorded:', feedback);
    
    return true;
  } catch (error) {
    console.error('Error recording prediction feedback:', error);
    return false;
  }
};

export default {
  getAIPredictions,
  getLiveUpdates,
  getGameResult,
  getDailyInsights,
  getPropBetPredictions,
  getSamplePropBets,
  getFreeDailyPick,
  getBlurredPredictions,
  getTrendingBets,
  getCommunityPolls,
  getAILeaderboard,
  recordPredictionFeedback,
  loadModel,
  generateAIPrediction
};