const functions = require('firebase-functions');
const admin = require('firebase-admin');
const * as Sentry from '@sentry/node';

// Initialize Sentry for NFL scheduled functions
Sentry.init({
  dsn: functions.config().sentry?.dsn,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true })
  ]
});

const { NFLDataSyncService } = require('../../services/nfl/nflDataSyncService');
const { NFLAnalyticsService } = require('../../services/nfl/nflAnalyticsService');
const { NFLMLPredictionService } = require('../../services/nfl/nflMLPredictionService');

class ScheduledNFLSync {
  constructor() {
    this.nflDataSync = new NFLDataSyncService();
    this.nflAnalytics = new NFLAnalyticsService();
    this.nflPredictions = new NFLMLPredictionService();
    this.db = admin.firestore();
  }

  async executeDailySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_nfl_sync',
      name: 'NFL Daily Data Sync'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting NFL daily sync',
        level: 'info',
        timestamp: Date.now()
      });

      // 1. Sync this week's games and schedule
      const games = await this.nflDataSync.syncWeeklyGames();
      console.log(`Synced ${games.length} NFL games`);

      // 2. Sync player statistics and snap counts
      await this.nflDataSync.syncPlayerStats();
      console.log('NFL player stats synced');

      // 3. Sync team statistics and advanced metrics
      await this.nflDataSync.syncTeamStats();
      console.log('NFL team stats synced');

      // 4. Update injury reports (crucial for NFL)
      await this.nflDataSync.syncInjuryReports();
      console.log('NFL injury reports synced');

      // 5. Sync weather data for outdoor games
      await this.nflDataSync.syncWeatherData();
      console.log('NFL weather data synced');

      // 6. Update coaching staff and coordinator changes
      await this.nflDataSync.syncCoachingStaff();
      console.log('NFL coaching staff synced');

      // 7. Generate analytics for upcoming games
      const upcomingGames = games.filter(game => 
        new Date(game.dateTime) > new Date()
      );

      for (const game of upcomingGames) {
        await this.nflAnalytics.generateGameAnalytics(game.gameId);
      }
      console.log('NFL game analytics generated');

      // 8. Generate ML predictions for upcoming games
      for (const game of upcomingGames) {
        await this.nflPredictions.generateGamePredictions(game);
      }
      console.log(`Generated predictions for ${upcomingGames.length} upcoming games`);

      // 9. Update divisional standings and playoff implications
      await this.nflAnalytics.updateDivisionalStandings();
      
      // 10. Update sync status
      await this.updateSyncStatus('success', {
        gamesProcessed: games.length,
        predictionsGenerated: upcomingGames.length,
        timestamp: new Date().toISOString()
      });

      Sentry.addBreadcrumb({
        message: 'NFL daily sync completed successfully',
        level: 'info',
        data: { gamesProcessed: games.length }
      });

      return { success: true, gamesProcessed: games.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in NFL daily sync:', error);
      
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
      op: 'scheduled_nfl_gameday',
      name: 'NFL Game Day Live Updates'
    });

    try {
      // 1. Update live game scores and stats
      const liveGames = await this.nflDataSync.syncLiveGames();
      
      // 2. Update in-game injury reports
      await this.nflDataSync.syncLiveInjuries();
      
      // 3. Update live betting lines
      if (liveGames.length > 0) {
        await this.nflDataSync.syncLiveBettingLines();
      }

      // 4. Update real-time analytics for live games
      for (const game of liveGames) {
        await this.nflAnalytics.updateLiveGameAnalytics(game.gameId);
      }

      // 5. Update player snap counts and usage rates
      for (const game of liveGames) {
        await this.nflDataSync.updateSnapCounts(game.gameId);
      }

      console.log(`Updated ${liveGames.length} live NFL games`);
      
      return { success: true, liveGamesUpdated: liveGames.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in NFL game day sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeWeeklySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_nfl_weekly',
      name: 'NFL Weekly Deep Analytics'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting NFL weekly sync',
        level: 'info'
      });

      // 1. Sync advanced team metrics and efficiency ratings
      await this.nflAnalytics.updateAdvancedTeamMetrics();
      
      // 2. Update player performance trends and projections
      await this.nflDataSync.syncPlayerTrends();
      
      // 3. Analyze coaching tendencies and play-calling patterns
      await this.nflAnalytics.updateCoachingTendencies();
      
      // 4. Update strength of schedule and remaining schedule analysis
      await this.nflAnalytics.updateStrengthOfSchedule();
      
      // 5. Retrain ML models with week's data
      await this.nflPredictions.retrainWeeklyModels();
      
      // 6. Generate weekly power rankings
      await this.nflAnalytics.generatePowerRankings();
      
      // 7. Update playoff probability simulations
      await this.nflAnalytics.updatePlayoffProbabilities();

      console.log('NFL weekly analytics sync completed');
      
      return { success: true, message: 'Weekly NFL sync completed' };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in NFL weekly sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executePreGameSync(gameId) {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_nfl_pregame',
      name: 'NFL Pre-Game Analysis'
    });

    try {
      // 1. Get game details
      const game = await this.nflDataSync.getGameDetails(gameId);
      
      // 2. Sync inactive/active player lists
      await this.nflDataSync.syncPlayerStatus(gameId);
      
      // 3. Update final injury reports
      await this.nflDataSync.updateFinalInjuryReport(gameId);
      
      // 4. Update weather conditions (critical for NFL)
      await this.nflDataSync.updateGameWeather(gameId);
      
      // 5. Generate comprehensive pre-game analytics
      await this.nflAnalytics.generatePreGameAnalytics(gameId);
      
      // 6. Update ML predictions with final rosters and conditions
      await this.nflPredictions.updatePreGamePredictions(gameId);
      
      // 7. Generate positional matchup analysis
      await this.nflAnalytics.generateMatchupAnalysis(gameId);
      
      // 8. Update betting insights and sharp money tracking
      await this.nflAnalytics.generateBettingInsights(gameId);

      console.log(`Pre-game analysis completed for game ${gameId}`);
      
      return { success: true, gameId };

    } catch (error) {
      Sentry.captureException(error);
      console.error(`Error in NFL pre-game sync for ${gameId}:`, error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeByeWeekSync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_nfl_byeweek',
      name: 'NFL Bye Week Analysis'
    });

    try {
      // 1. Update player rest impact analytics
      await this.nflAnalytics.updateByeWeekAnalytics();
      
      // 2. Analyze post-bye week performance trends
      await this.nflAnalytics.updatePostByeAnalytics();
      
      // 3. Update coaching preparation time impact
      await this.nflAnalytics.updateCoachingPrepAnalytics();

      console.log('NFL bye week analytics updated');
      
      return { success: true, message: 'Bye week analysis completed' };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in NFL bye week sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async updateSyncStatus(status, details) {
    await this.db.collection('sync_status').doc('nfl_daily').set({
      status,
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      details,
      sport: 'nfl'
    }, { merge: true });
  }
}

// Create instance
const nflSync = new ScheduledNFLSync();

// Scheduled functions
exports.nflDailySync = functions.pubsub
  .schedule('0 5 * * *') // 5 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    return await nflSync.executeDailySync();
  });

exports.nflGameDaySync = functions.pubsub
  .schedule('*/15 * * * *') // Every 15 minutes on game days (Sunday, Monday, Thursday)
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = new Date();
    const day = now.getDay();
    
    // Only run on NFL game days: Sunday (0), Monday (1), Thursday (4)
    if (day === 0 || day === 1 || day === 4) {
      return await nflSync.executeGameDaySync();
    }
    
    return { success: true, message: 'Not a game day' };
  });

exports.nflWeeklySync = functions.pubsub
  .schedule('0 2 * * 2') // 2 AM every Tuesday (after Monday Night Football)
  .timeZone('America/New_York')
  .onRun(async (context) => {
    return await nflSync.executeWeeklySync();
  });

exports.nflByeWeekSync = functions.pubsub
  .schedule('0 4 * * 3') // 4 AM every Wednesday (bye week analysis)
  .timeZone('America/New_York')
  .onRun(async (context) => {
    return await nflSync.executeByeWeekSync();
  });

// Triggered function for pre-game analysis (3 hours before kickoff)
exports.nflPreGameSync = functions.firestore
  .document('nfl_games/{gameId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    
    // Trigger pre-game analysis when inactive lists are published
    if (newValue.inactiveListStatus === 'published' && 
        previousValue.inactiveListStatus !== 'published') {
      return await nflSync.executePreGameSync(context.params.gameId);
    }
    
    return null;
  });

// Manual trigger function
exports.nflManualSync = functions.https.onCall(async (data, context) => {
  // Verify authentication if needed
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { syncType, gameId } = data;
  
  try {
    switch (syncType) {
      case 'daily':
        return await nflSync.executeDailySync();
      case 'gameday':
        return await nflSync.executeGameDaySync();
      case 'weekly':
        return await nflSync.executeWeeklySync();
      case 'byeweek':
        return await nflSync.executeByeWeekSync();
      case 'pregame':
        if (!gameId) {
          throw new functions.https.HttpsError('invalid-argument', 'gameId required for pregame sync');
        }
        return await nflSync.executePreGameSync(gameId);
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid sync type');
    }
  } catch (error) {
    Sentry.captureException(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = ScheduledNFLSync;