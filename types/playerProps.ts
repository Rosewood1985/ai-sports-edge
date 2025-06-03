import { ConfidenceLevel } from './odds';

/**
 * Types of player prop bets
 */
export type PropBetType =
  | 'points'
  | 'rebounds'
  | 'assists'
  | 'threePointers'
  | 'blocks'
  | 'steals'
  | 'passingYards'
  | 'rushingYards'
  | 'receivingYards'
  | 'touchdowns'
  | 'goals'
  | 'saves'
  | 'strikeouts'
  | 'hits'
  | 'homeRuns';

/**
 * Player prop bet line
 */
export interface PropBetLine {
  type: PropBetType;
  player: string;
  team: string;
  line: number;
  overOdds: number;
  underOdds: number;
}

/**
 * AI prediction for a player prop bet
 */
export interface PropBetPrediction {
  propBet: PropBetLine;
  prediction: 'over' | 'under';
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100
  reasoning: string;
  historicalAccuracy: number; // Percentage of correct predictions for similar props
  isPremium: boolean; // Whether this prediction is for premium users only
}

/**
 * Player prop bet result
 */
export interface PropBetResult {
  propBet: PropBetLine;
  actualValue: number;
  result: 'over' | 'under' | 'push';
  timestamp: string;
}
