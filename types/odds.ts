/**
 * Types for the odds data returned by the API
 */

export interface Outcome {
  name: string;
  price: number;
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

/**
 * AI confidence level for predictions
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * AI prediction for a game
 */
export interface AIPrediction {
  predicted_winner: string;
  confidence: ConfidenceLevel;
  confidence_score: number; // 0-100
  reasoning: string;
  historical_accuracy: number; // Percentage of correct predictions for similar games
}

/**
 * Game result for comparison with predictions
 */
export interface GameResult {
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'in_progress' | 'finished' | 'cancelled';
  winner?: 'home' | 'away' | 'draw';
  last_update: string;
}

/**
 * Live game updates
 */
export interface LiveUpdates {
  score?: {
    home: number;
    away: number;
  };
  time_remaining?: string;
  period?: string;
  last_update: string;
}

export interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
  ai_prediction?: AIPrediction;
  game_result?: GameResult;
  live_updates?: LiveUpdates;
}

export interface OddsApiResponse {
  success: boolean;
  data: Game[];
}

/**
 * Daily betting insights
 */
export interface DailyInsight {
  id: string;
  date: string;
  top_picks: {
    game_id: string;
    home_team: string;
    away_team: string;
    pick: string;
    confidence: ConfidenceLevel;
    reasoning: string;
  }[];
  trending_bets: {
    game_id: string;
    description: string;
  }[];
}
