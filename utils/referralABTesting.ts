/**
 * Referral A/B Testing Utility
 *
 * This utility provides functions for A/B testing different referral reward structures.
 * It assigns users to different test groups and tracks their performance.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '../config/firebase';

// A/B Test variants
export enum ReferralRewardVariant {
  CONTROL = 'control', // Default reward structure
  SUBSCRIPTION_FOCUSED = 'sub', // More subscription extensions
  CASH_FOCUSED = 'cash', // More cash rewards
  EARLY_REWARDS = 'early', // More rewards at lower milestones
}

// Reward structures for each variant
export const REWARD_STRUCTURES = {
  [ReferralRewardVariant.CONTROL]: [
    { count: 3, type: 'subscription_extension', value: 30 }, // 1 month
    { count: 5, type: 'premium_trial', value: 60 }, // 2 months
    { count: 10, type: 'cash_or_upgrade', value: 25 }, // $25
    { count: 20, type: 'elite_status', value: 0 }, // Elite status
  ],
  [ReferralRewardVariant.SUBSCRIPTION_FOCUSED]: [
    { count: 3, type: 'subscription_extension', value: 30 }, // 1 month
    { count: 5, type: 'subscription_extension', value: 60 }, // 2 months
    { count: 10, type: 'subscription_extension', value: 90 }, // 3 months
    { count: 15, type: 'elite_status', value: 0 }, // Elite status
  ],
  [ReferralRewardVariant.CASH_FOCUSED]: [
    { count: 3, type: 'cash_reward', value: 10 }, // $10
    { count: 5, type: 'cash_reward', value: 15 }, // $15
    { count: 10, type: 'cash_reward', value: 30 }, // $30
    { count: 20, type: 'elite_status', value: 0 }, // Elite status
  ],
  [ReferralRewardVariant.EARLY_REWARDS]: [
    { count: 1, type: 'subscription_extension', value: 15 }, // 15 days
    { count: 3, type: 'premium_trial', value: 30 }, // 1 month
    { count: 7, type: 'cash_or_upgrade', value: 20 }, // $20
    { count: 15, type: 'elite_status', value: 0 }, // Elite status
  ],
};

// Storage key for A/B test assignment
const AB_TEST_VARIANT_KEY = 'referral_ab_test_variant';

/**
 * Get the user's assigned A/B test variant
 * @returns {Promise<ReferralRewardVariant>} The assigned variant
 */
export const getUserVariant = async (): Promise<ReferralRewardVariant> => {
  try {
    // Check if user already has an assigned variant
    const storedVariant = await AsyncStorage.getItem(AB_TEST_VARIANT_KEY);

    if (
      storedVariant &&
      Object.values(ReferralRewardVariant).includes(storedVariant as ReferralRewardVariant)
    ) {
      return storedVariant as ReferralRewardVariant;
    }

    // Assign a new variant
    const variant = assignVariant();
    await AsyncStorage.setItem(AB_TEST_VARIANT_KEY, variant);

    // Track assignment in analytics
    trackVariantAssignment(variant);

    return variant;
  } catch (error) {
    console.error('Error getting A/B test variant:', error);
    return ReferralRewardVariant.CONTROL; // Default to control group on error
  }
};

/**
 * Assign a variant to the user
 * @returns {ReferralRewardVariant} The assigned variant
 */
const assignVariant = (): ReferralRewardVariant => {
  // Get a random number between 0 and 3
  const randomIndex = Math.floor(Math.random() * 4);

  // Assign variant based on random number
  switch (randomIndex) {
    case 0:
      return ReferralRewardVariant.CONTROL;
    case 1:
      return ReferralRewardVariant.SUBSCRIPTION_FOCUSED;
    case 2:
      return ReferralRewardVariant.CASH_FOCUSED;
    case 3:
      return ReferralRewardVariant.EARLY_REWARDS;
    default:
      return ReferralRewardVariant.CONTROL;
  }
};

/**
 * Track variant assignment in analytics
 * @param {ReferralRewardVariant} variant The assigned variant
 */
const trackVariantAssignment = (variant: ReferralRewardVariant) => {
  // In a real app, this would track the assignment in Firebase Analytics
  console.log(`User assigned to referral A/B test variant: ${variant}`);
};

/**
 * Get the reward structure for the user's variant
 * @returns {Promise<Array<{count: number, type: string, value: number}>>} The reward structure
 */
export const getUserRewardStructure = async () => {
  const variant = await getUserVariant();
  return REWARD_STRUCTURES[variant];
};

/**
 * Track a referral conversion for the user's variant
 * @param {string} referralCode The referral code used
 * @param {boolean} subscribed Whether the referred user subscribed
 */
export const trackReferralConversion = async (referralCode: string, subscribed: boolean) => {
  try {
    const variant = await getUserVariant();

    // In a real app, this would track the conversion in Firebase Analytics
    console.log(
      `Referral conversion for variant ${variant}: ${referralCode}, subscribed: ${subscribed}`
    );
  } catch (error) {
    console.error('Error tracking referral conversion:', error);
  }
};

/**
 * Track a milestone reward claim for the user's variant
 * @param {number} milestone The milestone count
 * @param {string} rewardType The type of reward claimed
 */
export const trackMilestoneRewardClaim = async (milestone: number, rewardType: string) => {
  try {
    const variant = await getUserVariant();

    // In a real app, this would track the reward claim in Firebase Analytics
    console.log(
      `Milestone reward claim for variant ${variant}: milestone ${milestone}, reward type: ${rewardType}`
    );
  } catch (error) {
    console.error('Error tracking milestone reward claim:', error);
  }
};
