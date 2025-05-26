import { CollegeFootballDataSyncService } from './collegefootballDataSyncService';
import { CollegeFootballAnalyticsService } from './collegefootballAnalyticsService';
import { CollegeFootballMLPredictionService } from './collegefootballMLPredictionService';
import { initSentry } from '../sentryConfig';
import * as admin from 'firebase-admin';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface CFBIntegrationOptions {
  enableRealTimeUpdates?: boolean;
  enablePredictions?: boolean;
  enableAnalytics?: boolean;
  cacheTimeouts?: {
    teamData: number;
    gameData: number;
    analytics: number;
    predictions: number;
  };
}

export interface CFBSystemStatus {
  dataSync: {
    status: 'active' | 'error' | 'disabled';
    lastSync: Date | null;
    nextSync: Date | null;
    error?: string;
  };
  analytics: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    error?: string;
  };
  predictions: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    accuracy?: number;
    error?: string;
  };
}

export class CollegeFootballIntegrationService {
  private dataSyncService: CollegeFootballDataSyncService;
  private analyticsService: CollegeFootballAnalyticsService;
  private mlPredictionService: CollegeFootballMLPredictionService;
  private db: admin.firestore.Firestore;
  private options: CFBIntegrationOptions;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(options: CFBIntegrationOptions = {}) {
    this.options = {
      enableRealTimeUpdates: true,
      enablePredictions: true,
      enableAnalytics: true,
      cacheTimeouts: {
        teamData: 3600000, // 1 hour
        gameData: 300000, // 5 minutes
        analytics: 1800000, // 30 minutes
        predictions: 600000, // 10 minutes
      },
      ...options,
    };

    this.db = admin.firestore();
    this.dataSyncService = new CollegeFootballDataSyncService();
    this.analyticsService = new CollegeFootballAnalyticsService();
    this.mlPredictionService = new CollegeFootballMLPredictionService();
  }

  /**
   * Initialize the complete CFB system
   */
  async initializeSystem(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing CFB integration system',
        level: 'info',
      });

      // Initialize all subsystems
      await Promise.all([
        this.dataSyncService.initialize(),
        this.analyticsService.initialize(),
        this.mlPredictionService.initialize(),
      ]);

      // Start real-time updates if enabled
      if (this.options.enableRealTimeUpdates) {
        await this.startRealTimeUpdates();
      }

      // Initial data sync
      await this.performInitialSync();

      console.log('CFB Integration System initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize CFB system: ${error.message}`);
    }
  }

  /**
   * Perform initial system sync
   */
  private async performInitialSync(): Promise<void> {
    try {
      // Step 1: Sync basic team and conference data
      await this.dataSyncService.syncTeamsAndConferences();

      // Step 2: Sync current season games and schedules
      await this.dataSyncService.syncCurrentSeasonGames();

      // Step 3: Sync recruiting and coaching data
      await this.dataSyncService.syncRecruitingData();

      // Step 4: Generate analytics for all teams
      if (this.options.enableAnalytics) {
        await this.generateSystemWideAnalytics();
      }

      // Step 5: Generate predictions for upcoming games
      if (this.options.enablePredictions) {
        await this.generateUpcomingPredictions();
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Initial sync failed: ${error.message}`);
    }
  }

  /**
   * Start real-time update system
   */
  private async startRealTimeUpdates(): Promise<void> {
    // Schedule regular updates every 30 minutes during season
    this.syncInterval = setInterval(async () => {
      try {
        await this.performIncrementalSync();
      } catch (error) {
        Sentry.captureException(error);
        console.error('Real-time sync error:', error.message);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Perform incremental data sync
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      // Sync game scores and updates
      await this.dataSyncService.syncGameUpdates();

      // Update recruiting data (weekly)
      const lastRecruitingSync = await this.getLastSyncTime('recruiting');
      if (!lastRecruitingSync || Date.now() - lastRecruitingSync.getTime() > 7 * 24 * 60 * 60 * 1000) {
        await this.dataSyncService.syncRecruitingData();
      }

      // Update analytics for teams with recent games
      if (this.options.enableAnalytics) {
        await this.updateRecentAnalytics();
      }

      // Generate new predictions for upcoming games
      if (this.options.enablePredictions) {
        await this.updateUpcomingPredictions();
      }
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
      console.log(`Generated analytics for ${teams.length} CFB teams`);
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
      
      // Store predictions in Firestore
      const batch = this.db.batch();
      predictions.forEach((prediction, index) => {
        const gameId = upcomingGames[index].id;
        const predictionRef = this.db.collection('cfb_predictions').doc(gameId);
        batch.set(predictionRef, {
          ...prediction,
          gameId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`Generated predictions for ${predictions.length} upcoming CFB games`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Prediction generation failed: ${error.message}`);
    }
  }

  /**
   * Update analytics for teams with recent games
   */
  private async updateRecentAnalytics(): Promise<void> {
    try {
      const recentGames = await this.dataSyncService.getRecentGames(3); // Last 3 days
      const affectedTeams = new Set<string>();

      recentGames.forEach(game => {
        affectedTeams.add(game.homeTeam);
        affectedTeams.add(game.awayTeam);
      });

      const currentSeason = new Date().getFullYear();
      const updatePromises = Array.from(affectedTeams).map(teamId =>
        this.analyticsService.generateTeamAnalytics(teamId, currentSeason)
      );

      await Promise.all(updatePromises);
      console.log(`Updated analytics for ${affectedTeams.size} teams with recent games`);
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
      const upcomingGames = await this.dataSyncService.getUpcomingGames(3); // Next 3 days
      
      // Only update predictions that are older than cache timeout
      const cacheTimeout = this.options.cacheTimeouts?.predictions || 600000;
      const cutoffTime = new Date(Date.now() - cacheTimeout);

      const gamesToUpdate = [];
      for (const game of upcomingGames) {
        const existingPrediction = await this.db
          .collection('cfb_predictions')
          .doc(game.id)
          .get();

        if (!existingPrediction.exists || 
            existingPrediction.data()?.updatedAt?.toDate() < cutoffTime) {
          gamesToUpdate.push(game);
        }
      }

      if (gamesToUpdate.length > 0) {
        const predictionPromises = gamesToUpdate.map(game =>
          this.mlPredictionService.predictGame(game.homeTeam, game.awayTeam, game.date)
        );

        const predictions = await Promise.all(predictionPromises);
        
        const batch = this.db.batch();
        predictions.forEach((prediction, index) => {
          const gameId = gamesToUpdate[index].id;
          const predictionRef = this.db.collection('cfb_predictions').doc(gameId);
          batch.set(predictionRef, {
            ...prediction,
            gameId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        });

        await batch.commit();
        console.log(`Updated predictions for ${predictions.length} upcoming CFB games`);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Upcoming predictions update failed: ${error.message}`);
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<CFBSystemStatus> {
    try {
      const [dataSyncStatus, analyticsStatus, predictionsStatus] = await Promise.all([
        this.getDataSyncStatus(),
        this.getAnalyticsStatus(),
        this.getPredictionsStatus(),
      ]);

      return {
        dataSync: dataSyncStatus,
        analytics: analyticsStatus,
        predictions: predictionsStatus,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  /**
   * Get data sync status
   */
  private async getDataSyncStatus(): Promise<CFBSystemStatus['dataSync']> {
    try {
      const lastSync = await this.getLastSyncTime('data');
      const nextSync = this.syncInterval ? new Date(Date.now() + 30 * 60 * 1000) : null;

      return {
        status: 'active',
        lastSync,
        nextSync,
      };
    } catch (error) {
      return {
        status: 'error',
        lastSync: null,
        nextSync: null,
        error: error.message,
      };
    }
  }

  /**
   * Get analytics status
   */
  private async getAnalyticsStatus(): Promise<CFBSystemStatus['analytics']> {
    try {
      const lastUpdate = await this.getLastSyncTime('analytics');

      return {
        status: this.options.enableAnalytics ? 'active' : 'disabled',
        lastUpdate,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        error: error.message,
      };
    }
  }

  /**
   * Get predictions status
   */
  private async getPredictionsStatus(): Promise<CFBSystemStatus['predictions']> {
    try {
      const lastUpdate = await this.getLastSyncTime('predictions');
      const accuracy = await this.calculatePredictionAccuracy();

      return {
        status: this.options.enablePredictions ? 'active' : 'disabled',
        lastUpdate,
        accuracy,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        error: error.message,
      };
    }
  }

  /**
   * Calculate prediction accuracy
   */
  private async calculatePredictionAccuracy(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const predictionsSnapshot = await this.db
        .collection('cfb_predictions')
        .where('createdAt', '>=', thirtyDaysAgo)
        .get();

      if (predictionsSnapshot.empty) return 0;

      let correct = 0;
      let total = 0;

      for (const doc of predictionsSnapshot.docs) {
        const prediction = doc.data();
        const gameId = prediction.gameId;

        // Get actual game result
        const gameSnapshot = await this.db
          .collection('cfb_games')
          .doc(gameId)
          .get();

        if (gameSnapshot.exists) {
          const game = gameSnapshot.data();
          if (game?.status === 'completed' && game?.scores) {
            total++;
            const actualWinner = game.scores.home > game.scores.away ? 'home' : 'away';
            const predictedWinner = prediction.winProbability > 0.5 ? 'home' : 'away';
            
            if (actualWinner === predictedWinner) {
              correct++;
            }
          }
        }
      }

      return total > 0 ? (correct / total) * 100 : 0;
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  /**
   * Get last sync time for a specific operation
   */
  private async getLastSyncTime(operation: string): Promise<Date | null> {
    try {
      const syncDoc = await this.db
        .collection('cfb_system_status')
        .doc(`last_${operation}_sync`)
        .get();

      return syncDoc.exists ? syncDoc.data()?.timestamp?.toDate() || null : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(operation: string): Promise<void> {
    try {
      await this.db
        .collection('cfb_system_status')
        .doc(`last_${operation}_sync`)
        .set({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  /**
   * Shutdown the integration service
   */
  async shutdown(): Promise<void> {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      console.log('CFB Integration Service shut down successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to shutdown CFB service: ${error.message}`);
    }
  }

  /**
   * Get comprehensive team data including analytics and predictions
   */
  async getComprehensiveTeamData(teamId: string): Promise<any> {
    try {
      const currentSeason = new Date().getFullYear();
      
      const [teamData, analytics, upcomingGames] = await Promise.all([
        this.dataSyncService.getTeamById(teamId),
        this.analyticsService.generateTeamAnalytics(teamId, currentSeason),
        this.dataSyncService.getTeamUpcomingGames(teamId, 5),
      ]);

      // Get predictions for upcoming games
      const predictionPromises = upcomingGames.map(game =>
        this.db.collection('cfb_predictions').doc(game.id).get()
      );

      const predictionDocs = await Promise.all(predictionPromises);
      const predictions = predictionDocs
        .filter(doc => doc.exists)
        .map(doc => doc.data());

      return {
        team: teamData,
        analytics,
        upcomingGames,
        predictions,
        lastUpdated: new Date(),
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get comprehensive team data: ${error.message}`);
    }
  }
}

export const cfbIntegrationService = new CollegeFootballIntegrationService();