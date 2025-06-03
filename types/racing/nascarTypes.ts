/**
 * NASCAR Racing Types - Phase 2: Data Transformation Pipeline
 * Standardized schemas for ML-compatible NASCAR data
 * Part of Racing Data Integration Plan
 */

// Base racing participant interface
interface BaseRacingParticipant {
  id: string;
  name: string;
  currentPoints: number;
  seasonPosition: number;
}

// NASCAR-specific standardized driver interface
export interface StandardizedNascarDriver extends BaseRacingParticipant {
  number: number;
  team: string;
  manufacturer: 'Ford' | 'Chevrolet' | 'Toyota';

  // Performance metrics
  stats: {
    wins: number;
    top5Finishes: number;
    top10Finishes: number;
    poles: number;
    lapsLed: number;
    averageFinish: number;
    averageStart: number;
    dnfCount: number;

    // Calculated percentages
    winRate: number;
    top5Rate: number;
    top10Rate: number;
    dnfRate: number;
  };

  // Recent form (last 5 races)
  recentForm: {
    positions: number[];
    averageFinish: number;
    trend: 'improving' | 'declining' | 'stable';
  };

  // Track-specific performance
  trackPerformance?: {
    [trackId: string]: {
      averageFinish: number;
      bestFinish: number;
      starts: number;
      wins: number;
    };
  };
}

// NASCAR race standardized interface
export interface StandardizedNascarRace {
  id: string;
  season: number;
  raceNumber: number;
  name: string;

  // Track information
  track: {
    id: string;
    name: string;
    type: 'superspeedway' | 'intermediate' | 'short' | 'road_course' | 'dirt';
    length: number; // in miles
    bankingDegrees?: number;
    surface: string;
  };

  // Race details
  schedule: {
    date: string;
    startTime: string;
    timezone: string;
  };

  // Race specifications
  specs: {
    totalLaps: number;
    distance: number; // in miles
    stages?: {
      stage1Laps: number;
      stage2Laps: number;
      finalStageLaps: number;
    };
  };

  // Weather conditions
  weather?: {
    temperature: number;
    windSpeed: number;
    windDirection: string;
    precipitation: boolean;
    condition: string;
  };

  // Race results (if completed)
  results?: StandardizedNascarResult[];

  // Prediction metadata
  predictionMetadata?: {
    confidence: number;
    lastUpdated: string;
    dataQuality: number;
  };
}

// NASCAR race result standardized interface
export interface StandardizedNascarResult {
  driverId: string;
  driverName: string;
  carNumber: number;
  team: string;
  manufacturer: 'Ford' | 'Chevrolet' | 'Toyota';

  // Finishing position
  finishPosition: number;
  startPosition: number;
  positionsGained: number;

  // Performance metrics
  performance: {
    lapsCompleted: number;
    lapsLed: number;
    timesLed: number;
    status: 'running' | 'accident' | 'engine' | 'transmission' | 'other';
    points: number;
    bonusPoints: number;
    totalPoints: number;
  };

  // Financial
  winnings: number;

  // Speed metrics
  speed?: {
    averageSpeed: number;
    fastestLap?: number;
    qualifyingSpeed?: number;
    qualifyingPosition?: number;
  };

  // Stage results
  stageResults?: {
    stage1Position?: number;
    stage2Position?: number;
    stage1Points?: number;
    stage2Points?: number;
  };
}

// ML Feature vector for NASCAR predictions
export interface NascarMLFeatures {
  raceId: string;
  driverId: string;

  // Driver features
  driverFeatures: {
    // Current season performance
    currentSeasonWins: number;
    currentSeasonTop5: number;
    currentSeasonTop10: number;
    currentSeasonAverageFinish: number;
    currentSeasonPoints: number;
    currentSeasonPosition: number;

    // Career statistics
    careerWins: number;
    careerStarts: number;
    careerWinRate: number;
    careerTop5Rate: number;
    careerTop10Rate: number;
    careerDnfRate: number;

    // Recent form (weighted)
    last5AverageFinish: number;
    last10AverageFinish: number;
    formTrend: number; // -1 to 1 (declining to improving)

    // Experience
    yearsExperience: number;
    startsThisSeason: number;
  };

  // Track-specific features
  trackFeatures: {
    trackType: number; // Encoded: 0=superspeedway, 1=intermediate, 2=short, 3=road, 4=dirt
    trackLength: number;
    trackBanking: number;

    // Driver performance at this track
    driverTrackStarts: number;
    driverTrackWins: number;
    driverTrackAverageFinish: number;
    driverTrackBestFinish: number;
    driverTrackWinRate: number;

    // Driver performance at similar tracks
    similarTrackPerformance: number;
  };

  // Team/Equipment features
  teamFeatures: {
    manufacturer: number; // Encoded: 0=Ford, 1=Chevrolet, 2=Toyota
    teamWinsThisSeason: number;
    teamTop5ThisSeason: number;
    teamAverageFinishThisSeason: number;
    teamResourceRating: number; // 1-10 scale
  };

  // Race context features
  raceFeatures: {
    raceNumber: number; // Race in season (1-36)
    seasonProgress: number; // 0-1 (season completion percentage)
    playoffRace: boolean;
    stageRace: boolean;
    nightRace: boolean;

    // Starting position effects
    startPosition: number;
    qualifyingSpeed: number;
    qualifyingPosition: number;

    // Field strength
    fieldStrength: number; // Average rating of all drivers
    competitionLevel: number; // Standard deviation of driver ratings
  };

  // Weather features
  weatherFeatures: {
    temperature: number;
    windSpeed: number;
    windDirection: number; // Degrees
    precipitationRisk: number; // 0-1
    weatherImpact: number; // Calculated impact on performance
  };

  // Historical features
  historicalFeatures: {
    // Head-to-head comparisons
    vsTopDriversRecord: number; // Win rate vs top 10 drivers
    vsTeammateRecord: number; // Performance vs teammates

    // Situational performance
    frontRowStarts: number;
    backRowStarts: number;
    frontRowAverageFinish: number;
    backRowAverageFinish: number;

    // Momentum indicators
    momentumScore: number; // -1 to 1
    consistencyScore: number; // 0 to 1
    clutchPerformance: number; // Performance in important races
  };

  // Target variables (for training)
  targets?: {
    finishPosition: number;
    willWin: boolean;
    willTop5: boolean;
    willTop10: boolean;
    willLead: boolean;
    lapsLedPrediction: number;
    pointsPrediction: number;
  };

  // Feature metadata
  metadata: {
    featureVersion: string;
    dataQuality: number; // 0-1
    lastUpdated: string;
    sourceReliability: number; // 0-1
  };
}

// NASCAR prediction output interface
export interface NascarPrediction {
  raceId: string;
  raceName: string;
  generatedAt: string;

  // Model metadata
  model: {
    version: string;
    confidence: number;
    dataQuality: number;
  };

  // Driver predictions
  driverPredictions: {
    driverId: string;
    driverName: string;
    carNumber: number;

    // Position predictions
    predictedFinish: number;
    finishProbabilities: {
      win: number;
      top5: number;
      top10: number;
      top20: number;
    };

    // Performance predictions
    predictedLapsLed: number;
    predictedPoints: number;

    // Confidence and risk
    confidence: number;
    riskFactors: string[];
    keyStrengths: string[];
  }[];

  // Race-level predictions
  raceInsights: {
    expectedWinner: {
      driverId: string;
      driverName: string;
      probability: number;
    };

    darkHorses: {
      driverId: string;
      driverName: string;
      expectedFinish: number;
      upside: number;
    }[];

    keyBattles: {
      description: string;
      drivers: string[];
      importance: number;
    }[];

    weatherImpact: string;
    trackAdvantages: string[];
  };
}

// Performance metrics for model evaluation
export interface NascarModelPerformance {
  modelVersion: string;
  evaluationPeriod: {
    startDate: string;
    endDate: string;
    racesEvaluated: number;
  };

  // Accuracy metrics
  accuracy: {
    winnerPrediction: number; // Percentage of winners correctly predicted
    top5Accuracy: number;
    top10Accuracy: number;
    averagePositionError: number; // Mean absolute error

    // Position-specific accuracy
    polePositionAccuracy: number;
    frontRunnerAccuracy: number; // Top 10 starters
    midFieldAccuracy: number; // 11-25 starters
    backMarkerAccuracy: number; // 26+ starters
  };

  // Feature importance
  topFeatures: {
    featureName: string;
    importance: number;
    category: 'driver' | 'track' | 'team' | 'race' | 'weather' | 'historical';
  }[];

  // Model confidence analysis
  confidenceAnalysis: {
    highConfidencePredictions: number; // >80% confidence
    mediumConfidencePredictions: number; // 60-80% confidence
    lowConfidencePredictions: number; // <60% confidence

    highConfidenceAccuracy: number;
    mediumConfidenceAccuracy: number;
    lowConfidenceAccuracy: number;
  };

  // Business metrics
  businessMetrics: {
    userEngagement: number; // Click-through rate on predictions
    predictionViews: number;
    premiumConversions: number; // Users who paid for predictions
    userSatisfactionScore: number; // 1-5 rating
  };
}

// Validation schemas for data quality
export interface NascarDataValidation {
  raceId: string;
  validationTimestamp: string;

  // Data completeness checks
  completeness: {
    driverDataComplete: boolean;
    trackDataComplete: boolean;
    weatherDataComplete: boolean;
    historicalDataComplete: boolean;
    completenessScore: number; // 0-1
  };

  // Data accuracy checks
  accuracy: {
    driverStatsAccurate: boolean;
    pointsCalculationAccurate: boolean;
    dateTimeAccurate: boolean;
    accuracyScore: number; // 0-1
  };

  // Data freshness
  freshness: {
    lastDataUpdate: string;
    dataAge: number; // Hours since last update
    isStale: boolean;
  };

  // Anomaly detection
  anomalies: {
    detected: boolean;
    anomalyCount: number;
    anomalyTypes: string[];
    anomalySeverity: 'low' | 'medium' | 'high';
  };

  // Overall data quality score
  overallQuality: number; // 0-1
  recommendations: string[];
}
