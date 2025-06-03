const { wrapScheduledFunction } = require("../../utils/sentryUtils");
const { UFCDataSyncService } = require("../../../services/ufc/ufcDataSyncService");
const {
  UFCBettingIntelligenceService,
} = require("../../../services/ufc/ufcBettingIntelligenceService");

/**
 * Scheduled function to sync UFC odds and generate betting intelligence
 * Runs every 2 hours during active betting periods
 */
const syncUFCOddsScheduled = wrapScheduledFunction(
  "syncUFCOdds",
  async context => {
    const ufcSync = new UFCDataSyncService();
    const bettingIntel = new UFCBettingIntelligenceService();

    try {
      console.log("Starting scheduled UFC odds sync...");

      // First sync the odds data
      await ufcSync.syncOdds();

      console.log("UFC odds sync completed, generating betting intelligence...");

      // Get upcoming events to generate betting intelligence for
      const upcomingEvents = await ufcSync.getUpcomingEvents();

      for (const event of upcomingEvents) {
        try {
          await bettingIntel.generateBettingIntelligence(event.id);
          console.log(`Generated betting intelligence for event ${event.id}`);
        } catch (error) {
          console.error(`Failed to generate betting intelligence for event ${event.id}:`, error);
          // Continue with other events even if one fails
        }
      }

      console.log("UFC odds sync and betting intelligence generation completed successfully");

      return {
        success: true,
        message: "UFC odds sync and betting intelligence completed",
        eventsProcessed: upcomingEvents.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("UFC odds sync failed:", error);
      throw error;
    }
  },
  {
    memory: "1GB",
    timeoutSeconds: 480, // 8 minutes
    schedule: "0 */2 * * *", // Every 2 hours
  }
);

module.exports = {
  syncUFCOdds: syncUFCOddsScheduled,
};
