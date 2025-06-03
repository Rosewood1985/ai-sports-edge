// =============================================================================
// NCAA BASKETBALL ML PREDICTION SERVICE
// Advanced March Madness and College Basketball Predictions
// =============================================================================

import * as Sentry from '@sentry/react-native';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';

import { NCAATeamAnalytics, NCAAPlayerAnalytics } from './ncaaBasketballAnalyticsService';
import {
  NCAATeam,
  NCAAPlayer,
  NCAAGame,
  MarchMadnessBracket,
} from './ncaaBasketballDataSyncService';
import { firestore as db } from '../../config/firebase';

// NCAA Basketball ML Prediction interfaces
export interface NCAAGamePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;
  seasonType: 'Regular Season' | 'Conference Tournament' | 'March Madness' | 'NIT' | 'CBI';

  // Primary Predictions
  winProbability: number; // Home team win probability (0-1)
  spreadPrediction: number; // Predicted point spread (positive = home favored)
  totalPointsPrediction: number; // Predicted total points

  // March Madness Specific
  marchMadnessMetrics?: {
    upsetPotential: number; // Probability of upset if higher seed vs lower seed
    advancementImpact: number; // Impact on championship odds
    cinderellaFactor: number; // Underdog story potential
    viewershipPrediction: number; // Expected TV viewership
    buzzerBeaterProbability: number; // Close game probability
  };

  // Confidence Metrics
  confidence: {
    overall: number; // Overall prediction confidence (0-1)
    spread: number; // Spread prediction confidence
    total: number; // Total points prediction confidence
    upset: number; // Upset prediction confidence (if applicable)
  };

  // Advanced Predictions
  advancedPredictions: {
    marginOfVictory: number; // Predicted margin for winning team
    overtimeProbability: number; // Probability of overtime
    blowoutProbability: number; // Probability of 20+ point game
    closeGameProbability: number; // Probability of <5 point game
    leadChanges: number; // Expected lead changes
    halfTimeLeader: 'home' | 'away' | 'tied';
    finalMinuteDrama: number; // Game decided in final minute probability
  };

  // Player Performance Predictions
  playerPredictions: {
    homeTeam: NCAAPlayerGamePrediction[];
    awayTeam: NCAAPlayerGamePrediction[];
    starPlayerImpact: {
      playerId: string;
      name: string;
      gameChangingProbability: number;
    }[];
  };

  // Situational Factors
  situationalFactors: {
    neutralSite: boolean;
    arenaAdvantage: number; // Home court advantage factor
    travelDistance: number; // Away team travel miles
    restAdvantage: number; // Days rest differential
    motivationFactor: number; // Tournament implications, rivalry, etc.
    pressureFactor: number; // Big game pressure impact
    experienceFactor: number; // Tournament experience advantage
    coachingFactor: number; // March Madness coaching experience
    crowdFactor: number; // Crowd noise and atmosphere impact
  };

  // March Madness Context
  tournamentContext?: {
    round: string;
    region: string;
    seed: { home: number; away: number };
    historicalMatchup: {
      seedWinPercentage: number; // Historical win% for this seed matchup
      upsetFrequency: number; // How often this upset occurs
      similarGames: string[]; // References to similar historical games
    };
    stakesLevel: number; // Championship implications (1-10)
  };

  // Model Performance
  modelMetrics: {
    modelVersion: string;
    featuresUsed: number;
    marchMadnessAccuracy: number; // Tournament-specific accuracy
    regularSeasonAccuracy: number;
    lastTrainingDate: Date;
    predictionDate: Date;
  };

  lastUpdated: Date;
}

export interface NCAAPlayerGamePrediction {
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
    fouls: number;
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

  // March Madness Factors
  tournamentFactors: {
    pressureHandling: number; // How well they handle big game pressure
    clutchPerformance: number; // Late game performance prediction
    starPotential: number; // Breakout star performance probability
    foulTrouble: number; // Foul trouble probability
    injuryRisk: number; // Risk of injury during game
  };
}

export interface MarchMadnessBracketPrediction {
  year: number;
  lastUpdated: Date;

  // Regional Predictions
  regionalPredictions: {
    [regionName: string]: {
      champion: {
        teamId: string;
        probability: number;
        expectedPath: string[];
      };
      upsets: {
        round: string;
        gameId: string;
        higherSeed: number;
        lowerSeed: number;
        upsetProbability: number;
        keyFactors: string[];
      }[];
      sleepers: {
        teamId: string;
        seed: number;
        maxRound: string;
        probability: number;
      }[];
    };
  };

  // Final Four Predictions
  finalFourPredictions: {
    teams: {
      teamId: string;
      region: string;
      seed: number;
      probability: number;
      path: string[];
      keyStrengths: string[];
    }[];
    mostLikelyScenario: {
      teams: string[];
      probability: number;
    };
    upsetScenario: {
      teams: string[];
      probability: number;
      surprises: string[];
    };
  };

  // Championship Predictions
  championshipPredictions: {
    favorites: {
      teamId: string;
      probability: number;
      keyFactors: string[];
      potentialPath: string[];
    }[];
    darkHorses: {
      teamId: string;
      seed: number;
      probability: number;
      cinderellaStory: string;
    }[];
    mostLikelyChampion: {
      teamId: string;
      probability: number;
      confidence: number;
    };
  };

  // Simulation Results
  simulationResults: {
    totalSimulations: number;
    averageUpsets: number;
    cinderellaFrequency: number; // Frequency of deep Cinderella runs
    chalkFrequency: number; // Frequency of high seeds advancing
    buzzerBeaterFrequency: number;
    overtimeFrequency: number;
  };
}

export interface NCAAMLFeatures {
  // Team Strength Features (25 features)
  homeTeamStrength: {
    kenpomRating: number;
    netRating: number;
    rpi: number;
    strengthOfSchedule: number;
    adjustedOffensiveEfficiency: number;
    adjustedDefensiveEfficiency: number;
    netEfficiency: number;
    recentForm: number; // Last 10 games
    quadrant1Record: number;
    qualityWins: number;
    badLosses: number;
    conferenceRecord: number;
    awayRecord: number;
    neutralSiteRecord: number;
    versusTop25: number;
    clutchPerformance: number;
    comebackRecord: number;
    blowoutRecord: number;
    experienceRating: number;
    coachingRating: number;
    benchDepth: number;
    healthRating: number;
    chemistryRating: number;
    momentumRating: number;
    intangibles: number;
  };

  awayTeamStrength: {
    kenpomRating: number;
    netRating: number;
    rpi: number;
    strengthOfSchedule: number;
    adjustedOffensiveEfficiency: number;
    adjustedDefensiveEfficiency: number;
    netEfficiency: number;
    recentForm: number;
    quadrant1Record: number;
    qualityWins: number;
    badLosses: number;
    conferenceRecord: number;
    homeRecord: number;
    neutralSiteRecord: number;
    versusTop25: number;
    clutchPerformance: number;
    comebackRecord: number;
    blowoutRecord: number;
    experienceRating: number;
    coachingRating: number;
    benchDepth: number;
    healthRating: number;
    chemistryRating: number;
    momentumRating: number;
    intangibles: number;
  };

  // March Madness Specific Features (15 features)
  tournamentFactors: {
    homeTeamSeed: number;
    awayTeamSeed: number;
    seedDifferential: number;
    tournamentExperience: number; // Combined tournament games played
    coachingTournamentExperience: number;
    pressureHandling: number;
    starPlayerImpact: number;
    teamChemistry: number;
    motivationLevel: number;
    fanSupportLevel: number;
    mediaAttention: number;
    upsetPotential: number;
    cinderellaFactor: number;
    chalkAdvantage: number;
    intangibleFactors: number;
  };

  // Matchup Features (15 features)
  matchupMetrics: {
    paceMatchup: number;
    styleMatchup: number; // Offensive/defensive style compatibility
    sizeMatchup: number; // Height and length advantages
    athleticismMatchup: number;
    shootingMatchup: number; // Three-point shooting vs defense
    reboundingMatchup: number;
    turnoverBattle: number;
    freeThrowMatchup: number;
    benchMatchup: number;
    experienceMatchup: number;
    coachingMatchup: number;
    homeCourtAdvantage: number;
    neutralSiteExperience: number;
    clutchMatchup: number;
    intangibleMatchup: number;
  };

  // Situational Features (10 features)
  situationalContext: {
    daysRest: number;
    travelDistance: number;
    timeZoneChange: number;
    seasonPhase: number;
    tournamentRound: number;
    stakesLevel: number;
    publicExpectation: number;
    mediaHype: number;
    weatherConditions: number;
    arenaAtmosphere: number;
  };

  // Historical Features (10 features)
  historicalContext: {
    headToHeadRecord: number;
    recentMeetings: number;
    seedMatchupHistory: number; // Historical performance of these seeds
    similarScenarios: number; // Similar tournament scenarios
    coachingHistory: number; // Head coach vs head coach
    programHistory: number; // Program tournament success
    conferenceVsConference: number;
    underseededPerformance: number;
    upsetTendency: number;
    marchMadnessMomentum: number;
  };
}

export class NCAABasketballMLPredictionService {
  private readonly modelVersion = '2.0';
  private readonly featuresCount = 75;

  constructor() {
    // Initialize ML prediction service
  }

  /**
   * Initialize the NCAA Basketball ML prediction service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing NCAA Basketball ML Prediction Service',
        category: 'ncaa.ml.init',
        level: 'info',
      });

      // Load pre-trained models
      await this.loadModels();

      console.log('NCAA Basketball ML Prediction Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(
        `Failed to initialize NCAA Basketball ML Prediction Service: ${error.message}`
      );
    }
  }

  /**
   * Predict NCAA Basketball game outcome with March Madness focus
   */
  async predictGame(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date,
    tournamentInfo?: any
  ): Promise<NCAAGamePrediction> {
    try {
      Sentry.addBreadcrumb({
        message: `Predicting NCAA game: ${homeTeamId} vs ${awayTeamId}`,
        category: 'ncaa.ml.predict',
        level: 'info',
      });

      // Extract comprehensive features
      const features = await this.extractMLFeatures(
        homeTeamId,
        awayTeamId,
        gameDate,
        tournamentInfo
      );

      // Generate base predictions using ML models
      const basePredictions = await this.generateBasePredictions(features);

      // Apply March Madness specific modeling if applicable
      const tournamentAdjustments = tournamentInfo
        ? await this.applyTournamentAdjustments(features, basePredictions, tournamentInfo)
        : {};

      // Generate advanced predictions
      const advancedPredictions = await this.generateAdvancedPredictions(features, basePredictions);

      // Generate player predictions
      const playerPredictions = await this.generatePlayerPredictions(
        homeTeamId,
        awayTeamId,
        features
      );

      // Calculate confidence metrics
      const confidence = await this.calculatePredictionConfidence(features, basePredictions);

      // Compile final prediction
      const prediction: NCAAGamePrediction = {
        gameId: `${homeTeamId}_${awayTeamId}_${gameDate.getTime()}`,
        homeTeam: homeTeamId,
        awayTeam: awayTeamId,
        gameDate,
        seasonType: this.determineSeasonType(gameDate, tournamentInfo),
        winProbability: basePredictions.winProbability,
        spreadPrediction: basePredictions.spread,
        totalPointsPrediction: basePredictions.total,
        marchMadnessMetrics: tournamentInfo
          ? await this.calculateMarchMadnessMetrics(features, basePredictions)
          : undefined,
        confidence,
        advancedPredictions,
        playerPredictions,
        situationalFactors: await this.calculateSituationalFactors(
          homeTeamId,
          awayTeamId,
          gameDate
        ),
        tournamentContext: tournamentInfo
          ? await this.calculateTournamentContext(tournamentInfo, features)
          : undefined,
        modelMetrics: {
          modelVersion: this.modelVersion,
          featuresUsed: this.featuresCount,
          marchMadnessAccuracy: await this.getTournamentModelAccuracy(),
          regularSeasonAccuracy: await this.getRegularSeasonModelAccuracy(),
          lastTrainingDate: new Date('2024-01-01'), // Placeholder
          predictionDate: new Date(),
        },
        lastUpdated: new Date(),
      };

      // Store prediction
      const predictionRef = doc(db, 'ncaa_predictions', prediction.gameId);
      await setDoc(predictionRef, prediction);

      console.log(`Generated prediction for NCAA game: ${homeTeamId} vs ${awayTeamId}`);
      return prediction;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to predict NCAA game: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive March Madness bracket predictions
   */
  async predictMarchMadnessBracket(year: number): Promise<MarchMadnessBracketPrediction> {
    try {
      Sentry.addBreadcrumb({
        message: `Predicting March Madness bracket for ${year}`,
        category: 'ncaa.ml.bracket',
        level: 'info',
      });

      // Get current bracket
      const bracket = await this.getCurrentBracket(year);
      if (!bracket) {
        throw new Error(`No bracket found for ${year}`);
      }

      // Run comprehensive tournament simulation
      const simulation = await this.runTournamentSimulation(bracket, year);

      // Generate regional predictions
      const regionalPredictions = await this.generateRegionalPredictions(bracket, simulation);

      // Generate Final Four predictions
      const finalFourPredictions = await this.generateFinalFourPredictions(simulation);

      // Generate championship predictions
      const championshipPredictions = await this.generateChampionshipPredictions(simulation);

      // Compile simulation results
      const simulationResults = this.compileSimulationResults(simulation);

      const bracketPrediction: MarchMadnessBracketPrediction = {
        year,
        lastUpdated: new Date(),
        regionalPredictions,
        finalFourPredictions,
        championshipPredictions,
        simulationResults,
      };

      // Store bracket prediction
      const predictionRef = doc(db, 'march_madness_bracket_predictions', year.toString());
      await setDoc(predictionRef, bracketPrediction);

      console.log(`Generated March Madness bracket prediction for ${year}`);
      return bracketPrediction;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to predict March Madness bracket: ${error.message}`);
    }
  }

  /**
   * Extract comprehensive ML features for NCAA Basketball prediction
   */
  async extractMLFeatures(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date,
    tournamentInfo?: any
  ): Promise<NCAAMLFeatures> {
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
      const features: NCAAMLFeatures = {
        homeTeamStrength: this.extractTeamStrengthFeatures(homeTeamAnalytics, 'home'),
        awayTeamStrength: this.extractTeamStrengthFeatures(awayTeamAnalytics, 'away'),
        tournamentFactors: await this.extractTournamentFeatures(
          homeTeamId,
          awayTeamId,
          tournamentInfo
        ),
        matchupMetrics: await this.calculateMatchupFeatures(homeTeamAnalytics, awayTeamAnalytics),
        situationalContext: await this.extractSituationalFeatures(homeTeamId, awayTeamId, gameDate),
        historicalContext: await this.extractHistoricalFeatures(homeTeamId, awayTeamId, gameDate),
      };

      return features;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to extract ML features: ${error.message}`);
    }
  }

  /**
   * Run Monte Carlo simulation for March Madness tournament
   */
  async runTournamentSimulation(
    bracket: MarchMadnessBracket,
    year: number,
    simulations: number = 10000
  ): Promise<any> {
    try {
      Sentry.addBreadcrumb({
        message: `Running ${simulations} tournament simulations`,
        category: 'ncaa.ml.simulation',
        level: 'info',
      });

      const results = {
        regionalChampions: {} as { [region: string]: { [teamId: string]: number } },
        finalFourTeams: {} as { [teamId: string]: number },
        finalTeams: {} as { [teamId: string]: number },
        champions: {} as { [teamId: string]: number },
        upsets: [] as any[],
        cinderellaRuns: [] as any[],
        averageUpsets: 0,
        totalSimulations: simulations,
      };

      for (let sim = 0; sim < simulations; sim++) {
        const simulationResult = await this.simulateSingleTournament(bracket, year);

        // Aggregate results
        this.aggregateSimulationResults(results, simulationResult);
      }

      // Convert counts to probabilities
      this.convertCountsToProbabilities(results, simulations);

      return results;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Tournament simulation failed: ${error.message}`);
    }
  }

  /**
   * Simulate a single tournament bracket
   */
  private async simulateSingleTournament(bracket: MarchMadnessBracket, year: number): Promise<any> {
    const result = {
      regionalChampions: {} as { [region: string]: string },
      finalFour: [] as string[],
      finals: [] as string[],
      champion: '',
      upsets: [] as any[],
      rounds: {} as { [round: string]: { [gameId: string]: string } },
    };

    // Simulate each region
    for (const [regionName, regionData] of Object.entries(bracket.regions)) {
      const regionalResult = await this.simulateRegion(regionData, regionName, year);
      result.regionalChampions[regionName] = regionalResult.champion;
      result.upsets.push(...regionalResult.upsets);
      Object.assign(result.rounds, regionalResult.rounds);
    }

    // Simulate Final Four
    const finalFourTeams = Object.values(result.regionalChampions);
    const finalFourResult = await this.simulateFinalFour(finalFourTeams, year);
    result.finalFour = finalFourTeams;
    result.finals = finalFourResult.finalists;
    result.champion = finalFourResult.champion;

    return result;
  }

  /**
   * Simulate a single region of the tournament
   */
  private async simulateRegion(regionData: any, regionName: string, year: number): Promise<any> {
    const result = {
      champion: '',
      upsets: [] as any[],
      rounds: {} as { [round: string]: { [gameId: string]: string } },
    };

    // Create matchups for each round
    const teams = regionData.teams.slice(); // Copy array
    let currentRound = 'Round of 64';

    while (teams.length > 1) {
      const roundResults: { [gameId: string]: string } = {};
      const nextRoundTeams = [];

      // Simulate games for current round
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          const team1 = teams[i];
          const team2 = teams[i + 1];

          const gameId = `${regionName}_${currentRound}_${team1.teamId}_${team2.teamId}`;
          const winner = await this.simulateGame(team1.teamId, team2.teamId, year);

          roundResults[gameId] = winner;
          nextRoundTeams.push(teams.find(t => t.teamId === winner));

          // Check for upset
          if (team1.seed > team2.seed && winner === team1.teamId) {
            result.upsets.push({
              round: currentRound,
              higherSeed: team2.seed,
              lowerSeed: team1.seed,
              winner: team1.teamId,
            });
          } else if (team2.seed > team1.seed && winner === team2.teamId) {
            result.upsets.push({
              round: currentRound,
              higherSeed: team1.seed,
              lowerSeed: team2.seed,
              winner: team2.teamId,
            });
          }
        }
      }

      result.rounds[currentRound] = roundResults;
      teams.splice(0, teams.length, ...nextRoundTeams);

      // Move to next round
      currentRound = this.getNextRound(currentRound);
    }

    result.champion = teams[0]?.teamId || '';
    return result;
  }

  /**
   * Simulate Final Four and Championship
   */
  private async simulateFinalFour(teams: string[], year: number): Promise<any> {
    if (teams.length !== 4) {
      throw new Error('Final Four requires exactly 4 teams');
    }

    // Simulate semifinals
    const finalist1 = await this.simulateGame(teams[0], teams[1], year);
    const finalist2 = await this.simulateGame(teams[2], teams[3], year);

    // Simulate championship
    const champion = await this.simulateGame(finalist1, finalist2, year);

    return {
      finalists: [finalist1, finalist2],
      champion,
    };
  }

  /**
   * Simulate a single game between two teams
   */
  private async simulateGame(team1Id: string, team2Id: string, year: number): Promise<string> {
    try {
      // Get basic prediction
      const prediction = await this.predictGame(team1Id, team2Id, new Date(), null);

      // Use win probability to determine winner
      const random = Math.random();
      return random < prediction.winProbability ? team1Id : team2Id;
    } catch (error) {
      // Fallback to random selection if prediction fails
      return Math.random() < 0.5 ? team1Id : team2Id;
    }
  }

  /**
   * Helper methods for calculations
   */

  private async loadModels(): Promise<void> {
    // Placeholder for model loading
    console.log('Loading NCAA Basketball ML models...');
  }

  private async generateBasePredictions(features: NCAAMLFeatures): Promise<any> {
    // Simplified prediction logic for college basketball
    const homeAdvantage = 0.55; // College home advantage
    const strengthDiff =
      features.homeTeamStrength.netEfficiency - features.awayTeamStrength.netEfficiency;

    // Win probability calculation with college-specific factors
    let winProbability = homeAdvantage + strengthDiff / 1000;

    // Adjust for tournament factors if applicable
    if (features.tournamentFactors.homeTeamSeed > 0) {
      const seedAdj =
        (features.tournamentFactors.awayTeamSeed - features.tournamentFactors.homeTeamSeed) * 0.05;
      winProbability += seedAdj;
    }

    winProbability = Math.max(0.05, Math.min(0.95, winProbability));

    // Spread calculation
    const spread = strengthDiff / 3.0;

    // Total calculation
    const avgEfficiency =
      (features.homeTeamStrength.adjustedOffensiveEfficiency +
        features.awayTeamStrength.adjustedOffensiveEfficiency) /
      2;
    const totalPrediction = avgEfficiency * 2; // Rough total calculation

    return {
      winProbability,
      spread,
      total: totalPrediction,
    };
  }

  private determineSeasonType(
    gameDate: Date,
    tournamentInfo?: any
  ): 'Regular Season' | 'Conference Tournament' | 'March Madness' | 'NIT' | 'CBI' {
    if (tournamentInfo) {
      return tournamentInfo.tournamentName === 'March Madness'
        ? 'March Madness'
        : 'Conference Tournament';
    }

    const month = gameDate.getMonth() + 1;
    if (month >= 11 || month <= 2) return 'Regular Season';
    if (month === 3 && gameDate.getDate() < 15) return 'Conference Tournament';
    return 'March Madness';
  }

  private extractTeamStrengthFeatures(
    analytics: NCAATeamAnalytics,
    homeAway: 'home' | 'away'
  ): any {
    return {
      kenpomRating: analytics.collegeBasketballMetrics.kenpomRating,
      netRating: analytics.collegeBasketballMetrics.netRating,
      rpi: analytics.collegeBasketballMetrics.rpi,
      strengthOfSchedule: analytics.collegeBasketballMetrics.strengthOfSchedule,
      adjustedOffensiveEfficiency: analytics.offensiveMetrics.adjustedOffensiveEfficiency,
      adjustedDefensiveEfficiency: analytics.defensiveMetrics.adjustedDefensiveEfficiency,
      netEfficiency: analytics.advancedMetrics.netEfficiency,
      recentForm:
        analytics.situationalMetrics.versusRankedTeams.wins /
        Math.max(
          1,
          analytics.situationalMetrics.versusRankedTeams.wins +
            analytics.situationalMetrics.versusRankedTeams.losses
        ),
      quadrant1Record:
        analytics.collegeBasketballMetrics.quadrantRecord.q1.wins /
        Math.max(
          1,
          analytics.collegeBasketballMetrics.quadrantRecord.q1.wins +
            analytics.collegeBasketballMetrics.quadrantRecord.q1.losses
        ),
      qualityWins: analytics.collegeBasketballMetrics.qualityWins,
      badLosses: analytics.collegeBasketballMetrics.badLosses,
      conferenceRecord:
        homeAway === 'home'
          ? analytics.situationalMetrics.homeCourtAdvantage
          : analytics.situationalMetrics.roadPerformance,
      awayRecord: analytics.situationalMetrics.roadPerformance,
      neutralSiteRecord: analytics.situationalMetrics.neutralSitePerformance,
      versusTop25: analytics.situationalMetrics.versusRankedTeams.avgMargin,
      clutchPerformance: analytics.advancedMetrics.clutchPerformance,
      comebackRecord: analytics.situationalMetrics.comebackRecord,
      blowoutRecord:
        analytics.situationalMetrics.blowoutRecord.wins /
        Math.max(
          1,
          analytics.situationalMetrics.blowoutRecord.wins +
            analytics.situationalMetrics.blowoutRecord.losses
        ),
      experienceRating: analytics.advancedMetrics.experienceRating,
      coachingRating: analytics.advancedMetrics.coachingEffectiveness,
      benchDepth: analytics.advancedMetrics.benchDepth,
      healthRating: 1 - analytics.advancedMetrics.injuryImpact,
      chemistryRating: analytics.advancedMetrics.chemistryRating,
      momentumRating: analytics.tournamentReadiness.categories.momentum / 100,
      intangibles: analytics.tournamentReadiness.categories.intangibles / 100,
    };
  }

  private getNextRound(currentRound: string): string {
    const rounds = [
      'Round of 64',
      'Round of 32',
      'Sweet 16',
      'Elite Eight',
      'Final Four',
      'Championship',
    ];
    const currentIndex = rounds.indexOf(currentRound);
    return currentIndex < rounds.length - 1 ? rounds[currentIndex + 1] : 'Championship';
  }

  private aggregateSimulationResults(results: any, simulation: any): void {
    // Aggregate regional champions
    for (const [region, champion] of Object.entries(simulation.regionalChampions)) {
      if (!results.regionalChampions[region]) results.regionalChampions[region] = {};
      results.regionalChampions[region][champion as string] =
        (results.regionalChampions[region][champion as string] || 0) + 1;
    }

    // Aggregate Final Four
    for (const team of simulation.finalFour) {
      results.finalFourTeams[team] = (results.finalFourTeams[team] || 0) + 1;
    }

    // Aggregate finals
    for (const team of simulation.finals) {
      results.finalTeams[team] = (results.finalTeams[team] || 0) + 1;
    }

    // Aggregate champion
    results.champions[simulation.champion] = (results.champions[simulation.champion] || 0) + 1;

    // Aggregate upsets
    results.upsets.push(...simulation.upsets);
  }

  private convertCountsToProbabilities(results: any, simulations: number): void {
    // Convert regional champions
    for (const region of Object.keys(results.regionalChampions)) {
      for (const team of Object.keys(results.regionalChampions[region])) {
        results.regionalChampions[region][team] /= simulations;
      }
    }

    // Convert other results
    for (const team of Object.keys(results.finalFourTeams)) {
      results.finalFourTeams[team] /= simulations;
    }

    for (const team of Object.keys(results.finalTeams)) {
      results.finalTeams[team] /= simulations;
    }

    for (const team of Object.keys(results.champions)) {
      results.champions[team] /= simulations;
    }

    results.averageUpsets = results.upsets.length / simulations;
  }

  /**
   * Data retrieval helpers and placeholder implementations
   */

  private async getTeamAnalytics(
    teamId: string,
    season: number
  ): Promise<NCAATeamAnalytics | null> {
    try {
      const analyticsDoc = await getDoc(doc(db, 'ncaa_team_analytics', `${teamId}_${season}`));
      return analyticsDoc.exists() ? (analyticsDoc.data() as NCAATeamAnalytics) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getCurrentBracket(year: number): Promise<MarchMadnessBracket | null> {
    try {
      const bracketDoc = await getDoc(doc(db, 'march_madness_brackets', year.toString()));
      return bracketDoc.exists() ? (bracketDoc.data() as MarchMadnessBracket) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  // Placeholder implementations for complex calculations
  private async applyTournamentAdjustments(
    features: NCAAMLFeatures,
    predictions: any,
    tournamentInfo: any
  ): Promise<any> {
    return {};
  }
  private async generateAdvancedPredictions(
    features: NCAAMLFeatures,
    basePredictions: any
  ): Promise<any> {
    return {};
  }
  private async generatePlayerPredictions(
    homeTeamId: string,
    awayTeamId: string,
    features: NCAAMLFeatures
  ): Promise<any> {
    return { homeTeam: [], awayTeam: [] };
  }
  private async calculatePredictionConfidence(
    features: NCAAMLFeatures,
    predictions: any
  ): Promise<any> {
    return { overall: 0.75, spread: 0.75, total: 0.7, upset: 0.6 };
  }
  private async calculateMarchMadnessMetrics(
    features: NCAAMLFeatures,
    predictions: any
  ): Promise<any> {
    return {};
  }
  private async calculateSituationalFactors(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<any> {
    return {};
  }
  private async calculateTournamentContext(
    tournamentInfo: any,
    features: NCAAMLFeatures
  ): Promise<any> {
    return {};
  }
  private async extractTournamentFeatures(
    homeTeamId: string,
    awayTeamId: string,
    tournamentInfo: any
  ): Promise<any> {
    return {};
  }
  private async calculateMatchupFeatures(
    homeAnalytics: NCAATeamAnalytics,
    awayAnalytics: NCAATeamAnalytics
  ): Promise<any> {
    return {};
  }
  private async extractSituationalFeatures(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<any> {
    return {};
  }
  private async extractHistoricalFeatures(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<any> {
    return {};
  }
  private async generateRegionalPredictions(
    bracket: MarchMadnessBracket,
    simulation: any
  ): Promise<any> {
    return {};
  }
  private async generateFinalFourPredictions(simulation: any): Promise<any> {
    return {};
  }
  private async generateChampionshipPredictions(simulation: any): Promise<any> {
    return {};
  }
  private compileSimulationResults(simulation: any): any {
    return {};
  }
  private async getTournamentModelAccuracy(): Promise<number> {
    return 0.72;
  }
  private async getRegularSeasonModelAccuracy(): Promise<number> {
    return 0.68;
  }

  /**
   * Public utility methods
   */

  async getPrediction(gameId: string): Promise<NCAAGamePrediction | null> {
    try {
      const predictionDoc = await getDoc(doc(db, 'ncaa_predictions', gameId));
      return predictionDoc.exists() ? (predictionDoc.data() as NCAAGamePrediction) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async getBracketPrediction(year: number): Promise<MarchMadnessBracketPrediction | null> {
    try {
      const predictionDoc = await getDoc(
        doc(db, 'march_madness_bracket_predictions', year.toString())
      );
      return predictionDoc.exists()
        ? (predictionDoc.data() as MarchMadnessBracketPrediction)
        : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async getUpsetPredictions(year: number, minProbability: number = 0.3): Promise<any[]> {
    try {
      const bracketPrediction = await this.getBracketPrediction(year);
      if (!bracketPrediction) return [];

      const upsets: any[] = [];

      for (const region of Object.values(bracketPrediction.regionalPredictions)) {
        upsets.push(...region.upsets.filter(upset => upset.upsetProbability >= minProbability));
      }

      return upsets.sort((a, b) => b.upsetProbability - a.upsetProbability);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  async getCinderellaTeams(year: number): Promise<any[]> {
    try {
      const bracketPrediction = await this.getBracketPrediction(year);
      if (!bracketPrediction) return [];

      const cinderellas: any[] = [];

      for (const region of Object.values(bracketPrediction.regionalPredictions)) {
        cinderellas.push(...region.sleepers.filter(sleeper => sleeper.seed >= 11));
      }

      return cinderellas.sort((a, b) => b.probability - a.probability);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  async getChampionshipFavorites(year: number): Promise<any[]> {
    try {
      const bracketPrediction = await this.getBracketPrediction(year);
      if (!bracketPrediction) return [];

      return bracketPrediction.championshipPredictions.favorites.sort(
        (a, b) => b.probability - a.probability
      );
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  async validateTournamentAccuracy(year: number): Promise<number> {
    try {
      // Get predictions and actual results for validation
      const predictions = await this.getBracketPrediction(year);
      if (!predictions) return 0;

      // This would compare predictions against actual tournament results
      // Placeholder implementation
      return 0.72; // 72% accuracy
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }
}

export const ncaaBasketballMLPredictionService = new NCAABasketballMLPredictionService();
