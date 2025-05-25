/**
 * Racing Data Database Schema
 * Optimized for ML query patterns and racing predictions
 * 
 * Phase 3: Storage and Caching Layer
 * Part of Racing Data Integration System
 */

import { 
  StandardizedNascarRace, 
  StandardizedNascarDriver, 
  NascarMLFeatures 
} from '../../types/racing/nascarTypes';
import { 
  StandardizedHorseRace, 
  StandardizedHorseRunner, 
  HorseRacingMLFeatures 
} from '../../types/racing/horseRacingTypes';
import { 
  MLFeatureVector, 
  RacingSport, 
  CacheMetadata 
} from '../../types/racing/commonTypes';

// Database Collection Interfaces
export interface RacingDataCollection {
  id: string;
  sport: RacingSport;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  dataQuality: number;
  mlCompatible: boolean;
}

// NASCAR Database Schema
export interface NascarRaceDocument extends RacingDataCollection {
  sport: 'nascar';
  raceData: StandardizedNascarRace;
  drivers: StandardizedNascarDriver[];
  mlFeatures: NascarMLFeatures[];
  predictions?: {
    modelId: string;
    confidence: number;
    predictions: any[];
    generatedAt: Date;
  }[];
  
  // Indexing fields for ML queries
  season: number;
  raceWeek: number;
  trackId: string;
  trackType: string;
  weather: string;
  seriesType: string;
  
  // Cache optimization fields
  cacheKey: string;
  cacheTier: 'hot' | 'warm' | 'cold';
  accessCount: number;
  lastAccessed: Date;
  priority: number;
}

export interface NascarDriverDocument extends RacingDataCollection {
  sport: 'nascar';
  driverData: StandardizedNascarDriver;
  
  // Performance tracking
  currentSeason: {
    wins: number;
    topFives: number;
    topTens: number;
    avgFinish: number;
    points: number;
    rank: number;
  };
  
  careerStats: {
    totalRaces: number;
    wins: number;
    winRate: number;
    avgFinish: number;
    championships: number;
  };
  
  // Track-specific performance
  trackPerformance: {
    [trackId: string]: {
      races: number;
      wins: number;
      avgFinish: number;
      winRate: number;
      bestFinish: number;
      lastRaceResult?: number;
    };
  };
  
  // ML optimization
  mlReadiness: boolean;
  featureVersion: string;
  modelCompatibility: string[];
}

// Horse Racing Database Schema
export interface HorseRaceDocument extends RacingDataCollection {
  sport: 'horse_racing';
  raceData: StandardizedHorseRace;
  runners: StandardizedHorseRunner[];
  mlFeatures: HorseRacingMLFeatures[];
  predictions?: {
    modelId: string;
    confidence: number;
    predictions: any[];
    generatedAt: Date;
  }[];
  
  // Indexing fields for ML queries
  raceDate: Date;
  trackId: string;
  raceType: string;
  distance: number;
  surface: string;
  grade: string;
  purse: number;
  weather: string;
  
  // Market data
  totalPool: number;
  favoriteOdds: number;
  fieldSize: number;
  
  // Cache optimization
  cacheKey: string;
  cacheTier: 'hot' | 'warm' | 'cold';
  accessCount: number;
  lastAccessed: Date;
  priority: number;
}

export interface HorseDocument extends RacingDataCollection {
  sport: 'horse_racing';
  horseData: {
    id: string;
    name: string;
    age: number;
    sex: string;
    color: string;
    sire: string;
    dam: string;
    trainer: string;
    owner: string;
    breeding: {
      country: string;
      bloodline: string;
      pedigreeRating: number;
    };
  };
  
  // Performance tracking
  careerStats: {
    starts: number;
    wins: number;
    places: number;
    shows: number;
    earnings: number;
    winRate: number;
    placeRate: number;
    avgFinish: number;
  };
  
  // Current form
  recentForm: {
    lastSixRaces: number[];
    formRating: number;
    daysOffLastRace: number;
    classMovement: string;
    speedFigures: number[];
  };
  
  // Surface/distance preferences
  preferences: {
    [surface: string]: {
      starts: number;
      wins: number;
      winRate: number;
      avgSpeedFigure: number;
    };
  };
  
  distancePerformance: {
    [distanceRange: string]: {
      starts: number;
      wins: number;
      winRate: number;
      avgFinish: number;
    };
  };
  
  // ML optimization
  mlReadiness: boolean;
  featureVersion: string;
  modelCompatibility: string[];
}

// ML Feature Storage Schema
export interface MLFeatureDocument extends RacingDataCollection {
  featureVector: MLFeatureVector;
  modelType: string;
  extractedAt: Date;
  validUntil: Date;
  
  // Feature metadata
  featureCount: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  
  // Cache and performance
  cacheKey: string;
  compressionRatio: number;
  accessPattern: 'training' | 'prediction' | 'validation';
  priority: number;
}

// Prediction Storage Schema
export interface PredictionDocument extends RacingDataCollection {
  predictionId: string;
  modelId: string;
  modelVersion: string;
  sport: RacingSport;
  
  // Input data
  raceId: string;
  features: MLFeatureVector[];
  
  // Prediction results
  predictions: {
    participantId: string;
    prediction: number;
    confidence: number;
    rank: number;
    probability: number;
  }[];
  
  // Model performance
  accuracy?: number;
  calibration?: number;
  reliability?: number;
  
  // Timing
  predictedAt: Date;
  raceTime: Date;
  actualResults?: {
    participantId: string;
    actualRank: number;
    actualResult: any;
  }[];
  
  // Cache optimization
  cacheKey: string;
  accessCount: number;
  served: boolean;
}

// Database Indexes for Optimal Query Performance
export const DATABASE_INDEXES = {
  nascarRaces: [
    { fields: ['season', 'raceWeek'], unique: false },
    { fields: ['trackId', 'season'], unique: false },
    { fields: ['trackType', 'weather'], unique: false },
    { fields: ['cacheTier', 'priority'], unique: false },
    { fields: ['mlCompatible', 'dataQuality'], unique: false },
    { fields: ['cacheKey'], unique: true },
    { fields: ['lastAccessed'], unique: false }
  ],
  
  nascarDrivers: [
    { fields: ['driverData.id'], unique: true },
    { fields: ['currentSeason.rank'], unique: false },
    { fields: ['mlReadiness', 'featureVersion'], unique: false },
    { fields: ['careerStats.winRate'], unique: false }
  ],
  
  horseRaces: [
    { fields: ['raceDate', 'trackId'], unique: false },
    { fields: ['trackId', 'raceType'], unique: false },
    { fields: ['distance', 'surface'], unique: false },
    { fields: ['grade', 'purse'], unique: false },
    { fields: ['cacheTier', 'priority'], unique: false },
    { fields: ['cacheKey'], unique: true },
    { fields: ['lastAccessed'], unique: false }
  ],
  
  horses: [
    { fields: ['horseData.id'], unique: true },
    { fields: ['horseData.trainer'], unique: false },
    { fields: ['careerStats.winRate'], unique: false },
    { fields: ['recentForm.formRating'], unique: false },
    { fields: ['mlReadiness', 'featureVersion'], unique: false }
  ],
  
  mlFeatures: [
    { fields: ['featureVector.id'], unique: true },
    { fields: ['sport', 'modelType'], unique: false },
    { fields: ['extractedAt', 'validUntil'], unique: false },
    { fields: ['accessPattern', 'priority'], unique: false },
    { fields: ['cacheKey'], unique: true }
  ],
  
  predictions: [
    { fields: ['predictionId'], unique: true },
    { fields: ['modelId', 'modelVersion'], unique: false },
    { fields: ['sport', 'raceId'], unique: false },
    { fields: ['predictedAt', 'raceTime'], unique: false },
    { fields: ['served', 'accessCount'], unique: false }
  ]
};

// Query Optimization Patterns
export const QUERY_PATTERNS = {
  // Most frequent ML queries
  getActiveRaceFeatures: {
    collection: 'mlFeatures',
    filter: { validUntil: { $gte: new Date() }, accessPattern: 'prediction' },
    sort: { priority: -1, extractedAt: -1 },
    limit: 100
  },
  
  getTrainingData: {
    collection: 'mlFeatures',
    filter: { accessPattern: 'training', completeness: { $gte: 0.95 } },
    sort: { extractedAt: -1 },
    limit: 10000
  },
  
  getDriverTrackPerformance: {
    collection: 'nascarDrivers',
    filter: { 'trackPerformance.{trackId}.races': { $gte: 5 } },
    projection: { 'trackPerformance.{trackId}': 1, 'careerStats': 1 }
  },
  
  getHorseFormData: {
    collection: 'horses',
    filter: { 'recentForm.lastSixRaces': { $exists: true, $ne: [] } },
    projection: { 'recentForm': 1, 'careerStats': 1, 'preferences': 1 }
  }
};

// Cache Configuration
export interface CacheConfiguration {
  tiers: {
    hot: {
      maxSize: number;        // 100MB
      ttl: number;           // 15 minutes
      compression: boolean;   // false
      priority: 'high';
    };
    warm: {
      maxSize: number;        // 500MB
      ttl: number;           // 2 hours
      compression: boolean;   // true
      priority: 'medium';
    };
    cold: {
      maxSize: number;        // 2GB
      ttl: number;           // 24 hours
      compression: boolean;   // true
      priority: 'low';
    };
  };
  
  evictionPolicy: 'lru' | 'lfu' | 'priority';
  compressionThreshold: number;
  prefetchPatterns: string[];
  invalidationRules: {
    [collection: string]: {
      triggers: string[];
      cascadeRules: string[];
    };
  };
}

export default {
  collections: {
    nascarRaces: NascarRaceDocument,
    nascarDrivers: NascarDriverDocument,
    horseRaces: HorseRaceDocument,
    horses: HorseDocument,
    mlFeatures: MLFeatureDocument,
    predictions: PredictionDocument
  },
  indexes: DATABASE_INDEXES,
  queryPatterns: QUERY_PATTERNS
};