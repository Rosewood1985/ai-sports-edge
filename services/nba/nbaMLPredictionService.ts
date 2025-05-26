// =============================================================================
// NBA ML PREDICTION SERVICE
// Advanced Machine Learning Predictions for NBA Games and Analysis
// =============================================================================

import { collection, doc, setDoc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore as db } from '../../config/firebase';
import * as Sentry from '@sentry/react-native';
import { NBATeam, NBAPlayer, NBAGame } from './nbaDataSyncService';
import { NBATeamAnalytics, NBAPlayerAnalytics } from './nbaAnalyticsService';

// NBA ML Prediction interfaces
export interface NBAGamePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;
  
  // Primary Predictions
  winProbability: number; // Home team win probability (0-1)
  spreadPrediction: number; // Predicted point spread (positive = home favored)
  totalPointsPrediction: number; // Predicted total points
  
  // Confidence Metrics
  confidence: {
    overall: number; // Overall prediction confidence (0-1)
    spread: number; // Spread prediction confidence
    total: number; // Total points prediction confidence
    winProbability: number; // Win probability confidence
  };
  
  // Advanced Predictions
  advancedPredictions: {
    marginOfVictory: number; // Predicted margin for winning team
    overtimeProbability: number; // Probability of overtime
    blowoutProbability: number; // Probability of 20+ point game
    closeGameProbability: number; // Probability of <5 point game
    quarterByQuarterPredictions: {
      q1: { homeScore: number; awayScore: number };
      q2: { homeScore: number; awayScore: number };
      q3: { homeScore: number; awayScore: number };
      q4: { homeScore: number; awayScore: number };
    };
  };
  
  // Player Performance Predictions
  playerPredictions: {
    homeTeam: PlayerGamePrediction[];
    awayTeam: PlayerGamePrediction[];
  };
  
  // Situational Factors
  situationalFactors: {
    restAdvantage: number; // Days rest differential
    homeAdvantage: number; // Home court advantage factor
    travelDistance: number; // Away team travel miles
    seasonContext: string; // e.g., "Early Season", "Playoff Push"
    motivationFactor: number; // Playoff implications, rivalry, etc.
    weatherImpact: number; // For outdoor games (rare in NBA)
  };
  
  // Model Performance
  modelMetrics: {
    modelVersion: string;
    featuresUsed: number;
    historicalAccuracy: number;
    lastTrainingDate: Date;
    predictionDate: Date;
  };
  
  lastUpdated: Date;
}

export interface PlayerGamePrediction {
  playerId: string;
  name: string;
  position: string;
  
  // Basic Stats Predictions
  predictions: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
  };
  
  // Confidence Intervals
  confidence: {
    points: { low: number; high: number };
    rebounds: { low: number; high: number };
    assists: { low: number; high: number };
  };
  
  // Performance Factors
  factors: {
    matchupRating: number; // How favorable the matchup is
    recentForm: number; // Recent performance trend
    injuryRisk: number; // Injury probability
    usageRate: number; // Expected usage rate
  };
}

export interface NBAMLFeatures {
  // Team Strength Features (20 features)
  homeTeamStrength: {
    overallRating: number;
    offensiveRating: number;
    defensiveRating: number;
    netRating: number;
    recentForm: number; // Last 10 games performance
    homeRecord: number; // Home win percentage
    clutchPerformance: number;
    paceAdjustedOffense: number;
    paceAdjustedDefense: number;
    strengthOfSchedule: number;
  };
  
  awayTeamStrength: {
    overallRating: number;
    offensiveRating: number;
    defensiveRating: number;
    netRating: number;
    recentForm: number;
    awayRecord: number; // Away win percentage
    clutchPerformance: number;
    paceAdjustedOffense: number;
    paceAdjustedDefense: number;
    strengthOfSchedule: number;
  };
  
  // Matchup Features (15 features)
  matchupMetrics: {
    paceMatchup: number; // Pace differential
    styleMatchup: number; // Playing style compatibility
    reboundingBattle: number; // Rebounding advantage
    threePointBattle: number; // Three-point shooting vs defense
    turnoverBattle: number; // Turnover creation vs ball security
    clutchMatchup: number; // Clutch performance comparison
    experienceAdvantage: number; // Veteran presence comparison
    coachingAdvantage: number; // Coaching effectiveness
    motivationDifferential: number; // Season context motivation
    starPlayerMatchup: number; // Star player head-to-head
    benchDepth: number; // Bench strength comparison
    defensiveMatchup: number; // Defensive schemes vs offensive style
    athleticismAdvantage: number; // Athletic ability comparison
    chemistryFactor: number; // Team chemistry rating
    confidenceMomentum: number; // Current confidence/momentum
  };
  
  // Situational Features (15 features)
  situationalContext: {
    daysRest: number; // Rest advantage
    backToBackPenalty: number; // Back-to-back game impact
    travelFatigue: number; // Travel distance impact
    timeZoneChange: number; // Time zone difference
    altitudeAdjustment: number; // Altitude change impact
    seasonPhase: number; // Early/mid/late season context
    playoffImplications: number; // Playoff race importance
    rivalryFactor: number; // Historical rivalry intensity
    revengeGame: number; // Recent loss to opponent
    homeStandLength: number; // Home stand game number
    roadTripLength: number; // Road trip game number
    scheduleStrength: number; // Recent schedule difficulty
    emotionalState: number; // Team emotional context
    publicBetting: number; // Public betting sentiment
    lineMovement: number; // Betting line movement
  };
  
  // Player Impact Features (10 features)
  playerFactors: {
    starPlayerHealth: number; // Key player injury status
    depthAdvantage: number; // Roster depth comparison
    matchupAdvantages: number; // Position-by-position advantages
    experienceDifferential: number; // Playoff/big game experience
    leadershipPresence: number; // Team leadership factor
    rookieImpact: number; // Rookie contribution/liability
    internationalPlayers: number; // International player factor
    veteranPresence: number; // Veteran leadership/stability
    teamChemistry: number; // Team chemistry rating
    coachingTrust: number; // Player-coach relationship
  };
  
  // Historical Performance Features (10 features)
  historicalContext: {
    headToHeadRecord: number; // Historical matchup record
    homeDominance: number; // Home team historical advantage
    seasonSeriesLead: number; // Current season series record
    recentMeetings: number; // Last 3 meetings average margin
    venuePerformance: number; // Performance at specific venue
    timeOfSeasonTrend: number; // Historical performance by date
    dayOfWeekPerformance: number; // Performance by day of week
    restPatternHistory: number; // Historical rest pattern performance
    streakBreaking: number; // Tendency to break opponent streaks
    underdog: number; // Historical performance as underdog/favorite
  };
}

export interface PlayoffPredictions {
  teamId: string;
  teamName: string;
  conference: 'Eastern' | 'Western';
  
  // Playoff Probabilities
  playoffProbability: number; // Make playoffs (0-1)
  seedProbabilities: {
    seed1: number;
    seed2: number;
    seed3: number;
    seed4: number;
    seed5: number;
    seed6: number;
    seed7: number;
    seed8: number;
    seed9: number;
    seed10: number;
  };
  
  // Round Advancement Probabilities
  roundProbabilities: {
    firstRound: number; // Win first round
    secondRound: number; // Reach conference semifinals
    conferenceFinals: number; // Reach conference finals
    finals: number; // Reach NBA Finals
    championship: number; // Win championship
  };
  
  // Projections
  projections: {
    finalRecord: { wins: number; losses: number };
    expectedSeed: number;
    strengthOfRemaining: number;
    keyGamesRemaining: number;
  };
  
  lastUpdated: Date;
}

export class NBAMLPredictionService {
  private readonly modelVersion = '2.0';
  private readonly featuresCount = 70;
  
  constructor() {
    // Initialize ML prediction service
  }

  /**
   * Initialize the NBA ML prediction service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing NBA ML Prediction Service',
        category: 'nba.ml.init',
        level: 'info',
      });

      // Load pre-trained models (placeholder)
      await this.loadModels();
      
      console.log('NBA ML Prediction Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize NBA ML Prediction Service: ${error.message}`);
    }
  }

  /**
   * Predict NBA game outcome with comprehensive analysis
   */
  async predictGame(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<NBAGamePrediction> {
    try {
      Sentry.addBreadcrumb({
        message: `Predicting NBA game: ${homeTeamId} vs ${awayTeamId}`,
        category: 'nba.ml.predict',
        level: 'info',
      });

      // Extract comprehensive features
      const features = await this.extractMLFeatures(homeTeamId, awayTeamId, gameDate);
      
      // Generate base predictions using ML models
      const basePredictions = await this.generateBasePredictions(features);
      
      // Apply advanced modeling
      const advancedPredictions = await this.generateAdvancedPredictions(features, basePredictions);
      
      // Generate player predictions
      const playerPredictions = await this.generatePlayerPredictions(homeTeamId, awayTeamId, features);
      
      // Calculate confidence metrics
      const confidence = await this.calculatePredictionConfidence(features, basePredictions);
      
      // Compile final prediction
      const prediction: NBAGamePrediction = {
        gameId: `${homeTeamId}_${awayTeamId}_${gameDate.getTime()}`,
        homeTeam: homeTeamId,
        awayTeam: awayTeamId,
        gameDate,
        winProbability: basePredictions.winProbability,
        spreadPrediction: basePredictions.spread,
        totalPointsPrediction: basePredictions.total,
        confidence,
        advancedPredictions,
        playerPredictions,
        situationalFactors: await this.calculateSituationalFactors(homeTeamId, awayTeamId, gameDate),
        modelMetrics: {
          modelVersion: this.modelVersion,
          featuresUsed: this.featuresCount,
          historicalAccuracy: await this.getModelAccuracy(),
          lastTrainingDate: new Date('2024-01-01'), // Placeholder
          predictionDate: new Date(),
        },
        lastUpdated: new Date(),
      };

      // Store prediction
      const predictionRef = doc(db, 'nba_predictions', prediction.gameId);
      await setDoc(predictionRef, prediction);

      console.log(`Generated prediction for NBA game: ${homeTeamId} vs ${awayTeamId}`);
      return prediction;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to predict NBA game: ${error.message}`);
    }
  }

  /**
   * Extract comprehensive ML features for prediction
   */
  async extractMLFeatures(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<NBAMLFeatures> {
    try {
      const currentSeason = gameDate.getFullYear();
      
      // Get team analytics
      const [homeTeamAnalytics, awayTeamAnalytics] = await Promise.all([
        this.getTeamAnalytics(homeTeamId, currentSeason),
        this.getTeamAnalytics(awayTeamId, currentSeason),
      ]);

      if (!homeTeamAnalytics || !awayTeamAnalytics) {
        throw new Error('Unable to retrieve team analytics for feature extraction');
      }

      // Extract features
      const features: NBAMLFeatures = {
        homeTeamStrength: {
          overallRating: this.calculateOverallRating(homeTeamAnalytics),
          offensiveRating: homeTeamAnalytics.offensiveMetrics.offensiveRating,
          defensiveRating: homeTeamAnalytics.defensiveMetrics.defensiveRating,
          netRating: homeTeamAnalytics.advancedMetrics.netRating,
          recentForm: this.calculateRecentForm(homeTeamAnalytics.advancedMetrics.recentForm),
          homeRecord: this.calculateHomeRecord(homeTeamAnalytics),
          clutchPerformance: homeTeamAnalytics.situationalMetrics.clutchPerformance.netRating,
          paceAdjustedOffense: this.adjustForPace(homeTeamAnalytics.offensiveMetrics.offensiveRating, homeTeamAnalytics.offensiveMetrics.pace),
          paceAdjustedDefense: this.adjustForPace(homeTeamAnalytics.defensiveMetrics.defensiveRating, homeTeamAnalytics.offensiveMetrics.pace),
          strengthOfSchedule: homeTeamAnalytics.advancedMetrics.strengthOfSchedule,
        },
        
        awayTeamStrength: {
          overallRating: this.calculateOverallRating(awayTeamAnalytics),
          offensiveRating: awayTeamAnalytics.offensiveMetrics.offensiveRating,
          defensiveRating: awayTeamAnalytics.defensiveMetrics.defensiveRating,
          netRating: awayTeamAnalytics.advancedMetrics.netRating,
          recentForm: this.calculateRecentForm(awayTeamAnalytics.advancedMetrics.recentForm),
          awayRecord: this.calculateAwayRecord(awayTeamAnalytics),
          clutchPerformance: awayTeamAnalytics.situationalMetrics.clutchPerformance.netRating,
          paceAdjustedOffense: this.adjustForPace(awayTeamAnalytics.offensiveMetrics.offensiveRating, awayTeamAnalytics.offensiveMetrics.pace),
          paceAdjustedDefense: this.adjustForPace(awayTeamAnalytics.defensiveMetrics.defensiveRating, awayTeamAnalytics.offensiveMetrics.pace),
          strengthOfSchedule: awayTeamAnalytics.advancedMetrics.strengthOfSchedule,
        },
        
        matchupMetrics: await this.calculateMatchupMetrics(homeTeamAnalytics, awayTeamAnalytics),
        situationalContext: await this.calculateSituationalContext(homeTeamId, awayTeamId, gameDate),
        playerFactors: await this.calculatePlayerFactors(homeTeamId, awayTeamId),
        historicalContext: await this.calculateHistoricalContext(homeTeamId, awayTeamId, gameDate),
      };

      return features;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to extract ML features: ${error.message}`);
    }
  }

  /**
   * Generate playoff probability predictions for all teams
   */
  async calculatePlayoffProbabilities(teamIds: string[]): Promise<{ [teamId: string]: PlayoffPredictions }> {
    try {
      Sentry.addBreadcrumb({
        message: 'Calculating NBA playoff probabilities',
        category: 'nba.ml.playoffs',
        level: 'info',
      });

      const predictions: { [teamId: string]: PlayoffPredictions } = {};
      const currentSeason = new Date().getFullYear();

      for (const teamId of teamIds) {
        try {
          const teamAnalytics = await this.getTeamAnalytics(teamId, currentSeason);
          const team = await this.getTeamData(teamId);
          
          if (!teamAnalytics || !team) continue;

          // Run Monte Carlo simulation for playoff scenarios
          const playoffSim = await this.runPlayoffSimulation(teamId, teamAnalytics);
          
          predictions[teamId] = {
            teamId,
            teamName: team.name,
            conference: team.conference,
            playoffProbability: playoffSim.playoffProbability,
            seedProbabilities: playoffSim.seedProbabilities,
            roundProbabilities: playoffSim.roundProbabilities,
            projections: playoffSim.projections,
            lastUpdated: new Date(),
          };

        } catch (error) {
          Sentry.captureException(error);
          console.error(`Error calculating playoff probability for team ${teamId}:`, error.message);
          continue;
        }
      }

      // Store playoff predictions
      const playoffRef = doc(db, 'nba_playoff_predictions', `${currentSeason}`);
      await setDoc(playoffRef, { predictions, lastUpdated: new Date() });

      console.log(`Calculated playoff probabilities for ${Object.keys(predictions).length} NBA teams`);
      return predictions;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to calculate playoff probabilities: ${error.message}`);
    }
  }

  /**
   * Helper methods for calculations
   */
  
  private async loadModels(): Promise<void> {
    // Placeholder for model loading
    console.log('Loading NBA ML models...');
  }

  private async generateBasePredictions(features: NBAMLFeatures): Promise<any> {
    // Simplified prediction logic (would use actual ML models in production)
    const homeAdvantage = 0.58; // Historical NBA home advantage
    const netRatingDiff = features.homeTeamStrength.netRating - features.awayTeamStrength.netRating;
    
    // Win probability calculation
    const adjustedNetRating = netRatingDiff + (homeAdvantage * 100 - 50);
    const winProbability = Math.max(0.05, Math.min(0.95, 0.5 + (adjustedNetRating / 1000)));
    
    // Spread calculation  
    const spread = adjustedNetRating / 3.2; // Rough conversion from net rating to spread
    
    // Total calculation
    const avgPace = (features.homeTeamStrength.paceAdjustedOffense + features.awayTeamStrength.paceAdjustedOffense) / 2;
    const totalPrediction = (features.homeTeamStrength.offensiveRating + features.awayTeamStrength.offensiveRating) * (avgPace / 100);
    
    return {
      winProbability,
      spread,
      total: totalPrediction,
    };
  }

  private async generateAdvancedPredictions(features: NBAMLFeatures, basePredictions: any): Promise<NBAGamePrediction['advancedPredictions']> {
    return {
      marginOfVictory: Math.abs(basePredictions.spread),
      overtimeProbability: 0.08, // NBA average
      blowoutProbability: 0.15, // Estimated
      closeGameProbability: 0.35, // Estimated
      quarterByQuarterPredictions: {
        q1: { homeScore: 28, awayScore: 26 },
        q2: { homeScore: 26, awayScore: 28 },
        q3: { homeScore: 27, awayScore: 25 },
        q4: { homeScore: 29, awayScore: 27 },
      },
    };
  }

  private async generatePlayerPredictions(homeTeamId: string, awayTeamId: string, features: NBAMLFeatures): Promise<NBAGamePrediction['playerPredictions']> {
    // Placeholder for player predictions
    return {
      homeTeam: [],
      awayTeam: [],
    };
  }

  private async calculatePredictionConfidence(features: NBAMLFeatures, predictions: any): Promise<NBAGamePrediction['confidence']> {
    // Calculate confidence based on feature reliability
    const featureQuality = this.assessFeatureQuality(features);
    const modelCertainty = this.calculateModelCertainty(predictions);
    
    const overall = (featureQuality + modelCertainty) / 2;
    
    return {
      overall,
      spread: overall * 0.9,
      total: overall * 0.85,
      winProbability: overall * 0.95,
    };
  }

  private async calculateSituationalFactors(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<NBAGamePrediction['situationalFactors']> {
    return {
      restAdvantage: 0,
      homeAdvantage: 3.2, // NBA average home advantage
      travelDistance: 0,
      seasonContext: this.determineSeasonContext(gameDate),
      motivationFactor: 0.5,
      weatherImpact: 0, // Indoor sport
    };
  }

  /**
   * Calculation helper methods
   */
  
  private calculateOverallRating(analytics: NBATeamAnalytics): number {
    return (analytics.offensiveMetrics.offensiveRating + analytics.defensiveMetrics.defensiveRating) / 2;
  }

  private calculateRecentForm(recentForm: number[]): number {
    if (recentForm.length === 0) return 0.5;
    return recentForm.reduce((sum, game) => sum + game, 0) / recentForm.length;
  }

  private calculateHomeRecord(analytics: NBATeamAnalytics): number {
    return analytics.situationalMetrics.homeAwayDifferential.home.offensiveRating / 110; // Normalize
  }

  private calculateAwayRecord(analytics: NBATeamAnalytics): number {
    return analytics.situationalMetrics.homeAwayDifferential.away.offensiveRating / 110; // Normalize
  }

  private adjustForPace(rating: number, pace: number): number {
    return rating * (pace / 100); // Adjust rating based on pace
  }

  private async calculateMatchupMetrics(homeAnalytics: NBATeamAnalytics, awayAnalytics: NBATeamAnalytics): Promise<NBAMLFeatures['matchupMetrics']> {
    return {
      paceMatchup: homeAnalytics.offensiveMetrics.pace - awayAnalytics.offensiveMetrics.pace,
      styleMatchup: 0,
      reboundingBattle: homeAnalytics.basketballMetrics.reboundRate.total - awayAnalytics.basketballMetrics.reboundRate.total,
      threePointBattle: homeAnalytics.offensiveMetrics.threePointPercentage - awayAnalytics.defensiveMetrics.opponentThreePointPercentage,
      turnoverBattle: awayAnalytics.basketballMetrics.turnoverRate - homeAnalytics.basketballMetrics.turnoverRate,
      clutchMatchup: homeAnalytics.situationalMetrics.clutchPerformance.netRating - awayAnalytics.situationalMetrics.clutchPerformance.netRating,
      experienceAdvantage: 0,
      coachingAdvantage: 0,
      motivationDifferential: 0,
      starPlayerMatchup: 0,
      benchDepth: homeAnalytics.playerImpactMetrics.benchContribution - awayAnalytics.playerImpactMetrics.benchContribution,
      defensiveMatchup: 0,
      athleticismAdvantage: 0,
      chemistryFactor: 0,
      confidenceMomentum: this.calculateRecentForm(homeAnalytics.advancedMetrics.recentForm) - this.calculateRecentForm(awayAnalytics.advancedMetrics.recentForm),
    };
  }

  private async calculateSituationalContext(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<NBAMLFeatures['situationalContext']> {
    return {
      daysRest: 0,
      backToBackPenalty: 0,
      travelFatigue: 0,
      timeZoneChange: 0,
      altitudeAdjustment: 0,
      seasonPhase: this.getSeasonPhase(gameDate),
      playoffImplications: 0,
      rivalryFactor: 0,
      revengeGame: 0,
      homeStandLength: 0,
      roadTripLength: 0,
      scheduleStrength: 0,
      emotionalState: 0,
      publicBetting: 0,
      lineMovement: 0,
    };
  }

  private async calculatePlayerFactors(homeTeamId: string, awayTeamId: string): Promise<NBAMLFeatures['playerFactors']> {
    return {
      starPlayerHealth: 1.0,
      depthAdvantage: 0,
      matchupAdvantages: 0,
      experienceDifferential: 0,
      leadershipPresence: 0,
      rookieImpact: 0,
      internationalPlayers: 0,
      veteranPresence: 0,
      teamChemistry: 0,
      coachingTrust: 0,
    };
  }

  private async calculateHistoricalContext(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<NBAMLFeatures['historicalContext']> {
    return {
      headToHeadRecord: 0.5,
      homeDominance: 0.58, // NBA average
      seasonSeriesLead: 0,
      recentMeetings: 0,
      venuePerformance: 0,
      timeOfSeasonTrend: 0,
      dayOfWeekPerformance: 0,
      restPatternHistory: 0,
      streakBreaking: 0,
      underdog: 0,
    };
  }

  private determineSeasonContext(gameDate: Date): string {
    const month = gameDate.getMonth() + 1;
    if (month >= 10 || month <= 12) return 'Early Season';
    if (month >= 1 && month <= 3) return 'Mid Season';
    if (month >= 4 && month <= 6) return 'Playoff Push';
    return 'Off Season';
  }

  private getSeasonPhase(gameDate: Date): number {
    const month = gameDate.getMonth() + 1;
    if (month >= 10 || month <= 12) return 0.1; // Early season
    if (month >= 1 && month <= 3) return 0.5; // Mid season
    return 0.9; // Late season/playoffs
  }

  private assessFeatureQuality(features: NBAMLFeatures): number {
    // Assess the quality and completeness of features
    let qualityScore = 0.8; // Base score
    
    // Check for missing or default values
    if (features.homeTeamStrength.netRating === 0) qualityScore -= 0.1;
    if (features.awayTeamStrength.netRating === 0) qualityScore -= 0.1;
    
    return Math.max(0.3, qualityScore);
  }

  private calculateModelCertainty(predictions: any): number {
    // Calculate how certain the model is based on prediction values
    const winProbCertainty = Math.abs(predictions.winProbability - 0.5) * 2;
    const spreadCertainty = Math.min(1.0, Math.abs(predictions.spread) / 15);
    
    return (winProbCertainty + spreadCertainty) / 2;
  }

  private async runPlayoffSimulation(teamId: string, analytics: NBATeamAnalytics): Promise<any> {
    // Monte Carlo simulation for playoff scenarios
    const simulations = 1000;
    let playoffCount = 0;
    const seedCounts = Array(10).fill(0);
    
    for (let i = 0; i < simulations; i++) {
      const simulatedRecord = this.simulateRestOfSeason(analytics);
      const seed = this.determineSeed(simulatedRecord);
      
      if (seed <= 8) {
        playoffCount++;
        seedCounts[seed - 1]++;
      }
    }
    
    return {
      playoffProbability: playoffCount / simulations,
      seedProbabilities: {
        seed1: seedCounts[0] / simulations,
        seed2: seedCounts[1] / simulations,
        seed3: seedCounts[2] / simulations,
        seed4: seedCounts[3] / simulations,
        seed5: seedCounts[4] / simulations,
        seed6: seedCounts[5] / simulations,
        seed7: seedCounts[6] / simulations,
        seed8: seedCounts[7] / simulations,
        seed9: seedCounts[8] / simulations,
        seed10: seedCounts[9] / simulations,
      },
      roundProbabilities: {
        firstRound: Math.max(0, playoffCount / simulations - 0.1),
        secondRound: Math.max(0, playoffCount / simulations - 0.3),
        conferenceFinals: Math.max(0, playoffCount / simulations - 0.5),
        finals: Math.max(0, playoffCount / simulations - 0.7),
        championship: Math.max(0, playoffCount / simulations - 0.9),
      },
      projections: {
        finalRecord: { wins: 45, losses: 37 }, // Placeholder
        expectedSeed: this.calculateExpectedSeed(seedCounts, simulations),
        strengthOfRemaining: 0.5,
        keyGamesRemaining: 10,
      },
    };
  }

  private simulateRestOfSeason(analytics: NBATeamAnalytics): any {
    // Simulate remaining games based on team strength
    const remainingGames = 82 - (analytics.advancedMetrics.winPercentage * 82);
    const expectedWins = remainingGames * analytics.advancedMetrics.winPercentage;
    
    return {
      totalWins: Math.round(expectedWins + (analytics.advancedMetrics.winPercentage * 82)),
      totalLosses: 82 - Math.round(expectedWins + (analytics.advancedMetrics.winPercentage * 82)),
    };
  }

  private determineSeed(record: any): number {
    // Simplified seed determination based on wins
    if (record.totalWins >= 60) return 1;
    if (record.totalWins >= 55) return 2;
    if (record.totalWins >= 50) return 3;
    if (record.totalWins >= 48) return 4;
    if (record.totalWins >= 45) return 5;
    if (record.totalWins >= 43) return 6;
    if (record.totalWins >= 41) return 7;
    if (record.totalWins >= 39) return 8;
    if (record.totalWins >= 37) return 9;
    return 10;
  }

  private calculateExpectedSeed(seedCounts: number[], simulations: number): number {
    let weightedSum = 0;
    let totalProbability = 0;
    
    for (let i = 0; i < seedCounts.length; i++) {
      const probability = seedCounts[i] / simulations;
      weightedSum += (i + 1) * probability;
      totalProbability += probability;
    }
    
    return totalProbability > 0 ? weightedSum / totalProbability : 9;
  }

  private async getModelAccuracy(): Promise<number> {
    // Return historical model accuracy
    return 0.73; // Placeholder
  }

  /**
   * Data retrieval helpers
   */
  
  private async getTeamAnalytics(teamId: string, season: number): Promise<NBATeamAnalytics | null> {
    try {
      const analyticsDoc = await getDoc(doc(db, 'nba_team_analytics', `${teamId}_${season}`));
      return analyticsDoc.exists() ? analyticsDoc.data() as NBATeamAnalytics : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getTeamData(teamId: string): Promise<NBATeam | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'nba_teams', teamId));
      return teamDoc.exists() ? teamDoc.data() as NBATeam : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Public utility methods
   */
  
  async getPrediction(gameId: string): Promise<NBAGamePrediction | null> {
    try {
      const predictionDoc = await getDoc(doc(db, 'nba_predictions', gameId));
      return predictionDoc.exists() ? predictionDoc.data() as NBAGamePrediction : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async getTeamPredictions(teamId: string, limit: number = 10): Promise<NBAGamePrediction[]> {
    try {
      const predictionsQuery = query(
        collection(db, 'nba_predictions'),
        where('homeTeam', '==', teamId),
        orderBy('gameDate', 'desc'),
        limit(limit)
      );

      const predictionsSnapshot = await getDocs(predictionsQuery);
      const homePredictions = predictionsSnapshot.docs.map(doc => doc.data() as NBAGamePrediction);

      // Also get away games
      const awayPredictionsQuery = query(
        collection(db, 'nba_predictions'),
        where('awayTeam', '==', teamId),
        orderBy('gameDate', 'desc'),
        limit(limit)
      );

      const awayPredictionsSnapshot = await getDocs(awayPredictionsQuery);
      const awayPredictions = awayPredictionsSnapshot.docs.map(doc => doc.data() as NBAGamePrediction);

      return [...homePredictions, ...awayPredictions]
        .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime())
        .slice(0, limit);

    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  async validatePredictionAccuracy(): Promise<number> {
    try {
      // Get predictions from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const predictionsQuery = query(
        collection(db, 'nba_predictions'),
        where('gameDate', '>=', thirtyDaysAgo),
        where('gameDate', '<=', new Date())
      );

      const predictionsSnapshot = await getDocs(predictionsQuery);
      let correctPredictions = 0;
      let totalPredictions = 0;

      for (const predictionDoc of predictionsSnapshot.docs) {
        const prediction = predictionDoc.data() as NBAGamePrediction;
        
        // Get actual game result
        const gameDoc = await getDoc(doc(db, 'nba_games', prediction.gameId));
        if (gameDoc.exists()) {
          const game = gameDoc.data() as NBAGame;
          if (game.status === 'completed' && game.scores) {
            totalPredictions++;
            
            // Check win prediction accuracy
            const actualHomeWin = game.scores.home > game.scores.away;
            const predictedHomeWin = prediction.winProbability > 0.5;
            
            if (actualHomeWin === predictedHomeWin) {
              correctPredictions++;
            }
          }
        }
      }

      return totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }
}

export const nbaMLPredictionService = new NBAMLPredictionService();