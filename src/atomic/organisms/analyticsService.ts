/**
 * Analytics Service Organism
 * 
 * Consolidated service for all analytics interactions
 * Combines analytics molecules into a single service
 */

import { analyticsService as moleculeAnalyticsService } from '../molecules';
import { firebaseAnalytics } from '../molecules';

/**
 * Analytics Service
 * Provides a unified interface for analytics tracking
 */
export const analyticsService = {
  // Core tracking methods
  trackEvent: moleculeAnalyticsService.trackEvent,
  setUserProperties: moleculeAnalyticsService.setUserProperties,
  
  // Onboarding tracking
  trackOnboardingStarted: moleculeAnalyticsService.trackOnboardingStarted,
  trackOnboardingStep: moleculeAnalyticsService.trackOnboardingStep,
  trackOnboardingCompleted: moleculeAnalyticsService.trackOnboardingCompleted,
  
  // Firebase Analytics direct access
  firebase: {
    analytics: firebaseAnalytics.analytics,
    logEvent: firebaseAnalytics.logAnalyticsEvent,
    setUserProperties: firebaseAnalytics.setUserAnalyticsProperties,
    events: firebaseAnalytics.AnalyticsEvents
  }
};

export default analyticsService;