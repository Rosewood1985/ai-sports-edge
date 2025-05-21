# Integration Points Identification Report

## ThemeToggle Component Integration Points

### Potential Screens for ThemeToggle

- **screens/AccessibilitySettingsScreen.tsx**: Settings related screen
- **screens/LanguageSettingsScreen.tsx**: Settings related screen
- **screens/LocationNotificationSettings.js**: Settings related screen
- **screens/NotificationSettingsScreen.tsx**: Settings related screen
- **screens/OfflineSettingsScreen.tsx**: Settings related screen
- **screens/PrivacySettingsScreen.tsx**: Settings related screen
- **screens/SettingsScreen.tsx**: Settings related screen
- **components/PersonalizationSettings.tsx**: Settings related screen
- **components/ReferralPrivacySettings.tsx**: Settings related screen
- **atomic/organisms/privacy/PrivacySettingsScreen.tsx**: Settings related screen
- **atomic/pages/SettingsPage.js**: Settings related screen

### Components Using Theme Without Context

- **screens/PersonalizationScreen.tsx**: Uses theme-related styling but might not use theme context
  ```
  Preferences */}
  {renderSectionHeader('APPEARANCE')}
  {renderToggleOption(
  'darkMode',
  'Dark Mode',
  'Use dark theme throughout the app',
  localPreferences.
  ```

- **services/personalizationService.ts**: Uses theme-related styling but might not use theme context
  ```
  Start: boolean;
  gameEnd: boolean;
  specialOffers: boolean;
  };
  displayPreferences?: {
  darkMode?: boolean;
  compactView?: boolean;
  showBetterOddsHighlight?: boolean;
  };
  lastUpdated?: n
  ```

## Enhanced API Service Integration Points

### Direct API Calls

- **screens/AnalyticsDashboardScreen.tsx**: Contains direct API calls that could use caching
  ```
  r';
  import Colors from '../constants/Colors';
  // Get screen dimensions
  const { width } = Dimensions.get('window');
  /**
  * Neon Text component for headings
  */
  const NeonText: React.FC<{
  text: string;
  ```

- **screens/EnhancedAnalyticsDashboardScreen.tsx**: Contains direct API calls that could use caching
  ```
  endDate: number } | undefined>(undefined);
  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;
  // Colors for the dashboard
  const backgroundColor = colors.background;
  con
  ```

- **screens/FeatureTourScreen.tsx**: Contains direct API calls that could use caching
  ```
  t';
  import {  ThemedView  } from '../atomic/atoms/ThemedView';
  const { width, height } = Dimensions.get('window');
  /**
  * FeatureTourScreen component
  * Provides an interactive tour of the app's key feat
  ```

- **screens/HomeScreen.tsx**: Contains direct API calls that could use caching
  ```
  /View>
  </ScrollView>
  </ThemedView>
  );
  };
  // --- Styles ---
  const { width } = Dimensions.get('window');
  const SPACING_UNIT = 8; // Base spacing unit
  const styles = StyleSheet.create({
  contai
  ```

- **screens/NeonLoginScreen.tsx**: Contains direct API calls that could use caching
  ```
  s/i18n/I18nContext";
  import { ROUTES } from "../constants/navigation";
  const { width } = Dimensions.get('window');
  const NeonLoginScreen = () => {
  const navigation = useNavigation();
  const [email, se
  ```

- **screens/OnboardingScreen.tsx**: Contains direct API calls that could use caching
  ```
  dateOnboardingProgress
  } from '../services/onboardingService';
  const { width, height } = Dimensions.get('window');
  /**
  * Onboarding screen component
  * @returns {JSX.Element} - Rendered component
  */
  co
  ```

- **screens/PlayerHistoricalTrendsScreen.tsx**: Contains direct API calls that could use caching
  ```
  0,0,0.1)' : 'rgba(255,255,255,0.1)';
  // Screen width for chart
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding
  // Load player data
  useEffect(() => {
  con
  ```

- **components/AdvancedPlayerMetricsCard.tsx**: Contains direct API calls that could use caching
  ```
  stroke: chartGridColor,
  }
  };
  // Screen width for chart
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding
  // Prepare chart data if available
  const hasC
  ```

- **components/BetNowPopup.tsx**: Contains direct API calls that could use caching
  ```
  </View>
  </Animated.View>
  </View>
  </Modal>
  );
  };
  const { width } = Dimensions.get('window');
  const styles = StyleSheet.create({
  overlay: {
  flex: 1,
  backgroundColor: 'rgba(
  ```

- **components/BettingAnalyticsChart.tsx**: Contains direct API calls that could use caching
  ```
  : React.FC<BettingAnalyticsChartProps> = ({ data, chartType }) => {
  const screenWidth = Dimensions.get('window').width - 32; // Adjust for padding
  const chartConfig = {
  backgroundGradientFrom: '
  ```

- **components/BettingHistoryChart.tsx**: Contains direct API calls that could use caching
  ```
  hartProps> = ({
  timePeriod = 'month',
  chartType = 'profit',
  height = 220,
  width = Dimensions.get('window').width - 40,
  }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [erro
  ```

- **components/BubbleChart.tsx**: Contains direct API calls that could use caching
  ```
  extColor = isDark ? '#FFFFFF' : '#000000';
  // Get screen width
  const screenWidth = Dimensions.get('window').width - 64; // Adjust for padding
  // Animation values
  const animatedValues = useRef
  ```

- **components/EnhancedPlayerComparison.tsx**: Contains direct API calls that could use caching
  ```
  0,0,0.1)' : 'rgba(255,255,255,0.1)';
  // Screen width for chart
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding
  // Chart configuration
  const chartConfig = {
  ```

- **components/FavoritePlayerPicker.tsx**: Contains direct API calls that could use caching
  ```
  ort=${selectedSport}` : '';
  // Call the player search API
  const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}${sportFilter}`);
  const data = await respon
  ```

- **components/HeatMapChart.tsx**: Contains direct API calls that could use caching
  ```
  extColor = isDark ? '#FFFFFF' : '#000000';
  // Get screen width
  const screenWidth = Dimensions.get('window').width - 32; // Adjust for padding
  // State for keyboard navigation
  const [focusedDa
  ```

- **components/HistoricalTrendsChart.tsx**: Contains direct API calls that could use caching
  ```
  State<string[]>(series.map(s => s.label));
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 64);
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).cur
  ```

- **components/MilestoneAchievementAnimation.tsx**: Contains direct API calls that could use caching
  ```
  Ref(new Animated.Value(0)).current;
  // Screen dimensions
  const { width, height } = Dimensions.get('window');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}
  ```

- **components/MobileAppDownload.tsx**: Contains direct API calls that could use caching
  ```
  ermine if device is a tablet or desktop
  useEffect(() => {
  const { width, height } = Dimensions.get('window');
  const isTabletOrDesktop = width >= 768 || height >= 768;
  setIsLargeDevice(isTable
  ```

- **components/OddsButton.tsx**: Contains direct API calls that could use caching
  ```
  Data, { id: userId });
  // Create payment intent on server
  const { data } = await axios.post(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CREATE_PAYMENT, {
  userId,
  productId:
  ```

- **components/OddsComparisonComponent.tsx**: Contains direct API calls that could use caching
  ```
  the API call function
  const fetchFromApi = async () => {
  const response = await axios.get(endpoint, {
  params: {
  apiKey,
  regions: '
  ```

- **components/OnboardingSlide.tsx**: Contains direct API calls that could use caching
  ```
  ImageSourcePropType,
  TouchableOpacity
  } from 'react-native';
  const { width, height } = Dimensions.get('window');
  interface ActionButtonProps {
  text: string;
  onPress: () => void;
  }
  interface Onboar
  ```

- **components/PageTransition.tsx**: Contains direct API calls that could use caching
  ```
  yle, StyleProp } from 'react-native';
  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  // Define transition types
  export type TransitionType =
  | 'fade'
  | 'slideLeft'
  | '
  ```

- **components/ReferralLeaderboard.tsx**: Contains direct API calls that could use caching
  ```
  , 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const { width } = Dimensions.get('window');
  // Update previous entries when entries change
  useEffect(() => {
  if (!loading
  ```

- **components/ReferralNotification.tsx**: Contains direct API calls that could use caching
  ```
  hemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const { width } = Dimensions.get('window');
  useEffect(() => {
  if (visible) {
  // Reset animation
  animation.setVal
  ```

- **components/ResponsiveBookmakerLogo.tsx**: Contains direct API calls that could use caching
  ```
  pixel ratio for responsive image loading
  const pixelRatio = Platform.OS === 'web' ? 1 : Dimensions.get('window').scale;
  // Determine actual size in pixels
  const actualSize = typeof size === 'strin
  ```

- **components/ResponsiveGameInfo.tsx**: Contains direct API calls that could use caching
  ```
  n();
  // Get screen dimensions for responsive sizing
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375; // iPhone SE or similar small device
  // D
  ```

- **components/ResponsiveTeamLogo.tsx**: Contains direct API calls that could use caching
  ```
  pixel ratio for responsive image loading
  const pixelRatio = Platform.OS === 'web' ? 1 : Dimensions.get('window').scale;
  // Determine actual size in pixels
  const actualSize = typeof size === 'strin
  ```

- **components/RichNotification.tsx**: Contains direct API calls that could use caching
  ```
  nst textColor = useThemeColor({}, 'text');
  // Get screen width
  const screenWidth = Dimensions.get('window').width;
  // Show notification on mount
  useEffect(() => {
  Animated.parallel([
  ```

- **components/USOnlyPaymentForm.jsx**: Contains direct API calls that could use caching
  ```
  return;
  }
  // Create payment intent on the server
  const response = await fetch('/api/create-payment', {
  method: 'POST',
  headers: {
  'Content-Type': 'appli
  ```

- **components/UpgradePrompt.tsx**: Contains direct API calls that could use caching
  ```
  s] = useState<boolean>(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const successAnim = R
  ```

- **services/FanDuelService.js**: Contains direct API calls that could use caching
  ```
  // Implement real API call to FanDuel's tracking endpoint
  const response = await fetch('https://affiliates.fanduel.com/api/track', {
  method: 'POST',
  headers: {
  '
  ```

- **services/abTestingService.ts**: Contains direct API calls that could use caching
  ```
  if (!this.isInitialized) {
  await this.initialize();
  }
  return this.experiments.get(experimentId) || null;
  }
  // Get all experiments
  public async getExperiments(): Promise<Expe
  ```

- **services/advancedPlayerStatsService.ts**: Contains direct API calls that could use caching
  ```
  x
  await runTransaction(db, async (transaction) => {
  const viewCountDoc = await transaction.get(viewCountRef);
  if (!viewCountDoc.exists()) {
  transaction.set(viewCountRef, {
  ```

- **services/cacheService.ts**: Contains direct API calls that could use caching
  ```
  / Check memory cache first
  if (this.memoryCache.has(key)) {
  const entry = this.memoryCache.get(key)!;
  // If not expired, return cached data
  if (!this.isExpired(entry)) {
  ```

- **services/cricketService.ts**: Contains direct API calls that could use caching
  ```
  ere('matchId', '==', matchId)
  .where('status', '==', 'succeeded')
  .limit(1)
  .get();
  if (purchasesSnapshot.empty) {
  return null; // User doesn't have access
  ```

- **services/crossPlatformSyncService.ts**: Contains direct API calls that could use caching
  ```
  h((cloudPurchase: FirebasePurchasedOdds) => {
  const existingPurchase = existingPurchases.get(cloudPurchase.gameId);
  // If we don't have this purchase or cloud version i
  ```

- **services/crossPlatformSyncService.tsx**: Contains direct API calls that could use caching
  ```
  const currentTime = Date.now();
  // Fetch cloud data
  const response = await axios.get(`${API_CONFIG.BASE_URL}/api/user-data`, {
  params: {
  userId: this.userId,
  ```

- **services/enhancedAnalyticsService.ts**: Contains direct API calls that could use caching
  ```
  od, customDateRange);
  // Check cache first
  const cachedData = this.dashboardCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
  consol
  ```

- **services/enhancedCacheService.ts**: Contains direct API calls that could use caching
  ```
  / Check memory cache first
  if (this.memoryCache.has(key)) {
  const entry = this.memoryCache.get(key)!;
  // If not expired and not outdated, return cached data
  if (!this.isExpired
  ```

- **services/errorRecoveryService.ts**: Contains direct API calls that could use caching
  ```
  onnected: boolean; connectionType: string | null }> {
  try {
  const netInfo = await NetInfo.fetch();
  return {
  isConnected: netInfo.isConnected || false,
  connectionType: netInfo
  ```

- **services/firebaseSubscriptionService.ts**: Contains direct API calls that could use caching
  ```
  .where('status', '==', 'succeeded')
  .where('expiresAt', '>', now)
  .limit(1)
  .get();
  return !purchasesSnapshot.empty;
  } catch (dbError) {
  safeLog('error', `Dat
  ```

- **services/fraudDetectionService.ts**: Contains direct API calls that could use caching
  ```
  imestamp / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
  dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
  // Count false positives and resolved alerts
  if (alert.sta
  ```

- **services/gameUrlService.ts**: Contains direct API calls that could use caching
  ```
  // Fetch for each sport
  for (const sport of sports) {
  const response = await fetch(
  `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&market
  ```

- **services/geolocationService.js**: Contains direct API calls that could use caching
  ```
  nc getClientIP() {
  try {
  // Try to get the IP from ipify.org
  const response = await axios.get('https://api.ipify.org?format=json');
  if (response.status === 200 && response.data
  ```

- **services/geolocationService.ts**: Contains direct API calls that could use caching
  ```
  is configured
  if (isApiKeyConfigured('OPENWEATHER_API_KEY')) {
  const response = await axios.get(
  `${API_BASE_URLS.OPENWEATHER}/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=
  ```

- **services/ml-sports-edge/MLSportsEdgeService.js**: Contains direct API calls that could use caching
  ```
  t url = `${this.baseUrl}/predictions?sport=${sport}&league=${league}`;
  const response = await fetch(url);
  if (!response.ok) {
  throw new Error(`Failed to fetch predictions: ${respo
  ```

- **services/nascarService.ts**: Contains direct API calls that could use caching
  ```
  where('raceId', '==', raceId)
  .where('status', '==', 'succeeded')
  .limit(1)
  .get();
  if (purchasesSnapshot.empty) {
  return null; // User doesn't have access
  ```

- **services/ncaaBasketballService.ts**: Contains direct API calls that could use caching
  ```
  eout: ncaaBasketballApi.REQUEST_TIMEOUT,
  };
  // Make API request
  const response = await axios.get(apiUrl, requestConfig);
  // Validate response data
  if (!response.data) {
  throw
  ```

- **services/networkService.ts**: Contains direct API calls that could use caching
  ```
  async checkNetworkStatus(): Promise<ConnectionInfo> {
  try {
  const netInfo = await NetInfo.fetch();
  const connectionInfo = this.createConnectionInfo(netInfo);
  // Update current s
  ```

- **services/oddsCacheService.ts**: Contains direct API calls that could use caching
  ```
  timestamp > cachedData.ttl) {
  // Check network status
  const netInfo = await NetInfo.fetch();
  // If offline, extend TTL and mark as stale
  if (!netInfo.isConnected) {
  ```

- **services/offlineQueueService.ts**: Contains direct API calls that could use caching
  ```
  }
  // Get processor for action type
  const processor = this.processors.get(action.type);
  // If no processor, mark as failed
  if (!processor) {
  ```

- **services/offlineService.ts**: Contains direct API calls that could use caching
  ```
  andleNetInfoChange);
  // Get initial network status
  const netInfo = await NetInfo.fetch();
  this.isOnline = netInfo.isConnected ?? true;
  // Log initialization
  conso
  ```

- **services/playerStatsService.ts**: Contains direct API calls that could use caching
  ```
  darApi.REQUEST_TIMEOUT,
  };
  // Make API request to get game data
  const response = await axios.get(apiUrl, requestConfig);
  // Validate response data
  if (!response.data || !response.d
  ```

- **services/playersService.js**: Contains direct API calls that could use caching
  ```
  urn playersCache[sportKey];
  }
  try {
  // Fetch players from API
  const response = await fetch(`/api/players/${sportKey.toLowerCase()}`);
  if (!response.ok) {
  throw new Error(`Faile
  ```

- **services/rssAnalyticsService.js**: Contains direct API calls that could use caching
  ```
  rt async function getFeedAnalytics(source, timeframe = 'week') {
  try {
  const response = await fetch(`/api/analytics/rss/${source}?timeframe=${timeframe}`);
  if (!response.ok) {
  throw new
  ```

- **services/rugbyService.ts**: Contains direct API calls that could use caching
  ```
  ere('matchId', '==', matchId)
  .where('status', '==', 'succeeded')
  .limit(1)
  .get();
  if (purchasesSnapshot.empty) {
  return null; // User doesn't have access
  ```

- **services/sportsNewsService.ts**: Contains direct API calls that could use caching
  ```
  sdb'
  });
  // Fetch latest sports news from The Sports DB API
  const response = await axios.get<TheSportsDBNewsResponse>(`${SPORTS_DB_API_BASE_URL}/latestnews.php`);
  if (response.data
  ```

- **services/stripeTaxService.js**: Contains direct API calls that could use caching
  ```
  {currency}`;
  // Check cache if enabled
  if (useCache) {
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
  logger.debug('Using cached tax calculation', { customer
  ```

- **services/stripeTaxService.ts**: Contains direct API calls that could use caching
  ```
  Cache && stripeTaxConfig.getConfig().taxCalculation.cacheEnabled) {
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
  logger.debug('Using cached tax calculation', { customer
  ```

- **services/teamsService.js**: Contains direct API calls that could use caching
  ```
  return teamsCache[sportKey];
  }
  try {
  // Fetch teams from API
  const response = await fetch(`/api/teams/${sportKey.toLowerCase()}`);
  if (!response.ok) {
  throw new Error(`Failed
  ```

- **services/ufcService.ts**: Contains direct API calls that could use caching
  ```
  if (this.fighterDetailsCache.has(fighterId) &&
  this.isCacheValid(this.fighterDetailsCache.get(fighterId)!)) {
  return this.fighterDetailsCache.get(fighterId)!.data;
  }
  /
  ```

- **services/venueService.ts**: Contains direct API calls that could use caching
  ```
  // Attempt to fetch venues from the API
  const response = await axios.get(`${API_BASE_URLS.SPORTS_DATA_API}/mlb/scores/json/Stadiums`, {
  params: {
  ```

- **services/weatherService.ts**: Contains direct API calls that could use caching
  ```
  rdinates not available: ${venueId}`);
  }
  // Call weather API
  const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
  params: {
  lat: latitude,
  lon: longitu
  ```

- **hooks/useOddsData.ts**: Contains direct API calls that could use caching
  ```
  {string} sport - Sport key (e.g., "americanfootball_nfl")
  * @param {string[]} markets - Markets to fetch (e.g., ["h2h", "spreads"])
  * @param {number} maxRetries - Maximum number of retry attempts for faile
  ```

- **atomic/atoms/privacy/dataRetentionPolicies.ts**: Contains direct API calls that could use caching
  ```
  document.data();
  if (policy.deleteAfterExpiry) {
  // Delete the document
  batch.delete(document.ref);
  } else if (policy.anonymizeAfterExpiry) {
  // Anonymize the data by remo
  ```

- **atomic/molecules/firebaseBackupStorage.js**: Contains direct API calls that could use caching
  ```
  eCreationDate < retentionThreshold;
  });
  for (const file of expiredFiles) {
  await file.delete();
  console.log(`Deleted expired backup file: ${file.name}`);
  }
  return {
  success
  ```

- **atomic/molecules/stripe/stripeTax.js**: Contains direct API calls that could use caching
  ```
  )}_${currency}`;
  // Check cache if enabled
  if (useCache) {
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
  logger.debug('Using cached tax calculation', { customer
  ```

- **atomic/organisms/firebaseBackupService.js**: Contains direct API calls that could use caching
  ```
  c('backups')
  .collection('events')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();
  const events = [];
  eventsSnapshot.forEach(doc => {
  events.push({
  id: doc.i
  ```

### Existing API Services

- **screens/LeagueSelectionScreen.tsx**: Uses existing API services that could be updated to use the new apiService
  ```
  from '@react-navigation/stack';
  import { useTheme } from '../contexts/ThemeContext';
  import { sportsDataService } from '../services/sportsDataService';
  import { userPreferencesService } from '../services/userPre
  ```

- **screens/Onboarding/GDPRConsentScreen.tsx**: Uses existing API services that could be updated to use the new apiService
  ```
  } from '../../navigation/OnboardingNavigator';
  import { saveVerificationData } from '../../services/userService';
  type GDPRConsentScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'GDPRConsen
  ```

- **screens/ParlayOddsScreen.tsx**: Uses existing API services that could be updated to use the new apiService
  ```
  oks/useThemeColor';
  import { analyticsService } from '../services/analyticsService';
  import { parlayOddsService } from '../services/parlayOddsService';
  import ParlayOddsCard from '../components/ParlayOddsCard';
  ```

- **services/Formula1OddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * Formula1OddsService.js
  * Service for fetching and managing Formula 1 odds data
  */
  import oddsService from './OddsSer
  ```

- **services/HorseRacingOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * HorseRacingOddsService.js
  * Service for fetching and managing horse racing odds data
  */
  import oddsService from './Odds
  ```

- **services/MlbOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * MlbOddsService.js
  * Service for fetching and managing MLB odds data
  */
  import oddsService from './OddsService';
  ```

- **services/NbaOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * NbaOddsService.js
  * Service for fetching and managing NBA odds data
  */
  import oddsService from './OddsService';
  ```

- **services/NcaaOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * NcaaOddsService.js
  * Service for fetching and managing NCAA basketball odds data
  */
  import oddsService from './O
  ```

- **services/NhlOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * NhlOddsService.js
  * Service for fetching and managing NHL odds data
  */
  import oddsService from './OddsService';
  ```

- **services/OddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * OddsService.js
  * Service for fetching and managing sports odds data
  */
  import axios from 'axios';
  import api
  ```

- **services/SoccerOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * SoccerOddsService.js
  * Service for fetching and managing soccer odds data
  */
  import oddsService from './OddsServic
  ```

- **services/UfcOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * UfcOddsService.js
  * Service for fetching and managing UFC odds data
  */
  import oddsService from './OddsService';
  ```

- **services/WnbaOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * WnbaOddsService.js
  * Service for fetching and managing WNBA odds data
  */
  import oddsService from './OddsService'
  ```

- **services/apiService.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  etAuthHeaders = async (method: string = 'GET'): Promise<Record<string, string>> => {
  console.log(`apiService: Getting auth headers for ${method} request`);
  info(LogCategory.API, 'Getting authentication head
  ```

- **services/batchLoadingService.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  rvice, CacheStrategy } from './enhancedCacheService';
  import { OptimizedUserData } from './optimizedUserService';
  // Import Firebase services
  import * as firebaseConfig from '../config/firebase';
  // Get Fireba
  ```

- **services/formula1Service.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  } from './firebaseSubscriptionService';
  import { shouldUseMockData, logMockDataUsage } from './mockDataService';
  /**
  * Formula 1 race data interface
  */
  export interface Formula1Race {
  id: string;
  name: s
  ```

- **services/index.js**: Uses existing API services that could be updated to use the new apiService
  ```
  /**
  * Services index file
  * Exports all services for easy importing
  */
  // Odds Services
  import oddsService from './OddsService';
  import nbaOddsService from './NbaOddsService';
  import wnbaOddsService from '.
  ```

- **services/index.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  rt * from './referralNotificationService';
  export * from './rewardsService';
  export * from './sportsDataService';
  export * from './sportsNewsService';
  export * from './subscriptionAnalyticsService';
  export * fro
  ```

- **services/microtransactionService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  '../config/affiliateConfig';
  import { fanduelCookieService } from './fanduelCookieService';
  import apiService from './apiService';
  import { auth } from '../config/firebase';
  // Storage keys
  const STORAGE_KEYS
  ```

- **services/optimizedUserService.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  ID
  const uid = userId || getCurrentUserId();
  if (!uid) {
  console.warn('optimizedUserService: No user ID provided or user not authenticated');
  return null;
  }
  // Cache key
  ```

- **services/parlayOddsService.js**: Uses existing API services that could be updated to use the new apiService
  ```
  st ACCESS_DURATIONS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  };
  class ParlayOddsService {
  constructor() {
  this.cache = {};
  this.lastFetchTime = null;
  this.accessRights = {};
  ```

- **services/parlayOddsService.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  } else {
  return `${odds}`;
  }
  };
  // Define the type for the service
  export interface ParlayOddsService {
  calculateParlayOdds: typeof calculateParlayOdds;
  americanToDecimal: typeof americanToDecimal;
  ```

- **services/sportsDataService.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  0 * 1000;
  // Cache storage
  interface CacheItem<T> {
  data: T;
  timestamp: number;
  }
  class SportsDataService {
  private leaguesCache: CacheItem<League[]> | null = null;
  private teamsCache: Map<string, Cach
  ```

- **services/userService.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  port const updateUserProfile = async (userId: string, data: any): Promise<void> => {
  console.log(`userService: Updating profile for user ${userId}`);
  try {
  // Validate inputs
  if (!userId) {
  ```

- **hooks/useAuth.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  } from 'firebase/auth';
  import { updateUserProfile as updateUserProfileService } from '../services/userService';
  import { info, error as logError, LogCategory } from '../services/loggingService';
  import { safeE
  ```

- **atomic/organisms/api/apiService.ts**: Uses existing API services that could be updated to use the new apiService
  ```
  etAuthHeaders = async (method: string = 'GET'): Promise<Record<string, string>> => {
  console.log(`apiService: Getting auth headers for ${method} request`);
  info(LogCategory.API, 'Getting authentication head
  ```

- **atomic/organisms/api/index.js**: Uses existing API services that could be updated to use the new apiService
  ```
  * API Module
  *
  * This module exports API-related functionality for the application.
  */
  import apiService from './apiService';
  export { apiService };
  export default apiService;
  ```

- **atomic/organisms/index.js**: Uses existing API services that could be updated to use the new apiService
  ```
  from './themeProvider';
  export { default as privacyService } from './privacy';
  export { default as apiService } from './api';
  ```

## Integration Recommendations

### ThemeToggle Component

1. Add the ThemeToggle component to the SettingsScreen or create a dedicated AppearanceScreen
2. Update components using theme-related styling to use the theme context
3. Consider adding a theme toggle to the app's header or navigation drawer

### Enhanced API Service

1. Replace direct API calls with the new apiService
2. Update existing API services to use the new apiService internally
3. Add cache invalidation after data mutations (POST, PUT, DELETE operations)
4. Configure cache TTL for different endpoints based on data update frequency

