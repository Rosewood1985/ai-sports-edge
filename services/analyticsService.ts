/**
 * Analytics Service
 *
 * A unified analytics interface that works across platforms (web and mobile)
 * This service abstracts away the platform-specific implementation details
 * and provides a consistent API for tracking events.
 *
 * IMPORTANT: This file is a legacy export that redirects to the atomic implementation.
 * New code should import directly from the atomic architecture.
 */

// Import the analytics service from the atomic architecture
import { analyticsService } from '../src/atomic';
import { AnalyticsEventType } from '../src/atomic/molecules/analyticsService';

// Re-export the analytics service
export { analyticsService, AnalyticsEventType };

// Re-export individual functions for backward compatibility
export const trackEvent = analyticsService.trackEvent;
export const setUserProperties = analyticsService.setUserProperties;
export const trackOnboardingStarted = analyticsService.trackOnboardingStarted;
export const trackOnboardingStep = analyticsService.trackOnboardingStep;
export const trackOnboardingCompleted = analyticsService.trackOnboardingCompleted;
