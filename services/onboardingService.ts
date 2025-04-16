import AsyncStorage from '@react-native-async-storage/async-storage';
import { info, error as logError, LogCategory } from './loggingService';
import { safeErrorCapture } from './errorUtils';

// Storage keys
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const ONBOARDING_STEPS_KEY = 'onboarding_steps_completed';

/**
 * Onboarding Service
 * 
 * Manages the onboarding state of the application, including tracking which
 * onboarding steps have been completed and whether the entire onboarding
 * process has been completed.
 */

/**
 * Check if onboarding has been completed
 * @returns Promise<boolean> True if onboarding has been completed, false otherwise
 */
export const isOnboardingCompleted = async (): Promise<boolean> => {
  console.log('onboardingService: Checking if onboarding is completed');
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const completed = value === 'true';
    console.log(`onboardingService: Onboarding completed: ${completed}`);
    info(LogCategory.APP, `Onboarding completed: ${completed}`);
    return completed;
  } catch (error) {
    console.error('onboardingService: Error checking onboarding status:', error);
    logError(LogCategory.APP, 'Error checking onboarding status', error as Error);
    safeErrorCapture(error as Error);
    // Default to showing onboarding if there's an error
    return false;
  }
};

/**
 * Mark onboarding as completed
 * @returns Promise<void>
 */
export const markOnboardingCompleted = async (): Promise<void> => {
  console.log('onboardingService: Marking onboarding as completed');
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    console.log('onboardingService: Onboarding marked as completed');
    info(LogCategory.APP, 'Onboarding marked as completed');
  } catch (error) {
    console.error('onboardingService: Error marking onboarding as completed:', error);
    logError(LogCategory.APP, 'Error marking onboarding as completed', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Reset onboarding status (for testing or user reset)
 * @returns Promise<void>
 */
export const resetOnboardingStatus = async (): Promise<void> => {
  console.log('onboardingService: Resetting onboarding status');
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    await AsyncStorage.removeItem(ONBOARDING_STEPS_KEY);
    console.log('onboardingService: Onboarding status reset');
    info(LogCategory.APP, 'Onboarding status reset');
  } catch (error) {
    console.error('onboardingService: Error resetting onboarding status:', error);
    logError(LogCategory.APP, 'Error resetting onboarding status', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Get completed onboarding steps
 * @returns Promise<string[]> Array of completed step IDs
 */
export const getCompletedOnboardingSteps = async (): Promise<string[]> => {
  console.log('onboardingService: Getting completed onboarding steps');
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_STEPS_KEY);
    const steps = value ? JSON.parse(value) : [];
    console.log(`onboardingService: Completed steps: ${steps.join(', ') || 'none'}`);
    return steps;
  } catch (error) {
    console.error('onboardingService: Error getting completed onboarding steps:', error);
    logError(LogCategory.APP, 'Error getting completed onboarding steps', error as Error);
    safeErrorCapture(error as Error);
    // Return empty array if there's an error
    return [];
  }
};

/**
 * Mark an onboarding step as completed
 * @param stepId ID of the step to mark as completed
 * @returns Promise<void>
 */
export const markOnboardingStepCompleted = async (stepId: string): Promise<void> => {
  console.log(`onboardingService: Marking onboarding step ${stepId} as completed`);
  try {
    const steps = await getCompletedOnboardingSteps();
    if (!steps.includes(stepId)) {
      steps.push(stepId);
      await AsyncStorage.setItem(ONBOARDING_STEPS_KEY, JSON.stringify(steps));
      console.log(`onboardingService: Step ${stepId} marked as completed`);
      info(LogCategory.APP, `Onboarding step ${stepId} marked as completed`);
    }
  } catch (error) {
    console.error(`onboardingService: Error marking step ${stepId} as completed:`, error);
    logError(LogCategory.APP, `Error marking onboarding step ${stepId} as completed`, error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Check if a specific onboarding step has been completed
 * @param stepId ID of the step to check
 * @returns Promise<boolean> True if the step has been completed, false otherwise
 */
export const isOnboardingStepCompleted = async (stepId: string): Promise<boolean> => {
  console.log(`onboardingService: Checking if onboarding step ${stepId} is completed`);
  try {
    const steps = await getCompletedOnboardingSteps();
    const completed = steps.includes(stepId);
    console.log(`onboardingService: Step ${stepId} completed: ${completed}`);
    return completed;
  } catch (error) {
    console.error(`onboardingService: Error checking if step ${stepId} is completed:`, error);
    logError(LogCategory.APP, `Error checking if onboarding step ${stepId} is completed`, error as Error);
    safeErrorCapture(error as Error);
    // Default to not completed if there's an error
    return false;
  }
};