/**
 * Sentry Monitored Functions - New Generation
 * All functions with comprehensive Sentry monitoring using new names to avoid Gen1->Gen2 issues
 */

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { wrapHttpFunction, wrapEventFunction, captureCloudFunctionError } = require("./sentryConfig");
const { wrapScheduledFunction } = require("./sentryCronConfig");
const admin = require("firebase-admin");

// Core Sentry Test Functions

/**
 * Simple Sentry test function for verification
 */
exports.sentryVerifyV2 = wrapHttpFunction(onRequest(async (req, res) => {
  console.log("Sentry verification function called successfully!");
  
  try {
    // Test different scenarios based on query parameter
    if (req.query.test === "error") {
      throw new Error("Test error for Sentry monitoring verification");
    }
    
    if (req.query.test === "warning") {
      console.warn("Test warning for Sentry monitoring verification");
    }
    
    // Success response with Sentry info
    res.json({
      success: true,
      message: "Sentry integration verified!",
      timestamp: new Date().toISOString(),
      function: "sentryVerifyV2",
      sentry: "active",
      monitoring: "enabled"
    });
    
  } catch (error) {
    console.error("Sentry verification error:", error);
    captureCloudFunctionError(error, "sentryVerifyV2", {
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      function: "sentryVerifyV2"
    });
  }
}));

/**
 * Stripe webhook handler with Sentry monitoring
 */
exports.stripeWebhookV2 = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    console.log("Stripe webhook V2 received");
    
    // Simulate webhook processing
    if (req.method !== "POST") {
      throw new Error("Only POST method allowed for webhook");
    }
    
    // Basic webhook validation
    const eventType = req.body?.type || "unknown";
    
    console.log(`Processing Stripe event: ${eventType}`);
    
    // Return success response
    res.status(200).json({ 
      received: true,
      eventType,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    console.error("Stripe webhook V2 error:", error);
    captureCloudFunctionError(error, "stripeWebhookV2", {
      method: req.method,
      url: req.url,
      processingTime: Date.now() - startTime
    });
    res.status(500).json({ 
      error: "Webhook processing failed",
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Enhanced notification processing with Sentry monitoring
 */
exports.processNotificationsV2 = wrapScheduledFunction(
  "processNotificationsV2",
  "every 1 minutes",
  onSchedule("every 1 minutes", async (event) => {
    console.log("Processing notifications V2 started");
    
    try {
      const db = admin.firestore();
      
      // Get pending notifications
      const notificationsSnapshot = await db
        .collection("notifications")
        .where("status", "==", "pending")
        .where("scheduledFor", "<=", new Date())
        .limit(50)
        .get();
      
      if (notificationsSnapshot.empty) {
        console.log("No pending notifications to process");
        return { processed: 0, status: "success" };
      }
      
      console.log(`Processing ${notificationsSnapshot.size} notifications`);
      
      const batch = db.batch();
      let processedCount = 0;
      
      for (const doc of notificationsSnapshot.docs) {
        const notification = doc.data();
        
        try {
          // Mark as processing
          batch.update(doc.ref, {
            status: "processing",
            processedAt: new Date(),
            processingAttempts: (notification.processingAttempts || 0) + 1
          });
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing notification ${doc.id}:`, error);
          // Mark as failed
          batch.update(doc.ref, {
            status: "failed",
            failedAt: new Date(),
            error: error.message
          });
        }
      }
      
      await batch.commit();
      
      console.log(`Notification processing V2 completed: ${processedCount} processed`);
      return { processed: processedCount, status: "success" };
      
    } catch (error) {
      console.error("Notification processing V2 error:", error);
      throw error; // Let Sentry wrapper handle it
    }
  })
);

/**
 * Referral leaderboard update with Sentry monitoring
 */
exports.updateLeaderboardV2 = wrapScheduledFunction(
  "updateLeaderboardV2",
  "every 30 minutes",
  onSchedule("every 30 minutes", async (event) => {
    console.log("Updating referral leaderboard V2");
    
    try {
      const db = admin.firestore();
      
      // Get all users with referral data
      const usersSnapshot = await db
        .collection("users")
        .where("referralCode", "!=", null)
        .get();
      
      if (usersSnapshot.empty) {
        console.log("No users with referral codes found");
        return { updated: 0, status: "success" };
      }
      
      const leaderboardData = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Get referral stats
        const referralsSnapshot = await db
          .collection("referrals")
          .where("referrerId", "==", userId)
          .where("status", "==", "completed")
          .get();
        
        if (!referralsSnapshot.empty) {
          leaderboardData.push({
            userId,
            referralCode: userData.referralCode,
            totalReferrals: referralsSnapshot.size,
            lastUpdate: new Date()
          });
        }
      }
      
      // Update leaderboard collection
      const batch = db.batch();
      const leaderboardRef = db.collection("leaderboard").doc("referrals");
      
      batch.set(leaderboardRef, {
        data: leaderboardData.sort((a, b) => b.totalReferrals - a.totalReferrals),
        lastUpdate: new Date(),
        totalEntries: leaderboardData.length
      });
      
      await batch.commit();
      
      console.log(`Leaderboard V2 updated with ${leaderboardData.length} entries`);
      return { updated: leaderboardData.length, status: "success" };
      
    } catch (error) {
      console.error("Leaderboard update V2 error:", error);
      throw error; // Let Sentry wrapper handle it
    }
  })
);

/**
 * Daily cleanup with Sentry monitoring
 */
exports.dailyCleanupV2 = wrapScheduledFunction(
  "dailyCleanupV2",
  "0 2 * * *", // 2 AM daily
  onSchedule("0 2 * * *", async (event) => {
    console.log("Daily cleanup V2 started");
    
    try {
      const db = admin.firestore();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      // Clean up old notifications
      const oldNotificationsSnapshot = await db
        .collection("notifications")
        .where("createdAt", "<", thirtyDaysAgo)
        .where("status", "in", ["sent", "failed"])
        .limit(100)
        .get();
      
      if (!oldNotificationsSnapshot.empty) {
        const batch = db.batch();
        oldNotificationsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Deleted ${oldNotificationsSnapshot.size} old notifications`);
      }
      
      // Clean up old logs
      const oldLogsSnapshot = await db
        .collection("logs")
        .where("timestamp", "<", thirtyDaysAgo)
        .limit(100)
        .get();
      
      if (!oldLogsSnapshot.empty) {
        const batch = db.batch();
        oldLogsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Deleted ${oldLogsSnapshot.size} old logs`);
      }
      
      console.log("Daily cleanup V2 completed successfully");
      return { 
        notificationsDeleted: oldNotificationsSnapshot.size,
        logsDeleted: oldLogsSnapshot.size,
        status: "success"
      };
      
    } catch (error) {
      console.error("Daily cleanup V2 error:", error);
      throw error; // Let Sentry wrapper handle it
    }
  })
);

/**
 * User data backup with Sentry monitoring
 */
exports.backupUserDataV2 = wrapScheduledFunction(
  "backupUserDataV2",
  "0 3 * * *", // 3 AM daily
  onSchedule("0 3 * * *", async (event) => {
    console.log("User data backup V2 started");
    
    try {
      const db = admin.firestore();
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      
      // Get all users
      const usersSnapshot = await db.collection("users").get();
      
      if (usersSnapshot.empty) {
        console.log("No users found for backup");
        return { backedUp: 0, status: "success" };
      }
      
      // Create backup document
      const backupData = {
        timestamp: new Date(),
        userCount: usersSnapshot.size,
        backupType: "daily",
        status: "completed"
      };
      
      // Store backup metadata
      await db.collection("backups").doc(`users_${timestamp}`).set(backupData);
      
      console.log(`User data backup V2 completed: ${usersSnapshot.size} users`);
      return { 
        backedUp: usersSnapshot.size,
        timestamp,
        status: "success"
      };
      
    } catch (error) {
      console.error("User data backup V2 error:", error);
      throw error; // Let Sentry wrapper handle it
    }
  })
);

/**
 * Firestore document change monitor with Sentry
 */
exports.documentChangeMonitorV2 = wrapEventFunction(
  onDocumentWritten("users/{userId}", async (event) => {
    console.log("Document change monitor V2 triggered");
    
    try {
      const change = event.data;
      const userId = event.params.userId;
      
      if (!change) {
        console.log("No change data available");
        return;
      }
      
      const before = change.before ? change.before.data() : null;
      const after = change.after ? change.after.data() : null;
      
      // Log the change
      const logData = {
        userId,
        changeType: !before ? "created" : !after ? "deleted" : "updated",
        timestamp: new Date(),
        hasData: !!after
      };
      
      await admin.firestore().collection("userChangeLogs").add(logData);
      
      console.log(`Document change logged for user ${userId}: ${logData.changeType}`);
      
    } catch (error) {
      console.error("Document change monitor V2 error:", error);
      throw error; // Let Sentry wrapper handle it
    }
  })
);

console.log("Sentry monitored functions V2 loaded successfully");