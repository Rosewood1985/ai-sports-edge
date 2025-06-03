/**
 * Analytics Constants
 *
 * Constants used for analytics tracking and dashboard display.
 */

// Time periods for analytics data
export const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom',
};

// Event types for analytics tracking
export const EVENT_TYPES = {
  IMPRESSION: 'impression',
  CLICK: 'click',
  PURCHASE: 'purchase',
  REDIRECT: 'redirect',
  CONVERSION: 'conversion',
  COOKIE_INIT: 'cookie_init',
  COOKIE_PERSIST: 'cookie_persist',
};

// Metric types for analytics dashboard
export const METRIC_TYPES = {
  REVENUE: 'revenue',
  CONVERSION_RATE: 'conversion_rate',
  COOKIE_SUCCESS: 'cookie_success',
  ACTIVE_USERS: 'active_users',
  ARPU: 'arpu',
};
