/**
 * Type definitions for analyticsService
 */

// Define all possible analytics event types
export type AnalyticsEventType = 
  // Microtransaction events
  | 'microtransaction_interaction'
  | 'microtransaction_impression'
  | 'microtransaction_click'
  | 'microtransaction_purchase'
  | 'microtransaction_purchase_attempt'
  | 'microtransaction_purchase_success'
  | 'microtransaction_purchase_failed'
  | 'microtransaction_purchase_error'
  | 'microtransaction_conversion'
  
  // UI events
  | 'upgrade_prompt_displayed'
  | 'navigate_to_subscription'
  
  // Subscription events
  | 'subscription_view'
  | 'subscription_select'
  | 'subscription_purchase_attempt'
  | 'subscription_purchase_success'
  | 'subscription_purchase_failed'
  | 'subscription_cancel'
  | 'subscription_change'
  
  // User events
  | 'user_login'
  | 'user_signup'
  | 'user_logout'
  | 'user_profile_update'
  
  // Feature usage events
  | 'feature_view'
  | 'feature_use'
  | 'odds_purchase_initiated'
  | 'odds_purchase_completed'
  | 'odds_purchase_cancelled'
  | 'odds_purchase_error'
  | 'purchase_advanced_metrics'
  | 'purchase_player_comparison'
  | 'purchase_historical_trends'
  | 'purchase_premium_bundle'
  
  // App lifecycle events
  | 'app_open'
  | 'app_close'
  | 'app_crash'
  | 'app_update'
  
  // Navigation events
  | 'screen_view'
  | 'tab_change'
  | 'deep_link_open'
  
  // Performance events
  | 'api_request'
  | 'api_response'
  | 'api_error'
  | 'app_load_time'
  | 'screen_load_time';

// Define the analytics service interface
export interface AnalyticsService {
  /**
   * Track an analytics event
   * @param eventType Type of event to track
   * @param eventParams Additional parameters for the event
   * @returns Promise that resolves when the event is tracked
   */
  trackEvent(eventType: AnalyticsEventType, eventParams?: Record<string, any>): Promise<void>;
  
  /**
   * Set user properties for analytics
   * @param userId User ID
   * @param properties User properties to set
   * @returns Promise that resolves when the properties are set
   */
  setUserProperties(userId: string, properties: Record<string, any>): Promise<void>;
  
  /**
   * Get analytics metrics for a specific period
   * @param metricName Name of the metric to get
   * @param timePeriod Time period to get metrics for
   * @param filters Optional filters to apply
   * @returns Promise that resolves with the metrics
   */
  getMetrics(metricName: string, timePeriod: string, filters?: Record<string, any>): Promise<any>;
}

// Declare the analyticsService module
declare module '../services/analyticsService' {
  export const analyticsService: AnalyticsService;
}