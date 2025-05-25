/**
 * Sentry Error Tracking Service
 * Centralized error monitoring and performance tracking
 * 
 * Compatible with Expo SDK 45.0.8
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  enableAutoSessionTracking: boolean;
  enableNativeCrashHandling: boolean;
  enableInAppFrames: boolean;
  tracesSampleRate: number;
  debug: boolean;
}

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  screen?: string;
  action?: string;
  feature?: string;
  additionalData?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  description?: string;
  data?: Record<string, any>;
}

class SentryService {
  private isInitialized: boolean = false;
  private config: SentryConfig | null = null;

  /**
   * Initialize Sentry with configuration
   */
  initialize(config: SentryConfig): void {
    try {
      this.config = config;

      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        enableAutoSessionTracking: config.enableAutoSessionTracking,
        enableNativeCrashHandling: config.enableNativeCrashHandling,
        // enableInAppFrames: config.enableInAppFrames, // Not available in this version
        tracesSampleRate: config.tracesSampleRate,
        debug: config.debug,
        
        // Add app context
        initialScope: {
          tags: {
            appVersion: Constants.manifest?.version || '1.0.0',
            expoVersion: Constants.expoVersion || '45.0.8',
            platform: Constants.platform?.ios ? 'ios' : 'android',
          },
          contexts: {
            app: {
              name: 'AI Sports Edge',
              version: Constants.manifest?.version || '1.0.0',
            },
            device: {
              model: Constants.deviceName || 'unknown',
              simulator: Constants.isDevice === false,
            }
          }
        },

        beforeSend: (event) => {
          // Filter out non-production errors in development
          if (config.environment === 'development' && !config.debug) {
            return null;
          }

          // Add racing data context if available
          if (event.contexts) {
            event.contexts.racing = {
              phase: 'phase3-complete',
              features: ['nascar', 'horse_racing'],
              caching: 'three-tier',
            };
          }

          return event;
        },

        integrations: [
          new Sentry.Integrations.ReactNativeErrorHandlers({
            patchGlobalPromise: true,
          }),
          // Note: ReactNavigation integration will be added separately
        ],
      });

      this.isInitialized = true;
      console.log(`Sentry initialized for ${config.environment} environment`);

    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    subscription?: string;
    preferences?: Record<string, any>;
  }): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      subscription: user.subscription,
    });

    // Set additional user context
    Sentry.setContext('user_preferences', user.preferences || {});
  }

  /**
   * Set additional context for errors
   */
  setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    Sentry.setContext(key, context);
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Capture error with context
   */
  captureError(error: Error, context?: ErrorContext): string | undefined {
    if (!this.isInitialized) {
      console.error('Sentry not initialized, logging error:', error);
      return undefined;
    }

    return Sentry.withScope((scope) => {
      if (context) {
        // Set user context
        if (context.userId || context.userEmail) {
          scope.setUser({
            id: context.userId,
            email: context.userEmail,
          });
        }

        // Set tags
        if (context.screen) scope.setTag('screen', context.screen);
        if (context.action) scope.setTag('action', context.action);
        if (context.feature) scope.setTag('feature', context.feature);

        // Set additional context
        if (context.additionalData) {
          scope.setContext('error_context', context.additionalData);
        }
      }

      const eventId = Sentry.captureException(error);
      return eventId;
    });
  }

  /**
   * Capture message with context
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): string | undefined {
    if (!this.isInitialized) {
      console.log('Sentry not initialized, logging message:', message);
      return undefined;
    }

    return Sentry.withScope((scope) => {
      if (context) {
        if (context.userId || context.userEmail) {
          scope.setUser({
            id: context.userId,
            email: context.userEmail,
          });
        }

        if (context.screen) scope.setTag('screen', context.screen);
        if (context.action) scope.setTag('action', context.action);
        if (context.feature) scope.setTag('feature', context.feature);

        if (context.additionalData) {
          scope.setContext('message_context', context.additionalData);
        }
      }

      scope.setLevel(level);
      const eventId = Sentry.captureMessage(message);
      return eventId;
    });
  }

  /**
   * Track racing data operations
   */
  trackRacingOperation(operation: string, sport: 'nascar' | 'horse_racing', data?: Record<string, any>): void {
    this.addBreadcrumb(
      `Racing operation: ${operation}`,
      'racing',
      'info',
      {
        operation,
        sport,
        ...data,
      }
    );
  }

  /**
   * Track ML operations
   */
  trackMLOperation(operation: string, modelType?: string, accuracy?: number, data?: Record<string, any>): void {
    this.addBreadcrumb(
      `ML operation: ${operation}`,
      'ml',
      'info',
      {
        operation,
        modelType,
        accuracy,
        ...data,
      }
    );
  }

  /**
   * Track caching operations
   */
  trackCacheOperation(operation: string, tier: 'hot' | 'warm' | 'cold', hitRate?: number, data?: Record<string, any>): void {
    this.addBreadcrumb(
      `Cache operation: ${operation}`,
      'cache',
      'info',
      {
        operation,
        tier,
        hitRate,
        ...data,
      }
    );
  }

  /**
   * Track database operations
   */
  trackDatabaseOperation(operation: string, collection: string, latency?: number, data?: Record<string, any>): void {
    this.addBreadcrumb(
      `Database operation: ${operation}`,
      'database',
      'info',
      {
        operation,
        collection,
        latency,
        ...data,
      }
    );
  }

  /**
   * Start performance monitoring transaction
   */
  startTransaction(name: string, op: string, description?: string): any {
    if (!this.isInitialized) return null;

    return Sentry.startTransaction({
      name,
      op,
      description,
    });
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.addBreadcrumb(
      `API call: ${method} ${endpoint}`,
      'api',
      statusCode >= 400 ? 'error' : 'info',
      {
        endpoint,
        method,
        statusCode,
        duration,
      }
    );
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string, userId?: string, data?: Record<string, any>): void {
    this.addBreadcrumb(
      `Feature usage: ${feature} - ${action}`,
      'feature',
      'info',
      {
        feature,
        action,
        userId,
        ...data,
      }
    );
  }

  /**
   * Get the current Sentry configuration
   */
  getConfig(): SentryConfig | null {
    return this.config;
  }

  /**
   * Check if Sentry is initialized
   */
  isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Flush all pending events (useful before app closes)
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await Sentry.flush();
      return true;
    } catch (error) {
      console.error('Failed to flush Sentry events:', error);
      return false;
    }
  }

  /**
   * Close Sentry connection
   */
  async close(timeout: number = 2000): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await Sentry.close();
      this.isInitialized = false;
      return true;
    } catch (error) {
      console.error('Failed to close Sentry:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sentryService = new SentryService();

// Export Sentry configuration factory
export const createSentryConfig = (environment: 'development' | 'staging' | 'production'): SentryConfig => {
  // Get DSN from environment variables or Expo config
  const sentryDsn = process.env.SENTRY_DSN || 
                   Constants.manifest?.extra?.sentry?.dsn || 
                   Constants.expoConfig?.extra?.sentry?.dsn || '';

  const configs = {
    development: {
      dsn: sentryDsn,
      environment: 'development' as const,
      enableAutoSessionTracking: false,
      enableNativeCrashHandling: false,
      enableInAppFrames: true,
      tracesSampleRate: 0.1,
      debug: Constants.manifest?.extra?.sentry?.debug || true,
    },
    staging: {
      dsn: sentryDsn,
      environment: 'staging' as const,
      enableAutoSessionTracking: true,
      enableNativeCrashHandling: true,
      enableInAppFrames: true,
      tracesSampleRate: 0.5,
      debug: false,
    },
    production: {
      dsn: sentryDsn,
      environment: 'production' as const,
      enableAutoSessionTracking: true,
      enableNativeCrashHandling: true,
      enableInAppFrames: true,
      tracesSampleRate: 1.0,
      debug: false,
    },
  };

  return configs[environment];
};

export default sentryService;