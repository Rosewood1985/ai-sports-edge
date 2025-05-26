const functions = require('firebase-functions');
const admin = require('firebase-admin');
const * as Sentry from '@sentry/node';

// Initialize Sentry for WNBA scheduled functions
Sentry.init({
  dsn: functions.config().sentry?.dsn,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true })
  ]
});

const { WNBADataSyncService } = require('../../services/wnba/wnbaDataSyncService');
const { WNBAAnalyticsService } = require('../../services/wnba/wnbaAnalyticsService');
const { WNBAMLPredictionService } = require('../../services/wnba/wnbaMLPredictionService');

class ScheduledWNBASync {
  constructor() {
    this.wnbaDataSync = new WNBADataSyncService();
    this.wnbaAnalytics = new WNBAAnalyticsService();
    this.wnbaPredictions = new WNBAMLPredictionService();
    this.db = admin.firestore();
  }

  async executeDailySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_wnba_sync',
      name: 'WNBA Daily Data Sync'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting WNBA daily sync',
        level: 'info',
        timestamp: Date.now()
      });

      // 1. Sync today's games and schedule
      const games = await this.wnbaDataSync.syncTodaysGames();
      console.log(`Synced ${games.length} WNBA games`);

      // 2. Sync player statistics and advanced metrics
      await this.wnbaDataSync.syncPlayerStats();
      console.log('WNBA player stats synced');

      // 3. Sync team statistics and efficiency metrics
      await this.wnbaDataSync.syncTeamStats();
      console.log('WNBA team stats synced');

      // 4. Update injury reports
      await this.wnbaDataSync.syncInjuryReports();
      console.log('WNBA injury reports synced');

      // 5. Sync international player performance data
      await this.wnbaDataSync.syncInternationalData();
      console.log('WNBA international data synced');

      // 6. Update rookie and veteran experience metrics
      await this.wnbaDataSync.syncExperienceMetrics();
      console.log('WNBA experience metrics synced');

      // 7. Generate analytics for today's games
      for (const game of games) {
        await this.wnbaAnalytics.generateGameAnalytics(game.gameId);
      }
      console.log('WNBA game analytics generated');

      // 8. Generate ML predictions for upcoming games
      const upcomingGames = games.filter(game => 
        new Date(game.dateTime) > new Date() && 
        new Date(game.dateTime) < new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      for (const game of upcomingGames) {
        await this.wnbaPredictions.generateGamePredictions(game);
      }
      console.log(`Generated predictions for ${upcomingGames.length} upcoming games`);

      // 9. Update playoff race and standings
      await this.wnbaAnalytics.updatePlayoffRace();

      // 10. Update sync status
      await this.updateSyncStatus('success', {
        gamesProcessed: games.length,
        predictionsGenerated: upcomingGames.length,
        timestamp: new Date().toISOString()
      });

      Sentry.addBreadcrumb({
        message: 'WNBA daily sync completed successfully',
        level: 'info',
        data: { gamesProcessed: games.length }
      });

      return { success: true, gamesProcessed: games.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in WNBA daily sync:', error);
      
      await this.updateSyncStatus('error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeGameDaySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_wnba_gameday',
      name: 'WNBA Game Day Live Updates'
    });

    try {
      // 1. Update live game scores and stats
      const liveGames = await this.wnbaDataSync.syncLiveGames();
      
      // 2. Update in-game player rotations and minutes
      await this.wnbaDataSync.syncLiveRotations();
      
      // 3. Update live betting lines
      if (liveGames.length > 0) {
        await this.wnbaDataSync.syncLiveBettingLines();
      }

      // 4. Update real-time analytics for live games
      for (const game of liveGames) {
        await this.wnbaAnalytics.updateLiveGameAnalytics(game.gameId);
      }

      // 5. Update pace and tempo metrics in real-time
      for (const game of liveGames) {
        await this.wnbaAnalytics.updateLivePaceMetrics(game.gameId);
      }

      console.log(`Updated ${liveGames.length} live WNBA games`);
      
      return { success: true, liveGamesUpdated: liveGames.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in WNBA game day sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeWeeklySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_wnba_weekly',
      name: 'WNBA Weekly Deep Analytics'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting WNBA weekly sync',
        level: 'info'
      });

      // 1. Update advanced team chemistry metrics
      await this.wnbaAnalytics.updateTeamChemistryMetrics();
      
      // 2. Analyze leadership impact and veteran influence
      await this.wnbaAnalytics.updateLeadershipMetrics();
      
      // 3. Update international player adaptation trends
      await this.wnbaAnalytics.updateInternationalAdaptation();
      
      // 4. Analyze coaching rotation patterns and strategies
      await this.wnbaAnalytics.updateCoachingPatterns();
      
      // 5. Retrain ML models with week's data
      await this.wnbaPredictions.retrainWeeklyModels();
      
      // 6. Generate weekly power rankings
      await this.wnbaAnalytics.generatePowerRankings();
      
      // 7. Update All-Star and award projections
      await this.wnbaAnalytics.updateAwardProjections();

      console.log('WNBA weekly analytics sync completed');
      
      return { success: true, message: 'Weekly WNBA sync completed' };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in WNBA weekly sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executePreGameSync(gameId) {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_wnba_pregame',
      name: 'WNBA Pre-Game Analysis'
    });

    try {
      // 1. Get game details
      const game = await this.wnbaDataSync.getGameDetails(gameId);
      
      // 2. Sync starting lineups and rotations
      await this.wnbaDataSync.syncStartingLineups(gameId);
      
      // 3. Update injury and availability reports
      await this.wnbaDataSync.updatePlayerAvailability(gameId);
      
      // 4. Generate comprehensive pre-game analytics
      await this.wnbaAnalytics.generatePreGameAnalytics(gameId);
      
      // 5. Update ML predictions with final rosters
      await this.wnbaPredictions.updatePreGamePredictions(gameId);
      
      // 6. Generate matchup analysis (guard vs guard, post vs post)
      await this.wnbaAnalytics.generatePositionalMatchups(gameId);
      
      // 7. Update betting insights and value analysis
      await this.wnbaAnalytics.generateBettingInsights(gameId);

      console.log(`Pre-game analysis completed for game ${gameId}`);
      
      return { success: true, gameId };

    } catch (error) {
      Sentry.captureException(error);
      console.error(`Error in WNBA pre-game sync for ${gameId}:`, error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeAllStarSync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_wnba_allstar',
      name: 'WNBA All-Star Analysis'
    });

    try {
      // 1. Update All-Star voting and projections
      await this.wnbaAnalytics.updateAllStarProjections();
      
      // 2. Analyze All-Star break impact on teams
      await this.wnbaAnalytics.updateAllStarBreakImpact();
      
      // 3. Update rookie and sophomore analytics
      await this.wnbaAnalytics.updateRookieAnalytics();

      console.log('WNBA All-Star analytics updated');
      
      return { success: true, message: 'All-Star analysis completed' };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in WNBA All-Star sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async updateSyncStatus(status, details) {
    await this.db.collection('sync_status').doc('wnba_daily').set({
      status,
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      details,
      sport: 'wnba'
    }, { merge: true });
  }
}

// Create instance
const wnbaSync = new ScheduledWNBASync();

// Scheduled functions
exports.wnbaDailySync = functions.pubsub
  .schedule('0 7 * * *') // 7 AM daily (during WNBA season: May-October)
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Only run during WNBA season (May through October)
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    
    if (month >= 5 && month <= 10) {
      return await wnbaSync.executeDailySync();
    }
    
    return { success: true, message: 'Off-season - sync skipped' };
  });

exports.wnbaGameDaySync = functions.pubsub
  .schedule('*/10 * * * *') // Every 10 minutes during games
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // Only run during WNBA season
    if (month >= 5 && month <= 10) {
      return await wnbaSync.executeGameDaySync();
    }
    
    return { success: true, message: 'Off-season - sync skipped' };
  });

exports.wnbaWeeklySync = functions.pubsub
  .schedule('0 3 * * 1') // 3 AM every Monday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    if (month >= 5 && month <= 10) {
      return await wnbaSync.executeWeeklySync();
    }
    
    return { success: true, message: 'Off-season - sync skipped' };
  });

exports.wnbaAllStarSync = functions.pubsub
  .schedule('0 4 * * 3') // 4 AM every Wednesday (All-Star analysis)
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // Run during All-Star season (June-July)
    if (month >= 6 && month <= 7) {
      return await wnbaSync.executeAllStarSync();
    }
    
    return { success: true, message: 'Not All-Star period' };
  });

// Triggered function for pre-game analysis
exports.wnbaPreGameSync = functions.firestore
  .document('wnba_games/{gameId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    
    // Trigger pre-game analysis when starting lineups are announced
    if (newValue.lineupStatus === 'announced' && 
        previousValue.lineupStatus !== 'announced') {
      return await wnbaSync.executePreGameSync(context.params.gameId);
    }
    
    return null;
  });

// Manual trigger function
exports.wnbaManualSync = functions.https.onCall(async (data, context) => {
  // Verify authentication if needed
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { syncType, gameId } = data;
  
  try {
    switch (syncType) {
      case 'daily':
        return await wnbaSync.executeDailySync();
      case 'gameday':
        return await wnbaSync.executeGameDaySync();
      case 'weekly':
        return await wnbaSync.executeWeeklySync();
      case 'allstar':
        return await wnbaSync.executeAllStarSync();
      case 'pregame':
        if (!gameId) {
          throw new functions.https.HttpsError('invalid-argument', 'gameId required for pregame sync');
        }
        return await wnbaSync.executePreGameSync(gameId);
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid sync type');
    }
  } catch (error) {
    Sentry.captureException(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = ScheduledWNBASync;