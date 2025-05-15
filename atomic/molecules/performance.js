/**
 * Performance Monitoring Molecule
 * Provides performance monitoring functionality.
 * Combines error tracking and logging atoms with performance-specific features.
 */

// External imports

// Internal imports
import { info, error as logError, LogCategory } from './logging';
import { isDevelopment } from '../atoms/envConfig';
import { safeErrorCapture } from '../atoms/errorUtils';
import { startTransaction } from './errorTracking';

/**
 * Transaction types
 */
export const TransactionType = {
  STARTUP: 'startup',
  NAVIGATION: 'navigation',
  UI_RENDER: 'ui_render',
  API_REQUEST: 'api_request',
  DATA_OPERATION: 'data_operation',
  USER_INTERACTION: 'user_interaction',
  BACKGROUND_TASK: 'background_task',
  SYNC: 'sync',
  PAYMENT: 'payment',
  BETTING: 'betting',
};

// Global performance metrics
let performanceMetrics = {};

/**
 * Get the path from a URL
 * 
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
 * Start a performance transaction
 * 
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
        if (transaction) {
          transaction.markPoint(pointName);
        }
      }
    };
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to start transaction', error);
    safeErrorCapture(error);
    
    // Return a dummy transaction
    return {
      addData: () => {},
      setData: () => {},
      setTag: () => {},
      markPoint: () => {},
      finish: () => {},
    };
  }
};

/**
 * Create a performance timer
 * 
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
     * Mark a point in the timer
     * 
     * @param {string} pointName - Point name
     */
    mark: pointName => {
      transaction?.markPoint(pointName);
    },
    
    /**
     * Stop the timer and record the duration
     * 
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
    }
  };
};

/**
 * Track app startup
 * 
 * @param {number} duration - Startup duration in ms
 * @param {Object} [data] - Additional data
 */
export const trackAppStartup = (duration, data = {}) => {
  try {
    info(LogCategory.PERFORMANCE, `App startup completed in ${duration}ms`, { duration, ...data });
    
    const transaction = startPerformanceTransaction('App Startup', TransactionType.STARTUP, {
      timeToInteractive: duration,
      ...data
    });
    
    // Finish transaction immediately
    transaction?.finish();
    
    // Update performance metrics
    updatePerformanceMetrics({
      timeToInteractive: duration,
    });
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to track app startup', error);
    safeErrorCapture(error);
  }
};

/**
 * Track a navigation event
 * 
 * @param {string} routeName - Route name
 * @param {string} [previousRoute] - Previous route
 */
export const trackNavigation = (routeName, previousRoute) => {
  try {
    info(LogCategory.NAVIGATION, `Navigated to ${routeName}`, { previousRoute });
    
    const transaction = startPerformanceTransaction(
      `Navigation: ${routeName}`,
      TransactionType.NAVIGATION,
      { previousRoute }
    );
    
    // Finish transaction after a delay to capture render time
    setTimeout(() => {
      transaction?.finish();
    }, 1000);
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to track navigation', error);
    safeErrorCapture(error);
  }
};

/**
 * Track a UI render
 * 
 * @param {string} componentName - Component name
 * @param {number} duration - Render duration in ms
 */
export const trackUiRender = (componentName, duration) => {
  try {
    // Log UI render if it's slow
    if (duration > 100) {
      info(LogCategory.PERFORMANCE, `Slow render: ${componentName} (${duration}ms)`, {
        componentName, duration
      });
    }
    
    const transaction = startPerformanceTransaction(
      `Render: ${componentName}`,
      TransactionType.UI_RENDER,
      { componentName, duration }
    );
    
    // Finish transaction immediately
    transaction?.finish();
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to track UI render', error);
    safeErrorCapture(error);
  }
};

/**
 * Track an API request
 * 
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @param {number} status - HTTP status code
 * @param {number} duration - Request duration in ms
 */
export const trackApiRequest = (url, method, status, duration) => {
  try {
    // Log API request
    info(LogCategory.API, `API request: ${method} ${getUrlPath(url)} (${status})`, {
      url, method, status, duration
    });
    
    // Log error if status is 4xx or 5xx
    if (status >= 400) {
      logError(
        LogCategory.API,
        `API request failed: ${method} ${getUrlPath(url)} (${status})`,
        new Error(`API request failed with status ${status}`),
        { url, method, status, duration }
      );
    }
    
    const transaction = startPerformanceTransaction(
      `API: ${method} ${getUrlPath(url)}`,
      TransactionType.API_REQUEST,
      { url, method, status, duration }
    );
    
    // Finish transaction immediately
    transaction?.finish();
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to track API request', error);
    safeErrorCapture(error);
  }
};

/**
 * Track a data operation
 * 
 * @param {string} operationName - Operation name
 * @param {number} duration - Operation duration in ms
 * @param {Object} [data] - Additional data
 */
export const trackDataOperation = (operationName, duration, data = {}) => {
  try {
    // Log data operation if it's slow
    if (duration > 300) {
      info(LogCategory.PERFORMANCE, `Slow data operation: ${operationName} (${duration}ms)`, {
        operationName, duration, ...data
      });
    }
    
    const transaction = startPerformanceTransaction(
      `Data: ${operationName}`,
      TransactionType.DATA_OPERATION,
      { operationName, duration, ...data }
    );
    
    // Finish transaction immediately
    transaction?.finish();
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to track data operation', error);
    safeErrorCapture(error);
  }
};

/**
 * Track a user interaction
 * 
 * @param {string} interactionName - Interaction name
 * @param {number} duration - Interaction duration in ms
 * @param {Object} [data] - Additional data
 */
export const trackUserInteraction = (interactionName, duration, data = {}) => {
  try {
    // Log user interaction if it's slow
    if (duration > 500) {
      info(LogCategory.PERFORMANCE, `Slow user interaction: ${interactionName} (${duration}ms)`, {
        interactionName, duration, ...data
      });
    }
    
    const transaction = startPerformanceTransaction(
      `Interaction: ${interactionName}`,
      TransactionType.USER_INTERACTION,
      { interactionName, duration, ...data }
    );
    
    // Finish transaction immediately
    transaction?.finish();
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to track user interaction', error);
    safeErrorCapture(error);
  }
};

/**
 * Update performance metrics
 * 
 * @param {PerformanceMetrics} metrics - Metrics to update
 */
export const updatePerformanceMetrics = metrics => {
  try {
    performanceMetrics = {
      ...performanceMetrics,
      ...metrics,
    };
  } catch (error) {
    logError(LogCategory.PERFORMANCE, 'Failed to update performance metrics', error);
    safeErrorCapture(error);
  }
};

/**
 * Get performance metrics
 * 
 * @returns {PerformanceMetrics} Current performance metrics
 */
export const getPerformanceMetrics = () => {
  return { ...performanceMetrics };
};

/**
 * Initialize performance monitoring
 * 
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
  try {
    console.log('initPerformanceMonitoring: Starting initialization');
    
    // Track app start time
    if (options.trackAppStart) {
      console.log('initPerformanceMonitoring: Setting app start time');
      performanceMetrics.appStartTime = Date.now();
    }
    
    // Set device information
    if (options.trackDeviceInfo) {
      console.log('initPerformanceMonitoring: Setting device information');
      performanceMetrics.appVersion = process.env.APP_VERSION || '1.0.0';
      performanceMetrics.deviceModel = 'Web Browser';
      performanceMetrics.osVersion = navigator.userAgent;
    }
    
    info(LogCategory.PERFORMANCE, 'Performance monitoring initialized successfully');
    console.log('initPerformanceMonitoring: Initialization completed successfully');
    
    return true;
  } catch (initError) {
    logError(LogCategory.PERFORMANCE, 'Failed to initialize performance monitoring', initError);
    console.error('initPerformanceMonitoring: Failed to initialize:', initError);
    safeErrorCapture(initError);
    
    return false;
  }
};
