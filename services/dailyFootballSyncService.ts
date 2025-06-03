// =============================================================================
// DAILY FOOTBALL SYNC SERVICE
// Unified Daily Updates for NFL & College Football with Optimization
// =============================================================================

import * as admin from 'firebase-admin';

import { CollegeFootballDataSyncService } from './collegefootball/collegefootballDataSyncService';
import { NFLDataSyncService } from './nfl/nflDataSyncService';
import { initSentry } from './sentryConfig';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface FootballSyncOptions {
  enableNFL: boolean;
  enableCFB: boolean;
  enableRealTimeUpdates: boolean;
  enableAdvancedCaching: boolean;
  syncPriority: 'speed' | 'accuracy' | 'cost-optimized';
  customSchedules?: {
    nfl?: string; // Cron pattern
    cfb?: string; // Cron pattern
  };
}

export interface DailySyncReport {
  timestamp: Date;
  nflSync: {
    status: 'success' | 'partial' | 'failed';
    duration: number;
    recordsProcessed: number;
    errors: string[];
  };
  cfbSync: {
    status: 'success' | 'partial' | 'failed';
    duration: number;
    recordsProcessed: number;
    errors: string[];
  };
  cacheStats: {
    hitRate: number;
    missRate: number;
    apiCallsSaved: number;
    costSavings: number;
  };
  performanceMetrics: {
    totalDuration: number;
    averageResponseTime: number;
    memoryUsage: number;
    errorRate: number;
  };
}

export interface CacheStrategy {
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
  expiration: number;
  priority: 'high' | 'medium' | 'low';
  refreshOnExpiry: boolean;
}

export class DailyFootballSyncService {
  private nflService: NFLDataSyncService;
  private cfbService: CollegeFootballDataSyncService;
  private db: admin.firestore.Firestore;
  private options: FootballSyncOptions;
  private syncStartTime: number = 0;

  // Advanced Caching Strategy Configuration
  private readonly CACHE_STRATEGIES: Record<string, CacheStrategy> = {
    live_scores: {
      strategy: 'network-first',
      expiration: 30000, // 30 seconds during games
      priority: 'high',
      refreshOnExpiry: true,
    },
    injury_reports: {
      strategy: 'network-first',
      expiration: 300000, // 5 minutes
      priority: 'high',
      refreshOnExpiry: true,
    },
    weather_data: {
      strategy: 'cache-first',
      expiration: 900000, // 15 minutes
      priority: 'medium',
      refreshOnExpiry: false,
    },
    team_stats: {
      strategy: 'cache-first',
      expiration: 3600000, // 1 hour
      priority: 'medium',
      refreshOnExpiry: false,
    },
    player_stats: {
      strategy: 'cache-first',
      expiration: 7200000, // 2 hours
      priority: 'medium',
      refreshOnExpiry: false,
    },
    recruiting_data: {
      strategy: 'cache-first',
      expiration: 86400000, // 24 hours
      priority: 'low',
      refreshOnExpiry: false,
    },
    historical_data: {
      strategy: 'cache-only',
      expiration: 604800000, // 7 days
      priority: 'low',
      refreshOnExpiry: false,
    },
    line_movements: {
      strategy: 'network-first',
      expiration: 60000, // 1 minute
      priority: 'high',
      refreshOnExpiry: true,
    },
    transfer_portal: {
      strategy: 'network-first',
      expiration: 1800000, // 30 minutes
      priority: 'medium',
      refreshOnExpiry: true,
    },
    coaching_changes: {
      strategy: 'network-first',
      expiration: 3600000, // 1 hour
      priority: 'medium',
      refreshOnExpiry: true,
    },
  };

  constructor(
    options: FootballSyncOptions = {
      enableNFL: true,
      enableCFB: true,
      enableRealTimeUpdates: true,
      enableAdvancedCaching: true,
      syncPriority: 'cost-optimized',
    }
  ) {
    this.options = options;
    this.db = admin.firestore();
    this.nflService = new NFLDataSyncService();
    this.cfbService = new CollegeFootballDataSyncService();
  }

  /**
   * Execute comprehensive daily football sync
   */
  async executeDailySync(): Promise<DailySyncReport> {
    this.syncStartTime = Date.now();
    const report: DailySyncReport = {
      timestamp: new Date(),
      nflSync: { status: 'failed', duration: 0, recordsProcessed: 0, errors: [] },
      cfbSync: { status: 'failed', duration: 0, recordsProcessed: 0, errors: [] },
      cacheStats: { hitRate: 0, missRate: 0, apiCallsSaved: 0, costSavings: 0 },
      performanceMetrics: {
        totalDuration: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        errorRate: 0,
      },
    };

    try {
      Sentry.addBreadcrumb({
        message: 'Starting daily football sync',
        level: 'info',
        data: { options: this.options },
      });

      // Optimize sync order based on priority
      if (this.options.syncPriority === 'speed') {
        // Parallel execution for maximum speed
        const [nflResult, cfbResult] = await Promise.allSettled([
          this.options.enableNFL ? this.executeNFLSync() : Promise.resolve(null),
          this.options.enableCFB ? this.executeCFBSync() : Promise.resolve(null),
        ]);

        report.nflSync = this.processSettledResult(nflResult, 'NFL');
        report.cfbSync = this.processSettledResult(cfbResult, 'CFB');
      } else {
        // Sequential execution for cost optimization
        if (this.options.enableNFL) {
          report.nflSync = await this.executeNFLSync();
        }
        if (this.options.enableCFB) {
          report.cfbSync = await this.executeCFBSync();
        }
      }

      // Generate performance metrics
      report.performanceMetrics = await this.generatePerformanceMetrics();
      report.cacheStats = await this.getCacheStatistics();

      // Store sync report
      await this.storeSyncReport(report);

      console.log('Daily football sync completed successfully');
      Sentry.captureMessage('Daily football sync completed', 'info');

      return report;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Daily football sync failed: ${error.message}`);
    }
  }

  /**
   * Execute NFL-specific daily sync with optimizations
   */
  private async executeNFLSync(): Promise<DailySyncReport['nflSync']> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    const errors: string[] = [];

    try {
      Sentry.addBreadcrumb({
        message: 'Starting NFL daily sync',
        level: 'info',
      });

      // Phase 1: High-priority real-time data
      if (this.isGameDay('nfl')) {
        await this.syncWithOptimization(() => this.nflService.syncLiveScores(), 'live_scores');
        recordsProcessed += 16; // 32 teams, approximate games
      }

      // Phase 2: Injury reports (always critical)
      try {
        await this.syncWithOptimization(
          () => this.nflService.syncInjuryReports(),
          'injury_reports'
        );
        recordsProcessed += 32; // One report per team
      } catch (error) {
        errors.push(`Injury reports sync failed: ${error.message}`);
      }

      // Phase 3: Weather data for outdoor games
      if (this.options.enableRealTimeUpdates) {
        try {
          await this.syncWithOptimization(() => this.nflService.syncWeatherData(), 'weather_data');
          recordsProcessed += 20; // Approximately 20 outdoor stadiums
        } catch (error) {
          errors.push(`Weather sync failed: ${error.message}`);
        }
      }

      // Phase 4: Standard data updates
      await this.syncWithOptimization(() => this.nflService.syncGames(), 'team_stats');
      recordsProcessed += 272; // 17 weeks * 16 games

      await this.syncWithOptimization(() => this.nflService.syncStandings(), 'team_stats');
      recordsProcessed += 32;

      // Phase 5: Player statistics (less frequent)
      if (this.shouldSyncPlayerStats()) {
        await this.syncWithOptimization(() => this.nflService.syncPlayers(), 'player_stats');
        recordsProcessed += 1600; // Approximate active players
      }

      const duration = Date.now() - startTime;
      console.log(`NFL sync completed in ${duration}ms, processed ${recordsProcessed} records`);

      return {
        status: errors.length === 0 ? 'success' : errors.length < 3 ? 'partial' : 'failed',
        duration,
        recordsProcessed,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(error.message);

      Sentry.captureException(error);
      return {
        status: 'failed',
        duration,
        recordsProcessed,
        errors,
      };
    }
  }

  /**
   * Execute College Football daily sync with optimizations
   */
  private async executeCFBSync(): Promise<DailySyncReport['cfbSync']> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    const errors: string[] = [];

    try {
      Sentry.addBreadcrumb({
        message: 'Starting CFB daily sync',
        level: 'info',
      });

      // Phase 1: Transfer portal activity (daily priority)
      try {
        await this.syncWithOptimization(
          () => this.cfbService.syncTransferPortalActivity(),
          'transfer_portal'
        );
        recordsProcessed += 50; // Daily transfer activity
      } catch (error) {
        errors.push(`Transfer portal sync failed: ${error.message}`);
      }

      // Phase 2: Coaching changes (high impact)
      try {
        await this.syncWithOptimization(
          () => this.cfbService.syncCoachingChanges(),
          'coaching_changes'
        );
        recordsProcessed += 10; // Coaching changes
      } catch (error) {
        errors.push(`Coaching changes sync failed: ${error.message}`);
      }

      // Phase 3: Rankings updates (important during season)
      if (this.isCollegeFootballSeason()) {
        try {
          await this.syncWithOptimization(() => this.cfbService.syncRankings(), 'team_stats');
          recordsProcessed += 130; // FBS teams
        } catch (error) {
          errors.push(`Rankings sync failed: ${error.message}`);
        }
      }

      // Phase 4: Recruiting updates (daily during recruiting periods)
      if (this.isRecruitingSeason()) {
        try {
          await this.syncWithOptimization(
            () => this.cfbService.syncRecruitingData(),
            'recruiting_data'
          );
          recordsProcessed += 130; // FBS teams recruiting data
        } catch (error) {
          errors.push(`Recruiting sync failed: ${error.message}`);
        }
      }

      // Phase 5: Game data and conference updates
      await this.syncWithOptimization(() => this.cfbService.syncConferenceData(), 'team_stats');
      recordsProcessed += 10; // Major conferences

      await this.syncWithOptimization(
        () => this.cfbService.syncAllCollegeFootballData(),
        'team_stats'
      );
      recordsProcessed += 130; // All FBS teams

      const duration = Date.now() - startTime;
      console.log(`CFB sync completed in ${duration}ms, processed ${recordsProcessed} records`);

      return {
        status: errors.length === 0 ? 'success' : errors.length < 3 ? 'partial' : 'failed',
        duration,
        recordsProcessed,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(error.message);

      Sentry.captureException(error);
      return {
        status: 'failed',
        duration,
        recordsProcessed,
        errors,
      };
    }
  }

  /**
   * Execute sync with advanced caching and optimization
   */
  private async syncWithOptimization<T>(
    syncFunction: () => Promise<T>,
    cacheKey: string
  ): Promise<T> {
    const strategy = this.CACHE_STRATEGIES[cacheKey];

    if (!strategy || !this.options.enableAdvancedCaching) {
      return await syncFunction();
    }

    const cacheDoc = await this.db.collection('football_cache').doc(cacheKey).get();

    const now = Date.now();
    const cachedData = cacheDoc.exists ? cacheDoc.data() : null;
    const isExpired = !cachedData || now - cachedData.timestamp > strategy.expiration;

    switch (strategy.strategy) {
      case 'cache-first':
        if (cachedData && !isExpired) {
          return cachedData.data;
        }
        break;

      case 'cache-only':
        if (cachedData) {
          return cachedData.data;
        }
        throw new Error(`No cached data available for ${cacheKey}`);

      case 'network-only':
        // Always fetch fresh data
        break;

      case 'network-first':
      default:
        // Proceed to fetch fresh data
        break;
    }

    // Fetch fresh data
    const freshData = await syncFunction();

    // Cache the result
    if (freshData) {
      await this.db.collection('football_cache').doc(cacheKey).set({
        data: freshData,
        timestamp: now,
        strategy: strategy.strategy,
        expiration: strategy.expiration,
      });
    }

    return freshData;
  }

  /**
   * Determine if today is an NFL game day
   */
  private isGameDay(league: 'nfl' | 'cfb'): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (league === 'nfl') {
      // NFL games: Sunday (0), Monday (1), Thursday (4), sometimes Saturday (6)
      return [0, 1, 4, 6].includes(dayOfWeek);
    } else {
      // College Football: Primarily Saturday (6), some Tuesday-Friday games
      return [2, 3, 4, 5, 6].includes(dayOfWeek);
    }
  }

  /**
   * Determine if it's college football season
   */
  private isCollegeFootballSeason(): boolean {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    return month >= 8 || month <= 1; // August through January
  }

  /**
   * Determine if it's recruiting season
   */
  private isRecruitingSeason(): boolean {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();

    // Early signing period (December) and regular signing period (February)
    return (month === 12 && day >= 15) || month === 2 || (month >= 6 && month <= 8); // Summer evaluation period
  }

  /**
   * Determine if player stats should be synced (less frequent)
   */
  private shouldSyncPlayerStats(): boolean {
    const hour = new Date().getHours();
    // Sync player stats only during off-peak hours (2-6 AM)
    return hour >= 2 && hour <= 6;
  }

  /**
   * Generate comprehensive performance metrics
   */
  private async generatePerformanceMetrics(): Promise<DailySyncReport['performanceMetrics']> {
    const totalDuration = Date.now() - this.syncStartTime;

    // Get memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Calculate average response time from recent sync operations
    const recentSyncs = await this.db
      .collection('football_sync_logs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    let averageResponseTime = 0;
    let errorCount = 0;

    if (!recentSyncs.empty) {
      const totalResponseTime = recentSyncs.docs.reduce((sum, doc) => {
        const data = doc.data();
        if (data.errors && data.errors.length > 0) errorCount++;
        return sum + (data.duration || 0);
      }, 0);

      averageResponseTime = totalResponseTime / recentSyncs.size;
    }

    const errorRate = recentSyncs.size > 0 ? (errorCount / recentSyncs.size) * 100 : 0;

    return {
      totalDuration,
      averageResponseTime,
      memoryUsage,
      errorRate,
    };
  }

  /**
   * Get cache statistics for performance monitoring
   */
  private async getCacheStatistics(): Promise<DailySyncReport['cacheStats']> {
    try {
      const cacheStatsDoc = await this.db
        .collection('football_cache_stats')
        .doc('daily_stats')
        .get();

      if (cacheStatsDoc.exists) {
        const stats = cacheStatsDoc.data();
        return {
          hitRate: stats?.hitRate || 0,
          missRate: stats?.missRate || 0,
          apiCallsSaved: stats?.apiCallsSaved || 0,
          costSavings: stats?.costSavings || 0,
        };
      }
    } catch (error) {
      Sentry.captureException(error);
    }

    return { hitRate: 0, missRate: 0, apiCallsSaved: 0, costSavings: 0 };
  }

  /**
   * Store sync report for monitoring and analysis
   */
  private async storeSyncReport(report: DailySyncReport): Promise<void> {
    try {
      await this.db
        .collection('football_sync_reports')
        .doc(`daily_${report.timestamp.toISOString().split('T')[0]}`)
        .set(report);

      // Also update the latest report
      await this.db.collection('football_sync_reports').doc('latest').set(report);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  /**
   * Process Promise.allSettled results for parallel execution
   */
  private processSettledResult(
    result: PromiseSettledResult<any>,
    service: string
  ): DailySyncReport['nflSync'] | DailySyncReport['cfbSync'] {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    } else {
      return {
        status: 'failed',
        duration: 0,
        recordsProcessed: 0,
        errors: [
          result.status === 'rejected'
            ? result.reason?.message || 'Unknown error'
            : 'Service disabled',
        ],
      };
    }
  }

  /**
   * Get latest sync report
   */
  async getLatestSyncReport(): Promise<DailySyncReport | null> {
    try {
      const reportDoc = await this.db.collection('football_sync_reports').doc('latest').get();

      return reportDoc.exists ? (reportDoc.data() as DailySyncReport) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Manual trigger for immediate sync
   */
  async triggerImmediateSync(options?: Partial<FootballSyncOptions>): Promise<DailySyncReport> {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    return await this.executeDailySync();
  }

  /**
   * Get sync status and health metrics
   */
  async getSyncHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastSync: Date | null;
    nextScheduledSync: Date | null;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const latestReport = await this.getLatestSyncReport();
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!latestReport) {
        issues.push('No sync reports found');
        return {
          status: 'unhealthy',
          lastSync: null,
          nextScheduledSync: null,
          issues,
          recommendations: ['Execute initial sync'],
        };
      }

      // Check if sync is recent (within 24 hours)
      const hoursSinceLastSync = (Date.now() - latestReport.timestamp.getTime()) / 1000 / 60 / 60;
      if (hoursSinceLastSync > 24) {
        issues.push(`Last sync was ${Math.round(hoursSinceLastSync)} hours ago`);
      }

      // Check error rates
      if (latestReport.performanceMetrics.errorRate > 20) {
        issues.push(`High error rate: ${latestReport.performanceMetrics.errorRate.toFixed(1)}%`);
        recommendations.push('Review API rate limiting and error handling');
      }

      // Check cache performance
      if (latestReport.cacheStats.hitRate < 0.7) {
        recommendations.push('Optimize cache strategies for better performance');
      }

      // Check sync performance
      if (latestReport.performanceMetrics.totalDuration > 300000) {
        // 5 minutes
        recommendations.push('Consider optimizing sync operations for faster execution');
      }

      const status =
        issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy';

      return {
        status,
        lastSync: latestReport.timestamp,
        nextScheduledSync: this.getNextScheduledSync(),
        issues,
        recommendations,
      };
    } catch (error) {
      Sentry.captureException(error);
      return {
        status: 'unhealthy',
        lastSync: null,
        nextScheduledSync: null,
        issues: ['Failed to assess sync health'],
        recommendations: ['Check service configuration'],
      };
    }
  }

  /**
   * Calculate next scheduled sync time
   */
  private getNextScheduledSync(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // 6 AM daily sync
    return tomorrow;
  }
}

export const dailyFootballSyncService = new DailyFootballSyncService();
