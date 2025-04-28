/**
 * Performance Monitoring Molecule
 *
 * Provides performance monitoring functionality.
 * Combines error tracking and logging atoms with performance-specific features.
 */

import { startTransaction } from './errorTracking';
import { info, error as logError, LogCategory } from './logging';
import { safeErrorCapture } from '../atoms/errorUtils';
import { isDevelopment } from '../atoms/envConfig';

/**
 * Transaction types
 */
export const TransactionType = {
  NAVIGATION: 'navigation',
  API_REQUEST: 'api_request',
  UI_RENDER: 'ui_render',
  DATA_OPERATION: 'data_operation',
  BACKGROUND_TASK: 'background_task',
  USER_INTERACTION: 'user_interaction',
  STARTUP: 'startup',
  BETTING: 'betting',
  PAYMENT: 'payment',
  SYNC: 'sync',
};

/**
 * Performance metrics interface
 * @typedef {Object} PerformanceMetrics
 * @property {number} [appStartTime] - App start time
 * @property {number} [timeToInteractive] - Time to interactive
 * @property {number} [firstContentfulPaint] - First contentful paint
 * @property {number} [memoryUsage] - Memory usage
 * @property {number} [cpuUsage] - CPU usage
 * @property {number} [batteryLevel] - Battery level
 * @property {string} [networkType] - Network type
 * @property {boolean} [isLowMemoryDevice] - Whether device has low memory
 * @property {string} [deviceModel] - Device model
 * @property {string} [osVersion] - OS version
 * @property {string} [appVersion] - App version
 */

// Global performance metrics
let performanceMetrics = {};

/**
 * Initialize performance monitoring
 * @param {Object} [options] - Initialization options
 * @param {boolean} [options.trackAppStart] - Whether to track app start time
 * @param {boolean} [options.trackDeviceInfo] - Whether to track device information
 * @returns {boolean} Whether initialization was successful
 */
export const initPerformanceMonitoring = (
  options = {
    trackAppStart: true,
    trackDeviceInfo: true,
  }
) => {
  console.log('initPerformanceMonitoring: Starting initialization');
  try {
    // Track app start time
    if (options.trackAppStart) {
      console.log('initPerformanceMonitoring: Setting app start time');
      performanceMetrics.appStartTime = Date.now();
    }

    // Set device information
    if (options.trackDeviceInfo) {
      console.log('initPerformanceMonitoring: Setting device information');
      performanceMetrics.deviceModel = 'Web Browser';
      performanceMetrics.osVersion = navigator.userAgent;
      performanceMetrics.appVersion = process.env.APP_VERSION || '1.0.0';
    }

    console.log('initPerformanceMonitoring: Initialization completed successfully');
    info(LogCategory.PERFORMANCE, 'Performance monitoring initialized successfully');
    return true;
  } catch (initError) {
    console.error('initPerformanceMonitoring: Failed to initialize:', initError);
    logError(LogCategory.PERFORMANCE, 'Failed to initialize performance monitoring', initError);
    safeErrorCapture(initError);
    return false;
  }
};

/**
 * Start a performance transaction
 * @param {string} name - Transaction name
 * @param {string} type - Transaction type
 * @param {Object} [data] - Additional data
 * @returns {Object} Transaction object
 */
export const startPerformanceTransaction = (name, type, data) => {
  try {
    // Create a transaction using Sentry
    const transaction = startTransaction(name, type);

    // Add data as tags
    if (data && transaction) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          transaction.setTag(key, String(value));
        }
      });
    }

    // Return transaction with additional methods
    return {
      ...transaction,
      addData: (key, value) => {
        if (transaction && typeof transaction.setTag === 'function') {
          transaction.setTag(key, String(value));
        }
      },
      markPoint: pointName => {
        if (isDevelopment) {
          console.log(`Performance mark: ${pointName} in transaction ${name}`);
        }
        // In a real implementation, this would mark a point in the transaction
      },
    };
  } catch (error) {
    console.error('Failed to start transaction:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to start transaction', error);
    safeErrorCapture(error);

    // Return a dummy transaction
    return {
      finish: () => {},
      addData: () => {},
      markPoint: () => {},
      setTag: () => {},
      setData: () => {},
    };
  }
};

/**
 * Track a navigation event
 * @param {string} routeName - Route name
 * @param {string} [previousRoute] - Previous route
 */
export const trackNavigation = (routeName, previousRoute) => {
  try {
    const transaction = startPerformanceTransaction(
      `Navigation: ${routeName}`,
      TransactionType.NAVIGATION,
      { previousRoute }
    );

    // Log navigation
    info(LogCategory.NAVIGATION, `Navigated to ${routeName}`, { previousRoute });

    // Finish the transaction after a delay to capture render time
    setTimeout(() => {
      transaction?.finish();
    }, 1000);
  } catch (error) {
    console.error('Failed to track navigation:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to track navigation', error);
    safeErrorCapture(error);
  }
};

/**
 * Track an API request
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @param {number} status - HTTP status code
 * @param {number} duration - Request duration in ms
 */
export const trackApiRequest = (url, method, status, duration) => {
  try {
    const transaction = startPerformanceTransaction(
      `API: ${method} ${getUrlPath(url)}`,
      TransactionType.API_REQUEST,
      { url, method, status, duration }
    );

    // Log API request
    if (status >= 400) {
      logError(
        LogCategory.API,
        `API request failed: ${method} ${getUrlPath(url)} (${status})`,
        new Error(`API request failed with status ${status}`),
        { url, method, status, duration }
      );
    } else {
      info(LogCategory.API, `API request: ${method} ${getUrlPath(url)} (${status})`, {
        url,
        method,
        status,
        duration,
      });
    }

    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track API request:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to track API request', error);
    safeErrorCapture(error);
  }
};

/**
 * Track a UI render
 * @param {string} componentName - Component name
 * @param {number} duration - Render duration in ms
 */
export const trackUiRender = (componentName, duration) => {
  try {
    const transaction = startPerformanceTransaction(
      `Render: ${componentName}`,
      TransactionType.UI_RENDER,
      { componentName, duration }
    );

    // Log UI render if it's slow
    if (duration > 100) {
      info(LogCategory.PERFORMANCE, `Slow render: ${componentName} (${duration}ms)`, {
        componentName,
        duration,
      });
    }

    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track UI render:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to track UI render', error);
    safeErrorCapture(error);
  }
};

/**
 * Track a data operation
 * @param {string} operationName - Operation name
 * @param {number} duration - Operation duration in ms
 * @param {Object} [data] - Additional data
 */
export const trackDataOperation = (operationName, duration, data) => {
  try {
    const transaction = startPerformanceTransaction(
      `Data: ${operationName}`,
      TransactionType.DATA_OPERATION,
      { ...data, duration }
    );

    // Log data operation if it's slow
    if (duration > 500) {
      info(LogCategory.PERFORMANCE, `Slow data operation: ${operationName} (${duration}ms)`, {
        operationName,
        duration,
        ...data,
      });
    }

    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track data operation:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to track data operation', error);
    safeErrorCapture(error);
  }
};

/**
 * Track a user interaction
 * @param {string} interactionName - Interaction name
 * @param {number} duration - Interaction duration in ms
 * @param {Object} [data] - Additional data
 */
export const trackUserInteraction = (interactionName, duration, data) => {
  try {
    const transaction = startPerformanceTransaction(
      `Interaction: ${interactionName}`,
      TransactionType.USER_INTERACTION,
      { ...data, duration }
    );

    // Log user interaction if it's slow
    if (duration > 300) {
      info(LogCategory.PERFORMANCE, `Slow user interaction: ${interactionName} (${duration}ms)`, {
        interactionName,
        duration,
        ...data,
      });
    }

    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track user interaction:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to track user interaction', error);
    safeErrorCapture(error);
  }
};

/**
 * Track app startup
 * @param {number} duration - Startup duration in ms
 * @param {Object} [data] - Additional data
 */
export const trackAppStartup = (duration, data) => {
  try {
    const transaction = startPerformanceTransaction('App Startup', TransactionType.STARTUP, {
      ...data,
      duration,
    });

    // Update performance metrics
    updatePerformanceMetrics({
      timeToInteractive: duration,
    });

    // Log app startup
    info(LogCategory.PERFORMANCE, `App startup completed in ${duration}ms`, { duration, ...data });

    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track app startup:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to track app startup', error);
    safeErrorCapture(error);
  }
};

/**
 * Update performance metrics
 * @param {PerformanceMetrics} metrics - Metrics to update
 */
export const updatePerformanceMetrics = metrics => {
  try {
    performanceMetrics = {
      ...performanceMetrics,
      ...metrics,
    };
  } catch (error) {
    console.error('Failed to update performance metrics:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to update performance metrics', error);
    safeErrorCapture(error);
  }
};

/**
 * Get performance metrics
 * @returns {PerformanceMetrics} Current performance metrics
 */
export const getPerformanceMetrics = () => {
  return { ...performanceMetrics };
};

/**
 * Get the path from a URL
 * @param {string} url - URL
 * @returns {string} URL path
 */
const getUrlPath = url => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url;
  }
};

/**
 * Create a performance timer
 * @param {string} name - Timer name
 * @param {string} type - Transaction type
 * @param {Object} [data] - Additional data
 * @returns {Object} Timer object
 */
export const createPerformanceTimer = (name, type, data) => {
  const startTime = Date.now();
  let transaction = null;

  // Start transaction if type is provided
  if (type) {
    transaction = startPerformanceTransaction(name, type, data);
  }

  return {
    /**
     * Stop the timer and record the duration
     * @param {Object} [additionalData] - Additional data to include
     * @returns {number} Duration in ms
     */
    stop: additionalData => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Add duration to transaction
      if (transaction) {
        transaction.addData('duration', duration);

        // Add additional data
        if (additionalData) {
          Object.entries(additionalData).forEach(([key, value]) => {
            transaction.addData(key, value);
          });
        }

        // Finish transaction
        transaction.finish();
      }

      return duration;
    },

    /**
     * Mark a point in the timer
     * @param {string} pointName - Point name
     */
    mark: pointName => {
      if (transaction) {
        transaction.markPoint(pointName);
      }
    },
  };
};
