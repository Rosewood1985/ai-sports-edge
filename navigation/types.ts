/**
 * Navigation Types
 *
 * This file defines the types for the navigation stack parameters.
 */

export type RootStackParamList = {
  // Main screens
  Home: undefined;
  Games: undefined;
  Players: undefined;
  Teams: undefined;
  Bets: undefined;
  Subscription: undefined;
  Referral: { code?: string };
  Notifications: undefined;
  Settings: undefined;
  Promos: undefined;

  // Detail screens
  GameDetails: { gameId: string };
  PlayerDetails: { playerId: string };
  TeamDetails: { teamId: string };
  BetDetails: { betId: string };
  NotificationDetails: { notificationId: string };
  Promo: { code: string };

  // Settings screens
  NotificationSettings: undefined;
  AccountSettings: undefined;
  BettingSettings: undefined;

  // Authentication screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Onboarding screens
  Onboarding: undefined;

  // Other screens
  About: undefined;
  Help: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};
