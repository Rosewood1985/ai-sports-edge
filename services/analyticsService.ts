import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Analytics event types
export type AnalyticsEventType =
  // Onboarding events
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'onboarding_step_viewed'
  
  // AI prediction events
  | 'ai_prediction_viewed'
  | 'ai_prediction_shared'
  | 'daily_insights_viewed'
  | 'bet_comparison_viewed'
  | 'ai_summary_generated'
  
  // Subscription events
  | 'subscription_page_viewed'
  | 'subscription_started'
  | 'subscription_completed'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'subscription_auto_renewed'
  | 'payment_method_added'
  | 'payment_failed'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'auto_resubscribe_enabled'
  | 'auto_resubscribe_disabled'
  | 'subscription_report_generated'
  
  // Microtransaction events
  | 'single_prediction_purchased'
  | 'weekend_pass_purchased'
  | 'alert_package_purchased'
  
  // Referral events
  | 'referral_code_generated'
  | 'referral_code_applied'
  | 'referral_converted'
  | 'referral_reward_earned'
  | 'gift_subscription_redeemed'
  
  // App usage events
  | 'app_opened'
  | 'app_backgrounded'
  | 'search_performed'
  | 'filter_applied'
  | 'game_viewed'
  | 'odds_refreshed'
  | 'theme_changed'
  | 'notification_settings_changed'
  | 'sports_news_fetched'
  | 'sports_news_viewed'
  | 'sports_news_focus_changed'
  
  // Achievement events
  | 'achievement_unlocked'
  | 'loyalty_level_up'
  | 'streak_reward_earned';

// Analytics event interface
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
}

// Session management
let currentSessionId: string = '';

/**
 * Initialize analytics and start a new session
 */
export const initAnalytics = async (): Promise<void> => {
  // Generate a new session ID
  currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Track app opened event
  await trackEvent('app_opened');
  
  // Store session start time
  await AsyncStorage.setItem('analytics_session_start', Date.now().toString());
};

/**
 * Track an analytics event
 * @param eventType - Type of event
 * @param properties - Additional properties for the event
 */
export const trackEvent = async (
  eventType: AnalyticsEventType,
  properties?: Record<string, any>
): Promise<void> => {
  try {
    // Get current user ID if logged in
    const userId = auth.currentUser?.uid;
    
    // Create event object
    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      userId,
      sessionId: currentSessionId,
      properties
    };
    
    // In a real app, this would send the event to an analytics service
    // For now, we'll just log it and store locally
    console.log('Analytics event:', event);
    
    // Store events locally for debugging/development
    const storedEvents = await AsyncStorage.getItem('analytics_events');
    const events: AnalyticsEvent[] = storedEvents ? JSON.parse(storedEvents) : [];
    events.push(event);
    
    // Only keep the last 1000 events to avoid storage issues
    const trimmedEvents = events.slice(-1000);
    await AsyncStorage.setItem('analytics_events', JSON.stringify(trimmedEvents));
    
    // In a production app, we would batch and send events to a server
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
};

/**
 * Track screen view
 * @param screenName - Name of the screen
 * @param properties - Additional properties
 */
export const trackScreenView = async (
  screenName: string,
  properties?: Record<string, any>
): Promise<void> => {
  await trackEvent('app_opened' as AnalyticsEventType, {
    screen: screenName,
    ...properties
  });
};

/**
 * Track onboarding step
 * @param stepNumber - Onboarding step number
 * @param stepName - Onboarding step name
 */
export const trackOnboardingStep = async (
  stepNumber: number,
  stepName: string
): Promise<void> => {
  await trackEvent('onboarding_step_viewed', {
    step_number: stepNumber,
    step_name: stepName
  });
};

/**
 * Track AI prediction interaction
 * @param gameId - Game ID
 * @param predictionType - Type of prediction
 * @param interactionType - Type of interaction
 */
export const trackPredictionInteraction = async (
  gameId: string,
  predictionType: 'game_prediction' | 'daily_insight' | 'trending_bet',
  interactionType: 'view' | 'share' | 'purchase'
): Promise<void> => {
  let eventType: AnalyticsEventType;
  
  if (interactionType === 'view') {
    eventType = 'ai_prediction_viewed';
  } else if (interactionType === 'share') {
    eventType = 'ai_prediction_shared';
  } else {
    eventType = 'single_prediction_purchased';
  }
  
  await trackEvent(eventType, {
    game_id: gameId,
    prediction_type: predictionType
  });
};

/**
 * Track purchase event
 * @param productId - Product ID
 * @param productType - Type of product
 * @param amount - Purchase amount
 * @param currency - Currency code
 */
export const trackPurchase = async (
  productId: string,
  productType: 'subscription' | 'single_prediction' | 'weekend_pass' | 'alert_package',
  amount: number,
  currency: string = 'USD'
): Promise<void> => {
  let eventType: AnalyticsEventType;
  
  switch (productType) {
    case 'subscription':
      eventType = 'subscription_completed';
      break;
    case 'single_prediction':
      eventType = 'single_prediction_purchased';
      break;
    case 'weekend_pass':
      eventType = 'weekend_pass_purchased';
      break;
    case 'alert_package':
      eventType = 'alert_package_purchased';
      break;
  }
  
  await trackEvent(eventType, {
    product_id: productId,
    product_type: productType,
    amount,
    currency
  });
};

/**
 * Get analytics data for the current user
 * @returns Analytics data
 */
export const getUserAnalytics = async (): Promise<Record<string, any>> => {
  try {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      return {};
    }
    
    // In a real app, this would fetch analytics from a backend
    // For now, we'll return mock data
    return {
      total_sessions: 12,
      total_predictions_viewed: 45,
      total_purchases: 2,
      favorite_teams: ['Lakers', 'Chiefs'],
      most_viewed_sports: ['basketball', 'football'],
      average_session_duration: 340, // seconds
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return {};
  }
};

export default {
  initAnalytics,
  trackEvent,
  trackScreenView,
  trackOnboardingStep,
  trackPredictionInteraction,
  trackPurchase,
  getUserAnalytics
};