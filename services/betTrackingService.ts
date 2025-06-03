// =============================================================================
// BET TRACKING SERVICE
// Advanced Bet Management, Tracking, and Analytics
// =============================================================================

import * as Sentry from '@sentry/react-native';

import { optimizedQuery, firebaseOptimizationService } from './firebaseOptimizationService';

// =============================================================================
// INTERFACES
// =============================================================================

export interface Bet {
  id: string;
  userId: string;
  betType: 'single' | 'parlay' | 'system' | 'round_robin';
  sport: 'nba' | 'nfl' | 'mlb' | 'nhl' | 'ncaab' | 'ncaaf' | 'soccer' | 'tennis' | 'mma' | 'boxing';

  // Bet details
  selections: BetSelection[];
  stake: number;
  potentialPayout: number;
  totalOdds: number;
  currency: string;

  // Status and timing
  status: 'pending' | 'won' | 'lost' | 'push' | 'void' | 'cashed_out';
  placedAt: Date;
  settledAt?: Date;
  expiresAt?: Date;

  // Tracking
  sportsbook: string;
  betSlipId?: string;
  reference: string;
  tags: string[];
  notes?: string;

  // Analytics
  confidence: number; // AI confidence in this bet
  expectedValue: number; // EV calculation
  bankrollPercentage: number; // % of bankroll

  // Results
  actualPayout?: number;
  profit?: number;
  roi?: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface BetSelection {
  id: string;
  gameId: string;
  selectionType: 'moneyline' | 'spread' | 'total' | 'prop';

  // Game information
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;

  // Selection details
  selection: string; // "Lakers ML", "Over 210.5", "LeBron Over 25.5 pts"
  odds: number;
  line?: number; // For spreads and totals

  // Prop bet specific
  player?: {
    id: string;
    name: string;
    team: string;
  };
  propType?: string; // "points", "rebounds", "assists"

  // Status
  status: 'pending' | 'won' | 'lost' | 'push' | 'void';
  result?: string;
  actualValue?: number;

  // AI Analysis
  aiPrediction?: number;
  confidence?: number;
  reasoning?: string;
}

export interface BetAnalytics {
  totalBets: number;
  totalStaked: number;
  totalReturns: number;
  netProfit: number;
  overallROI: number;
  winRate: number;
  averageOdds: number;
  averageStake: number;

  // Performance by category
  byBetType: { [key: string]: BetCategoryStats };
  bySport: { [key: string]: BetCategoryStats };
  bySportsbook: { [key: string]: BetCategoryStats };
  byConfidence: { [key: string]: BetCategoryStats };

  // Trends
  monthlyStats: MonthlyBetStats[];
  streaks: {
    currentWin: number;
    currentLoss: number;
    longestWin: number;
    longestLoss: number;
  };

  // Advanced metrics
  sharpeRatio: number;
  kellyBankrollGrowth: number;
  maxDrawdown: number;
  averageHoldingTime: number; // hours between bet and settlement
}

export interface BetCategoryStats {
  bets: number;
  wins: number;
  losses: number;
  pushes: number;
  staked: number;
  returns: number;
  profit: number;
  roi: number;
  winRate: number;
  averageOdds: number;
}

export interface MonthlyBetStats {
  month: string; // "2024-01"
  bets: number;
  staked: number;
  returns: number;
  profit: number;
  roi: number;
  winRate: number;
}

export interface BetFilters {
  status?: Bet['status'][];
  betType?: Bet['betType'][];
  sport?: Bet['sport'][];
  sportsbook?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minStake?: number;
  maxStake?: number;
  minOdds?: number;
  maxOdds?: number;
  tags?: string[];
}

export interface BankrollManagement {
  totalBankroll: number;
  availableBankroll: number;
  lockedInBets: number;
  recommendedBetSize: number;
  kellyPercentage: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxBetPercentage: number;
}

// =============================================================================
// BET TRACKING SERVICE
// =============================================================================

export class BetTrackingService {
  private readonly collectionName = 'user_bets';
  private betCache = new Map<string, Bet>();
  private analyticsCache: { data: BetAnalytics; timestamp: number } | null = null;
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the bet tracking service
   */
  private async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Bet Tracking Service initialized',
        category: 'bet.tracking.init',
        level: 'info',
      });

      console.log('Bet Tracking Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize Bet Tracking Service: ${error}`);
    }
  }

  // =============================================================================
  // BET MANAGEMENT
  // =============================================================================

  /**
   * Place a new bet
   */
  async placeBet(betData: Omit<Bet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const startTime = Date.now();

    try {
      const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const bet: Bet = {
        ...betData,
        id: betId,
        reference: betData.reference || this.generateBetReference(),
        createdAt: now,
        updatedAt: now,
      };

      // Validate bet
      this.validateBet(bet);

      // Calculate analytics
      bet.expectedValue = await this.calculateExpectedValue(bet);
      bet.bankrollPercentage = this.calculateBankrollPercentage(bet.stake, betData.userId);

      // Store bet using optimized query
      await this.storeBet(bet);

      // Update cache
      this.betCache.set(betId, bet);
      this.invalidateAnalyticsCache();

      // Record performance
      firebaseOptimizationService.recordQueryPerformance('bet_place', Date.now() - startTime);

      Sentry.addBreadcrumb({
        message: 'Bet placed successfully',
        category: 'bet.tracking.place',
        level: 'info',
        data: {
          betId,
          betType: bet.betType,
          sport: bet.sport,
          stake: bet.stake,
          totalOdds: bet.totalOdds,
        },
      });

      return betId;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to place bet: ${error}`);
    }
  }

  /**
   * Update bet status
   */
  async updateBetStatus(
    betId: string,
    status: Bet['status'],
    settledAt?: Date,
    actualPayout?: number
  ): Promise<void> {
    try {
      const bet = await this.getBetById(betId);
      if (!bet) {
        throw new Error(`Bet not found: ${betId}`);
      }

      const updates: Partial<Bet> = {
        status,
        updatedAt: new Date(),
      };

      if (settledAt) {
        updates.settledAt = settledAt;
      }

      if (actualPayout !== undefined) {
        updates.actualPayout = actualPayout;
        updates.profit = actualPayout - bet.stake;
        updates.roi = ((actualPayout - bet.stake) / bet.stake) * 100;
      }

      await this.updateBet(betId, updates);

      // Update cache
      this.betCache.set(betId, { ...bet, ...updates });
      this.invalidateAnalyticsCache();

      Sentry.addBreadcrumb({
        message: 'Bet status updated',
        category: 'bet.tracking.update',
        level: 'info',
        data: { betId, status, actualPayout },
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to update bet status: ${error}`);
    }
  }

  /**
   * Get user's bets with filters
   */
  async getUserBets(
    userId: string,
    filters: BetFilters = {},
    pageSize: number = 25,
    lastBetId?: string
  ): Promise<{ bets: Bet[]; hasMore: boolean; lastBetId?: string }> {
    const startTime = Date.now();

    try {
      // Build query constraints
      const queryBuilder = optimizedQuery(this.collectionName).where('userId', '==', userId);

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        queryBuilder.where('status', 'in', filters.status);
      }

      if (filters.betType && filters.betType.length > 0) {
        queryBuilder.where('betType', 'in', filters.betType);
      }

      if (filters.sport && filters.sport.length > 0) {
        queryBuilder.where('sport', 'in', filters.sport);
      }

      if (filters.dateRange) {
        queryBuilder
          .where('placedAt', '>=', filters.dateRange.start)
          .where('placedAt', '<=', filters.dateRange.end);
      }

      // Execute paginated query
      const result = await queryBuilder
        .orderBy('placedAt', 'desc')
        .executePaginated<Bet>(pageSize, undefined, {
          useCache: true,
          cacheTtl: 60000, // 1 minute cache
          enableMetrics: true,
        });

      // Apply additional filters that can't be done in Firestore
      let filteredBets = result.data;

      if (filters.minStake || filters.maxStake) {
        filteredBets = filteredBets.filter(bet => {
          if (filters.minStake && bet.stake < filters.minStake) return false;
          if (filters.maxStake && bet.stake > filters.maxStake) return false;
          return true;
        });
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredBets = filteredBets.filter(bet =>
          bet.tags.some(tag => filters.tags!.includes(tag))
        );
      }

      // Record performance
      firebaseOptimizationService.recordQueryPerformance('user_bets', Date.now() - startTime);

      return {
        bets: filteredBets,
        hasMore: result.hasMore,
        lastBetId: result.lastDoc?.id,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get user bets: ${error}`);
    }
  }

  /**
   * Get bet by ID
   */
  async getBetById(betId: string): Promise<Bet | null> {
    try {
      // Check cache first
      const cached = this.betCache.get(betId);
      if (cached) {
        return cached;
      }

      // Query database
      const bet = await firebaseOptimizationService.optimizedDocumentQuery<Bet>(
        `${this.collectionName}/${betId}`,
        {
          useCache: true,
          cacheTtl: 300000, // 5 minutes cache
          enableMetrics: true,
        }
      );

      if (bet) {
        this.betCache.set(betId, bet);
      }

      return bet;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  // =============================================================================
  // BET ANALYTICS
  // =============================================================================

  /**
   * Get comprehensive bet analytics for user
   */
  async getBetAnalytics(
    userId: string,
    timeframe?: 'week' | 'month' | 'year' | 'all'
  ): Promise<BetAnalytics> {
    const startTime = Date.now();

    try {
      // Check cache
      if (this.analyticsCache && Date.now() - this.analyticsCache.timestamp < this.cacheTimeout) {
        return this.analyticsCache.data;
      }

      // Get all user bets for analytics
      const bets = await this.getAllUserBets(userId, timeframe);

      // Calculate analytics
      const analytics = this.calculateBetAnalytics(bets);

      // Cache results
      this.analyticsCache = {
        data: analytics,
        timestamp: Date.now(),
      };

      // Record performance
      firebaseOptimizationService.recordQueryPerformance('bet_analytics', Date.now() - startTime);

      return analytics;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get bet analytics: ${error}`);
    }
  }

  /**
   * Get bankroll management recommendations
   */
  async getBankrollManagement(userId: string): Promise<BankrollManagement> {
    try {
      const analytics = await this.getBetAnalytics(userId);
      const activeBets = await this.getActiveBets(userId);

      const totalBankroll = 10000; // This would come from user settings
      const lockedInBets = activeBets.reduce((sum, bet) => sum + bet.stake, 0);
      const availableBankroll = totalBankroll - lockedInBets;

      // Calculate Kelly percentage based on recent performance
      const kellyPercentage = this.calculateKellyPercentage(analytics);
      const recommendedBetSize = availableBankroll * kellyPercentage;

      return {
        totalBankroll,
        availableBankroll,
        lockedInBets,
        recommendedBetSize,
        kellyPercentage: kellyPercentage * 100,
        riskTolerance: this.determineRiskTolerance(analytics),
        maxBetPercentage: 5, // Max 5% of bankroll per bet
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get bankroll management: ${error}`);
    }
  }

  /**
   * Get bet performance insights
   */
  async getBetInsights(userId: string): Promise<{
    strongestSports: string[];
    weakestSports: string[];
    bestBetTypes: string[];
    worstBetTypes: string[];
    optimalStakeRange: { min: number; max: number };
    recommendations: string[];
  }> {
    try {
      const analytics = await this.getBetAnalytics(userId);

      // Find strongest and weakest performers
      const sportPerformance = Object.entries(analytics.bySport).sort(
        ([, a], [, b]) => b.roi - a.roi
      );

      const betTypePerformance = Object.entries(analytics.byBetType).sort(
        ([, a], [, b]) => b.roi - a.roi
      );

      const strongestSports = sportPerformance.slice(0, 3).map(([sport]) => sport);
      const weakestSports = sportPerformance.slice(-3).map(([sport]) => sport);
      const bestBetTypes = betTypePerformance.slice(0, 2).map(([type]) => type);
      const worstBetTypes = betTypePerformance.slice(-2).map(([type]) => type);

      // Determine optimal stake range
      const optimalStakeRange = this.calculateOptimalStakeRange(analytics);

      // Generate recommendations
      const recommendations = this.generateBetRecommendations(analytics);

      return {
        strongestSports,
        weakestSports,
        bestBetTypes,
        worstBetTypes,
        optimalStakeRange,
        recommendations,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get bet insights: ${error}`);
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Validate bet data
   */
  private validateBet(bet: Bet): void {
    if (!bet.userId) {
      throw new Error('User ID is required');
    }

    if (bet.stake <= 0) {
      throw new Error('Stake must be greater than 0');
    }

    if (bet.selections.length === 0) {
      throw new Error('At least one selection is required');
    }

    if (bet.betType === 'parlay' && bet.selections.length < 2) {
      throw new Error('Parlay bets require at least 2 selections');
    }

    if (bet.totalOdds <= 0) {
      throw new Error('Total odds must be greater than 0');
    }
  }

  /**
   * Generate bet reference
   */
  private generateBetReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BET-${timestamp.slice(-6)}-${random}`;
  }

  /**
   * Calculate expected value
   */
  private async calculateExpectedValue(bet: Bet): Promise<number> {
    // Simplified EV calculation - in production would use more sophisticated models
    let totalEV = 0;

    for (const selection of bet.selections) {
      if (selection.aiPrediction && selection.confidence) {
        const impliedProbability = 1 / selection.odds;
        const aiProbability = selection.confidence / 100;
        const selectionEV = aiProbability * selection.odds - 1;
        totalEV += selectionEV;
      }
    }

    return totalEV / bet.selections.length;
  }

  /**
   * Calculate bankroll percentage
   */
  private calculateBankrollPercentage(stake: number, userId: string): number {
    const totalBankroll = 10000; // This would come from user settings
    return (stake / totalBankroll) * 100;
  }

  /**
   * Store bet in database
   */
  private async storeBet(bet: Bet): Promise<void> {
    // In production, this would use Firebase write operations
    console.log('Storing bet:', bet.id);
  }

  /**
   * Update bet in database
   */
  private async updateBet(betId: string, updates: Partial<Bet>): Promise<void> {
    // In production, this would use Firebase update operations
    console.log('Updating bet:', betId, updates);
  }

  /**
   * Get all user bets for analytics
   */
  private async getAllUserBets(userId: string, timeframe?: string): Promise<Bet[]> {
    // In production, this would query all bets for the user within timeframe
    // For now, return mock data
    return this.generateMockBets(userId);
  }

  /**
   * Get active bets
   */
  private async getActiveBets(userId: string): Promise<Bet[]> {
    const result = await this.getUserBets(userId, { status: ['pending'] });
    return result.bets;
  }

  /**
   * Calculate comprehensive bet analytics
   */
  private calculateBetAnalytics(bets: Bet[]): BetAnalytics {
    const settledBets = bets.filter(bet => ['won', 'lost', 'push'].includes(bet.status));

    if (settledBets.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturns = settledBets.reduce((sum, bet) => sum + (bet.actualPayout || 0), 0);
    const netProfit = totalReturns - totalStaked;
    const overallROI = (netProfit / totalStaked) * 100;

    const wonBets = settledBets.filter(bet => bet.status === 'won');
    const winRate = (wonBets.length / settledBets.length) * 100;

    const averageOdds =
      settledBets.reduce((sum, bet) => sum + bet.totalOdds, 0) / settledBets.length;
    const averageStake = totalStaked / settledBets.length;

    return {
      totalBets: settledBets.length,
      totalStaked,
      totalReturns,
      netProfit,
      overallROI,
      winRate,
      averageOdds,
      averageStake,
      byBetType: this.calculateCategoryStats(settledBets, 'betType'),
      bySport: this.calculateCategoryStats(settledBets, 'sport'),
      bySportsbook: this.calculateCategoryStats(settledBets, 'sportsbook'),
      byConfidence: this.calculateConfidenceStats(settledBets),
      monthlyStats: this.calculateMonthlyStats(settledBets),
      streaks: this.calculateStreaks(settledBets),
      sharpeRatio: this.calculateSharpeRatio(settledBets),
      kellyBankrollGrowth: this.calculateKellyGrowth(settledBets),
      maxDrawdown: this.calculateMaxDrawdown(settledBets),
      averageHoldingTime: this.calculateAverageHoldingTime(settledBets),
    };
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(
    bets: Bet[],
    category: keyof Bet
  ): { [key: string]: BetCategoryStats } {
    const stats: { [key: string]: BetCategoryStats } = {};

    bets.forEach(bet => {
      const key = String(bet[category]);
      if (!stats[key]) {
        stats[key] = {
          bets: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          staked: 0,
          returns: 0,
          profit: 0,
          roi: 0,
          winRate: 0,
          averageOdds: 0,
        };
      }

      const stat = stats[key];
      stat.bets++;
      stat.staked += bet.stake;
      stat.returns += bet.actualPayout || 0;

      if (bet.status === 'won') stat.wins++;
      else if (bet.status === 'lost') stat.losses++;
      else if (bet.status === 'push') stat.pushes++;
    });

    // Calculate derived metrics
    Object.values(stats).forEach(stat => {
      stat.profit = stat.returns - stat.staked;
      stat.roi = stat.staked > 0 ? (stat.profit / stat.staked) * 100 : 0;
      stat.winRate = stat.bets > 0 ? (stat.wins / stat.bets) * 100 : 0;
    });

    return stats;
  }

  /**
   * Calculate confidence-based statistics
   */
  private calculateConfidenceStats(bets: Bet[]): { [key: string]: BetCategoryStats } {
    const ranges = {
      'High (80%+)': bets.filter(bet => bet.confidence >= 80),
      'Medium (60-79%)': bets.filter(bet => bet.confidence >= 60 && bet.confidence < 80),
      'Low (40-59%)': bets.filter(bet => bet.confidence >= 40 && bet.confidence < 60),
      'Very Low (<40%)': bets.filter(bet => bet.confidence < 40),
    };

    const stats: { [key: string]: BetCategoryStats } = {};

    Object.entries(ranges).forEach(([range, rangeBets]) => {
      if (rangeBets.length > 0) {
        stats[range] = this.calculateStatsForBets(rangeBets);
      }
    });

    return stats;
  }

  /**
   * Calculate statistics for a subset of bets
   */
  private calculateStatsForBets(bets: Bet[]): BetCategoryStats {
    const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturns = bets.reduce((sum, bet) => sum + (bet.actualPayout || 0), 0);
    const wins = bets.filter(bet => bet.status === 'won').length;
    const losses = bets.filter(bet => bet.status === 'lost').length;
    const pushes = bets.filter(bet => bet.status === 'push').length;
    const averageOdds = bets.reduce((sum, bet) => sum + bet.totalOdds, 0) / bets.length;

    return {
      bets: bets.length,
      wins,
      losses,
      pushes,
      staked: totalStaked,
      returns: totalReturns,
      profit: totalReturns - totalStaked,
      roi: totalStaked > 0 ? ((totalReturns - totalStaked) / totalStaked) * 100 : 0,
      winRate: bets.length > 0 ? (wins / bets.length) * 100 : 0,
      averageOdds,
    };
  }

  /**
   * Calculate monthly statistics
   */
  private calculateMonthlyStats(bets: Bet[]): MonthlyBetStats[] {
    const monthlyData: { [month: string]: Bet[] } = {};

    bets.forEach(bet => {
      const month = bet.placedAt.toISOString().slice(0, 7); // "2024-01"
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(bet);
    });

    return Object.entries(monthlyData)
      .map(([month, monthBets]) => {
        const stats = this.calculateStatsForBets(monthBets);
        return {
          month,
          bets: stats.bets,
          staked: stats.staked,
          returns: stats.returns,
          profit: stats.profit,
          roi: stats.roi,
          winRate: stats.winRate,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate win/loss streaks
   */
  private calculateStreaks(bets: Bet[]): BetAnalytics['streaks'] {
    const sortedBets = [...bets].sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());

    let currentWin = 0;
    let currentLoss = 0;
    let longestWin = 0;
    let longestLoss = 0;
    let tempWin = 0;
    let tempLoss = 0;

    sortedBets.forEach(bet => {
      if (bet.status === 'won') {
        tempWin++;
        tempLoss = 0;
        longestWin = Math.max(longestWin, tempWin);
      } else if (bet.status === 'lost') {
        tempLoss++;
        tempWin = 0;
        longestLoss = Math.max(longestLoss, tempLoss);
      }
    });

    // Current streaks are the temp values
    currentWin = tempWin;
    currentLoss = tempLoss;

    return {
      currentWin,
      currentLoss,
      longestWin,
      longestLoss,
    };
  }

  /**
   * Calculate Kelly percentage
   */
  private calculateKellyPercentage(analytics: BetAnalytics): number {
    if (analytics.totalBets === 0) return 0.01; // 1% default

    const winRate = analytics.winRate / 100;
    const averageOdds = analytics.averageOdds;

    // Kelly criterion: f = (bp - q) / b
    // where b = odds-1, p = win probability, q = loss probability
    const kellyPercentage = (winRate * averageOdds - (1 - winRate)) / averageOdds;

    // Cap at 5% to be conservative
    return Math.max(0.01, Math.min(0.05, kellyPercentage));
  }

  /**
   * Determine risk tolerance
   */
  private determineRiskTolerance(analytics: BetAnalytics): BankrollManagement['riskTolerance'] {
    if (analytics.sharpeRatio > 1.5 && analytics.winRate > 55) {
      return 'aggressive';
    } else if (analytics.sharpeRatio > 0.8 && analytics.winRate > 50) {
      return 'moderate';
    } else {
      return 'conservative';
    }
  }

  /**
   * Calculate optimal stake range
   */
  private calculateOptimalStakeRange(analytics: BetAnalytics): { min: number; max: number } {
    const avgStake = analytics.averageStake;

    // Base on performance - better performance allows higher stakes
    const performanceMultiplier =
      analytics.overallROI > 10 ? 1.5 : analytics.overallROI > 0 ? 1.2 : 0.8;

    return {
      min: Math.max(10, avgStake * 0.5 * performanceMultiplier),
      max: Math.min(500, avgStake * 2 * performanceMultiplier),
    };
  }

  /**
   * Generate betting recommendations
   */
  private generateBetRecommendations(analytics: BetAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.winRate < 45) {
      recommendations.push('Consider reducing bet sizes until performance improves');
    }

    if (analytics.overallROI > 15) {
      recommendations.push('Excellent performance! Consider gradually increasing stakes');
    }

    if (analytics.sharpeRatio < 0.5) {
      recommendations.push('Focus on higher confidence bets to improve risk-adjusted returns');
    }

    // Find best performing categories
    const bestSport = Object.entries(analytics.bySport).sort(([, a], [, b]) => b.roi - a.roi)[0];

    if (bestSport && bestSport[1].roi > 20) {
      recommendations.push(`Consider focusing more on ${bestSport[0]} - your strongest sport`);
    }

    return recommendations;
  }

  /**
   * Calculate additional analytics metrics
   */
  private calculateSharpeRatio(bets: Bet[]): number {
    if (bets.length < 10) return 0;

    const returns = bets.map(bet => bet.roi || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  private calculateKellyGrowth(bets: Bet[]): number {
    // Simplified Kelly growth calculation
    return 0;
  }

  private calculateMaxDrawdown(bets: Bet[]): number {
    // Calculate maximum drawdown from peak
    return 0;
  }

  private calculateAverageHoldingTime(bets: Bet[]): number {
    const settledBets = bets.filter(bet => bet.settledAt);
    if (settledBets.length === 0) return 0;

    const totalHours = settledBets.reduce((sum, bet) => {
      const hours = (bet.settledAt!.getTime() - bet.placedAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / settledBets.length;
  }

  /**
   * Get empty analytics for new users
   */
  private getEmptyAnalytics(): BetAnalytics {
    return {
      totalBets: 0,
      totalStaked: 0,
      totalReturns: 0,
      netProfit: 0,
      overallROI: 0,
      winRate: 0,
      averageOdds: 0,
      averageStake: 0,
      byBetType: {},
      bySport: {},
      bySportsbook: {},
      byConfidence: {},
      monthlyStats: [],
      streaks: {
        currentWin: 0,
        currentLoss: 0,
        longestWin: 0,
        longestLoss: 0,
      },
      sharpeRatio: 0,
      kellyBankrollGrowth: 0,
      maxDrawdown: 0,
      averageHoldingTime: 0,
    };
  }

  /**
   * Generate mock bets for demo
   */
  private generateMockBets(userId: string): Bet[] {
    const mockBets: Bet[] = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const betDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const bet: Bet = {
        id: `mock_bet_${i}`,
        userId,
        betType: ['single', 'parlay'][Math.floor(Math.random() * 2)] as any,
        sport: ['nba', 'nfl', 'mlb'][Math.floor(Math.random() * 3)] as any,
        selections: [
          {
            id: `sel_${i}`,
            gameId: `game_${i}`,
            selectionType: 'moneyline',
            homeTeam: 'Lakers',
            awayTeam: 'Warriors',
            gameDate: betDate,
            selection: 'Lakers ML',
            odds: 1.8 + Math.random() * 2,
            status: Math.random() > 0.5 ? 'won' : 'lost',
          },
        ],
        stake: 50 + Math.random() * 200,
        potentialPayout: 0,
        totalOdds: 1.8 + Math.random() * 2,
        currency: 'USD',
        status: Math.random() > 0.5 ? 'won' : 'lost',
        placedAt: betDate,
        settledAt: new Date(betDate.getTime() + 3 * 60 * 60 * 1000),
        sportsbook: 'DraftKings',
        reference: `REF${i}`,
        tags: ['ai-pick'],
        confidence: 60 + Math.random() * 30,
        expectedValue: -0.05 + Math.random() * 0.15,
        bankrollPercentage: 2 + Math.random() * 3,
        createdAt: betDate,
        updatedAt: betDate,
      };

      bet.potentialPayout = bet.stake * bet.totalOdds;
      bet.actualPayout = bet.status === 'won' ? bet.potentialPayout : 0;
      bet.profit = bet.actualPayout - bet.stake;
      bet.roi = (bet.profit / bet.stake) * 100;

      mockBets.push(bet);
    }

    return mockBets;
  }

  /**
   * Invalidate analytics cache
   */
  private invalidateAnalyticsCache(): void {
    this.analyticsCache = null;
  }

  /**
   * Clear bet cache
   */
  clearCache(): void {
    this.betCache.clear();
    this.invalidateAnalyticsCache();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const betTrackingService = new BetTrackingService();
