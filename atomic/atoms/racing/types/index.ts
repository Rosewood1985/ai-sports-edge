/**
 * Racing Atomic Types
 * Core type definitions for racing features
 * Part of Phase 1: Racing Data Integration Plan
 */

// Re-export NASCAR types from data service
export type {
  NascarRaceData,
  NascarDriverResult,
  NascarDriverStats,
  NascarSeasonData,
} from '../../../../services/racing/nascarDataService';

// Re-export Horse Racing types from data service
export type {
  RpscrapeMeeting,
  RpscrapeRace,
  RpscrapeRunner,
  RpscrapeResult,
  HorseRacingMLFeatures,
} from '../../../../services/racing/horseRacingDataService';

// Re-export base horse racing types
export type {
  Race,
  Horse,
  Track,
  Jockey,
  Trainer,
  BettingOption,
  UserBet,
  RacePrediction,
  TrackCondition,
  RaceStatus,
  RaceType,
  RaceGrade,
  BetType,
} from '../../../../types/horseRacing';

// Common racing prediction types
export interface RacingPrediction {
  id: string;
  sport: 'nascar' | 'horse_racing';
  raceId: string;
  raceName: string;
  date: string;
  confidence: number;
  predictions: {
    position: number;
    participant: string;
    confidence: number;
  }[];
  mlFeatures?: any;
  generatedAt: string;
}

// Racing analytics types
export interface RacingAnalytics {
  sport: 'nascar' | 'horse_racing';
  period: 'day' | 'week' | 'month' | 'season';
  accuracy: number;
  totalPredictions: number;
  successfulPredictions: number;
  averageConfidence: number;
  bestPerformingTracks: string[];
  topFeatures: {
    feature: string;
    importance: number;
  }[];
}

// Racing cache key types
export type RacingCacheKey =
  | `nascar_data_${string}`
  | `horse_racing_data_${string}`
  | `racing_prediction_${string}`
  | `racing_analytics_${string}`;

// Racing API response types
export interface RacingApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  source: 'nascar_data' | 'rpscrape' | 'api' | 'cache';
}

// Racing feature importance types
export interface RacingFeatureImportance {
  feature: string;
  importance: number;
  category: 'participant' | 'track' | 'weather' | 'historical' | 'market';
  description: string;
}

// Racing model performance types
export interface RacingModelPerformance {
  sport: 'nascar' | 'horse_racing';
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastUpdated: string;
  trainingDataSize: number;
  featureCount: number;
}
