// =============================================================================
// SCHEDULED COLLEGE FOOTBALL SYNC FUNCTIONS
// Firebase Cloud Functions for automated CFB data synchronization
// =============================================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { DailyFootballSyncService } = require('../services/dailyFootballSyncService');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const dailyFootballSync = new DailyFootballSyncService();

/**
 * Daily College Football Sync - 6 AM EST
 * Comprehensive daily sync during CFB season
 */
exports.cfbDailySync = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting scheduled CFB daily sync');
    
    try {
      const report = await dailyFootballSync.executeDailySync({
        enableNFL: false,
        enableCFB: true,
        enableRealTimeUpdates: true,
        enableAdvancedCaching: true,
        syncPriority: 'cost-optimized',
      });

      console.log('CFB daily sync completed:', {
        status: report.cfbSync.status,
        duration: report.cfbSync.duration,
        recordsProcessed: report.cfbSync.recordsProcessed,
      });

      return { success: true, report };
    } catch (error) {
      console.error('CFB daily sync failed:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Saturday Game Day Sync - Every 15 minutes during CFB games
 * High-frequency updates on game days
 */
exports.cfbGameDaySync = functions.pubsub
  .schedule('*/15 * * * 6') // Every 15 minutes on Saturdays
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting CFB game day sync');
    
    try {
      const report = await dailyFootballSync.triggerImmediateSync({
        enableNFL: false,
        enableCFB: true,
        enableRealTimeUpdates: true,
        enableAdvancedCaching: true,
        syncPriority: 'speed',
      });

      console.log('CFB game day sync completed:', {
        status: report.cfbSync.status,
        duration: report.cfbSync.duration,
      });

      return { success: true, report };
    } catch (error) {
      console.error('CFB game day sync failed:', error);
      // Don't throw error to prevent function retries during busy periods
      return { success: false, error: error.message };
    }
  });

/**
 * Transfer Portal Monday Sync - Weekly transfer portal updates
 * Monday 7 AM during transfer windows
 */
exports.cfbTransferPortalSync = functions.pubsub
  .schedule('0 7 * * 1') // 7 AM every Monday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting CFB transfer portal sync');
    
    try {
      const cfbService = require('../services/collegefootball/collegefootballDataSyncService');
      const service = new cfbService.CollegeFootballDataSyncService();
      
      await service.syncTransferPortalActivity();
      
      console.log('CFB transfer portal sync completed');
      return { success: true };
    } catch (error) {
      console.error('CFB transfer portal sync failed:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Recruiting Updates - Tuesday 8 AM during recruiting seasons
 * Weekly recruiting class updates
 */
exports.cfbRecruitingSync = functions.pubsub
  .schedule('0 8 * * 2') // 8 AM every Tuesday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting CFB recruiting sync');
    
    try {
      const cfbService = require('../services/collegefootball/collegefootballDataSyncService');
      const service = new cfbService.CollegeFootballDataSyncService();
      
      await service.syncRecruitingData();
      
      console.log('CFB recruiting sync completed');
      return { success: true };
    } catch (error) {
      console.error('CFB recruiting sync failed:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Rankings Update - Sunday 10 PM after week completion
 * Weekly rankings and standings updates
 */
exports.cfbRankingsSync = functions.pubsub
  .schedule('0 22 * * 0') // 10 PM every Sunday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting CFB rankings sync');
    
    try {
      const cfbService = require('../services/collegefootball/collegefootballDataSyncService');
      const service = new cfbService.CollegeFootballDataSyncService();
      
      await service.syncRankings();
      await service.syncConferenceData();
      
      console.log('CFB rankings sync completed');
      return { success: true };
    } catch (error) {
      console.error('CFB rankings sync failed:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Coaching Changes Alert - Daily 9 AM during off-season
 * Monitor coaching carousel and staff changes
 */
exports.cfbCoachingChangesSync = functions.pubsub
  .schedule('0 9 * * *') // 9 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting CFB coaching changes sync');
    
    try {
      const cfbService = require('../services/collegefootball/collegefootballDataSyncService');
      const service = new cfbService.CollegeFootballDataSyncService();
      
      await service.syncCoachingChanges();
      
      console.log('CFB coaching changes sync completed');
      return { success: true };
    } catch (error) {
      console.error('CFB coaching changes sync failed:', error);
      // Don't throw - coaching changes are not critical
      return { success: false, error: error.message };
    }
  });

/**
 * Conference Realignment Monitor - First day of each month
 * Track conference changes and realignment news
 */
exports.cfbConferenceRealignmentSync = functions.pubsub
  .schedule('0 10 1 * *') // 10 AM on the 1st of each month
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting CFB conference realignment sync');
    
    try {
      const cfbService = require('../services/collegefootball/collegefootballDataSyncService');
      const service = new cfbService.CollegeFootballDataSyncService();
      
      await service.syncConferenceRealignment();
      
      console.log('CFB conference realignment sync completed');
      return { success: true };
    } catch (error) {
      console.error('CFB conference realignment sync failed:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Bowl Season Sync - Every 2 hours during bowl season (December-January)
 * Intensive updates during postseason
 */
exports.cfbBowlSeasonSync = functions.pubsub
  .schedule('0 */2 * 12,1 *') // Every 2 hours in December and January
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting CFB bowl season sync');
    
    try {
      const report = await dailyFootballSync.triggerImmediateSync({
        enableNFL: false,
        enableCFB: true,
        enableRealTimeUpdates: true,
        enableAdvancedCaching: true,
        syncPriority: 'accuracy',
      });

      console.log('CFB bowl season sync completed:', {
        status: report.cfbSync.status,
        duration: report.cfbSync.duration,
        recordsProcessed: report.cfbSync.recordsProcessed,
      });

      return { success: true, report };
    } catch (error) {
      console.error('CFB bowl season sync failed:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Manual Trigger Function for Admin Use
 * Allows manual execution of CFB sync operations
 */
exports.cfbManualSync = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can trigger manual syncs'
    );
  }

  const { syncType = 'full', priority = 'cost-optimized' } = data;

  console.log(`Manual CFB sync triggered: ${syncType}`);

  try {
    let result;

    switch (syncType) {
      case 'full':
        result = await dailyFootballSync.triggerImmediateSync({
          enableNFL: false,
          enableCFB: true,
          enableRealTimeUpdates: true,
          enableAdvancedCaching: true,
          syncPriority: priority,
        });
        break;

      case 'transfer-portal':
        const cfbService = require('../services/collegefootball/collegefootballDataSyncService');
        const service = new cfbService.CollegeFootballDataSyncService();
        await service.syncTransferPortalActivity();
        result = { success: true, type: 'transfer-portal' };
        break;

      case 'recruiting':
        const cfbService2 = require('../services/collegefootball/collegefootballDataSyncService');
        const service2 = new cfbService2.CollegeFootballDataSyncService();
        await service2.syncRecruitingData();
        result = { success: true, type: 'recruiting' };
        break;

      case 'rankings':
        const cfbService3 = require('../services/collegefootball/collegefootballDataSyncService');
        const service3 = new cfbService3.CollegeFootballDataSyncService();
        await service3.syncRankings();
        result = { success: true, type: 'rankings' };
        break;

      default:
        throw new Error(`Unknown sync type: ${syncType}`);
    }

    console.log(`Manual CFB sync completed: ${syncType}`);
    return result;
  } catch (error) {
    console.error(`Manual CFB sync failed: ${syncType}`, error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Health Check Function
 * Returns status of CFB sync operations
 */
exports.cfbSyncHealth = functions.https.onRequest(async (req, res) => {
  try {
    const health = await dailyFootballSync.getSyncHealth();
    
    res.status(200).json({
      service: 'College Football Sync',
      timestamp: new Date().toISOString(),
      health,
    });
  } catch (error) {
    console.error('CFB sync health check failed:', error);
    res.status(500).json({
      service: 'College Football Sync',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Performance Metrics Function
 * Returns detailed performance and cache statistics
 */
exports.cfbSyncMetrics = functions.https.onCall(async (data, context) => {
  try {
    const latestReport = await dailyFootballSync.getLatestSyncReport();
    
    if (!latestReport) {
      return {
        error: 'No sync reports available',
        recommendations: ['Execute initial sync'],
      };
    }

    return {
      cfbSync: latestReport.cfbSync,
      cacheStats: latestReport.cacheStats,
      performanceMetrics: latestReport.performanceMetrics,
      timestamp: latestReport.timestamp,
    };
  } catch (error) {
    console.error('CFB sync metrics failed:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});