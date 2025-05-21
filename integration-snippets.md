# Integration Snippets

## ThemeToggle Component Integration

### Settings Screen Integration

Add the ThemeToggle component to your settings screen:

```jsx
// Import the ThemeToggle component
import { ThemeToggle } from 'atomic/molecules/theme';

// Add this to your settings section in the render method
<View style={styles.settingItem}>
  <Text style={styles.settingLabel}>Dark Mode</Text>
  <ThemeToggle variant="switch" />
</View>
```

Files to update:

- `screens/AccessibilitySettingsScreen.tsx`
- `screens/LanguageSettingsScreen.tsx`
- `screens/LocationNotificationSettings.js`
- `screens/NotificationSettingsScreen.tsx`
- `screens/OfflineSettingsScreen.tsx`
- `screens/PrivacySettingsScreen.tsx`
- `screens/SettingsScreen.tsx`
- `components/PersonalizationSettings.tsx`
- `components/ReferralPrivacySettings.tsx`
- `atomic/organisms/privacy/PrivacySettingsScreen.tsx`
- `atomic/pages/SettingsPage.js`

### Theme Context Integration

Update components to use the theme context:

```jsx
// Import the useTheme hook
import { useTheme } from 'atomic/molecules/themeContext';

// Inside your component
const { effectiveTheme } = useTheme();
const isDarkMode = effectiveTheme === 'dark';

// Update your styles to use the theme
const dynamicStyles = {
  container: {
    backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
  },
  text: {
    color: isDarkMode ? '#ffffff' : '#000000',
  },
};
```

Files to update:

- `screens/PersonalizationScreen.tsx`
- `services/personalizationService.ts`

### Navigation Header Integration

Add the ThemeToggle component to your navigation header:

```jsx
// In your navigation configuration
import { ThemeToggle } from 'atomic/molecules/theme';

// Add this to your header right component
headerRight: () => (
  <ThemeToggle 
    variant="icon" 
    style={{ 
      marginRight: 16,
      backgroundColor: 'transparent',
    }}
  />
),
```

## Enhanced API Service Integration

### Direct API Calls Integration

Replace direct API calls with the enhanced apiService:

```jsx
// Before:
const fetchData = async () => {
  try {
    const response = await fetch('https://api.example.com/endpoint');
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// After:
import { apiService } from 'atomic/organisms';

const fetchData = async () => {
  try {
    // The apiService will automatically use cache if available
    const data = await apiService.makeRequest('/endpoint');
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};
```

Files to update:

- `screens/AnalyticsDashboardScreen.tsx`
- `screens/EnhancedAnalyticsDashboardScreen.tsx`
- `screens/FeatureTourScreen.tsx`
- `screens/HomeScreen.tsx`
- `screens/NeonLoginScreen.tsx`
- `screens/OnboardingScreen.tsx`
- `screens/PlayerHistoricalTrendsScreen.tsx`
- `components/AdvancedPlayerMetricsCard.tsx`
- `components/BetNowPopup.tsx`
- `components/BettingAnalyticsChart.tsx`
- `components/BettingHistoryChart.tsx`
- `components/BubbleChart.tsx`
- `components/EnhancedPlayerComparison.tsx`
- `components/FavoritePlayerPicker.tsx`
- `components/HeatMapChart.tsx`
- `components/HistoricalTrendsChart.tsx`
- `components/MilestoneAchievementAnimation.tsx`
- `components/MobileAppDownload.tsx`
- `components/OddsButton.tsx`
- `components/OddsComparisonComponent.tsx`
- `components/OnboardingSlide.tsx`
- `components/PageTransition.tsx`
- `components/ReferralLeaderboard.tsx`
- `components/ReferralNotification.tsx`
- `components/ResponsiveBookmakerLogo.tsx`
- `components/ResponsiveGameInfo.tsx`
- `components/ResponsiveTeamLogo.tsx`
- `components/RichNotification.tsx`
- `components/USOnlyPaymentForm.jsx`
- `components/UpgradePrompt.tsx`
- `services/FanDuelService.js`
- `services/abTestingService.ts`
- `services/advancedPlayerStatsService.ts`
- `services/cacheService.ts`
- `services/cricketService.ts`
- `services/crossPlatformSyncService.ts`
- `services/crossPlatformSyncService.tsx`
- `services/enhancedAnalyticsService.ts`
- `services/enhancedCacheService.ts`
- `services/errorRecoveryService.ts`
- `services/firebaseSubscriptionService.ts`
- `services/fraudDetectionService.ts`
- `services/gameUrlService.ts`
- `services/geolocationService.js`
- `services/geolocationService.ts`
- `services/ml-sports-edge/MLSportsEdgeService.js`
- `services/nascarService.ts`
- `services/ncaaBasketballService.ts`
- `services/networkService.ts`
- `services/oddsCacheService.ts`
- `services/offlineQueueService.ts`
- `services/offlineService.ts`
- `services/playerStatsService.ts`
- `services/playersService.js`
- `services/rssAnalyticsService.js`
- `services/rugbyService.ts`
- `services/sportsNewsService.ts`
- `services/stripeTaxService.js`
- `services/stripeTaxService.ts`
- `services/teamsService.js`
- `services/ufcService.ts`
- `services/venueService.ts`
- `services/weatherService.ts`
- `hooks/useOddsData.ts`
- `atomic/atoms/privacy/dataRetentionPolicies.ts`
- `atomic/molecules/firebaseBackupStorage.js`
- `atomic/molecules/stripe/stripeTax.js`
- `atomic/organisms/firebaseBackupService.js`

### Existing API Services Integration

Update existing API services to use the enhanced apiService:

```jsx
// Before:
import { OddsService } from 'services/OddsService';

const fetchOdds = async () => {
  try {
    const odds = await OddsService.getOdds(gameId);
    setOdds(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
};

// After:
import { apiService } from 'atomic/organisms';

const fetchOdds = async () => {
  try {
    // The apiService will automatically use cache if available
    const odds = await apiService.makeRequest('/odds', { gameId });
    setOdds(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
};
```

Files to update:

- `screens/LeagueSelectionScreen.tsx`
- `screens/Onboarding/GDPRConsentScreen.tsx`
- `screens/ParlayOddsScreen.tsx`
- `services/Formula1OddsService.js`
- `services/HorseRacingOddsService.js`
- `services/MlbOddsService.js`
- `services/NbaOddsService.js`
- `services/NcaaOddsService.js`
- `services/NhlOddsService.js`
- `services/OddsService.js`
- `services/SoccerOddsService.js`
- `services/UfcOddsService.js`
- `services/WnbaOddsService.js`
- `services/apiService.ts`
- `services/batchLoadingService.ts`
- `services/formula1Service.ts`
- `services/index.js`
- `services/index.ts`
- `services/microtransactionService.js`
- `services/optimizedUserService.ts`
- `services/parlayOddsService.js`
- `services/parlayOddsService.ts`
- `services/sportsDataService.ts`
- `services/userService.ts`
- `hooks/useAuth.ts`
- `atomic/organisms/api/apiService.ts`
- `atomic/organisms/api/index.js`
- `atomic/organisms/index.js`

### Cache Invalidation

Add cache invalidation after data mutations:

```jsx
// After a data mutation (POST, PUT, DELETE), invalidate the cache
import { apiService } from 'atomic/organisms';

const updateData = async () => {
  try {
    // Make the update request
    await apiService.makeRequest('/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Invalidate the cache for this endpoint
    await apiService.clearCache('/endpoint');
    
    // Optionally, refetch the data
    const updatedData = await apiService.makeRequest('/endpoint');
    setData(updatedData);
  } catch (error) {
    console.error('Error updating data:', error);
  }
};
```

## Integration Strategy

1. Start with high-impact, low-risk changes
2. Test each integration thoroughly before moving to the next
3. Consider creating a separate branch for each integration
4. Update tests to reflect the new implementations
5. Document any issues or edge cases encountered during integration
