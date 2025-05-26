const functions = require('firebase-functions');
const admin = require('firebase-admin');
const * as Sentry from '@sentry/node';

// Initialize Sentry for F1 scheduled functions
Sentry.init({
  dsn: functions.config().sentry?.dsn,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true })
  ]
});

const { F1DataSyncService } = require('../../services/f1/f1DataSyncService');
const { F1AnalyticsService } = require('../../services/f1/f1AnalyticsService');
const { F1MLPredictionService } = require('../../services/f1/f1MLPredictionService');

class ScheduledF1Sync {
  constructor() {
    this.f1DataSync = new F1DataSyncService();
    this.f1Analytics = new F1AnalyticsService();
    this.f1Predictions = new F1MLPredictionService();
    this.db = admin.firestore();
  }

  async executeDailySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_f1_sync',
      name: 'F1 Daily Data Sync'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting F1 daily sync',
        level: 'info',
        timestamp: Date.now()
      });

      // 1. Sync current season schedule and race weekends
      const races = await this.f1DataSync.syncRaceSchedule();
      console.log(`Synced ${races.length} F1 races`);

      // 2. Sync driver standings and statistics
      await this.f1DataSync.syncDriverStandings();
      console.log('F1 driver standings synced');

      // 3. Sync constructor standings and performance
      await this.f1DataSync.syncConstructorStandings();
      console.log('F1 constructor standings synced');

      // 4. Sync circuit data and characteristics
      await this.f1DataSync.syncCircuitData();
      console.log('F1 circuit data synced');

      // 5. Update weather forecasts for upcoming race weekends
      await this.f1DataSync.syncWeatherData();
      console.log('F1 weather data synced');

      // 6. Sync technical regulations and car specifications
      await this.f1DataSync.syncTechnicalData();
      console.log('F1 technical data synced');

      // 7. Generate analytics for upcoming races
      const upcomingRaces = races.filter(race => 
        new Date(race.date) > new Date() && 
        new Date(race.date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      );

      for (const race of upcomingRaces) {
        await this.f1Analytics.generateRaceAnalytics(race.raceId);
      }
      console.log('F1 race analytics generated');

      // 8. Generate ML predictions for upcoming races
      for (const race of upcomingRaces) {
        await this.f1Predictions.generateRacePredictions(race);
      }
      console.log(`Generated predictions for ${upcomingRaces.length} upcoming races`);

      // 9. Update championship projections
      await this.f1Analytics.updateChampionshipProjections();

      // 10. Update sync status
      await this.updateSyncStatus('success', {
        racesProcessed: races.length,
        predictionsGenerated: upcomingRaces.length,
        timestamp: new Date().toISOString()
      });

      Sentry.addBreadcrumb({
        message: 'F1 daily sync completed successfully',
        level: 'info',
        data: { racesProcessed: races.length }
      });

      return { success: true, racesProcessed: races.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in F1 daily sync:', error);
      
      await this.updateSyncStatus('error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeRaceWeekendSync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_f1_weekend',
      name: 'F1 Race Weekend Live Updates'
    });

    try {
      // 1. Update live session results (Practice, Qualifying, Race)
      const liveSessions = await this.f1DataSync.syncLiveSessions();
      
      // 2. Update real-time lap times and sector splits
      await this.f1DataSync.syncLiveTiming();
      
      // 3. Update tire strategies and pit stop data
      await this.f1DataSync.syncTireData();
      
      // 4. Update weather conditions during sessions
      await this.f1DataSync.updateLiveWeather();

      // 5. Update real-time analytics for active sessions
      for (const session of liveSessions) {
        await this.f1Analytics.updateLiveSessionAnalytics(session.sessionId);
      }

      // 6. Update championship implications in real-time
      if (liveSessions.some(s => s.sessionType === 'race')) {
        await this.f1Analytics.updateLiveChampionshipImplications();
      }

      console.log(`Updated ${liveSessions.length} live F1 sessions`);
      
      return { success: true, liveSessionsUpdated: liveSessions.length };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in F1 race weekend sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeWeeklySync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_f1_weekly',
      name: 'F1 Weekly Deep Analytics'
    });

    try {
      Sentry.addBreadcrumb({
        message: 'Starting F1 weekly sync',
        level: 'info'
      });

      // 1. Update driver performance trends and form
      await this.f1Analytics.updateDriverTrends();
      
      // 2. Analyze constructor development and upgrades
      await this.f1Analytics.updateConstructorDevelopment();
      
      // 3. Update circuit-specific performance analytics
      await this.f1Analytics.updateCircuitAnalytics();
      
      // 4. Analyze power unit reliability and performance
      await this.f1Analytics.updatePowerUnitAnalytics();
      
      // 5. Retrain ML models with week's data
      await this.f1Predictions.retrainWeeklyModels();
      
      // 6. Generate power rankings and form guide
      await this.f1Analytics.generatePowerRankings();
      
      // 7. Update season-long championship battle analysis
      await this.f1Analytics.updateChampionshipBattle();

      console.log('F1 weekly analytics sync completed');
      
      return { success: true, message: 'Weekly F1 sync completed' };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in F1 weekly sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executePreRaceSync(raceId) {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_f1_prerace',
      name: 'F1 Pre-Race Analysis'
    });

    try {
      // 1. Get race details and qualifying results
      const race = await this.f1DataSync.getRaceDetails(raceId);
      
      // 2. Sync final grid positions and penalties
      await this.f1DataSync.syncGridData(raceId);
      
      // 3. Update weather forecast for race day
      await this.f1DataSync.updateRaceWeather(raceId);
      
      // 4. Sync tire allocation and strategy predictions
      await this.f1DataSync.syncTireAllocations(raceId);
      
      // 5. Generate comprehensive pre-race analytics
      await this.f1Analytics.generatePreRaceAnalytics(raceId);
      
      // 6. Update ML predictions with qualifying results
      await this.f1Predictions.updatePreRacePredictions(raceId);
      
      // 7. Generate starting grid analysis and overtaking opportunities
      await this.f1Analytics.generateGridAnalysis(raceId);
      
      // 8. Update betting insights and value opportunities
      await this.f1Analytics.generateBettingInsights(raceId);

      console.log(`Pre-race analysis completed for race ${raceId}`);
      
      return { success: true, raceId };

    } catch (error) {
      Sentry.captureException(error);
      console.error(`Error in F1 pre-race sync for ${raceId}:`, error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async executeOffSeasonSync() {
    const transaction = Sentry.startTransaction({
      op: 'scheduled_f1_offseason',
      name: 'F1 Off-Season Analysis'
    });

    try {
      // 1. Update driver market and transfer analysis
      await this.f1Analytics.updateDriverMarket();
      
      // 2. Analyze technical regulation changes
      await this.f1Analytics.updateRegulationImpact();
      
      // 3. Update pre-season testing analysis
      await this.f1Analytics.updateTestingAnalysis();
      
      // 4. Generate season predictions and championship odds
      await this.f1Analytics.generateSeasonPredictions();

      console.log('F1 off-season analytics updated');
      
      return { success: true, message: 'Off-season analysis completed' };

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in F1 off-season sync:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async updateSyncStatus(status, details) {
    await this.db.collection('sync_status').doc('f1_daily').set({
      status,
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      details,
      sport: 'f1'
    }, { merge: true });
  }
}

// Create instance
const f1Sync = new ScheduledF1Sync();

// Scheduled functions
exports.f1DailySync = functions.pubsub
  .schedule('0 8 * * *') // 8 AM daily
  .timeZone('Europe/London') // F1 primarily European-based
  .onRun(async (context) => {
    return await f1Sync.executeDailySync();
  });

exports.f1RaceWeekendSync = functions.pubsub
  .schedule('*/5 * * * *') // Every 5 minutes during race weekends
  .timeZone('Europe/London')
  .onRun(async (context) => {
    // Only run during race weekends (Friday-Sunday)
    const now = new Date();
    const day = now.getDay();
    
    if (day >= 5 && day <= 0) { // Friday (5), Saturday (6), Sunday (0)
      return await f1Sync.executeRaceWeekendSync();
    }
    
    return { success: true, message: 'Not a race weekend' };
  });

exports.f1WeeklySync = functions.pubsub
  .schedule('0 4 * * 1') // 4 AM every Monday
  .timeZone('Europe/London')
  .onRun(async (context) => {
    return await f1Sync.executeWeeklySync();
  });

exports.f1OffSeasonSync = functions.pubsub
  .schedule('0 6 * * 3') // 6 AM every Wednesday during off-season
  .timeZone('Europe/London')
  .onRun(async (context) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // Run during off-season (December-February)
    if (month >= 12 || month <= 2) {
      return await f1Sync.executeOffSeasonSync();
    }
    
    return { success: true, message: 'In-season - off-season sync skipped' };
  });

// Triggered function for pre-race analysis
exports.f1PreRaceSync = functions.firestore
  .document('f1_races/{raceId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    
    // Trigger pre-race analysis when qualifying results are finalized
    if (newValue.qualifyingStatus === 'completed' && 
        previousValue.qualifyingStatus !== 'completed') {
      return await f1Sync.executePreRaceSync(context.params.raceId);
    }
    
    return null;
  });

// Manual trigger function
exports.f1ManualSync = functions.https.onCall(async (data, context) => {
  // Verify authentication if needed
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { syncType, raceId } = data;
  
  try {
    switch (syncType) {
      case 'daily':
        return await f1Sync.executeDailySync();
      case 'weekend':
        return await f1Sync.executeRaceWeekendSync();
      case 'weekly':
        return await f1Sync.executeWeeklySync();
      case 'offseason':
        return await f1Sync.executeOffSeasonSync();
      case 'prerace':
        if (!raceId) {
          throw new functions.https.HttpsError('invalid-argument', 'raceId required for prerace sync');
        }
        return await f1Sync.executePreRaceSync(raceId);
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid sync type');
    }
  } catch (error) {
    Sentry.captureException(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = ScheduledF1Sync;