// =============================================================================
// ADVANCED BETTING ANALYTICS SERVICE
// Comprehensive Betting Performance Analysis and Insights
// =============================================================================

import * as Sentry from '@sentry/react-native';
import { BetAnalytics, Bet, BetCategoryStats } from './betTrackingService';
import { ParlayCard } from './parlayBuilderService';
import { optimizedQuery } from './firebaseOptimizationService';

// =============================================================================
// INTERFACES
// =============================================================================

export interface AdvancedBettingMetrics {
  performance: PerformanceMetrics;
  profitability: ProfitabilityMetrics;
  riskManagement: RiskManagementMetrics;
  streakAnalysis: StreakAnalysis;
  seasonalAnalysis: SeasonalAnalysis;
  predictionAccuracy: PredictionAccuracyMetrics;
  marketAnalysis: MarketAnalysisMetrics;
  recommendations: RecommendationEngine;
}

export interface PerformanceMetrics {
  totalBets: number;
  winRate: number;
  pushRate: number;
  averageOdds: number;
  unitsSold: number; // Profit in betting units
  
  // Performance by time period
  daily: TimeBasedMetrics[];
  weekly: TimeBasedMetrics[];
  monthly: TimeBasedMetrics[];
  
  // Performance efficiency
  sharpeRatio: number;
  informationRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  
  // Betting patterns
  averageBetSize: number;
  medianBetSize: number;
  betSizeStdDev: number;
  largestWin: number;
  largestLoss: number;
}

export interface ProfitabilityMetrics {
  totalProfit: number;
  netROI: number;
  grossROI: number;
  
  // Profit analysis
  profitByMonth: MonthlyProfitData[];
  profitBySport: SportProfitData[];
  profitByBetType: BetTypeProfitData[];
  profitByStakeSize: StakeSizeProfitData[];
  
  // Efficiency metrics
  profitPerBet: number;
  profitPerUnit: number;
  closingLineValue: number; // How often you beat closing line
  expectedVsActual: number; // Expected profit vs actual
  
  // Tax implications
  taxableIncome: number;
  deductibleLosses: number;
  netTaxableAmount: number;
}

export interface RiskManagementMetrics {
  bankrollManagement: {
    startingBankroll: number;
    currentBankroll: number;
    peakBankroll: number;
    bankrollGrowth: number;
    drawdownFromPeak: number;
  };
  
  kellyAnalysis: {
    optimalKellyBets: number;
    overBetCount: number;
    underBetCount: number;
    averageKellyUtilization: number;
  };
  
  riskMetrics: {
    valueAtRisk95: number; // 95% VaR
    conditionalVaR: number; // Expected shortfall
    maximumRisk: number;
    riskAdjustedReturn: number;
  };
  
  positionSizing: {
    averagePositionSize: number;
    maxPositionSize: number;
    optimalPositionSize: number;
    positionSizeConsistency: number;
  };
}

export interface StreakAnalysis {
  currentStreaks: {
    wins: number;
    losses: number;
    type: 'winning' | 'losing' | 'mixed';
  };
  
  historicalStreaks: {
    longestWinStreak: number;
    longestLossStreak: number;
    averageWinStreak: number;
    averageLossStreak: number;
  };
  
  streakBreaking: {
    winStreakBreakerAnalysis: string[];
    lossRecoveryPatterns: string[];
  };
  
  momentum: {
    momentumScore: number; // -100 to 100
    trendDirection: 'up' | 'down' | 'sideways';
    confidenceLevel: number;
  };
}

export interface SeasonalAnalysis {
  monthlyPerformance: MonthlyPerformanceData[];
  weekdayPerformance: WeekdayPerformanceData[];
  timeOfDayPerformance: TimeOfDayPerformanceData[];
  seasonalTrends: SeasonalTrendData[];
  
  insights: {
    bestMonth: string;
    worstMonth: string;
    bestDayOfWeek: string;
    worstDayOfWeek: string;
    bestTimeOfDay: string;
    seasonalityScore: number;
  };
}

export interface PredictionAccuracyMetrics {
  aiAccuracy: {
    overallAccuracy: number;
    accuracyBySport: { [sport: string]: number };
    accuracyByBetType: { [type: string]: number };
    accuracyByConfidence: { [range: string]: number };
  };
  
  calibration: {
    calibrationScore: number;
    overconfidenceRate: number;
    underconfidenceRate: number;
    reliabilityDiagram: CalibrationPoint[];
  };
  
  valueAdd: {
    beatsClosingLine: number; // Percentage
    expectedValueAccuracy: number;
    profitFromAIPicks: number;
    aiRecommendationSuccess: number;
  };
}

export interface MarketAnalysisMetrics {
  marketBeating: {
    closingLineBeatRate: number;
    marketEdgeIdentification: number;
    arbitrageOpportunities: number;
  };
  
  lineMovement: {
    favorableMovements: number;
    unfavorableMovements: number;
    averageLineMovement: number;
    optimalTimingScore: number;
  };
  
  bookmakerAnalysis: {
    profitByBookmaker: { [bookmaker: string]: BookmakerMetrics };
    bestBookmakerOverall: string;
    limitingFactors: string[];
  };
  
  sportSpecific: {
    edgeBySport: { [sport: string]: number };
    volumeBySport: { [sport: string]: number };
    profitabilitySport: { [sport: string]: number };
  };
}

export interface RecommendationEngine {
  immediate: ImmediateRecommendation[];
  strategic: StrategicRecommendation[];
  warnings: WarningRecommendation[];
  opportunities: OpportunityRecommendation[];
  
  priorityScore: number; // 0-100, how urgent recommendations are
  confidenceLevel: number; // How confident we are in recommendations
}

export interface TimeBasedMetrics {
  date: string;
  bets: number;
  wins: number;
  profit: number;
  roi: number;
  units: number;
}

export interface MonthlyProfitData {
  month: string;
  profit: number;
  roi: number;
  bets: number;
  winRate: number;
}

export interface SportProfitData {
  sport: string;
  profit: number;
  roi: number;
  bets: number;
  winRate: number;
  edge: number; // Expected edge over market
}

export interface BetTypeProfitData {
  betType: string;
  profit: number;
  roi: number;
  bets: number;
  winRate: number;
  averageOdds: number;
}

export interface StakeSizeProfitData {
  range: string; // "$1-50", "$51-100", etc.
  profit: number;
  roi: number;
  bets: number;
  averageStake: number;
}

export interface MonthlyPerformanceData {
  month: string;
  winRate: number;
  profit: number;
  bets: number;
  variance: number;
}

export interface WeekdayPerformanceData {
  day: string;
  winRate: number;
  profit: number;
  bets: number;
  averageConfidence: number;
}

export interface TimeOfDayPerformanceData {
  timeRange: string; // "Morning", "Afternoon", "Evening", "Night"
  winRate: number;
  profit: number;
  bets: number;
  impulseScore: number; // How impulsive bets are in this period
}

export interface SeasonalTrendData {
  period: string;
  trend: 'improving' | 'declining' | 'stable';
  strength: number; // 0-1
  significance: number; // Statistical significance
}

export interface CalibrationPoint {
  predictedProbability: number;
  actualSuccess: number;
  betCount: number;
}

export interface BookmakerMetrics {
  profit: number;
  roi: number;
  bets: number;
  winRate: number;
  averageOdds: number;
  limitingRisk: number; // Risk of being limited
}

export interface ImmediateRecommendation {
  type: 'bankroll' | 'bet_size' | 'stop_loss' | 'take_profit';
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  expectedImpact: string;
}

export interface StrategicRecommendation {
  type: 'focus_sport' | 'bet_type_mix' | 'timing' | 'position_sizing';
  message: string;
  timeframe: string;
  expectedImprovement: number; // Expected ROI improvement
  implementation: string[];
}

export interface WarningRecommendation {
  type: 'losing_streak' | 'overbet' | 'tilt' | 'poor_edge';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[];
  mitigation: string[];
}

export interface OpportunityRecommendation {
  type: 'market_inefficiency' | 'strong_edge' | 'profitable_pattern' | 'arbitrage';
  message: string;
  confidence: number;
  potentialValue: number;
  actionRequired: string[];
}

export interface BettingInsights {
  keyPerformanceIndicators: KPI[];
  strengthsAndWeaknesses: StrengthWeaknessAnalysis;
  improvementAreas: ImprovementArea[];
  marketOpportunities: MarketOpportunity[];
  riskAlerts: RiskAlert[];
}

export interface KPI {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  benchmark: number;
  percentile: number; // Where you rank vs other bettors
}

export interface StrengthWeaknessAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  focus_areas: string[];
}

export interface ImprovementArea {
  area: string;
  currentScore: number;
  potentialScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImprove: string;
  actionPlan: string[];
}

export interface MarketOpportunity {
  sport: string;
  type: string;
  edge: number;
  confidence: number;
  description: string;
  requirements: string[];
}

export interface RiskAlert {
  type: 'bankroll' | 'streak' | 'overbet' | 'correlation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  autoAction?: string;
}

// =============================================================================
// ADVANCED BETTING ANALYTICS SERVICE
// =============================================================================

export class AdvancedBettingAnalyticsService {
  private analyticsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the analytics service
   */
  private async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Advanced Betting Analytics Service initialized',
        category: 'betting.analytics.init',
        level: 'info',
      });

      console.log('Advanced Betting Analytics Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize Advanced Betting Analytics Service: ${error}`);
    }
  }

  // =============================================================================
  // COMPREHENSIVE ANALYTICS
  // =============================================================================

  /**
   * Get comprehensive betting analytics
   */
  async getAdvancedAnalytics(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'): Promise<AdvancedBettingMetrics> {
    const startTime = Date.now();
    
    try {
      const cacheKey = `analytics_${userId}_${timeframe}`;
      const cached = this.analyticsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Get user bets for analysis
      const bets = await this.getUserBetsForAnalysis(userId, timeframe);
      const parlays = await this.getUserParlaysForAnalysis(userId, timeframe);
      
      // Calculate all metrics
      const analytics: AdvancedBettingMetrics = {
        performance: await this.calculatePerformanceMetrics(bets),
        profitability: await this.calculateProfitabilityMetrics(bets),
        riskManagement: await this.calculateRiskMetrics(bets, userId),
        streakAnalysis: this.calculateStreakAnalysis(bets),
        seasonalAnalysis: this.calculateSeasonalAnalysis(bets),
        predictionAccuracy: await this.calculatePredictionAccuracy(bets),
        marketAnalysis: await this.calculateMarketAnalysis(bets),
        recommendations: await this.generateRecommendations(bets, userId),
      };

      // Cache results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now(),
      });

      // Record performance
      console.log(`Analytics calculation took ${Date.now() - startTime}ms`);

      return analytics;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get advanced analytics: ${error}`);
    }
  }

  /**
   * Get betting insights and recommendations
   */
  async getBettingInsights(userId: string): Promise<BettingInsights> {
    try {
      const analytics = await this.getAdvancedAnalytics(userId);
      
      const insights: BettingInsights = {
        keyPerformanceIndicators: this.calculateKPIs(analytics),
        strengthsAndWeaknesses: this.analyzeStrengthsWeaknesses(analytics),
        improvementAreas: this.identifyImprovementAreas(analytics),
        marketOpportunities: await this.identifyMarketOpportunities(analytics),
        riskAlerts: this.generateRiskAlerts(analytics),
      };

      return insights;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get betting insights: ${error}`);
    }
  }

  /**
   * Get real-time performance dashboard data
   */
  async getPerformanceDashboard(userId: string): Promise<{
    liveMetrics: any;
    alerts: RiskAlert[];
    opportunities: OpportunityRecommendation[];
    quickStats: any;
  }> {
    try {
      const analytics = await this.getAdvancedAnalytics(userId, 'week');
      const insights = await this.getBettingInsights(userId);
      
      return {
        liveMetrics: {
          currentROI: analytics.profitability.netROI,
          weeklyProfit: analytics.profitability.totalProfit,
          winRate: analytics.performance.winRate,
          sharpeRatio: analytics.performance.sharpeRatio,
          bankrollHealth: analytics.riskManagement.bankrollManagement.bankrollGrowth,
          momentumScore: analytics.streakAnalysis.momentum.momentumScore,
        },
        alerts: insights.riskAlerts,
        opportunities: analytics.recommendations.opportunities,
        quickStats: {
          totalBets: analytics.performance.totalBets,
          averageBetSize: analytics.performance.averageBetSize,
          largestWin: analytics.performance.largestWin,
          currentStreak: analytics.streakAnalysis.currentStreaks,
          bestSport: this.getBestPerformingSport(analytics),
        },
      };

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get performance dashboard: ${error}`);
    }
  }

  // =============================================================================
  // CALCULATION METHODS
  // =============================================================================

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(bets: Bet[]): Promise<PerformanceMetrics> {
    const settledBets = bets.filter(bet => ['won', 'lost', 'push'].includes(bet.status));
    
    if (settledBets.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    const wins = settledBets.filter(bet => bet.status === 'won').length;
    const pushes = settledBets.filter(bet => bet.status === 'push').length;
    const winRate = (wins / settledBets.length) * 100;
    const pushRate = (pushes / settledBets.length) * 100;

    const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturns = settledBets.reduce((sum, bet) => sum + (bet.actualPayout || 0), 0);
    const totalProfit = totalReturns - totalStaked;
    const unitsSold = totalProfit / (totalStaked / settledBets.length); // Profit in betting units

    const averageOdds = settledBets.reduce((sum, bet) => sum + bet.totalOdds, 0) / settledBets.length;
    const averageBetSize = totalStaked / settledBets.length;

    // Calculate risk-adjusted metrics
    const returns = settledBets.map(bet => ((bet.actualPayout || 0) - bet.stake) / bet.stake);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const returnStdDev = Math.sqrt(returnVariance);
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    // Calculate drawdown
    const maxDrawdown = this.calculateMaxDrawdown(settledBets);
    const calmarRatio = maxDrawdown > 0 ? (totalProfit / totalStaked) / maxDrawdown : 0;

    // Bet size statistics
    const betSizes = settledBets.map(bet => bet.stake);
    const medianBetSize = this.calculateMedian(betSizes);
    const betSizeStdDev = this.calculateStandardDeviation(betSizes);

    // Largest win/loss
    const profits = settledBets.map(bet => (bet.actualPayout || 0) - bet.stake);
    const largestWin = Math.max(...profits);
    const largestLoss = Math.min(...profits);

    return {
      totalBets: settledBets.length,
      winRate,
      pushRate,
      averageOdds,
      unitsSold,
      daily: this.calculateTimeBasedMetrics(settledBets, 'day'),
      weekly: this.calculateTimeBasedMetrics(settledBets, 'week'),
      monthly: this.calculateTimeBasedMetrics(settledBets, 'month'),
      sharpeRatio,
      informationRatio: sharpeRatio, // Simplified
      maxDrawdown,
      calmarRatio,
      averageBetSize,
      medianBetSize,
      betSizeStdDev,
      largestWin,
      largestLoss,
    };
  }

  /**
   * Calculate profitability metrics
   */
  private async calculateProfitabilityMetrics(bets: Bet[]): Promise<ProfitabilityMetrics> {
    const settledBets = bets.filter(bet => ['won', 'lost', 'push'].includes(bet.status));
    
    const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturns = settledBets.reduce((sum, bet) => sum + (bet.actualPayout || 0), 0);
    const totalProfit = totalReturns - totalStaked;
    const netROI = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
    const grossROI = totalStaked > 0 ? ((totalReturns / totalStaked) - 1) * 100 : 0;

    return {
      totalProfit,
      netROI,
      grossROI,
      profitByMonth: this.calculateMonthlyProfit(settledBets),
      profitBySport: this.calculateSportProfit(settledBets),
      profitByBetType: this.calculateBetTypeProfit(settledBets),
      profitByStakeSize: this.calculateStakeSizeProfit(settledBets),
      profitPerBet: settledBets.length > 0 ? totalProfit / settledBets.length : 0,
      profitPerUnit: totalStaked > 0 ? totalProfit / (totalStaked / settledBets.length) : 0,
      closingLineValue: await this.calculateClosingLineValue(settledBets),
      expectedVsActual: this.calculateExpectedVsActual(settledBets),
      taxableIncome: Math.max(0, totalProfit),
      deductibleLosses: Math.min(0, totalProfit),
      netTaxableAmount: Math.max(0, totalProfit),
    };
  }

  /**
   * Calculate risk management metrics
   */
  private async calculateRiskMetrics(bets: Bet[], userId: string): Promise<RiskManagementMetrics> {
    const settledBets = bets.filter(bet => ['won', 'lost', 'push'].includes(bet.status));
    
    // Bankroll analysis (simplified - in production would track actual bankroll)
    const startingBankroll = 10000; // Would come from user settings
    const totalProfit = settledBets.reduce((sum, bet) => sum + ((bet.actualPayout || 0) - bet.stake), 0);
    const currentBankroll = startingBankroll + totalProfit;
    const peakBankroll = this.calculatePeakBankroll(settledBets, startingBankroll);
    const bankrollGrowth = ((currentBankroll - startingBankroll) / startingBankroll) * 100;
    const drawdownFromPeak = ((peakBankroll - currentBankroll) / peakBankroll) * 100;

    // Kelly analysis
    const kellyOptimalBets = settledBets.filter(bet => 
      bet.bankrollPercentage <= this.calculateOptimalKelly(bet)
    ).length;
    
    const averageKellyUtilization = settledBets.reduce((sum, bet) => {
      const optimal = this.calculateOptimalKelly(bet);
      return sum + (bet.bankrollPercentage / optimal);
    }, 0) / settledBets.length;

    // Risk metrics
    const returns = settledBets.map(bet => ((bet.actualPayout || 0) - bet.stake) / bet.stake);
    returns.sort((a, b) => a - b);
    const valueAtRisk95 = returns[Math.floor(returns.length * 0.05)] || 0;
    const conditionalVaR = returns.slice(0, Math.floor(returns.length * 0.05))
      .reduce((sum, r) => sum + r, 0) / Math.floor(returns.length * 0.05) || 0;

    // Position sizing
    const stakes = settledBets.map(bet => bet.stake);
    const averagePositionSize = stakes.reduce((sum, s) => sum + s, 0) / stakes.length;
    const maxPositionSize = Math.max(...stakes);

    return {
      bankrollManagement: {
        startingBankroll,
        currentBankroll,
        peakBankroll,
        bankrollGrowth,
        drawdownFromPeak,
      },
      kellyAnalysis: {
        optimalKellyBets: kellyOptimalBets,
        overBetCount: settledBets.length - kellyOptimalBets,
        underBetCount: 0, // Simplified
        averageKellyUtilization,
      },
      riskMetrics: {
        valueAtRisk95: valueAtRisk95 * 100,
        conditionalVaR: conditionalVaR * 100,
        maximumRisk: Math.min(...returns) * 100,
        riskAdjustedReturn: totalProfit / Math.max(Math.abs(valueAtRisk95 * startingBankroll), 1),
      },
      positionSizing: {
        averagePositionSize,
        maxPositionSize,
        optimalPositionSize: startingBankroll * 0.02, // 2% of bankroll
        positionSizeConsistency: this.calculatePositionSizeConsistency(stakes),
      },
    };
  }

  /**
   * Calculate streak analysis
   */
  private calculateStreakAnalysis(bets: Bet[]): StreakAnalysis {
    const settledBets = bets
      .filter(bet => ['won', 'lost'].includes(bet.status))
      .sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());

    if (settledBets.length === 0) {
      return this.getEmptyStreakAnalysis();
    }

    // Current streaks
    let currentWins = 0;
    let currentLosses = 0;
    let lastResult = '';

    for (let i = settledBets.length - 1; i >= 0; i--) {
      const result = settledBets[i].status;
      if (result !== lastResult && lastResult !== '') {
        break;
      }
      if (result === 'won') currentWins++;
      else if (result === 'lost') currentLosses++;
      lastResult = result;
    }

    // Historical streaks
    const streaks = this.calculateHistoricalStreaks(settledBets);
    
    // Momentum calculation
    const recentBets = settledBets.slice(-10);
    const recentWins = recentBets.filter(bet => bet.status === 'won').length;
    const recentProfit = recentBets.reduce((sum, bet) => sum + ((bet.actualPayout || 0) - bet.stake), 0);
    const momentumScore = ((recentWins / recentBets.length) - 0.5) * 200; // -100 to 100

    return {
      currentStreaks: {
        wins: currentWins,
        losses: currentLosses,
        type: currentWins > 0 ? 'winning' : currentLosses > 0 ? 'losing' : 'mixed',
      },
      historicalStreaks: {
        longestWinStreak: streaks.longestWin,
        longestLossStreak: streaks.longestLoss,
        averageWinStreak: streaks.averageWin,
        averageLossStreak: streaks.averageLoss,
      },
      streakBreaking: {
        winStreakBreakerAnalysis: this.analyzeStreakBreakers(settledBets, 'win'),
        lossRecoveryPatterns: this.analyzeStreakBreakers(settledBets, 'loss'),
      },
      momentum: {
        momentumScore,
        trendDirection: momentumScore > 10 ? 'up' : momentumScore < -10 ? 'down' : 'sideways',
        confidenceLevel: Math.min(Math.abs(momentumScore) / 50, 1) * 100,
      },
    };
  }

  /**
   * Calculate seasonal analysis
   */
  private calculateSeasonalAnalysis(bets: Bet[]): SeasonalAnalysis {
    const settledBets = bets.filter(bet => ['won', 'lost', 'push'].includes(bet.status));
    
    return {
      monthlyPerformance: this.calculateMonthlyPerformance(settledBets),
      weekdayPerformance: this.calculateWeekdayPerformance(settledBets),
      timeOfDayPerformance: this.calculateTimeOfDayPerformance(settledBets),
      seasonalTrends: this.calculateSeasonalTrends(settledBets),
      insights: this.calculateSeasonalInsights(settledBets),
    };
  }

  /**
   * Calculate prediction accuracy metrics
   */
  private async calculatePredictionAccuracy(bets: Bet[]): Promise<PredictionAccuracyMetrics> {
    const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status));
    
    // Overall accuracy
    const correctPredictions = settledBets.filter(bet => bet.status === 'won').length;
    const overallAccuracy = settledBets.length > 0 ? (correctPredictions / settledBets.length) * 100 : 0;

    // Accuracy by sport
    const accuracyBySport: { [sport: string]: number } = {};
    const sportGroups = this.groupBy(settledBets, 'sport');
    
    Object.entries(sportGroups).forEach(([sport, sportBets]) => {
      const wins = sportBets.filter(bet => bet.status === 'won').length;
      accuracyBySport[sport] = (wins / sportBets.length) * 100;
    });

    // Accuracy by bet type
    const accuracyByBetType: { [type: string]: number } = {};
    const betTypeGroups = this.groupBy(settledBets, 'betType');
    
    Object.entries(betTypeGroups).forEach(([type, typeBets]) => {
      const wins = typeBets.filter(bet => bet.status === 'won').length;
      accuracyByBetType[type] = (wins / typeBets.length) * 100;
    });

    // Accuracy by confidence
    const accuracyByConfidence = this.calculateAccuracyByConfidence(settledBets);

    // Calibration analysis
    const calibrationScore = this.calculateCalibrationScore(settledBets);
    const reliabilityDiagram = this.calculateReliabilityDiagram(settledBets);

    // Value add metrics
    const beatsClosingLine = await this.calculateClosingLineValue(settledBets);
    const expectedValueAccuracy = this.calculateExpectedValueAccuracy(settledBets);

    return {
      aiAccuracy: {
        overallAccuracy,
        accuracyBySport,
        accuracyByBetType,
        accuracyByConfidence,
      },
      calibration: {
        calibrationScore,
        overconfidenceRate: this.calculateOverconfidenceRate(settledBets),
        underconfidenceRate: this.calculateUnderconfidenceRate(settledBets),
        reliabilityDiagram,
      },
      valueAdd: {
        beatsClosingLine,
        expectedValueAccuracy,
        profitFromAIPicks: this.calculateAIPickProfit(settledBets),
        aiRecommendationSuccess: this.calculateAIRecommendationSuccess(settledBets),
      },
    };
  }

  /**
   * Calculate market analysis metrics
   */
  private async calculateMarketAnalysis(bets: Bet[]): Promise<MarketAnalysisMetrics> {
    const settledBets = bets.filter(bet => ['won', 'lost', 'push'].includes(bet.status));
    
    return {
      marketBeating: {
        closingLineBeatRate: await this.calculateClosingLineValue(settledBets),
        marketEdgeIdentification: this.calculateMarketEdgeIdentification(settledBets),
        arbitrageOpportunities: 0, // Would require real-time odds data
      },
      lineMovement: {
        favorableMovements: this.calculateFavorableMovements(settledBets),
        unfavorableMovements: this.calculateUnfavorableMovements(settledBets),
        averageLineMovement: this.calculateAverageLineMovement(settledBets),
        optimalTimingScore: this.calculateOptimalTimingScore(settledBets),
      },
      bookmakerAnalysis: {
        profitByBookmaker: this.calculateBookmakerProfits(settledBets),
        bestBookmakerOverall: this.getBestBookmaker(settledBets),
        limitingFactors: ['High win rate', 'Large bet sizes', 'Sharp line shopping'],
      },
      sportSpecific: {
        edgeBySport: this.calculateEdgeBySport(settledBets),
        volumeBySport: this.calculateVolumeBySport(settledBets),
        profitabilitySport: this.calculateProfitabilitySport(settledBets),
      },
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(bets: Bet[], userId: string): Promise<RecommendationEngine> {
    const analytics = await this.getAdvancedAnalytics(userId);
    
    const immediate = this.generateImmediateRecommendations(analytics);
    const strategic = this.generateStrategicRecommendations(analytics);
    const warnings = this.generateWarnings(analytics);
    const opportunities = this.generateOpportunities(analytics);

    const priorityScore = this.calculatePriorityScore(immediate, warnings);
    const confidenceLevel = this.calculateRecommendationConfidence(bets);

    return {
      immediate,
      strategic,
      warnings,
      opportunities,
      priorityScore,
      confidenceLevel,
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  // Data retrieval methods
  private async getUserBetsForAnalysis(userId: string, timeframe: string): Promise<Bet[]> {
    // In production, would query actual bet data
    return this.generateMockBets(userId, 100);
  }

  private async getUserParlaysForAnalysis(userId: string, timeframe: string): Promise<ParlayCard[]> {
    // In production, would query actual parlay data
    return [];
  }

  // Statistical calculation methods
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateStandardDeviation(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(bets: Bet[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;

    bets.forEach(bet => {
      runningTotal += (bet.actualPayout || 0) - bet.stake;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = (peak - runningTotal) / Math.max(peak, 1);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return maxDrawdown * 100;
  }

  private calculateTimeBasedMetrics(bets: Bet[], period: 'day' | 'week' | 'month'): TimeBasedMetrics[] {
    const grouped = this.groupBetsByTime(bets, period);
    
    return Object.entries(grouped).map(([date, dateBets]) => {
      const wins = dateBets.filter(bet => bet.status === 'won').length;
      const totalStaked = dateBets.reduce((sum, bet) => sum + bet.stake, 0);
      const totalReturns = dateBets.reduce((sum, bet) => sum + (bet.actualPayout || 0), 0);
      const profit = totalReturns - totalStaked;
      const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
      const avgStake = totalStaked / dateBets.length;
      const units = profit / avgStake;

      return {
        date,
        bets: dateBets.length,
        wins,
        profit,
        roi,
        units,
      };
    });
  }

  private groupBetsByTime(bets: Bet[], period: 'day' | 'week' | 'month'): { [key: string]: Bet[] } {
    const grouped: { [key: string]: Bet[] } = {};
    
    bets.forEach(bet => {
      let key: string;
      const date = bet.placedAt;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = date.toISOString().slice(0, 7);
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bet);
    });
    
    return grouped;
  }

  private groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as { [key: string]: T[] });
  }

  // Mock data generation for demo
  private generateMockBets(userId: string, count: number): Bet[] {
    const mockBets: Bet[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const betDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const stake = 25 + Math.random() * 200;
      const odds = 1.5 + Math.random() * 3;
      const won = Math.random() > 0.45; // 55% win rate
      
      const bet: Bet = {
        id: `mock_bet_${i}`,
        userId,
        betType: ['single', 'parlay'][Math.floor(Math.random() * 2)] as any,
        sport: ['nba', 'nfl', 'mlb', 'nhl'][Math.floor(Math.random() * 4)] as any,
        selections: [],
        stake,
        potentialPayout: stake * odds,
        totalOdds: odds,
        currency: 'USD',
        status: won ? 'won' : 'lost',
        placedAt: betDate,
        settledAt: new Date(betDate.getTime() + 3 * 60 * 60 * 1000),
        sportsbook: ['DraftKings', 'FanDuel', 'BetMGM'][Math.floor(Math.random() * 3)],
        reference: `REF${i}`,
        tags: ['ai-pick'],
        confidence: 50 + Math.random() * 40,
        expectedValue: -0.05 + Math.random() * 0.2,
        bankrollPercentage: 1 + Math.random() * 4,
        actualPayout: won ? stake * odds : 0,
        profit: won ? stake * (odds - 1) : -stake,
        roi: won ? (odds - 1) * 100 : -100,
        createdAt: betDate,
        updatedAt: betDate,
      };
      
      mockBets.push(bet);
    }
    
    return mockBets;
  }

  // Placeholder methods - would be implemented with real logic in production
  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      totalBets: 0,
      winRate: 0,
      pushRate: 0,
      averageOdds: 0,
      unitsSold: 0,
      daily: [],
      weekly: [],
      monthly: [],
      sharpeRatio: 0,
      informationRatio: 0,
      maxDrawdown: 0,
      calmarRatio: 0,
      averageBetSize: 0,
      medianBetSize: 0,
      betSizeStdDev: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  private getEmptyStreakAnalysis(): StreakAnalysis {
    return {
      currentStreaks: { wins: 0, losses: 0, type: 'mixed' },
      historicalStreaks: { longestWinStreak: 0, longestLossStreak: 0, averageWinStreak: 0, averageLossStreak: 0 },
      streakBreaking: { winStreakBreakerAnalysis: [], lossRecoveryPatterns: [] },
      momentum: { momentumScore: 0, trendDirection: 'sideways', confidenceLevel: 0 },
    };
  }

  // Additional calculation methods would be implemented here...
  private calculateMonthlyProfit(bets: Bet[]): MonthlyProfitData[] { return []; }
  private calculateSportProfit(bets: Bet[]): SportProfitData[] { return []; }
  private calculateBetTypeProfit(bets: Bet[]): BetTypeProfitData[] { return []; }
  private calculateStakeSizeProfit(bets: Bet[]): StakeSizeProfitData[] { return []; }
  private async calculateClosingLineValue(bets: Bet[]): Promise<number> { return 65; }
  private calculateExpectedVsActual(bets: Bet[]): number { return 0.05; }
  private calculateOptimalKelly(bet: Bet): number { return 2; }
  private calculatePeakBankroll(bets: Bet[], starting: number): number { return starting * 1.2; }
  private calculatePositionSizeConsistency(stakes: number[]): number { return 0.8; }
  private calculateHistoricalStreaks(bets: Bet[]): any { return { longestWin: 5, longestLoss: 3, averageWin: 2.5, averageLoss: 2.1 }; }
  private analyzeStreakBreakers(bets: Bet[], type: string): string[] { return ['Low confidence bets', 'Emotional decisions']; }
  private calculateMonthlyPerformance(bets: Bet[]): MonthlyPerformanceData[] { return []; }
  private calculateWeekdayPerformance(bets: Bet[]): WeekdayPerformanceData[] { return []; }
  private calculateTimeOfDayPerformance(bets: Bet[]): TimeOfDayPerformanceData[] { return []; }
  private calculateSeasonalTrends(bets: Bet[]): SeasonalTrendData[] { return []; }
  private calculateSeasonalInsights(bets: Bet[]): SeasonalAnalysis['insights'] { 
    return { bestMonth: 'March', worstMonth: 'August', bestDayOfWeek: 'Sunday', worstDayOfWeek: 'Friday', bestTimeOfDay: 'Evening', seasonalityScore: 0.7 };
  }
  private calculateAccuracyByConfidence(bets: Bet[]): { [range: string]: number } { return { 'High (80%+)': 78.5, 'Medium (60-79%)': 65.2, 'Low (40-59%)': 52.1 }; }
  private calculateCalibrationScore(bets: Bet[]): number { return 0.85; }
  private calculateReliabilityDiagram(bets: Bet[]): CalibrationPoint[] { return []; }
  private calculateOverconfidenceRate(bets: Bet[]): number { return 15.2; }
  private calculateUnderconfidenceRate(bets: Bet[]): number { return 8.7; }
  private calculateAIPickProfit(bets: Bet[]): number { return 0.12; }
  private calculateAIRecommendationSuccess(bets: Bet[]): number { return 72.5; }
  private calculateExpectedValueAccuracy(bets: Bet[]): number { return 0.08; }
  private calculateMarketEdgeIdentification(bets: Bet[]): number { return 0.15; }
  private calculateFavorableMovements(bets: Bet[]): number { return 42; }
  private calculateUnfavorableMovements(bets: Bet[]): number { return 28; }
  private calculateAverageLineMovement(bets: Bet[]): number { return 0.02; }
  private calculateOptimalTimingScore(bets: Bet[]): number { return 68; }
  private calculateBookmakerProfits(bets: Bet[]): { [bookmaker: string]: BookmakerMetrics } { return {}; }
  private getBestBookmaker(bets: Bet[]): string { return 'DraftKings'; }
  private calculateEdgeBySport(bets: Bet[]): { [sport: string]: number } { return { nba: 0.08, nfl: 0.12 }; }
  private calculateVolumeBySport(bets: Bet[]): { [sport: string]: number } { return { nba: 45, nfl: 35 }; }
  private calculateProfitabilitySport(bets: Bet[]): { [sport: string]: number } { return { nba: 0.15, nfl: 0.22 }; }

  private generateImmediateRecommendations(analytics: AdvancedBettingMetrics): ImmediateRecommendation[] {
    const recommendations: ImmediateRecommendation[] = [];
    
    if (analytics.riskManagement.bankrollManagement.drawdownFromPeak > 20) {
      recommendations.push({
        type: 'stop_loss',
        message: 'Consider reducing bet sizes due to recent drawdown',
        urgency: 'high',
        action: 'Reduce bet size by 50% until recovery',
        expectedImpact: 'Reduced risk of further losses',
      });
    }
    
    return recommendations;
  }

  private generateStrategicRecommendations(analytics: AdvancedBettingMetrics): StrategicRecommendation[] { return []; }
  private generateWarnings(analytics: AdvancedBettingMetrics): WarningRecommendation[] { return []; }
  private generateOpportunities(analytics: AdvancedBettingMetrics): OpportunityRecommendation[] { return []; }
  private calculatePriorityScore(immediate: ImmediateRecommendation[], warnings: WarningRecommendation[]): number { return 65; }
  private calculateRecommendationConfidence(bets: Bet[]): number { return 78; }
  private calculateKPIs(analytics: AdvancedBettingMetrics): KPI[] { return []; }
  private analyzeStrengthsWeaknesses(analytics: AdvancedBettingMetrics): StrengthWeaknessAnalysis { 
    return { strengths: [], weaknesses: [], recommendations: [], focus_areas: [] };
  }
  private identifyImprovementAreas(analytics: AdvancedBettingMetrics): ImprovementArea[] { return []; }
  private async identifyMarketOpportunities(analytics: AdvancedBettingMetrics): Promise<MarketOpportunity[]> { return []; }
  private generateRiskAlerts(analytics: AdvancedBettingMetrics): RiskAlert[] { return []; }
  private getBestPerformingSport(analytics: AdvancedBettingMetrics): string { return 'NBA'; }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.analyticsCache.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const advancedBettingAnalyticsService = new AdvancedBettingAnalyticsService();