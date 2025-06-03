const Sentry = require("@sentry/google-cloud-serverless");

/**
 * Enhanced Sentry configuration for Firebase Cloud Functions with Cron Monitoring
 * Supports scheduled functions, background tasks, and cron job monitoring
 */

// Initialize Sentry with Cron Monitoring support
const SENTRY_DSN = "https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336";

function initSentryWithCron() {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    
    // Enable performance monitoring
    enableTracing: true,
    
    // Additional context for Firebase Functions
    initialScope: {
      tags: {
        platform: "firebase-functions",
        runtime: "node",
      },
      contexts: {
        serverless: {
          provider: "firebase",
          runtime: process.version,
        }
      }
    },

    beforeSend: (event) => {
      // Add additional context for scheduled functions
      if (event.contexts) {
        event.contexts.scheduled_function = {
          execution_id: process.env.FUNCTION_EXECUTION_ID,
          region: process.env.FUNCTION_REGION,
          memory: process.env.FUNCTION_MEMORY_MB,
        };
      }
      return event;
    },

    integrations: [
      // Add cron monitoring integration
      new Sentry.Integrations.Console(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });

  console.log("Sentry initialized with Cron Monitoring support");
}

/**
 * Wrapper for scheduled Firebase Cloud Functions with Sentry monitoring
 * @param {string} cronName - Name of the cron job for Sentry monitoring
 * @param {string} schedule - Cron schedule expression
 * @param {Function} handler - The function handler
 * @param {Object} options - Additional options
 * @returns {Function} Wrapped function with Sentry monitoring
 */
function wrapScheduledFunction(cronName, schedule, handler, options = {}) {
  return async (context) => {
    const checkInId = Sentry.captureCheckIn({
      monitorSlug: cronName,
      status: "in_progress",
    });

    const transaction = Sentry.startTransaction({
      name: cronName,
      op: "scheduled_function",
      tags: {
        schedule,
        execution_type: "scheduled",
      },
    });

    const startTime = Date.now();
    let success = false;
    let errorDetails = null;

    try {
      // Set transaction context
      Sentry.getCurrentHub().configureScope((scope) => {
        scope.setTag("function_name", cronName);
        scope.setTag("schedule", schedule);
        scope.setTag("execution_time", new Date().toISOString());
        scope.setContext("execution_context", {
          eventId: context.eventId,
          timestamp: context.timestamp,
          resource: context.resource,
        });
      });

      // Add breadcrumb for function start
      Sentry.addBreadcrumb({
        message: `Starting scheduled function: ${cronName}`,
        category: "scheduled_function",
        level: "info",
        data: {
          cronName,
          schedule,
          startTime: new Date().toISOString(),
        },
      });

      // Execute the handler
      const result = await handler(context);
      
      success = true;
      const duration = Date.now() - startTime;

      // Log successful execution
      Sentry.addBreadcrumb({
        message: `Completed scheduled function: ${cronName}`,
        category: "scheduled_function",
        level: "info",
        data: {
          cronName,
          duration,
          success: true,
        },
      });

      // Capture successful check-in
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: cronName,
        status: "ok",
        duration: duration / 1000, // Convert to seconds
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };

      // Capture error with context
      Sentry.captureException(error, {
        tags: {
          function_name: cronName,
          schedule,
          execution_duration: duration,
        },
        contexts: {
          scheduled_function: {
            cronName,
            schedule,
            duration,
            startTime: new Date(startTime).toISOString(),
            errorTime: new Date().toISOString(),
          },
        },
      });

      // Capture failed check-in
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: cronName,
        status: "error",
        duration: duration / 1000,
      });

      // Re-throw error to maintain Firebase Function behavior
      throw error;

    } finally {
      // Finish transaction
      transaction.setStatus(success ? "ok" : "internal_error");
      transaction.setData("duration", Date.now() - startTime);
      transaction.setData("success", success);
      if (errorDetails) {
        transaction.setData("error", errorDetails);
      }
      transaction.finish();

      // Flush Sentry events
      await Sentry.flush(2000);
    }
  };
}

/**
 * Enhanced tracking for specific scheduled function types
 */
const scheduledFunctionTrackers = {
  /**
   * Track ML prediction functions
   */
  trackMLPredictionFunction: (functionName, gameCount, processingTime, success) => {
    Sentry.addBreadcrumb({
      message: `ML Prediction Function: ${functionName}`,
      category: "ml_prediction",
      level: success ? "info" : "error",
      data: {
        functionName,
        gameCount,
        processingTime,
        success,
        timestamp: new Date().toISOString(),
      },
    });

    // Track custom metrics
    Sentry.setTag("ml_function_type", "prediction");
    Sentry.setContext("ml_execution", {
      functionName,
      gameCount,
      processingTime,
      success,
      averageTimePerGame: gameCount > 0 ? processingTime / gameCount : 0,
    });
  },

  /**
   * Track notification functions
   */
  trackNotificationFunction: (functionName, notificationCount, processingTime, success) => {
    Sentry.addBreadcrumb({
      message: `Notification Function: ${functionName}`,
      category: "notification",
      level: success ? "info" : "error",
      data: {
        functionName,
        notificationCount,
        processingTime,
        success,
        timestamp: new Date().toISOString(),
      },
    });

    Sentry.setTag("notification_function_type", "scheduled");
    Sentry.setContext("notification_execution", {
      functionName,
      notificationCount,
      processingTime,
      success,
      averageTimePerNotification: notificationCount > 0 ? processingTime / notificationCount : 0,
    });
  },

  /**
   * Track leaderboard update functions
   */
  trackLeaderboardFunction: (functionName, userCount, processingTime, success) => {
    Sentry.addBreadcrumb({
      message: `Leaderboard Function: ${functionName}`,
      category: "leaderboard",
      level: success ? "info" : "error",
      data: {
        functionName,
        userCount,
        processingTime,
        success,
        timestamp: new Date().toISOString(),
      },
    });

    Sentry.setTag("leaderboard_function_type", "update");
    Sentry.setContext("leaderboard_execution", {
      functionName,
      userCount,
      processingTime,
      success,
    });
  },

  /**
   * Track data backup functions
   */
  trackBackupFunction: (functionName, backupSize, processingTime, success) => {
    Sentry.addBreadcrumb({
      message: `Backup Function: ${functionName}`,
      category: "backup",
      level: success ? "info" : "error",
      data: {
        functionName,
        backupSize,
        processingTime,
        success,
        timestamp: new Date().toISOString(),
      },
    });

    Sentry.setTag("backup_function_type", "scheduled");
    Sentry.setContext("backup_execution", {
      functionName,
      backupSize,
      processingTime,
      success,
    });
  },

  /**
   * Track RSS feed functions
   */
  trackRSSFunction: (functionName, feedCount, itemCount, processingTime, success) => {
    Sentry.addBreadcrumb({
      message: `RSS Function: ${functionName}`,
      category: "rss_feed",
      level: success ? "info" : "error",
      data: {
        functionName,
        feedCount,
        itemCount,
        processingTime,
        success,
        timestamp: new Date().toISOString(),
      },
    });

    Sentry.setTag("rss_function_type", "scheduled");
    Sentry.setContext("rss_execution", {
      functionName,
      feedCount,
      itemCount,
      processingTime,
      success,
      averageTimePerItem: itemCount > 0 ? processingTime / itemCount : 0,
    });
  },
};

/**
 * Monitor external API calls within scheduled functions
 */
function trackScheduledAPICall(apiName, endpoint, duration, statusCode, success) {
  Sentry.addBreadcrumb({
    message: `Scheduled API Call: ${apiName}`,
    category: "scheduled_api_call",
    level: success ? "info" : "error",
    data: {
      apiName,
      endpoint,
      duration,
      statusCode,
      success,
      timestamp: new Date().toISOString(),
    },
  });

  // Track API performance in scheduled context
  if (!success || statusCode >= 400) {
    Sentry.captureMessage(`Scheduled API call failed: ${apiName}`, "warning", {
      tags: {
        api_name: apiName,
        endpoint,
        status_code: statusCode,
        context: "scheduled_function",
      },
      contexts: {
        api_call: {
          apiName,
          endpoint,
          duration,
          statusCode,
          success,
        },
      },
    });
  }
}

/**
 * Create Sentry monitor configuration for a scheduled function
 */
function createMonitorConfig(cronName, schedule, timezone = "America/New_York") {
  return {
    monitorSlug: cronName,
    schedule: {
      type: "crontab",
      value: schedule,
    },
    timezone,
    checkinMargin: 5, // 5 minute margin
    maxRuntime: 30, // 30 minute max runtime
    failureIssueThreshold: 2,
    recoveryThreshold: 3,
  };
}

module.exports = {
  initSentryWithCron,
  wrapScheduledFunction,
  scheduledFunctionTrackers,
  trackScheduledAPICall,
  createMonitorConfig,
  SENTRY_DSN,
};