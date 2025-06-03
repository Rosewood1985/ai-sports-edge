/**
 * Sentry Configuration for Firebase Cloud Functions
 * Provides error tracking and performance monitoring for server-side operations
 */

const Sentry = require("@sentry/google-cloud-serverless");

// Initialize Sentry
const initSentry = () => {
  Sentry.init({
    dsn: "https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336",
    environment: process.env.NODE_ENV || "production",
    
    // Performance monitoring
    tracesSampleRate: 1.0,
    
    // Set release version
    release: process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId + "@1.0.0" : "ai-sports-edge@1.0.0",
    
    // Configure integrations
    integrations: [
      // HTTP integration is automatically included in @sentry/google-cloud-serverless
    ],
    
    // Add context
    beforeSend: (event, hint) => {
      // Add Cloud Function context
      if (event.contexts) {
        event.contexts.cloudFunction = {
          projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
          functionName: process.env.FUNCTION_NAME || "unknown",
          functionRegion: process.env.FUNCTION_REGION || "us-central1",
          runtime: "nodejs20",
        };
        
        // Add racing data context
        event.contexts.racing = {
          features: ["nascar", "horse_racing"],
          mlModels: ["xgboost", "neural_network"],
          cacheSystem: "three-tier",
          dataSource: "firebase-firestore",
        };
      }
      
      return event;
    },
    
    // Configure tags
    initialScope: {
      tags: {
        component: "cloud-functions",
        platform: "firebase",
        runtime: "nodejs20",
      },
    },
  });
  
  console.log("Sentry initialized for Cloud Functions");
};

// Racing-specific tracking functions
const trackRacingFunction = (functionName, sport, data = {}) => {
  Sentry.addBreadcrumb({
    message: `Racing function: ${functionName}`,
    category: "racing",
    level: "info",
    data: {
      function: functionName,
      sport,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
};

const trackMLFunction = (functionName, operation, modelType, data = {}) => {
  Sentry.addBreadcrumb({
    message: `ML function: ${functionName} - ${operation}`,
    category: "ml",
    level: "info",
    data: {
      function: functionName,
      operation,
      modelType,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
};

const trackSubscriptionFunction = (functionName, action, data = {}) => {
  Sentry.addBreadcrumb({
    message: `Subscription function: ${functionName} - ${action}`,
    category: "subscription",
    level: "info",
    data: {
      function: functionName,
      action,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
};

const trackStripeFunction = (functionName, eventType, data = {}) => {
  Sentry.addBreadcrumb({
    message: `Stripe function: ${functionName} - ${eventType}`,
    category: "payment",
    level: "info",
    data: {
      function: functionName,
      eventType,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
};

const trackNotificationFunction = (functionName, type, recipientCount, data = {}) => {
  Sentry.addBreadcrumb({
    message: `Notification function: ${functionName} - ${type}`,
    category: "notification",
    level: "info",
    data: {
      function: functionName,
      type,
      recipientCount,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
};

// Performance tracking for functions
const trackFunctionPerformance = (functionName, duration, success, data = {}) => {
  Sentry.addBreadcrumb({
    message: `Function performance: ${functionName}`,
    category: "performance",
    level: success ? "info" : "warning",
    data: {
      function: functionName,
      duration,
      success,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
  
  // Track slow functions
  if (duration > 10000) { // 10 seconds
    Sentry.captureMessage(`Slow function detected: ${functionName} took ${duration}ms`, "warning");
  }
};

// Error tracking with context
const captureCloudFunctionError = (error, functionName, context = {}) => {
  return Sentry.withScope((scope) => {
    scope.setTag("functionName", functionName);
    scope.setTag("errorType", "cloud-function");
    
    scope.setContext("function_context", {
      name: functionName,
      timestamp: new Date().toISOString(),
      ...context,
    });
    
    return Sentry.captureException(error);
  });
};

// Export wrappers and utilities
module.exports = {
  Sentry,
  initSentry,
  wrapHttpFunction: Sentry.wrapHttpFunction,
  wrapEventFunction: Sentry.wrapEventFunction,
  wrapScheduleFunction: Sentry.wrapScheduleFunction,
  wrapTaskQueueFunction: Sentry.wrapTaskQueueFunction,
  trackRacingFunction,
  trackMLFunction,
  trackSubscriptionFunction,
  trackStripeFunction,
  trackNotificationFunction,
  trackFunctionPerformance,
  captureCloudFunctionError,
};