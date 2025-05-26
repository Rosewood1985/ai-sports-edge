const { wrapScheduledFunction } = require('../../utils/sentryUtils');
const { UFCDataSyncService } = require('../../../services/ufc/ufcDataSyncService');

/**
 * Scheduled function to sync UFC events
 * Runs every 6 hours to keep event information current
 */
const syncUFCEventsScheduled = wrapScheduledFunction(
  'syncUFCEvents',
  async context => {
    const ufcSync = new UFCDataSyncService();

    try {
      console.log('Starting scheduled UFC events sync...');

      await ufcSync.syncEvents();

      console.log('UFC events sync completed successfully');

      return {
        success: true,
        message: 'UFC events sync completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('UFC events sync failed:', error);
      throw error;
    }
  },
  {
    memory: '512MB',
    timeoutSeconds: 300, // 5 minutes
    schedule: '0 */6 * * *', // Every 6 hours
  }
);

module.exports = {
  syncUFCEvents: syncUFCEventsScheduled,
};
