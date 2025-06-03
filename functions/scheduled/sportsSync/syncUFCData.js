const { wrapScheduledFunction } = require("../../utils/sentryUtils");
const { UFCDataSyncService } = require("../../../services/ufc/ufcDataSyncService");

/**
 * Scheduled function to sync all UFC data
 * Runs daily at 6 AM UTC to update fighter profiles, rankings, and historical data
 */
const syncUFCDataScheduled = wrapScheduledFunction(
  "syncUFCData",
  async context => {
    const ufcSync = new UFCDataSyncService();

    try {
      console.log("Starting scheduled UFC data sync...");

      await ufcSync.syncAllUFCData();

      console.log("UFC data sync completed successfully");

      return {
        success: true,
        message: "UFC data sync completed",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("UFC data sync failed:", error);
      throw error;
    }
  },
  {
    memory: "1GB",
    timeoutSeconds: 540, // 9 minutes
    schedule: "0 6 * * *", // Daily at 6 AM UTC
  }
);

module.exports = {
  syncUFCData: syncUFCDataScheduled,
};
