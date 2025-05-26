// =============================================================================
// NCAA BASKETBALL INTEGRATION SERVICE
// Comprehensive NCAA Basketball and March Madness System Integration
// =============================================================================

import { NCAABasketballDataSyncService } from './ncaaBasketballDataSyncService';
import { NCAABasketballAnalyticsService } from './ncaaBasketballAnalyticsService';
import { NCAABasketballMLPredictionService } from './ncaaBasketballMLPredictionService';
import { initSentry } from '../sentryConfig';
import * as admin from 'firebase-admin';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface NCAAIntegrationOptions {
  enableRealTimeUpdates?: boolean;
  enablePredictions?: boolean;
  enableAnalytics?: boolean;
  enableMarchMadnessMode?: boolean;
  cacheTimeouts?: {
    teamData: number;
    gameData: number;
    analytics: number;
    predictions: number;
    bracketData: number;
  };
}

export interface NCAASystemStatus {
  dataSync: {
    status: 'active' | 'error' | 'disabled';
    lastSync: Date | null;
    nextSync: Date | null;
    teamsCount: number;
    playersCount: number;
    gamesCount: number;
    tournamentGamesCount: number;
    error?: string;
  };
  analytics: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    teamAnalyticsCount: number;
    playerAnalyticsCount: number;
    marchMadnessAnalyticsCount: number;
    error?: string;
  };
  predictions: {
    status: 'active' | 'error' | 'disabled';
    lastUpdate: Date | null;
    predictionsCount: number;
    bracketPredictionsCount: number;
    accuracy?: number;
    tournamentAccuracy?: number;
    error?: string;
  };
  marchMadnessMode: {
    enabled: boolean;
    currentPhase: 'off-season' | 'selection-sunday' | 'first-four' | 'first-round' | 'second-round' | 'sweet-sixteen' | 'elite-eight' | 'final-four' | 'championship';
    bracketLocked: boolean;
    realTimeUpdates: boolean;
  };
}

export interface NCAAComprehensiveTeamData {
  team: any;
  analytics: any;
  upcomingGames: any[];
  predictions: any[];
  players: any[];
  tournamentHistory: any;
  bracketPosition?: any;
  matchupAnalysis?: any;
  lastUpdated: Date;
}

export interface MarchMadnessInsights {
  date: Date;
  phase: string;
  todaysGames: any[];
  upsetWatch: any[];
  cinderellaTracker: any[];
  bracketBusters: any[];
  finalFourUpdate: any;
  championshipOdds: any[];
  keyStorylines: string[];
  mustWatchGames: any[];
}

export class NCAABasketballIntegrationService {
  private dataSyncService: NCAABasketballDataSyncService;
  private analyticsService: NCAABasketballAnalyticsService;
  private mlPredictionService: NCAABasketballMLPredictionService;
  private db: admin.firestore.Firestore;
  private options: NCAAIntegrationOptions;
  private syncInterval: NodeJS.Timeout | null = null;
  private analyticsInterval: NodeJS.Timeout | null = null;
  private predictionsInterval: NodeJS.Timeout | null = null;
  private marchMadnessInterval: NodeJS.Timeout | null = null;

  constructor(options: NCAAIntegrationOptions = {}) {
    this.options = {
      enableRealTimeUpdates: true,
      enablePredictions: true,
      enableAnalytics: true,
      enableMarchMadnessMode: this.isMarchMadnessSeason(),
      cacheTimeouts: {
        teamData: 3600000, // 1 hour
        gameData: 300000, // 5 minutes during March Madness
        analytics: 1800000, // 30 minutes
        predictions: 600000, // 10 minutes
        bracketData: 180000, // 3 minutes during tournament
      },
      ...options,
    };

    this.db = admin.firestore();
    this.dataSyncService = new NCAABasketballDataSyncService();
    this.analyticsService = new NCAABasketballAnalyticsService();
    this.mlPredictionService = new NCAABasketballMLPredictionService();
  }

  /**
   * Initialize the complete NCAA Basketball system
   */
  async initializeSystem(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing NCAA Basketball integration system',
        level: 'info',
      });

      // Initialize all subsystems in parallel
      await Promise.all([
        this.dataSyncService.initialize(),
        this.analyticsService.initialize(),
        this.mlPredictionService.initialize(),
      ]);

      // Start scheduled processes if enabled
      if (this.options.enableRealTimeUpdates) {
        await this.startScheduledProcesses();
      }

      // Start March Madness specific processes if enabled
      if (this.options.enableMarchMadnessMode) {
        await this.startMarchMadnessMode();
      }

      // Perform initial system sync
      await this.performInitialSync();

      console.log('NCAA Basketball Integration System initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize NCAA Basketball system: ${error.message}`);
    }
  }

  /**
   * Perform initial system synchronization
   */
  private async performInitialSync(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting NCAA Basketball initial sync',
        level: 'info',
      });

      // Phase 1: Core data synchronization
      console.log('Phase 1: Syncing core NCAA Basketball data...');
      await this.dataSyncService.syncAllNCAABasketballData();

      // Phase 2: Generate analytics for all teams
      if (this.options.enableAnalytics) {
        console.log('Phase 2: Generating NCAA Basketball analytics...');
        await this.generateSystemWideAnalytics();
      }

      // Phase 3: Generate predictions for upcoming games
      if (this.options.enablePredictions) {
        console.log('Phase 3: Generating NCAA Basketball predictions...');
        await this.generateUpcomingPredictions();
      }

      // Phase 4: March Madness specific initialization
      if (this.options.enableMarchMadnessMode) {
        console.log('Phase 4: Initializing March Madness features...');
        await this.initializeMarchMadnessFeatures();
      }

      // Update system status
      await this.updateSystemStatus();

      console.log('NCAA Basketball initial sync completed successfully');
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
      // Data sync frequency based on season
      const syncFrequency = this.options.enableMarchMadnessMode ? 
        10 * 60 * 1000 : // 10 minutes during March Madness
        30 * 60 * 1000;  // 30 minutes regular season

      this.syncInterval = setInterval(async () => {
        try {
          await this.performIncrementalSync();
        } catch (error) {
          Sentry.captureException(error);
          console.error('Scheduled data sync error:', error.message);
        }
      }, syncFrequency);

      // Analytics update every 2 hours (more frequent during tournament)
      const analyticsFrequency = this.options.enableMarchMadnessMode ? 
        60 * 60 * 1000 : // 1 hour during March Madness
        2 * 60 * 60 * 1000; // 2 hours regular season

      this.analyticsInterval = setInterval(async () => {
        try {
          await this.updateRecentAnalytics();
        } catch (error) {
          Sentry.captureException(error);
          console.error('Scheduled analytics update error:', error.message);
        }
      }, analyticsFrequency);

      // Predictions update frequency
      const predictionsFrequency = this.options.enableMarchMadnessMode ? 
        30 * 60 * 1000 : // 30 minutes during March Madness
        60 * 60 * 1000;  // 1 hour regular season

      this.predictionsInterval = setInterval(async () => {
        try {
          await this.updateUpcomingPredictions();
        } catch (error) {
          Sentry.captureException(error);
          console.error('Scheduled predictions update error:', error.message);
        }
      }, predictionsFrequency);

      console.log('NCAA Basketball scheduled processes started');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to start scheduled processes: ${error.message}`);
    }
  }

  /**
   * Start March Madness specific real-time monitoring
   */
  private async startMarchMadnessMode(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting March Madness mode',
        level: 'info',
      });

      // High-frequency updates during active tournament games
      this.marchMadnessInterval = setInterval(async () => {
        try {
          await this.updateMarchMadnessData();
        } catch (error) {
          Sentry.captureException(error);
          console.error('March Madness update error:', error.message);
        }
      }, 2 * 60 * 1000); // 2 minutes during active games

      console.log('March Madness mode activated');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to start March Madness mode: ${error.message}`);
    }
  }

  /**
   * Perform incremental data synchronization
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Performing NCAA Basketball incremental sync',
        level: 'info',
      });

      // Sync recent games and scores
      await this.dataSyncService.syncCurrentSeasonGames();

      // During tournament, sync tournament-specific data
      if (this.options.enableMarchMadnessMode) {
        await this.dataSyncService.syncTournamentGames();
        await this.dataSyncService.syncMarchMadnessBrackets();
      }

      console.log('NCAA Basketball incremental sync completed');
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
      console.log(`Generated analytics for ${teams.length} NCAA Basketball teams`);
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
        this.mlPredictionService.predictGame(game.homeTeam, game.awayTeam, game.date, game.tournamentInfo)
      );

      const predictions = await Promise.all(predictionPromises);
      console.log(`Generated predictions for ${predictions.length} upcoming NCAA Basketball games`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Prediction generation failed: ${error.message}`);
    }
  }

  /**
   * Initialize March Madness specific features
   */
  private async initializeMarchMadnessFeatures(): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();

      // Generate comprehensive tournament analytics
      await this.analyticsService.generateMarchMadnessAnalytics(currentYear);

      // Generate bracket predictions if bracket exists
      const bracket = await this.dataSyncService.getCurrentBracket();
      if (bracket) {
        await this.mlPredictionService.predictMarchMadnessBracket(currentYear);
      }

      console.log('March Madness features initialized');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`March Madness initialization failed: ${error.message}`);
    }
  }

  /**
   * Update March Madness specific data during tournament
   */
  private async updateMarchMadnessData(): Promise<void> {
    try {
      const currentPhase = this.getCurrentTournamentPhase();
      
      if (currentPhase !== 'off-season') {
        // Update bracket data
        await this.dataSyncService.syncMarchMadnessBrackets();
        
        // Update live game scores
        await this.dataSyncService.syncTournamentGames();
        
        // Update predictions based on new results
        const currentYear = new Date().getFullYear();
        await this.mlPredictionService.predictMarchMadnessBracket(currentYear);
        
        // Update analytics
        await this.analyticsService.generateMarchMadnessAnalytics(currentYear);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`March Madness data update failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<NCAASystemStatus> {
    try {
      const [dataSyncStatus, analyticsStatus, predictionsStatus] = await Promise.all([
        this.getDataSyncStatus(),
        this.getAnalyticsStatus(),
        this.getPredictionsStatus(),
      ]);

      const marchMadnessMode = {
        enabled: this.options.enableMarchMadnessMode || false,
        currentPhase: this.getCurrentTournamentPhase(),
        bracketLocked: await this.isBracketLocked(),
        realTimeUpdates: this.marchMadnessInterval !== null,
      };

      return {
        dataSync: dataSyncStatus,
        analytics: analyticsStatus,
        predictions: predictionsStatus,
        marchMadnessMode,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  /**
   * Get comprehensive team data including March Madness context
   */
  async getComprehensiveTeamData(teamId: string): Promise<NCAAComprehensiveTeamData> {
    try {
      const currentSeason = new Date().getFullYear();
      
      const [
        team,
        analytics,
        upcomingGames,
        players,
        tournamentHistory
      ] = await Promise.all([
        this.dataSyncService.getTeamById(teamId),
        this.analyticsService.getTeamAnalytics(teamId, currentSeason),
        this.dataSyncService.getUpcomingGames(5),
        this.getTeamPlayers(teamId),
        this.getTournamentHistory(teamId),
      ]);

      // Get predictions for upcoming games
      const predictionPromises = upcomingGames
        .filter(game => game.homeTeam === teamId || game.awayTeam === teamId)
        .map(game => {
          const gameId = `${game.homeTeam}_${game.awayTeam}_${game.date.getTime()}`;
          return this.mlPredictionService.getPrediction(gameId);
        });

      const predictions = (await Promise.all(predictionPromises)).filter(p => p !== null);

      // Get bracket position if in tournament
      let bracketPosition = null;
      let matchupAnalysis = null;
      
      if (this.options.enableMarchMadnessMode) {
        bracketPosition = await this.getBracketPosition(teamId);
        if (bracketPosition) {
          matchupAnalysis = await this.getMatchupAnalysis(teamId, bracketPosition);
        }
      }

      return {
        team,
        analytics,
        upcomingGames: upcomingGames.filter(game => game.homeTeam === teamId || game.awayTeam === teamId),
        predictions,
        players,
        tournamentHistory,
        bracketPosition,
        matchupAnalysis,
        lastUpdated: new Date(),
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get comprehensive team data: ${error.message}`);
    }
  }

  /**
   * Get daily March Madness insights
   */
  async getMarchMadnessInsights(date: Date = new Date()): Promise<MarchMadnessInsights> {
    try {
      const phase = this.getCurrentTournamentPhase();
      
      if (phase === 'off-season') {
        return {
          date,
          phase,
          todaysGames: [],
          upsetWatch: [],
          cinderellaTracker: [],
          bracketBusters: [],
          finalFourUpdate: null,
          championshipOdds: [],
          keyStorylines: ['March Madness is not currently active'],
          mustWatchGames: [],
        };
      }

      const [
        todaysGames,
        upsetPredictions,
        cinderellaTeams,
        championshipFavorites
      ] = await Promise.all([
        this.getTodaysTournamentGames(date),
        this.mlPredictionService.getUpsetPredictions(date.getFullYear(), 0.4),
        this.mlPredictionService.getCinderellaTeams(date.getFullYear()),
        this.mlPredictionService.getChampionshipFavorites(date.getFullYear()),
      ]);

      const bracketBusters = await this.identifyBracketBusters(date);
      const finalFourUpdate = await this.getFinalFourUpdate();
      const keyStorylines = await this.generateKeyStorylines(date);
      const mustWatchGames = this.identifyMustWatchGames(todaysGames, upsetPredictions);

      return {
        date,
        phase,
        todaysGames,
        upsetWatch: upsetPredictions.slice(0, 5),
        cinderellaTracker: cinderellaTeams.slice(0, 3),
        bracketBusters: bracketBusters.slice(0, 3),
        finalFourUpdate,
        championshipOdds: championshipFavorites.slice(0, 8),
        keyStorylines,
        mustWatchGames,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get March Madness insights: ${error.message}`);
    }
  }

  /**
   * Helper methods for status checks and utilities
   */
  
  private isMarchMadnessSeason(): boolean {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    return month >= 3 && month <= 4; // March-April
  }

  private getCurrentTournamentPhase(): NCAASystemStatus['marchMadnessMode']['currentPhase'] {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (month < 3 || month > 4) return 'off-season';
    if (month === 3 && day < 15) return 'selection-sunday';
    if (month === 3 && day >= 15 && day <= 17) return 'first-four';
    if (month === 3 && day >= 18 && day <= 21) return 'first-round';
    if (month === 3 && day >= 22 && day <= 24) return 'second-round';
    if (month === 3 && day >= 25 && day <= 28) return 'sweet-sixteen';
    if (month === 3 && day >= 29 || (month === 4 && day <= 1)) return 'elite-eight';
    if (month === 4 && day >= 2 && day <= 6) return 'final-four';
    if (month === 4 && day >= 7 && day <= 10) return 'championship';
    
    return 'off-season';
  }

  private async getDataSyncStatus(): Promise<NCAASystemStatus['dataSync']> {
    try {
      const [teamsCount, playersCount, gamesCount, tournamentGamesCount] = await Promise.all([
        this.getCollectionCount('ncaa_teams'),
        this.getCollectionCount('ncaa_players'),
        this.getCollectionCount('ncaa_games'),
        this.getCollectionCount('ncaa_tournament_games'),
      ]);

      const lastSync = await this.getLastSyncTime('data');
      const nextSync = this.syncInterval ? 
        new Date(Date.now() + (this.options.enableMarchMadnessMode ? 10 * 60 * 1000 : 30 * 60 * 1000)) : null;

      return {
        status: 'active',
        lastSync,
        nextSync,
        teamsCount,
        playersCount,
        gamesCount,
        tournamentGamesCount,
      };
    } catch (error) {
      return {
        status: 'error',
        lastSync: null,
        nextSync: null,
        teamsCount: 0,
        playersCount: 0,
        gamesCount: 0,
        tournamentGamesCount: 0,
        error: error.message,
      };
    }
  }

  private async getAnalyticsStatus(): Promise<NCAASystemStatus['analytics']> {
    try {
      const [teamAnalyticsCount, playerAnalyticsCount, marchMadnessAnalyticsCount] = await Promise.all([
        this.getCollectionCount('ncaa_team_analytics'),
        this.getCollectionCount('ncaa_player_analytics'),
        this.getCollectionCount('march_madness_analytics'),
      ]);

      const lastUpdate = await this.getLastSyncTime('analytics');

      return {
        status: this.options.enableAnalytics ? 'active' : 'disabled',
        lastUpdate,
        teamAnalyticsCount,
        playerAnalyticsCount,
        marchMadnessAnalyticsCount,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        teamAnalyticsCount: 0,
        playerAnalyticsCount: 0,
        marchMadnessAnalyticsCount: 0,
        error: error.message,
      };
    }
  }

  private async getPredictionsStatus(): Promise<NCAASystemStatus['predictions']> {
    try {
      const [predictionsCount, bracketPredictionsCount] = await Promise.all([
        this.getCollectionCount('ncaa_predictions'),
        this.getCollectionCount('march_madness_bracket_predictions'),
      ]);

      const lastUpdate = await this.getLastSyncTime('predictions');
      const accuracy = await this.mlPredictionService.validateTournamentAccuracy(new Date().getFullYear());
      const tournamentAccuracy = accuracy; // Same for now

      return {
        status: this.options.enablePredictions ? 'active' : 'disabled',
        lastUpdate,
        predictionsCount,
        bracketPredictionsCount,
        accuracy,
        tournamentAccuracy,
      };
    } catch (error) {
      return {
        status: 'error',
        lastUpdate: null,
        predictionsCount: 0,
        bracketPredictionsCount: 0,
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
        .collection('ncaa_system_status')
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
        .collection('ncaa_system_status')
        .doc('current_status')
        .set({
          ...status,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  private async updateRecentAnalytics(): Promise<void> {
    try {
      const recentGames = await this.dataSyncService.getUpcomingGames(1); // Today's games
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

  private async updateUpcomingPredictions(): Promise<void> {
    try {
      const upcomingGames = await this.dataSyncService.getUpcomingGames(2); // Next 2 days
      
      // Only update predictions that are stale
      const cacheTimeout = this.options.cacheTimeouts?.predictions || 600000;
      const cutoffTime = new Date(Date.now() - cacheTimeout);

      const gamesToUpdate = [];
      for (const game of upcomingGames) {
        const gameId = `${game.homeTeam}_${game.awayTeam}_${game.date.getTime()}`;
        const existingPrediction = await this.db
          .collection('ncaa_predictions')
          .doc(gameId)
          .get();

        if (!existingPrediction.exists || 
            existingPrediction.data()?.lastUpdated?.toDate() < cutoffTime) {
          gamesToUpdate.push(game);
        }
      }

      if (gamesToUpdate.length > 0) {
        const predictionPromises = gamesToUpdate.map(game =>
          this.mlPredictionService.predictGame(game.homeTeam, game.awayTeam, game.date, game.tournamentInfo)
        );

        await Promise.all(predictionPromises);
        console.log(`Updated predictions for ${gamesToUpdate.length} upcoming NCAA Basketball games`);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Upcoming predictions update failed: ${error.message}`);
    }
  }

  // Placeholder implementations for complex functionality
  private async isBracketLocked(): Promise<boolean> { return false; }
  private async getTeamPlayers(teamId: string): Promise<any[]> { return []; }
  private async getTournamentHistory(teamId: string): Promise<any> { return {}; }
  private async getBracketPosition(teamId: string): Promise<any> { return null; }
  private async getMatchupAnalysis(teamId: string, bracketPosition: any): Promise<any> { return null; }
  private async getTodaysTournamentGames(date: Date): Promise<any[]> { return []; }
  private async identifyBracketBusters(date: Date): Promise<any[]> { return []; }
  private async getFinalFourUpdate(): Promise<any> { return null; }
  private async generateKeyStorylines(date: Date): Promise<string[]> { return []; }
  private identifyMustWatchGames(games: any[], upsets: any[]): any[] { return []; }

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

      if (this.marchMadnessInterval) {
        clearInterval(this.marchMadnessInterval);
        this.marchMadnessInterval = null;
      }

      console.log('NCAA Basketball Integration Service shut down successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to shutdown NCAA Basketball service: ${error.message}`);
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

  async triggerMarchMadnessUpdate(): Promise<void> {
    if (this.options.enableMarchMadnessMode) {
      await this.updateMarchMadnessData();
    }
  }

  async enableMarchMadnessMode(): Promise<void> {
    this.options.enableMarchMadnessMode = true;
    await this.startMarchMadnessMode();
    await this.initializeMarchMadnessFeatures();
  }

  async disableMarchMadnessMode(): Promise<void> {
    this.options.enableMarchMadnessMode = false;
    if (this.marchMadnessInterval) {
      clearInterval(this.marchMadnessInterval);
      this.marchMadnessInterval = null;
    }
  }
}

export const ncaaBasketballIntegrationService = new NCAABasketballIntegrationService();