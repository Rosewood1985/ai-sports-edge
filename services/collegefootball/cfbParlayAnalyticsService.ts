import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import { CollegeFootballGame, TeamSeasonStats } from './collegefootballInterfaces';

interface CFBParlayLeg {
  gameId: string;
  betType: 'spread' | 'total' | 'moneyline' | 'player_prop' | 'team_prop';
  selection: string;
  odds: number;
  confidence: number;
  
  // College Football specific
  gameType: 'conference' | 'non_conference' | 'bowl' | 'playoff' | 'championship';
  weekNumber: number;
  rivalry?: boolean;
  homecomingGame?: boolean;
  seniorDay?: boolean;
  
  // Line information
  currentLine: number;
  openingLine: number;
  lineMovement: number;
  publicPercentage: number;
  sharpMoney: boolean;
}

interface CFBParlayData {
  parlayId: string;
  legs: CFBParlayLeg[];
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  season: number;
  week: number;
  userId?: string;
  timestamp: string;
}

interface CFBGameCorrelation {
  game1Id: string;
  game2Id: string;
  correlationType: 'positive' | 'negative' | 'neutral';
  correlationStrength: number; // -1 to 1
  
  // College Football specific correlations
  conferenceRelation: 'same_conference' | 'rival_conferences' | 'different_conferences';
  coachingConnection?: string; // Former assistant coaches, etc.
  recruitingOverlap?: number; // Percentage of recruiting territory overlap
  styleOfPlay?: 'similar' | 'contrasting' | 'neutral';
  
  // Statistical correlation
  historicalCorrelation: number;
  situationalFactors: string[];
  confidenceLevel: number;
}

interface CFBParlayPrediction {
  parlayId: string;
  overallProbability: number;
  expectedValue: number;
  
  // Individual leg analysis
  individualProbabilities: Array<{
    legIndex: number;
    gameId: string;
    probability: number;
    confidence: number;
    keyFactors: string[];
  }>;
  
  // Correlation adjustments
  correlationAdjustments: Array<{
    leg1Index: number;
    leg2Index: number;
    correlationType: string;
    adjustment: number;
    reasoning: string;
  }>;
  
  // College Football specific risk factors
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    mitigation?: string;
  }>;
  
  // Recommendations and alternatives
  recommendations: Array<{
    type: 'keep' | 'remove' | 'replace' | 'hedge';
    legIndex?: number;
    reasoning: string;
    alternativeSelection?: string;
    impactOnPayout: number;
  }>;
  
  // Alternative parlay suggestions
  alternativeSelections: Array<{
    originalLeg: number;
    alternativeSelection: string;
    alternativeOdds: number;
    probabilityImprovement: number;
    payoutImpact: number;
    reasoning: string;
  }>;
  
  // College Football situational analysis
  situationalAnalysis: {
    rivalryGames: number;
    bowlGames: number;
    conferenceChampionships: number;
    playoffImplications: number;
    weatherConcerns: string[];
    injuryConcerns: string[];
    motivationFactors: string[];
  };
  
  confidence: number;
  lastUpdated: string;
}

interface CFBRiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedLegs: number[];
  description: string;
  
  // College Football specific risks
  cfbSpecific: {
    lookAheadSpot?: boolean;
    trapGame?: boolean;
    emotionalLetdown?: boolean;
    rivalryIntensity?: number;
    bowlMotivation?: 'high' | 'medium' | 'low';
    coachingChanges?: boolean;
    keyPlayerInjuries?: string[];
    weatherImpact?: 'significant' | 'moderate' | 'minimal';
    travelDistance?: number;
    restDays?: number;
  };
}

interface CFBParlayRecommendation {
  type: 'optimization' | 'risk_reduction' | 'value_enhancement' | 'alternative_construction';
  title: string;
  description: string;
  
  // Specific recommendations
  legModifications?: Array<{
    legIndex: number;
    currentSelection: string;
    recommendedSelection: string;
    reasoning: string;
    impactOnOdds: number;
    impactOnProbability: number;
  }>;
  
  // College Football specific recommendations
  cfbOptimizations?: {
    conferenceBalance?: string;
    gameTypeBalance?: string;
    timingOptimization?: string;
    weatherConsiderations?: string;
    motivationAlignment?: string;
  };
  
  impact: {
    probabilityChange: number;
    payoutChange: number;
    riskChange: number;
  };
}

export class CFBParlayAnalyticsService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async analyzeCFBParlay(parlayData: CFBParlayData): Promise<CFBParlayPrediction> {
    const transaction = Sentry.startTransaction({
      name: 'cfb-parlay-analysis',
      op: 'parlay-analytics'
    });

    try {
      // Get game data for all legs
      const gameDataPromises = parlayData.legs.map(leg => 
        this.getGameData(leg.gameId)
      );
      const gamesData = await Promise.all(gameDataPromises);

      // Analyze individual leg probabilities
      const individualProbabilities = await Promise.all(
        parlayData.legs.map((leg, index) => 
          this.analyzeIndividualLeg(leg, gamesData[index])
        )
      );

      // Identify correlations between legs
      const correlations = await this.identifyCorrelations(parlayData.legs, gamesData);

      // Calculate correlation adjustments
      const correlationAdjustments = this.calculateCorrelationAdjustments(
        parlayData.legs,
        individualProbabilities,
        correlations
      );

      // Apply correlation adjustments to get overall probability
      const overallProbability = this.calculateOverallProbability(
        individualProbabilities,
        correlationAdjustments
      );

      // Calculate expected value
      const expectedValue = this.calculateExpectedValue(
        overallProbability,
        parlayData.totalOdds,
        parlayData.stake
      );

      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors(parlayData.legs, gamesData);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        parlayData,
        individualProbabilities,
        correlations,
        riskFactors
      );

      // Generate alternative selections
      const alternativeSelections = await this.generateAlternativeSelections(
        parlayData,
        individualProbabilities,
        gamesData
      );

      // Perform situational analysis
      const situationalAnalysis = this.performSituationalAnalysis(parlayData.legs, gamesData);

      const prediction: CFBParlayPrediction = {
        parlayId: parlayData.parlayId,
        overallProbability,
        expectedValue,
        individualProbabilities,
        correlationAdjustments,
        riskFactors,
        recommendations,
        alternativeSelections,
        situationalAnalysis,
        confidence: this.calculateConfidence(parlayData, correlations, riskFactors),
        lastUpdated: new Date().toISOString()
      };

      // Store the analysis
      await this.storeParlayAnalysis(parlayData.parlayId, prediction);

      transaction.setStatus('ok');
      return prediction;

    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  private async getGameData(gameId: string): Promise<CollegeFootballGame | null> {
    const gameDoc = await this.db.collection('cfb_games').doc(gameId).get();
    return gameDoc.exists ? gameDoc.data() as CollegeFootballGame : null;
  }

  private async analyzeIndividualLeg(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame | null
  ): Promise<any> {
    if (!gameData) {
      return {
        legIndex: 0,
        gameId: leg.gameId,
        probability: 0.5,
        confidence: 0.1,
        keyFactors: ['Game data not available']
      };
    }

    // Get team stats and historical data
    const [homeStats, awayStats] = await Promise.all([
      this.getTeamStats(gameData.homeTeam.teamId, gameData.season),
      this.getTeamStats(gameData.awayTeam.teamId, gameData.season)
    ]);

    // Analyze based on bet type
    let probability = 0.5;
    let keyFactors: string[] = [];

    switch (leg.betType) {
      case 'spread':
        ({ probability, keyFactors } = this.analyzeSpread(leg, gameData, homeStats, awayStats));
        break;
      case 'total':
        ({ probability, keyFactors } = this.analyzeTotal(leg, gameData, homeStats, awayStats));
        break;
      case 'moneyline':
        ({ probability, keyFactors } = this.analyzeMoneyline(leg, gameData, homeStats, awayStats));
        break;
      case 'player_prop':
        ({ probability, keyFactors } = await this.analyzePlayerProp(leg, gameData));
        break;
      case 'team_prop':
        ({ probability, keyFactors } = this.analyzeTeamProp(leg, gameData, homeStats, awayStats));
        break;
    }

    // Adjust for college football specific factors
    const cfbAdjustments = this.applyCFBSpecificAdjustments(leg, gameData, probability);
    probability = cfbAdjustments.adjustedProbability;
    keyFactors = [...keyFactors, ...cfbAdjustments.additionalFactors];

    return {
      legIndex: 0, // Will be set by caller
      gameId: leg.gameId,
      probability,
      confidence: this.calculateLegConfidence(leg, gameData, homeStats, awayStats),
      keyFactors
    };
  }

  private analyzeSpread(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame,
    homeStats: TeamSeasonStats | null,
    awayStats: TeamSeasonStats | null
  ): { probability: number; keyFactors: string[] } {
    const keyFactors: string[] = [];
    
    if (!homeStats || !awayStats) {
      return { probability: 0.5, keyFactors: ['Team stats unavailable'] };
    }

    // Basic spread analysis
    const homeAdvantage = 3.5; // CFB home field advantage
    const pointDifferential = (homeStats.pointsPerGame - homeStats.pointsAllowedPerGame) -
                             (awayStats.pointsPerGame - awayStats.pointsAllowedPerGame);
    
    const impliedSpread = pointDifferential + homeAdvantage;
    const currentSpread = leg.currentLine;
    const spreadDifference = impliedSpread - currentSpread;

    // Base probability from spread difference
    let probability = 0.5 + (spreadDifference * 0.02); // 2% per point difference

    // College Football specific adjustments
    if (gameData.gameType === 'conference') {
      probability *= 0.95; // Conference games are more competitive
      keyFactors.push('Conference game competitiveness');
    }

    if (gameData.rivalry) {
      probability *= 0.90; // Rivalry games are unpredictable
      keyFactors.push('Rivalry game unpredictability');
    }

    if (leg.weekNumber >= 14) {
      // Late season games with playoff implications
      if (homeStats.wins >= 10 || awayStats.wins >= 10) {
        keyFactors.push('Playoff implications for contender');
      }
    }

    // Strength of schedule adjustments
    const sosAdjustment = (homeStats.strengthOfSchedule - awayStats.strengthOfSchedule) * 0.01;
    probability += sosAdjustment;
    
    if (Math.abs(sosAdjustment) > 0.03) {
      keyFactors.push('Significant strength of schedule difference');
    }

    // Recent form (last 4 games)
    const homeFormScore = this.calculateRecentForm(homeStats);
    const awayFormScore = this.calculateRecentForm(awayStats);
    const formDifference = homeFormScore - awayFormScore;
    
    probability += formDifference * 0.02;
    
    if (Math.abs(formDifference) > 1.5) {
      keyFactors.push('Significant difference in recent form');
    }

    return {
      probability: Math.max(0.05, Math.min(0.95, probability)),
      keyFactors
    };
  }

  private analyzeTotal(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame,
    homeStats: TeamSeasonStats | null,
    awayStats: TeamSeasonStats | null
  ): { probability: number; keyFactors: string[] } {
    const keyFactors: string[] = [];
    
    if (!homeStats || !awayStats) {
      return { probability: 0.5, keyFactors: ['Team stats unavailable'] };
    }

    const totalLine = leg.currentLine;
    const projectedTotal = (homeStats.pointsPerGame + awayStats.pointsAllowedPerGame +
                           awayStats.pointsPerGame + homeStats.pointsAllowedPerGame) / 2;

    let probability = projectedTotal > totalLine ? 0.55 : 0.45;

    // Pace adjustments
    const avgPossessions = (homeStats.pointsPerGame / 28) + (awayStats.pointsPerGame / 28); // Rough possession estimate
    if (avgPossessions > 75) {
      probability += 0.05;
      keyFactors.push('High-pace teams favor over');
    } else if (avgPossessions < 65) {
      probability -= 0.05;
      keyFactors.push('Low-pace teams favor under');
    }

    // Weather considerations (if available)
    if (gameData.weather) {
      if (gameData.weather.windSpeed > 20 || gameData.weather.precipitation > 0.5) {
        probability -= 0.08;
        keyFactors.push('Adverse weather conditions favor under');
      }
    }

    // Bowl game considerations
    if (gameData.gameType === 'bowl') {
      // Bowl games often have different preparation and motivation
      probability *= 0.95;
      keyFactors.push('Bowl game uncertainty');
    }

    // Defensive strength
    const homeDefEfficiency = homeStats.defensiveEfficiency || 50;
    const awayDefEfficiency = awayStats.defensiveEfficiency || 50;
    const avgDefEfficiency = (homeDefEfficiency + awayDefEfficiency) / 2;
    
    if (avgDefEfficiency > 75) {
      probability -= 0.06;
      keyFactors.push('Strong defenses favor under');
    } else if (avgDefEfficiency < 40) {
      probability += 0.06;
      keyFactors.push('Weak defenses favor over');
    }

    return {
      probability: Math.max(0.05, Math.min(0.95, probability)),
      keyFactors
    };
  }

  private analyzeMoneyline(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame,
    homeStats: TeamSeasonStats | null,
    awayStats: TeamSeasonStats | null
  ): { probability: number; keyFactors: string[] } {
    const keyFactors: string[] = [];
    
    if (!homeStats || !awayStats) {
      return { probability: 0.5, keyFactors: ['Team stats unavailable'] };
    }

    // Convert odds to implied probability
    const impliedProbability = this.oddsToImpliedProbability(leg.odds);
    
    // Calculate fair probability based on team metrics
    const homeWinPct = homeStats.wins / (homeStats.wins + homeStats.losses);
    const awayWinPct = awayStats.wins / (awayStats.wins + awayStats.losses);
    
    // Strength of record comparison
    const homeStrength = homeStats.strengthOfRecord || homeWinPct;
    const awayStrength = awayStats.strengthOfRecord || awayWinPct;
    
    let fairProbability = 0.5 + (homeStrength - awayStrength) + 0.1; // Home field advantage
    
    // Adjust for game context
    if (gameData.gameType === 'conference') {
      // Conference games are more predictable
      fairProbability = fairProbability * 0.8 + 0.5 * 0.2;
    }

    // Look for value
    const edge = fairProbability - impliedProbability;
    
    if (edge > 0.05) {
      keyFactors.push('Positive expected value detected');
    } else if (edge < -0.05) {
      keyFactors.push('Negative expected value - overpriced');
    }

    // Talent differential
    const talentDiff = (homeStats.talentComposite || 80) - (awayStats.talentComposite || 80);
    if (Math.abs(talentDiff) > 10) {
      keyFactors.push('Significant talent differential');
    }

    return {
      probability: fairProbability,
      keyFactors
    };
  }

  private async analyzePlayerProp(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame
  ): Promise<{ probability: number; keyFactors: string[] }> {
    // Player prop analysis for college football
    // This would require detailed player stats and projections
    
    const keyFactors: string[] = [];
    
    // Basic analysis - in production, this would be much more sophisticated
    let probability = 0.5;
    
    // Check for key player information
    const playerName = leg.selection.split(' ')[0]; // Extract player name
    
    // Game script considerations
    if (gameData.gameType === 'bowl' || gameData.gameType === 'playoff') {
      keyFactors.push('Bowl/playoff game - players motivated to perform');
      probability += 0.02;
    }

    // Weather impact on certain props
    if (gameData.weather && (leg.selection.includes('passing') || leg.selection.includes('receiving'))) {
      if (gameData.weather.windSpeed > 15) {
        probability -= 0.05;
        keyFactors.push('Wind conditions may impact passing game');
      }
    }

    keyFactors.push('Player prop analysis requires additional data');

    return { probability, keyFactors };
  }

  private analyzeTeamProp(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame,
    homeStats: TeamSeasonStats | null,
    awayStats: TeamSeasonStats | null
  ): { probability: number; keyFactors: string[] } {
    const keyFactors: string[] = [];
    
    if (!homeStats || !awayStats) {
      return { probability: 0.5, keyFactors: ['Team stats unavailable'] };
    }

    let probability = 0.5;

    // Analyze based on the specific team prop
    if (leg.selection.includes('first quarter') || leg.selection.includes('1Q')) {
      // First quarter scoring props
      const homeFirstQuarterAvg = homeStats.pointsPerGame * 0.23; // Roughly 23% of points in 1Q
      const awayFirstQuarterAvg = awayStats.pointsPerGame * 0.23;
      
      keyFactors.push('First quarter analysis based on season averages');
    } else if (leg.selection.includes('rushing yards')) {
      // Team rushing yards
      const rushingYards = leg.selection.includes(gameData.homeTeam.name) ? 
                          homeStats.rushingYardsPerGame : awayStats.rushingYardsPerGame;
      
      keyFactors.push('Rushing yards analysis based on season performance');
    }

    return { probability, keyFactors };
  }

  private applyCFBSpecificAdjustments(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame,
    baseProbability: number
  ): { adjustedProbability: number; additionalFactors: string[] } {
    let adjustedProbability = baseProbability;
    const additionalFactors: string[] = [];

    // Rivalry game adjustments
    if (gameData.rivalry) {
      adjustedProbability *= 0.92; // Rivalry games are less predictable
      additionalFactors.push('Rivalry game unpredictability factor');
    }

    // Homecoming adjustments
    if (leg.homecomingGame) {
      adjustedProbability += 0.03; // Slight home team boost
      additionalFactors.push('Homecoming game motivation');
    }

    // Senior Day adjustments
    if (leg.seniorDay) {
      adjustedProbability += 0.02; // Emotional boost for home team
      additionalFactors.push('Senior Day emotional factor');
    }

    // Bowl game adjustments
    if (gameData.gameType === 'bowl') {
      // Bowl games have unique dynamics
      adjustedProbability *= 0.95;
      additionalFactors.push('Bowl game preparation differences');
    }

    // Conference championship adjustments
    if (gameData.gameType === 'championship') {
      // Higher stakes, more predictable
      adjustedProbability = adjustedProbability * 0.9 + baseProbability * 0.1;
      additionalFactors.push('Conference championship intensity');
    }

    // Late season adjustments
    if (leg.weekNumber >= 12) {
      // Teams fighting for bowl eligibility or playoff spots
      additionalFactors.push('Late season implications');
    }

    return {
      adjustedProbability: Math.max(0.05, Math.min(0.95, adjustedProbability)),
      additionalFactors
    };
  }

  private async identifyCorrelations(
    legs: CFBParlayLeg[],
    gamesData: (CollegeFootballGame | null)[]
  ): Promise<CFBGameCorrelation[]> {
    const correlations: CFBGameCorrelation[] = [];

    for (let i = 0; i < legs.length; i++) {
      for (let j = i + 1; j < legs.length; j++) {
        const game1 = gamesData[i];
        const game2 = gamesData[j];
        
        if (!game1 || !game2) continue;

        const correlation = await this.analyzeGameCorrelation(
          legs[i], legs[j], game1, game2
        );
        
        if (correlation) {
          correlations.push(correlation);
        }
      }
    }

    return correlations;
  }

  private async analyzeGameCorrelation(
    leg1: CFBParlayLeg,
    leg2: CFBParlayLeg,
    game1: CollegeFootballGame,
    game2: CollegeFootballGame
  ): Promise<CFBGameCorrelation | null> {
    // Same game correlation
    if (leg1.gameId === leg2.gameId) {
      return this.analyzeSameGameCorrelation(leg1, leg2, game1);
    }

    // Different games correlation
    let correlationType: 'positive' | 'negative' | 'neutral' = 'neutral';
    let correlationStrength = 0;
    const situationalFactors: string[] = [];

    // Conference relationship
    const conferenceRelation = this.determineConferenceRelation(game1, game2);
    
    // Time-based correlation (games on same day)
    const game1Date = new Date(game1.date);
    const game2Date = new Date(game2.date);
    const daysDifference = Math.abs(game1Date.getTime() - game2Date.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDifference < 1) {
      // Same day games might have weather or referee crew correlations
      situationalFactors.push('Same day games');
    }

    // Conference standings implications
    if (conferenceRelation === 'same_conference') {
      correlationStrength = 0.15;
      correlationType = 'positive';
      situationalFactors.push('Same conference standings implications');
    }

    // Coaching connections
    const coachingConnection = await this.checkCoachingConnections(game1, game2);
    if (coachingConnection) {
      situationalFactors.push('Coaching connection detected');
    }

    // Only return significant correlations
    if (Math.abs(correlationStrength) < 0.1) {
      return null;
    }

    return {
      game1Id: leg1.gameId,
      game2Id: leg2.gameId,
      correlationType,
      correlationStrength,
      conferenceRelation,
      coachingConnection,
      historicalCorrelation: correlationStrength,
      situationalFactors,
      confidenceLevel: 0.7
    };
  }

  private analyzeSameGameCorrelation(
    leg1: CFBParlayLeg,
    leg2: CFBParlayLeg,
    game: CollegeFootballGame
  ): CFBGameCorrelation {
    let correlationType: 'positive' | 'negative' | 'neutral' = 'neutral';
    let correlationStrength = 0;
    const situationalFactors: string[] = [];

    // Total and spread correlation
    if ((leg1.betType === 'total' && leg2.betType === 'spread') ||
        (leg1.betType === 'spread' && leg2.betType === 'total')) {
      correlationStrength = 0.25;
      correlationType = 'positive';
      situationalFactors.push('Total and spread correlation');
    }

    // Player props and team performance
    if (leg1.betType === 'player_prop' && leg2.betType === 'spread') {
      correlationStrength = 0.3;
      correlationType = 'positive';
      situationalFactors.push('Star player performance affects team outcome');
    }

    // Multiple player props from same team
    if (leg1.betType === 'player_prop' && leg2.betType === 'player_prop') {
      // Check if same team
      correlationStrength = 0.2;
      correlationType = 'positive';
      situationalFactors.push('Multiple player props from same team');
    }

    return {
      game1Id: leg1.gameId,
      game2Id: leg2.gameId,
      correlationType,
      correlationStrength,
      conferenceRelation: 'same_conference',
      historicalCorrelation: correlationStrength,
      situationalFactors,
      confidenceLevel: 0.8
    };
  }

  private determineConferenceRelation(
    game1: CollegeFootballGame,
    game2: CollegeFootballGame
  ): 'same_conference' | 'rival_conferences' | 'different_conferences' {
    const game1Conferences = [game1.conference.homeConference, game1.conference.awayConference];
    const game2Conferences = [game2.conference.homeConference, game2.conference.awayConference];

    const hasCommonConference = game1Conferences.some(conf => game2Conferences.includes(conf));
    
    if (hasCommonConference) {
      return 'same_conference';
    }

    // Check for rival conferences (SEC vs Big Ten, etc.)
    const rivalConferences = [
      ['SEC', 'Big Ten'],
      ['Big 12', 'ACC'],
      ['Pac-12', 'Big Ten']
    ];

    const isRivalry = rivalConferences.some(rivalry => 
      (game1Conferences.some(conf => rivalry.includes(conf)) &&
       game2Conferences.some(conf => rivalry.includes(conf)))
    );

    return isRivalry ? 'rival_conferences' : 'different_conferences';
  }

  private async checkCoachingConnections(
    game1: CollegeFootballGame,
    game2: CollegeFootballGame
  ): Promise<string | undefined> {
    // Check for coaching staff connections
    // This would require a coaching staff database
    // For now, return undefined
    return undefined;
  }

  private calculateCorrelationAdjustments(
    legs: CFBParlayLeg[],
    individualProbabilities: any[],
    correlations: CFBGameCorrelation[]
  ): any[] {
    const adjustments: any[] = [];

    correlations.forEach(correlation => {
      const leg1Index = legs.findIndex(leg => leg.gameId === correlation.game1Id);
      const leg2Index = legs.findIndex(leg => leg.gameId === correlation.game2Id);

      if (leg1Index === -1 || leg2Index === -1) return;

      const leg1Prob = individualProbabilities[leg1Index].probability;
      const leg2Prob = individualProbabilities[leg2Index].probability;

      // Calculate adjustment based on correlation
      let adjustment = 0;
      let reasoning = '';

      if (correlation.correlationType === 'positive') {
        adjustment = correlation.correlationStrength * 0.1;
        reasoning = 'Positive correlation increases combined probability';
      } else if (correlation.correlationType === 'negative') {
        adjustment = -correlation.correlationStrength * 0.1;
        reasoning = 'Negative correlation decreases combined probability';
      }

      adjustments.push({
        leg1Index,
        leg2Index,
        correlationType: correlation.correlationType,
        adjustment,
        reasoning
      });
    });

    return adjustments;
  }

  private calculateOverallProbability(
    individualProbabilities: any[],
    correlationAdjustments: any[]
  ): number {
    // Start with independent probability calculation
    let overallProbability = individualProbabilities.reduce(
      (acc, legProb) => acc * legProb.probability,
      1
    );

    // Apply correlation adjustments
    correlationAdjustments.forEach(adjustment => {
      overallProbability *= (1 + adjustment.adjustment);
    });

    return Math.max(0.001, Math.min(0.999, overallProbability));
  }

  private calculateExpectedValue(
    probability: number,
    odds: number,
    stake: number
  ): number {
    const impliedProbability = this.oddsToImpliedProbability(odds);
    const fairOdds = this.probabilityToOdds(probability);
    
    // Expected value calculation
    const expectedWin = probability * (this.oddsToDecimal(odds) - 1) * stake;
    const expectedLoss = (1 - probability) * stake;
    
    return expectedWin - expectedLoss;
  }

  private async identifyRiskFactors(
    legs: CFBParlayLeg[],
    gamesData: (CollegeFootballGame | null)[]
  ): Promise<CFBRiskFactor[]> {
    const riskFactors: CFBRiskFactor[] = [];

    legs.forEach((leg, index) => {
      const gameData = gamesData[index];
      if (!gameData) return;

      // Look-ahead spot risk
      if (this.isLookAheadSpot(gameData, leg.weekNumber)) {
        riskFactors.push({
          factor: 'Look-ahead spot',
          severity: 'medium',
          affectedLegs: [index],
          description: 'Team may be looking ahead to bigger game next week',
          cfbSpecific: {
            lookAheadSpot: true
          }
        });
      }

      // Trap game risk
      if (this.isTrapGame(gameData)) {
        riskFactors.push({
          factor: 'Trap game',
          severity: 'high',
          affectedLegs: [index],
          description: 'Favorite playing down to lesser opponent',
          cfbSpecific: {
            trapGame: true
          }
        });
      }

      // Weather risk
      if (gameData.weather && this.hasWeatherRisk(gameData.weather)) {
        riskFactors.push({
          factor: 'Weather conditions',
          severity: 'medium',
          affectedLegs: [index],
          description: 'Adverse weather may impact game flow',
          cfbSpecific: {
            weatherImpact: 'significant'
          }
        });
      }

      // Bowl motivation risk
      if (gameData.gameType === 'bowl') {
        const motivationLevel = this.assessBowlMotivation(gameData);
        if (motivationLevel === 'low') {
          riskFactors.push({
            factor: 'Bowl motivation',
            severity: 'medium',
            affectedLegs: [index],
            description: 'Teams may lack motivation in lesser bowl games',
            cfbSpecific: {
              bowlMotivation: motivationLevel
            }
          });
        }
      }
    });

    return riskFactors;
  }

  private isLookAheadSpot(gameData: CollegeFootballGame, weekNumber: number): boolean {
    // Check if team has a bigger game next week
    // This would require knowledge of next week's schedule
    // For now, return basic logic
    return weekNumber >= 10 && gameData.gameType === 'non_conference';
  }

  private isTrapGame(gameData: CollegeFootballGame): boolean {
    // Basic trap game detection logic
    // Would need more sophisticated analysis in production
    return gameData.gameType === 'non_conference' && 
           gameData.homeTeam.name.includes('State') && 
           !gameData.rivalry;
  }

  private hasWeatherRisk(weather: any): boolean {
    return weather.windSpeed > 20 || 
           weather.precipitation > 0.3 || 
           weather.temperature < 25;
  }

  private assessBowlMotivation(gameData: CollegeFootballGame): 'high' | 'medium' | 'low' {
    // Assess bowl game motivation based on bowl prestige
    const prestigeBowls = ['Rose Bowl', 'Sugar Bowl', 'Orange Bowl', 'Fiesta Bowl'];
    const bowlName = gameData.venue.name;
    
    if (prestigeBowls.some(bowl => bowlName.includes(bowl))) {
      return 'high';
    }
    
    return 'medium'; // Default
  }

  private async generateRecommendations(
    parlayData: CFBParlayData,
    individualProbabilities: any[],
    correlations: CFBGameCorrelation[],
    riskFactors: CFBRiskFactor[]
  ): Promise<CFBParlayRecommendation[]> {
    const recommendations: CFBParlayRecommendation[] = [];

    // Check for high-risk legs
    const highRiskFactors = riskFactors.filter(rf => rf.severity === 'high' || rf.severity === 'critical');
    
    if (highRiskFactors.length > 0) {
      recommendations.push({
        type: 'risk_reduction',
        title: 'High Risk Legs Detected',
        description: 'Consider removing or replacing high-risk selections',
        legModifications: highRiskFactors.map(rf => ({
          legIndex: rf.affectedLegs[0],
          currentSelection: parlayData.legs[rf.affectedLegs[0]].selection,
          recommendedSelection: 'Remove leg',
          reasoning: rf.description,
          impactOnOdds: -0.2,
          impactOnProbability: 0.15
        })),
        impact: {
          probabilityChange: 0.15,
          payoutChange: -0.2,
          riskChange: -0.3
        }
      });
    }

    // Check for negative EV legs
    const negativeEVLegs = individualProbabilities.filter(
      (prob, index) => {
        const impliedProb = this.oddsToImpliedProbability(parlayData.legs[index].odds);
        return prob.probability < impliedProb - 0.05; // 5% threshold
      }
    );

    if (negativeEVLegs.length > 0) {
      recommendations.push({
        type: 'value_enhancement',
        title: 'Negative Expected Value Detected',
        description: 'Some legs appear overpriced',
        impact: {
          probabilityChange: 0,
          payoutChange: 0,
          riskChange: 0
        }
      });
    }

    return recommendations;
  }

  private async generateAlternativeSelections(
    parlayData: CFBParlayData,
    individualProbabilities: any[],
    gamesData: (CollegeFootballGame | null)[]
  ): Promise<any[]> {
    const alternatives: any[] = [];

    // For each leg, suggest alternatives that might improve probability
    parlayData.legs.forEach((leg, index) => {
      const gameData = gamesData[index];
      if (!gameData) return;

      const currentProb = individualProbabilities[index].probability;
      
      // Suggest moving the line if probability is low
      if (currentProb < 0.4) {
        alternatives.push({
          originalLeg: index,
          alternativeSelection: this.suggestAlternativeLine(leg),
          alternativeOdds: leg.odds * 0.8, // Estimate
          probabilityImprovement: 0.15,
          payoutImpact: -0.2,
          reasoning: 'Move to more favorable line'
        });
      }
    });

    return alternatives;
  }

  private suggestAlternativeLine(leg: CFBParlayLeg): string {
    // Basic alternative line suggestion
    if (leg.betType === 'spread') {
      const currentLine = leg.currentLine;
      const newLine = currentLine + (currentLine > 0 ? 3 : -3);
      return `${leg.selection} ${newLine}`;
    }
    
    return leg.selection;
  }

  private performSituationalAnalysis(
    legs: CFBParlayLeg[],
    gamesData: (CollegeFootballGame | null)[]
  ): any {
    let rivalryGames = 0;
    let bowlGames = 0;
    let conferenceChampionships = 0;
    let playoffImplications = 0;
    const weatherConcerns: string[] = [];
    const injuryConcerns: string[] = [];
    const motivationFactors: string[] = [];

    legs.forEach((leg, index) => {
      const gameData = gamesData[index];
      if (!gameData) return;

      if (gameData.rivalry) rivalryGames++;
      if (gameData.gameType === 'bowl') bowlGames++;
      if (gameData.gameType === 'championship') conferenceChampionships++;
      
      if (leg.weekNumber >= 10) {
        playoffImplications++;
        motivationFactors.push('Late season playoff implications');
      }

      if (gameData.weather && this.hasWeatherRisk(gameData.weather)) {
        weatherConcerns.push(`${gameData.homeTeam.name} vs ${gameData.awayTeam.name}: Weather risk`);
      }
    });

    return {
      rivalryGames,
      bowlGames,
      conferenceChampionships,
      playoffImplications,
      weatherConcerns,
      injuryConcerns,
      motivationFactors
    };
  }

  private calculateConfidence(
    parlayData: CFBParlayData,
    correlations: CFBGameCorrelation[],
    riskFactors: CFBRiskFactor[]
  ): number {
    let confidence = 0.7; // Base confidence

    // Reduce confidence for high-risk factors
    const highRiskCount = riskFactors.filter(rf => rf.severity === 'high' || rf.severity === 'critical').length;
    confidence -= highRiskCount * 0.1;

    // Reduce confidence for many legs
    if (parlayData.legs.length > 4) {
      confidence -= (parlayData.legs.length - 4) * 0.05;
    }

    // Increase confidence for positive correlations
    const positiveCorrelations = correlations.filter(c => c.correlationType === 'positive').length;
    confidence += positiveCorrelations * 0.02;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private async getTeamStats(teamId: string, season: number): Promise<TeamSeasonStats | null> {
    const statsDoc = await this.db.collection('cfb_team_stats').doc(`${teamId}_${season}`).get();
    return statsDoc.exists ? statsDoc.data() as TeamSeasonStats : null;
  }

  private calculateRecentForm(stats: TeamSeasonStats): number {
    // Calculate recent form score based on last 4 games
    // This is a simplified calculation - in production would use actual game results
    const winPct = stats.wins / (stats.wins + stats.losses);
    return winPct * 2 - 1; // Convert to -1 to 1 scale
  }

  private calculateLegConfidence(
    leg: CFBParlayLeg,
    gameData: CollegeFootballGame | null,
    homeStats: TeamSeasonStats | null,
    awayStats: TeamSeasonStats | null
  ): number {
    let confidence = 0.7;

    if (!gameData || !homeStats || !awayStats) {
      return 0.3;
    }

    // Higher confidence for more games played (larger sample size)
    const avgGamesPlayed = (homeStats.wins + homeStats.losses + awayStats.wins + awayStats.losses) / 2;
    confidence += Math.min(avgGamesPlayed / 12, 0.2);

    // Lower confidence for rivalry games
    if (gameData.rivalry) {
      confidence -= 0.1;
    }

    // Lower confidence for bowl games
    if (gameData.gameType === 'bowl') {
      confidence -= 0.05;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  // Utility functions
  private oddsToImpliedProbability(odds: number): number {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }

  private probabilityToOdds(probability: number): number {
    if (probability >= 0.5) {
      return -(probability / (1 - probability)) * 100;
    } else {
      return ((1 - probability) / probability) * 100;
    }
  }

  private oddsToDecimal(odds: number): number {
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  }

  private async storeParlayAnalysis(parlayId: string, prediction: CFBParlayPrediction): Promise<void> {
    await this.db.collection('cfb_parlay_analysis').doc(parlayId).set({
      ...prediction,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Public methods for retrieving analysis
  async getParlayAnalysis(parlayId: string): Promise<CFBParlayPrediction | null> {
    const analysisDoc = await this.db.collection('cfb_parlay_analysis').doc(parlayId).get();
    return analysisDoc.exists ? analysisDoc.data() as CFBParlayPrediction : null;
  }

  async updateLiveParlayAnalysis(parlayId: string, liveData: any): Promise<void> {
    const currentAnalysis = await this.getParlayAnalysis(parlayId);
    if (!currentAnalysis) return;

    // Update probabilities based on live game events
    // This would involve complex live modeling
    
    await this.db.collection('cfb_parlay_analysis').doc(parlayId).update({
      lastUpdated: new Date().toISOString(),
      liveAdjustments: liveData
    });
  }
}