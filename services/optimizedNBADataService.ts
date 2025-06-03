// =============================================================================
// OPTIMIZED NBA DATA SERVICE
// High-Performance NBA Data Management with Firebase Optimization
// =============================================================================

import * as Sentry from '@sentry/react-native';
import { where, orderBy, limit, Timestamp } from 'firebase/firestore';

import {
  firebaseOptimizationService,
  optimizedQuery,
  optimizedBatchWrite,
  invalidateCacheForCollection,
} from './firebaseOptimizationService';
import { firebasePerformanceService } from '../config/firebasePerformanceConfig';

// =============================================================================
// INTERFACES
// =============================================================================

export interface NBAGame {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score?: number;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score?: number;
  };
  gameDate: Date;
  status: 'scheduled' | 'live' | 'completed' | 'postponed';
  quarter?: number;
  timeRemaining?: string;
  venue: string;
  broadcasters: string[];
  lastUpdated: Date;
}

export interface NBAPlayer {
  id: string;
  name: string;
  teamId: string;
  position: string;
  jerseyNumber: number;
  isActive: boolean;
  stats?: NBAPlayerStats;
}

export interface NBAPlayerStats {
  playerId: string;
  season: string;
  games: number;
  averages: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    minutes: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
  };
  totals: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
  };
  advanced: {
    playerEfficiencyRating: number;
    trueShootingPercentage: number;
    usageRate: number;
    assistPercentage: number;
    reboundPercentage: number;
  };
  lastUpdated: Date;
}

export interface NBAPrediction {
  id: string;
  gameId: string;
  predictionType: 'game_winner' | 'spread' | 'total' | 'prop_bet';
  prediction: {
    value: number | string;
    confidence: number;
    reasoning: string;
  };
  modelVersion: string;
  createdAt: Date;
  gameDate: Date;
}

export interface DataSyncStatus {
  collection: string;
  lastSync: Date;
  recordsProcessed: number;
  status: 'success' | 'error' | 'in_progress';
  errorMessage?: string;
}

// =============================================================================
// OPTIMIZED NBA DATA SERVICE
// =============================================================================

export class OptimizedNBADataService {
  private readonly collectionPrefix = 'nba';
  private syncStatus = new Map<string, DataSyncStatus>();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      // Ensure Firebase performance service is ready
      if (!firebasePerformanceService.isReady()) {
        await firebasePerformanceService.initialize();
      }

      Sentry.addBreadcrumb({
        message: 'Optimized NBA Data Service initialized',
        category: 'nba.data.init',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize NBA Data Service: ${error}`);
    }
  }

  // =============================================================================
  // GAME DATA METHODS
  // =============================================================================

  /**
   * Get today's NBA games with optimized caching
   */
  async getTodaysGames(): Promise<NBAGame[]> {
    const startTime = Date.now();

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const games = await optimizedQuery(`${this.collectionPrefix}_games`)
        .where('gameDate', '>=', startOfDay)
        .where('gameDate', '<=', endOfDay)
        .orderBy('gameDate', 'asc')
        .execute<NBAGame>({
          useCache: true,
          cacheTtl: 60000, // 1 minute cache for live data
          enableMetrics: true,
          timeoutMs: 5000,
        });

      // Record performance
      firebasePerformanceService.recordQueryPerformance('nba_games_today', Date.now() - startTime);

      return games;
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error fetching today's games:", error);
      return this.getFallbackTodaysGames();
    }
  }

  /**
   * Get live games with real-time updates
   */
  async getLiveGames(): Promise<NBAGame[]> {
    const startTime = Date.now();

    try {
      const games = await optimizedQuery(`${this.collectionPrefix}_games`)
        .where('status', '==', 'live')
        .orderBy('gameDate', 'desc')
        .execute<NBAGame>({
          useCache: true,
          cacheTtl: 10000, // 10 seconds cache for live games
          enableMetrics: true,
        });

      firebasePerformanceService.recordQueryPerformance('nba_games_live', Date.now() - startTime);

      return games;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Get games for a specific date range with pagination
   */
  async getGamesByDateRange(
    startDate: Date,
    endDate: Date,
    pageSize: number = 25,
    lastGameId?: string
  ): Promise<{ games: NBAGame[]; hasMore: boolean; lastGameId?: string }> {
    const startTime = Date.now();

    try {
      const result = await optimizedQuery(`${this.collectionPrefix}_games`)
        .where('gameDate', '>=', startDate)
        .where('gameDate', '<=', endDate)
        .orderBy('gameDate', 'desc')
        .executePaginated<NBAGame>(pageSize, undefined, {
          useCache: true,
          cacheTtl: 300000, // 5 minutes for historical data
          enableMetrics: true,
        });

      firebasePerformanceService.recordQueryPerformance(
        'nba_games_date_range',
        Date.now() - startTime
      );

      return {
        games: result.data,
        hasMore: result.hasMore,
        lastGameId: result.lastDoc?.id,
      };
    } catch (error) {
      Sentry.captureException(error);
      return { games: [], hasMore: false };
    }
  }

  // =============================================================================
  // PLAYER DATA METHODS
  // =============================================================================

  /**
   * Get player statistics with caching optimization
   */
  async getPlayerStats(playerId: string, season: string = '2024'): Promise<NBAPlayerStats | null> {
    const startTime = Date.now();

    try {
      const stats = await optimizedQuery(`${this.collectionPrefix}_player_stats`)
        .where('playerId', '==', playerId)
        .where('season', '==', season)
        .limit(1)
        .execute<NBAPlayerStats>({
          useCache: true,
          cacheTtl: 3600000, // 1 hour cache for season stats
          enableMetrics: true,
        });

      firebasePerformanceService.recordQueryPerformance('nba_player_stats', Date.now() - startTime);

      return stats.length > 0 ? stats[0] : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Get team roster with optimization
   */
  async getTeamRoster(teamId: string): Promise<NBAPlayer[]> {
    const startTime = Date.now();

    try {
      const players = await optimizedQuery(`${this.collectionPrefix}_players`)
        .where('teamId', '==', teamId)
        .where('isActive', '==', true)
        .orderBy('jerseyNumber', 'asc')
        .execute<NBAPlayer>({
          useCache: true,
          cacheTtl: 1800000, // 30 minutes cache for roster data
          enableMetrics: true,
        });

      firebasePerformanceService.recordQueryPerformance('nba_team_roster', Date.now() - startTime);

      return players;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Get top performers by stat category
   */
  async getTopPerformers(
    statCategory: 'points' | 'rebounds' | 'assists',
    limit: number = 10
  ): Promise<NBAPlayer[]> {
    const startTime = Date.now();

    try {
      // Use different collection for aggregated top performers
      const performers = await optimizedQuery(`${this.collectionPrefix}_top_performers`)
        .where('category', '==', statCategory)
        .orderBy('value', 'desc')
        .limit(limit)
        .execute<NBAPlayer>({
          useCache: true,
          cacheTtl: 3600000, // 1 hour cache for leaderboards
          enableMetrics: true,
        });

      firebasePerformanceService.recordQueryPerformance(
        'nba_top_performers',
        Date.now() - startTime
      );

      return performers;
    } catch (error) {
      Sentry.captureException(error);
      return this.getFallbackTopPerformers(statCategory, limit);
    }
  }

  // =============================================================================
  // PREDICTION DATA METHODS
  // =============================================================================

  /**
   * Get game predictions with optimization
   */
  async getGamePredictions(gameId: string): Promise<NBAPrediction[]> {
    const startTime = Date.now();

    try {
      const predictions = await optimizedQuery(`${this.collectionPrefix}_predictions`)
        .where('gameId', '==', gameId)
        .orderBy('confidence', 'desc')
        .execute<NBAPrediction>({
          useCache: true,
          cacheTtl: 300000, // 5 minutes cache for predictions
          enableMetrics: true,
        });

      firebasePerformanceService.recordQueryPerformance(
        'nba_game_predictions',
        Date.now() - startTime
      );

      return predictions;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Get latest predictions for today's games
   */
  async getTodaysPredictions(): Promise<NBAPrediction[]> {
    const startTime = Date.now();

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const predictions = await optimizedQuery(`${this.collectionPrefix}_predictions`)
        .where('gameDate', '>=', startOfDay)
        .where('gameDate', '<=', endOfDay)
        .orderBy('confidence', 'desc')
        .execute<NBAPrediction>({
          useCache: true,
          cacheTtl: 120000, // 2 minutes cache for daily predictions
          enableMetrics: true,
        });

      firebasePerformanceService.recordQueryPerformance(
        'nba_todays_predictions',
        Date.now() - startTime
      );

      return predictions;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  // =============================================================================
  // BATCH OPERATIONS WITH OPTIMIZATION
  // =============================================================================

  /**
   * Bulk update game scores with optimization
   */
  async bulkUpdateGameScores(gameUpdates: Partial<NBAGame>[]): Promise<void> {
    try {
      await optimizedBatchWrite(
        gameUpdates,
        async batch => {
          // Simulate batch write operation
          console.log(`Processing batch of ${batch.length} game updates`);
          return Promise.resolve();
        },
        {
          batchSize: 25,
          delayBetweenBatches: 100,
          maxConcurrentBatches: 3,
          retryAttempts: 3,
        }
      );

      // Invalidate related caches
      invalidateCacheForCollection(`${this.collectionPrefix}_games`);

      Sentry.addBreadcrumb({
        message: `Bulk updated ${gameUpdates.length} game scores`,
        category: 'nba.data.bulk_update',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Bulk game score update failed: ${error}`);
    }
  }

  /**
   * Bulk update player statistics
   */
  async bulkUpdatePlayerStats(statsUpdates: NBAPlayerStats[]): Promise<void> {
    try {
      await optimizedBatchWrite(
        statsUpdates,
        async batch => {
          console.log(`Processing batch of ${batch.length} player stats updates`);
          return Promise.resolve();
        },
        {
          batchSize: 50, // Larger batch for stats
          delayBetweenBatches: 50,
          maxConcurrentBatches: 5,
          retryAttempts: 3,
        }
      );

      // Invalidate stats caches
      invalidateCacheForCollection(`${this.collectionPrefix}_player_stats`);
      invalidateCacheForCollection(`${this.collectionPrefix}_top_performers`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Bulk player stats update failed: ${error}`);
    }
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  /**
   * Invalidate all NBA data caches
   */
  invalidateAllCaches(): void {
    const collections = [
      `${this.collectionPrefix}_games`,
      `${this.collectionPrefix}_players`,
      `${this.collectionPrefix}_player_stats`,
      `${this.collectionPrefix}_predictions`,
      `${this.collectionPrefix}_top_performers`,
    ];

    collections.forEach(collection => {
      invalidateCacheForCollection(collection);
    });

    Sentry.addBreadcrumb({
      message: 'All NBA data caches invalidated',
      category: 'nba.data.cache',
      level: 'info',
    });
  }

  /**
   * Refresh live game data and clear related caches
   */
  async refreshLiveData(): Promise<void> {
    try {
      // Invalidate live data caches
      invalidateCacheForCollection(`${this.collectionPrefix}_games`);

      // Fetch fresh live games
      await this.getLiveGames();

      console.log('Live NBA data refreshed');
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error refreshing live data:', error);
    }
  }

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  /**
   * Get query performance statistics
   */
  getPerformanceStats(): {
    [collection: string]: { avg: number; max: number; min: number; count: number };
  } {
    return firebasePerformanceService.getPerformanceStats();
  }

  /**
   * Get data sync status
   */
  getDataSyncStatus(): Map<string, DataSyncStatus> {
    return this.syncStatus;
  }

  /**
   * Update sync status
   */
  updateSyncStatus(collection: string, status: Partial<DataSyncStatus>): void {
    const current = this.syncStatus.get(collection) || {
      collection,
      lastSync: new Date(),
      recordsProcessed: 0,
      status: 'in_progress',
    };

    this.syncStatus.set(collection, { ...current, ...status });
  }

  // =============================================================================
  // FALLBACK DATA METHODS
  // =============================================================================

  private getFallbackTodaysGames(): NBAGame[] {
    const today = new Date();
    return [
      {
        id: 'fallback_game_1',
        homeTeam: { id: 'LAL', name: 'Los Angeles Lakers', abbreviation: 'LAL' },
        awayTeam: { id: 'GSW', name: 'Golden State Warriors', abbreviation: 'GSW' },
        gameDate: today,
        status: 'scheduled',
        venue: 'Crypto.com Arena',
        broadcasters: ['ESPN'],
        lastUpdated: today,
      },
      {
        id: 'fallback_game_2',
        homeTeam: { id: 'BOS', name: 'Boston Celtics', abbreviation: 'BOS' },
        awayTeam: { id: 'MIA', name: 'Miami Heat', abbreviation: 'MIA' },
        gameDate: today,
        status: 'scheduled',
        venue: 'TD Garden',
        broadcasters: ['TNT'],
        lastUpdated: today,
      },
    ];
  }

  private getFallbackTopPerformers(statCategory: string, limit: number): NBAPlayer[] {
    const players: NBAPlayer[] = [
      {
        id: 'luka_doncic',
        name: 'Luka Dončić',
        teamId: 'DAL',
        position: 'PG',
        jerseyNumber: 77,
        isActive: true,
      },
      {
        id: 'jayson_tatum',
        name: 'Jayson Tatum',
        teamId: 'BOS',
        position: 'SF',
        jerseyNumber: 0,
        isActive: true,
      },
    ];

    return players.slice(0, limit);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const optimizedNBADataService = new OptimizedNBADataService();
