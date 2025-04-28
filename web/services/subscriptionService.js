/**
 * Web-specific subscription service
 * 
 * This file provides subscription-related functionality for the web app,
 * importing the subscription plans from the main firebaseSubscriptionService.ts
 */
import { SUBSCRIPTION_PLANS, ONE_TIME_PURCHASES, MICROTRANSACTIONS } from '../../services/firebaseSubscriptionService';

// Export subscription plans for use in web components
export { SUBSCRIPTION_PLANS, ONE_TIME_PURCHASES, MICROTRANSACTIONS };

/**
 * Get a formatted price string
 * @param {number} price - The price value
 * @param {string} interval - The billing interval ('month' or 'year')
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, interval) => {
  return `$${price}/${interval === 'year' ? 'year' : 'mo'}`;
};

/**
 * Get a subscription plan by ID
 * @param {string} planId - The plan ID to find
 * @returns {Object|null} - The subscription plan or null if not found
 */
export const getPlanById = (planId) => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null;
};

/**
 * Get all monthly subscription plans
 * @returns {Array} - Array of monthly subscription plans
 */
export const getMonthlyPlans = () => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.interval === 'month');
};

/**
 * Get all yearly subscription plans
 * @returns {Array} - Array of yearly subscription plans
 */
export const getYearlyPlans = () => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.interval === 'year');
};

/**
 * Get the group subscription plan
 * @returns {Object|null} - The group subscription plan or null if not found
 */
export const getGroupPlan = () => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === 'group-pro-monthly') || null;
};

export default {
  SUBSCRIPTION_PLANS,
  ONE_TIME_PURCHASES,
  MICROTRANSACTIONS,
  formatPrice,
  getPlanById,
  getMonthlyPlans,
  getYearlyPlans,
  getGroupPlan
};