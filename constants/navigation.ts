/**
 * Navigation route names
 *
 * This file centralizes all navigation route names to avoid hardcoding
 * and ensure consistency across the app.
 */

export const ROUTES = {
  // Auth routes
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Main routes
  HOME: 'PersonalizedHome',
  DASHBOARD: 'Dashboard',
  ODDS_COMPARISON: 'OddsComparison',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',

  // Feature routes
  REWARDS: 'Rewards',
  FAQ: 'FAQ',
  HELP: 'Help',
  BETTING_HISTORY: 'BettingHistory',
  PREDICTIONS: 'Predictions',
  ANALYTICS: 'Analytics',

  // Admin routes
  ADMIN_DASHBOARD: 'AdminDashboard',

  // Misc
  NOTIFICATIONS: 'Notifications',
  ABOUT: 'About',
  TERMS: 'Terms',
  PRIVACY: 'Privacy',
};

/**
 * Navigation stacks
 */
export const STACKS = {
  AUTH: 'AuthStack',
  MAIN: 'MainStack',
  SETTINGS: 'SettingsStack',
  ADMIN: 'AdminStack',
};

/**
 * Tab navigation routes
 */
export const TABS = {
  HOME: 'HomeTab',
  ODDS: 'OddsTab',
  PREDICTIONS: 'PredictionsTab',
  PROFILE: 'ProfileTab',
};

/**
 * Deep link paths
 *
 * These should match the paths configured in app.json for deep linking
 */
export const DEEP_LINKS = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  ODDS: 'odds',
  GAME: 'game',
  PROFILE: 'profile',
  REWARDS: 'rewards',
  REFERRAL: 'referral',
};
