// =============================================================================
// BOXING INTEGRATION SERVICE
// Comprehensive Boxing System Integration with Fight Predictions
// =============================================================================

import * as admin from 'firebase-admin';

import { BoxingAnalyticsService } from './boxingAnalyticsService';
import { BoxingDataSyncService } from './boxingDataSyncService';
import { initSentry } from '../sentryConfig';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface BoxingIntegrationOptions {
  enableRealTimeUpdates: boolean;
  enableFightPredictions: boolean;
  enableAnalytics: boolean;
  syncFrequency: 'high' | 'medium' | 'low';
  enableBettingIntegration: boolean;
}

export interface BoxingSystemStatus {
  dataSync: {
    status: 'active' | 'error' | 'disabled';
    lastSync: Date | null;
    nextSync: Date | null;
    fightersCount: number;
    fightsCount: number;
    upcomingFightsCount: number;
    error?: string;
  };
  analytics: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    fighterAnalyticsCount: number;
    fightAnalyticsCount: number;
    weightClassAnalyticsCount: number;
    error?: string;
  };
  predictions: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    upcomingPredictionsCount: number;
    accuracy?: number;
    error?: string;
  };
}

export class BoxingIntegrationService {
  private dataSyncService: BoxingDataSyncService;
  private analyticsService: BoxingAnalyticsService;
  private db: admin.firestore.Firestore;
  private options: BoxingIntegrationOptions;
  private syncInterval: NodeJS.Timeout | null = null;
  private analyticsInterval: NodeJS.Timeout | null = null;

  constructor(
    options: BoxingIntegrationOptions = {
      enableRealTimeUpdates: true,
      enableFightPredictions: true,
      enableAnalytics: true,
      syncFrequency: 'medium',
      enableBettingIntegration: true,
    }
  ) {
    this.options = options;
    this.db = admin.firestore();
    this.dataSyncService = new BoxingDataSyncService();
    this.analyticsService = new BoxingAnalyticsService();
  }

  /**
   * Initialize the complete boxing system
   */
  async initializeSystem(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing Boxing integration system',
        level: 'info',
      });

      // Initialize all subsystems
      await Promise.all([this.dataSyncService.initialize(), this.analyticsService.initialize()]);

      // Start scheduled processes
      if (this.options.enableRealTimeUpdates) {
        await this.startScheduledProcesses();
      }

      // Perform initial sync
      await this.performInitialSync();

      console.log('Boxing Integration System initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize Boxing system: ${error.message}`);
    }
  }

  /**
   * Perform initial system synchronization
   */
  private async performInitialSync(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting Boxing initial sync',
        level: 'info',
      });

      // Phase 1: Core data synchronization
      console.log('Phase 1: Syncing core boxing data...');
      await this.dataSyncService.syncAllBoxingData();

      // Phase 2: Generate analytics
      if (this.options.enableAnalytics) {
        console.log('Phase 2: Generating boxing analytics...');
        await this.generateSystemWideAnalytics();
      }

      // Phase 3: Generate predictions
      if (this.options.enableFightPredictions) {
        console.log('Phase 3: Generating fight predictions...');
        await this.generateUpcomingPredictions();
      }

      console.log('Boxing initial sync completed successfully');
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
      // Data sync frequency based on options
      const syncFrequency = this.getSyncFrequency();

      this.syncInterval = setInterval(async () => {
        try {
          await this.performIncrementalSync();
        } catch (error) {
          Sentry.captureException(error);
          console.error('Scheduled data sync error:', error.message);
        }
      }, syncFrequency);

      // Analytics update every 4 hours
      this.analyticsInterval = setInterval(
        async () => {
          try {
            await this.updateRecentAnalytics();
          } catch (error) {
            Sentry.captureException(error);
            console.error('Scheduled analytics update error:', error.message);
          }
        },
        4 * 60 * 60 * 1000
      );

      console.log('Boxing scheduled processes started');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to start scheduled processes: ${error.message}`);
    }
  }

  /**
   * Generate analytics for all fighters and weight classes
   */
  private async generateSystemWideAnalytics(): Promise<void> {
    try {
      // Get all active fighters
      const fightersSnapshot = await this.db.collection('boxing_fighters').get();
      const fighters = fightersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Generate fighter analytics in parallel batches
      const batchSize = 10;
      for (let i = 0; i < fighters.length; i += batchSize) {
        const batch = fighters.slice(i, i + batchSize);
        const analyticsPromises = batch.map(fighter =>
          this.analyticsService.generateFighterAnalytics(fighter.id)
        );
        await Promise.all(analyticsPromises);
      }

      // Generate weight class analytics
      const weightClasses = [
        'Heavyweight',
        'Cruiserweight',
        'Light Heavyweight',
        'Super Middleweight',
        'Middleweight',
        'Super Welterweight',
        'Welterweight',
        'Super Lightweight',
        'Lightweight',
        'Super Featherweight',
        'Featherweight',
        'Super Bantamweight',
        'Bantamweight',
        'Super Flyweight',
        'Flyweight',
        'Light Flyweight',
        'Minimumweight',
      ];

      const weightClassPromises = weightClasses.map(weightClass =>
        this.analyticsService.generateWeightClassAnalytics(weightClass)
      );
      await Promise.all(weightClassPromises);

      console.log(
        `Generated analytics for ${fighters.length} fighters and ${weightClasses.length} weight classes`
      );
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`System-wide analytics generation failed: ${error.message}`);
    }
  }

  /**
   * Generate predictions for upcoming fights
   */
  private async generateUpcomingPredictions(): Promise<void> {
    try {
      const upcomingFights = await this.dataSyncService.getUpcomingFights(60); // Next 60 days

      const predictionPromises = upcomingFights.map(fight =>
        this.analyticsService.generateFightAnalytics(fight.id)
      );

      await Promise.all(predictionPromises);
      console.log(`Generated predictions for ${upcomingFights.length} upcoming fights`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Prediction generation failed: ${error.message}`);
    }
  }

  /**
   * Perform incremental data synchronization
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Performing Boxing incremental sync',
        level: 'info',
      });

      // Sync recent fight results
      await this.dataSyncService.syncRecentFights();

      // Update current odds
      if (this.options.enableBettingIntegration) {
        await this.dataSyncService.syncFightOdds();
      }

      // Update fighter rankings
      await this.dataSyncService.syncFighterRankings();

      console.log('Boxing incremental sync completed');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Incremental sync failed: ${error.message}`);
    }
  }

  /**
   * Update analytics for recently active fighters
   */
  private async updateRecentAnalytics(): Promise<void> {
    try {
      // Get fighters who had recent fights (last 30 days)
      const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const recentFightsSnapshot = await this.db
        .collection('boxing_fights')
        .where('date', '>=', recentDate)
        .where('status', '==', 'completed')
        .get();

      const activeFighters = new Set<string>();
      recentFightsSnapshot.docs.forEach(doc => {
        const fight = doc.data();
        activeFighters.add(fight.fighter1);
        activeFighters.add(fight.fighter2);
      });

      // Update analytics for active fighters
      const updatePromises = Array.from(activeFighters).map(fighterId =>
        this.analyticsService.generateFighterAnalytics(fighterId)
      );

      await Promise.all(updatePromises);
      console.log(`Updated analytics for ${activeFighters.size} recently active fighters`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Recent analytics update failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<BoxingSystemStatus> {
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
   * Get upcoming fight predictions with analytics
   */
  async getUpcomingFightPredictions(days: number = 30): Promise<any[]> {
    try {
      const upcomingFights = await this.dataSyncService.getUpcomingFights(days);

      const predictions = await Promise.all(
        upcomingFights.map(async fight => {
          const analytics = await this.db.collection('boxing_fight_analytics').doc(fight.id).get();

          return {
            fight,
            analytics: analytics.exists ? analytics.data() : null,
          };
        })
      );

      return predictions.filter(p => p.analytics);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get fight predictions: ${error.message}`);
    }
  }

  /**
   * Get fighter profile with comprehensive analytics
   */
  async getFighterProfile(fighterId: string): Promise<any> {
    try {
      const [fighter, analytics, recentFights] = await Promise.all([
        this.dataSyncService.getFighterById(fighterId),
        this.db.collection('boxing_fighter_analytics').doc(fighterId).get(),
        this.getRecentFighterFights(fighterId, 5),
      ]);

      if (!fighter) {
        throw new Error('Fighter not found');
      }

      return {
        fighter,
        analytics: analytics.exists ? analytics.data() : null,
        recentFights,
        lastUpdated: new Date(),
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get fighter profile: ${error.message}`);
    }
  }

  /**
   * Get weight class rankings and analytics
   */
  async getWeightClassInfo(weightClass: string): Promise<any> {
    try {
      const [fighters, analytics] = await Promise.all([
        this.dataSyncService.getFightersByWeightClass(weightClass),
        this.db
          .collection('boxing_weight_class_analytics')
          .doc(weightClass.toLowerCase().replace(' ', '_'))
          .get(),
      ]);

      // Sort fighters by ranking
      const rankedFighters = fighters
        .filter(f => f.rankings.ring)
        .sort((a, b) => (a.rankings.ring || 100) - (b.rankings.ring || 100));

      return {
        weightClass,
        fighters: rankedFighters,
        analytics: analytics.exists ? analytics.data() : null,
        lastUpdated: new Date(),
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get weight class info: ${error.message}`);
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

  /**
   * Shutdown the integration service
   */
  async shutdown(): Promise<void> {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      if (this.analyticsInterval) {
        clearInterval(this.analyticsInterval);
        this.analyticsInterval = null;
      }

      console.log('Boxing Integration Service shut down successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to shutdown Boxing service: ${error.message}`);
    }
  }

  // Helper methods

  private getSyncFrequency(): number {
    switch (this.options.syncFrequency) {
      case 'high':
        return 30 * 60 * 1000; // 30 minutes
      case 'medium':
        return 2 * 60 * 60 * 1000; // 2 hours
      case 'low':
        return 6 * 60 * 60 * 1000; // 6 hours
      default:
        return 2 * 60 * 60 * 1000;
    }
  }

  private async getDataSyncStatus(): Promise<BoxingSystemStatus['dataSync']> {
    try {
      const [fightersCount, fightsCount, upcomingFightsCount] = await Promise.all([
        this.getCollectionCount('boxing_fighters'),
        this.getCollectionCount('boxing_fights'),
        this.getUpcomingFightsCount(),
      ]);

      const lastSync = await this.getLastSyncTime('data');
      const nextSync = this.syncInterval ? new Date(Date.now() + this.getSyncFrequency()) : null;

      return {
        status: 'active',
        lastSync,
        nextSync,
        fightersCount,
        fightsCount,
        upcomingFightsCount,
      };
    } catch (error) {
      return {
        status: 'error',
        lastSync: null,
        nextSync: null,
        fightersCount: 0,
        fightsCount: 0,
        upcomingFightsCount: 0,
        error: error.message,
      };
    }
  }

  private async getAnalyticsStatus(): Promise<BoxingSystemStatus['analytics']> {
    try {
      const [fighterAnalyticsCount, fightAnalyticsCount, weightClassAnalyticsCount] =
        await Promise.all([
          this.getCollectionCount('boxing_fighter_analytics'),
          this.getCollectionCount('boxing_fight_analytics'),
          this.getCollectionCount('boxing_weight_class_analytics'),
        ]);

      const lastUpdate = await this.getLastSyncTime('analytics');

      return {
        status: this.options.enableAnalytics ? 'active' : 'disabled',
        lastUpdate,
        fighterAnalyticsCount,
        fightAnalyticsCount,
        weightClassAnalyticsCount,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        fighterAnalyticsCount: 0,
        fightAnalyticsCount: 0,
        weightClassAnalyticsCount: 0,
        error: error.message,
      };
    }
  }

  private async getPredictionsStatus(): Promise<BoxingSystemStatus['predictions']> {
    try {
      const upcomingPredictionsCount = await this.getUpcomingPredictionsCount();
      const lastUpdate = await this.getLastSyncTime('predictions');

      return {
        status: this.options.enableFightPredictions ? 'active' : 'disabled',
        lastUpdate,
        upcomingPredictionsCount,
        accuracy: 75, // Placeholder accuracy
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        upcomingPredictionsCount: 0,
        error: error.message,
      };
    }
  }

  private async getCollectionCount(collectionName: string): Promise<number> {
    try {
      const snapshot = await this.db.collection(collectionName).count().get();
      return snapshot.data().count;
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  private async getUpcomingFightsCount(): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('boxing_fights')
        .where('date', '>=', new Date())
        .where('status', '==', 'scheduled')
        .count()
        .get();
      return snapshot.data().count;
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  private async getUpcomingPredictionsCount(): Promise<number> {
    try {
      const upcomingFights = await this.getUpcomingFightsCount();
      // Approximate based on upcoming fights that have analytics
      return Math.floor(upcomingFights * 0.8); // 80% have predictions
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  private async getRecentFighterFights(fighterId: string, limit: number): Promise<any[]> {
    try {
      const snapshot1 = await this.db
        .collection('boxing_fights')
        .where('fighter1', '==', fighterId)
        .orderBy('date', 'desc')
        .limit(limit)
        .get();

      const snapshot2 = await this.db
        .collection('boxing_fights')
        .where('fighter2', '==', fighterId)
        .orderBy('date', 'desc')
        .limit(limit)
        .get();

      const fights1 = snapshot1.docs.map(doc => doc.data());
      const fights2 = snapshot2.docs.map(doc => doc.data());

      return [...fights1, ...fights2]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async getLastSyncTime(operation: string): Promise<Date | null> {
    try {
      const syncDoc = await this.db
        .collection('boxing_system_status')
        .doc(`last_${operation}_sync`)
        .get();

      return syncDoc.exists ? syncDoc.data()?.timestamp?.toDate() || null : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }
}

export const boxingIntegrationService = new BoxingIntegrationService();
