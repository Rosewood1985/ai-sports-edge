import AsyncStorage from '@react-native-async-storage/async-storage';

import { analyticsService, AnalyticsEventType } from './analyticsService';
import { resetOnboardingStatus } from './onboardingService';

// Keys for AsyncStorage
const FEATURE_TOUR_COMPLETED_KEY = '@AISportsEdge:featureTourCompleted';
const FEATURE_TOUR_STEPS_KEY = '@AISportsEdge:featureTourSteps';

/**
 * Interface for feature tour step
 */
export interface FeatureTourStep {
  id: string;
  title: string;
  description: string;
  featureId: string;
  completed: boolean;
  timestamp?: number;
}

/**
 * Check if feature tour has been completed
 * @returns Promise<boolean> - Whether feature tour has been completed
 */
export const isFeatureTourCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(FEATURE_TOUR_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking feature tour status:', error);
    return false;
  }
};

/**
 * Mark feature tour as completed
 * @returns Promise<void>
 */
export const markFeatureTourCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FEATURE_TOUR_COMPLETED_KEY, 'true');

    // Track analytics event
    analyticsService.trackEvent(AnalyticsEventType.FEATURE_USED, {
      feature_name: 'feature_tour_completed',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error marking feature tour as completed:', error);
  }
};

/**
 * Reset feature tour status
 * This will reset both the onboarding and feature tour status
 * @param source - The source of the reset (e.g., 'settings_screen')
 * @returns Promise<void>
 */
export const resetFeatureTour = async (source: string = 'unknown'): Promise<void> => {
  try {
    // Reset onboarding status
    await resetOnboardingStatus();

    // Reset feature tour status
    await AsyncStorage.removeItem(FEATURE_TOUR_COMPLETED_KEY);
    await AsyncStorage.removeItem(FEATURE_TOUR_STEPS_KEY);

    // Track analytics event
    analyticsService.trackEvent(AnalyticsEventType.FEATURE_USED, {
      feature_name: 'feature_tour_reset',
      source,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error resetting feature tour:', error);
    throw error;
  }
};

/**
 * Get feature tour steps
 * @returns Promise<FeatureTourStep[]> - Feature tour steps
 */
export const getFeatureTourSteps = async (): Promise<FeatureTourStep[]> => {
  try {
    const value = await AsyncStorage.getItem(FEATURE_TOUR_STEPS_KEY);
    return value ? JSON.parse(value) : getDefaultFeatureTourSteps();
  } catch (error) {
    console.error('Error getting feature tour steps:', error);
    return getDefaultFeatureTourSteps();
  }
};

/**
 * Save feature tour steps
 * @param steps - Feature tour steps
 * @returns Promise<void>
 */
export const saveFeatureTourSteps = async (steps: FeatureTourStep[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(FEATURE_TOUR_STEPS_KEY, JSON.stringify(steps));
  } catch (error) {
    console.error('Error saving feature tour steps:', error);
  }
};

/**
 * Mark a feature tour step as completed
 * @param stepId - ID of the step to mark as completed
 * @returns Promise<void>
 */
export const markFeatureTourStepCompleted = async (stepId: string): Promise<void> => {
  try {
    const steps = await getFeatureTourSteps();
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          completed: true,
          timestamp: Date.now(),
        };
      }
      return step;
    });

    await saveFeatureTourSteps(updatedSteps);

    // Check if all steps are completed
    const allCompleted = updatedSteps.every(step => step.completed);
    if (allCompleted) {
      await markFeatureTourCompleted();
    }

    // Track analytics event
    analyticsService.trackEvent(AnalyticsEventType.FEATURE_USED, {
      feature_name: 'feature_tour_step_completed',
      step_id: stepId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error marking feature tour step as completed:', error);
  }
};

/**
 * Get default feature tour steps
 * @returns FeatureTourStep[] - Default feature tour steps
 */
const getDefaultFeatureTourSteps = (): FeatureTourStep[] => {
  return [
    {
      id: 'ai_predictions',
      title: 'AI Predictions',
      description:
        "Our AI doesn't just predict winners—it finds VALUE. See exactly where the bookmakers have set odds that don't match the real probabilities.",
      featureId: 'ai_predictions',
      completed: false,
    },
    {
      id: 'real_time_odds',
      title: 'Real-Time Odds',
      description:
        "Watch odds move in real-time across all major sportsbooks. Get alerts when there's value to be found.",
      featureId: 'odds_comparison',
      completed: false,
    },
    {
      id: 'performance_dashboard',
      title: 'Performance Dashboard',
      description:
        "Track performance over time, see where you're making and losing money, and get AI-powered suggestions to improve.",
      featureId: 'performance_dashboard',
      completed: false,
    },
    {
      id: 'personalized_insights',
      title: 'Personalized Insights',
      description:
        'Receive custom insights based on your favorite teams, betting history, and preferences.',
      featureId: 'personalized_insights',
      completed: false,
    },
    {
      id: 'premium_features',
      title: 'Premium Features',
      description:
        'Preview our premium tools like parlay optimizers, prop bet analyzers, and weather impact analysis.',
      featureId: 'premium_features',
      completed: false,
    },
  ];
};

// Export a default object for easier imports
export default {
  isFeatureTourCompleted,
  markFeatureTourCompleted,
  resetFeatureTour,
  getFeatureTourSteps,
  saveFeatureTourSteps,
  markFeatureTourStepCompleted,
};
