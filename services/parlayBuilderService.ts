// =============================================================================
// PARLAY BUILDER SERVICE
// Advanced Multi-Bet Combination Tool with AI Optimization
// =============================================================================

import * as Sentry from '@sentry/react-native';

import { BetSelection, Bet } from './betTrackingService';
import { optimizedQuery } from './firebaseOptimizationService';

// =============================================================================
// INTERFACES
// =============================================================================

export interface ParlayLeg {
  id: string;
  gameId: string;
  selectionType: 'moneyline' | 'spread' | 'total' | 'prop';

  // Game information
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;
  league: string;

  // Selection details
  selection: string;
  originalOdds: number;
  currentOdds: number;
  line?: number;

  // Player prop specific
  player?: {
    id: string;
    name: string;
    team: string;
    position: string;
  };
  propType?: string;
  propTarget?: number;

  // AI insights
  aiPrediction?: number;
  confidence: number;
  reasoning: string;

  // Risk assessment
  injury_risk: number; // 0-1 scale
  variance: number; // Statistical variance
  correlation: number; // Correlation with other legs

  // Status
  isValid: boolean;
  validationMessages: string[];

  createdAt: Date;
}

export interface ParlayCard {
  id: string;
  userId: string;
  name: string;
  legs: ParlayLeg[];

  // Odds and payout
  totalOdds: number;
  impliedProbability: number;
  trueOdds: number; // Calculated without vig
  expectedValue: number;

  // Risk metrics
  riskScore: number; // 0-100
  correlationRisk: number;
  varianceScore: number;
  kellyRecommendedStake: number;

  // AI analysis
  aiRecommendation: 'strong_play' | 'good_play' | 'fair_play' | 'avoid';
  confidenceScore: number; // Overall confidence 0-100
  successProbability: number; // AI calculated probability

  // Strategy insights
  hedgingOpportunities: HedgingOpportunity[];
  cashOutValue?: number;

  // Metadata
  tags: string[];
  notes: string;
  isTemplate: boolean;
  shareCode?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface HedgingOpportunity {
  legIndex: number;
  oppositeSelection: string;
  hedgeOdds: number;
  hedgeStake: number;
  guaranteedProfit: number;
  recommendation: 'hedge_now' | 'hedge_if_ahead' | 'let_ride';
}

export interface ParlayOptimization {
  originalParlay: ParlayCard;
  optimizedParlay: ParlayCard;
  improvements: {
    oddsImprovement: number;
    riskReduction: number;
    evIncrease: number;
    confidenceIncrease: number;
  };
  suggestions: string[];
}

export interface ParlayTemplate {
  id: string;
  name: string;
  description: string;
  category: 'safe' | 'value' | 'longshot' | 'custom';
  targetSports: string[];
  minLegs: number;
  maxLegs: number;
  targetOdds: { min: number; max: number };
  selectionCriteria: {
    minConfidence: number;
    maxCorrelation: number;
    preferredSelectionTypes: string[];
  };
  isPublic: boolean;
  createdBy: string;
  usage_count: number;
}

export interface CorrelationMatrix {
  [key: string]: {
    [key: string]: number; // Correlation coefficient -1 to 1
  };
}

export interface ParlayValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  riskAssessment: {
    overall: 'low' | 'medium' | 'high' | 'extreme';
    factors: string[];
  };
}

// =============================================================================
// PARLAY BUILDER SERVICE
// =============================================================================

export class ParlayBuilderService {
  private activeParlays = new Map<string, ParlayCard>();
  private correlationMatrix: CorrelationMatrix = {};
  private templates: ParlayTemplate[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the parlay builder service
   */
  private async initialize(): Promise<void> {
    try {
      // Load correlation data
      await this.loadCorrelationMatrix();

      // Load parlay templates
      await this.loadParlayTemplates();

      Sentry.addBreadcrumb({
        message: 'Parlay Builder Service initialized',
        category: 'parlay.builder.init',
        level: 'info',
      });

      console.log('Parlay Builder Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize Parlay Builder Service: ${error}`);
    }
  }

  // =============================================================================
  // PARLAY CREATION AND MANAGEMENT
  // =============================================================================

  /**
   * Create new parlay card
   */
  createParlayCard(userId: string, name: string = 'New Parlay'): ParlayCard {
    const parlayId = `parlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const parlay: ParlayCard = {
      id: parlayId,
      userId,
      name,
      legs: [],
      totalOdds: 1,
      impliedProbability: 100,
      trueOdds: 1,
      expectedValue: 0,
      riskScore: 0,
      correlationRisk: 0,
      varianceScore: 0,
      kellyRecommendedStake: 0,
      aiRecommendation: 'fair_play',
      confidenceScore: 0,
      successProbability: 0,
      hedgingOpportunities: [],
      tags: [],
      notes: '',
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeParlays.set(parlayId, parlay);

    Sentry.addBreadcrumb({
      message: 'Parlay card created',
      category: 'parlay.builder.create',
      level: 'info',
      data: { parlayId, userId, name },
    });

    return parlay;
  }

  /**
   * Add leg to parlay
   */
  async addLegToParlay(
    parlayId: string,
    legData: Omit<ParlayLeg, 'id' | 'createdAt' | 'isValid' | 'validationMessages'>
  ): Promise<ParlayCard> {
    try {
      const parlay = this.activeParlays.get(parlayId);
      if (!parlay) {
        throw new Error(`Parlay not found: ${parlayId}`);
      }

      // Create new leg
      const leg: ParlayLeg = {
        ...legData,
        id: `leg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date(),
        isValid: true,
        validationMessages: [],
      };

      // Validate leg compatibility
      const validation = await this.validateNewLeg(parlay, leg);
      leg.isValid = validation.isValid;
      leg.validationMessages = [...validation.errors, ...validation.warnings];

      // Add AI insights if not provided
      if (!leg.aiPrediction || !leg.reasoning) {
        const aiInsights = await this.generateAIInsights(leg);
        leg.aiPrediction = aiInsights.prediction;
        leg.reasoning = aiInsights.reasoning;
        leg.confidence = aiInsights.confidence;
      }

      // Calculate correlations with existing legs
      leg.correlation = this.calculateLegCorrelations(parlay.legs, leg);

      // Add leg to parlay
      parlay.legs.push(leg);

      // Recalculate parlay metrics
      await this.recalculateParlayMetrics(parlay);

      this.activeParlays.set(parlayId, parlay);

      Sentry.addBreadcrumb({
        message: 'Leg added to parlay',
        category: 'parlay.builder.add_leg',
        level: 'info',
        data: {
          parlayId,
          legId: leg.id,
          selection: leg.selection,
          odds: leg.currentOdds,
        },
      });

      return parlay;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to add leg to parlay: ${error}`);
    }
  }

  /**
   * Remove leg from parlay
   */
  async removeLegFromParlay(parlayId: string, legId: string): Promise<ParlayCard> {
    try {
      const parlay = this.activeParlays.get(parlayId);
      if (!parlay) {
        throw new Error(`Parlay not found: ${parlayId}`);
      }

      const legIndex = parlay.legs.findIndex(leg => leg.id === legId);
      if (legIndex === -1) {
        throw new Error(`Leg not found: ${legId}`);
      }

      // Remove leg
      parlay.legs.splice(legIndex, 1);

      // Recalculate metrics
      await this.recalculateParlayMetrics(parlay);

      this.activeParlays.set(parlayId, parlay);

      return parlay;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to remove leg from parlay: ${error}`);
    }
  }

  /**
   * Update leg in parlay
   */
  async updateParlayLeg(
    parlayId: string,
    legId: string,
    updates: Partial<ParlayLeg>
  ): Promise<ParlayCard> {
    try {
      const parlay = this.activeParlays.get(parlayId);
      if (!parlay) {
        throw new Error(`Parlay not found: ${parlayId}`);
      }

      const legIndex = parlay.legs.findIndex(leg => leg.id === legId);
      if (legIndex === -1) {
        throw new Error(`Leg not found: ${legId}`);
      }

      // Update leg
      parlay.legs[legIndex] = { ...parlay.legs[legIndex], ...updates };

      // Recalculate metrics
      await this.recalculateParlayMetrics(parlay);

      this.activeParlays.set(parlayId, parlay);

      return parlay;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to update parlay leg: ${error}`);
    }
  }

  // =============================================================================
  // PARLAY OPTIMIZATION
  // =============================================================================

  /**
   * Optimize parlay for better value
   */
  async optimizeParlay(
    parlayId: string,
    optimizationType: 'value' | 'safety' | 'balanced' = 'balanced'
  ): Promise<ParlayOptimization> {
    try {
      const originalParlay = this.activeParlays.get(parlayId);
      if (!originalParlay) {
        throw new Error(`Parlay not found: ${parlayId}`);
      }

      // Create optimized version
      const optimizedParlay = JSON.parse(JSON.stringify(originalParlay)) as ParlayCard;
      optimizedParlay.id = `${parlayId}_optimized`;

      // Apply optimization strategies
      const improvements = await this.applyOptimizationStrategies(
        optimizedParlay,
        optimizationType
      );

      // Generate suggestions
      const suggestions = this.generateOptimizationSuggestions(
        originalParlay,
        optimizedParlay,
        optimizationType
      );

      return {
        originalParlay,
        optimizedParlay,
        improvements,
        suggestions,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to optimize parlay: ${error}`);
    }
  }

  /**
   * Get smart parlay suggestions based on user preferences and current legs
   */
  async getSmartSuggestions(parlayId: string, maxSuggestions: number = 5): Promise<ParlayLeg[]> {
    try {
      const parlay = this.activeParlays.get(parlayId);
      if (!parlay) {
        throw new Error(`Parlay not found: ${parlayId}`);
      }

      // Get available games for today
      const availableGames = await this.getAvailableGames();

      // Filter games that don't conflict with existing legs
      const compatibleGames = this.filterCompatibleGames(availableGames, parlay.legs);

      // Generate suggestions based on AI analysis
      const suggestions = await this.generateSmartSuggestions(
        compatibleGames,
        parlay,
        maxSuggestions
      );

      return suggestions;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get smart suggestions: ${error}`);
    }
  }

  /**
   * Build parlay from template
   */
  async buildFromTemplate(userId: string, templateId: string): Promise<ParlayCard> {
    try {
      const template = this.templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create base parlay
      const parlay = this.createParlayCard(
        userId,
        `${template.name} - ${new Date().toLocaleDateString()}`
      );
      parlay.tags = [template.category, 'template'];

      // Apply template criteria to find suitable legs
      const suitableLegs = await this.findLegsForTemplate(template);

      // Add legs to parlay
      for (const legData of suitableLegs) {
        await this.addLegToParlay(parlay.id, legData);
      }

      return parlay;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to build parlay from template: ${error}`);
    }
  }

  // =============================================================================
  // VALIDATION AND RISK ASSESSMENT
  // =============================================================================

  /**
   * Validate parlay card
   */
  async validateParlay(parlayId: string): Promise<ParlayValidation> {
    try {
      const parlay = this.activeParlays.get(parlayId);
      if (!parlay) {
        throw new Error(`Parlay not found: ${parlayId}`);
      }

      const validation: ParlayValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        riskAssessment: {
          overall: 'medium',
          factors: [],
        },
      };

      // Check minimum legs
      if (parlay.legs.length < 2) {
        validation.errors.push('Parlay must have at least 2 legs');
        validation.isValid = false;
      }

      // Check maximum legs (platform limit)
      if (parlay.legs.length > 12) {
        validation.errors.push('Parlay cannot have more than 12 legs');
        validation.isValid = false;
      }

      // Check for invalid legs
      const invalidLegs = parlay.legs.filter(leg => !leg.isValid);
      if (invalidLegs.length > 0) {
        validation.errors.push(`${invalidLegs.length} legs are invalid`);
        validation.isValid = false;
      }

      // Risk assessment
      validation.riskAssessment = this.assessParlayRisk(parlay);

      // Generate warnings
      if (parlay.riskScore > 80) {
        validation.warnings.push('This parlay has very high risk');
      }

      if (parlay.correlationRisk > 0.7) {
        validation.warnings.push('High correlation between legs reduces true odds');
      }

      if (parlay.expectedValue < -0.1) {
        validation.warnings.push('Negative expected value - consider optimization');
      }

      // Generate suggestions
      if (parlay.legs.length < 4 && parlay.riskScore < 50) {
        validation.suggestions.push('Consider adding more legs for higher payout');
      }

      if (parlay.varianceScore > 75) {
        validation.suggestions.push('High variance - consider more consistent selections');
      }

      return validation;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to validate parlay: ${error}`);
    }
  }

  /**
   * Calculate hedging opportunities
   */
  async calculateHedgingOpportunities(
    parlayId: string,
    currentStake: number
  ): Promise<HedgingOpportunity[]> {
    try {
      const parlay = this.activeParlays.get(parlayId);
      if (!parlay) {
        throw new Error(`Parlay not found: ${parlayId}`);
      }

      const opportunities: HedgingOpportunity[] = [];

      // Calculate hedging for each leg if others win
      for (let i = 0; i < parlay.legs.length; i++) {
        const leg = parlay.legs[i];

        // Calculate potential payout if all other legs win
        const otherLegsOdds = parlay.legs
          .filter((_, index) => index !== i)
          .reduce((odds, l) => odds * l.currentOdds, 1);

        const potentialPayout = currentStake * otherLegsOdds;

        // Find opposite selection odds (simplified - in production would query real odds)
        const oppositeOdds = this.getOppositeSelectionOdds(leg);

        if (oppositeOdds) {
          // Calculate hedge stake for guaranteed profit
          const hedgeStake = potentialPayout / (oppositeOdds + 1);
          const guaranteedProfit = hedgeStake * oppositeOdds - currentStake - hedgeStake;

          if (guaranteedProfit > 0) {
            opportunities.push({
              legIndex: i,
              oppositeSelection: this.getOppositeSelection(leg),
              hedgeOdds: oppositeOdds,
              hedgeStake,
              guaranteedProfit,
              recommendation:
                guaranteedProfit > currentStake * 0.1 ? 'hedge_now' : 'hedge_if_ahead',
            });
          }
        }
      }

      return opportunities;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Recalculate all parlay metrics
   */
  private async recalculateParlayMetrics(parlay: ParlayCard): Promise<void> {
    // Calculate total odds
    parlay.totalOdds = parlay.legs.reduce((odds, leg) => odds * leg.currentOdds, 1);

    // Calculate implied probability
    parlay.impliedProbability =
      parlay.legs.reduce((prob, leg) => {
        const legProb = 1 / leg.currentOdds;
        return prob * legProb;
      }, 1) * 100;

    // Calculate true odds (removing vig)
    parlay.trueOdds = this.calculateTrueOdds(parlay.legs);

    // Calculate expected value
    parlay.expectedValue = await this.calculateExpectedValue(parlay);

    // Calculate risk metrics
    parlay.riskScore = this.calculateRiskScore(parlay);
    parlay.correlationRisk = this.calculateCorrelationRisk(parlay.legs);
    parlay.varianceScore = this.calculateVarianceScore(parlay.legs);

    // Calculate AI metrics
    parlay.confidenceScore = this.calculateOverallConfidence(parlay.legs);
    parlay.successProbability = this.calculateSuccessProbability(parlay.legs);
    parlay.aiRecommendation = this.getAIRecommendation(parlay);

    // Calculate Kelly stake
    parlay.kellyRecommendedStake = this.calculateKellyStake(parlay);

    // Find hedging opportunities
    parlay.hedgingOpportunities = await this.calculateHedgingOpportunities(parlay.id, 100); // $100 example stake

    parlay.updatedAt = new Date();
  }

  /**
   * Validate new leg compatibility
   */
  private async validateNewLeg(parlay: ParlayCard, newLeg: ParlayLeg): Promise<ParlayValidation> {
    const validation: ParlayValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      riskAssessment: { overall: 'low', factors: [] },
    };

    // Check for same game conflicts
    const sameGameLegs = parlay.legs.filter(leg => leg.gameId === newLeg.gameId);
    if (sameGameLegs.length > 0) {
      // Check if selections are compatible
      const hasConflict = this.checkSelectionConflict(sameGameLegs, newLeg);
      if (hasConflict) {
        validation.errors.push('Conflicting selections in the same game');
        validation.isValid = false;
      } else {
        validation.warnings.push('Multiple selections from same game increases correlation');
      }
    }

    // Check correlation with existing legs
    const correlation = this.calculateLegCorrelations(parlay.legs, newLeg);
    if (correlation > 0.7) {
      validation.warnings.push('High correlation with existing legs');
    }

    // Check odds validity
    if (newLeg.currentOdds < 1.01) {
      validation.errors.push('Odds too low - minimum 1.01');
      validation.isValid = false;
    }

    if (newLeg.currentOdds > 50) {
      validation.warnings.push('Very high odds - extreme long shot');
    }

    return validation;
  }

  /**
   * Generate AI insights for leg
   */
  private async generateAIInsights(
    leg: ParlayLeg
  ): Promise<{ prediction: number; confidence: number; reasoning: string }> {
    // In production, this would call AI prediction models
    // For now, generate realistic mock insights

    const confidence = 60 + Math.random() * 30; // 60-90% confidence
    const prediction = leg.propTarget
      ? leg.propTarget * (0.9 + Math.random() * 0.2)
      : Math.random();

    let reasoning = '';
    if (leg.selectionType === 'prop') {
      reasoning = `${leg.player?.name} averages ${prediction?.toFixed(1)} ${leg.propType} per game. `;
      reasoning += `Strong matchup against opponent's defense. `;
      reasoning += `Recent form and injury status considered.`;
    } else {
      reasoning = `${leg.homeTeam} vs ${leg.awayTeam} analysis shows favorable conditions. `;
      reasoning += `Historical performance and current form favor this selection.`;
    }

    return { prediction, confidence, reasoning };
  }

  /**
   * Calculate leg correlations
   */
  private calculateLegCorrelations(existingLegs: ParlayLeg[], newLeg: ParlayLeg): number {
    if (existingLegs.length === 0) return 0;

    let maxCorrelation = 0;

    existingLegs.forEach(leg => {
      const correlationKey = `${leg.gameId}_${newLeg.gameId}`;
      const correlation =
        this.correlationMatrix[correlationKey]?.[`${leg.selectionType}_${newLeg.selectionType}`] ||
        0;
      maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation));
    });

    return maxCorrelation;
  }

  /**
   * Calculate true odds removing vig
   */
  private calculateTrueOdds(legs: ParlayLeg[]): number {
    // Simplified vig removal - in production would use more sophisticated methods
    const vigFactor = 0.95; // Assume 5% vig
    return legs.reduce((odds, leg) => odds * (leg.currentOdds * vigFactor), 1);
  }

  /**
   * Calculate expected value
   */
  private async calculateExpectedValue(parlay: ParlayCard): Promise<number> {
    if (parlay.legs.length === 0) return 0;

    // Calculate true probability based on AI predictions
    const trueProb = parlay.legs.reduce((prob, leg) => {
      const legProb = leg.confidence / 100;
      return prob * legProb;
    }, 1);

    // EV = (True Probability × Payout) - 1
    return trueProb * parlay.totalOdds - 1;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(parlay: ParlayCard): number {
    let riskScore = 0;

    // Base risk from number of legs
    riskScore += Math.min(parlay.legs.length * 10, 50);

    // Risk from odds
    const avgOdds = parlay.legs.reduce((sum, leg) => sum + leg.currentOdds, 0) / parlay.legs.length;
    riskScore += Math.min((avgOdds - 1) * 10, 30);

    // Risk from correlations
    riskScore += parlay.correlationRisk * 20;

    return Math.min(riskScore, 100);
  }

  /**
   * Calculate correlation risk
   */
  private calculateCorrelationRisk(legs: ParlayLeg[]): number {
    if (legs.length < 2) return 0;

    let totalCorrelation = 0;
    let pairs = 0;

    for (let i = 0; i < legs.length; i++) {
      for (let j = i + 1; j < legs.length; j++) {
        const correlation = this.getCorrelation(legs[i], legs[j]);
        totalCorrelation += Math.abs(correlation);
        pairs++;
      }
    }

    return pairs > 0 ? totalCorrelation / pairs : 0;
  }

  /**
   * Get correlation between two legs
   */
  private getCorrelation(leg1: ParlayLeg, leg2: ParlayLeg): number {
    // Same game correlations
    if (leg1.gameId === leg2.gameId) {
      return 0.6; // High correlation for same game
    }

    // Same player correlations
    if (leg1.player?.id === leg2.player?.id) {
      return 0.8; // Very high correlation for same player
    }

    // Team correlations (simplified)
    if (leg1.homeTeam === leg2.homeTeam || leg1.awayTeam === leg2.awayTeam) {
      return 0.3; // Medium correlation for same team
    }

    return 0.1; // Low baseline correlation
  }

  /**
   * Calculate variance score
   */
  private calculateVarianceScore(legs: ParlayLeg[]): number {
    if (legs.length === 0) return 0;

    const variances = legs.map(leg => leg.variance || Math.random() * 0.5);
    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;

    return avgVariance * 100;
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(legs: ParlayLeg[]): number {
    if (legs.length === 0) return 0;

    // Use geometric mean for combined confidence
    const product = legs.reduce((prod, leg) => prod * (leg.confidence / 100), 1);
    return Math.pow(product, 1 / legs.length) * 100;
  }

  /**
   * Calculate success probability
   */
  private calculateSuccessProbability(legs: ParlayLeg[]): number {
    if (legs.length === 0) return 0;

    return legs.reduce((prob, leg) => prob * (leg.confidence / 100), 1) * 100;
  }

  /**
   * Get AI recommendation
   */
  private getAIRecommendation(parlay: ParlayCard): ParlayCard['aiRecommendation'] {
    if (parlay.expectedValue > 0.15 && parlay.confidenceScore > 70) {
      return 'strong_play';
    } else if (parlay.expectedValue > 0.05 && parlay.confidenceScore > 60) {
      return 'good_play';
    } else if (parlay.expectedValue > -0.05) {
      return 'fair_play';
    } else {
      return 'avoid';
    }
  }

  /**
   * Calculate Kelly stake
   */
  private calculateKellyStake(parlay: ParlayCard): number {
    if (parlay.expectedValue <= 0) return 0;

    // Kelly criterion: f = (bp - q) / b
    const b = parlay.totalOdds - 1;
    const p = parlay.successProbability / 100;
    const q = 1 - p;

    const kellyFraction = (b * p - q) / b;

    // Convert to dollar amount (assuming $10,000 bankroll)
    const bankroll = 10000;
    const kellyStake = bankroll * Math.max(0, Math.min(0.25, kellyFraction)); // Cap at 25%

    return Math.round(kellyStake);
  }

  /**
   * Apply optimization strategies
   */
  private async applyOptimizationStrategies(
    parlay: ParlayCard,
    type: 'value' | 'safety' | 'balanced'
  ): Promise<ParlayOptimization['improvements']> {
    const originalMetrics = {
      odds: parlay.totalOdds,
      risk: parlay.riskScore,
      ev: parlay.expectedValue,
      confidence: parlay.confidenceScore,
    };

    // Apply optimization based on type
    switch (type) {
      case 'value':
        await this.optimizeForValue(parlay);
        break;
      case 'safety':
        await this.optimizeForSafety(parlay);
        break;
      case 'balanced':
        await this.optimizeBalanced(parlay);
        break;
    }

    // Recalculate metrics
    await this.recalculateParlayMetrics(parlay);

    return {
      oddsImprovement: parlay.totalOdds - originalMetrics.odds,
      riskReduction: originalMetrics.risk - parlay.riskScore,
      evIncrease: parlay.expectedValue - originalMetrics.ev,
      confidenceIncrease: parlay.confidenceScore - originalMetrics.confidence,
    };
  }

  /**
   * Optimize for value
   */
  private async optimizeForValue(parlay: ParlayCard): Promise<void> {
    // Remove low-confidence legs
    parlay.legs = parlay.legs.filter(leg => leg.confidence > 60);

    // Add high-value legs if available
    const suggestions = await this.getSmartSuggestions(parlay.id, 3);
    const highValueSuggestions = suggestions.filter(s => s.confidence > 75);

    // Add up to 2 high-value legs
    for (let i = 0; i < Math.min(2, highValueSuggestions.length); i++) {
      parlay.legs.push(highValueSuggestions[i]);
    }
  }

  /**
   * Optimize for safety
   */
  private async optimizeForSafety(parlay: ParlayCard): Promise<void> {
    // Keep only high-confidence, low-correlation legs
    parlay.legs = parlay.legs.filter(leg => leg.confidence > 70 && leg.correlation < 0.4);

    // Remove legs with high variance
    parlay.legs = parlay.legs.filter(leg => (leg.variance || 0) < 0.3);

    // Limit to maximum 4 legs for safety
    if (parlay.legs.length > 4) {
      parlay.legs = parlay.legs.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
    }
  }

  /**
   * Optimize balanced approach
   */
  private async optimizeBalanced(parlay: ParlayCard): Promise<void> {
    // Remove legs with confidence < 55% or very high correlation
    parlay.legs = parlay.legs.filter(leg => leg.confidence > 55 && leg.correlation < 0.6);

    // Add 1-2 medium confidence legs if parlay is too small
    if (parlay.legs.length < 3) {
      const suggestions = await this.getSmartSuggestions(parlay.id, 2);
      const balancedSuggestions = suggestions.filter(s => s.confidence > 65 && s.confidence < 80);

      for (let i = 0; i < Math.min(2, balancedSuggestions.length); i++) {
        parlay.legs.push(balancedSuggestions[i]);
      }
    }
  }

  // Mock data and helper methods for demo purposes
  private async loadCorrelationMatrix(): Promise<void> {
    // In production, this would load real correlation data
    this.correlationMatrix = {};
  }

  private async loadParlayTemplates(): Promise<void> {
    // Mock templates
    this.templates = [
      {
        id: 'safe_value',
        name: 'Safe Value Plays',
        description: 'High confidence, low correlation selections',
        category: 'safe',
        targetSports: ['nba', 'nfl'],
        minLegs: 2,
        maxLegs: 4,
        targetOdds: { min: 3, max: 8 },
        selectionCriteria: {
          minConfidence: 70,
          maxCorrelation: 0.3,
          preferredSelectionTypes: ['moneyline', 'spread'],
        },
        isPublic: true,
        createdBy: 'system',
        usage_count: 1250,
      },
    ];
  }

  private async getAvailableGames(): Promise<any[]> {
    // Mock games data
    return [];
  }

  private filterCompatibleGames(games: any[], legs: ParlayLeg[]): any[] {
    // Filter logic for compatible games
    return games;
  }

  private async generateSmartSuggestions(
    games: any[],
    parlay: ParlayCard,
    maxSuggestions: number
  ): Promise<ParlayLeg[]> {
    // Generate mock suggestions
    return [];
  }

  private async findLegsForTemplate(
    template: ParlayTemplate
  ): Promise<Omit<ParlayLeg, 'id' | 'createdAt' | 'isValid' | 'validationMessages'>[]> {
    // Find suitable legs based on template criteria
    return [];
  }

  private assessParlayRisk(parlay: ParlayCard): ParlayValidation['riskAssessment'] {
    const factors: string[] = [];
    let overall: 'low' | 'medium' | 'high' | 'extreme' = 'medium';

    if (parlay.legs.length > 6) {
      factors.push('High number of legs');
      overall = 'high';
    }

    if (parlay.riskScore > 80) {
      factors.push('Very high risk score');
      overall = 'extreme';
    }

    if (parlay.correlationRisk > 0.7) {
      factors.push('High correlation between legs');
    }

    if (parlay.expectedValue < -0.1) {
      factors.push('Negative expected value');
    }

    return { overall, factors };
  }

  private checkSelectionConflict(existingLegs: ParlayLeg[], newLeg: ParlayLeg): boolean {
    // Check for conflicting selections in same game
    return existingLegs.some(leg => {
      if (leg.selectionType === 'moneyline' && newLeg.selectionType === 'moneyline') {
        return leg.selection !== newLeg.selection; // Can't bet both teams to win
      }
      return false;
    });
  }

  private getOppositeSelectionOdds(leg: ParlayLeg): number | null {
    // In production, would query real odds for opposite selection
    return leg.currentOdds * 0.8; // Mock opposite odds
  }

  private getOppositeSelection(leg: ParlayLeg): string {
    // Generate opposite selection description
    if (leg.selectionType === 'moneyline') {
      return leg.selection.includes(leg.homeTeam) ? `${leg.awayTeam} ML` : `${leg.homeTeam} ML`;
    }
    return `Opposite of ${leg.selection}`;
  }

  private generateOptimizationSuggestions(
    original: ParlayCard,
    optimized: ParlayCard,
    type: string
  ): string[] {
    const suggestions: string[] = [];

    if (optimized.legs.length < original.legs.length) {
      suggestions.push(`Removed ${original.legs.length - optimized.legs.length} high-risk legs`);
    }

    if (optimized.confidenceScore > original.confidenceScore) {
      suggestions.push(
        `Improved overall confidence by ${(optimized.confidenceScore - original.confidenceScore).toFixed(1)}%`
      );
    }

    if (optimized.expectedValue > original.expectedValue) {
      suggestions.push(
        `Increased expected value by ${((optimized.expectedValue - original.expectedValue) * 100).toFixed(1)}%`
      );
    }

    return suggestions;
  }

  /**
   * Get parlay by ID
   */
  getParlayById(parlayId: string): ParlayCard | null {
    return this.activeParlays.get(parlayId) || null;
  }

  /**
   * Get all active parlays for user
   */
  getUserParlays(userId: string): ParlayCard[] {
    return Array.from(this.activeParlays.values()).filter(parlay => parlay.userId === userId);
  }

  /**
   * Delete parlay
   */
  deleteParlay(parlayId: string): boolean {
    return this.activeParlays.delete(parlayId);
  }

  /**
   * Save parlay as template
   */
  saveAsTemplate(
    parlayId: string,
    templateName: string,
    isPublic: boolean = false
  ): ParlayTemplate {
    const parlay = this.activeParlays.get(parlayId);
    if (!parlay) {
      throw new Error(`Parlay not found: ${parlayId}`);
    }

    const template: ParlayTemplate = {
      id: `template_${Date.now()}`,
      name: templateName,
      description: `Created from parlay: ${parlay.name}`,
      category: 'custom',
      targetSports: [...new Set(parlay.legs.map(leg => leg.league))],
      minLegs: Math.max(2, parlay.legs.length - 1),
      maxLegs: parlay.legs.length + 2,
      targetOdds: { min: parlay.totalOdds * 0.8, max: parlay.totalOdds * 1.5 },
      selectionCriteria: {
        minConfidence: Math.min(...parlay.legs.map(leg => leg.confidence)) - 10,
        maxCorrelation: 0.5,
        preferredSelectionTypes: [...new Set(parlay.legs.map(leg => leg.selectionType))],
      },
      isPublic,
      createdBy: parlay.userId,
      usage_count: 0,
    };

    this.templates.push(template);
    return template;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const parlayBuilderService = new ParlayBuilderService();
