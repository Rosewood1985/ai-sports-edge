// ✅ MIGRATED: Firebase Atomic Architecture
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from '../config/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth } from '../config/firebase';

// Keys for AsyncStorage
const ONBOARDING_COMPLETED_KEY = '@AISportsEdge:onboardingCompleted';
const ONBOARDING_ANALYTICS_KEY = '@AISportsEdge:onboardingAnalytics';

// Firestore collection for analytics
const ANALYTICS_COLLECTION = 'onboarding_analytics';

/**
 * Interface for onboarding analytics data
 */
interface OnboardingAnalytics {
  userId?: string;
  deviceId: string;
  started: Timestamp;
  completed?: Timestamp;
  slidesViewed: number;
  totalSlides: number;
  completionRate: number;
}

/**
 * Check if onboarding has been completed
 * @returns Promise<boolean> - Whether onboarding has been completed
 */
export const isOnboardingCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 * @returns Promise<void>
 */
export const markOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    
    // Update analytics
    const analytics = await getOnboardingAnalytics();
    if (analytics) {
      analytics.completed = Timestamp.now();
      analytics.completionRate = 100;
      await saveOnboardingAnalytics(analytics);
    }
  } catch (error) {
    console.error('Error marking onboarding as completed:', error);
  }
};

/**
 * Reset onboarding completion status
 * @returns Promise<void>
 */
export const resetOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
};

/**
 * Initialize onboarding analytics
 * @param totalSlides - Total number of onboarding slides
 * @returns Promise<string> - Device ID for analytics tracking
 */
export const initOnboardingAnalytics = async (totalSlides: number): Promise<string> => {
  try {
    // Generate a unique device ID if not already stored
    let deviceId = await AsyncStorage.getItem('@AISportsEdge:deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await AsyncStorage.setItem('@AISportsEdge:deviceId', deviceId);
    }
    
    const analytics: OnboardingAnalytics = {
      userId: auth.currentUser?.uid,
      deviceId,
      started: Timestamp.now(),
      slidesViewed: 0,
      totalSlides,
      completionRate: 0
    };
    
    await saveOnboardingAnalytics(analytics);
    return deviceId;
  } catch (error) {
    console.error('Error initializing onboarding analytics:', error);
    return '';
  }
};

/**
 * Update onboarding progress
 * @param slidesViewed - Number of slides viewed
 * @param totalSlides - Total number of slides
 * @returns Promise<void>
 */
export const updateOnboardingProgress = async (
  slidesViewed: number, 
  totalSlides: number
): Promise<void> => {
  try {
    const analytics = await getOnboardingAnalytics();
    if (analytics) {
      analytics.slidesViewed = slidesViewed;
      analytics.totalSlides = totalSlides;
      analytics.completionRate = Math.round((slidesViewed / totalSlides) * 100);
      await saveOnboardingAnalytics(analytics);
    }
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
  }
};

/**
 * Get onboarding analytics from AsyncStorage
 * @returns Promise<OnboardingAnalytics | null>
 */
const getOnboardingAnalytics = async (): Promise<OnboardingAnalytics | null> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_ANALYTICS_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting onboarding analytics:', error);
    return null;
  }
};

/**
 * Save onboarding analytics to AsyncStorage and Firestore
 * @param analytics - Onboarding analytics data
 * @returns Promise<void>
 */
const saveOnboardingAnalytics = async (analytics: OnboardingAnalytics): Promise<void> => {
  try {
    // Save to AsyncStorage
    await AsyncStorage.setItem(ONBOARDING_ANALYTICS_KEY, JSON.stringify(analytics));
    
    // Save to Firestore if user is logged in
    if (auth.currentUser) {
      const analyticsRef = doc(
        firestore, 
        ANALYTICS_COLLECTION, 
        analytics.userId || analytics.deviceId
      );
      await setDoc(analyticsRef, {
        ...analytics,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error saving onboarding analytics:', error);
  }
};