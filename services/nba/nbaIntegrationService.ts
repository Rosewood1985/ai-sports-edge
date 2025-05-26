// =============================================================================
// NBA INTEGRATION SERVICE
// Comprehensive NBA System Integration and Orchestration
// =============================================================================

import { NBADataSyncService } from './nbaDataSyncService';
import { NBAAnalyticsService } from './nbaAnalyticsService';
import { NBAMLPredictionService } from './nbaMLPredictionService';
import { NBAParlayAnalyticsService } from './nbaParlayAnalyticsService';
import { initSentry } from '../sentryConfig';
import * as admin from 'firebase-admin';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface NBAIntegrationOptions {
  enableRealTimeUpdates?: boolean;
  enablePredictions?: boolean;
  enableAnalytics?: boolean;
  enableParlayAnalytics?: boolean;
  cacheTimeouts?: {
    teamData: number;
    gameData: number;
    analytics: number;
    predictions: number;
    parlayAnalytics: number;
  };
}

export interface NBASystemStatus {
  dataSync: {
    status: 'active' | 'error' | 'disabled';
    lastSync: Date | null;
    nextSync: Date | null;
    teamsCount: number;
    playersCount: number;
    gamesCount: number;
    error?: string;
  };
  analytics: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    teamAnalyticsCount: number;
    playerAnalyticsCount: number;
    error?: string;
  };
  predictions: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    predictionsCount: number;
    accuracy?: number;
    error?: string;
  };
  parlayAnalytics: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    opportunitiesCount: number;
    avgExpectedValue?: number;
    error?: string;
  };
}

export interface NBAComprehensiveTeamData {
  team: any;
  analytics: any;
  upcomingGames: any[];
  predictions: any[];
  parlayOpportunities: any[];
  keyPlayers: any[];
  recentPerformance: any;
  lastUpdated: Date;
}

export class NBAIntegrationService {
  private dataSyncService: NBADataSyncService;
  private analyticsService: NBAAnalyticsService;
  private mlPredictionService: NBAMLPredictionService;
  private parlayAnalyticsService: NBAParlayAnalyticsService;
  private db: admin.firestore.Firestore;
  private options: NBAIntegrationOptions;
  private syncInterval: NodeJS.Timeout | null = null;
  private analyticsInterval: NodeJS.Timeout | null = null;
  private predictionsInterval: NodeJS.Timeout | null = null;

  constructor(options: NBAIntegrationOptions = {}) {
    this.options = {
      enableRealTimeUpdates: true,
      enablePredictions: true,
      enableAnalytics: true,
      enableParlayAnalytics: true,
      cacheTimeouts: {
        teamData: 3600000, // 1 hour
        gameData: 300000, // 5 minutes
        analytics: 1800000, // 30 minutes
        predictions: 600000, // 10 minutes
        parlayAnalytics: 900000, // 15 minutes
      },
      ...options,
    };

    this.db = admin.firestore();
    this.dataSyncService = new NBADataSyncService();
    this.analyticsService = new NBAAnalyticsService();
    this.mlPredictionService = new NBAMLPredictionService();
    this.parlayAnalyticsService = new NBAParlayAnalyticsService();
  }

  /**
   * Initialize the complete NBA system
   */
  async initializeSystem(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing NBA integration system',
        level: 'info',
      });

      // Initialize all subsystems in parallel
      await Promise.all([
        this.dataSyncService.initialize(),
        this.analyticsService.initialize(),
        this.mlPredictionService.initialize(),
        this.parlayAnalyticsService.initialize(),
      ]);

      // Start scheduled processes if enabled
      if (this.options.enableRealTimeUpdates) {
        await this.startScheduledProcesses();
      }

      // Perform initial system sync
      await this.performInitialSync();

      console.log('NBA Integration System initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize NBA system: ${error.message}`);
    }
  }

  /**
   * Perform initial system synchronization
   */
  private async performInitialSync(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting NBA initial sync',
        level: 'info',
      });

      // Phase 1: Core data synchronization
      console.log('Phase 1: Syncing core NBA data...');
      await this.dataSyncService.syncAllNBAData();

      // Phase 2: Generate analytics for all teams
      if (this.options.enableAnalytics) {
        console.log('Phase 2: Generating NBA analytics...');
        await this.generateSystemWideAnalytics();
      }

      // Phase 3: Generate predictions for upcoming games
      if (this.options.enablePredictions) {
        console.log('Phase 3: Generating NBA predictions...');
        await this.generateUpcomingPredictions();
      }

      // Phase 4: Generate parlay opportunities
      if (this.options.enableParlayAnalytics) {
        console.log('Phase 4: Generating NBA parlay opportunities...');
        await this.generateParlayOpportunities();
      }

      // Update system status
      await this.updateSystemStatus();

      console.log('NBA initial sync completed successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Initial sync failed: ${error.message}`);
    }
  }

  /**
   * Start scheduled background processes
   */
  private async startScheduledProcesses(): Promise<void> {
    try {
      // Data sync every 30 minutes during season
      this.syncInterval = setInterval(async () => {
        try {
          await this.performIncrementalSync();
        } catch (error) {
          Sentry.captureException(error);
          console.error('Scheduled data sync error:', error.message);
        }
      }, 30 * 60 * 1000); // 30 minutes

      // Analytics update every 2 hours
      this.analyticsInterval = setInterval(async () => {
        try {
          await this.updateRecentAnalytics();
        } catch (error) {
          Sentry.captureException(error);
          console.error('Scheduled analytics update error:', error.message);
        }
      }, 2 * 60 * 60 * 1000); // 2 hours

      // Predictions update every hour
      this.predictionsInterval = setInterval(async () => {
        try {
          await this.updateUpcomingPredictions();
        } catch (error) {
          Sentry.captureException(error);
          console.error('Scheduled predictions update error:', error.message);
        }
      }, 60 * 60 * 1000); // 1 hour

      console.log('NBA scheduled processes started');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to start scheduled processes: ${error.message}`);
    }
  }

  /**
   * Perform incremental data synchronization
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Performing NBA incremental sync',
        level: 'info',
      });

      // Sync recent games and scores
      await this.dataSyncService.syncRecentGames();

      // Sync current day games
      await this.dataSyncService.syncCurrentSeasonGames();

      // Update injury reports
      // Note: This would be implemented in the data sync service
      
      console.log('NBA incremental sync completed');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Incremental sync failed: ${error.message}`);
    }
  }

  /**
   * Generate analytics for all teams in the system
   */
  private async generateSystemWideAnalytics(): Promise<void> {
    try {
      const teams = await this.dataSyncService.getAllActiveTeams();
      const currentSeason = new Date().getFullYear();

      const analyticsPromises = teams.map(team =>
        this.analyticsService.generateTeamAnalytics(team.id, currentSeason)
      );

      await Promise.all(analyticsPromises);
      console.log(`Generated analytics for ${teams.length} NBA teams`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`System-wide analytics generation failed: ${error.message}`);
    }
  }

  /**
   * Generate predictions for upcoming games
   */
  private async generateUpcomingPredictions(): Promise<void> {
    try {
      const upcomingGames = await this.dataSyncService.getUpcomingGames(7); // Next 7 days

      const predictionPromises = upcomingGames.map(game =>
        this.mlPredictionService.predictGame(game.homeTeam, game.awayTeam, game.date)
      );

      const predictions = await Promise.all(predictionPromises);
      console.log(`Generated predictions for ${predictions.length} upcoming NBA games`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Prediction generation failed: ${error.message}`);
    }
  }

  /**
   * Generate parlay opportunities for upcoming games
   */
  private async generateParlayOpportunities(): Promise<void> {
    try {
      const upcomingGames = await this.dataSyncService.getUpcomingGames(3); // Next 3 days
      const gameIds = upcomingGames.map(game => game.id);

      if (gameIds.length > 0) {
        const opportunities = await this.parlayAnalyticsService.analyzeParlayOpportunities(gameIds);
        console.log(`Generated ${opportunities.length} NBA parlay opportunities`);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Parlay opportunity generation failed: ${error.message}`);
    }
  }

  /**
   * Update analytics for teams with recent activity
   */
  private async updateRecentAnalytics(): Promise<void> {
    try {
      const recentGames = await this.dataSyncService.getRecentGames(1); // Last 1 day
      const affectedTeams = new Set<string>();

      recentGames.forEach(game => {
        affectedTeams.add(game.homeTeam);
        affectedTeams.add(game.awayTeam);
      });

      if (affectedTeams.size > 0) {
        const currentSeason = new Date().getFullYear();
        const updatePromises = Array.from(affectedTeams).map(teamId =>
          this.analyticsService.generateTeamAnalytics(teamId, currentSeason)
        );

        await Promise.all(updatePromises);
        console.log(`Updated analytics for ${affectedTeams.size} teams with recent activity`);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Recent analytics update failed: ${error.message}`);
    }
  }

  /**
   * Update predictions for upcoming games
   */
  private async updateUpcomingPredictions(): Promise<void> {
    try {
      const upcomingGames = await this.dataSyncService.getUpcomingGames(2); // Next 2 days
      
      // Only update predictions that are stale
      const cacheTimeout = this.options.cacheTimeouts?.predictions || 600000;
      const cutoffTime = new Date(Date.now() - cacheTimeout);

      const gamesToUpdate = [];
      for (const game of upcomingGames) {
        const existingPrediction = await this.db
          .collection('nba_predictions')
          .doc(`${game.homeTeam}_${game.awayTeam}_${game.date.getTime()}`)
          .get();

        if (!existingPrediction.exists || 
            existingPrediction.data()?.lastUpdated?.toDate() < cutoffTime) {
          gamesToUpdate.push(game);
        }
      }

      if (gamesToUpdate.length > 0) {
        const predictionPromises = gamesToUpdate.map(game =>
          this.mlPredictionService.predictGame(game.homeTeam, game.awayTeam, game.date)
        );

        await Promise.all(predictionPromises);
        console.log(`Updated predictions for ${gamesToUpdate.length} upcoming NBA games`);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Upcoming predictions update failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<NBASystemStatus> {
    try {
      const [dataSyncStatus, analyticsStatus, predictionsStatus, parlayAnalyticsStatus] = await Promise.all([
        this.getDataSyncStatus(),
        this.getAnalyticsStatus(),
        this.getPredictionsStatus(),
        this.getParlayAnalyticsStatus(),
      ]);

      return {
        dataSync: dataSyncStatus,
        analytics: analyticsStatus,
        predictions: predictionsStatus,
        parlayAnalytics: parlayAnalyticsStatus,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  /**
   * Get comprehensive team data including all analytics and predictions
   */
  async getComprehensiveTeamData(teamId: string): Promise<NBAComprehensiveTeamData> {
    try {
      const currentSeason = new Date().getFullYear();
      
      const [
        team,
        analytics,
        upcomingGames,
        keyPlayers,
        parlayOpportunities
      ] = await Promise.all([
        this.dataSyncService.getTeamById(teamId),
        this.analyticsService.getTeamAnalytics(teamId, currentSeason),
        this.dataSyncService.getTeamUpcomingGames(teamId, 5),
        this.getTeamKeyPlayers(teamId),
        this.getTeamParlayOpportunities(teamId),
      ]);

      // Get predictions for upcoming games
      const predictionPromises = upcomingGames.map(game => {
        const gameId = `${game.homeTeam}_${game.awayTeam}_${game.date.getTime()}`;
        return this.mlPredictionService.getPrediction(gameId);
      });

      const predictions = (await Promise.all(predictionPromises)).filter(p => p !== null);

      // Calculate recent performance
      const recentPerformance = await this.calculateRecentPerformance(teamId);

      return {
        team,
        analytics,
        upcomingGames,
        predictions,
        parlayOpportunities,
        keyPlayers,
        recentPerformance,
        lastUpdated: new Date(),
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get comprehensive team data: ${error.message}`);
    }
  }

  /**
   * Get daily game insights with predictions and parlay opportunities
   */
  async getDailyGameInsights(date: Date = new Date()): Promise<any> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get games for the day
      const gamesQuery = this.db.collection('nba_games')
        .where('date', '>=', startOfDay)
        .where('date', '<=', endOfDay);

      const gamesSnapshot = await gamesQuery.get();
      const games = gamesSnapshot.docs.map(doc => doc.data());

      if (games.length === 0) {
        return { date, games: [], insights: 'No NBA games scheduled for this date' };
      }

      // Get predictions and parlay opportunities
      const gameIds = games.map(game => game.id);
      const [predictions, parlayOpportunities] = await Promise.all([
        this.getPredictionsForGames(gameIds),
        this.parlayAnalyticsService.analyzeParlayOpportunities(gameIds),
      ]);

      return {
        date,
        games,
        predictions,
        parlayOpportunities: parlayOpportunities.slice(0, 10), // Top 10
        totalGames: games.length,
        highConfidencePicks: predictions.filter(p => p.confidence.overall >= 0.8).length,
        bestParlayValue: parlayOpportunities.length > 0 ? 
          Math.max(...parlayOpportunities.map(p => p.expectedValue)) : 0,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get daily game insights: ${error.message}`);
    }
  }

  /**
   * Validate system performance and accuracy
   */
  async validateSystemPerformance(): Promise<any> {
    try {
      const [
        predictionAccuracy,
        parlayPerformance,
        dataFreshness
      ] = await Promise.all([
        this.mlPredictionService.validatePredictionAccuracy(),
        this.validateParlayPerformance(),
        this.validateDataFreshness(),
      ]);

      const overallScore = (predictionAccuracy + parlayPerformance + dataFreshness) / 3;

      return {
        overallScore,
        predictionAccuracy,
        parlayPerformance,
        dataFreshness,
        status: overallScore >= 75 ? 'excellent' : 
                overallScore >= 60 ? 'good' : 
                overallScore >= 40 ? 'fair' : 'needs-improvement',
        lastValidated: new Date(),
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`System performance validation failed: ${error.message}`);
    }
  }

  /**
   * Helper methods for status checks
   */
  
  private async getDataSyncStatus(): Promise<NBASystemStatus['dataSync']> {
    try {
      const [teamsCount, playersCount, gamesCount] = await Promise.all([
        this.getCollectionCount('nba_teams'),
        this.getCollectionCount('nba_players'),
        this.getCollectionCount('nba_games'),
      ]);

      const lastSync = await this.getLastSyncTime('data');
      const nextSync = this.syncInterval ? 
        new Date(Date.now() + 30 * 60 * 1000) : null;

      return {
        status: 'active',
        lastSync,
        nextSync,
        teamsCount,
        playersCount,
        gamesCount,
      };
    } catch (error) {
      return {
        status: 'error',
        lastSync: null,
        nextSync: null,
        teamsCount: 0,
        playersCount: 0,
        gamesCount: 0,
        error: error.message,
      };
    }
  }

  private async getAnalyticsStatus(): Promise<NBASystemStatus['analytics']> {
    try {
      const [teamAnalyticsCount, playerAnalyticsCount] = await Promise.all([
        this.getCollectionCount('nba_team_analytics'),
        this.getCollectionCount('nba_player_analytics'),
      ]);

      const lastUpdate = await this.getLastSyncTime('analytics');

      return {
        status: this.options.enableAnalytics ? 'active' : 'disabled',
        lastUpdate,
        teamAnalyticsCount,
        playerAnalyticsCount,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        teamAnalyticsCount: 0,
        playerAnalyticsCount: 0,
        error: error.message,
      };
    }
  }

  private async getPredictionsStatus(): Promise<NBASystemStatus['predictions']> {
    try {
      const predictionsCount = await this.getCollectionCount('nba_predictions');
      const lastUpdate = await this.getLastSyncTime('predictions');
      const accuracy = await this.mlPredictionService.validatePredictionAccuracy();

      return {
        status: this.options.enablePredictions ? 'active' : 'disabled',
        lastUpdate,
        predictionsCount,
        accuracy,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        predictionsCount: 0,
        error: error.message,
      };
    }
  }

  private async getParlayAnalyticsStatus(): Promise<NBASystemStatus['parlayAnalytics']> {
    try {
      const opportunitiesCount = await this.getCollectionCount('nba_parlay_opportunities');
      const lastUpdate = await this.getLastSyncTime('parlay_analytics');
      const avgExpectedValue = await this.calculateAverageExpectedValue();

      return {
        status: this.options.enableParlayAnalytics ? 'active' : 'disabled',
        lastUpdate,
        opportunitiesCount,
        avgExpectedValue,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        opportunitiesCount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Utility methods
   */

  private async getCollectionCount(collectionName: string): Promise<number> {
    try {
      const snapshot = await this.db.collection(collectionName).count().get();
      return snapshot.data().count;
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  private async getLastSyncTime(operation: string): Promise<Date | null> {
    try {
      const syncDoc = await this.db
        .collection('nba_system_status')
        .doc(`last_${operation}_sync`)
        .get();

      return syncDoc.exists ? syncDoc.data()?.timestamp?.toDate() || null : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async updateSystemStatus(): Promise<void> {
    try {
      const status = await this.getSystemStatus();
      await this.db
        .collection('nba_system_status')
        .doc('current_status')
        .set({
          ...status,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  private async getTeamKeyPlayers(teamId: string): Promise<any[]> {
    try {
      const playersSnapshot = await this.db
        .collection('nba_players')
        .where('teamId', '==', teamId)
        .where('isStarter', '==', true)
        .limit(8)
        .get();

      return playersSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async getTeamParlayOpportunities(teamId: string): Promise<any[]> {
    try {
      const opportunities = await this.parlayAnalyticsService.getParlayOpportunities(20);
      return opportunities.filter(opp => 
        opp.legs.some(leg => leg.selection.includes(teamId))
      );
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async calculateRecentPerformance(teamId: string): Promise<any> {
    try {
      const recentGames = await this.dataSyncService.getRecentGames(10);
      const teamGames = recentGames.filter(game => 
        game.homeTeam === teamId || game.awayTeam === teamId
      );

      let wins = 0;
      let totalPointsFor = 0;
      let totalPointsAgainst = 0;

      for (const game of teamGames) {
        if (game.scores) {
          const isHome = game.homeTeam === teamId;
          const teamScore = isHome ? game.scores.home : game.scores.away;
          const opponentScore = isHome ? game.scores.away : game.scores.home;

          if (teamScore > opponentScore) wins++;
          totalPointsFor += teamScore;
          totalPointsAgainst += opponentScore;
        }
      }

      return {
        record: { wins, losses: teamGames.length - wins },
        avgPointsFor: teamGames.length > 0 ? totalPointsFor / teamGames.length : 0,
        avgPointsAgainst: teamGames.length > 0 ? totalPointsAgainst / teamGames.length : 0,
        form: teamGames.slice(-5).map(game => {
          if (!game.scores) return null;
          const isHome = game.homeTeam === teamId;
          const teamScore = isHome ? game.scores.home : game.scores.away;
          const opponentScore = isHome ? game.scores.away : game.scores.home;
          return teamScore > opponentScore ? 'W' : 'L';
        }).filter(result => result !== null),
      };
    } catch (error) {
      Sentry.captureException(error);
      return { record: { wins: 0, losses: 0 }, avgPointsFor: 0, avgPointsAgainst: 0, form: [] };
    }
  }

  private async getPredictionsForGames(gameIds: string[]): Promise<any[]> {
    try {
      const predictionPromises = gameIds.map(gameId =>
        this.mlPredictionService.getPrediction(gameId)
      );

      const predictions = await Promise.all(predictionPromises);
      return predictions.filter(p => p !== null);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async validateParlayPerformance(): Promise<number> {
    // Placeholder for parlay performance validation
    return 70; // 70% performance score
  }

  private async validateDataFreshness(): Promise<number> {
    try {
      const lastSync = await this.getLastSyncTime('data');
      if (!lastSync) return 0;

      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      
      // Score based on freshness (100% if < 1 hour, decreasing linearly)
      return Math.max(0, Math.min(100, 100 - (hoursSinceSync - 1) * 10));
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  private async calculateAverageExpectedValue(): Promise<number> {
    try {
      const opportunities = await this.parlayAnalyticsService.getParlayOpportunities(50);
      if (opportunities.length === 0) return 0;

      const totalEV = opportunities.reduce((sum, opp) => sum + opp.expectedValue, 0);
      return totalEV / opportunities.length;
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  /**
   * Shutdown the integration service
   */
  async shutdown(): Promise<void> {
    try {
      // Clear all intervals
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      if (this.analyticsInterval) {
        clearInterval(this.analyticsInterval);
        this.analyticsInterval = null;
      }

      if (this.predictionsInterval) {
        clearInterval(this.predictionsInterval);
        this.predictionsInterval = null;
      }

      console.log('NBA Integration Service shut down successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to shutdown NBA service: ${error.message}`);
    }
  }

  /**
   * Manual triggers for admin use
   */

  async triggerFullSync(): Promise<void> {
    await this.performInitialSync();
  }

  async triggerAnalyticsUpdate(): Promise<void> {
    await this.generateSystemWideAnalytics();
  }

  async triggerPredictionsUpdate(): Promise<void> {
    await this.generateUpcomingPredictions();
  }

  async triggerParlayUpdate(): Promise<void> {
    await this.generateParlayOpportunities();
  }
}

export const nbaIntegrationService = new NBAIntegrationService();