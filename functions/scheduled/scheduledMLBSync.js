const functions = require('firebase-functions');
const admin = require('firebase-admin');
const * as Sentry from '@sentry/node';

// Initialize Sentry for MLB scheduled functions
Sentry.init({
  dsn: functions.config().sentry?.dsn,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true })
  ]
});

const { MLBDataSyncService } = require('../../services/mlb/mlbDataSyncService');
const { MLBAnalyticsService } = require('../../services/mlb/mlbAnalyticsService');
const { MLBMLPredictionService } = require('../../services/mlb/mlbMLPredictionService');

class ScheduledMLBSync {
  constructor() {
    this.mlbDataSync = new MLBDataSyncService();
    this.mlbAnalytics = new MLBAnalyticsService();
    this.mlbPredictions = new MLBMLPredictionService();
    this.db = admin.firestore();
  }

  async executeDailySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_mlb_sync',
      name: 'MLB Daily Data Sync'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting MLB daily sync',
        level: 'info',
        timestamp: Date.now()
      });

      // 1. Sync today's games and schedule
      const games = await this.mlbDataSync.syncTodaysGames();
      console.log(`Synced ${games.length} MLB games`);

      // 2. Sync player statistics
      await this.mlbDataSync.syncPlayerStats();
      console.log('MLB player stats synced');

      // 3. Sync team statistics
      await this.mlbDataSync.syncTeamStats();
      console.log('MLB team stats synced');

      // 4. Update weather data for outdoor games
      await this.mlbDataSync.syncWeatherData();
      console.log('MLB weather data synced');

      // 5. Generate analytics for today's games
      for (const game of games) {
        await this.mlbAnalytics.generateGameAnalytics(game.gameId);
      }
      console.log('MLB game analytics generated');

      // 6. Generate ML predictions for upcoming games
      const upcomingGames = games.filter(game => 
        new Date(game.dateTime) > new Date() && 
        new Date(game.dateTime) < new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      for (const game of upcomingGames) {
        await this.mlbPredictions.generateGamePredictions(game);
      }
      console.log(`Generated predictions for ${upcomingGames.length} upcoming games`);

      // 7. Update sync status
      await this.updateSyncStatus('success', {
        gamesProcessed: games.length,
        predictionsGenerated: upcomingGames.length,
        timestamp: new Date().toISOString()
      });

      Sentry.addBreadcrumb({
        message: 'MLB daily sync completed successfully',
        level: 'info',
        data: { gamesProcessed: games.length }
      });

      return { success: true, gamesProcessed: games.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in MLB daily sync:', error);
      
      await this.updateSyncStatus('error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeHourlySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_mlb_hourly',
      name: 'MLB Hourly Live Updates'
    });

    try {
      // 1. Update live game scores
      const liveGames = await this.mlbDataSync.syncLiveGames();
      
      // 2. Update injury reports
      await this.mlbDataSync.syncInjuryReports();
      
      // 3. Update betting lines if games are live
      if (liveGames.length > 0) {
        await this.mlbDataSync.syncLiveBettingLines();
      }

      // 4. Update real-time analytics for live games
      for (const game of liveGames) {
        await this.mlbAnalytics.updateLiveGameAnalytics(game.gameId);
      }

      console.log(`Updated ${liveGames.length} live MLB games`);
      
      return { success: true, liveGamesUpdated: liveGames.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in MLB hourly sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeWeeklySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_mlb_weekly',
      name: 'MLB Weekly Deep Analytics'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting MLB weekly sync',
        level: 'info'
      });

      // 1. Sync historical player performance trends
      await this.mlbDataSync.syncPlayerTrends();
      
      // 2. Update team chemistry and clubhouse metrics
      await this.mlbAnalytics.updateTeamChemistryMetrics();
      
      // 3. Analyze pitcher-batter matchup histories
      await this.mlbAnalytics.updatePitcherBatterMatchups();
      
      // 4. Update ballpark factors and environmental analytics
      await this.mlbAnalytics.updateBallparkFactors();
      
      // 5. Retrain ML models with week's data
      await this.mlbPredictions.retrainWeeklyModels();
      
      // 6. Generate advanced season projections
      await this.mlbAnalytics.generateSeasonProjections();

      console.log('MLB weekly analytics sync completed');
      
      return { success: true, message: 'Weekly MLB sync completed' };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in MLB weekly sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executePreGameSync(gameId) {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_mlb_pregame',
      name: 'MLB Pre-Game Analysis'
    });

    try {
      // 1. Get game details
      const game = await this.mlbDataSync.getGameDetails(gameId);
      
      // 2. Sync starting lineups
      await this.mlbDataSync.syncStartingLineups(gameId);
      
      // 3. Update weather conditions
      await this.mlbDataSync.updateGameWeather(gameId);
      
      // 4. Generate comprehensive pre-game analytics
      await this.mlbAnalytics.generatePreGameAnalytics(gameId);
      
      // 5. Update ML predictions with final lineups
      await this.mlbPredictions.updatePreGamePredictions(gameId);
      
      // 6. Generate betting insights
      await this.mlbAnalytics.generateBettingInsights(gameId);

      console.log(`Pre-game analysis completed for game ${gameId}`);
      
      return { success: true, gameId };

    } catch (error) {
      Sentry.captureException(error);
      console.error(`Error in MLB pre-game sync for ${gameId}:`, error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async updateSyncStatus(status, details) {
    await this.db.collection('sync_status').doc('mlb_daily').set({
      status,
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      details,
      sport: 'mlb'
    }, { merge: true });
  }
}

// Create instance
const mlbSync = new ScheduledMLBSync();

// Scheduled functions
exports.mlbDailySync = functions.pubsub
  .schedule('0 6 * * *') // 6 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    return await mlbSync.executeDailySync();
  });

exports.mlbHourlySync = functions.pubsub
  .schedule('0 * * * *') // Every hour
  .timeZone('America/New_York')
  .onRun(async (context) => {
    return await mlbSync.executeHourlySync();
  });

exports.mlbWeeklySync = functions.pubsub
  .schedule('0 3 * * 1') // 3 AM every Monday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    return await mlbSync.executeWeeklySync();
  });

// Triggered function for pre-game analysis (2 hours before game time)
exports.mlbPreGameSync = functions.firestore
  .document('mlb_games/{gameId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    
    // Trigger pre-game analysis when lineups are announced
    if (newValue.lineupStatus === 'announced' && previousValue.lineupStatus !== 'announced') {
      return await mlbSync.executePreGameSync(context.params.gameId);
    }
    
    return null;
  });

// Manual trigger function
exports.mlbManualSync = functions.https.onCall(async (data, context) => {
  // Verify authentication if needed
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { syncType, gameId } = data;
  
  try {
    switch (syncType) {
      case 'daily':
        return await mlbSync.executeDailySync();
      case 'hourly':
        return await mlbSync.executeHourlySync();
      case 'weekly':
        return await mlbSync.executeWeeklySync();
      case 'pregame':
        if (!gameId) {
          throw new functions.https.HttpsError('invalid-argument', 'gameId required for pregame sync');
        }
        return await mlbSync.executePreGameSync(gameId);
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid sync type');
    }
  } catch (error) {
    Sentry.captureException(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = ScheduledMLBSync;