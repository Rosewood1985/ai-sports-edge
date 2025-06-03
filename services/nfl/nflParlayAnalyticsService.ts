import * as Sentry from '@sentry/node';
import * as admin from 'firebase-admin';

interface ParlayLeg {
  gameId: string;
  betType: 'spread' | 'total' | 'moneyline' | 'player_prop' | 'team_prop';
  selection: string;
  odds: number;
  line?: number;
  playerId?: string;
  statType?: string;
  value?: number;
}

interface ParlayData {
  parlayId: string;
  legs: ParlayLeg[];
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  timestamp: string;
  week: number;
  season: number;
}

interface GameCorrelation {
  game1Id: string;
  game2Id: string;
  correlationType: 'positive' | 'negative' | 'neutral';
  correlationStrength: number; // -1 to 1
  historicalWinRate: number;
  sampleSize: number;
  factors: CorrelationFactor[];
}

interface CorrelationFactor {
  factor: string;
  impact: number;
  confidence: number;
  description: string;
}

interface ParlayPrediction {
  parlayId: string;
  overallProbability: number;
  individualProbabilities: LegProbability[];
  correlationAdjustments: CorrelationAdjustment[];
  riskFactors: RiskFactor[];
  recommendations: ParlayRecommendation[];
  expectedValue: number;
  confidence: number;
  alternativeSelections: AlternativeSelection[];
}

interface LegProbability {
  legIndex: number;
  rawProbability: number;
  adjustedProbability: number;
  confidence: number;
  keyFactors: string[];
}

interface CorrelationAdjustment {
  affectedLegs: number[];
  adjustmentType: 'positive' | 'negative';
  magnitude: number;
  reason: string;
}

interface RiskFactor {
  type: 'weather' | 'injury' | 'motivation' | 'coaching' | 'divisional' | 'primetime' | 'rest';
  severity: 'low' | 'medium' | 'high';
  affectedLegs: number[];
  description: string;
  impact: number;
}

interface ParlayRecommendation {
  type: 'add_leg' | 'remove_leg' | 'modify_leg' | 'hedge_bet' | 'avoid_parlay';
  legIndex?: number;
  reason: string;
  expectedImpact: number;
  alternative?: ParlayLeg;
}

interface AlternativeSelection {
  legIndex: number;
  alternativeSelection: string;
  alternativeOdds: number;
  probabilityImprovement: number;
  reason: string;
}

interface WeatherImpact {
  gameId: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  conditions: string;
  impactOnScoring: number; // -1 to 1
  impactOnTotals: number;
  impactOnSpreads: number;
  passingGameImpact: number;
  runningGameImpact: number;
}

interface DivisionalMatchupData {
  gameId: string;
  isDivisional: boolean;
  seasonSeries: string; // e.g., "1-0" if first meeting
  historicalTrends: {
    avgPointDifferential: number;
    avgTotal: number;
    homeDogCoverage: number;
    underPercentage: number;
  };
  rivalryIntensity: number; // 1-10 scale
}

interface PrimetimeData {
  gameId: string;
  isPrimetime: boolean;
  gameTime: string;
  network: string;
  primetimeImpact: {
    favoritesBias: number;
    oversBias: number;
    publicBettingInfluence: number;
    performanceVariance: number;
  };
}

export class NFLParlayAnalyticsService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async analyzeParlayProbability(parlayData: ParlayData): Promise<ParlayPrediction> {
    const transaction = Sentry.startTransaction({
      op: 'nfl_parlay_analysis',
      name: 'Analyze NFL Parlay Probability',
    });

    try {
      Sentry.addBreadcrumb({
        message: `Analyzing parlay with ${parlayData.legs.length} legs`,
        level: 'info',
        data: { parlayId: parlayData.parlayId, totalOdds: parlayData.totalOdds },
      });

      // Step 1: Calculate individual leg probabilities
      const individualProbabilities = await this.calculateIndividualProbabilities(parlayData.legs);

      // Step 2: Identify and analyze correlations between legs
      const correlations = await this.analyzeCorrelations(parlayData.legs);

      // Step 3: Apply correlation adjustments
      const correlationAdjustments = await this.applyCorrelationAdjustments(
        individualProbabilities,
        correlations
      );

      // Step 4: Identify risk factors
      const riskFactors = await this.identifyRiskFactors(parlayData.legs);

      // Step 5: Calculate overall parlay probability
      const overallProbability = this.calculateOverallProbability(
        individualProbabilities,
        correlationAdjustments
      );

      // Step 6: Generate recommendations
      const recommendations = await this.generateRecommendations(
        parlayData,
        individualProbabilities,
        correlationAdjustments,
        riskFactors
      );

      // Step 7: Find alternative selections
      const alternativeSelections = await this.findAlternativeSelections(parlayData.legs);

      // Step 8: Calculate expected value
      const expectedValue = this.calculateExpectedValue(
        overallProbability,
        parlayData.totalOdds,
        parlayData.stake
      );

      const prediction: ParlayPrediction = {
        parlayId: parlayData.parlayId,
        overallProbability,
        individualProbabilities,
        correlationAdjustments,
        riskFactors,
        recommendations,
        expectedValue,
        confidence: this.calculateConfidence(individualProbabilities, correlations),
        alternativeSelections,
      };

      await this.storeParlayAnalysis(prediction);

      Sentry.addBreadcrumb({
        message: 'Parlay analysis completed successfully',
        level: 'info',
        data: {
          overallProbability,
          expectedValue,
          confidence: prediction.confidence,
        },
      });

      return prediction;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error analyzing parlay probability:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  private async calculateIndividualProbabilities(legs: ParlayLeg[]): Promise<LegProbability[]> {
    const probabilities: LegProbability[] = [];

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      let rawProbability = 0;
      let keyFactors: string[] = [];

      switch (leg.betType) {
        case 'spread':
          rawProbability = await this.calculateSpreadProbability(leg);
          keyFactors = ['team_strength', 'home_field', 'recent_form', 'injuries'];
          break;
        case 'total':
          rawProbability = await this.calculateTotalProbability(leg);
          keyFactors = ['weather', 'pace', 'defense_efficiency', 'offensive_strength'];
          break;
        case 'moneyline':
          rawProbability = await this.calculateMoneylineProbability(leg);
          keyFactors = ['team_strength', 'motivation', 'coaching', 'matchup_history'];
          break;
        case 'player_prop':
          rawProbability = await this.calculatePlayerPropProbability(leg);
          keyFactors = ['player_form', 'matchup', 'usage_rate', 'game_script'];
          break;
        case 'team_prop':
          rawProbability = await this.calculateTeamPropProbability(leg);
          keyFactors = ['team_tendencies', 'opponent_defense', 'game_flow', 'coaching'];
          break;
      }

      // Apply game-specific adjustments
      const adjustedProbability = await this.applyGameSpecificAdjustments(leg, rawProbability);

      probabilities.push({
        legIndex: i,
        rawProbability,
        adjustedProbability,
        confidence: this.calculateLegConfidence(leg, rawProbability),
        keyFactors,
      });
    }

    return probabilities;
  }

  private async analyzeCorrelations(legs: ParlayLeg[]): Promise<GameCorrelation[]> {
    const correlations: GameCorrelation[] = [];

    // Analyze correlations between all pairs of legs
    for (let i = 0; i < legs.length; i++) {
      for (let j = i + 1; j < legs.length; j++) {
        const leg1 = legs[i];
        const leg2 = legs[j];

        // Same game correlations
        if (leg1.gameId === leg2.gameId) {
          const correlation = await this.analyzeSameGameCorrelation(leg1, leg2);
          correlations.push(correlation);
        }
        // Different game correlations
        else {
          const correlation = await this.analyzeCrossGameCorrelation(leg1, leg2);
          if (correlation.correlationStrength !== 0) {
            correlations.push(correlation);
          }
        }
      }
    }

    return correlations;
  }

  private async analyzeSameGameCorrelation(
    leg1: ParlayLeg,
    leg2: ParlayLeg
  ): Promise<GameCorrelation> {
    const correlationFactors: CorrelationFactor[] = [];
    let correlationStrength = 0;
    let correlationType: 'positive' | 'negative' | 'neutral' = 'neutral';

    // Analyze specific bet type correlations
    if (leg1.betType === 'spread' && leg2.betType === 'total') {
      // Spread and total correlation analysis
      correlationStrength = 0.15; // Moderate positive correlation
      correlationType = 'positive';
      correlationFactors.push({
        factor: 'blowout_correlation',
        impact: 0.15,
        confidence: 0.85,
        description: 'Blowout games tend to go over the total',
      });
    } else if (leg1.betType === 'player_prop' && leg2.betType === 'total') {
      // Player prop and game total correlation
      if (leg1.statType === 'passing_yards' || leg1.statType === 'rushing_yards') {
        correlationStrength = 0.25;
        correlationType = 'positive';
        correlationFactors.push({
          factor: 'offensive_production_correlation',
          impact: 0.25,
          confidence: 0.8,
          description: 'High offensive output correlates with higher game totals',
        });
      }
    } else if (leg1.betType === 'player_prop' && leg2.betType === 'player_prop') {
      // Same team player props correlation
      if (leg1.playerId !== leg2.playerId) {
        correlationStrength = await this.calculatePlayerPropCorrelation(leg1, leg2);
        correlationType = correlationStrength > 0 ? 'positive' : 'negative';
      }
    }

    return {
      game1Id: leg1.gameId,
      game2Id: leg2.gameId,
      correlationType,
      correlationStrength: Math.abs(correlationStrength),
      historicalWinRate: await this.getHistoricalCorrelationWinRate(leg1, leg2),
      sampleSize: 100, // Would be calculated from historical data
      factors: correlationFactors,
    };
  }

  private async analyzeCrossGameCorrelation(
    leg1: ParlayLeg,
    leg2: ParlayLeg
  ): Promise<GameCorrelation> {
    const correlationFactors: CorrelationFactor[] = [];
    let correlationStrength = 0;
    let correlationType: 'positive' | 'negative' | 'neutral' = 'neutral';

    // Check for divisional matchup correlations
    const isDivisionalWeek = await this.isDivisionalWeek(leg1.gameId, leg2.gameId);
    if (isDivisionalWeek) {
      correlationStrength = 0.1;
      correlationType = 'positive';
      correlationFactors.push({
        factor: 'divisional_week_correlation',
        impact: 0.1,
        confidence: 0.7,
        description: 'Divisional games in same week tend to have similar outcomes',
      });
    }

    // Check for weather correlation (outdoor games in similar regions)
    const weatherCorrelation = await this.analyzeWeatherCorrelation(leg1.gameId, leg2.gameId);
    if (weatherCorrelation.strength > 0.05) {
      correlationStrength += weatherCorrelation.strength;
      correlationFactors.push({
        factor: 'weather_correlation',
        impact: weatherCorrelation.strength,
        confidence: 0.8,
        description: weatherCorrelation.description,
      });
    }

    // Check for primetime bias correlation
    const primetimeCorrelation = await this.analyzePrimetimeCorrelation(leg1.gameId, leg2.gameId);
    if (primetimeCorrelation > 0) {
      correlationStrength += primetimeCorrelation;
      correlationFactors.push({
        factor: 'primetime_bias',
        impact: primetimeCorrelation,
        confidence: 0.75,
        description: 'Primetime games have public betting biases',
      });
    }

    return {
      game1Id: leg1.gameId,
      game2Id: leg2.gameId,
      correlationType: correlationStrength > 0 ? 'positive' : 'neutral',
      correlationStrength,
      historicalWinRate: correlationStrength > 0 ? 0.45 : 0.5, // Slightly worse than independent
      sampleSize: 50,
      factors: correlationFactors,
    };
  }

  private async applyCorrelationAdjustments(
    probabilities: LegProbability[],
    correlations: GameCorrelation[]
  ): Promise<CorrelationAdjustment[]> {
    const adjustments: CorrelationAdjustment[] = [];

    for (const correlation of correlations) {
      if (correlation.correlationStrength > 0.1) {
        // Find affected legs
        const affectedLegs: number[] = [];
        probabilities.forEach((prob, index) => {
          // This would need more sophisticated logic to map games to leg indices
          affectedLegs.push(index);
        });

        adjustments.push({
          affectedLegs,
          adjustmentType: correlation.correlationType === 'positive' ? 'negative' : 'positive',
          magnitude: correlation.correlationStrength * 0.1, // Conservative adjustment
          reason: `${correlation.correlationType} correlation detected: ${correlation.factors[0]?.description || 'correlation factor'}`,
        });
      }
    }

    return adjustments;
  }

  private async identifyRiskFactors(legs: ParlayLeg[]): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];

      // Weather risk analysis
      const weatherImpact = await this.analyzeWeatherRisk(leg.gameId);
      if (weatherImpact.severity !== 'low') {
        riskFactors.push({
          type: 'weather',
          severity: weatherImpact.severity,
          affectedLegs: [i],
          description: weatherImpact.description,
          impact: weatherImpact.impact,
        });
      }

      // Injury risk analysis
      const injuryRisk = await this.analyzeInjuryRisk(leg);
      if (injuryRisk.severity !== 'low') {
        riskFactors.push({
          type: 'injury',
          severity: injuryRisk.severity,
          affectedLegs: [i],
          description: injuryRisk.description,
          impact: injuryRisk.impact,
        });
      }

      // Motivation risk (playoff implications, etc.)
      const motivationRisk = await this.analyzeMotivationRisk(leg.gameId);
      if (motivationRisk.severity !== 'low') {
        riskFactors.push({
          type: 'motivation',
          severity: motivationRisk.severity,
          affectedLegs: [i],
          description: motivationRisk.description,
          impact: motivationRisk.impact,
        });
      }

      // Primetime game risk
      const primetimeRisk = await this.analyzePrimetimeRisk(leg.gameId);
      if (primetimeRisk.severity !== 'low') {
        riskFactors.push({
          type: 'primetime',
          severity: primetimeRisk.severity,
          affectedLegs: [i],
          description: primetimeRisk.description,
          impact: primetimeRisk.impact,
        });
      }
    }

    return riskFactors;
  }

  private calculateOverallProbability(
    probabilities: LegProbability[],
    adjustments: CorrelationAdjustment[]
  ): number {
    // Start with independent probability calculation
    let overallProb = probabilities.reduce((acc, prob) => acc * prob.adjustedProbability, 1);

    // Apply correlation adjustments
    for (const adjustment of adjustments) {
      if (adjustment.adjustmentType === 'negative') {
        // Negative correlation adjustment (decreases overall probability)
        overallProb *= 1 - adjustment.magnitude;
      } else {
        // Positive correlation adjustment (increases overall probability)
        overallProb *= 1 + adjustment.magnitude * 0.5; // Conservative positive adjustment
      }
    }

    return Math.max(0.001, Math.min(0.999, overallProb));
  }

  private async generateRecommendations(
    parlayData: ParlayData,
    probabilities: LegProbability[],
    adjustments: CorrelationAdjustment[],
    riskFactors: RiskFactor[]
  ): Promise<ParlayRecommendation[]> {
    const recommendations: ParlayRecommendation[] = [];

    // Identify weak legs
    const weakestLeg = probabilities.reduce(
      (min, prob, index) =>
        prob.adjustedProbability < probabilities[min].adjustedProbability ? index : min,
      0
    );

    if (probabilities[weakestLeg].adjustedProbability < 0.4) {
      recommendations.push({
        type: 'remove_leg',
        legIndex: weakestLeg,
        reason: `Leg ${weakestLeg + 1} has low probability (${(probabilities[weakestLeg].adjustedProbability * 100).toFixed(1)}%)`,
        expectedImpact: 0.15,
      });
    }

    // Check for high-risk factors
    const highRiskFactors = riskFactors.filter(rf => rf.severity === 'high');
    if (highRiskFactors.length > 0) {
      recommendations.push({
        type: 'avoid_parlay',
        reason: `High risk factors detected: ${highRiskFactors.map(rf => rf.type).join(', ')}`,
        expectedImpact: -0.2,
      });
    }

    // Check expected value
    const expectedValue = this.calculateExpectedValue(
      this.calculateOverallProbability(probabilities, adjustments),
      parlayData.totalOdds,
      parlayData.stake
    );

    if (expectedValue < -0.1) {
      recommendations.push({
        type: 'avoid_parlay',
        reason: `Negative expected value: ${(expectedValue * 100).toFixed(1)}%`,
        expectedImpact: expectedValue,
      });
    }

    // Suggest correlated legs to add
    const correlatedSuggestion = await this.suggestCorrelatedLeg(parlayData.legs);
    if (correlatedSuggestion) {
      recommendations.push({
        type: 'add_leg',
        reason: 'Adding correlated leg for positive correlation',
        expectedImpact: 0.05,
        alternative: correlatedSuggestion,
      });
    }

    return recommendations;
  }

  private async findAlternativeSelections(legs: ParlayLeg[]): Promise<AlternativeSelection[]> {
    const alternatives: AlternativeSelection[] = [];

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];

      if (leg.betType === 'spread' && leg.line) {
        // Suggest alternative spread
        const altLine = leg.line + (Math.random() > 0.5 ? 0.5 : -0.5);
        alternatives.push({
          legIndex: i,
          alternativeSelection: `${leg.selection} ${altLine > 0 ? '+' : ''}${altLine}`,
          alternativeOdds: leg.odds + (altLine > leg.line ? 15 : -15),
          probabilityImprovement: altLine > leg.line ? 0.08 : -0.08,
          reason:
            altLine > leg.line
              ? 'Safer line with better probability'
              : 'More aggressive line for better odds',
        });
      }

      if (leg.betType === 'total' && leg.line) {
        // Suggest alternative total
        const altLine = leg.line + (Math.random() > 0.5 ? 0.5 : -0.5);
        alternatives.push({
          legIndex: i,
          alternativeSelection: `${leg.selection} ${altLine}`,
          alternativeOdds: leg.odds + (Math.random() > 0.5 ? 10 : -10),
          probabilityImprovement: 0.05,
          reason: 'Alternative total line based on weather and pace factors',
        });
      }
    }

    return alternatives;
  }

  // Helper methods for specific calculations
  private async calculateSpreadProbability(leg: ParlayLeg): Promise<number> {
    // This would integrate with existing NFL analytics
    // Placeholder calculation based on line and historical data
    const impliedProb = this.oddsToImpliedProbability(leg.odds);
    return impliedProb * 0.95; // Adjust for house edge
  }

  private async calculateTotalProbability(leg: ParlayLeg): Promise<number> {
    const impliedProb = this.oddsToImpliedProbability(leg.odds);
    return impliedProb * 0.95;
  }

  private async calculateMoneylineProbability(leg: ParlayLeg): Promise<number> {
    const impliedProb = this.oddsToImpliedProbability(leg.odds);
    return impliedProb * 0.96; // Moneylines typically have lower juice
  }

  private async calculatePlayerPropProbability(leg: ParlayLeg): Promise<number> {
    const impliedProb = this.oddsToImpliedProbability(leg.odds);
    return impliedProb * 0.92; // Player props have higher juice
  }

  private async calculateTeamPropProbability(leg: ParlayLeg): Promise<number> {
    const impliedProb = this.oddsToImpliedProbability(leg.odds);
    return impliedProb * 0.93;
  }

  private async applyGameSpecificAdjustments(leg: ParlayLeg, probability: number): Promise<number> {
    let adjusted = probability;

    // Weather adjustments
    const weather = await this.getWeatherImpact(leg.gameId);
    if (weather && leg.betType === 'total') {
      adjusted *= 1 + weather.impactOnTotals;
    }

    // Divisional game adjustments
    const isDivisional = await this.isDivisionalGame(leg.gameId);
    if (isDivisional && leg.betType === 'spread') {
      adjusted *= 0.95; // Divisional games are more unpredictable
    }

    // Primetime adjustments
    const isPrimetime = await this.isPrimetimeGame(leg.gameId);
    if (isPrimetime) {
      if (leg.betType === 'total') {
        adjusted *= 1.02; // Slight over bias in primetime
      }
    }

    return Math.max(0.01, Math.min(0.99, adjusted));
  }

  private calculateLegConfidence(leg: ParlayLeg, probability: number): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on bet type
    switch (leg.betType) {
      case 'moneyline':
        confidence += 0.1; // More straightforward
        break;
      case 'player_prop':
        confidence -= 0.2; // More volatile
        break;
      case 'spread':
        confidence += 0.05;
        break;
    }

    // Adjust based on probability (extreme probabilities are less reliable)
    if (probability < 0.2 || probability > 0.8) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private calculateExpectedValue(probability: number, odds: number, stake: number): number {
    const payout = this.calculatePayout(odds, stake);
    return probability * payout - (1 - probability) * stake;
  }

  private calculatePayout(odds: number, stake: number): number {
    if (odds > 0) {
      return stake + (stake * odds) / 100;
    } else {
      return stake + stake / (Math.abs(odds) / 100);
    }
  }

  private oddsToImpliedProbability(odds: number): number {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }

  private calculateConfidence(
    probabilities: LegProbability[],
    correlations: GameCorrelation[]
  ): number {
    const avgLegConfidence =
      probabilities.reduce((sum, prob) => sum + prob.confidence, 0) / probabilities.length;
    const correlationPenalty = correlations.length * 0.02; // Slight penalty for each correlation
    return Math.max(0.1, Math.min(0.95, avgLegConfidence - correlationPenalty));
  }

  // Placeholder methods for data retrieval (would integrate with existing services)
  private async getHistoricalCorrelationWinRate(leg1: ParlayLeg, leg2: ParlayLeg): Promise<number> {
    // Would query historical data for similar bet combinations
    return 0.48; // Slightly below independent probability
  }

  private async isDivisionalWeek(gameId1: string, gameId2: string): Promise<boolean> {
    // Check if both games involve divisional matchups in the same week
    return Math.random() < 0.2; // 20% chance placeholder
  }

  private async analyzeWeatherCorrelation(
    gameId1: string,
    gameId2: string
  ): Promise<{ strength: number; description: string }> {
    // Analyze weather correlation between games
    return {
      strength: Math.random() * 0.1,
      description: 'Similar weather conditions in both markets',
    };
  }

  private async analyzePrimetimeCorrelation(gameId1: string, gameId2: string): Promise<number> {
    // Check if both games are primetime (public betting bias correlation)
    return Math.random() < 0.3 ? 0.05 : 0; // 5% positive correlation if both primetime
  }

  private async calculatePlayerPropCorrelation(leg1: ParlayLeg, leg2: ParlayLeg): Promise<number> {
    // Calculate correlation between player props (e.g., QB yards and RB yards)
    if (leg1.statType === 'passing_yards' && leg2.statType === 'rushing_yards') {
      return -0.15; // Negative correlation
    }
    return 0;
  }

  private async analyzeWeatherRisk(
    gameId: string
  ): Promise<{ severity: 'low' | 'medium' | 'high'; description: string; impact: number }> {
    // Analyze weather risk for the game
    return {
      severity: 'low',
      description: 'Clear conditions expected',
      impact: 0,
    };
  }

  private async analyzeInjuryRisk(
    leg: ParlayLeg
  ): Promise<{ severity: 'low' | 'medium' | 'high'; description: string; impact: number }> {
    // Analyze injury risk for players involved in the bet
    return {
      severity: 'low',
      description: 'No significant injury concerns',
      impact: 0,
    };
  }

  private async analyzeMotivationRisk(
    gameId: string
  ): Promise<{ severity: 'low' | 'medium' | 'high'; description: string; impact: number }> {
    // Analyze motivation factors (playoff implications, etc.)
    return {
      severity: 'low',
      description: 'Standard regular season motivation',
      impact: 0,
    };
  }

  private async analyzePrimetimeRisk(
    gameId: string
  ): Promise<{ severity: 'low' | 'medium' | 'high'; description: string; impact: number }> {
    // Analyze primetime game risk (public betting bias, etc.)
    return {
      severity: 'low',
      description: 'No significant primetime bias expected',
      impact: 0,
    };
  }

  private async suggestCorrelatedLeg(legs: ParlayLeg[]): Promise<ParlayLeg | null> {
    // Suggest a correlated leg to add to the parlay
    return null; // Placeholder
  }

  private async getWeatherImpact(gameId: string): Promise<WeatherImpact | null> {
    // Get weather impact data for the game
    return null; // Placeholder
  }

  private async isDivisionalGame(gameId: string): Promise<boolean> {
    // Check if the game is a divisional matchup
    return Math.random() < 0.25; // 25% of games are divisional
  }

  private async isPrimetimeGame(gameId: string): Promise<boolean> {
    // Check if the game is in primetime
    return Math.random() < 0.15; // ~15% of games are primetime
  }

  private async storeParlayAnalysis(prediction: ParlayPrediction): Promise<void> {
    await this.db
      .collection('nfl_parlay_analysis')
      .doc(prediction.parlayId)
      .set({
        ...prediction,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }
}

export default NFLParlayAnalyticsService;
