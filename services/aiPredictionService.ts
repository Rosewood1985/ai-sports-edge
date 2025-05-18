import { Game, AIPrediction, ConfidenceLevel, DailyInsight, GameResult } from '../types/odds';
import { PropBetLine, PropBetPrediction, PropBetType } from '../types/playerProps';
import { auth } from '../config/firebase';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import {
  hasPremiumAccess,
  hasUsedFreeDailyPick,
  markFreeDailyPickAsUsed
} from './firebaseSubscriptionService';
import { mlPredictionService } from './mlPredictionService';

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
    // Use the ML prediction service to generate a prediction
    return await mlPredictionService.generatePrediction(game, language);
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
    
    // Generate predictions for each game using the ML prediction service
    const gamesWithPredictions = await Promise.all(
      games.map(async (game) => {
        const prediction = await mlPredictionService.generatePrediction(game);
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
    const prediction = await mlPredictionService.generatePrediction(selectedGame);
    
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
        const prediction = await mlPredictionService.generatePrediction(game);
        
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
    // Use the ML prediction service to record feedback
    return await mlPredictionService.recordFeedback(gameId, actualWinner);
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
  generateAIPrediction
};