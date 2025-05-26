// =============================================================================
// NBA PARLAY ANALYTICS SERVICE
// Advanced Parlay Strategy Analysis for NBA Betting
// =============================================================================

import { collection, doc, setDoc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore as db } from '../../config/firebase';
import * as Sentry from '@sentry/react-native';
import { NBATeam, NBAPlayer, NBAGame } from './nbaDataSyncService';
import { NBATeamAnalytics } from './nbaAnalyticsService';
import { NBAGamePrediction } from './nbaMLPredictionService';

// NBA Parlay-specific interfaces
export interface NBAParlayOpportunity {
  id: string;
  type: 'same-game' | 'multi-game' | 'player-props' | 'mixed';
  confidence: number; // Overall confidence score (0-1)
  expectedValue: number; // Expected return value
  riskLevel: 'low' | 'medium' | 'high';
  
  // Parlay Components
  legs: ParlayLeg[];
  
  // Analytics
  analytics: {
    correlationScore: number; // How correlated the legs are
    independenceScore: number; // How independent the outcomes are
    varianceScore: number; // Expected variance in outcomes
    kellyBetSize: number; // Recommended bet size using Kelly criterion
  };
  
  // Success Metrics
  successMetrics: {
    historicalHitRate: number; // Historical success rate for similar parlays
    expectedHitRate: number; // Model-predicted success rate
    breakEvenOdds: number; // Odds needed to break even
    profitMargin: number; // Expected profit margin
  };
  
  // Risk Assessment
  riskAssessment: {
    worstCaseScenario: number; // Worst case loss
    bestCaseScenario: number; // Best case win
    volatility: number; // Expected volatility
    maxDrawdown: number; // Maximum expected losing streak
  };
  
  lastUpdated: Date;
}

export interface ParlayLeg {
  gameId: string;
  type: 'spread' | 'moneyline' | 'total' | 'player-prop';
  selection: string; // e.g., "Lakers -5.5", "Over 220.5", "LeBron 25+ points"
  odds: number; // Decimal odds
  probability: number; // Model probability (0-1)
  confidence: number; // Confidence in this leg (0-1)
  
  // Correlation factors
  correlations: {
    withOtherLegs: number[]; // Correlation with each other leg
    timeOfGame: number; // Impact of game timing
    rest: number; // Impact of team rest
    motivation: number; // Situational motivation factor
  };
  
  // Supporting data
  supportingFactors: string[];
  riskFactors: string[];
}

export interface NBAPlayerPropAnalysis {
  playerId: string;
  gameId: string;
  propType: 'points' | 'rebounds' | 'assists' | 'threes' | 'steals' | 'blocks';
  line: number;
  overProbability: number;
  underProbability: number;
  confidence: number;
  
  // Analysis factors
  factors: {
    recentForm: number; // Recent performance in this stat
    matchupRating: number; // How favorable the matchup is
    minutesProjection: number; // Expected minutes
    gameScript: number; // How game flow affects prop
    healthStatus: number; // Player health factor
    motivationLevel: number; // Player motivation
    restAdvantage: number; // Rest days advantage
    homeAwayFactor: number; // Home/away performance difference
  };
  
  // Historical context
  historical: {
    seasonAverage: number;
    last10Games: number[];
    vsOpponent: number; // Average vs this opponent
    inSimilarSituations: number; // In similar game contexts
  };
  
  recommendation: 'strong-over' | 'lean-over' | 'avoid' | 'lean-under' | 'strong-under';
  lastUpdated: Date;
}

export interface NBASameGameParlayBuilder {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  
  // Available legs with correlations
  availableLegs: {
    gameLines: {
      spread: { home: ParlayLeg; away: ParlayLeg };
      total: { over: ParlayLeg; under: ParlayLeg };
      moneyline: { home: ParlayLeg; away: ParlayLeg };
    };
    playerProps: NBAPlayerPropAnalysis[];
  };
  
  // Optimal combinations
  optimalCombinations: {
    conservative: NBAParlayOpportunity;
    balanced: NBAParlayOpportunity;
    aggressive: NBAParlayOpportunity;
  };
  
  // Correlation matrix
  correlationMatrix: number[][]; // Correlation between all possible legs
  
  lastUpdated: Date;
}

export interface NBAParlayStrategy {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: 'single-game' | 'daily' | 'weekly' | 'season-long';
  
  // Strategy parameters
  parameters: {
    maxLegs: number;
    minOdds: number;
    maxOdds: number;
    minConfidence: number;
    maxCorrelation: number;
    bankrollPercentage: number;
  };
  
  // Historical performance
  performance: {
    totalBets: number;
    wins: number;
    losses: number;
    roi: number; // Return on investment
    averageOdds: number;
    longestWinStreak: number;
    longestLoseStreak: number;
    profitLoss: number;
  };
  
  // Active opportunities
  currentOpportunities: NBAParlayOpportunity[];
  lastUpdated: Date;
}

export class NBAParlayAnalyticsService {
  private readonly analyticsVersion = '1.0';
  private readonly minConfidenceThreshold = 0.6;
  private readonly maxCorrelationThreshold = 0.7;

  constructor() {
    // Initialize parlay analytics service
  }

  /**
   * Initialize the NBA parlay analytics service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing NBA Parlay Analytics Service',
        category: 'nba.parlay.init',
        level: 'info',
      });

      console.log('NBA Parlay Analytics Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize NBA Parlay Analytics Service: ${error.message}`);
    }
  }

  /**
   * Analyze parlay opportunities for a given set of games
   */
  async analyzeParlayOpportunities(gameIds: string[]): Promise<NBAParlayOpportunity[]> {
    try {
      Sentry.addBreadcrumb({
        message: `Analyzing parlay opportunities for ${gameIds.length} NBA games`,
        category: 'nba.parlay.analyze',
        level: 'info',
      });

      const opportunities: NBAParlayOpportunity[] = [];

      // Generate same-game parlays
      for (const gameId of gameIds) {
        const sameGameParlays = await this.generateSameGameParlays(gameId);
        opportunities.push(...sameGameParlays);
      }

      // Generate multi-game parlays
      if (gameIds.length > 1) {
        const multiGameParlays = await this.generateMultiGameParlays(gameIds);
        opportunities.push(...multiGameParlays);
      }

      // Generate player prop parlays
      const playerPropParlays = await this.generatePlayerPropParlays(gameIds);
      opportunities.push(...playerPropParlays);

      // Sort by expected value and confidence
      const sortedOpportunities = opportunities
        .filter(opp => opp.confidence >= this.minConfidenceThreshold)
        .sort((a, b) => (b.expectedValue * b.confidence) - (a.expectedValue * a.confidence));

      // Store opportunities
      await this.storeOpportunities(sortedOpportunities);

      console.log(`Generated ${sortedOpportunities.length} NBA parlay opportunities`);
      return sortedOpportunities.slice(0, 20); // Return top 20

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to analyze parlay opportunities: ${error.message}`);
    }
  }

  /**
   * Generate same-game parlay opportunities
   */
  async generateSameGameParlays(gameId: string): Promise<NBAParlayOpportunity[]> {
    try {
      const sameGameBuilder = await this.buildSameGameParlayOptions(gameId);
      if (!sameGameBuilder) return [];

      const opportunities: NBAParlayOpportunity[] = [];

      // Add conservative combination
      if (sameGameBuilder.optimalCombinations.conservative.confidence >= this.minConfidenceThreshold) {
        opportunities.push(sameGameBuilder.optimalCombinations.conservative);
      }

      // Add balanced combination
      if (sameGameBuilder.optimalCombinations.balanced.confidence >= this.minConfidenceThreshold) {
        opportunities.push(sameGameBuilder.optimalCombinations.balanced);
      }

      // Add aggressive combination (with higher threshold)
      if (sameGameBuilder.optimalCombinations.aggressive.confidence >= 0.7) {
        opportunities.push(sameGameBuilder.optimalCombinations.aggressive);
      }

      return opportunities;

    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Build same-game parlay options for a specific game
   */
  async buildSameGameParlayOptions(gameId: string): Promise<NBASameGameParlayBuilder | null> {
    try {
      const game = await this.getGameData(gameId);
      const prediction = await this.getGamePrediction(gameId);
      
      if (!game || !prediction) return null;

      // Generate available legs
      const gameLines = await this.generateGameLines(game, prediction);
      const playerProps = await this.generatePlayerProps(gameId);

      // Build correlation matrix
      const allLegs = [
        gameLines.spread.home,
        gameLines.spread.away,
        gameLines.total.over,
        gameLines.total.under,
        gameLines.moneyline.home,
        gameLines.moneyline.away,
        ...playerProps.map(prop => this.convertPropToLeg(prop))
      ];

      const correlationMatrix = await this.buildCorrelationMatrix(allLegs);

      // Generate optimal combinations
      const optimalCombinations = {
        conservative: await this.buildConservativeParlay(allLegs, correlationMatrix),
        balanced: await this.buildBalancedParlay(allLegs, correlationMatrix),
        aggressive: await this.buildAggressiveParlay(allLegs, correlationMatrix),
      };

      const builder: NBASameGameParlayBuilder = {
        gameId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        availableLegs: {
          gameLines,
          playerProps,
        },
        optimalCombinations,
        correlationMatrix,
        lastUpdated: new Date(),
      };

      return builder;

    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Generate multi-game parlay opportunities
   */
  async generateMultiGameParlays(gameIds: string[]): Promise<NBAParlayOpportunity[]> {
    try {
      const opportunities: NBAParlayOpportunity[] = [];
      
      // Get predictions for all games
      const predictions = await Promise.all(
        gameIds.map(gameId => this.getGamePrediction(gameId))
      );

      const validPredictions = predictions.filter(p => p !== null) as NBAGamePrediction[];
      
      if (validPredictions.length < 2) return opportunities;

      // Generate 2-leg parlays
      for (let i = 0; i < validPredictions.length; i++) {
        for (let j = i + 1; j < validPredictions.length; j++) {
          const parlay = await this.buildTwoGameParlay(validPredictions[i], validPredictions[j]);
          if (parlay && parlay.confidence >= this.minConfidenceThreshold) {
            opportunities.push(parlay);
          }
        }
      }

      // Generate 3-leg parlays for high-confidence picks
      const highConfidencePicks = validPredictions.filter(p => p.confidence.overall >= 0.8);
      if (highConfidencePicks.length >= 3) {
        for (let i = 0; i < highConfidencePicks.length; i++) {
          for (let j = i + 1; j < highConfidencePicks.length; j++) {
            for (let k = j + 1; k < highConfidencePicks.length; k++) {
              const parlay = await this.buildThreeGameParlay(
                highConfidencePicks[i],
                highConfidencePicks[j],
                highConfidencePicks[k]
              );
              if (parlay && parlay.confidence >= 0.7) {
                opportunities.push(parlay);
              }
            }
          }
        }
      }

      return opportunities;

    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Generate player prop parlay opportunities
   */
  async generatePlayerPropParlays(gameIds: string[]): Promise<NBAParlayOpportunity[]> {
    try {
      const opportunities: NBAParlayOpportunity[] = [];
      
      // Get all player props for the games
      const allPlayerProps: NBAPlayerPropAnalysis[] = [];
      for (const gameId of gameIds) {
        const gameProps = await this.generatePlayerProps(gameId);
        allPlayerProps.push(...gameProps);
      }

      // Filter high-confidence props
      const highConfidenceProps = allPlayerProps.filter(prop => 
        prop.confidence >= 0.75 && 
        (prop.recommendation === 'strong-over' || prop.recommendation === 'strong-under')
      );

      if (highConfidenceProps.length < 2) return opportunities;

      // Generate prop parlays with low correlation
      const propCombinations = this.generatePropCombinations(highConfidenceProps, 4); // Max 4 legs

      for (const combination of propCombinations) {
        const correlationScore = await this.calculatePropCorrelation(combination);
        
        if (correlationScore <= this.maxCorrelationThreshold) {
          const parlay = await this.buildPlayerPropParlay(combination);
          if (parlay && parlay.confidence >= this.minConfidenceThreshold) {
            opportunities.push(parlay);
          }
        }
      }

      return opportunities;

    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Analyze player prop betting opportunities
   */
  async analyzePlayerProps(gameId: string): Promise<NBAPlayerPropAnalysis[]> {
    try {
      const game = await this.getGameData(gameId);
      if (!game) return [];

      const props: NBAPlayerPropAnalysis[] = [];

      // Get key players from both teams
      const homeTeamPlayers = await this.getKeyPlayers(game.homeTeam);
      const awayTeamPlayers = await this.getKeyPlayers(game.awayTeam);
      const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];

      // Analyze props for each player
      for (const player of allPlayers) {
        const playerProps = await this.analyzePlayerPropTypes(player.id, gameId);
        props.push(...playerProps);
      }

      // Filter and sort by confidence
      return props
        .filter(prop => prop.confidence >= 0.6)
        .sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Helper methods for parlay construction
   */

  private async generateGameLines(game: NBAGame, prediction: NBAGamePrediction): Promise<any> {
    const homeTeamName = await this.getTeamName(game.homeTeam);
    const awayTeamName = await this.getTeamName(game.awayTeam);

    return {
      spread: {
        home: {
          gameId: game.id,
          type: 'spread' as const,
          selection: `${homeTeamName} ${prediction.spreadPrediction > 0 ? '-' : '+'}${Math.abs(prediction.spreadPrediction).toFixed(1)}`,
          odds: this.convertProbabilityToOdds(prediction.winProbability),
          probability: prediction.winProbability,
          confidence: prediction.confidence.spread,
          correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
          supportingFactors: ['Home court advantage', 'Recent form'],
          riskFactors: ['Injury concerns'],
        },
        away: {
          gameId: game.id,
          type: 'spread' as const,
          selection: `${awayTeamName} ${prediction.spreadPrediction < 0 ? '-' : '+'}${Math.abs(prediction.spreadPrediction).toFixed(1)}`,
          odds: this.convertProbabilityToOdds(1 - prediction.winProbability),
          probability: 1 - prediction.winProbability,
          confidence: prediction.confidence.spread,
          correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
          supportingFactors: ['Road performance', 'Matchup advantage'],
          riskFactors: ['Travel fatigue'],
        },
      },
      total: {
        over: {
          gameId: game.id,
          type: 'total' as const,
          selection: `Over ${prediction.totalPointsPrediction.toFixed(1)}`,
          odds: 1.91, // -110 in decimal
          probability: 0.52, // Slightly favor over
          confidence: prediction.confidence.total,
          correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
          supportingFactors: ['Fast pace', 'High-scoring teams'],
          riskFactors: ['Strong defenses'],
        },
        under: {
          gameId: game.id,
          type: 'total' as const,
          selection: `Under ${prediction.totalPointsPrediction.toFixed(1)}`,
          odds: 1.91, // -110 in decimal
          probability: 0.48,
          confidence: prediction.confidence.total,
          correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
          supportingFactors: ['Strong defenses', 'Slow pace'],
          riskFactors: ['High-scoring potential'],
        },
      },
      moneyline: {
        home: {
          gameId: game.id,
          type: 'moneyline' as const,
          selection: `${homeTeamName} ML`,
          odds: this.convertProbabilityToOdds(prediction.winProbability),
          probability: prediction.winProbability,
          confidence: prediction.confidence.winProbability,
          correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
          supportingFactors: ['Overall team strength'],
          riskFactors: ['Upset potential'],
        },
        away: {
          gameId: game.id,
          type: 'moneyline' as const,
          selection: `${awayTeamName} ML`,
          odds: this.convertProbabilityToOdds(1 - prediction.winProbability),
          probability: 1 - prediction.winProbability,
          confidence: prediction.confidence.winProbability,
          correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
          supportingFactors: ['Value opportunity'],
          riskFactors: ['Road disadvantage'],
        },
      },
    };
  }

  private async generatePlayerProps(gameId: string): Promise<NBAPlayerPropAnalysis[]> {
    // Placeholder - would implement actual player prop analysis
    return [];
  }

  private convertPropToLeg(prop: NBAPlayerPropAnalysis): ParlayLeg {
    return {
      gameId: prop.gameId,
      type: 'player-prop',
      selection: `${prop.playerId} ${prop.propType} ${prop.recommendation.includes('over') ? 'Over' : 'Under'} ${prop.line}`,
      odds: this.convertProbabilityToOdds(prop.recommendation.includes('over') ? prop.overProbability : prop.underProbability),
      probability: prop.recommendation.includes('over') ? prop.overProbability : prop.underProbability,
      confidence: prop.confidence,
      correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
      supportingFactors: [],
      riskFactors: [],
    };
  }

  private async buildCorrelationMatrix(legs: ParlayLeg[]): Promise<number[][]> {
    const matrix: number[][] = [];
    
    for (let i = 0; i < legs.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < legs.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0; // Perfect correlation with self
        } else {
          matrix[i][j] = await this.calculateLegCorrelation(legs[i], legs[j]);
        }
      }
    }
    
    return matrix;
  }

  private async calculateLegCorrelation(leg1: ParlayLeg, leg2: ParlayLeg): Promise<number> {
    // Same game correlations
    if (leg1.gameId === leg2.gameId) {
      // High correlation between spread and moneyline
      if ((leg1.type === 'spread' && leg2.type === 'moneyline') ||
          (leg1.type === 'moneyline' && leg2.type === 'spread')) {
        return 0.85;
      }
      
      // Medium correlation between team performance and totals
      if ((leg1.type === 'spread' && leg2.type === 'total') ||
          (leg1.type === 'total' && leg2.type === 'spread')) {
        return 0.4;
      }
      
      // Low correlation between different player props
      if (leg1.type === 'player-prop' && leg2.type === 'player-prop') {
        return 0.2;
      }
    }
    
    // Different games - generally low correlation
    return 0.1;
  }

  private async buildConservativeParlay(legs: ParlayLeg[], correlationMatrix: number[][]): Promise<NBAParlayOpportunity> {
    // Select 2-3 high-confidence, low-correlation legs
    const highConfidenceLegs = legs
      .filter(leg => leg.confidence >= 0.8)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    const selectedLegs = this.selectUncorrelatedLegs(highConfidenceLegs, correlationMatrix, 2);
    
    return this.buildParlayFromLegs(selectedLegs, 'low');
  }

  private async buildBalancedParlay(legs: ParlayLeg[], correlationMatrix: number[][]): Promise<NBAParlayOpportunity> {
    // Select 3-4 good-confidence legs with moderate correlation tolerance
    const goodConfidenceLegs = legs
      .filter(leg => leg.confidence >= 0.7)
      .sort((a, b) => (b.confidence * b.probability) - (a.confidence * a.probability))
      .slice(0, 5);

    const selectedLegs = this.selectUncorrelatedLegs(goodConfidenceLegs, correlationMatrix, 3);
    
    return this.buildParlayFromLegs(selectedLegs, 'medium');
  }

  private async buildAggressiveParlay(legs: ParlayLeg[], correlationMatrix: number[][]): Promise<NBAParlayOpportunity> {
    // Select 4-5 legs prioritizing value over correlation
    const valueLegs = legs
      .filter(leg => leg.confidence >= 0.6)
      .sort((a, b) => this.calculateLegValue(b) - this.calculateLegValue(a))
      .slice(0, 6);

    const selectedLegs = this.selectUncorrelatedLegs(valueLegs, correlationMatrix, 4);
    
    return this.buildParlayFromLegs(selectedLegs, 'high');
  }

  private selectUncorrelatedLegs(legs: ParlayLeg[], correlationMatrix: number[][], targetCount: number): ParlayLeg[] {
    if (legs.length <= targetCount) return legs;

    const selected: ParlayLeg[] = [legs[0]]; // Start with highest confidence/value
    
    for (let i = 1; i < legs.length && selected.length < targetCount; i++) {
      const candidate = legs[i];
      let maxCorrelation = 0;
      
      // Check correlation with already selected legs
      for (const selectedLeg of selected) {
        const legIndex1 = legs.findIndex(l => l === candidate);
        const legIndex2 = legs.findIndex(l => l === selectedLeg);
        
        if (legIndex1 >= 0 && legIndex2 >= 0 && correlationMatrix[legIndex1] && correlationMatrix[legIndex1][legIndex2]) {
          maxCorrelation = Math.max(maxCorrelation, correlationMatrix[legIndex1][legIndex2]);
        }
      }
      
      // Add if correlation is acceptable
      if (maxCorrelation <= this.maxCorrelationThreshold) {
        selected.push(candidate);
      }
    }
    
    return selected;
  }

  private buildParlayFromLegs(legs: ParlayLeg[], riskLevel: 'low' | 'medium' | 'high'): NBAParlayOpportunity {
    const combinedOdds = legs.reduce((total, leg) => total * leg.odds, 1);
    const combinedProbability = legs.reduce((total, leg) => total * leg.probability, 1);
    const averageConfidence = legs.reduce((total, leg) => total + leg.confidence, 0) / legs.length;
    
    const expectedValue = (combinedOdds * combinedProbability) - 1;
    const correlationScore = this.calculateCombinedCorrelation(legs);
    
    return {
      id: `parlay_${Date.now()}_${legs.length}leg`,
      type: legs.length === 1 ? 'same-game' : legs.every(l => l.gameId === legs[0].gameId) ? 'same-game' : 'multi-game',
      confidence: averageConfidence * (1 - correlationScore * 0.3), // Reduce confidence for high correlation
      expectedValue,
      riskLevel,
      legs,
      analytics: {
        correlationScore,
        independenceScore: 1 - correlationScore,
        varianceScore: this.calculateVariance(legs),
        kellyBetSize: this.calculateKellyBetSize(expectedValue, combinedProbability),
      },
      successMetrics: {
        historicalHitRate: combinedProbability * 0.95, // Slightly lower than model prediction
        expectedHitRate: combinedProbability,
        breakEvenOdds: 1 / combinedProbability,
        profitMargin: expectedValue,
      },
      riskAssessment: {
        worstCaseScenario: -1, // Lose entire bet
        bestCaseScenario: combinedOdds - 1,
        volatility: this.calculateVolatility(legs),
        maxDrawdown: this.estimateMaxDrawdown(combinedProbability),
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Utility methods
   */

  private convertProbabilityToOdds(probability: number): number {
    return 1 / probability;
  }

  private calculateLegValue(leg: ParlayLeg): number {
    const impliedProbability = 1 / leg.odds;
    return (leg.probability - impliedProbability) * leg.confidence;
  }

  private calculateCombinedCorrelation(legs: ParlayLeg[]): number {
    if (legs.length <= 1) return 0;
    
    // Simplified correlation calculation
    let totalCorrelation = 0;
    let pairs = 0;
    
    for (let i = 0; i < legs.length; i++) {
      for (let j = i + 1; j < legs.length; j++) {
        // Same game has higher correlation
        if (legs[i].gameId === legs[j].gameId) {
          totalCorrelation += 0.5;
        } else {
          totalCorrelation += 0.1;
        }
        pairs++;
      }
    }
    
    return pairs > 0 ? totalCorrelation / pairs : 0;
  }

  private calculateVariance(legs: ParlayLeg[]): number {
    const probabilities = legs.map(leg => leg.probability);
    const mean = probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;
    const variance = probabilities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probabilities.length;
    return variance;
  }

  private calculateKellyBetSize(expectedValue: number, probability: number): number {
    if (expectedValue <= 0) return 0;
    return Math.min(0.05, expectedValue / (1 / probability - 1)); // Cap at 5% of bankroll
  }

  private calculateVolatility(legs: ParlayLeg[]): number {
    return Math.sqrt(this.calculateVariance(legs));
  }

  private estimateMaxDrawdown(probability: number): number {
    // Estimate maximum losing streak based on probability
    return Math.ceil(-Math.log(0.01) / Math.log(1 - probability));
  }

  private generatePropCombinations(props: NBAPlayerPropAnalysis[], maxLegs: number): NBAPlayerPropAnalysis[][] {
    const combinations: NBAPlayerPropAnalysis[][] = [];
    
    // Generate all possible combinations up to maxLegs
    for (let i = 2; i <= Math.min(maxLegs, props.length); i++) {
      const combos = this.getCombinations(props, i);
      combinations.push(...combos);
    }
    
    return combinations;
  }

  private getCombinations<T>(array: T[], size: number): T[][] {
    const combinations: T[][] = [];
    
    function backtrack(start: number, current: T[]) {
      if (current.length === size) {
        combinations.push([...current]);
        return;
      }
      
      for (let i = start; i < array.length; i++) {
        current.push(array[i]);
        backtrack(i + 1, current);
        current.pop();
      }
    }
    
    backtrack(0, []);
    return combinations;
  }

  private async calculatePropCorrelation(props: NBAPlayerPropAnalysis[]): Promise<number> {
    // Calculate correlation between player props
    let correlation = 0;
    
    for (let i = 0; i < props.length; i++) {
      for (let j = i + 1; j < props.length; j++) {
        const prop1 = props[i];
        const prop2 = props[j];
        
        // Same game = higher correlation
        if (prop1.gameId === prop2.gameId) {
          correlation += 0.3;
        }
        
        // Same player = very high correlation
        if (prop1.playerId === prop2.playerId) {
          correlation += 0.8;
        }
        
        // Related stats (points/assists, rebounds/blocks) = medium correlation
        if (this.areRelatedStats(prop1.propType, prop2.propType)) {
          correlation += 0.4;
        }
      }
    }
    
    const pairs = (props.length * (props.length - 1)) / 2;
    return pairs > 0 ? correlation / pairs : 0;
  }

  private areRelatedStats(stat1: string, stat2: string): boolean {
    const relatedGroups = [
      ['points', 'assists'],
      ['rebounds', 'blocks'],
      ['steals', 'assists'],
    ];
    
    return relatedGroups.some(group => 
      group.includes(stat1) && group.includes(stat2)
    );
  }

  /**
   * Data retrieval and helper methods
   */

  private async getGameData(gameId: string): Promise<NBAGame | null> {
    try {
      const gameDoc = await getDoc(doc(db, 'nba_games', gameId));
      return gameDoc.exists() ? gameDoc.data() as NBAGame : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getGamePrediction(gameId: string): Promise<NBAGamePrediction | null> {
    try {
      const predictionDoc = await getDoc(doc(db, 'nba_predictions', gameId));
      return predictionDoc.exists() ? predictionDoc.data() as NBAGamePrediction : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getTeamName(teamId: string): Promise<string> {
    try {
      const teamDoc = await getDoc(doc(db, 'nba_teams', teamId));
      return teamDoc.exists() ? teamDoc.data()?.name || 'Unknown' : 'Unknown';
    } catch (error) {
      Sentry.captureException(error);
      return 'Unknown';
    }
  }

  private async getKeyPlayers(teamId: string): Promise<NBAPlayer[]> {
    try {
      const playersQuery = query(
        collection(db, 'nba_players'),
        where('teamId', '==', teamId),
        where('isStarter', '==', true),
        limit(8)
      );
      
      const playersSnapshot = await getDocs(playersQuery);
      return playersSnapshot.docs.map(doc => doc.data() as NBAPlayer);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async analyzePlayerPropTypes(playerId: string, gameId: string): Promise<NBAPlayerPropAnalysis[]> {
    // Placeholder for actual player prop analysis
    return [];
  }

  private async buildTwoGameParlay(prediction1: NBAGamePrediction, prediction2: NBAGamePrediction): Promise<NBAParlayOpportunity | null> {
    // Build a simple 2-game parlay from the best legs of each game
    const leg1 = this.getBestLegFromPrediction(prediction1);
    const leg2 = this.getBestLegFromPrediction(prediction2);
    
    if (!leg1 || !leg2) return null;
    
    return this.buildParlayFromLegs([leg1, leg2], 'medium');
  }

  private async buildThreeGameParlay(prediction1: NBAGamePrediction, prediction2: NBAGamePrediction, prediction3: NBAGamePrediction): Promise<NBAParlayOpportunity | null> {
    const leg1 = this.getBestLegFromPrediction(prediction1);
    const leg2 = this.getBestLegFromPrediction(prediction2);
    const leg3 = this.getBestLegFromPrediction(prediction3);
    
    if (!leg1 || !leg2 || !leg3) return null;
    
    return this.buildParlayFromLegs([leg1, leg2, leg3], 'high');
  }

  private getBestLegFromPrediction(prediction: NBAGamePrediction): ParlayLeg | null {
    // Select the highest confidence bet from the prediction
    if (prediction.confidence.winProbability >= 0.8) {
      return {
        gameId: prediction.gameId,
        type: 'moneyline',
        selection: `${prediction.homeTeam} ML`,
        odds: this.convertProbabilityToOdds(prediction.winProbability),
        probability: prediction.winProbability,
        confidence: prediction.confidence.winProbability,
        correlations: { withOtherLegs: [], timeOfGame: 1.0, rest: 1.0, motivation: 1.0 },
        supportingFactors: ['High confidence prediction'],
        riskFactors: [],
      };
    }
    
    return null;
  }

  private async buildPlayerPropParlay(props: NBAPlayerPropAnalysis[]): Promise<NBAParlayOpportunity | null> {
    const legs = props.map(prop => this.convertPropToLeg(prop));
    return this.buildParlayFromLegs(legs, 'medium');
  }

  private async storeOpportunities(opportunities: NBAParlayOpportunity[]): Promise<void> {
    try {
      const batch = opportunities.slice(0, 10); // Store top 10
      
      for (let i = 0; i < batch.length; i++) {
        const opportunityRef = doc(db, 'nba_parlay_opportunities', batch[i].id);
        await setDoc(opportunityRef, batch[i]);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  /**
   * Public utility methods
   */

  async getParlayOpportunities(limit: number = 10): Promise<NBAParlayOpportunity[]> {
    try {
      const opportunitiesQuery = query(
        collection(db, 'nba_parlay_opportunities'),
        orderBy('expectedValue', 'desc'),
        limit(limit)
      );

      const opportunitiesSnapshot = await getDocs(opportunitiesQuery);
      return opportunitiesSnapshot.docs.map(doc => doc.data() as NBAParlayOpportunity);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  async getParlayById(parlayId: string): Promise<NBAParlayOpportunity | null> {
    try {
      const parlayDoc = await getDoc(doc(db, 'nba_parlay_opportunities', parlayId));
      return parlayDoc.exists() ? parlayDoc.data() as NBAParlayOpportunity : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async getTopPlayerProps(gameId: string, limit: number = 10): Promise<NBAPlayerPropAnalysis[]> {
    try {
      return await this.analyzePlayerProps(gameId);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }
}

export const nbaParlayAnalyticsService = new NBAParlayAnalyticsService();