/**
 * Horse Racing Types - Phase 2: Data Transformation Pipeline
 * Standardized schemas for ML-compatible Horse Racing data
 * Part of Racing Data Integration Plan
 */

// Base racing participant interface
interface BaseRacingParticipant {
  id: string;
  name: string;
  currentPoints: number;
  seasonPosition: number;
}

// Standardized horse interface for ML compatibility
export interface StandardizedHorse extends BaseRacingParticipant {
  // Basic information
  age: number;
  sex: 'colt' | 'filly' | 'mare' | 'stallion' | 'gelding';
  breed: string;
  color?: string;
  
  // Physical attributes
  physical: {
    weight: number; // in pounds
    height?: number; // in hands
    condition: number; // 1-10 fitness rating
  };
  
  // Performance statistics
  stats: {
    careerStarts: number;
    careerWins: number;
    careerPlaces: number; // 2nd place finishes
    careerShows: number; // 3rd place finishes
    careerEarnings: number;
    
    // Current season
    seasonStarts: number;
    seasonWins: number;
    seasonPlaces: number;
    seasonShows: number;
    seasonEarnings: number;
    
    // Calculated rates
    winRate: number;
    placeRate: number;
    showRate: number;
    earningsPerStart: number;
    strikeRate: number; // (wins + places + shows) / starts
  };
  
  // Recent form and trends
  form: {
    lastRaceDate: string;
    daysSinceLastRace: number;
    last5Positions: number[];
    formRating: number; // Calculated form score
    trend: 'improving' | 'declining' | 'stable';
  };
  
  // Breeding information
  pedigree: {
    sire: string;
    dam: string;
    sireWinRate?: number;
    damProgenyWinRate?: number;
    inbreeding?: number; // Coefficient of inbreeding
  };
  
  // Racing preferences and characteristics
  preferences: {
    preferredDistance: {
      min: number; // in furlongs
      max: number;
      optimal: number;
    };
    preferredGoing: string[]; // Track conditions
    preferredTrackType: string[]; // Turf, dirt, synthetic
    preferredRaceType: string[]; // Flat, hurdle, chase
  };
}

// Standardized jockey interface
export interface StandardizedJockey extends BaseRacingParticipant {
  // Basic information
  firstName: string;
  lastName: string;
  claimingAllowance: number; // Weight allowance for apprentice jockeys
  
  // Performance statistics
  stats: {
    careerRides: number;
    careerWins: number;
    careerPlaces: number;
    careerShows: number;
    careerWinRate: number;
    careerPlaceRate: number;
    careerShowRate: number;
    
    // Current season
    seasonRides: number;
    seasonWins: number;
    seasonPlaces: number;
    seasonShows: number;
    seasonWinRate: number;
    seasonPlaceRate: number;
    seasonShowRate: number;
    
    // Recent form
    last14DaysWins: number;
    last14DaysRides: number;
    last14DaysWinRate: number;
  };
  
  // Track and distance specialties
  specialties: {
    trackSpecialty?: {
      trackId: string;
      winRate: number;
      rides: number;
    }[];
    distanceSpecialty?: {
      distanceRange: string;
      winRate: number;
      rides: number;
    }[];
    goingSpecialty?: {
      going: string;
      winRate: number;
      rides: number;
    }[];
  };
  
  // Partnership performance
  partnerships: {
    trainerCombos: {
      trainerId: string;
      trainerName: string;
      ridesWithTrainer: number;
      winRateWithTrainer: number;
    }[];
    horseCombos: {
      horseId: string;
      horseName: string;
      ridesWithHorse: number;
      winRateWithHorse: number;
    }[];
  };
}

// Standardized trainer interface
export interface StandardizedTrainer extends BaseRacingParticipant {
  // Basic information
  firstName: string;
  lastName: string;
  stable: string;
  license: string;
  
  // Performance statistics
  stats: {
    careerRunners: number;
    careerWins: number;
    careerWinRate: number;
    careerROI: number; // Return on investment
    careerStrikeRate: number;
    
    // Current season
    seasonRunners: number;
    seasonWins: number;
    seasonWinRate: number;
    seasonROI: number;
    seasonStrikeRate: number;
    
    // Recent form
    last30DaysWins: number;
    last30DaysRunners: number;
    last30DaysWinRate: number;
  };
  
  // Specialties and strengths
  specialties: {
    ageGroupSpecialty?: {
      ageGroup: string; // '2yo', '3yo', '4yo+', etc.
      winRate: number;
      runners: number;
    }[];
    distanceSpecialty?: {
      distanceRange: string;
      winRate: number;
      runners: number;
    }[];
    raceTypeSpecialty?: {
      raceType: string;
      winRate: number;
      runners: number;
    }[];
  };
  
  // Stable management
  stableInfo: {
    averageStableSize: number;
    topHorses: string[]; // IDs of best performers
    yearlyTurnover: number; // Horses in/out of stable
  };
}

// Standardized race interface
export interface StandardizedHorseRace {
  id: string;
  
  // Basic race information
  meeting: {
    date: string;
    trackId: string;
    trackName: string;
    country: string;
    timezone: string;
  };
  
  // Race details
  raceInfo: {
    raceNumber: number;
    postTime: string;
    name?: string;
    raceType: 'flat' | 'hurdle' | 'steeplechase' | 'harness';
    surface: 'turf' | 'dirt' | 'synthetic';
    distance: number; // in furlongs
    going: string; // Track condition
    
    // Classification
    class: string;
    grade?: 'Group 1' | 'Group 2' | 'Group 3' | 'Listed' | 'Handicap' | 'Maiden' | 'Claiming';
    purse: number;
    currency: string;
    
    // Restrictions
    ageRestrictions?: string;
    sexRestrictions?: string;
    weightForAge: boolean;
  };
  
  // Field information
  field: {
    numberOfRunners: number;
    numberOfNonRunners: number;
    maximumRunners: number;
    runners: StandardizedHorseRunner[];
  };
  
  // Track conditions
  conditions: {
    going: string;
    goingDescription: string;
    railPosition?: string;
    trackBias?: string;
    
    // Weather
    weather?: {
      condition: string;
      temperature: number;
      windSpeed: number;
      windDirection: string;
      precipitation: boolean;
    };
  };
  
  // Betting information
  betting: {
    pools: string[]; // Available bet types
    totalPool?: number;
    favorite?: {
      horseId: string;
      odds: number;
    };
    
    // Market analysis
    marketStrength: number; // 1-10 rating
    competitiveRace: boolean;
    
    // Odds data
    morningLineOdds?: { [horseId: string]: number };
    currentOdds?: { [horseId: string]: number };
    finalOdds?: { [horseId: string]: number };
  };
  
  // Results (if race completed)
  results?: StandardizedHorseRaceResult[];
  
  // Prediction metadata
  predictionMetadata?: {
    confidence: number;
    lastUpdated: string;
    dataQuality: number;
    modelVersion: string;
  };
}

// Standardized horse runner in a race
export interface StandardizedHorseRunner {
  // Identification
  horseId: string;
  saddleNumber: number;
  postPosition: number;
  isScratched: boolean;
  scratchedReason?: string;
  
  // Participants
  horse: StandardizedHorse;
  jockey: StandardizedJockey;
  trainer: StandardizedTrainer;
  
  // Race-specific information
  raceInfo: {
    weight: number; // Assigned weight
    claimingPrice?: number;
    medication?: string[];
    equipment?: string[]; // Blinkers, tongue tie, etc.
    
    // Breeding eligibility
    allowances?: string[];
    penalties?: string[];
  };
  
  // Form and preparation
  preparation: {
    lastRaceDate: string;
    daysSinceLastRace: number;
    workouts?: {
      date: string;
      distance: string;
      time: string;
      surface: string;
    }[];
    trialRuns?: {
      date: string;
      position: number;
      time: string;
    }[];
  };
  
  // Market information
  market: {
    morningLineOdds: number;
    currentOdds: number;
    impliedProbability: number;
    marketRank: number;
    publicSupport: number; // Percentage of betting volume
  };
}

// Standardized race result
export interface StandardizedHorseRaceResult {
  horseId: string;
  finishPosition: number;
  
  // Performance details
  performance: {
    winningMargin?: number; // If winner
    marginBehindWinner?: number; // If not winner
    finishTime?: string;
    sectionalTimes?: number[]; // Split times
    speedFigures?: number[];
    
    // Running style
    earlyPosition?: number;
    midRacePosition?: number;
    straightPosition?: number;
    finishingPosition: number;
  };
  
  // Financial results
  payouts?: {
    win?: number;
    place?: number;
    show?: number;
    exacta?: number;
    trifecta?: number;
    superfecta?: number;
  };
  
  // Race comments
  comments?: {
    runningComment: string;
    jockeyComment?: string;
    veterinaryComment?: string;
  };
}

// ML Feature vector for Horse Racing predictions
export interface HorseRacingMLFeatures {
  raceId: string;
  horseId: string;
  
  // Horse features
  horseFeatures: {
    // Basic attributes
    age: number;
    sex: number; // Encoded
    weight: number;
    condition: number;
    
    // Performance statistics
    careerWinRate: number;
    careerPlaceRate: number;
    careerShowRate: number;
    careerEarningsPerStart: number;
    careerStrikeRate: number;
    
    // Current season performance
    seasonWinRate: number;
    seasonPlaceRate: number;
    seasonEarningsPerStart: number;
    seasonStarts: number;
    
    // Recent form
    formRating: number;
    formTrend: number; // -1 to 1
    daysSinceLastRace: number;
    last5AveragePosition: number;
    
    // Class and experience
    classRating: number;
    experienceScore: number;
    consistencyScore: number;
  };
  
  // Jockey features
  jockeyFeatures: {
    careerWinRate: number;
    careerPlaceRate: number;
    seasonWinRate: number;
    recentFormWinRate: number; // Last 14 days
    claimingAllowance: number;
    
    // Partnerships
    winRateWithTrainer: number;
    winRateWithHorse: number;
    ridesWithHorse: number;
    
    // Track specialization
    trackWinRate: number;
    distanceWinRate: number;
    goingWinRate: number;
  };
  
  // Trainer features
  trainerFeatures: {
    careerWinRate: number;
    careerROI: number;
    seasonWinRate: number;
    recentFormWinRate: number; // Last 30 days
    
    // Specializations
    ageGroupWinRate: number;
    distanceWinRate: number;
    raceTypeWinRate: number;
    
    // Stable management
    stableSize: number;
    stableQuality: number;
  };
  
  // Race context features
  raceFeatures: {
    // Basic race information
    distance: number;
    numberOfRunners: number;
    raceClass: number; // Encoded
    purse: number;
    surface: number; // Encoded
    raceType: number; // Encoded
    
    // Conditions
    going: number; // Encoded
    weatherImpact: number;
    trackBias: number;
    
    // Competition
    fieldStrength: number;
    competitionLevel: number;
    classDroppedRaised: number; // -1 to 1
  };
  
  // Market features
  marketFeatures: {
    morningLineOdds: number;
    currentOdds: number;
    oddsMovement: number; // Current / Morning Line
    impliedProbability: number;
    marketRank: number;
    publicSupport: number;
    marketEfficiency: number;
    
    // Value indicators
    valueScore: number; // Calculated value based on model vs market
    overlayUnderlay: number; // Model odds vs market odds
  };
  
  // Track and distance features
  trackDistanceFeatures: {
    // Track-specific performance
    horseTrackWinRate: number;
    horseTrackPlaceRate: number;
    horseTrackStarts: number;
    
    // Distance suitability
    horseDistanceWinRate: number;
    horseDistanceStarts: number;
    optimalDistance: number;
    distanceVariance: number;
    
    // Going preference
    horseGoingWinRate: number;
    horseGoingStarts: number;
    goingPreference: number;
    
    // Surface preference
    horseSurfaceWinRate: number;
    horseSurfaceStarts: number;
  };
  
  // Breeding and pedigree features
  breedingFeatures: {
    sireWinRate: number;
    damProgenyWinRate: number;
    inbreedingCoefficient: number;
    
    // Distance and surface aptitude from pedigree
    pedigreeDistanceAptitude: number;
    pedigreeSurfaceAptitude: number;
    pedigreeClassAptitude: number;
    
    // Genetic factors
    earlySpeedIndex: number;
    staminaIndex: number;
    versatiityIndex: number;
  };
  
  // Workout and preparation features
  preparationFeatures: {
    workoutRecency: number; // Days since last workout
    workoutQuality: number; // Speed and time assessment
    workoutFrequency: number; // Number of workouts in last 30 days
    
    // Fitness indicators
    peakFormIndicator: number;
    fitnessScore: number;
    readinessScore: number;
    
    // Layoff effects
    layoffDays: number;
    layoffType: number; // Encoded: freshening, injury, etc.
    firstTimeStarter: boolean;
  };
  
  // Situational features
  situationalFeatures: {
    // Post position effects
    postPosition: number;
    postPositionAdvantage: number;
    
    // Pace scenario
    earlyPaceSetup: number;
    paceAdvantage: number;
    runningStyle: number; // Encoded
    
    // Equipment and medication
    equipmentChanges: number;
    medicationChanges: number;
    
    // Human factors
    jockeyChange: boolean;
    trainerChange: boolean;
    ownershipChange: boolean;
  };
  
  // Target variables (for training)
  targets?: {
    finishPosition: number;
    willWin: boolean;
    willPlace: boolean;
    willShow: boolean;
    beatsFavorite: boolean;
    finishTime?: number;
    speedFigure?: number;
  };
  
  // Feature metadata
  metadata: {
    featureVersion: string;
    dataQuality: number;
    lastUpdated: string;
    sourceReliability: number;
    completenessScore: number;
  };
}

// Horse Racing prediction output interface
export interface HorseRacingPrediction {
  raceId: string;
  raceName: string;
  trackName: string;
  raceTime: string;
  generatedAt: string;
  
  // Model metadata
  model: {
    version: string;
    confidence: number;
    dataQuality: number;
  };
  
  // Horse predictions
  horsePredictions: {
    horseId: string;
    horseName: string;
    saddleNumber: number;
    
    // Position predictions
    predictedFinish: number;
    finishProbabilities: {
      win: number;
      place: number;
      show: number;
      top3: number;
    };
    
    // Model assessment
    modelOdds: number;
    valueRating: number; // Compared to market odds
    confidence: number;
    
    // Key factors
    strengths: string[];
    weaknesses: string[];
    keyFactors: string[];
  }[];
  
  // Race analysis
  raceAnalysis: {
    // Pace scenario
    expectedPace: 'fast' | 'moderate' | 'slow';
    paceSetters: string[]; // Horse IDs
    closers: string[]; // Horse IDs
    
    // Key insights
    mainContenders: string[]; // Top 3-4 chances
    valuePickes: string[]; // Overlays in the betting
    darkHorses: string[]; // Long shots with chances
    
    // Race dynamics
    keyBattles: {
      description: string;
      horses: string[];
    }[];
    
    // Track and weather impact
    trackBias?: string;
    weatherImpact?: string;
    goingAdvantage?: string[];
  };
  
  // Betting recommendations
  bettingRecommendations: {
    topWinBet?: {
      horseId: string;
      horseName: string;
      reasoning: string;
    };
    
    valueWinBets: {
      horseId: string;
      horseName: string;
      valueRating: number;
      reasoning: string;
    }[];
    
    exoticSuggestions: {
      betType: string;
      horses: string[];
      reasoning: string;
      expectedPayout: number;
    }[];
  };
}

// Performance tracking for horse racing models
export interface HorseRacingModelPerformance {
  modelVersion: string;
  evaluationPeriod: {
    startDate: string;
    endDate: string;
    racesEvaluated: number;
    horsesEvaluated: number;
  };
  
  // Prediction accuracy
  accuracy: {
    winnerAccuracy: number; // Percentage of winners in top prediction
    top3Accuracy: number; // Percentage of actual top 3 in predicted top 3
    exactaAccuracy: number;
    trifectaAccuracy: number;
    
    // Position-based accuracy
    favoritesAccuracy: number;
    secondChoiceAccuracy: number;
    longShotAccuracy: number;
    
    // Average position error
    meanAbsoluteError: number;
    rootMeanSquareError: number;
  };
  
  // Financial performance
  financialMetrics: {
    // Return on investment
    winBettingROI: number;
    placeBettingROI: number;
    showBettingROI: number;
    exoticBettingROI: number;
    
    // Strike rates
    winStrikeRate: number;
    placeStrikeRate: number;
    showStrikeRate: number;
    
    // Value identification
    overlayIdentificationRate: number; // Found overlays that won
    underlayAvoidanceRate: number; // Avoided poor value that lost
  };
  
  // Feature analysis
  featureImportance: {
    topFeatures: {
      featureName: string;
      importance: number;
      category: 'horse' | 'jockey' | 'trainer' | 'race' | 'market' | 'breeding' | 'preparation' | 'situational';
    }[];
    
    // Category importance
    categoryImportance: {
      [category: string]: number;
    };
  };
  
  // Model confidence analysis
  confidenceAnalysis: {
    highConfidenceAccuracy: number; // >80% confidence
    mediumConfidenceAccuracy: number; // 60-80% confidence
    lowConfidenceAccuracy: number; // <60% confidence
    
    calibrationScore: number; // How well confidence matches actual accuracy
  };
  
  // Business impact
  businessMetrics: {
    userEngagement: number;
    predictionViews: number;
    tipsterFollowers: number;
    premiumSubscriptions: number;
    userSatisfactionRating: number;
  };
}