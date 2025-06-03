// src/types/predictions.ts

export interface GamePrediction {
  id: string;
  gameId: string;
  sportId: string;
  leagueId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  gameDate: Date | number; // Firestore timestamp or Date

  // Prediction data
  homeWinProbability: number; // 0-1 probability
  awayWinProbability: number; // 0-1 probability
  drawProbability?: number; // For sports with draw possibility

  // Confidence metrics
  confidenceScore: number; // 0-1, model confidence in prediction
  sharpEdgeSignal: number; // Difference between sharp and public betting
  publicFadeScore: number; // Score indicating when to fade the public

  // Betting info
  spread: number; // Negative for home favorite, positive for away favorite
  overUnder: number; // Total points line
  homeMoneyline: number; // American odds format
  awayMoneyline: number; // American odds format

  // Recommendation
  recommendedBet?: string; // "HOME", "AWAY", "OVER", "UNDER", or null
  estimatedROI?: number; // Expected ROI based on model

  // Metadata
  lastUpdated: Date | number; // Firestore timestamp or Date
  modelVersion: string; // Version of the model that made the prediction
}

export interface LineMovement {
  id: string;
  gameId: string;
  timestamp: Date | number; // Firestore timestamp or Date

  // Line data
  spread: number;
  homeMoneyline: number;
  awayMoneyline: number;
  overUnder: number;

  // Movement data
  spreadMovement: number; // Change from previous spread
  homeMoneylineMovement: number; // Change from previous moneyline
  awayMoneylineMovement: number; // Change from previous moneyline
  overUnderMovement: number; // Change from previous over/under

  // Source and reason (if available)
  source: string; // Source of the line (e.g., "DraftKings", "FanDuel")
  reason?: string; // Reason for line movement (e.g., "Injury", "Weather")
}

export interface BettingAction {
  id: string;
  gameId: string;
  lastUpdated: Date | number; // Firestore timestamp or Date

  // Public betting percentages
  homeSpreadPublicPercentage: number; // 0-100
  awaySpreadPublicPercentage: number; // 0-100
  overPublicPercentage: number; // 0-100
  underPublicPercentage: number; // 0-100
  homeMoneylinePublicPercentage: number; // 0-100
  awayMoneylinePublicPercentage: number; // 0-100

  // Money percentages (sharp action)
  homeSpreadMoneyPercentage: number; // 0-100
  awaySpreadMoneyPercentage: number; // 0-100
  overMoneyPercentage: number; // 0-100
  underMoneyPercentage: number; // 0-100
  homeMoneylineMoneyPercentage: number; // 0-100
  awayMoneylineMoneyPercentage: number; // 0-100

  // Derived metrics
  spreadSharpActionRatio: number; // Money % / Ticket % (>1 indicates sharp on this side)
  overUnderSharpActionRatio: number;
  moneylineSharpActionRatio: number;
}

export interface PropBet {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  propType: string; // "POINTS", "REBOUNDS", "ASSISTS", "TOUCHDOWNS", etc.
  line: number;
  overOdds: number; // American odds format
  underOdds: number; // American odds format
  overProbability?: number; // AI-calculated probability
  underProbability?: number; // AI-calculated probability
  recommendedBet?: 'OVER' | 'UNDER' | null;
  confidenceScore?: number; // 0-1, model confidence in prediction
  trendData?: PropTrendData; // Historical performance data
}

export interface PropTrendData {
  last10Games: {
    date: Date | number;
    value: number;
    result: 'OVER' | 'UNDER' | 'PUSH';
  }[];
  seasonAverage: number;
  hitRate: number; // Percentage of time player has gone over this line
}

export interface KellyBetRecommendation {
  gameId: string;
  betType: string; // "SPREAD", "MONEYLINE", "OVER_UNDER", "PROP"
  selection: string; // "HOME", "AWAY", "OVER", "UNDER", etc.
  kellyStakePercentage: number; // Recommended stake as percentage of bankroll
  odds: number; // American odds format
  probability: number; // AI-calculated probability
  expectedValue: number; // Expected value of the bet
}
