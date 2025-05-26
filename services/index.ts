// Export services without naming conflicts
export * from './aiNewsAnalysisService';
export * from './aiPredictionService';
export * from './aiSummaryService';
export * from './analyticsService';
export * from './appDownloadService';
export * from './bankrollManagementService';
export * from './faqService';
export * from './geolocationService';
export * from './horseRacingService';
export * from './notificationService';
export * from './onboardingService';
export * from './parlayService';
export * from './playerStatsService';
export * from './referralNotificationService';
export * from './rewardsService';
export * from './sportsDataService';
export * from './sportsNewsService';
export * from './subscriptionAnalyticsService';
export * from './ufcService';
export * from './userPreferencesService';
export * from './userSportsPreferencesService';
export * from './venueService';

// Export services with potential naming conflicts as namespaces
import * as firebaseSubscription from './firebaseSubscriptionService';
import * as mockSubscription from './subscriptionService';
import * as formula1Service from './formula1Service';
import * as nascarService from './nascarService';
import * as rugbyService from './rugbyService';
import * as cricketService from './cricketService';

export {
  firebaseSubscription,
  mockSubscription,
  formula1Service,
  nascarService,
  rugbyService,
  cricketService
};