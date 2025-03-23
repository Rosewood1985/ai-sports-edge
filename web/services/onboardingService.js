/**
 * Onboarding service for web
 * Handles onboarding state and analytics
 */

// Local storage key for onboarding status
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

/**
 * Check if onboarding has been completed
 * @returns {Promise<boolean>} True if onboarding has been completed
 */
export const isOnboardingCompleted = async () => {
  try {
    // Use a try-catch block to handle potential localStorage access issues
    // This can happen in private browsing mode or when storage is full
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    
    // Validate the value to prevent unexpected behavior
    if (completed !== 'true' && completed !== null) {
      console.warn('Invalid onboarding status value:', completed);
      // Reset to a valid state
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'false');
      return false;
    }
    
    return completed === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // Graceful degradation - if we can't access localStorage, assume onboarding is not completed
    return false;
  }
};

/**
 * Mark onboarding as completed
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const markOnboardingCompleted = async () => {
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available');
      return false;
    }
    
    // Set the value with proper error handling
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    
    // Verify the value was set correctly
    const verifyValue = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (verifyValue !== 'true') {
      console.error('Failed to set onboarding status');
      return false;
    }
    
    // Track onboarding completion with analytics
    try {
      if (window.gtag) {
        window.gtag('event', 'onboarding_completed', {
          'event_category': 'engagement',
          'event_label': 'onboarding',
          'timestamp': new Date().toISOString(),
        });
      }
    } catch (analyticsError) {
      // Don't let analytics errors affect the main functionality
      console.warn('Analytics error:', analyticsError);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking onboarding as completed:', error);
    // Return false instead of throwing to prevent app crashes
    return false;
  }
};

/**
 * Reset onboarding status (for testing)
 * @returns {Promise<void>}
 */
export const resetOnboardingStatus = async () => {
  try {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    throw error;
  }
};

/**
 * Initialize onboarding analytics
 * @param {number} totalSteps - Total number of onboarding steps
 * @returns {Promise<void>}
 */
export const initOnboardingAnalytics = async (totalSteps) => {
  try {
    if (window.gtag) {
      window.gtag('event', 'onboarding_started', {
        'event_category': 'engagement',
        'event_label': 'onboarding',
        'total_steps': totalSteps,
      });
    }
  } catch (error) {
    console.error('Error initializing onboarding analytics:', error);
  }
};

/**
 * Update onboarding progress
 * @param {number} currentStep - Current step index (1-based)
 * @param {number} totalSteps - Total number of steps
 * @returns {Promise<void>}
 */
export const updateOnboardingProgress = async (currentStep, totalSteps) => {
  try {
    if (window.gtag) {
      window.gtag('event', 'onboarding_step', {
        'event_category': 'engagement',
        'event_label': `step_${currentStep}`,
        'current_step': currentStep,
        'total_steps': totalSteps,
        'progress_percentage': Math.round((currentStep / totalSteps) * 100),
      });
    }
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
  }
};