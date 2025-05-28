
# AI Sports Edge Services Debug Report

## Overview
- 111 service files found
- 52 services using Firebase
- 3 circular dependencies found

## Firebase Services
- abTestingService (/Users/lisadario/Desktop/ai-sports-edge/services/abTestingService.ts)
- advancedPlayerStatsService (/Users/lisadario/Desktop/ai-sports-edge/services/advancedPlayerStatsService.ts)
- aiNewsAnalysisService (/Users/lisadario/Desktop/ai-sports-edge/services/aiNewsAnalysisService.ts)
- aiPickSelector (/Users/lisadario/Desktop/ai-sports-edge/services/aiPickSelector.ts)
- aiPredictionService (/Users/lisadario/Desktop/ai-sports-edge/services/aiPredictionService.ts)
- aiSummaryService (/Users/lisadario/Desktop/ai-sports-edge/services/aiSummaryService.ts)
- analyticsService (/Users/lisadario/Desktop/ai-sports-edge/services/analyticsService.js)
- analyticsService (/Users/lisadario/Desktop/ai-sports-edge/services/analyticsService.ts)
- apiService (/Users/lisadario/Desktop/ai-sports-edge/services/apiService.ts)
- batchLoadingService (/Users/lisadario/Desktop/ai-sports-edge/services/batchLoadingService.ts)
- bettingAnalyticsService (/Users/lisadario/Desktop/ai-sports-edge/services/bettingAnalyticsService.ts)
- bettingSlipImportService (/Users/lisadario/Desktop/ai-sports-edge/services/bettingSlipImportService.ts)
- cricketService (/Users/lisadario/Desktop/ai-sports-edge/services/cricketService.ts)
- crossPlatformSyncService (/Users/lisadario/Desktop/ai-sports-edge/services/crossPlatformSyncService.ts)
- deepLinkingService (/Users/lisadario/Desktop/ai-sports-edge/services/deepLinkingService.ts)
- enhancedAnalyticsService (/Users/lisadario/Desktop/ai-sports-edge/services/enhancedAnalyticsService.ts)
- faqService (/Users/lisadario/Desktop/ai-sports-edge/services/faqService.ts)
- firebaseMonitoringService (/Users/lisadario/Desktop/ai-sports-edge/services/firebaseMonitoringService.ts)
- firebaseService (/Users/lisadario/Desktop/ai-sports-edge/services/firebaseService.ts)
- firebaseSubscriptionService (/Users/lisadario/Desktop/ai-sports-edge/services/firebaseSubscriptionService.ts)
- formula1Service (/Users/lisadario/Desktop/ai-sports-edge/services/formula1Service.ts)
- fraudDetectionService (/Users/lisadario/Desktop/ai-sports-edge/services/fraudDetectionService.ts)
- gameUrlService (/Users/lisadario/Desktop/ai-sports-edge/services/gameUrlService.ts)
- groupSubscriptionService (/Users/lisadario/Desktop/ai-sports-edge/services/groupSubscriptionService.ts)
- index (/Users/lisadario/Desktop/ai-sports-edge/services/index.js)
- index (/Users/lisadario/Desktop/ai-sports-edge/services/index.ts)
- licenseVerificationService (/Users/lisadario/Desktop/ai-sports-edge/services/licenseVerificationService.ts)
- microtransactionService (/Users/lisadario/Desktop/ai-sports-edge/services/microtransactionService.js)
- mlPredictionService (/Users/lisadario/Desktop/ai-sports-edge/services/mlPredictionService.ts)
- mockDataService (/Users/lisadario/Desktop/ai-sports-edge/services/mockDataService.ts)
- nascarService (/Users/lisadario/Desktop/ai-sports-edge/services/nascarService.ts)
- offlineService (/Users/lisadario/Desktop/ai-sports-edge/services/offlineService.ts)
- optimizedUserService (/Users/lisadario/Desktop/ai-sports-edge/services/optimizedUserService.ts)
- parlayOddsService (/Users/lisadario/Desktop/ai-sports-edge/services/parlayOddsService.ts)
- parlayService (/Users/lisadario/Desktop/ai-sports-edge/services/parlayService.ts)
- personalizationService (/Users/lisadario/Desktop/ai-sports-edge/services/personalizationService.ts)
- playerStatsService (/Users/lisadario/Desktop/ai-sports-edge/services/playerStatsService.ts)
- pushNotificationService (/Users/lisadario/Desktop/ai-sports-edge/services/pushNotificationService.ts)
- referralNotificationService (/Users/lisadario/Desktop/ai-sports-edge/services/referralNotificationService.ts)
- rewardsService (/Users/lisadario/Desktop/ai-sports-edge/services/rewardsService.ts)
- rugbyService (/Users/lisadario/Desktop/ai-sports-edge/services/rugbyService.ts)
- searchService (/Users/lisadario/Desktop/ai-sports-edge/services/searchService.js)
- searchService (/Users/lisadario/Desktop/ai-sports-edge/services/searchService.ts)
- subscriptionAnalyticsService (/Users/lisadario/Desktop/ai-sports-edge/services/subscriptionAnalyticsService.ts)
- subscriptionService (/Users/lisadario/Desktop/ai-sports-edge/services/subscriptionService.ts)
- userPreferencesService (/Users/lisadario/Desktop/ai-sports-edge/services/userPreferencesService.js)
- userPreferencesService (/Users/lisadario/Desktop/ai-sports-edge/services/userPreferencesService.ts)
- userService (/Users/lisadario/Desktop/ai-sports-edge/services/userService.ts)
- userSportsPreferencesService (/Users/lisadario/Desktop/ai-sports-edge/services/userSportsPreferencesService.ts)
- viewCounterService (/Users/lisadario/Desktop/ai-sports-edge/services/viewCounterService.ts)
- weatherService (/Users/lisadario/Desktop/ai-sports-edge/services/weatherService.ts)
- aiPickSelector (/Users/lisadario/Desktop/ai-sports-edge/src/services/aiPickSelector.ts)

## Circular Dependencies
- cacheService <-> venueService
- geolocationService <-> cacheService
- venueService <-> cacheService

## Services with Issues
- advancedAnalyticsService: Service is not imported anywhere
- analyticsService.d: Service is not imported anywhere
- bugReportingService: Service is not imported anywhere
- dataExportService: Service is not imported anywhere
- helpCenterService: Service is not imported anywhere
- index: Firebase usage without error handling
- index: Firebase usage without error handling
- licenseVerificationService: Service is not imported anywhere
- mockDataService: Firebase usage without error handling
- monitoringService: No exports found, Service is not imported anywhere
- paymentService: No exports found, Service is not imported anywhere
- playersService: Service is not imported anywhere
- searchService: No exports found
- stripeTaxService: No exports found, Service is not imported anywhere
- stripeTaxService: Service is not imported anywhere
- teamsService: Service is not imported anywhere

## Unused Services
- advancedAnalyticsService (/Users/lisadario/Desktop/ai-sports-edge/services/advancedAnalyticsService.ts)
- analyticsService.d (/Users/lisadario/Desktop/ai-sports-edge/services/analyticsService.d.ts)
- bugReportingService (/Users/lisadario/Desktop/ai-sports-edge/services/bugReportingService.ts)
- dataExportService (/Users/lisadario/Desktop/ai-sports-edge/services/dataExportService.ts)
- helpCenterService (/Users/lisadario/Desktop/ai-sports-edge/services/helpCenterService.ts)
- licenseVerificationService (/Users/lisadario/Desktop/ai-sports-edge/services/licenseVerificationService.ts)
- monitoringService (/Users/lisadario/Desktop/ai-sports-edge/services/monitoringService.js)
- paymentService (/Users/lisadario/Desktop/ai-sports-edge/services/paymentService.js)
- playersService (/Users/lisadario/Desktop/ai-sports-edge/services/playersService.js)
- stripeTaxService (/Users/lisadario/Desktop/ai-sports-edge/services/stripeTaxService.js)
- stripeTaxService (/Users/lisadario/Desktop/ai-sports-edge/services/stripeTaxService.ts)
- teamsService (/Users/lisadario/Desktop/ai-sports-edge/services/teamsService.js)

## Recommendations

1. Fix Firebase services to include proper error handling
2. Remove or refactor unused services
3. Resolve circular dependencies
4. Ensure all services properly use environment variables
5. Implement singleton pattern for services that should be shared
