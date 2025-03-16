import { Game, AIPrediction, ConfidenceLevel, DailyInsight, GameResult } from '../types/odds';
import { auth } from '../config/firebase';
import { hasPremiumAccess } from './subscriptionService';

/**
 * Generate an AI prediction for a game
 * @param game - The game to predict
 * @returns AI prediction
 */
export const generateAIPrediction = async (game: Game): Promise<AIPrediction> => {
  // In a real app, this would call an AI model API
  // For now, we'll simulate AI predictions with random data
  
  // Randomly select a winner
  const teams = [game.home_team, game.away_team];
  const predictedWinner = teams[Math.floor(Math.random() * teams.length)];
  
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
  
  // Generate reasoning
  const reasonings = [
    `${predictedWinner} has won 7 of their last 10 games.`,
    `${predictedWinner} has a strong historical performance against their opponent.`,
    `${predictedWinner} has key players returning from injury.`,
    `${predictedWinner} has a statistical advantage in offensive efficiency.`,
    `${predictedWinner} has performed well in similar weather conditions.`
  ];
  
  const reasoning = reasonings[Math.floor(Math.random() * reasonings.length)];
  
  // Simulate historical accuracy (60-95%)
  const historicalAccuracy = 60 + Math.floor(Math.random() * 35);
  
  return {
    predicted_winner: predictedWinner,
    confidence,
    confidence_score: confidenceScore,
    reasoning,
    historical_accuracy: historicalAccuracy
  };
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

export default {
  getAIPredictions,
  getLiveUpdates,
  getGameResult,
  getDailyInsights
};