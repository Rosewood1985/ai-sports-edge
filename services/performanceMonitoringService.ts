import * as Sentry from '@sentry/browser';
import { safeErrorCapture } from './errorUtils';
import { info, LogCategory } from './loggingService';
import { error as logError } from './loggingService';

/**
 * Performance Monitoring Service
 * 
 * This service provides performance monitoring functionality.
 * It tracks app performance metrics, network requests, and custom transactions.
 */

// Transaction types
export enum TransactionType {
  NAVIGATION = 'navigation',
  API_REQUEST = 'api_request',
  UI_RENDER = 'ui_render',
  DATA_OPERATION = 'data_operation',
  BACKGROUND_TASK = 'background_task',
  USER_INTERACTION = 'user_interaction',
}

// Performance metrics
export interface PerformanceMetrics {
  appStartTime?: number;
  timeToInteractive?: number;
  firstContentfulPaint?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  batteryLevel?: number;
  networkType?: string;
  isLowMemoryDevice?: boolean;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}

// Global performance metrics
let performanceMetrics: PerformanceMetrics = {};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  console.log('initPerformanceMonitoring: Starting initialization');
  try {
    // Track app start time
    console.log('initPerformanceMonitoring: Setting app start time');
    performanceMetrics.appStartTime = Date.now();
    
    // Set device information
    console.log('initPerformanceMonitoring: Setting device information');
    performanceMetrics.deviceModel = 'Web Browser';
    performanceMetrics.osVersion = navigator.userAgent;
    
    // Set up performance monitoring integrations
    console.log('initPerformanceMonitoring: Setting up integrations');
    // Note: Sentry's performance monitoring is already set up in errorTrackingService.ts
    
    console.log('initPerformanceMonitoring: Initialization completed successfully');
    info(LogCategory.PERFORMANCE, 'Performance monitoring initialized successfully');
    return true;
  } catch (initError) {
    console.error('initPerformanceMonitoring: Failed to initialize:', initError);
    logError(LogCategory.PERFORMANCE, 'Failed to initialize performance monitoring', initError as Error);
    safeErrorCapture(initError as Error);
    return false;
  }
};

/**
 * Start a performance transaction
 * @param name Transaction name
 * @param type Transaction type
 * @param data Additional data
 * @returns Transaction object
 */
export const startTransaction = (
  name: string,
  type: TransactionType,
  data?: Record<string, any>
) => {
  try {
    // Create a custom span instead of a transaction since @sentry/browser doesn't have startTransaction
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Started: ${name}`,
      data: {
        ...data,
        type,
      },
      level: 'info',
    });
    
    // Return a mock transaction object
    return {
      finish: () => {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `Finished: ${name}`,
          data: {
            ...data,
            type,
          },
          level: 'info',
        });
      }
    };
  } catch (error) {
    console.error('Failed to start transaction:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to start transaction', error as Error);
    safeErrorCapture(error as Error);
    return null;
  }
};

/**
 * Track a navigation event
 * @param routeName Route name
 * @param previousRoute Previous route
 */
export const trackNavigation = (routeName: string, previousRoute?: string) => {
  try {
    const transaction = startTransaction(
      `Navigation: ${routeName}`,
      TransactionType.NAVIGATION,
      { previousRoute }
    );
    
    // Add breadcrumb for navigation
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${routeName}`,
      data: { previousRoute },
      level: 'info',
    });
    
    // Finish the transaction after a delay to capture render time
    setTimeout(() => {
      transaction?.finish();
    }, 1000);
  } catch (error) {
    console.error('Failed to track navigation:', error);
    logError(LogCategory.PERFORMANCE, 'Failed to track navigation', error as Error);
    safeErrorCapture(error as Error);
  }
};

/**
 * Track an API request
 * @param url Request URL
 * @param method HTTP method
 * @param status HTTP status code
 * @param duration Request duration in ms
 */
export const trackApiRequest = (
  url: string,
  method: string,
  status: number,
  duration: number
) => {
  try {
    const transaction = startTransaction(
      `API: ${method} ${getUrlPath(url)}`,
      TransactionType.API_REQUEST,
      { url, method, status, duration }
    );
    
    // Add breadcrumb for API request
    Sentry.addBreadcrumb({
      category: 'xhr',
      message: `${method} ${getUrlPath(url)} (${status})`,
      data: { url, method, status, duration },
      level: status >= 400 ? 'error' : 'info',
    });
    
    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track API request:', error);
    logError(LogCategory.PERFORMANCE, 'Performance monitoring error', error as Error);
    safeErrorCapture(error as Error);
  }
};

/**
 * Track a UI render
 * @param componentName Component name
 * @param duration Render duration in ms
 */
export const trackUiRender = (componentName: string, duration: number) => {
  try {
    const transaction = startTransaction(
      `Render: ${componentName}`,
      TransactionType.UI_RENDER,
      { componentName, duration }
    );
    
    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track UI render:', error);
    logError(LogCategory.PERFORMANCE, 'Performance monitoring error', error as Error);
    safeErrorCapture(error as Error);
  }
};

/**
 * Track a data operation
 * @param operationName Operation name
 * @param duration Operation duration in ms
 * @param data Additional data
 */
export const trackDataOperation = (
  operationName: string,
  duration: number,
  data?: Record<string, any>
) => {
  try {
    const transaction = startTransaction(
      `Data: ${operationName}`,
      TransactionType.DATA_OPERATION,
      { ...data, duration }
    );
    
    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track data operation:', error);
    logError(LogCategory.PERFORMANCE, 'Performance monitoring error', error as Error);
    safeErrorCapture(error as Error);
  }
};

/**
 * Track a user interaction
 * @param interactionName Interaction name
 * @param duration Interaction duration in ms
 * @param data Additional data
 */
export const trackUserInteraction = (
  interactionName: string,
  duration: number,
  data?: Record<string, any>
) => {
  try {
    const transaction = startTransaction(
      `Interaction: ${interactionName}`,
      TransactionType.USER_INTERACTION,
      { ...data, duration }
    );
    
    // Add breadcrumb for user interaction
    Sentry.addBreadcrumb({
      category: 'ui.interaction',
      message: `User interaction: ${interactionName}`,
      data,
      level: 'info',
    });
    
    // Finish the transaction immediately
    transaction?.finish();
  } catch (error) {
    console.error('Failed to track user interaction:', error);
    logError(LogCategory.PERFORMANCE, 'Performance monitoring error', error as Error);
    safeErrorCapture(error as Error);
  }
};

/**
 * Update performance metrics
 * @param metrics Metrics to update
 */
export const updatePerformanceMetrics = (metrics: Partial<PerformanceMetrics>) => {
  try {
    performanceMetrics = {
      ...performanceMetrics,
      ...metrics,
    };
    
    // Set tags for performance metrics
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        Sentry.setTag(`performance.${key}`, value.toString());
      }
    });
  } catch (error) {
    console.error('Failed to update performance metrics:', error);
    logError(LogCategory.PERFORMANCE, 'Performance monitoring error', error as Error);
    safeErrorCapture(error as Error);
  }
};

/**
 * Get performance metrics
 * @returns Current performance metrics
 */
export const getPerformanceMetrics = (): PerformanceMetrics => {
  return { ...performanceMetrics };
};

/**
 * Get the path from a URL
 * @param url URL
 * @returns URL path
 */
const getUrlPath = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url;
  }
};