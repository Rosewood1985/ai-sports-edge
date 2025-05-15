# Firebase Migration Report

Generated on 5/9/2025, 9:04:32 PM

This report identifies files that need to be migrated to use the consolidated firebaseService.

## Files to Migrate (227)

- src/config/firebase.js
- src/config/firebase.ts
- src/contexts/ThemeContext.tsx
- src/firebase/auth.js
- src/firebase/config.js
- src/firebase/examples/AuthExample.js
- src/firebase/examples/FirestoreExample.js
- src/firebase/firestore.js
- src/firebase/index.js
- src/firebase-auth.js
- src/i18n/index.ts
- src/navigation/AppRoutes.js
- src/screens/AIPickOfDayScreen.tsx
- src/screens/LeaderboardScreen.tsx
- src/services/aiPickSelector.ts
- src/services/firebase.ts
- src/services/firebaseService.ts
- src/utils/lazyLoad.js
- components/AccessibleText.tsx
- components/AccessibleView.tsx
- components/AutoResubscribeToggle.tsx
- components/BankrollManagementCard.tsx
- components/BettingAnalytics.tsx
- components/BubbleChart.tsx
- components/ChartTransition.tsx
- components/DailyFreePick.tsx
- components/EnhancedPlayerStatistics.tsx
- components/ExternalLink.tsx
- components/FavoritePlayerPicker.tsx
- components/FreemiumFeature.tsx
- components/Header.tsx
- components/HeatMapChart.tsx
- components/HistoricalTrendsChart.tsx
- components/LeagueFilters.tsx
- components/LocalTeamOdds.tsx
- components/NearbyVenues.tsx
- components/NeonGameCard.tsx
- components/NetworkStatusIndicator.tsx
- components/OddsComparisonComponent.tsx
- components/OfflineAwareView.tsx
- components/OneSignalProvider.tsx
- components/ParallaxScrollView.tsx
- components/ParlayCard.tsx
- components/ParlayOddsCard.tsx
- components/PersonalizationSettings.tsx
- components/PremiumFeature.tsx
- components/PropBetList.tsx
- components/QuestionSubmissionForm.tsx
- components/ReferralBadge.tsx
- components/ReferralLeaderboard.tsx
- components/ReferralMilestoneProgress.tsx
- components/ReferralNotification.tsx
- components/ReferralNotificationList.tsx
- components/ReferralPrivacySettings.tsx
- components/ReferralProgramCard.tsx
- components/ReferralRewards.tsx
- components/ReferralShareOptions.tsx
- components/RichNotification.tsx
- components/SEOMetadata.tsx
- components/TabTransition.tsx
- components/UIThemeProvider.tsx
- components/UpgradePrompt.tsx
- components/ViewLimitIndicator.tsx
- components/ml-sports-edge/ValueBetsCard.tsx
- components/search/SearchBar.tsx
- components/search/SearchResults.tsx
- components/ui/TabBarBackground.tsx
- screens/AccessibilitySettingsScreen.tsx
- screens/AdvancedPlayerStatsScreen.tsx
- screens/AnalyticsDashboardScreen.tsx
- screens/Auth/ForgotPasswordScreen.tsx
- screens/Auth/LoginScreen.tsx
- screens/Auth/SignupScreen.tsx
- screens/AuthScreen.tsx
- screens/EnhancedAnalyticsDashboardScreen.tsx
- screens/FAQModerationScreen.tsx
- screens/FAQScreen.tsx
- screens/FightDetailScreen.tsx
- screens/Formula1Screen.tsx
- screens/FraudDetectionDashboardScreen.tsx
- screens/GameDetailScreen.tsx
- screens/GamesScreen.tsx
- screens/GiftRedemptionScreen.tsx
- screens/GiftSubscriptionScreen.tsx
- screens/GroupSubscriptionScreen.tsx
- screens/HorseRacingScreen.tsx
- screens/LeaderboardScreen.tsx
- screens/LeagueSelectionScreen.tsx
- screens/LegalScreen.tsx
- screens/LocationNotificationSettings.js
- screens/LoginScreen.tsx
- screens/NcaaBasketballScreen.tsx
- screens/NearbyVenuesScreen.tsx
- screens/NeonLoginScreen.tsx
- screens/NeonOddsScreen.tsx
- screens/NotificationSettingsScreen.tsx
- screens/OddsComparisonScreen.tsx
- screens/OddsScreen.tsx
- screens/OfflineSettingsScreen.tsx
- screens/Onboarding/CookieConsentScreen.tsx
- screens/Onboarding/LiabilityWaiverScreen.tsx
- screens/Onboarding/PreferencesScreen.tsx
- screens/Onboarding/ProfileSetupScreen.tsx
- screens/OnboardingScreen.tsx
- screens/ParlayScreen.tsx
- screens/PaymentScreen.tsx
- screens/PersonalizationScreen.tsx
- screens/PersonalizedHomeScreen.tsx
- screens/PlayerStatsScreen.tsx
- screens/ProfileScreen.tsx
- screens/PurchaseHistoryScreen.tsx
- screens/RedeemGiftScreen.tsx
- screens/ReferralLeaderboardScreen.tsx
- screens/ReferralNotificationsScreen.tsx
- screens/ReferralRewardsScreen.tsx
- screens/RefundPolicyScreen.tsx
- screens/RewardsScreen.tsx
- screens/SearchScreen.tsx
- screens/SettingsScreen.tsx
- screens/SportsNewsScreen.tsx
- screens/StatsScreen.tsx
- screens/SubscriptionAnalyticsScreen.tsx
- screens/SubscriptionManagementScreen.tsx
- screens/SubscriptionScreen.tsx
- screens/UFCScreen.tsx
- hooks/useAccessibilityService.ts
- hooks/useAuth.ts
- hooks/useOddsData.ts
- hooks/useSearch.ts
- hooks/useThemeColor.ts
- utils/analyticsService.js
- utils/dataMigrationUtils.ts
- utils/db.ts
- utils/environmentUtils.ts
- utils/errorHandling.ts
- utils/errorHandlingUtils.js
- utils/firebaseCacheConfig.ts
- utils/firebaseTest.ts
- utils/geoip/index.js
- utils/geoip-temp/app.js
- utils/parser.js
- utils/referralABTesting.ts
- utils/responsiveImageLoader.ts
- utils/userPreferencesService.js
- services/FanDuelService.js
- services/abTestingService.ts
- services/accessibilityService.ts
- services/advancedPlayerStatsService.ts
- services/aiNewsAnalysisService.ts
- services/aiPickSelector.ts
- services/aiPredictionService.ts
- services/aiSummaryService.ts
- services/analyticsService.d.ts
- services/analyticsService.js
- services/analyticsService.ts
- services/apiService.ts
- services/bankrollManagementService.ts
- services/batchLoadingService.ts
- services/bettingAffiliateService.ts
- services/bettingAnalyticsService.ts
- services/bettingSlipImportService.ts
- services/bugReportingService.ts
- services/cacheService.ts
- services/claudeOptimizationService.ts
- services/cricketService.ts
- services/crossPlatformSyncService.ts
- services/crossPlatformSyncService.tsx
- services/dataExportService.ts
- services/dataSyncService.ts
- services/deepLinkingService.ts
- services/enhancedAnalyticsService.ts
- services/enhancedCacheService.ts
- services/errorRecoveryService.ts
- services/faqService.ts
- services/featureTourService.ts
- services/feedbackService.ts
- services/firebaseMonitoringService.ts
- services/firebaseService.ts
- services/firebaseSubscriptionService.ts
- services/formula1Service.ts
- services/fraudDetectionService.ts
- services/gameUrlService.ts
- services/geolocationService.js
- services/geolocationService.ts
- services/groupSubscriptionService.ts
- services/helpCenterService.ts
- services/horseRacingService.ts
- services/index.ts
- services/licenseVerificationService.ts
- services/loggingService.ts
- services/microtransactionService.js
- services/mlPredictionService.ts
- services/mockDataService.ts
- services/nascarService.ts
- services/ncaaBasketballService.ts
- services/notificationService.ts
- services/oddsCacheService.ts
- services/offlineQueueService.ts
- services/offlineService.ts
- services/optimizedUserService.ts
- services/parlayOddsService.ts
- services/parlayService.ts
- services/personalizationService.ts
- services/playerStatsService.ts
- services/playersService.js
- services/pushNotificationService.ts
- services/referralNotificationService.ts
- services/revenueReportingService.ts
- services/rewardsService.ts
- services/rssAnalyticsService.js
- services/rugbyService.ts
- services/searchService.js
- services/searchService.ts
- services/sportsDataService.ts
- services/stripeTaxService.js
- services/stripeTaxService.ts
- services/subscriptionAnalyticsService.ts
- services/subscriptionService.ts
- services/teamsService.js
- services/ufcService.ts
- services/userPreferencesService.js
- services/userPreferencesService.ts
- services/userService.ts
- services/userSportsPreferencesService.ts
- services/venueService.ts
- services/viewCounterService.ts
- services/weatherService.ts

## Import Patterns

- /import.*from ['"]firebase\/app['"]/: 10 occurrences
- /import.*from ['"]firebase\/auth['"]/: 18 occurrences
- /import.*from ['"]firebase\/firestore['"]/: 31 occurrences
- /import.*from ['"]firebase\/storage['"]/: 2 occurrences
- /import.*from ['"]firebase\/functions['"]/: 9 occurrences
- /import.*from ['"]firebase\/analytics['"]/: 2 occurrences
- /import.*from ['"]\.\.\/config\/firebase['"]/: 93 occurrences

## Initialization Patterns

- /initializeApp\(/: 5 occurrences
- /getAuth\(/: 15 occurrences
- /getFirestore\(/: 16 occurrences
- /getStorage\(/: 3 occurrences
- /getFunctions\(/: 6 occurrences
- /getAnalytics\(/: 3 occurrences

## Service Usage Patterns

- /ref/: 1541 occurrences
- /auth\.[a-zA-Z]+/: 173 occurrences
- /signInWithEmailAndPassword/: 14 occurrences
- /createUserWithEmailAndPassword/: 14 occurrences
- /signOut/: 8 occurrences
- /onAuthStateChanged/: 17 occurrences
- /doc/: 556 occurrences
- /getDoc/: 169 occurrences
- /updateDoc/: 60 occurrences
- /deleteDoc/: 18 occurrences
- /query/: 347 occurrences
- /collection/: 254 occurrences
- /setDoc/: 51 occurrences
- /where/: 172 occurrences
- /orderBy/: 53 occurrences
- /limit/: 211 occurrences
- /startAfter/: 7 occurrences
- /uploadBytes/: 2 occurrences
- /getDownloadURL/: 2 occurrences
- /deleteObject/: 2 occurrences
- /httpsCallable/: 37 occurrences
- /logEvent/: 10 occurrences
- /setUserProperties/: 4 occurrences
- /analytics\.[a-zA-Z]+/: 71 occurrences
- /firestore\.[a-zA-Z]+/: 2 occurrences
- /functions\.[a-zA-Z]+/: 14 occurrences
- /storage\.[a-zA-Z]+/: 1 occurrences

## Migration Guide for src/config/firebase.js

### Current Imports

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
```

### Migration

Remove these initializations and use the firebaseService instead.


## Migration Guide for src/config/firebase.ts

### Current Imports

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);
```

### Migration

Remove these initializations and use the firebaseService instead.


## Migration Guide for src/contexts/ThemeContext.tsx

### Current Service Usage

```javascript
// Storage key for theme preference
// Load saved theme preference on mount
const loadThemePreference = async () => {
// Use system preference if no saved preference
console.error('Error loading theme preference:', error);
loadThemePreference();
// Save preference
console.error('Error saving theme preference:', error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for src/firebase/auth.js

### Current Service Usage

```javascript
return auth.currentUser;
signInWithEmailAndPassword,
const userCredential = await signInWithEmailAndPassword(auth, email, password);
createUserWithEmailAndPassword,
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
signOut,
await signOut(auth);
onAuthStateChanged,
return onAuthStateChanged(auth, callback);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signInWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signIn(email, password)

// Replace:
createUserWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signUp(email, password)

// Replace:
signOut(auth)
// With:
firebaseService.signOut()

// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for src/firebase/config.js

### Current Imports

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
analytics = getAnalytics(app);
```

### Migration

Remove these initializations and use the firebaseService instead.


## Migration Guide for src/firebase/examples/AuthExample.js

### Current Service Usage

```javascript
* This is for reference only and not intended for production use
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for src/firebase/examples/FirestoreExample.js

### Current Service Usage

```javascript
setNotes(result.documents);
setNotes(result.documents);
getDocument,
updateDocument,
const result = await updateDocument(COLLECTION_NAME, selectedNote.id, {
const result = await updateDocument(COLLECTION_NAME, noteId, {
deleteDocument,
const result = await deleteDocument(COLLECTION_NAME, noteId);
queryDocuments,
const result = await queryDocuments(
* This is for reference only and not intended for production use
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');
```

## Migration Guide for src/firebase/firestore.js

### Current Service Usage

```javascript
collection,
* Create a document in a collection
* @param {string} collectionName - The name of the collection
export const createDocument = async (collectionName, data) => {
const collectionRef = collection(firestore, collectionName);
const docRef = await addDoc(collectionRef, {
console.error(`Error creating document in ${collectionName}:`, error);
* @param {string} collectionName - The name of the collection
export const createDocumentWithId = async (collectionName, documentId, data) => {
const docRef = doc(firestore, collectionName, documentId);
console.error(`Error creating document with ID in ${collectionName}:`, error);
* @param {string} collectionName - The name of the collection
export const getDocument = async (collectionName, documentId) => {
const docRef = doc(firestore, collectionName, documentId);
console.error(`Error getting document from ${collectionName}:`, error);
* @param {string} collectionName - The name of the collection
export const updateDocument = async (collectionName, documentId, data) => {
const docRef = doc(firestore, collectionName, documentId);
console.error(`Error updating document in ${collectionName}:`, error);
* @param {string} collectionName - The name of the collection
export const deleteDocument = async (collectionName, documentId) => {
const docRef = doc(firestore, collectionName, documentId);
console.error(`Error deleting document from ${collectionName}:`, error);
* Query documents in a collection
* @param {string} collectionName - The name of the collection
collectionName,
let collectionRef = collection(firestore, collectionName);
const q = query(collectionRef, ...queryConstraints);
console.error(`Error querying documents in ${collectionName}:`, error);
* @param {string} collectionName - The name of the collection
export const subscribeToDocument = (collectionName, documentId, callback) => {
const docRef = doc(firestore, collectionName, documentId);
console.error(`Error subscribing to document in ${collectionName}:`, error);
* @param {string} collectionName - The name of the collection
collectionName,
let collectionRef = collection(firestore, collectionName);
const q = query(collectionRef, ...queryConstraints);
console.error(`Error subscribing to query in ${collectionName}:`, error);
doc,
* Create a document in a collection
* @returns {Promise<object>} - The document reference and ID
const docRef = await addDoc(collectionRef, {
id: docRef.id,
ref: docRef,
console.error(`Error creating document in ${collectionName}:`, error);
* Create a document with a specific ID
* @param {string} documentId - The ID for the document
export const createDocumentWithId = async (collectionName, documentId, data) => {
const docRef = doc(firestore, collectionName, documentId);
await setDoc(docRef, {
id: documentId,
ref: docRef,
console.error(`Error creating document with ID in ${collectionName}:`, error);
* Get a document by ID
* @param {string} documentId - The ID of the document
* @returns {Promise<object>} - The document data
export const getDocument = async (collectionName, documentId) => {
const docRef = doc(firestore, collectionName, documentId);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
id: documentId,
data: { id: documentId, ...docSnap.data() },
id: documentId,
console.error(`Error getting document from ${collectionName}:`, error);
id: documentId,
* Update a document
* @param {string} documentId - The ID of the document
export const updateDocument = async (collectionName, documentId, data) => {
const docRef = doc(firestore, collectionName, documentId);
await updateDoc(docRef, {
console.error(`Error updating document in ${collectionName}:`, error);
* Delete a document
* @param {string} documentId - The ID of the document
export const deleteDocument = async (collectionName, documentId) => {
const docRef = doc(firestore, collectionName, documentId);
await deleteDoc(docRef);
console.error(`Error deleting document from ${collectionName}:`, error);
* Query documents in a collection
* @param {number} limitCount - Number of documents to limit to
* @returns {Promise<Array>} - Array of documents
const documents = [];
querySnapshot.forEach(doc => {
documents.push({
id: doc.id,
...doc.data()
documents,
count: documents.length,
console.error(`Error querying documents in ${collectionName}:`, error);
documents: [],
* Subscribe to real-time updates on a document
* @param {string} documentId - The ID of the document
export const subscribeToDocument = (collectionName, documentId, callback) => {
const docRef = doc(firestore, collectionName, documentId);
return onSnapshot(docRef, (doc) => {
if (doc.exists()) {
id: documentId,
data: { id: documentId, ...doc.data() },
id: documentId,
console.error(`Error subscribing to document in ${collectionName}:`, error);
id: documentId,
* @param {number} limitCount - Number of documents to limit to
const documents = [];
querySnapshot.forEach(doc => {
documents.push({
id: doc.id,
...doc.data()
documents,
count: documents.length,
documents: [],
getDoc,
getDocs,
export const getDocument = async (collectionName, documentId) => {
const docSnap = await getDoc(docRef);
const querySnapshot = await getDocs(q);
setDoc,
await setDoc(docRef, {
updateDoc,
export const updateDocument = async (collectionName, documentId, data) => {
await updateDoc(docRef, {
deleteDoc,
export const deleteDocument = async (collectionName, documentId) => {
await deleteDoc(docRef);
query,
export const queryDocuments = async (
let queryConstraints = [];
queryConstraints.push(where(condition.field, condition.operator, condition.value));
queryConstraints.push(orderBy(order.field, order.direction || 'asc'));
queryConstraints.push(limit(limitCount));
queryConstraints.push(startAfter(startAfterDoc));
const q = query(collectionRef, ...queryConstraints);
const querySnapshot = await getDocs(q);
querySnapshot.forEach(doc => {
console.error(`Error querying documents in ${collectionName}:`, error);
* Subscribe to real-time updates on a query
let queryConstraints = [];
queryConstraints.push(where(condition.field, condition.operator, condition.value));
queryConstraints.push(orderBy(order.field, order.direction || 'asc'));
queryConstraints.push(limit(limitCount));
const q = query(collectionRef, ...queryConstraints);
return onSnapshot(q, (querySnapshot) => {
querySnapshot.forEach(doc => {
console.error(`Error subscribing to query in ${collectionName}:`, error);
where,
// Add where conditions
queryConstraints.push(where(condition.field, condition.operator, condition.value));
// Add where conditions
queryConstraints.push(where(condition.field, condition.operator, condition.value));
orderBy,
* @param {Array} orderByFields - Array of objects: { field, direction }
orderByFields = [],
// Add orderBy
orderByFields.forEach(order => {
queryConstraints.push(orderBy(order.field, order.direction || 'asc'));
* @param {Array} orderByFields - Array of objects: { field, direction }
orderByFields = [],
// Add orderBy
orderByFields.forEach(order => {
queryConstraints.push(orderBy(order.field, order.direction || 'asc'));
limit,
* @param {number} limitCount - Number of documents to limit to
limitCount = 0,
// Add limit
if (limitCount > 0) {
queryConstraints.push(limit(limitCount));
* @param {number} limitCount - Number of documents to limit to
limitCount = 0,
// Add limit
if (limitCount > 0) {
queryConstraints.push(limit(limitCount));
startAfter,
* @param {object} startAfterDoc - Document to start after for pagination
startAfterDoc = null
// Add startAfter for pagination
if (startAfterDoc) {
queryConstraints.push(startAfter(startAfterDoc));
* @returns {Promise<object>} - The document reference and ID
ref: docRef,
ref: null,
ref: docRef,
ref: null,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');
```

## Migration Guide for src/firebase/index.js

### Current Service Usage

```javascript
// Export examples (for development and reference only)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for src/firebase-auth.js

### Current Imports

```javascript
import { initializeApp } from "firebase/app";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
return auth.currentUser;
signInWithEmailAndPassword,
const userCredential = await signInWithEmailAndPassword(auth, email, password);
createUserWithEmailAndPassword,
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
signOut,
await signOut(auth);
onAuthStateChanged,
return onAuthStateChanged(auth, callback);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signInWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signIn(email, password)

// Replace:
createUserWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signUp(email, password)

// Replace:
signOut(auth)
// With:
firebaseService.signOut()

// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for src/i18n/index.ts

### Current Service Usage

```javascript
// Function to get the user's preferred language
// Check if user has a saved language preference
// Function to set the user's preferred language
// Save preference
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for src/navigation/AppRoutes.js

### Current Service Usage

```javascript
'/onboarding/preferences': () => import('../screens/Onboarding/PreferencesScreen'),
<Route path="/onboarding/preferences" element={routes['/onboarding/preferences'].component()} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for src/screens/AIPickOfDayScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
if (auth.currentUser) {
const userId = auth.currentUser.uid;
if (!auth.currentUser) {
const userId = auth.currentUser.uid;
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
refreshControl={
<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for src/screens/LeaderboardScreen.tsx

### Current Imports

```javascript
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
collection,
collection(firestore, 'predictions'),
querySnapshot.docs.forEach((doc, index) => {
const data = doc.data();
id: doc.id,
getDocs,
const querySnapshot = await getDocs(predictionsQuery);
query,
// Build query
let predictionsQuery = query(
predictionsQuery = query(
predictionsQuery = query(
predictionsQuery = query(
predictionsQuery = query(
// Execute query
const querySnapshot = await getDocs(predictionsQuery);
querySnapshot.docs.forEach((doc, index) => {
where,
where('date', '>=', startTimestamp),
where('date', '<=', endTimestamp),
where('result', 'in', ['win', 'loss']) // Only include completed predictions
where('sport', '==', selectedSport)
orderBy,
orderBy('confidence', 'desc')
orderBy('date', 'desc')
limit,
limit(50)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for src/services/aiPickSelector.ts

### Current Imports

```javascript
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
const gamesRef = collection(firestore, 'games');
const userPicksRef = collection(firestore, 'userPicks');
// Add to userPicks collection
// await addDoc(collection(firestore, 'userPicks'), {
// Remove from userPicks collection
// const userPicksRef = collection(firestore, 'userPicks');
const games = gamesSnapshot.docs.map((doc) => ({
gameId: doc.id,
...doc.data(),
//   userPickSnapshot.docs.forEach(doc => {
//     batch.delete(doc.ref);
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
const gamesSnapshot = await getDocs(gamesQuery);
const userPickSnapshot = await getDocs(userPickQuery);
// const userPickSnapshot = await getDocs(userPickQuery);
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
const gamesQuery = query(
const userPickQuery = query(
// const userPickQuery = query(
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
where('startTime', '>=', todayTimestamp),
where('startTime', '<', tomorrowTimestamp),
where('aiConfidence', '>', 0) // Only games with predictions
where('userId', '==', userId),
where('pickId', '==', gameId)
//   where('userId', '==', userId),
//   where('pickId', '==', gameId)
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
* @param limit Maximum number of picks to return
//     batch.delete(doc.ref);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for src/services/firebase.ts

### Current Imports

```javascript
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```


## Migration Guide for src/services/firebaseService.ts

### Current Imports

```javascript
import { initializeApp, FirebaseApp, FirebaseError } from 'firebase/app';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
app = initializeApp(firebaseConfig);
authInstance = getAuth(app);
firestoreInstance = getFirestore(app);
storageInstance = getStorage(app);
functionsInstance = getFunctions(app);
analyticsInstance = getAnalytics(app);
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
signInWithEmailAndPassword,
signInWithEmailAndPassword(getAuthInstance(), email, password),
createUserWithEmailAndPassword,
createUserWithEmailAndPassword(getAuthInstance(), email, password),
signOut,
signOut: () => signOut(getAuthInstance()),
onAuthStateChanged,
onAuthStateChanged(getAuthInstance(), callback),
collection,
getDocument: async <T>(collectionName: string, docId: string): Promise<T | null> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
setDocument: async <T>(collectionName: string, docId: string, data: T): Promise<void> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
updateDocument: async <T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
deleteDocument: async (collectionName: string, docId: string): Promise<void> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
doc,
getDocument: async <T>(collectionName: string, docId: string): Promise<T | null> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
return { id: docSnap.id, ...docSnap.data() } as T;
console.error(`Error getting document ${docId}:`, error);
setDocument: async <T>(collectionName: string, docId: string, data: T): Promise<void> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
await setDoc(docRef, {
console.error(`Error setting document ${docId}:`, error);
updateDocument: async <T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
await updateDoc(docRef, {
console.error(`Error updating document ${docId}:`, error);
deleteDocument: async (collectionName: string, docId: string): Promise<void> => {
const docRef = doc(getFirestoreInstance(), collectionName, docId);
await deleteDoc(docRef);
console.error(`Error deleting document ${docId}:`, error);
getDoc,
getDocs,
getDocument: async <T>(collectionName: string, docId: string): Promise<T | null> => {
const docSnap = await getDoc(docRef);
setDoc,
setDocument: async <T>(collectionName: string, docId: string, data: T): Promise<void> => {
await setDoc(docRef, {
updateDoc,
updateDocument: async <T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> => {
await updateDoc(docRef, {
deleteDoc,
deleteDocument: async (collectionName: string, docId: string): Promise<void> => {
await deleteDoc(docRef);
query,
where,
orderBy,
limit,
startAfter,
ref,
const storageRef = ref(getStorageInstance(), path);
const storageRef = ref(getStorageInstance(), path);
uploadBytes,
await uploadBytes(storageRef, file);
getDownloadURL,
return await getDownloadURL(storageRef);
deleteObject
await deleteObject(storageRef);
httpsCallable
const functionRef = httpsCallable<T, R>(getFunctionsInstance(), functionName);
logEvent,
logEvent: () => {},
logEvent(getAnalyticsInstance(), eventName, eventParams);
setUserProperties
setUserProperties: () => {}
setUserProperties(getAnalyticsInstance(), properties);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signInWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signIn(email, password)

// Replace:
createUserWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signUp(email, password)

// Replace:
signOut(auth)
// With:
firebaseService.signOut()

// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');

// Replace:
const storageRef = ref(storage, path);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
// With:
const url = await firebaseService.uploadFile(path, file);

// Replace:
const storageRef = ref(storage, path);
await deleteObject(storageRef);
// With:
await firebaseService.deleteFile(path);

// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);

// Replace:
logEvent(analytics, eventName, eventParams);
// With:
firebaseService.logAnalyticsEvent(eventName, eventParams);
```

## Migration Guide for src/utils/lazyLoad.js

### Current Service Usage

```javascript
// Add the spin animation to the document
if (typeof document !== 'undefined') {
const styleSheet = document.createElement('style');
document.head.appendChild(styleSheet);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/AccessibleText.tsx

### Current Service Usage

```javascript
import accessibilityService, { AccessibilityPreferences } from '../services/accessibilityService';
const [preferences, setPreferences] = useState<AccessibilityPreferences>(
accessibilityService.getPreferences()
const unsubscribe = accessibilityService.addListener((newPreferences) => {
setPreferences(newPreferences);
preferences.highContrast || accessibilityService.isHighContrastActive()
const shouldApplyLargeText = applyLargeText && preferences.largeText;
preferences.boldText || accessibilityService.isBoldTextActive()
// Apply styles based on preferences
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/AccessibleView.tsx

### Current Service Usage

```javascript
import accessibilityService, { AccessibilityPreferences } from '../services/accessibilityService';
const [preferences, setPreferences] = useState<AccessibilityPreferences>(
accessibilityService.getPreferences()
const unsubscribe = accessibilityService.addListener((newPreferences) => {
setPreferences(newPreferences);
preferences.highContrast || accessibilityService.isHighContrastActive()
preferences.reduceMotion || accessibilityService.isReduceMotionActive()
* Get accessible text style based on preferences
// Get preferences
accessibilityService.getPreferences().highContrast;
const isLargeText = accessibilityService.getPreferences().largeText;
accessibilityService.getPreferences().boldText;
// Apply styles based on preferences
* Get accessible animation config based on preferences
accessibilityService.getPreferences().reduceMotion;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/AutoResubscribeToggle.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/BankrollManagementCard.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = auth.currentUser;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/BettingAnalytics.tsx

### Current Service Usage

```javascript
Total Bets: ${analytics.totalBets}
Win Rate: ${formatPercentage(analytics.winRate)}
Total Wagered: ${formatCurrency(analytics.totalWagered)}
Total Winnings: ${formatCurrency(analytics.totalWinnings)}
Net Profit: ${formatCurrency(analytics.netProfit)}
ROI: ${formatPercentage(analytics.roi)}
Current Streak: ${analytics.streaks.currentStreak.count} ${analytics.streaks.currentStreak.type}(s)
Longest Win Streak: ${analytics.streaks.longestWinStreak}
Longest Loss Streak: ${analytics.streaks.longestLossStreak}
if (!analytics || analytics.totalBets === 0) {
<ThemedText style={styles.summaryValue}>{analytics.totalBets}</ThemedText>
<ThemedText style={styles.summaryValue}>{formatPercentage(analytics.winRate)}</ThemedText>
<ThemedText style={styles.summaryValue}>{formatCurrency(analytics.totalWagered)}</ThemedText>
<ThemedText style={styles.summaryValue}>{formatCurrency(analytics.totalWinnings)}</ThemedText>
{ color: getValueColor(analytics.netProfit) }
{formatCurrency(analytics.netProfit)}
{ color: getValueColor(analytics.roi) }
{formatPercentage(analytics.roi)}
{analytics.recentForm.length > 0 ? (
{analytics.recentForm.map((result, index) => (
{getBetResultIcon(analytics.streaks.currentStreak.type)}
{analytics.streaks.currentStreak.count} {analytics.streaks.currentStreak.type}
{analytics.streaks.currentStreak.count !== 1 ? 's' : ''}
<ThemedText style={styles.streakItemValue}>{analytics.streaks.longestWinStreak}</ThemedText>
<ThemedText style={styles.streakItemValue}>{analytics.streaks.longestLossStreak}</ThemedText>
{Object.entries(analytics.betTypeBreakdown).length > 0 ? (
Object.entries(analytics.betTypeBreakdown).map(([betType, data]) => (
{analytics.mostBetSport ? (
<ThemedText style={styles.mostBetValue}>{analytics.mostBetSport.sport}</ThemedText>
{analytics.mostBetSport.count} bet{analytics.mostBetSport.count !== 1 ? 's' : ''}
{analytics.mostBetTeam ? (
<ThemedText style={styles.mostBetValue}>{analytics.mostBetTeam.teamName}</ThemedText>
{analytics.mostBetTeam.count} bet{analytics.mostBetTeam.count !== 1 ? 's' : ''}
{analytics.bestBet ? (
<ThemedText style={styles.bestWorstTeam}>{analytics.bestBet.teamName}</ThemedText>
{formatCurrency(analytics.bestBet.amount)}
+{formatCurrency((analytics.bestBet.potentialWinnings || 0) - analytics.bestBet.amount)}
{analytics.worstBet ? (
<ThemedText style={styles.bestWorstTeam}>{analytics.worstBet.teamName}</ThemedText>
{formatCurrency(analytics.worstBet.amount)}
-{formatCurrency(analytics.worstBet.amount)}
* Handle refresh button press
<TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
<ThemedText style={styles.refreshButtonText}>Try Again</ThemedText>
<Ionicons name="refresh" size={24} color="#4080ff" />
refreshButton: {
refreshButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/BubbleChart.tsx

### Current Service Usage

```javascript
// Handle case where all values are the same
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ChartTransition.tsx

### Current Service Usage

```javascript
// Get accessibility preferences
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/DailyFreePick.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
<Text style={styles.buttonText}>Upgrade for Unlimited Picks</Text>
<Text style={styles.buttonText}>Upgrade for Unlimited Picks</Text>
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/EnhancedPlayerStatistics.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const currentUserId = auth.currentUser?.uid || userId;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ExternalLink.tsx

### Current Service Usage

```javascript
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };
export function ExternalLink({ href, ...rest }: Props) {
href={href}
await openBrowserAsync(href);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/FavoritePlayerPicker.tsx

### Current Service Usage

```javascript
const searchPlayers = async (query: string) => {
if (!query.trim()) {
const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}${sportFilter}`);
const { preferences, updatePreferences } = usePersonalization();
// Load favorite players from preferences
if (preferences.favoritePlayers) {
setFavoritePlayers(preferences.favoritePlayers);
}, [preferences.favoritePlayers]);
// Update preferences
updatePreferences({
...preferences,
// Update preferences
updatePreferences({
...preferences,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/FreemiumFeature.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const unsubscribe = auth.onAuthStateChanged((user) => {
const userId = auth.currentUser?.uid;
const unsubscribe = auth.onAuthStateChanged((user) => {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for components/Header.tsx

### Current Service Usage

```javascript
* Header component with title and refresh button, using the centralized theme system
styles.refreshButton,
isLoading && styles.refreshButtonDisabled
accessibilityLabel={t('oddsComparison.refresh')}
accessibilityHint={accessibilityHint || t('oddsComparison.accessibility.refreshButtonHint')}
name="refresh"
style={[styles.refreshIcon, { marginRight: theme.spacing.xs }]}
style={styles.refreshButtonText}
{t('oddsComparison.refresh')}
refreshButton: {
refreshButtonDisabled: {
refreshIcon: {
refreshButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/HeatMapChart.tsx

### Current Service Usage

```javascript
ref={chartRef}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/HistoricalTrendsChart.tsx

### Current Service Usage

```javascript
yAxisPrefix?: string;
yAxisPrefix = '',
yAxisLabel={yAxisPrefix}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/LeagueFilters.tsx

### Current Service Usage

```javascript
<Ionicons name="refresh-outline" size={16} color={colors.primary} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/LocalTeamOdds.tsx

### Current Service Usage

```javascript
* Handle refresh button press
<TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
<ThemedText style={styles.refreshButtonText}>Try Again</ThemedText>
<TouchableOpacity style={styles.refreshIcon} onPress={handleRefresh}>
<Ionicons name="refresh" size={24} color="#0a7ea4" />
refreshIcon: {
refreshButton: {
refreshButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/NearbyVenues.tsx

### Current Service Usage

```javascript
const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
limit?: number;
limit = 5,
}, [maxDistance, limit]);
const nearbyVenues = await venueService.getNearbyVenues(location, maxDistance, limit);
* Handle refresh button press
<TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
<ThemedText style={styles.refreshButtonText}>Try Again</ThemedText>
<TouchableOpacity style={styles.refreshIcon} onPress={handleRefresh}>
<Ionicons name="refresh" size={24} color="#0a7ea4" />
refreshIcon: {
refreshButton: {
refreshButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/NeonGameCard.tsx

### Current Service Usage

```javascript
// Use theme constants in StyleSheet where possible
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/NetworkStatusIndicator.tsx

### Current Service Usage

```javascript
style={styles.refreshButton}
<ThemedText style={styles.refreshButtonText}>Refresh Status</ThemedText>
refreshButton: {
refreshButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/OddsComparisonComponent.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const currentUser = auth.currentUser;
const currentUserId = userId || auth.currentUser?.uid;
if (result.error.message.includes('rate limit')) {
setError('Rate limit exceeded. Please try again in a few minutes.');
const OddsComparisonComponent = forwardRef<OddsComparisonComponentRef, OddsComparisonComponentProps>(({ isPremium = false }, ref) => {
// Get personalization preferences
const { preferences } = usePersonalization();
// Use default sport from preferences if available
preferences.defaultSport || 'basketball_nba'
// Track analytics event for odds refresh
// Expose the refresh method to parent components
useImperativeHandle(ref, () => ({
// Animation references for cleanup
accessibilityLabel={t('oddsComparison.accessibility.refreshButton')}
accessibilityHint={t('oddsComparison.accessibility.refreshButtonHint')}
<Text style={styles.retryButtonText}>{t('oddsComparison.refresh')}</Text>
if (!preferences.defaultSportsbook && sportsbook) {
style={styles.refreshButton}
<Ionicons name="refresh" size={20} color={colors.primary} />
refreshButton: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/OfflineAwareView.tsx

### Current Service Usage

```javascript
* @default "You're offline. Some features may be limited."
offlineMessage = "You're offline. Some features may be limited.",
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/OneSignalProvider.tsx

### Current Imports

```javascript
import { getDoc, doc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { getDoc, doc } from 'firebase/firestore';
const userDoc = await getDoc(doc(firestore, 'users', user.uid));
import { getDoc, doc } from 'firebase/firestore';
const userDoc = await getDoc(doc(firestore, 'users', user.uid));
// Set user tags based on preferences
if (userData.preferences) {
// Set sports preferences
if (userData.preferences.sports) {
Object.entries(userData.preferences.sports).forEach(([sport, enabled]) => {
// Set notification preferences
if (userData.preferences.notifications) {
Object.entries(userData.preferences.notifications).forEach(([type, enabled]) => {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for components/ParallaxScrollView.tsx

### Current Service Usage

```javascript
ref={scrollRef}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ParlayCard.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ParlayOddsCard.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/PersonalizationSettings.tsx

### Current Service Usage

```javascript
const { preferences, isLoading, setDefaultSport, setDefaultSportsbook, resetPreferences } = usePersonalization();
// Handle reset preferences
const handleResetPreferences = () => {
t('personalization.alerts.resetPreferences'),
t('personalization.alerts.resetPreferencesMessage'),
await resetPreferences();
t('personalization.alerts.preferencesReset'),
t('personalization.alerts.preferencesResetMessage'),
preferences.defaultSport === sport.key && styles.selectedOption,
backgroundColor: preferences.defaultSport === sport.key
{preferences.defaultSport === sport.key && (
preferences.defaultSportsbook === 'draftkings' && styles.selectedOption,
backgroundColor: preferences.defaultSportsbook === 'draftkings'
{preferences.defaultSportsbook === 'draftkings' && (
preferences.defaultSportsbook === 'fanduel' && styles.selectedOption,
backgroundColor: preferences.defaultSportsbook === 'fanduel'
{preferences.defaultSportsbook === 'fanduel' && (
preferences.defaultSportsbook === null && styles.selectedOption,
backgroundColor: preferences.defaultSportsbook === null
<Text style={[styles.optionText, { color: colors.text }]}>{t('personalization.sportsbooks.noPreference')}</Text>
{preferences.defaultSportsbook === null && (
value={preferences.notificationPreferences?.oddsMovements ?? true}
usePersonalization().setNotificationPreferences({
preferences.notificationPreferences?.oddsMovements
value={preferences.notificationPreferences?.gameStart ?? true}
usePersonalization().setNotificationPreferences({
preferences.notificationPreferences?.gameStart
value={preferences.notificationPreferences?.gameEnd ?? true}
usePersonalization().setNotificationPreferences({
preferences.notificationPreferences?.gameEnd
value={preferences.notificationPreferences?.specialOffers ?? true}
usePersonalization().setNotificationPreferences({
preferences.notificationPreferences?.specialOffers
onPress={handleResetPreferences}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/PremiumFeature.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const unsubscribe = auth.onAuthStateChanged((user) => {
const unsubscribe = auth.onAuthStateChanged((user) => {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for components/PropBetList.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/QuestionSubmissionForm.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userEmail = auth.currentUser?.email || undefined;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralBadge.tsx

### Current Service Usage

```javascript
* ReferralBadge component displays a badge for a referral tier
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralLeaderboard.tsx

### Current Service Usage

```javascript
* ReferralLeaderboard component displays a leaderboard of top referrers
referralCount: 0,
{entry.referralCount}
<Text style={[styles.referralCount, { color: primaryColor }]}>
{item.referralCount}
Start referring friends to appear on the leaderboard
referralCount: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralMilestoneProgress.tsx

### Current Service Usage

```javascript
import { getUserRewardStructure } from '../utils/referralABTesting';
* ReferralMilestoneProgress component displays the user's progress toward referral milestones
{currentReferrals}/{nextMilestone.count} referrals to unlock {nextMilestone.reward.description}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralNotification.tsx

### Current Service Usage

```javascript
type: 'milestone' | 'referral' | 'subscription_extension' | 'badge';
* ReferralNotification component displays a notification for referral rewards
case 'referral':
case 'referral':
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralNotificationList.tsx

### Current Service Usage

```javascript
import { referralNotificationService, ReferralNotification } from '../services/referralNotificationService';
* ReferralNotificationList component displays a list of referral notifications
const notificationData = await referralNotificationService.getNotifications();
await referralNotificationService.markAllAsRead();
await referralNotificationService.markAsRead(notification.id);
case 'referral':
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralPrivacySettings.tsx

### Current Service Usage

```javascript
Show your name and referral count
Hide your name but show referral count
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralProgramCard.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
* ReferralProgramCard component displays the user's referral code and basic stats
const [referralCode, setReferralCode] = useState<string>('');
const [referralCount, setReferralCount] = useState<number>(0);
// Set referral code if it exists
if (rewards?.referralCode) {
setReferralCode(rewards.referralCode);
// Set referral count
setReferralCount(rewards?.referralCount || 0);
console.error('Error loading referral data:', error);
console.error('Error generating referral code:', error);
Alert.alert('Error', 'Failed to generate referral code. Please try again.');
Clipboard.setString(referralCode);
{referralCode ? (
{referralCode}
{referralCount}
Subscribe to generate your own referral code and start earning rewards!
referralCode={referralCode}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralRewards.tsx

### Current Service Usage

```javascript
* ReferralRewards component displays the rewards that users can earn through referrals
{currentReferrals}/{milestone.count} referrals
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ReferralShareOptions.tsx

### Current Service Usage

```javascript
referralCode: string;
* ReferralShareOptions component displays options for sharing a referral code
referralCode,
const baseMessage = `Join me on AI Sports Edge and get exclusive rewards! Use my referral code: ${referralCode}`;
Clipboard.setString(referralCode);
Alert.alert('Error', 'Failed to share referral code. Please try again.');
{referralCode}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/RichNotification.tsx

### Current Service Usage

```javascript
case 'referral':
case 'referral':
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/SEOMetadata.tsx

### Current Service Usage

```javascript
* It adds title, description, canonical URL, Open Graph tags, Twitter card tags, and hreflang tags.
<link rel="canonical" href={canonicalUrl} />
{/* Hreflang tags for language alternatives */}
<link rel="alternate" hrefLang="en" href={`${baseUrl}/en${path}`} />
<link rel="alternate" hrefLang="es" href={`${baseUrl}/es${path}`} />
<link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${path}`} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/TabTransition.tsx

### Current Service Usage

```javascript
// Get accessibility preferences
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/UIThemeProvider.tsx

### Current Service Usage

```javascript
isDark: boolean; // Keep providing light/dark status if needed elsewhere
// Get app theme (light/dark) status if needed for conditional logic elsewhere
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/UpgradePrompt.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = auth.currentUser;
const user = auth.currentUser;
// Add view limit information if available
description: `You've reached your free view limit. ${baseContent.description}`
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ViewLimitIndicator.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
* and prompt for upgrade when approaching the limit
accessibilityLabel="View usage limit indicator"
accessibilityLabel="Close view limit indicator"
{viewData.remainingViews <= 0 ? 'Upgrade Now' : 'Get Unlimited Access'}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ml-sports-edge/ValueBetsCard.tsx

### Current Service Usage

```javascript
<TouchableOpacity style={styles.refreshButton} onPress={fetchValueBets}>
<Text style={[styles.refreshButtonText, { color: theme.colors.primary }]}>Refresh</Text>
refreshButton: {
refreshButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/search/SearchBar.tsx

### Current Service Usage

```javascript
onSearch: (query: string) => void;
const [query, setQuery] = useState(initialValue);
if (query.trim()) {
onSearch(query.trim());
if (showHistory && !recentSearches.includes(query.trim())) {
setRecentSearches(prev => [query.trim(), ...prev.slice(0, 9)]);
value={query}
{query.length > 0 && Platform.OS === 'android' && (
ref={inputRef}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/search/SearchResults.tsx

### Current Service Usage

```javascript
query: string;
query,
{query ? `No results found for "${query}"` : 'Search for sports content'}
{query ? 'Try different keywords or filters' : 'Enter a search term to find news, teams, players, and odds'}
{query && !isLoading && (
{totalResults} {totalResults === 1 ? 'result' : 'results'} for "{query}"
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for components/ui/TabBarBackground.tsx

### Current Service Usage

```javascript
// This is a shim for web and Android where the tab bar is generally opaque.
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/AccessibilitySettingsScreen.tsx

### Current Service Usage

```javascript
import accessibilityService, { AccessibilityPreferences } from '../services/accessibilityService';
const [preferences, setPreferences] = useState<AccessibilityPreferences>(
accessibilityService.getPreferences()
const unsubscribe = accessibilityService.addListener((newPreferences) => {
setPreferences(newPreferences);
* Update a preference
* @param key Preference key
const updatePreference = async (key: keyof AccessibilityPreferences, value: boolean) => {
await accessibilityService.updatePreferences({ [key]: value });
* Reset preferences to default
const resetPreferences = async () => {
await accessibilityService.resetPreferences();
preferences.largeText,
(value) => updatePreference('largeText', value)
preferences.boldText || accessibilityService.isBoldTextActive(),
(value) => updatePreference('boldText', value),
preferences.highContrast || accessibilityService.isHighContrastActive(),
(value) => updatePreference('highContrast', value),
preferences.reduceMotion || accessibilityService.isReduceMotionActive(),
(value) => updatePreference('reduceMotion', value),
preferences.grayscale || accessibilityService.isGrayscaleActive(),
(value) => updatePreference('grayscale', value),
preferences.invertColors || accessibilityService.isInvertColorsActive(),
(value) => updatePreference('invertColors', value),
preferences.screenReaderHints,
(value) => updatePreference('screenReaderHints', value)
onPress={resetPreferences}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/AdvancedPlayerStatsScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
// Check view limit for free users
// If user doesn't have premium access but hasn't reached view limit,
// Show warning if approaching limit
// Show upgrade prompt when view limit is reached or warning is shown
// Show upgrade prompt immediately if view limit is reached
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/AnalyticsDashboardScreen.tsx

### Current Service Usage

```javascript
<TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
<Ionicons name="refresh" size={24} color={Colors.neon.blue} />
refreshButton: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/Auth/ForgotPasswordScreen.tsx

### Current Imports

```javascript
import { sendPasswordResetEmail } from "firebase/auth";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```


## Migration Guide for screens/Auth/LoginScreen.tsx

### Current Imports

```javascript
import { signInWithEmailAndPassword } from "firebase/auth";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { signInWithEmailAndPassword } from "firebase/auth";
await signInWithEmailAndPassword(auth, email, password);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signInWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signIn(email, password)
```

## Migration Guide for screens/Auth/SignupScreen.tsx

### Current Imports

```javascript
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, OAuthProvider } from "firebase/auth";
import { getAuth } from "firebase/auth";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const auth = getAuth();
const auth = getAuth();
const auth = getAuth();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, OAuthProvider } from "firebase/auth";
await createUserWithEmailAndPassword(auth, email, password);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
createUserWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signUp(email, password)
```

## Migration Guide for screens/AuthScreen.tsx

### Current Imports

```javascript
import { FirebaseError } from "firebase/app";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const auth = getAuth();
// For example: await sendPasswordResetEmail(getAuth(), email);
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
errors.email = t("auth.email_required");
errors.email = t("auth.invalid_email_format");
errors.password = t("auth.password_required");
errors.username = t("auth.username_required");
errors.confirmPassword = t("auth.confirm_password_required");
errors.confirmPassword = t("auth.passwords_do_not_match");
setError(t("auth.invalid_credentials"));
setError(t("auth.email_already_in_use"));
setError(t("auth.weak_password"));
setError(t("auth.invalid_email"));
setError(t("auth.authentication_failed"));
t("auth.email_required"),
t("auth.please_enter_email_for_reset"),
t("auth.password_reset"),
t("auth.password_reset_email_sent"),
t("auth.password_reset_failed"),
t("auth.password_reset_error"),
{isLogin ? t("auth.sign_in") : t("auth.sign_up")}
placeholder={t("auth.username") + " (3-20 characters)"}
placeholder={t("auth.email")}
placeholder={t("auth.password") + " (min. 8 characters)"}
<ThemedText style={styles.passwordInfoLabel}>{t('auth.password_strength')}:</ThemedText> {/* Corrected style name */}
? t("auth.weak")
? t("auth.medium")
: t("auth.strong")}
placeholder={t("auth.confirm_password")}
{t("auth.password_requirements")}:
{t("auth.min_8_chars")}
{t("auth.uppercase_letter")}
{t("auth.lowercase_letter")}
{t("auth.number")}
{t("auth.special_char")}
{t("auth.forgot_password")}
{isLogin ? t("auth.sign_in") : t("auth.sign_up")}
? t("auth.dont_have_account")
: t("auth.already_have_account")}
{isLogin ? t("auth.sign_up") : t("auth.sign_in")}
signInWithEmailAndPassword,
await signInWithEmailAndPassword(auth, email, password);
createUserWithEmailAndPassword,
const userCredential = await createUserWithEmailAndPassword(
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signInWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signIn(email, password)

// Replace:
createUserWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signUp(email, password)
```

## Migration Guide for screens/EnhancedAnalyticsDashboardScreen.tsx

### Current Service Usage

```javascript
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
if (loading && !refreshing) {
refreshControl={
<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/FAQModerationScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = auth.currentUser;
const [refreshing, setRefreshing] = useState<boolean>(false);
refreshControl={
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/FAQScreen.tsx

### Current Imports

```javascript
import { Timestamp } from 'firebase/firestore';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const [refreshing, setRefreshing] = useState<boolean>(false);
refreshControl={
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/FightDetailScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = auth.currentUser;
const user = auth.currentUser;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/Formula1Screen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid || '';
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/FraudDetectionDashboardScreen.tsx

### Current Service Usage

```javascript
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
if (loading && !refreshing) {
refreshControl={
<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/GameDetailScreen.tsx

### Current Imports

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { httpsCallable } from 'firebase/functions';
const checkStatus = httpsCallable(functions, 'checkPurchaseStatus');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for screens/GamesScreen.tsx

### Current Service Usage

```javascript
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
{loading && !refreshing ? (
refreshControl={
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/GiftRedemptionScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/GiftSubscriptionScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
Gift subscriptions are non-refundable once redeemed.
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/GroupSubscriptionScreen.tsx

### Current Imports

```javascript
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
name: auth.currentUser?.displayName || '',
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
{auth.currentUser?.email} (You)
{groupData.members.filter((email: string) => email !== auth.currentUser?.email).map((email: string, index: number) => (
const userId = auth.currentUser?.uid;
Alert.alert('Group Full', `Your group subscription is limited to ${MAX_GROUP_MEMBERS} members.`);
ref={ref => emailInputRefs.current[index] = ref}
import { httpsCallable } from 'firebase/functions';
const preparePaymentFn = httpsCallable<
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for screens/HorseRacingScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = auth.currentUser;
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
refreshControl={
refreshing={refreshing}
style={[styles.refreshButton, { backgroundColor: colors.primary }]}
<ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
refreshControl={
refreshing={refreshing}
refreshButton: {
refreshButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/LeaderboardScreen.tsx

### Current Imports

```javascript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const db = getFirestore();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
const aiPicksRef = collection(db, 'aiPicksOfDay');
querySnapshot.forEach((doc) => {
const data = doc.data();
id: doc.id,
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
const querySnapshot = await getDocs(q);
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
// Build query
let q = query(aiPicksRef);
q = query(q, where('sport', '==', sportFilter));
q = query(q, orderBy('confidence', 'desc'));
q = query(q, orderBy('createdAt', 'desc'));
// Execute query
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
q = query(q, where('sport', '==', sportFilter));
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
q = query(q, orderBy('confidence', 'desc'));
q = query(q, orderBy('createdAt', 'desc'));
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for screens/LeagueSelectionScreen.tsx

### Current Service Usage

```javascript
import { userPreferencesService } from '../services/userPreferencesService';
const userSelectedLeagueIds = await userPreferencesService.getSelectedLeagueIds();
const isSelected = await userPreferencesService.toggleLeagueSelection(league);
// Handle refresh
const userSelectedLeagueIds = await userPreferencesService.getSelectedLeagueIds();
setError('Failed to refresh leagues. Please try again.');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/LegalScreen.tsx

### Current Service Usage

```javascript
* The content is loaded from markdown files in the docs directory.
// Get the type of legal document to display from route params
Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the App.
- **Profile Information**: You may choose to provide additional information such as your name, profile picture, favorite teams, and sports preferences.
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/LocationNotificationSettings.js

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
import { getUserPreferences, updatePreference } from '../services/userPreferencesService';
* Allows users to configure location-based notification preferences
const [preferences, setPreferences] = useState(null);
// Load user preferences
const loadPreferences = async () => {
const userPrefs = await getUserPreferences(userId);
setPreferences(userPrefs);
console.error('Error loading preferences:', error);
Alert.alert('Error', 'Failed to load preferences. Please try again.');
loadPreferences();
// Update a preference
const updatePref = async (path, value) => {
const newPreferences = { ...preferences };
setNestedValue(newPreferences, path, value);
setPreferences(newPreferences);
await updatePreference(userId, path, value);
console.error('Error updating preference:', error);
Alert.alert('Error', 'Failed to update preference. Please try again.');
if (loading || !preferences) {
const locationPrefs = preferences.notifications.locationBased || {
value={locationPrefs.enabled}
onValueChange={(value) => updatePref('notifications.locationBased.enabled', value)}
thumbColor={locationPrefs.enabled ? colors.switchThumbOn : colors.switchThumbOff}
<View style={[styles.section, !locationPrefs.enabled && styles.disabled]}>
value={locationPrefs.localTeams}
onValueChange={(value) => updatePref('notifications.locationBased.localTeams', value)}
thumbColor={locationPrefs.localTeams ? colors.switchThumbOn : colors.switchThumbOff}
disabled={!locationPrefs.enabled}
value={locationPrefs.localGames}
onValueChange={(value) => updatePref('notifications.locationBased.localGames', value)}
thumbColor={locationPrefs.localGames ? colors.switchThumbOn : colors.switchThumbOff}
disabled={!locationPrefs.enabled}
value={locationPrefs.localOdds}
onValueChange={(value) => updatePref('notifications.locationBased.localOdds', value)}
thumbColor={locationPrefs.localOdds ? colors.switchThumbOn : colors.switchThumbOff}
disabled={!locationPrefs.enabled}
<View style={[styles.section, !locationPrefs.enabled && styles.disabled]}>
value={locationPrefs.radius}
onValueChange={(value) => updatePref('notifications.locationBased.radius', value)}
disabled={!locationPrefs.enabled}
<ThemedText>{locationPrefs.radius} km</ThemedText>
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/LoginScreen.tsx

### Current Imports

```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
if (isNewUser && auth.currentUser) {
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
await signInWithEmailAndPassword(auth, email, password);
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
await createUserWithEmailAndPassword(auth, email, password);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signInWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signIn(email, password)

// Replace:
createUserWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signUp(email, password)
```

## Migration Guide for screens/NcaaBasketballScreen.tsx

### Current Service Usage

```javascript
const [refreshing, setRefreshing] = useState(false);
const loadData = async (refresh = false) => {
if (refresh) {
// Handle refresh
refreshControl={
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/NearbyVenuesScreen.tsx

### Current Service Usage

```javascript
<NearbyVenues maxDistance={100} limit={10} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/NeonLoginScreen.tsx

### Current Imports

```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
await signInWithEmailAndPassword(auth, email, password);
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
await createUserWithEmailAndPassword(auth, email, password);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signInWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signIn(email, password)

// Replace:
createUserWithEmailAndPassword(auth, email, password)
// With:
firebaseService.signUp(email, password)
```

## Migration Guide for screens/NeonOddsScreen.tsx

### Current Imports

```javascript
import { auth } from "../config/firebase";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const unsubscribe = auth.onAuthStateChanged((user) => {
const unsubscribe = auth.onAuthStateChanged((user) => {
Get unlimited AI predictions, real-time insights, and more
const [refreshing, setRefreshing] = useState<boolean>(false);
refresh,
refreshLiveData
// Set up auto-refresh for live data
refreshLiveData();
// Handle manual refresh
await refresh();
}, [refresh]);
refreshControl={
refreshing={refreshing}
<TouchableOpacity onPress={refresh} style={styles.refreshButton}>
name="refresh"
{loading && !refreshing && (
refreshButton: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for screens/NotificationSettingsScreen.tsx

### Current Service Usage

```javascript
import pushNotificationService, { NotificationPreferences } from '../services/pushNotificationService';
* This screen allows users to configure their notification preferences.
const [preferences, setPreferences] = useState<NotificationPreferences>({
// Load notification preferences
const loadPreferences = async () => {
// Get notification preferences
const prefs = await pushNotificationService.getNotificationPreferences();
setPreferences(prefs);
console.error('Error loading notification preferences:', error);
Alert.alert('Error', 'Failed to load notification preferences. Please try again.');
loadPreferences();
// Save notification preferences
const savePreferences = async () => {
await pushNotificationService.saveNotificationPreferences(preferences);
enabled: preferences.enabled,
gameAlerts: preferences.gameAlerts,
betReminders: preferences.betReminders,
specialOffers: preferences.specialOffers,
newsUpdates: preferences.newsUpdates,
scoreUpdates: preferences.scoreUpdates,
playerAlerts: preferences.playerAlerts
Alert.alert('Success', 'Notification preferences saved successfully.');
console.error('Error saving notification preferences:', error);
Alert.alert('Error', 'Failed to save notification preferences. Please try again.');
// Toggle a preference
const togglePreference = (key: keyof NotificationPreferences) => {
setPreferences(prev => {
// If toggling the main enabled switch, update all preferences
// If enabling, keep current preferences, if disabling, disable all
// Otherwise, just toggle the specific preference
<ThemedText style={styles.sectionTitle}>Notification Preferences</ThemedText>
<View style={styles.preferenceItem}>
<ThemedText style={styles.preferenceLabel}>Enable All Notifications</ThemedText>
value={preferences.enabled}
onValueChange={() => togglePreference('enabled')}
<View style={[styles.divider, !preferences.enabled && styles.disabled]} />
<View style={styles.preferenceItem}>
<ThemedText style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}>
value={preferences.enabled && preferences.gameAlerts}
onValueChange={() => togglePreference('gameAlerts')}
disabled={!preferences.enabled || !hasPermission || saving}
<View style={styles.preferenceDescription}>
<ThemedText style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}>
<View style={[styles.divider, !preferences.enabled && styles.disabled]} />
<View style={styles.preferenceItem}>
<ThemedText style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}>
value={preferences.enabled && preferences.betReminders}
onValueChange={() => togglePreference('betReminders')}
disabled={!preferences.enabled || !hasPermission || saving}
<View style={styles.preferenceDescription}>
<ThemedText style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}>
<View style={[styles.divider, !preferences.enabled && styles.disabled]} />
<View style={styles.preferenceItem}>
<ThemedText style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}>
value={preferences.enabled && preferences.specialOffers}
onValueChange={() => togglePreference('specialOffers')}
disabled={!preferences.enabled || !hasPermission || saving}
<View style={styles.preferenceDescription}>
<ThemedText style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}>
<View style={[styles.divider, !preferences.enabled && styles.disabled]} />
<View style={styles.preferenceItem}>
<ThemedText style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}>
value={preferences.enabled && preferences.newsUpdates}
onValueChange={() => togglePreference('newsUpdates')}
disabled={!preferences.enabled || !hasPermission || saving}
<View style={styles.preferenceDescription}>
<ThemedText style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}>
<View style={[styles.divider, !preferences.enabled && styles.disabled]} />
<View style={styles.preferenceItem}>
<ThemedText style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}>
value={preferences.enabled && preferences.scoreUpdates}
onValueChange={() => togglePreference('scoreUpdates')}
disabled={!preferences.enabled || !hasPermission || saving}
<View style={styles.preferenceDescription}>
<ThemedText style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}>
<View style={[styles.divider, !preferences.enabled && styles.disabled]} />
<View style={styles.preferenceItem}>
<ThemedText style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}>
value={preferences.enabled && preferences.playerAlerts}
onValueChange={() => togglePreference('playerAlerts')}
disabled={!preferences.enabled || !hasPermission || saving}
<View style={styles.preferenceDescription}>
<ThemedText style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}>
You can customize which notifications you receive using the preferences above.
onPress={savePreferences}
{saving ? 'Saving...' : 'Save Preferences'}
preferenceItem: {
preferenceLabel: {
preferenceDescription: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/OddsComparisonScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const unsubscribe = auth.onAuthStateChanged((user) => {
const unsubscribe = auth.onAuthStateChanged((user) => {
const [refreshing, setRefreshing] = useState<boolean>(false);
// Handle refresh
// Track refresh event
event_name: 'odds_comparison_refresh',
// If we have a ref to the odds component, call its refresh method
isLoading={refreshing}
accessibilityHint={t('oddsComparison.accessibility.refreshButtonHint')}
refreshControl={
refreshing={refreshing}
accessibilityLabel={t('oddsComparison.refresh')}
<OddsComparisonComponent ref={oddsComponentRef} isPremium={true} />
<OddsComparisonComponent ref={oddsComponentRef} isPremium={false} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for screens/OddsScreen.tsx

### Current Imports

```javascript
import { auth } from "../config/firebase";
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const unsubscribe = auth.onAuthStateChanged((user) => {
const unsubscribe = auth.onAuthStateChanged((user) => {
Get unlimited AI predictions, real-time insights, and more
const [refreshing, setRefreshing] = useState<boolean>(false);
refresh,
refreshLiveData
// Set up auto-refresh for live data
refreshLiveData();
// Handle manual refresh
await refresh();
}, [refresh]);
refreshControl={
refreshing={refreshing}
onRefresh={refresh}
{loading && !refreshing && (
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for screens/OfflineSettingsScreen.tsx

### Current Service Usage

```javascript
You are currently offline. Some features may be limited.
when you're back online. This includes updating preferences, saving favorites, and more.
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/Onboarding/CookieConsentScreen.tsx

### Current Service Usage

```javascript
const [preferenceCookies, setPreferenceCookies] = useState(false);
preferenceCookies,
{/* Preference Cookies */}
onPress={() => setPreferenceCookies(!preferenceCookies)}
accessibilityLabel={t('cookie.preference_title')}
accessibilityState={{ checked: preferenceCookies }}
{t('cookie.preference_title')}
backgroundColor: preferenceCookies ? colors.primary : 'transparent',
{preferenceCookies && <Ionicons name="checkmark" size={18} color="white" />}
{t('cookie.preference_description')}
setPreferenceCookies(true);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/Onboarding/LiabilityWaiverScreen.tsx

### Current Service Usage

```javascript
ref={scrollViewRef}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/Onboarding/PreferencesScreen.tsx

### Current Service Usage

```javascript
type PreferencesScreenNavigationProp = StackNavigationProp<
'Preferences'
interface SportPreference {
interface NotificationPreference {
const PreferencesScreen = () => {
const navigation = useNavigation<PreferencesScreenNavigationProp>();
const [sportPreferences, setSportPreferences] = useState<SportPreference[]>([
const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([
const toggleSportPreference = (id: string) => {
setSportPreferences(
sportPreferences.map(sport =>
const toggleNotificationPreference = (id: string) => {
setNotificationPreferences(
notificationPreferences.map(notification =>
// Save preferences to context or API
{t('onboarding.preferences_title')}
{t('onboarding.preferences_description')}
{t('preferences.favorite_sports')}
{sportPreferences.map(sport => (
onPress={() => toggleSportPreference(sport.id)}
{t('preferences.notifications')}
{notificationPreferences.map(notification => (
onValueChange={() => toggleNotificationPreference(notification.id)}
{t('onboarding.preferences_skip')}
export default PreferencesScreen;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/Onboarding/ProfileSetupScreen.tsx

### Current Service Usage

```javascript
navigation.navigate('Preferences');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/OnboardingScreen.tsx

### Current Service Usage

```javascript
ref={flatListRef}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/ParlayScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
message="Error loading odds data. Please try refreshing."
isLoading={refreshing}
refreshControl={
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/PaymentScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/PersonalizationScreen.tsx

### Current Service Usage

```javascript
const { preferences, updatePreferences, userProfile } = usePersonalization();
const [localPreferences, setLocalPreferences] = useState({ ...preferences });
setLocalPreferences({
...localPreferences,
// Handle save preferences
const handleSavePreferences = async () => {
await updatePreferences(localPreferences);
Alert.alert('Success', 'Your preferences have been saved.');
console.error('Error saving preferences:', error);
Alert.alert('Error', 'Failed to save preferences. Please try again.');
value={isPremium && userProfile?.subscriptionTier !== 'elite' ? false : localPreferences[key as keyof typeof localPreferences] as boolean}
{/* Theme Preferences */}
localPreferences.darkMode
{/* Content Preferences */}
{/* Notification Preferences */}
localPreferences.enablePushNotifications
localPreferences.notifyBeforeGames
localPreferences.notifyForFavoriteTeams
localPreferences.notifyForBettingOpportunities,
{/* Betting Preferences */}
Set your preferred level of risk for betting recommendations
{localPreferences.riskTolerance.charAt(0).toUpperCase() + localPreferences.riskTolerance.slice(1)}
{localPreferences.preferredOddsFormat.charAt(0).toUpperCase() + localPreferences.preferredOddsFormat.slice(1)}
{/* Display Preferences */}
localPreferences.showLiveScores
localPreferences.showPredictionConfidence
localPreferences.showBettingHistory
{/* Privacy Preferences */}
localPreferences.shareDataForBetterPredictions
localPreferences.anonymousUsageStats
onPress={handleSavePreferences}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/PersonalizedHomeScreen.tsx

### Current Service Usage

```javascript
* Shows content tailored to the user's preferences
preferences,
refreshPersonalizedContent,
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
await refreshPersonalizedContent();
refreshControl={
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/PlayerStatsScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = auth.currentUser;
const user = auth.currentUser;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/ProfileScreen.tsx

### Current Imports

```javascript
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth'; // Import getAuth and necessary functions
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const auth = getAuth(); // Get auth instance
const auth = getAuth(); // Get auth instance
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
const [user, setUser] = useState<User | null>(auth.currentUser);
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth'; // Import getAuth and necessary functions
await signOut(auth); // Use imported signOut
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth'; // Import getAuth and necessary functions
const unsubscribe = onAuthStateChanged(auth, (user) => { // Use imported onAuthStateChanged
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
signOut(auth)
// With:
firebaseService.signOut()

// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for screens/PurchaseHistoryScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = auth.currentUser;
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
{loading && !refreshing ? (
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/RedeemGiftScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/ReferralLeaderboardScreen.tsx

### Current Service Usage

```javascript
* ReferralLeaderboardScreen displays the leaderboard of top referrers
// Reload leaderboard data to reflect privacy changes
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/ReferralNotificationsScreen.tsx

### Current Service Usage

```javascript
import { referralNotificationService, ReferralNotification as NotificationType } from '../services/referralNotificationService';
* ReferralNotificationsScreen displays a list of referral notifications
referralNotificationService.getUnreadCount().then(count => {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/ReferralRewardsScreen.tsx

### Current Service Usage

```javascript
import { referralNotificationService } from '../services/referralNotificationService';
* ReferralRewardsScreen displays the rewards that users can earn through referrals
type: 'milestone' | 'referral' | 'subscription_extension' | 'badge';
// Get current user's referral data
console.error('Error loading referral data:', error);
message: `You've claimed your reward for reaching ${milestone.count} referrals.`,
referralNotificationService.addNotification({
message: `You've claimed your reward for reaching ${milestone.count} referrals.`,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/RefundPolicyScreen.tsx

### Current Service Usage

```javascript
* RefundPolicyScreen component displays the cancellation and refund policy
No partial refunds will be issued for unused portions of your subscription period.
<Text style={styles.bold}>Monthly Subscriptions:</Text> We do not provide refunds for monthly subscriptions.
Weekend Passes are non-refundable once activated.
<Text style={styles.bold}>Pay-Per-Prediction:</Text> Individual prediction purchases are non-refundable
we may consider refund requests on a case-by-case basis.
To request a refund in such cases, please contact our support team at support@aisportsedge.com
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/RewardsScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
limit={10}
const [activeTab, setActiveTab] = useState<'loyalty' | 'achievements' | 'streaks' | 'referrals'>('loyalty');
activeTab === 'referrals' && [
onPress={() => setActiveTab('referrals')}
color={activeTab === 'referrals' ? colors.primary : colors.text}
{ color: activeTab === 'referrals' ? colors.primary : colors.text }
// Render referrals tab content
<View style={styles.referralInfoContainer}>
<Text style={[styles.referralTitle, { color: colors.text }]}>
<View style={styles.referralStatsContainer}>
<View style={styles.referralStatItem}>
<Text style={[styles.referralStatValue, { color: colors.primary }]}>
{rewards.referralCount || 0}
<Text style={[styles.referralStatLabel, { color: colors.text }]}>
<View style={styles.referralStatItem}>
<Text style={[styles.referralStatValue, { color: colors.primary }]}>
<Text style={[styles.referralStatLabel, { color: colors.text }]}>
{activeTab === 'referrals' && renderReferralsContent()}
referralInfoContainer: {
referralTitle: {
referralStatsContainer: {
referralStatItem: {
referralStatValue: {
referralStatLabel: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/SearchScreen.tsx

### Current Service Usage

```javascript
query,
query={query}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/SettingsScreen.tsx

### Current Service Usage

```javascript
<Ionicons name="document-text-outline" size={24} color={colors.text} />
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/SportsNewsScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
{analytics.sentiment && (
analytics.sentiment.sentiment === 'positive' ? '#2ecc71' :
analytics.sentiment.sentiment === 'negative' ? '#e74c3c' :
width: `${Math.abs(analytics.sentiment.score * 100)}%`
{analytics.sentiment.sentiment.charAt(0).toUpperCase() +
analytics.sentiment.sentiment.slice(1)}
({Math.round(analytics.sentiment.score * 100)}%)
{analytics.oddsImpact && (
{analytics.oddsImpact.impactLevel.toUpperCase()}
</Text> impact expected ({analytics.oddsImpact.predictedChange.toFixed(1)}% change)
{analytics.oddsImpact.reasoning}
{analytics.historicalCorrelation && (
analytics.historicalCorrelation.correlationStrength === 'strong' ? 'rgba(46, 204, 113, 0.2)' :
analytics.historicalCorrelation.correlationStrength === 'moderate' ? 'rgba(243, 156, 18, 0.2)' :
analytics.historicalCorrelation.correlationStrength === 'weak' ? 'rgba(189, 195, 199, 0.2)' :
analytics.historicalCorrelation.correlationStrength === 'strong' ? '#27ae60' :
analytics.historicalCorrelation.correlationStrength === 'moderate' ? '#d35400' :
analytics.historicalCorrelation.correlationStrength === 'weak' ? '#7f8c8d' :
{analytics.historicalCorrelation.correlationStrength.toUpperCase()} CORRELATION
{analytics.historicalCorrelation.predictedOutcome}
<Text style={styles.confidenceText}> ({Math.round(analytics.historicalCorrelation.confidence * 100)}% confidence)</Text>
{analytics.historicalCorrelation.similarEvents.map((event, index) => (
{personalizedMode && analytics.personalizedSummary && (
analytics.personalizedSummary.relevanceToUser === 'high' ? 'rgba(46, 204, 113, 0.2)' :
analytics.personalizedSummary.relevanceToUser === 'medium' ? 'rgba(243, 156, 18, 0.2)' :
analytics.personalizedSummary.relevanceToUser === 'high' ? '#27ae60' :
analytics.personalizedSummary.relevanceToUser === 'medium' ? '#d35400' :
{analytics.personalizedSummary.relevanceToUser.toUpperCase()} RELEVANCE
{analytics.personalizedSummary.summary}
{analytics.personalizedSummary.bettingAdvice}
import { getUserSportsPreferences } from '../services/userSportsPreferencesService';
const [refreshing, setRefreshing] = useState<boolean>(false);
loadUserPreferences();
// Load user preferences
const loadUserPreferences = async () => {
const preferences = await getUserSportsPreferences();
setFavoriteTeams(preferences.favoriteTeams);
console.error('Error loading user preferences:', error);
const loadNewsData = async (refresh = false) => {
if (refresh) {
isLoading={refreshing}
refreshControl={
refreshing={refreshing}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/StatsScreen.tsx

### Current Imports

```javascript
import { getFirestore, doc, getDoc } from 'firebase/firestore';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const db = getFirestore();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
import { getFirestore, doc, getDoc } from 'firebase/firestore';
// Get stats document
const statsRef = doc(db, 'stats', 'aiPicks');
console.log('No stats document found');
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const statsDoc = await getDoc(statsRef);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for screens/SubscriptionAnalyticsScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/SubscriptionManagementScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/SubscriptionScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
{t('subscription.refundPolicy')}
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for screens/UFCScreen.tsx

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const [refreshing, setRefreshing] = useState(false);
// Handle refresh
style={[styles.refreshActionButton, { backgroundColor: colors.primary }]}
<Text style={styles.refreshActionButtonText}>Refresh</Text>
styles.refreshButton,
disabled={refreshing}
{refreshing ? (
<Ionicons name="refresh" size={24} color={colors.primary} />
refreshButton: {
refreshActionButton: {
refreshActionButtonText: {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for hooks/useAccessibilityService.ts

### Current Service Usage

```javascript
import { accessibilityService, AccessibilityPreferences } from '../services/accessibilityService';
const [preferences, setPreferences] = useState<AccessibilityPreferences>(
accessibilityService.getPreferences()
// Subscribe to preference changes
const unsubscribe = accessibilityService.addListener(setPreferences);
// Preferences
preferences,
updatePreferences: accessibilityService.updatePreferences.bind(accessibilityService),
resetPreferences: accessibilityService.resetPreferences.bind(accessibilityService),
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for hooks/useAuth.ts

### Current Imports

```javascript
import { FirebaseError } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, AuthError } from 'firebase/auth';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const auth = getAuth();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
import { getAuth, onAuthStateChanged, User, AuthError } from 'firebase/auth';
const unsubscribe = onAuthStateChanged(
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)
```

## Migration Guide for hooks/useOddsData.ts

### Current Service Usage

```javascript
setError("Using cached data. Live updates may be limited due to API rate limits.");
// If we got no data and hit rate limits, show a specific message
throw new Error("API rate limit reached. Please try again later.");
setError("API rate limit reached. Please try again later.");
import { userPreferencesService } from '../services/userPreferencesService';
refresh: () => void;
refreshLiveData: () => void;
* @returns {UseOddsDataResult} - Object containing data, loading state, error state, and refresh function
const leagueIds = await userPreferencesService.getSelectedLeagueIds();
const refreshLiveData = useCallback(() => {
refresh: () => loadData(false),
refreshLiveData,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for hooks/useSearch.ts

### Current Service Usage

```javascript
query: string;
setQuery: (query: string) => void;
const [query, setQuery] = useState(initialQuery);
if (!query.trim()) {
const searchResults = await searchService.search(query, filters);
}, [query, filters]);
// Auto search when query or filters change
if (autoSearch && query.trim()) {
}, [query, filters, autoSearch, search]);
// Auto search on mount if initial query is provided
query,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for hooks/useThemeColor.ts

### Current Service Usage

```javascript
* https://docs.expo.dev/guides/color-schemes/
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/analyticsService.js

### Current Service Usage

```javascript
SET: 'user_preference_set',
CLEAR: 'user_preference_clear'
* Track user preference setting
* @param {string} preferenceType - Type of preference
* @param {any} preferenceValue - Value of the preference
export function trackUserPreference(preferenceType, preferenceValue) {
{ preferenceType, preferenceValue }
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/dataMigrationUtils.ts

### Current Imports

```javascript
import { Auth } from 'firebase/auth';
import * as firebaseConfig from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
collection,
const usersRef = collection(firestore, 'users');
const usersRef = collection(firestore, 'users');
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const userPicksRef = collection(firestore, 'userPicks');
doc,
usersToMigrate = [...usersToMigrate, ...usersSnapshot.docs];
usersToMigrate = usersSnapshot.docs;
// Get user document
const userRef = doc(firestore, 'users', userId);
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const streaksRef = doc(firestore, 'userStreaks', userId);
userPicksSnapshot.forEach(doc => {
const pickData = doc.data();
// Update user document
// Get user document
const userRef = doc(firestore, 'users', userId);
getDoc,
getDocs,
const usersSnapshot = await getDocs(usersQuery);
const usersSnapshot = await getDocs(usersRef);
const userDoc = await getDoc(userRef);
const prefsDoc = await getDoc(prefsDocRef);
const streaksDoc = await getDoc(streaksRef);
const userPicksSnapshot = await getDocs(userPicksQuery);
const userDoc = await getDoc(userRef);
query,
const usersQuery = query(usersRef, where('__name__', 'in', batchIds));
const userPicksQuery = query(userPicksRef, where('userId', '==', userId), limit(100));
where,
const usersQuery = query(usersRef, where('__name__', 'in', batchIds));
const userPicksQuery = query(userPicksRef, where('userId', '==', userId), limit(100));
limit,
const batchSize = 10; // Firestore IN queries are limited to 10 items
const userPicksQuery = query(userPicksRef, where('userId', '==', userId), limit(100));
// Check if user already has embedded preferences
if (userData.preferences) {
preferences: {},
// Migrate preferences
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const prefsDoc = await getDoc(prefsDocRef);
if (prefsDoc.exists()) {
optimizedData.preferences = prefsDoc.data();
} catch (prefsError) {
console.error(`dataMigrationUtils: Error migrating preferences for user ${userId}:`, prefsError);
preferences: null,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for utils/db.ts

### Current Service Usage

```javascript
* Execute a query with parameters
* @param text - SQL query text
async function query(text: string, params: any[] = []) {
const result = await pool.query(text, params);
logger.debug('Executed query', {
query: text,
query: text,
await client.query('BEGIN');
await client.query('COMMIT');
await client.query('ROLLBACK');
query,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/environmentUtils.ts

### Current Service Usage

```javascript
return !!firestore && typeof firestore.collection === 'function';
return !!firestore && typeof firestore.collection === 'function';
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/errorHandling.ts

### Current Imports

```javascript
import { FirebaseError } from 'firebase/app';
import { FirestoreError } from 'firebase/firestore';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
* @param message - Error message prefix
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/errorHandlingUtils.js

### Current Service Usage

```javascript
RATE_LIMIT_ERROR: 'rate_limit_error',
return `Rate limit exceeded: ${suggestion}`;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/firebaseCacheConfig.ts

### Current Service Usage

```javascript
cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
export const getDocumentFromCache = async (collection, docId) => {
.collection(collection)
.collection(collection)
.collection(collection)
export const getDocumentFromCache = async (collection, docId) => {
const docSnap = await firestore()
.doc(docId)
if (docSnap.exists) {
console.log(`Document ${docId} retrieved from cache`);
return { data: docSnap.data(), fromCache: true };
.doc(docId)
console.log(`Document ${docId} retrieved from server`);
console.error(`Error getting document ${docId}:`, error);
.doc(docId)
console.log(`Document ${docId} retrieved using fallback`);
console.error(`Fallback error for document ${docId}:`, fallbackError);
export const getDocumentFromCache = async (collection, docId) => {
console.log('Firestore persistence enabled with unlimited cache size');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for utils/firebaseTest.ts

### Current Imports

```javascript
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const currentUser = auth.currentUser;
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
const testDocRef = doc(collection(firestore, 'test'), 'connection');
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
* @returns Promise that resolves with a test document or error
// Try to read a test document
const testDocRef = doc(collection(firestore, 'test'), 'connection');
console.log('Firestore test document exists:', testDoc.exists());
// If the document doesn't exist, create it
console.log('Created test document in Firestore');
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
const testDoc = await getDoc(testDocRef);
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
await setDoc(testDocRef, {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);
```

## Migration Guide for utils/geoip/index.js

### Current Service Usage

```javascript
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/geoip-temp/app.js

### Current Service Usage

```javascript
res.send('<h3 style="font-family:Sans-Serif">GeoIP API</h3><hr> <br>:: Get your key at <a href="/key">/key</a><br>:: then send request at /api/your-key')
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/parser.js

### Current Service Usage

```javascript
// Process feeds in batches to limit concurrency
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/referralABTesting.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
* This utility provides functions for A/B testing different referral reward structures.
const AB_TEST_VARIANT_KEY = 'referral_ab_test_variant';
console.log(`User assigned to referral A/B test variant: ${variant}`);
* Track a referral conversion for the user's variant
* @param {string} referralCode The referral code used
* @param {boolean} subscribed Whether the referred user subscribed
export const trackReferralConversion = async (referralCode: string, subscribed: boolean) => {
console.log(`Referral conversion for variant ${variant}: ${referralCode}, subscribed: ${subscribed}`);
console.error('Error tracking referral conversion:', error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/responsiveImageLoader.ts

### Current Service Usage

```javascript
// Try to require each path in order of preference
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for utils/userPreferencesService.js

### Current Service Usage

```javascript
* User Preferences Service
* Manages user preferences for the application
// Default preferences
refreshIntervalMinutes: 15,
// Storage key for preferences
const PREFERENCES_STORAGE_KEY = 'ai_sports_edge_user_preferences';
* Get user preferences from local storage or return defaults
* @returns {Object} User preferences
export function getUserPreferences() {
// Try to get preferences from local storage
const storedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
if (storedPreferences) {
// Parse stored preferences
const parsedPreferences = JSON.parse(storedPreferences);
return mergeWithDefaults(parsedPreferences);
console.error('Error retrieving user preferences:', error);
// Return default preferences if none found or error occurred
* Update user preferences in local storage
* @param {Object} preferences - New preferences to save
export function updateUserPreferences(preferences) {
const mergedPreferences = mergeWithDefaults(preferences);
localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(mergedPreferences));
console.error('Error saving user preferences:', error);
* Update a specific preference value
* @param {string} path - Dot-notation path to the preference (e.g., 'rssFeeds.enabledSources')
* @param {any} value - New value for the preference
export function updatePreference(path, value) {
// Get current preferences
const preferences = getUserPreferences();
// Update the specific preference
let current = preferences;
// Save updated preferences
return updateUserPreferences(preferences);
console.error(`Error updating preference ${path}:`, error);
* Reset user preferences to defaults
export function resetUserPreferences() {
// Save default preferences
console.error('Error resetting user preferences:', error);
// Get current preferences
const preferences = getUserPreferences();
const filters = preferences.rssFeeds.keywordFilters[type];
// Save updated preferences
return updateUserPreferences(preferences);
// Get current preferences
const preferences = getUserPreferences();
const filters = preferences.rssFeeds.keywordFilters[type];
// Save updated preferences
return updateUserPreferences(preferences);
return updatePreference('rssFeeds.enabledSources', sources);
// Get current preferences
const preferences = getUserPreferences();
preferences.ui.newsTicker = {
...preferences.ui.newsTicker,
// Save updated preferences
return updateUserPreferences(preferences);
// Get current preferences
const preferences = getUserPreferences();
preferences.analytics = {
...preferences.analytics,
// Save updated preferences
return updateUserPreferences(preferences);
* Merge user preferences with defaults to ensure all properties exist
* @param {Object} preferences - User preferences
* @returns {Object} Merged preferences
function mergeWithDefaults(preferences) {
// Merge preferences with defaults
return deepMerge(DEFAULT_PREFERENCES, preferences);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/FanDuelService.js

### Current Service Usage

```javascript
// Convert tracking parameters to URL query string
const queryParams = Object.entries(trackingParams)
return `${this.config.baseUrl}?${queryParams}&pid=${this.config.affiliateId}`;
// Convert tracking parameters to URL query string
const queryParams = Object.entries(trackingParams)
return `${this.config.deepLinkBaseUrl}/${path}?${queryParams}&pid=${this.config.affiliateId}`;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/abTestingService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const isPremium = auth.currentUser !== null; // Simplified check, replace with actual premium check
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/accessibilityService.ts

### Current Service Usage

```javascript
* Accessibility preferences
export interface AccessibilityPreferences {
* Default accessibility preferences
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
private static readonly PREFERENCES_KEY = '@AISportsEdge:accessibilityPreferences';
private preferences: AccessibilityPreferences = { ...DEFAULT_PREFERENCES };
private listeners: Array<(preferences: AccessibilityPreferences) => void> = [];
// Load preferences
await this.loadPreferences();
* Get accessibility preferences
* @returns Accessibility preferences
getPreferences(): AccessibilityPreferences {
return { ...this.preferences };
* Update accessibility preferences
* @param preferences New preferences
* @returns Promise that resolves when preferences are updated
async updatePreferences(preferences: Partial<AccessibilityPreferences>): Promise<void> {
// Merge with existing preferences
this.preferences = {
...this.preferences,
...preferences
// Save preferences
await this.savePreferences();
console.log('Accessibility preferences updated');
analyticsService.trackEvent('accessibility_preferences_updated', preferences);
console.error('Error updating accessibility preferences:', error);
analyticsService.trackError(error as Error, { method: 'updatePreferences' });
* Reset accessibility preferences to default
* @returns Promise that resolves when preferences are reset
async resetPreferences(): Promise<void> {
this.preferences = { ...DEFAULT_PREFERENCES };
await this.savePreferences();
console.log('Accessibility preferences reset to default');
analyticsService.trackEvent('accessibility_preferences_reset');
console.error('Error resetting accessibility preferences:', error);
analyticsService.trackError(error as Error, { method: 'resetPreferences' });
* Add listener for preference changes
* @param listener Function to call when preferences change
addListener(listener: (preferences: AccessibilityPreferences) => void): () => void {
listener(this.getPreferences());
return this.isBoldTextEnabled || this.preferences.boldText;
return this.isReduceMotionEnabled || this.preferences.reduceMotion;
return this.isReduceTransparencyEnabled || this.preferences.highContrast;
return this.isGrayscaleEnabled || this.preferences.grayscale;
return this.isInvertColorsEnabled || this.preferences.invertColors;
return this.preferences.largeText ? 1.3 : 1.0;
if (!this.preferences.screenReaderHints) {
if (hint && this.preferences.screenReaderHints) {
* Load preferences from storage
* @returns Promise that resolves when preferences are loaded
private async loadPreferences(): Promise<void> {
const preferencesJson = await AsyncStorage.getItem(AccessibilityService.PREFERENCES_KEY);
if (preferencesJson) {
this.preferences = {
...JSON.parse(preferencesJson)
console.log('Loaded accessibility preferences');
this.preferences = { ...DEFAULT_PREFERENCES };
console.log('No saved accessibility preferences found, using defaults');
console.error('Error loading accessibility preferences:', error);
this.preferences = { ...DEFAULT_PREFERENCES };
* Save preferences to storage
* @returns Promise that resolves when preferences are saved
private async savePreferences(): Promise<void> {
JSON.stringify(this.preferences)
console.log('Saved accessibility preferences');
console.error('Error saving accessibility preferences:', error);
* Notify listeners of preference changes
const preferences = this.getPreferences();
listener(preferences);
console.error('Error in accessibility preference listener:', error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/advancedPlayerStatsService.ts

### Current Imports

```javascript
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
collection(db, 'users', userId, 'purchases'),
collection(db, 'users', userId, 'purchases'),
collection(db, 'users', userId, 'purchases'),
collection(db, 'users', userId, 'purchases'),
collection(db, 'users', userId, 'purchases'),
collection(db, 'users', userId, 'purchases'),
await addDoc(collection(db, 'featureUsage'), {
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
return purchasesSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
// Get the user's view count document
const viewCountRef = doc(db, 'users', userId, 'stats', 'viewCount');
const viewCountRef = doc(db, 'users', userId, 'stats', 'viewCount');
const viewCountRef = doc(db, 'users', userId, 'stats', 'viewCount');
// Simply set the document directly instead of using a transaction
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
const purchasesSnapshot = await getDocs(
const comparisonSnapshot = await getDocs(
const bundleSnapshot = await getDocs(
const trendsSnapshot = await getDocs(
const bundleSnapshot = await getDocs(
const purchasesSnapshot = await getDocs(
const viewCountDoc = await getDoc(viewCountRef);
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
await setDoc(viewCountRef, {
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
query(
query(
query(
query(
query(
query(
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
where('productId', '==', ADVANCED_METRICS_PRODUCT_ID),
where('gameId', '==', gameId),
where('status', '==', 'succeeded')
where('productId', '==', PLAYER_COMPARISON_PRODUCT_ID),
where('gameId', '==', gameId),
where('status', '==', 'succeeded')
where('productId', '==', PREMIUM_BUNDLE_PRODUCT_ID),
where('gameId', '==', gameId),
where('status', '==', 'succeeded')
where('productId', '==', HISTORICAL_TRENDS_PRODUCT_ID),
where('gameId', '==', gameId),
where('status', '==', 'succeeded')
where('productId', '==', PREMIUM_BUNDLE_PRODUCT_ID),
where('gameId', '==', gameId),
where('status', '==', 'succeeded')
where('gameId', '==', gameId),
where('status', '==', 'succeeded')
// Free tier limits
* Check if a user has reached their free view limit
// Premium users have unlimited views
console.error('Error checking free view limit:', error);
import { httpsCallable } from 'firebase/functions';
const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for services/aiNewsAnalysisService.ts

### Current Imports

```javascript
import { functions } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
summary = `This news has limited relevance to your betting preferences.`;
import { getUserBettingHistorySummary } from './userSportsPreferencesService';
summary = `This news has limited relevance to your betting preferences.`;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/aiPickSelector.ts

### Current Imports

```javascript
import { getFirestore } from 'firebase/firestore';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const db = getFirestore();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
collection,
const gamesCollection = collection(db, 'games');
// Also save to a separate collection for historical tracking
const aiPicksCollection = collection(db, 'aiPicksOfDay');
logger.info('Added entry to aiPicksOfDay collection');
const gamesCollection = collection(db, 'games');
const picksCollection = collection(db, 'aiPicksOfDay');
doc,
const games = gamesSnapshot.docs.map((docSnapshot: QueryDocumentSnapshot<DocumentData>) => ({
id: docSnapshot.id,
...docSnapshot.data()
const gameRef = doc(db, 'games', game.id);
const pickOfDayRef = doc(db, 'games', gameId);
const gameDoc = gameSnapshot.docs[0];
const historicalPicks = picksSnapshot.docs.map((docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
const data = docSnapshot.data();
getDocs,
getDoc,
const gamesSnapshot = await getDocs(gamesQuery);
const gameSnapshot = await getDocs(gameQuery);
const picksSnapshot = await getDocs(picksQuery);
updateDoc,
query,
const gamesQuery = query(
const gameQuery = query(
const picksQuery = query(
where,
where('startTime', '>=', todayTimestamp),
where('startTime', '<', tomorrowTimestamp),
where('aiConfidence', '>', 0) // Only games with predictions
where('isAIPickOfDay', '==', true),
* @param limit Maximum number of picks to return
export function getTopPicks(games: Game[], limit: number = 3): AIPickData[] {
const topGames = highConfidenceGames.slice(0, limit);
* @param limit Maximum number of historical picks to return
export async function getHistoricalPicks(limit: number = 10): Promise<AIPickData[]> {
logger.info(`Fetching historical AI Picks of the Day (limit: ${limit})`);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/aiPredictionService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
* Get free AI prediction for a game (limited to one per day)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/aiSummaryService.ts

### Current Imports

```javascript
import { functions } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
// const generateSummaryFunc = functions.httpsCallable('generateAISummary');
// const generateSummaryFunc = functions.httpsCallable('generateAISummary');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for services/analyticsService.d.ts

### Current Service Usage

```javascript
setUserProperties(userId: string, properties: Record<string, any>): Promise<void>;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/analyticsService.js

### Current Imports

```javascript
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
if (auth.currentUser) {
const userId = auth.currentUser.uid;
import { doc, setDoc, Timestamp } from 'firebase/firestore';
const analyticsRef = doc(
import { doc, setDoc, Timestamp } from 'firebase/firestore';
await setDoc(analyticsRef, {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);
```

## Migration Guide for services/analyticsService.ts

### Current Imports

```javascript
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
if (auth.currentUser) {
const userId = auth.currentUser.uid;
import { doc, setDoc, Timestamp } from 'firebase/firestore';
const analyticsRef = doc(
import { doc, setDoc, Timestamp } from 'firebase/firestore';
await setDoc(analyticsRef, {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);
```

## Migration Guide for services/apiService.ts

### Current Imports

```javascript
import { getAuth, Auth } from 'firebase/auth';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const auth = getAuth();
const auth = getAuth();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
const user = auth.currentUser;
const user = auth.currentUser;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/bankrollManagementService.ts

### Current Service Usage

```javascript
// Recommendation 3: Set a stop-loss limit
description: `Limit daily losses to $${stopLoss} (10% of your bankroll). If you reach this limit, stop betting for the day.`,
description: `Your recent bet of $${betAmount} was ${Math.round(betToBankrollRatio * 100)}% of your bankroll, which is risky. Consider limiting bets to 2-3% of your bankroll.`,
preferredBetTypes: [],
preferredSports: [],
preferredLeagues: []
// Update preferred bet types
this.updatePreferredList(data.bettingPatterns.preferredBetTypes, betType);
// Update preferred sports
this.updatePreferredList(data.bettingPatterns.preferredSports, sport);
// Update preferred leagues
this.updatePreferredList(data.bettingPatterns.preferredLeagues, league);
* Update a preferred list
* @param list Preferred list
private updatePreferredList(list: { name: string; count: number }[], item: string): void {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/batchLoadingService.ts

### Current Imports

```javascript
import { Auth } from 'firebase/auth';
import * as firebaseConfig from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const uid = userId || auth.currentUser?.uid;
const uid = userId || auth.currentUser?.uid;
collection,
const picksRef = collection(firestore, 'aiPicks');
const picksRef = collection(firestore, 'aiPicks');
const gamesRef = collection(firestore, 'games');
const notificationsRef = collection(firestore, 'notifications');
doc,
const userRef = doc(firestore, 'users', userId);
const pickDoc = pickSnapshot.docs[0];
return picksSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
return gamesSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
return notificationsSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
const configRef = doc(firestore, 'appConfig', 'current');
getDoc,
getDocs,
const userDoc = await getDoc(userRef);
const pickSnapshot = await getDocs(pickQuery);
const picksSnapshot = await getDocs(picksQuery);
const gamesSnapshot = await getDocs(gamesQuery);
const notificationsSnapshot = await getDocs(notificationsQuery);
const configDoc = await getDoc(configRef);
query,
const pickQuery = query(
const picksQuery = query(
const gamesQuery = query(
const notificationsQuery = query(
where,
where('isPickOfDay', '==', true),
where('pickDate', '>=', today),
where('pickDate', '>=', today),
where('confidence', '>=', 80),
where('startTime', '>=', now),
where('userId', '==', userId),
where('read', '==', false),
orderBy,
orderBy('pickDate', 'asc'),
orderBy('confidence', 'desc'),
orderBy('startTime', 'asc'),
orderBy('createdAt', 'desc'),
limit,
limit(1)
limit(count)
limit(count)
limit(count)
async refreshBatchData(
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for services/bettingAffiliateService.ts

### Current Service Usage

```javascript
* @param location Location where button was shown
* @param location Location where button was clicked
* Get button settings based on user preferences and subscription
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/bettingAnalyticsService.ts

### Current Imports

```javascript
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
private firestore = getFirestore();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
private betsCollection = collection(this.firestore, 'bets');
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
const docRef = await addDoc(this.betsCollection, betWithUserId);
return docRef.id;
const betRef = doc(this.firestore, 'bets', betId);
querySnapshot.forEach((doc) => {
id: doc.id,
...doc.data() as Omit<BetRecord, 'id'>
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
const betSnap = await getDoc(betRef);
const querySnapshot = await getDocs(q);
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
await updateDoc(betRef, updates);
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
let q = query(
q = query(q, where('status', '==', filters.status));
q = query(q, where('betType', '==', filters.betType));
q = query(q, where('sport', '==', filters.sport));
q = query(q, where('league', '==', filters.league));
q = query(q, where('teamId', '==', filters.teamId));
q = query(
q = query(q, where('createdAt', '>=', Timestamp.fromDate(periodStartDate)));
q = query(q, orderBy('createdAt', 'desc'));
q = query(q, limit(filters.limit));
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
where('userId', '==', userId)
q = query(q, where('status', '==', filters.status));
q = query(q, where('betType', '==', filters.betType));
q = query(q, where('sport', '==', filters.sport));
q = query(q, where('league', '==', filters.league));
q = query(q, where('teamId', '==', filters.teamId));
where('createdAt', '>=', Timestamp.fromDate(startDate)),
where('createdAt', '<=', Timestamp.fromDate(endDate))
q = query(q, where('createdAt', '>=', Timestamp.fromDate(periodStartDate)));
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
q = query(q, orderBy('createdAt', 'desc'));
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
limit?: number;
// Apply limit if specified
if (filters.limit) {
q = query(q, limit(filters.limit));
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/bettingSlipImportService.ts

### Current Imports

```javascript
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
collection,
collection(firestore, this.SUBSCRIPTION_COLLECTION),
await addDoc(collection(firestore, this.IMPORTED_BETS_COLLECTION), bet);
await addDoc(collection(firestore, this.IMPORT_HISTORY_COLLECTION), {
doc,
// Get user document
const userDoc = await getDoc(doc(firestore, this.USER_COLLECTION, userId));
getDoc,
getDocs,
const userDoc = await getDoc(doc(firestore, this.USER_COLLECTION, userId));
const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
updateDoc,
query,
const subscriptionsQuery = query(
where,
where('userId', '==', userId),
where('status', '==', 'active')
orderBy,
limit,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/bugReportingService.ts

### Current Service Usage

```javascript
import { logEvent, AnalyticsEvent } from './analyticsService';
logEvent(AnalyticsEvent.CUSTOM, {
logEvent(AnalyticsEvent.CUSTOM, {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
logEvent(analytics, eventName, eventParams);
// With:
firebaseService.logAnalyticsEvent(eventName, eventParams);
```

## Migration Guide for services/cacheService.ts

### Current Service Usage

```javascript
// Enforce max entries limit
// Cache key prefixes
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/claudeOptimizationService.ts

### Current Imports

```javascript
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore, auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = request.userId || auth.currentUser?.uid;
const userId = request.userId || auth.currentUser?.uid;
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
const cacheRef = doc(firestore, this.CLAUDE_CACHE_COLLECTION, cacheKey);
const cacheRef = doc(firestore, this.CLAUDE_CACHE_COLLECTION, cacheKey);
const rateLimitRef = doc(firestore, this.CLAUDE_RATE_LIMIT_COLLECTION, `${userId}_${type}_${currentHour}`);
// Get rate limit document
const rateLimitRef = doc(firestore, this.CLAUDE_RATE_LIMIT_COLLECTION, `${userId}_${type}_${currentHour}`);
const statsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'cache_stats');
// Create new stats document
const statsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'cache_stats');
// Create new stats document
const userStatsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, userId);
// Create new stats document
const globalStatsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'global');
const cacheStatsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'cache_stats');
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
const cacheDoc = await getDoc(cacheRef);
const rateLimitDoc = await getDoc(rateLimitRef);
const rateLimitDoc = await getDoc(rateLimitRef);
const statsDoc = await getDoc(statsRef);
const statsDoc = await getDoc(statsRef);
const userStatsDoc = await getDoc(userStatsRef);
const globalStatsDoc = await getDoc(globalStatsRef);
const cacheStatsDoc = await getDoc(cacheStatsRef);
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
await setDoc(cacheRef, response);
await setDoc(rateLimitRef, {
await setDoc(statsRef, {
await setDoc(statsRef, {
await setDoc(userStatsRef, {
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
await updateDoc(rateLimitRef, {
await updateDoc(statsRef, {
await updateDoc(statsRef, {
await updateDoc(userStatsRef, {
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
* - Rate limiting
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
// Rate limit constants
* Check if user has exceeded rate limit for a request type
* @returns Whether rate limit is exceeded
// Premium users have no rate limits
// Get rate limit for this request type
// Check rate limit in Firestore
console.error('Error checking rate limit:', error);
return false; // Default to not rate limited on error
* Increment rate limit counter for a user and request type
// Get rate limit document
console.error('Error incrementing rate limit:', error);
* Get rate limit for a request type and user tier
* @returns Rate limit
// Premium users have no rate limits
// Standard users have higher limits
// Check rate limit if user is logged in
throw new Error(`Rate limit exceeded for ${request.type}`);
// Increment rate limit if user is logged in
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/cricketService.ts

### Current Imports

```javascript
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
userId: string = auth.currentUser?.uid || ''
userId: string = auth.currentUser?.uid || ''
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
const purchasesSnapshot = await db.collection('users').doc(userId)
const purchasesSnapshot = await db.collection('users').doc(userId)
.where('productId', '==', 'cricket-match-prediction')
.where('matchId', '==', matchId)
.where('status', '==', 'succeeded')
.where('productId', '==', 'cricket-player-stats')
.where('playerId', '==', playerId)
.where('status', '==', 'succeeded')
.limit(1)
.limit(1)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/crossPlatformSyncService.ts

### Current Service Usage

```javascript
userPreferences?: UserPreferences;
USER_PREFERENCES: 'user_preferences',
interface UserPreferences {
private userPreferences: UserPreferences = {
// Load user preferences
const userPreferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
if (userPreferencesJson) {
this.userPreferences = {
...this.userPreferences,
...JSON.parse(userPreferencesJson),
// Load individual preferences if not loaded from combined object
if (!userPreferencesJson) {
this.userPreferences.favoriteTeams = JSON.parse(favoriteTeamsJson);
this.userPreferences.primaryTeam = primaryTeam;
this.userPreferences.buttonSettings = JSON.parse(buttonSettingsJson);
this.userPreferences.affiliateEnabled = affiliateEnabled === 'true';
this.userPreferences.affiliateCode = affiliateCode;
// Merge user preferences
if (cloudData.userPreferences) {
if (!this.userPreferences.lastUpdated ||
(cloudData.userPreferences.lastUpdated &&
cloudData.userPreferences.lastUpdated > (this.userPreferences.lastUpdated || 0))) {
this.userPreferences = {
...this.userPreferences,
...cloudData.userPreferences,
JSON.stringify(this.userPreferences)
// Also save individual preferences for backward compatibility
JSON.stringify(this.userPreferences.favoriteTeams)
this.userPreferences.primaryTeam
JSON.stringify(this.userPreferences.buttonSettings)
String(this.userPreferences.affiliateEnabled)
this.userPreferences.affiliateCode
// Add current platform info to user preferences
const updatedPreferences = {
...this.userPreferences,
userPreferences: updatedPreferences,
* Update user preferences
async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
// Update local preferences
this.userPreferences = {
...this.userPreferences,
...preferences,
JSON.stringify(this.userPreferences)
// Also save individual preferences for backward compatibility
if (preferences.favoriteTeams) {
JSON.stringify(preferences.favoriteTeams)
if (preferences.primaryTeam) {
preferences.primaryTeam
if (preferences.buttonSettings) {
JSON.stringify(preferences.buttonSettings)
if (preferences.affiliateEnabled !== undefined) {
String(preferences.affiliateEnabled)
if (preferences.affiliateCode) {
preferences.affiliateCode
console.error('Error syncing preferences with cloud:', err)
console.error('Error updating user preferences:', error);
* Get user preferences
getUserPreferences(): UserPreferences {
return { ...this.userPreferences };
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/crossPlatformSyncService.tsx

### Current Service Usage

```javascript
USER_PREFERENCES: 'user_preferences',
export interface UserPreferences {
private userPreferences: UserPreferences = {
// Load user preferences
const userPreferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
if (userPreferencesJson) {
this.userPreferences = {
...this.userPreferences,
...JSON.parse(userPreferencesJson),
// Load individual preferences if not loaded from combined object
if (!userPreferencesJson) {
this.userPreferences.favoriteTeams = JSON.parse(favoriteTeamsJson);
this.userPreferences.primaryTeam = primaryTeam;
this.userPreferences.buttonSettings = JSON.parse(buttonSettingsJson);
this.userPreferences.affiliateEnabled = affiliateEnabled === 'true';
this.userPreferences.affiliateCode = affiliateCode;
// Merge user preferences
if (cloudData.userPreferences) {
if (!this.userPreferences.lastUpdated ||
(cloudData.userPreferences.lastUpdated &&
cloudData.userPreferences.lastUpdated > (this.userPreferences.lastUpdated || 0))) {
this.userPreferences = {
...this.userPreferences,
...cloudData.userPreferences,
JSON.stringify(this.userPreferences)
// Also save individual preferences for backward compatibility
JSON.stringify(this.userPreferences.favoriteTeams)
this.userPreferences.primaryTeam
JSON.stringify(this.userPreferences.buttonSettings)
String(this.userPreferences.affiliateEnabled)
this.userPreferences.affiliateCode
// Add current platform info to user preferences
const updatedPreferences = {
...this.userPreferences,
userPreferences: updatedPreferences,
* Update user preferences
async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
// Update local preferences
this.userPreferences = {
...this.userPreferences,
...preferences,
JSON.stringify(this.userPreferences)
// Also save individual preferences for backward compatibility
if (preferences.favoriteTeams) {
JSON.stringify(preferences.favoriteTeams)
if (preferences.primaryTeam) {
preferences.primaryTeam
if (preferences.buttonSettings) {
JSON.stringify(preferences.buttonSettings)
if (preferences.affiliateEnabled !== undefined) {
String(preferences.affiliateEnabled)
if (preferences.affiliateCode) {
preferences.affiliateCode
console.error('Error syncing preferences with cloud:', err)
console.error('Error updating user preferences:', error);
* Get user preferences
getUserPreferences(): UserPreferences {
return { ...this.userPreferences };
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/dataExportService.ts

### Current Service Usage

```javascript
// Import types for expo-sharing and expo-document-picker
// npm install expo-sharing expo-document-picker
DocumentPicker = require('expo-document-picker');
// This avoids TypeScript errors with document.createElement
const fileUri = `${FileSystem.documentDirectory}${filename}`;
// Pick a document
const result = await DocumentPicker.getDocumentAsync({
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for services/dataSyncService.ts

### Current Service Usage

```javascript
// Check if over limit
console.log(`Storage usage (${usage} bytes) exceeds limit (${this.storageOptions.maxStorageSize} bytes), cleaning up`);
PREFERENCE = 'preference'
const typePrefix = `${DataSyncService.STORAGE_PREFIX}${type}:`;
const typeKeys = allKeys.filter(key => key.startsWith(typePrefix));
// Filter keys by prefix
// Filter keys by prefix
// Filter keys by prefix
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/deepLinkingService.ts

### Current Imports

```javascript
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
collection,
const deepLinksRef = collection(firestore, 'deepLinkHistory');
const deepLinksRef = collection(firestore, 'deepLinkHistory');
doc,
return snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
const docRef = doc(firestore, 'deepLinkHistory', id);
await updateDoc(docRef, {
getDoc,
getDocs,
const snapshot = await getDocs(q);
setDoc,
updateDoc
await updateDoc(docRef, {
query,
const q = query(
where,
where('userId', '==', userId),
orderBy,
orderBy('timestamp', 'desc'),
limit,
limit(maxEntries)
REFERRAL = 'referral',
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/enhancedAnalyticsService.ts

### Current Imports

```javascript
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
collection,
doc,
getDocs,
getDoc,
query,
// Construct API URL with query parameters
where,
orderBy,
limit,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for services/enhancedCacheService.ts

### Current Service Usage

```javascript
// Enforce max entries limit
'preferences': 1000 * 60 * 60 * 24, // 24 hours
// Cache key prefixes
'preferences'
this.log(`Getting ${key} with strategy ${strategy}${forceRefresh ? ' (force refresh)' : ''}`);
* @param forceRefresh Whether to force a refresh from network
this.log(`Getting ${key} with cache-first strategy${forceRefresh ? ' (force refresh)' : ''}`);
// If force refresh, skip cache
* Prefetch data into cache
async prefetch<T>(key: string, fetchFn: () => Promise<T>, expiration?: number): Promise<void> {
this.log(`Prefetching data for ${key}`);
console.error(`Error prefetching ${key}:`, error);
logError(LogCategory.STORAGE, `Error prefetching ${key}`, error as Error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/errorRecoveryService.ts

### Current Service Usage

```javascript
RATE_LIMIT = 'rate_limit',
// Check for rate limiting
error.response.data.message.includes('rate limit'))
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/faqService.ts

### Current Imports

```javascript
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
collection,
collection(firestore, QUESTIONS_COLLECTION),
collection(firestore, QUESTIONS_COLLECTION),
collection(firestore, QUESTIONS_COLLECTION),
doc,
const docRef = await addDoc(
return docRef.id;
return querySnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
return querySnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
getDocs,
const querySnapshot = await getDocs(q);
const querySnapshot = await getDocs(q);
updateDoc,
await updateDoc(questionRef, {
await updateDoc(questionRef, {
await updateDoc(questionRef, {
deleteDoc,
await deleteDoc(questionRef);
query,
const q = query(
const querySnapshot = await getDocs(q);
return querySnapshot.docs.map(doc => ({
const q = query(
const querySnapshot = await getDocs(q);
return querySnapshot.docs.map(doc => ({
where,
where('status', '==', 'approved'),
where('status', '==', 'pending'),
orderBy
orderBy('createdAt', 'desc')
orderBy('createdAt', 'desc')
// Collection references
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');
```

## Migration Guide for services/featureTourService.ts

### Current Service Usage

```javascript
description: 'Our AI doesn\'t just predict winners—it finds VALUE. See exactly where the bookmakers have set odds that don\'t match the real probabilities.',
description: 'Track performance over time, see where you\'re making and losing money, and get AI-powered suggestions to improve.',
description: 'Receive custom insights based on your favorite teams, betting history, and preferences.',
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/feedbackService.ts

### Current Service Usage

```javascript
import { logEvent, AnalyticsEvent } from './analyticsService';
logEvent(AnalyticsEvent.CUSTOM, {
logEvent(AnalyticsEvent.CUSTOM, {
logEvent(AnalyticsEvent.CUSTOM, {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
logEvent(analytics, eventName, eventParams);
// With:
firebaseService.logAnalyticsEvent(eventName, eventParams);
```

## Migration Guide for services/firebaseMonitoringService.ts

### Current Service Usage

```javascript
* @param path Document or collection path
* @param path Document or collection path
QUERY = 'query',
* Track a Firestore query operation
* @param limit Maximum number of operations to return
getRecentOperations(limit: number = 100): FirebaseOperation[] {
return this.operations.slice(-limit);
* @param limit Maximum number of operations to return
getOperationsByType(type: FirebaseOperationType, limit: number = 100): FirebaseOperation[] {
.slice(-limit);
* @param limit Maximum number of operations to return
getOperationsByService(service: FirebaseServiceType, limit: number = 100): FirebaseOperation[] {
.slice(-limit);
* @param limit Maximum number of operations to return
getOperationsByPath(path: string, limit: number = 100): FirebaseOperation[] {
.slice(-limit);
* @param forceRefresh Whether to force a refresh of the statistics
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/firebaseService.ts

### Current Imports

```javascript
import { onAuthStateChanged } from 'firebase/auth';
import { app, auth, firestore as db } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
return this.userId || (auth ? auth.currentUser?.uid : null) || null;
import { onAuthStateChanged } from 'firebase/auth';
onAuthStateChanged(auth, (user) => {
collection,
collection(db, 'users', userId, 'purchasedOdds'),
// Update purchased odds subcollection
doc,
// Get user document
const userDocRef = doc(db, 'users', userId);
purchasedOddsSnapshot.forEach((doc) => {
const data = doc.data();
gameId: doc.id,
// Get user document reference
const userDocRef = doc(db, 'users', userId);
// Check if user document exists
// Update existing document
// Create new document
const purchaseDocRef = doc(db, 'users', userId, 'purchasedOdds', purchase.gameId);
getDoc,
getDocs,
const userDoc = await getDoc(userDocRef);
const purchasedOddsSnapshot = await getDocs(purchasedOddsQuery);
const userDoc = await getDoc(userDocRef);
setDoc,
await setDoc(userDocRef, {
await setDoc(purchaseDocRef, {
updateDoc,
await updateDoc(userDocRef, {
query,
const purchasedOddsQuery = query(
where,
where('timestamp', '>', lastSyncTimestamp)
userPreferences?: UserPreferences;
export interface UserPreferences {
userPreferences: {
// Get user document reference
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
onAuthStateChanged(auth, callback)
// With:
firebaseService.onAuthStateChange(callback)

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/firebaseSubscriptionService.ts

### Current Imports

```javascript
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const firestore = getFirestore();
const functions = getFunctions();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
const createSubscriptionFunc = functions.httpsCallable('createSubscription');
const cancelSubscriptionFunc = functions.httpsCallable('cancelSubscription');
const createOneTimePayment = functions.httpsCallable('createOneTimePayment');
const createOneTimePayment = functions.httpsCallable('createOneTimePayment');
const updatePaymentMethodFunc = functions.httpsCallable('updatePaymentMethod');
const updateSubscriptionFunc = functions.httpsCallable('updateSubscription');
const pauseSubscriptionFunc = functions.httpsCallable('pauseSubscription');
const resumeSubscriptionFunc = functions.httpsCallable('resumeSubscription');
const giftSubscriptionFunc = functions.httpsCallable('giftSubscription');
const toggleAutoResubscribeFunc = functions.httpsCallable('toggleAutoResubscribe');
const generateReferralCodeFunc = functions.httpsCallable('generateReferralCode');
const applyReferralCodeFunc = functions.httpsCallable('applyReferralCode');
const redeemGiftSubscriptionFunc = functions.httpsCallable('redeemGiftSubscription');
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
const userDoc = await db.collection('users').doc(userId).get();
const subscriptionDoc = await db.collection('users').doc(userId)
.collection('subscriptions')
const userDoc = await db.collection('users').doc(userId).get();
const userDoc = await db.collection('users').doc(userId).get();
const subscriptionDoc = await db.collection('users').doc(userId)
.collection('subscriptions')
const paymentMethodsSnapshot = await db.collection('users').doc(userId)
.collection('paymentMethods')
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const purchasesSnapshot = await db.collection('users').doc(userId)
const userDoc = await db.collection('users').doc(userId).get();
const subscriptionDoc = await db.collection('users').doc(userId)
.doc(subscriptionId)
const userDoc = await db.collection('users').doc(userId).get();
const userDoc = await db.collection('users').doc(userId).get();
const subscriptionDoc = await db.collection('users').doc(userId)
.doc(subscriptionId)
const paymentMethodsSnapshot = await db.collection('users').doc(userId)
return paymentMethodsSnapshot.docs.map((doc: any) => {
const data = doc.data();
id: doc.id,
const purchasesSnapshot = await db.collection('users').doc(userId)
// Get user document
const userDocRef = doc(firestore, 'users', userId);
// Get user document
const userDocRef = doc(firestore, 'users', userId);
// Update user document
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const userDoc = await getDoc(userDocRef);
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
await updateDoc(userDocRef, {
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
.where('status', '==', 'succeeded')
.where('expiresAt', '>', now)
.where('productId', '==', 'single-prediction')
.where('gameId', '==', gameId)
.where('status', '==', 'succeeded')
.limit(1)
.limit(1)
* Generate a referral code for a user
* @returns Promise with referral code details
await trackEvent('referral_code_generated', {
referralCode: result.data.referralCode
console.error('Error generating referral code:', error);
* Apply a referral code
* @param referralCode Referral code to apply
* @returns Promise with referral application result
referralCode: string
referralCode
await trackEvent('referral_code_applied', {
referralCode,
referrerId: result.data.referrerId
console.error('Error applying referral code:', error);
import { getFunctions, httpsCallable } from 'firebase/functions';
const createSubscriptionFunc = functions.httpsCallable('createSubscription');
const cancelSubscriptionFunc = functions.httpsCallable('cancelSubscription');
const createOneTimePayment = functions.httpsCallable('createOneTimePayment');
const createOneTimePayment = functions.httpsCallable('createOneTimePayment');
const updatePaymentMethodFunc = functions.httpsCallable('updatePaymentMethod');
const updateSubscriptionFunc = functions.httpsCallable('updateSubscription');
const pauseSubscriptionFunc = functions.httpsCallable('pauseSubscription');
const resumeSubscriptionFunc = functions.httpsCallable('resumeSubscription');
const giftSubscriptionFunc = functions.httpsCallable('giftSubscription');
const toggleAutoResubscribeFunc = functions.httpsCallable('toggleAutoResubscribe');
const generateReferralCodeFunc = functions.httpsCallable('generateReferralCode');
const applyReferralCodeFunc = functions.httpsCallable('applyReferralCode');
const redeemGiftSubscriptionFunc = functions.httpsCallable('redeemGiftSubscription');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for services/formula1Service.ts

### Current Imports

```javascript
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
const purchasesSnapshot = await db.collection('users').doc(userId)
.where('productId', '==', 'formula1-race-prediction')
.where('raceId', '==', raceId)
.where('status', '==', 'succeeded')
.limit(1)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/fraudDetectionService.ts

### Current Imports

```javascript
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
collection,
collection(firestore, this.RULE_COLLECTION),
await addDoc(collection(firestore, this.ACTIVITY_COLLECTION), {
collection(firestore, this.ACTIVITY_COLLECTION),
const alertRef = await addDoc(collection(firestore, this.ALERT_COLLECTION), alertData);
collection(firestore, 'users'),
collection(firestore, this.ALERT_COLLECTION),
await addDoc(collection(firestore, this.USER_RISK_COLLECTION), {
let alertsQuery = query(collection(firestore, this.ALERT_COLLECTION));
collection(firestore, this.ALERT_COLLECTION),
collection(firestore, this.ALERT_COLLECTION),
doc,
this.activeRules = rulesSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
const userDoc = await getDoc(doc(firestore, 'users', userId));
const alerts = alertsSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
const riskScoreRef = doc(firestore, this.USER_RISK_COLLECTION, userId);
return alertsSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
const alertDoc = await getDoc(doc(firestore, this.ALERT_COLLECTION, alertId));
const alertRef = doc(firestore, this.ALERT_COLLECTION, alertId);
const alertRef = doc(firestore, this.ALERT_COLLECTION, alertId);
const userRef = doc(firestore, 'users', userId);
const alerts = alertsSnapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
const alerts = snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
getDoc,
getDocs,
const rulesSnapshot = await getDocs(rulesQuery);
const eventsSnapshot = await getDocs(eventsQuery);
const userDoc = await getDoc(doc(firestore, 'users', userId));
const adminsSnapshot = await getDocs(adminsQuery);
const alertsSnapshot = await getDocs(alertsQuery);
const riskScoreDoc = await getDoc(riskScoreRef);
const alertsSnapshot = await getDocs(alertsQuery);
const alertDoc = await getDoc(doc(firestore, this.ALERT_COLLECTION, alertId));
const alertDoc = await getDoc(alertRef);
const alertDoc = await getDoc(alertRef);
const alertsSnapshot = await getDocs(alertsQuery);
updateDoc,
await updateDoc(riskScoreRef, {
await updateDoc(alertRef, {
await updateDoc(alertRef, {
await updateDoc(userRef, {
await updateDoc(userRef, {
await updateDoc(userRef, {
await updateDoc(userRef, {
await updateDoc(userRef, {
query,
const rulesQuery = query(
const eventsQuery = query(
const adminsQuery = query(
const alertsQuery = query(
let alertsQuery = query(collection(firestore, this.ALERT_COLLECTION));
alertsQuery = query(alertsQuery, where('userId', '==', filters.userId));
alertsQuery = query(alertsQuery, where('severity', '==', filters.severity));
alertsQuery = query(alertsQuery, where('status', '==', filters.status));
alertsQuery = query(alertsQuery, where('patternType', '==', filters.patternType));
alertsQuery = query(alertsQuery, where('timestamp', '>=', filters.fromDate));
alertsQuery = query(alertsQuery, where('timestamp', '<=', filters.toDate));
alertsQuery = query(alertsQuery, orderBy(sortBy, sortOrder));
alertsQuery = query(alertsQuery, limit(limitCount));
// Execute query
let alertsQuery = query(
let alertsQuery = query(
alertsQuery = query(alertsQuery, where('severity', '==', filters.severity));
alertsQuery = query(alertsQuery, where('status', '==', filters.status));
alertsQuery = query(alertsQuery, where('patternType', '==', filters.patternType));
where,
where('isActive', '==', true)
where('userId', '==', userId),
where('timestamp', '>=', new Date(startTime)),
where(field, '==', value)
where('role', '==', 'admin')
where('userId', '==', userId),
where('timestamp', '>=', Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
alertsQuery = query(alertsQuery, where('userId', '==', filters.userId));
alertsQuery = query(alertsQuery, where('severity', '==', filters.severity));
alertsQuery = query(alertsQuery, where('status', '==', filters.status));
alertsQuery = query(alertsQuery, where('patternType', '==', filters.patternType));
alertsQuery = query(alertsQuery, where('timestamp', '>=', filters.fromDate));
alertsQuery = query(alertsQuery, where('timestamp', '<=', filters.toDate));
where('timestamp', '>=', startDate),
where('timestamp', '<=', endDate)
alertsQuery = query(alertsQuery, where('severity', '==', filters.severity));
alertsQuery = query(alertsQuery, where('status', '==', filters.status));
alertsQuery = query(alertsQuery, where('patternType', '==', filters.patternType));
orderBy,
alertsQuery = query(alertsQuery, orderBy(sortBy, sortOrder));
orderBy('timestamp', 'desc'),
limit,
* @param limitCount Maximum number of alerts to return
limitCount: number = 100
// Apply limit
alertsQuery = query(alertsQuery, limit(limitCount));
limit(100)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/gameUrlService.ts

### Current Imports

```javascript
import { collection, doc, getDoc, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { collection, doc, getDoc, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore';
// Firestore collection names
const apiKeysDocRef = doc(collection(firestore, COLLECTIONS.API_KEYS), 'sports');
const gameUrlsCollection = collection(firestoreInstance, COLLECTIONS.GAME_URLS);
const gameUrlsCollection = collection(firestoreInstance, COLLECTIONS.GAME_URLS);
import { collection, doc, getDoc, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore';
const apiKeysDocRef = doc(collection(firestore, COLLECTIONS.API_KEYS), 'sports');
const docRef = doc(gameUrlsCollection, gameUrl.gameId);
batch.set(docRef, {
const gameDocRef = doc(gameUrlsCollection, gameId);
import { collection, doc, getDoc, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore';
const apiKeysDoc = await getDoc(apiKeysDocRef);
const gameDoc = await getDoc(gameDocRef);
import { collection, doc, getDoc, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore';
// Check if we need to refresh the cache
* Force refresh of game URLs
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for services/geolocationService.js

### Current Service Usage

```javascript
// Import Expo Location dynamically to avoid issues in environments where it's not available
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/geolocationService.ts

### Current Service Usage

```javascript
`${API_BASE_URLS.OPENWEATHER}/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEYS.OPENWEATHER_API_KEY}`
// If we have a cached location and don't need to refresh, return it
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/groupSubscriptionService.ts

### Current Imports

```javascript
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const firestore = getFirestore();
const functions = getFunctions();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
const groupSubscriptionsRef = collection(firestore, 'groupSubscriptions');
const groupSubscriptionsRef = collection(firestore, 'groupSubscriptions');
const groupSubscriptionsRef = collection(firestore, 'groupSubscriptions');
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
// Get the group subscription document
const groupSubscriptionRef = doc(firestore, 'groupSubscriptions', groupId);
querySnapshot.forEach((doc) => {
id: doc.id,
...doc.data()
querySnapshot.forEach((doc) => {
id: doc.id,
...doc.data()
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
const groupSubscriptionDoc = await getDoc(groupSubscriptionRef);
const querySnapshot = await getDocs(q);
const querySnapshot = await getDocs(q);
const querySnapshot = await getDocs(q);
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
const q = query(groupSubscriptionsRef, where('ownerId', '==', userId));
const querySnapshot = await getDocs(q);
// Convert query snapshot to array of group subscriptions
querySnapshot.forEach((doc) => {
const q = query(groupSubscriptionsRef, where('members', 'array-contains', userEmail));
const querySnapshot = await getDocs(q);
// Convert query snapshot to array of group subscriptions
querySnapshot.forEach((doc) => {
const q = query(
const querySnapshot = await getDocs(q);
return !querySnapshot.empty;
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
const q = query(groupSubscriptionsRef, where('ownerId', '==', userId));
// Query group subscriptions where the user is a member
const q = query(groupSubscriptionsRef, where('members', 'array-contains', userEmail));
// Query active group subscriptions where the user is a member
where('members', 'array-contains', userEmail),
where('status', '==', 'active')
import { getFunctions, httpsCallable } from 'firebase/functions';
const createGroupSubscriptionFn = httpsCallable(functions, 'createGroupSubscription');
const addGroupMemberFn = httpsCallable(functions, 'addGroupMember');
const removeGroupMemberFn = httpsCallable(functions, 'removeGroupMember');
const cancelGroupSubscriptionFn = httpsCallable(functions, 'cancelGroupSubscription');
const transferGroupOwnershipFn = httpsCallable(functions, 'transferGroupOwnership');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for services/helpCenterService.ts

### Current Service Usage

```javascript
* This service provides access to help documentation, FAQs, and support resources.
* @param query Search query
* @returns Array of help articles matching the query
export const searchHelpArticles = (query: string): HelpArticle[] => {
const normalizedQuery = query.toLowerCase().trim();
* @param query Search query
* @returns Array of FAQs matching the query
export const searchFAQs = (query: string): FAQ[] => {
const normalizedQuery = query.toLowerCase().trim();
Our predictions are designed to give you an edge by identifying value bets where the bookmaker's odds don't align with our calculated probabilities.
3. Focus on value bets where our probability is significantly higher than the bookmaker's implied probability
- Unlimited predictions
2. **Set limits and stick to them**
- Set time limits for how long you gamble
- Set deposit limits for how much you can deposit
- Set loss limits for how much you can lose
- Set spending limits for how much you can spend
Set limits on how much you can deposit:
4. Set daily, weekly, or monthly limits
Set limits on how long you can use the app:
4. Set daily limits
tags: ['responsible gambling', 'gambling addiction', 'betting limits', 'self-exclusion'],
2. Tap "Bet Now" to be redirected to your preferred sportsbook
We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied with your subscription within the first 7 days, contact our support team for a full refund.
After the first 7 days, we do not offer refunds for partial subscription periods.
- No refund is provided for the remaining time on your current plan
You can customize your notification preferences:
2. Review and update your data sharing preferences
2. Select your preferred language
id: 'refund-policy',
question: 'What is your refund policy?',
answer: 'We offer a 7-day money-back guarantee for new subscribers. If you\'re not satisfied with your subscription within the first 7 days, contact our support team for a full refund. After the first 7 days, we do not offer refunds for partial subscription periods.',
tags: ['refund', 'subscription', 'billing'],
answer: 'No, AI Sports Edge does not handle actual betting. We provide predictions and analysis to help you make informed betting decisions. To place a bet, you need to use a licensed sportsbook or betting platform. You can tap "Bet Now" on a prediction to be redirected to your preferred sportsbook.',
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/horseRacingService.ts

### Current Service Usage

```javascript
if (Math.random() > 0.5) keyFactors.push('Track condition preference');
'breeding suggests preference',
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/index.ts

### Current Service Usage

```javascript
export * from './referralNotificationService';
export * from './userPreferencesService';
export * from './userSportsPreferencesService';
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/licenseVerificationService.ts

### Current Imports

```javascript
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const db = getFirestore();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
const licenseRef = doc(db, 'licenses', `${packageName}@${version}`);
attributionText: 'MIT License\n\nCopyright (c) Facebook, Inc. and its affiliates.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'
attributionText: 'MIT License\n\nCopyright (c) Facebook, Inc. and its affiliates.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'
attributionText: 'MIT License\n\nCopyright (c) 2015-present 650 Industries, Inc. (aka Expo)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
const licenseDoc = await getDoc(licenseRef);
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
await setDoc(licenseRef, {
attributionText: 'MIT License\n\nCopyright (c) Facebook, Inc. and its affiliates.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'
attributionText: 'MIT License\n\nCopyright (c) Facebook, Inc. and its affiliates.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'
attributionText: 'MIT License\n\nCopyright (c) 2015-present 650 Industries, Inc. (aka Expo)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'
attributionText: 'Apache License 2.0\n\nCopyright (c) Google Inc.\n\nLicensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at\n\nhttp://www.apache.org/licenses/LICENSE-2.0\n\nUnless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.'
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);
```

## Migration Guide for services/loggingService.ts

### Current Service Usage

```javascript
const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
console.debug(`${prefix} ${entry.message}`, entry.data);
console.info(`${prefix} ${entry.message}`, entry.data);
console.warn(`${prefix} ${entry.message}`, entry.data);
console.error(`${prefix} ${entry.message}`, entry.data);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/microtransactionService.js

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
if (!auth.currentUser) {
* It provides functions to determine when and where to show microtransaction options,
USER_PREFERENCES: 'user_microtransaction_preferences',
// Get user preferences
const prefs = await this.getUserPreferences(userId);
if (!prefs.enableMicrotransactions) {
* Get user's microtransaction preferences
* @returns {Promise<Object>} User preferences
async getUserPreferences(userId) {
const preferencesJson = await AsyncStorage.getItem(`${STORAGE_KEYS.USER_PREFERENCES}_${userId}`);
return preferencesJson ? JSON.parse(preferencesJson) : {
preferredTypes: [],
console.error('Error getting user microtransaction preferences:', error);
preferredTypes: [],
* Save user's microtransaction preferences
* @param {Object} preferences User preferences
async saveUserPreferences(userId, preferences) {
JSON.stringify(preferences)
console.error('Error saving user microtransaction preferences:', error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/mlPredictionService.ts

### Current Imports

```javascript
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
private readonly MODEL_REGISTRY_URL = 'https://storage.googleapis.com/ai-sports-edge-models';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
const feedbackRef = collection(firestore, this.FEEDBACK_COLLECTION);
const feedbackRef = collection(firestore, this.FEEDBACK_COLLECTION);
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
const modelRef = doc(firestore, this.MODEL_REGISTRY_COLLECTION, sport);
querySnapshot.forEach((doc) => {
const feedback = doc.data() as PredictionFeedback;
// Create prediction document
const predictionRef = doc(firestore, 'predictions', gameId);
const predictionRef = doc(firestore, 'predictions', gameId);
const feedbackRef = doc(firestore, this.FEEDBACK_COLLECTION, gameId);
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
const modelDoc = await getDoc(modelRef);
const querySnapshot = await getDocs(q);
const predictionDoc = await getDoc(predictionRef);
const querySnapshot = await getDocs(q);
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
await setDoc(predictionRef, {
await setDoc(feedbackRef, feedback);
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
await updateDoc(predictionRef, {
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
const q = query(
const querySnapshot = await getDocs(q);
if (querySnapshot.empty) {
querySnapshot.forEach((doc) => {
return (correctCount / querySnapshot.size) * 100;
const q = query(
const querySnapshot = await getDocs(q);
if (querySnapshot.size >= this.MIN_FEEDBACK_FOR_TRAINING) {
console.log(`Retraining model for ${sport} with ${querySnapshot.size} feedback entries`);
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
where('sportType', '==', sport),
where('sportType', '==', sport),
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
orderBy('timestamp', 'desc'),
orderBy('timestamp', 'desc'),
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
limit(100)
limit(this.MIN_FEEDBACK_FOR_TRAINING + 1)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/mockDataService.ts

### Current Imports

```javascript
import { isDevMode } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```


## Migration Guide for services/nascarService.ts

### Current Imports

```javascript
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
userId: string = auth.currentUser?.uid || ''
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
const purchasesSnapshot = await db.collection('users').doc(userId)
.where('productId', '==', 'nascar-race-prediction')
.where('raceId', '==', raceId)
.where('status', '==', 'succeeded')
.limit(1)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/ncaaBasketballService.ts

### Current Service Usage

```javascript
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/notificationService.ts

### Current Service Usage

```javascript
REFERRAL = 'referral',
* Notification preferences
export interface NotificationPreferences {
* Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
* Get notification preferences
getPreferences(): NotificationPreferences {
return { ...this.preferences };
* Update notification preferences
async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
this.preferences = {
...this.preferences,
...preferences,
...this.preferences.categories,
...(preferences.categories || {})
...this.preferences.quiet_hours,
...(preferences.quiet_hours || {})
// Save preferences to localStorage for web
localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
console.error('Failed to update notification preferences:', error);
* Reset notification preferences to default
async resetPreferences(): Promise<boolean> {
this.preferences = { ...DEFAULT_PREFERENCES };
// Save preferences to localStorage for web
localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
console.error('Failed to reset notification preferences:', error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/oddsCacheService.ts

### Current Service Usage

```javascript
* Prefetch odds data
async prefetchOddsData<T>(
// If cache is fresh, don't prefetch
console.error('Error prefetching odds data:', error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/offlineQueueService.ts

### Current Service Usage

```javascript
queryParams?: Record<string, string>;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/offlineService.ts

### Current Imports

```javascript
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
collection: string;
* @param collectionPath Firestore collection path
collectionPath: string,
const cacheKey = `${CACHE_PREFIX}${collectionPath}_${docId}`;
return this.getDataFromFirestore<T>(collectionPath, docId);
const data = await this.getDataFromFirestore<T>(collectionPath, docId);
const data = await this.getDataFromFirestore<T>(collectionPath, docId);
* @param collectionPath Firestore collection path
collectionPath: string,
const docRef = doc(firestore, collectionPath, docId);
* @param collectionPath Firestore collection path
collectionPath: string,
const cacheKey = `${CACHE_PREFIX}${collectionPath}_query_${JSON.stringify(queryParams)}`;
return this.queryDataFromFirestore<T>(collectionPath, queryParams);
const data = await this.queryDataFromFirestore<T>(collectionPath, queryParams);
const data = await this.queryDataFromFirestore<T>(collectionPath, queryParams);
* @param collectionPath Firestore collection path
collectionPath: string,
// Create collection reference
const collectionRef = collection(firestore, collectionPath);
let queryRef = query(collectionRef);
* @param collectionPath Firestore collection path
collectionPath: string,
return this.saveDataToFirestore(collectionPath, data, docId);
collection: collectionPath,
* @param collectionPath Firestore collection path
collectionPath: string,
const docRef = doc(firestore, collectionPath, docId);
const collectionRef = collection(firestore, collectionPath);
const docRef = await addDoc(collectionRef, data);
* @param collectionPath Firestore collection path
collectionPath: string,
await this.deleteDataFromFirestore(collectionPath, docId);
collection: collectionPath,
* @param collectionPath Firestore collection path
collectionPath: string,
const docRef = doc(firestore, collectionPath, docId);
collection: operation.collection
if (operation.collection && operation.data) {
operation.collection,
if (operation.collection && operation.docId) {
await this.deleteDataFromFirestore(operation.collection, operation.docId);
collection: operation.collection,
// In a real implementation, you would need to scan through relevant collections
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
docId?: string;
* @param docId Document ID
docId: string,
const cacheKey = `${CACHE_PREFIX}${collectionPath}_${docId}`;
return this.getDataFromFirestore<T>(collectionPath, docId);
const data = await this.getDataFromFirestore<T>(collectionPath, docId);
const data = await this.getDataFromFirestore<T>(collectionPath, docId);
* @param docId Document ID
docId: string
const docRef = doc(firestore, collectionPath, docId);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
return docSnap.data() as T;
querySnapshot.forEach(doc => {
data.push({ id: doc.id, ...doc.data() } as T);
* @param docId Document ID (optional, will be generated if not provided)
docId?: string
return this.saveDataToFirestore(collectionPath, data, docId);
type: docId ? 'update' : 'create',
docId,
return docId || `temp_${operationId}`;
* @param docId Document ID (optional, will be generated if not provided)
docId?: string
if (docId) {
// Update existing document
const docRef = doc(firestore, collectionPath, docId);
await setDoc(docRef, data, { merge: true });
return docId;
// Create new document
const docRef = await addDoc(collectionRef, data);
return docRef.id;
* @param docId Document ID
docId: string
await this.deleteDataFromFirestore(collectionPath, docId);
docId,
* @param docId Document ID
docId: string
const docRef = doc(firestore, collectionPath, docId);
await deleteDoc(docRef);
const docId = await this.saveDataToFirestore(
operation.type === 'update' ? operation.docId : undefined
if (operation.type === 'create' && operation.docId && operation.docId.startsWith('temp_')) {
await this.updateTempIdReferences(operation.docId, docId);
if (operation.collection && operation.docId) {
await this.deleteDataFromFirestore(operation.collection, operation.docId);
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
const docSnap = await getDoc(docRef);
const querySnapshot = await getDocs(queryRef);
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
await setDoc(docRef, data, { merge: true });
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
await deleteDoc(docRef);
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
* @param queryParams Query parameters
public async queryData<T>(
queryParams: {
const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
// Create cache key from query parameters
const cacheKey = `${CACHE_PREFIX}${collectionPath}_query_${JSON.stringify(queryParams)}`;
// If offline mode is disabled, query data from Firestore
return this.queryDataFromFirestore<T>(collectionPath, queryParams);
// If online and force refresh, query data from Firestore
const data = await this.queryDataFromFirestore<T>(collectionPath, queryParams);
// If online, query data from Firestore
const data = await this.queryDataFromFirestore<T>(collectionPath, queryParams);
console.error('Error querying data:', error);
* @param queryParams Query parameters
private async queryDataFromFirestore<T>(
queryParams: {
const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
// Build query
let queryRef = query(collectionRef);
queryRef = query(queryRef, where(field, operator, value));
queryRef = query(queryRef, orderBy(orderByField, orderByDirection || 'asc'));
queryRef = query(queryRef, limit(limitTo));
// Execute query
const querySnapshot = await getDocs(queryRef);
querySnapshot.forEach(doc => {
console.error('Error querying data from Firestore:', error);
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
// Add where clause if field, operator, and value are provided
queryRef = query(queryRef, where(field, operator, value));
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
orderByField?: string;
orderByDirection?: 'asc' | 'desc';
const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
orderByField?: string;
orderByDirection?: 'asc' | 'desc';
const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
// Add orderBy clause if orderByField is provided
if (orderByField) {
queryRef = query(queryRef, orderBy(orderByField, orderByDirection || 'asc'));
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
limitTo?: number;
const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
limitTo?: number;
const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
// Add limit clause if limitTo is provided
if (limitTo) {
queryRef = query(queryRef, limit(limitTo));
// If online and force refresh, get data from Firestore
// If online and force refresh, query data from Firestore
// Create collection reference
// If this was a create operation, update any references to the temporary ID
* Update references to temporary IDs
// This is a placeholder for updating references to temporary IDs
// and update any references to the temporary ID with the actual ID
console.log(`Updating references from temporary ID ${tempId} to actual ID ${actualId}`);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');
```

## Migration Guide for services/optimizedUserService.ts

### Current Imports

```javascript
import { FirebaseError } from 'firebase/app';
import { getAuth, updateProfile } from 'firebase/auth';
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
return auth.currentUser?.uid || null;
collection,
// Embedded preferences (previously in separate collection)
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
// For backward compatibility, also update the preferences subcollection
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
console.error('optimizedUserService: Error updating preferences subcollection:', prefsError);
// For audit purposes, also log to a separate collection
console.error('optimizedUserService: Error logging verification data to audit collection:', auditError);
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const userPicksRef = collection(firestore, 'userPicks');
doc,
// Embedded verification data (previously scattered across user document)
const userRef = doc(firestore, 'users', uid);
console.log(`optimizedUserService: User document does not exist for ${uid}`);
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const userRef = doc(firestore, 'users', userId);
// Check if user document exists
console.log(`optimizedUserService: Updating existing user document for ${userId}`);
info(LogCategory.USER, 'Updating existing user document', { userId });
// Update existing document
// Replace document
console.log(`optimizedUserService: Creating new user document for ${userId}`);
info(LogCategory.USER, 'Creating new user document', { userId });
// Create new document
console.log(`optimizedUserService: User document updated successfully for ${userId}`);
info(LogCategory.USER, 'User document updated successfully', { userId });
// Update user document with new preferences
const userRef = doc(firestore, 'users', userId);
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
// Update user document
const verificationRef = doc(firestore, 'verifications', `${userId}_${verificationType}_${Date.now()}`);
// Update user document
// Update user document
const pickRef = doc(firestore, 'aiPicks', pickId);
// Update user document
const pickRef = doc(firestore, 'aiPicks', pickId);
const userRef = doc(firestore, 'users', userId);
// Get user document
console.log(`optimizedUserService: User document does not exist for ${userId}`);
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const streaksRef = doc(firestore, 'userStreaks', userId);
userPicksSnapshot.forEach(doc => {
const pickData = doc.data();
// Update user document with optimized data
getDoc,
getDocs,
const userDoc = await getDoc(userRef);
const prefsDoc = await getDoc(prefsDocRef);
const userDoc = await getDoc(userRef);
const userDoc = await getDoc(userRef);
const prefsDoc = await getDoc(prefsDocRef);
const streaksDoc = await getDoc(streaksRef);
const userPicksSnapshot = await getDocs(userPicksQuery);
setDoc,
await setDoc(userRef, updateData);
await setDoc(userRef, {
await setDoc(prefsDocRef, updatedPreferences, { merge: true });
await setDoc(verificationRef, {
await setDoc(userRef, optimizedData, { merge: true });
updateDoc,
await updateDoc(userRef, updateData);
await updateDoc(pickRef, {
await updateDoc(pickRef, {
query,
const userPicksQuery = query(userPicksRef, where('userId', '==', userId));
where,
const userPicksQuery = query(userPicksRef, where('userId', '==', userId));
// Embedded followed picks (limited to recent/active)
// Embedded preferences (previously in separate collection)
preferences?: {
notificationPreferences?: {
* Default user preferences
const defaultPreferences = {
notificationPreferences: {
preferences: defaultPreferences,
// Fetch preferences if not embedded yet (for backward compatibility)
if (!userData.preferences) {
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const prefsDoc = await getDoc(prefsDocRef);
if (prefsDoc.exists()) {
userData.preferences = {
...defaultPreferences,
...prefsDoc.data()
userData.preferences = defaultPreferences;
} catch (prefsError) {
console.error('optimizedUserService: Error fetching preferences:', prefsError);
userData.preferences = defaultPreferences;
* Update user preferences with denormalized approach
* @param preferences Preferences to update
export const updateUserPreferences = async (
preferences: Partial<OptimizedUserData['preferences']>
// Merge with existing preferences
const updatedPreferences = {
...userData.preferences,
...preferences
// Update user document with new preferences
preferences: updatedPreferences
// For backward compatibility, also update the preferences subcollection
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
await setDoc(prefsDocRef, updatedPreferences, { merge: true });
} catch (prefsError) {
console.error('optimizedUserService: Error updating preferences subcollection:', prefsError);
console.error('optimizedUserService: Error updating user preferences:', error);
logError(LogCategory.USER, 'Error updating user preferences', error as Error);
if (!userData || !userData.preferences) {
throw new Error('User preferences not found');
const favoriteTeams = userData.preferences.favoriteTeams || [];
// Update user preferences
await updateUserPreferences(userId, {
if (!userData || !userData.preferences) {
throw new Error('User preferences not found');
const favoriteTeams = userData.preferences.favoriteTeams || [];
// Update user preferences
await updateUserPreferences(userId, {
preferences: {},
// Migrate preferences
const prefsDocRef = doc(collection(userRef, 'preferences'), 'sports');
const prefsDoc = await getDoc(prefsDocRef);
if (prefsDoc.exists()) {
optimizedData.preferences = prefsDoc.data() as any;
optimizedData.preferences = defaultPreferences;
} catch (prefsError) {
console.error('optimizedUserService: Error migrating preferences:', prefsError);
optimizedData.preferences = defaultPreferences;
updateUserPreferences,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/parlayOddsService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
// Find the outcome where the name matches the selection
// Find the outcome where the name matches the selection
* @returns Value indicator (-1 to 1, where positive is good value)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/parlayService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/personalizationService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
* This service manages user preferences and personalization options.
* It allows users to set default sportsbooks, sports, and other preferences.
// User preferences interface
export interface UserPreferences {
notificationPreferences?: {
displayPreferences?: {
private userPreferences: UserPreferences = {};
private readonly STORAGE_KEY = 'user_preferences';
// Load user preferences
await this.loadUserPreferences();
if (Object.keys(this.userPreferences).length === 0) {
// Set default sport based on language preference
this.userPreferences = {
notificationPreferences: {
displayPreferences: {
await this.saveUserPreferences();
// Get user preferences
public async getUserPreferences(): Promise<UserPreferences> {
return this.userPreferences;
// Set user preferences
public async setUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
// Merge new preferences with existing ones
this.userPreferences = {
...this.userPreferences,
...preferences,
// Save user preferences
await this.saveUserPreferences();
// Track preference changes in analytics
event_name: 'preferences_updated',
...Object.keys(preferences).reduce((obj, key) => {
obj[`preference_${key}`] = preferences[key as keyof UserPreferences];
await this.setUserPreferences({ defaultSport: sport });
// Track specific preference change
await this.setUserPreferences({ defaultSportsbook: sportsbook });
// Track specific preference change
const favoriteTeams = [...(this.userPreferences.favoriteTeams || [])];
await this.setUserPreferences({ favoriteTeams });
// Track specific preference change
const favoriteTeams = [...(this.userPreferences.favoriteTeams || [])];
await this.setUserPreferences({ favoriteTeams });
// Track specific preference change
const favoriteLeagues = [...(this.userPreferences.favoriteLeagues || [])];
await this.setUserPreferences({ favoriteLeagues });
// Track specific preference change
const favoriteLeagues = [...(this.userPreferences.favoriteLeagues || [])];
await this.setUserPreferences({ favoriteLeagues });
// Track specific preference change
const hiddenSportsbooks = [...(this.userPreferences.hiddenSportsbooks || [])];
await this.setUserPreferences({ hiddenSportsbooks });
// Track specific preference change
const hiddenSportsbooks = [...(this.userPreferences.hiddenSportsbooks || [])];
await this.setUserPreferences({ hiddenSportsbooks });
// Track specific preference change
// Set notification preferences
public async setNotificationPreferences(preferences: Partial<UserPreferences['notificationPreferences']>): Promise<void> {
const notificationPreferences = {
...(this.userPreferences.notificationPreferences || {
...preferences
await this.setUserPreferences({ notificationPreferences });
// Track specific preference change
event_name: 'notification_preferences_updated',
...Object.entries(preferences || {}).reduce((obj, [key, value]) => {
// Set display preferences
public async setDisplayPreferences(preferences: Partial<UserPreferences['displayPreferences']>): Promise<void> {
const displayPreferences = {
...(this.userPreferences.displayPreferences || {
...preferences
await this.setUserPreferences({ displayPreferences });
// Track specific preference change
event_name: 'display_preferences_updated',
...Object.entries(preferences || {}).reduce((obj, [key, value]) => {
const favoritePlayers = [...(this.userPreferences.favoritePlayers || [])];
await this.setUserPreferences({ favoritePlayers });
// Track specific preference change
const favoritePlayers = [...(this.userPreferences.favoritePlayers || [])];
await this.setUserPreferences({ favoritePlayers });
// Track specific preference change
await this.setUserPreferences({ favoritePlayers: players });
// Track specific preference change
// Reset user preferences to defaults
public async resetPreferences(): Promise<void> {
// Set default sport based on language preference
// Spanish users might prefer soccer over basketball
this.userPreferences = {
defaultOddsFormat: isSpanishUser ? 'decimal' : 'american', // Spanish users typically prefer decimal odds
notificationPreferences: {
displayPreferences: {
// Save user preferences
await this.saveUserPreferences();
event_name: 'preferences_reset'
// Load user preferences from storage
private async loadUserPreferences(): Promise<void> {
const preferencesString = await AsyncStorage.getItem(storageKey);
if (preferencesString) {
// Parse preferences with error handling
const parsedPreferences = JSON.parse(preferencesString);
// Validate the parsed preferences
if (typeof parsedPreferences === 'object' && parsedPreferences !== null) {
this.userPreferences = parsedPreferences;
// If preferences are invalid, set to empty object
this.userPreferences = {};
console.warn('Invalid user preferences format, resetting to defaults');
console.error('Error parsing user preferences:', parseError);
this.userPreferences = {};
// No preferences found, initialize with empty object
this.userPreferences = {};
console.error('Error loading user preferences:', error);
// Set empty preferences on error
this.userPreferences = {};
// Save user preferences to storage
private async saveUserPreferences(): Promise<void> {
// Add a timestamp to track when preferences were last saved
const preferencesToSave = {
...this.userPreferences,
JSON.stringify(preferencesToSave)
console.error(`Error saving user preferences (attempt ${retries}/${maxRetries}):`, error);
event_name: 'preferences_save_failed',
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/playerStatsService.ts

### Current Imports

```javascript
import { serverTimestamp, collection, doc, getDocs, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { serverTimestamp, collection, doc, getDocs, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
const playerCollection = collection(firestore, 'playerPlusMinus');
const playerCollection = collection(firestore, 'playerPlusMinus');
const playerCollection = collection(firestore, 'playerPlusMinus');
const playerCollection = collection(firestore, 'playerPlusMinus');
import { serverTimestamp, collection, doc, getDocs, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
// Create document reference
const docRef = doc(playerCollection, `${gameId}_${player.id}`);
batch.set(docRef, playerData);
const docRef = doc(playerCollection, `${gameId}_${playerId}`);
const docSnap = await getDocs(query(playerCollection, where('gameId', '==', gameId), where('playerId', '==', playerId)));
if (!docSnap.empty) {
return docSnap.docs[0].data() as PlayerPlusMinus;
querySnapshot.forEach((docSnap) => {
const data = docSnap.data();
snapshot.forEach((docSnap) => {
const data = docSnap.data();
import { serverTimestamp, collection, doc, getDocs, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
const docSnap = await getDocs(query(playerCollection, where('gameId', '==', gameId), where('playerId', '==', playerId)));
const querySnapshot = await getDocs(q);
import { serverTimestamp, collection, doc, getDocs, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
const docSnap = await getDocs(query(playerCollection, where('gameId', '==', gameId), where('playerId', '==', playerId)));
const q = query(playerCollection, where('gameId', '==', gameId));
const querySnapshot = await getDocs(q);
querySnapshot.forEach((docSnap) => {
const q = query(playerCollection, where('gameId', '==', gameId));
import { serverTimestamp, collection, doc, getDocs, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
const docSnap = await getDocs(query(playerCollection, where('gameId', '==', gameId), where('playerId', '==', playerId)));
const q = query(playerCollection, where('gameId', '==', gameId));
const q = query(playerCollection, where('gameId', '==', gameId));
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
// Create document reference
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');
```

## Migration Guide for services/playersService.js

### Current Service Usage

```javascript
* @param {string} query - Search query
export async function searchPlayers(query, sportFilters = null) {
// If no query, return all players
if (!query) {
const normalizedQuery = query.toLowerCase();
* @param {number} limit - Maximum number of players to return
export async function getPopularPlayers(sport = null, limit = 10) {
return sortedPlayers.slice(0, limit);
return sortedPlayers.slice(0, limit);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/pushNotificationService.ts

### Current Imports

```javascript
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
const notificationsRef = collection(firestore, 'scheduledNotifications');
const notificationsRef = collection(firestore, 'scheduledNotifications');
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
// Note: OneSignal import is commented out until proper API documentation is available
* implemented according to the OneSignal API documentation for version 5.2.9.
* Note: This method needs to be implemented according to the OneSignal API documentation.
* Note: This method needs to be implemented according to the OneSignal API documentation.
* Note: This method needs to be implemented according to the OneSignal API documentation.
const docRef = doc(firestore, 'users', userId, 'settings', 'notifications');
const docSnap = await getDoc(docRef);
if (!docSnap.exists()) {
return docSnap.data() as NotificationPreferences;
const docRef = doc(firestore, 'users', userId, 'settings', 'notifications');
await setDoc(docRef, preferences);
* Note: This method needs to be implemented according to the OneSignal API documentation.
const docRef = await addDoc(notificationsRef, notification);
console.log('Notification scheduled in backend:', docRef.id);
return docRef.id;
const docRef = doc(firestore, 'scheduledNotifications', notificationId);
await deleteDoc(docRef);
return snapshot.docs.map(docSnap => ({
id: docSnap.id,
...docSnap.data()
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
const docSnap = await getDoc(docRef);
const snapshot = await getDocs(q);
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
await setDoc(docRef, preferences);
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
await deleteDoc(docRef);
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
const q = query(
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
where('userId', '==', userId),
where('sent', '==', false),
where('scheduledAt', '>', new Date())
* The Firestore integration for storing notification preferences and scheduled notifications
export interface NotificationPreferences {
private defaultPreferences: NotificationPreferences = {
* Get user notification preferences
public async getNotificationPreferences(): Promise<NotificationPreferences> {
return this.defaultPreferences;
// If preferences don't exist, create default preferences
await this.saveNotificationPreferences(this.defaultPreferences);
return this.defaultPreferences;
return docSnap.data() as NotificationPreferences;
console.error('Error getting notification preferences:', error);
return this.defaultPreferences;
* Save user notification preferences
* @param preferences Notification preferences
public async saveNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
await setDoc(docRef, preferences);
// Update OneSignal tags based on preferences
await this.updateOneSignalTags(preferences);
analyticsService.trackEvent('notification_preferences_updated', {
preferences
console.log('Notification preferences saved:', preferences);
console.error('Error saving notification preferences:', error);
* Update OneSignal tags based on user preferences
* @param preferences Notification preferences
private async updateOneSignalTags(preferences: NotificationPreferences): Promise<void> {
enabled: preferences.enabled.toString(),
gameAlerts: preferences.gameAlerts.toString(),
betReminders: preferences.betReminders.toString(),
specialOffers: preferences.specialOffers.toString(),
newsUpdates: preferences.newsUpdates.toString(),
scoreUpdates: preferences.scoreUpdates.toString(),
playerAlerts: preferences.playerAlerts.toString()
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');
```

## Migration Guide for services/referralNotificationService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
type: 'milestone' | 'referral' | 'subscription_extension' | 'badge';
type: 'referral',
message: 'Your friend John has joined using your referral code.',
message: 'You\'ve reached 5 referrals and earned a premium trial.',
message: 'Your subscription has been extended by 1 month as a reward for your referral.',
message: 'You\'ve earned the Elite Referrer badge for your referral achievements.',
export const referralNotificationService = new ReferralNotificationService();
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/revenueReportingService.ts

### Current Service Usage

```javascript
const reportRecord = await db.query(
const transactions = await db.query(
const previousPeriod = await db.query(
await db.query(
await db.query(
const query = type
const result = await db.query(query, params);
const result = await db.query(
const result = await db.query(
* @param limit - Maximum number of reports to return (optional)
limit: number = 10,
? [type, limit, offset]
: [limit, offset];
limit,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/rewardsService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const currentUserId = auth.currentUser?.uid;
const userRecord = await auth.currentUser?.getIdTokenResult();
if (userRecord && auth.currentUser?.displayName) {
displayName = auth.currentUser.displayName;
} else if (userRecord && auth.currentUser?.email) {
displayName = auth.currentUser.email.split('@')[0];
* @param limit Maximum number of entries to return
limit: number = 10
// Return limited number of entries
return rankedLeaderboard.slice(0, limit);
async getLeaderboardData(limit: number = 10): Promise<LeaderboardData> {
const allTimeEntries = await this.getReferralLeaderboard('allTime', limit);
referralCount: 0,
* Record a referral
async recordReferral(userId: string, referredUserId: string): Promise<{
// Increment referral count
rewards.referralCount += 1;
// Add loyalty points for the referral
if (socialButterflyAchievement && !socialButterflyAchievement.isUnlocked && rewards.referralCount >= 5) {
referral_count: rewards.referralCount
// Track referral reward earned
trackEvent('referral_reward_earned', {
referral_count: rewards.referralCount,
updatedReferralCount: rewards.referralCount,
console.error('Error recording referral:', error);
* Generate a referral code for a user
// If user already has a referral code, return it
if (rewards.referralCode) {
return rewards.referralCode;
// Generate a new referral code
const referralCode = await this.createReferralCode(userId);
// Save the referral code to the user's rewards
rewards.referralCode = referralCode;
trackEvent('referral_code_generated', {
referral_code: referralCode
return referralCode;
console.error('Error generating referral code:', error);
* Create a unique referral code
const prefix = 'SPORT';
return `${prefix}-${randomPart}-${userPart}`;
* Get referral leaderboard
{ userId: 'user1', displayName: 'BettingPro', referralCount: 24, badgeType: 'hall-of-fame' as BadgeType },
{ userId: 'user2', displayName: 'SportsFan99', referralCount: 18, badgeType: 'elite' as BadgeType },
{ userId: 'user3', displayName: 'PredictionKing', referralCount: 15, badgeType: 'elite' as BadgeType },
{ userId: 'user4', displayName: 'BetMaster', referralCount: 12, badgeType: 'elite' as BadgeType },
{ userId: 'user5', displayName: 'OddsWizard', referralCount: 10, badgeType: 'elite' as BadgeType },
{ userId: 'user6', displayName: 'StatsGuru', referralCount: 8, badgeType: 'rookie' as BadgeType },
{ userId: 'user7', displayName: 'PicksExpert', referralCount: 7, badgeType: 'rookie' as BadgeType },
{ userId: 'user8', displayName: 'BetInsider', referralCount: 6, badgeType: 'rookie' as BadgeType },
{ userId: 'user9', displayName: 'LineBreaker', referralCount: 5, badgeType: 'rookie' as BadgeType },
{ userId: 'user10', displayName: 'ParlaySage', referralCount: 4, badgeType: 'rookie' as BadgeType }
if (currentUserId && userRewards && userRewards.referralCount > 0) {
// Determine badge type based on referral count
if (userRewards.referralCount >= 20) {
} else if (userRewards.referralCount >= 10) {
referralCount: userRewards.referralCount,
// Sort by referral count (descending)
const sortedLeaderboard = mockLeaderboard.sort((a, b) => b.referralCount - a.referralCount);
console.error('Error getting referral leaderboard:', error);
* Get user's referral milestone progress
const referralCount = rewards.referralCount || 0;
isUnlocked: referralCount >= 3
isUnlocked: referralCount >= 5
isUnlocked: referralCount >= 10
isUnlocked: referralCount >= 20
currentReferrals: referralCount,
console.error('Error getting referral milestone progress:', error);
* Get user's referral badge type
// Otherwise, determine badge type based on referral count
const referralCount = rewards.referralCount || 0;
if (referralCount >= 20) {
} else if (referralCount >= 10) {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/rssAnalyticsService.js

### Current Service Usage

```javascript
* @param {string} platform - Platform where it was shared (e.g., 'twitter', 'facebook')
* @param {number} [limit] - Maximum number of items to return
export async function getPopularNewsItems(timeframe = 'day', limit = 10) {
const response = await fetch(`/api/analytics/rss/popular?timeframe=${timeframe}&limit=${limit}`);
* @param {number} [limit] - Maximum number of topics to return
export async function getTrendingTopics(timeframe = 'day', limit = 10) {
const response = await fetch(`/api/analytics/rss/trending?timeframe=${timeframe}&limit=${limit}`);
PREFERENCES_UPDATED: 'rss_preferences_updated',
PREFERENCES_OPENED: 'rss_preferences_opened',
PREFERENCES_CLOSED: 'rss_preferences_closed',
ANALYTICS_PREFERENCE_CHANGED: 'rss_analytics_preference_changed'
* Track when preferences are updated
* @param {string} preferenceType - Type of preference (e.g., 'sources', 'keywords')
* @param {Object} newValue - New value of the preference
export function trackPreferencesUpdated(preferenceType, newValue, metadata = {}) {
preference_type: preferenceType,
* Track when RSS preferences modal is opened
export function trackPreferencesOpened(metadata = {}) {
* Track when RSS preferences modal is closed
export function trackPreferencesClosed(timeSpent, metadata = {}) {
* Track when a source is toggled in preferences
* Track when an analytics preference is changed
* @param {string} preference - Preference that was changed
export function trackAnalyticsPreferenceChanged(preference, value, metadata = {}) {
preference,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/rugbyService.ts

### Current Imports

```javascript
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
userId: string = auth.currentUser?.uid || ''
userId: string = auth.currentUser?.uid || ''
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
const purchasesSnapshot = await db.collection('users').doc(userId)
.collection('purchases')
const purchasesSnapshot = await db.collection('users').doc(userId)
const purchasesSnapshot = await db.collection('users').doc(userId)
.where('productId', '==', 'rugby-match-prediction')
.where('matchId', '==', matchId)
.where('status', '==', 'succeeded')
.where('productId', '==', 'rugby-team-analysis')
.where('teamId', '==', teamId)
.where('status', '==', 'succeeded')
.limit(1)
.limit(1)
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/searchService.js

### Current Service Usage

```javascript
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
* @param {string} query Search query
async search(query, filters = {}) {
// Normalize query
const normalizedQuery = query.trim().toLowerCase();
* @param {string} query Search query
async searchNews(query, filters = {}) {
if (query.includes('basketball')) {
} else if (query.includes('nfl')) {
* @param {string} query Search query
async searchTeams(query, filters = {}) {
if (query.includes('warriors')) {
} else if (query.includes('nfl')) {
* @param {string} query Search query
async searchPlayers(query, filters = {}) {
if (query.includes('lebron')) {
} else if (query.includes('curry')) {
* @param {string} query Search query
async searchOdds(query, filters = {}) {
if (query.includes('basketball') || query.includes('warriors') || query.includes('celtics')) {
} else if (query.includes('nfl') || query.includes('chiefs') || query.includes('49ers')) {
query: 'basketball',
query: 'nfl',
* Save a search query to history
* @param {string} query Search query
async saveSearchQuery(userId, query, resultCount = 0, filters = {}) {
console.log(`Saved search query "${query}" for user ${userId}`);
console.error('Error saving search query:', error);
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } = require('firebase/firestore');
* Get search preferences for a user
* @returns {Promise<Object>} Search preferences
async getSearchPreferences(userId) {
// For demo purposes, return default preferences
return this.getDefaultSearchPreferences();
console.error('Error getting search preferences:', error);
return this.getDefaultSearchPreferences();
* Update search preferences for a user
* @param {Object} preferences Search preferences
async updateSearchPreferences(userId, preferences) {
console.log(`Updated search preferences for user ${userId}`);
console.error('Error updating search preferences:', error);
* Get default search preferences
* @returns {Object} Default search preferences
getDefaultSearchPreferences() {
preferredContentTypes: ['news', 'teams', 'players', 'odds']
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');
```

## Migration Guide for services/searchService.ts

### Current Imports

```javascript
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
let newsQuery = collection(firestore, 'news');
let teamsQuery = collection(firestore, 'teams');
let playersQuery = collection(firestore, 'players');
let oddsQuery = collection(firestore, 'odds');
collection(firestore, 'searchHistory'),
await addDoc(collection(firestore, 'searchHistory'), historyItem);
collection(firestore, 'searchHistory'),
collection(firestore, 'searchPreferences'),
collection(firestore, 'searchPreferences'),
await addDoc(collection(firestore, 'searchPreferences'), {
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
return snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
await deleteDoc(doc(firestore, 'searchHistory', item.id));
const deletePromises = snapshot.docs.map(doc =>
deleteDoc(doc.ref)
return snapshot.docs[0].data() as SearchPreferences;
await updateDoc(snapshot.docs[0].ref, preferencesData);
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
const snapshot = await getDocs(historyQuery);
const snapshot = await getDocs(historyQuery);
const snapshot = await getDocs(preferencesQuery);
const snapshot = await getDocs(preferencesQuery);
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
await updateDoc(snapshot.docs[0].ref, preferencesData);
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
await deleteDoc(doc(firestore, 'searchHistory', item.id));
deleteDoc(doc.ref)
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
query: string;
* @param query Search query
async search(query: string, filters?: SearchFilters): Promise<SearchResults> {
// Normalize query
const normalizedQuery = query.trim().toLowerCase();
* @param query Search query
async searchNews(query: string, filters?: SearchFilters): Promise<NewsSearchResult[]> {
// Create base query
// For now, we'll use a simple contains query which is not efficient for production
// This would need to be implemented with a more complex query or in-memory filtering
// This would need to be implemented with a more complex query or in-memory filtering
// Execute query and process results
* @param query Search query
async searchTeams(query: string, filters?: SearchFilters): Promise<TeamSearchResult[]> {
// Create base query
// This would need to be implemented with a more complex query or in-memory filtering
// This would need to be implemented with a more complex query or in-memory filtering
// Execute query and process results
* @param query Search query
async searchPlayers(query: string, filters?: SearchFilters): Promise<PlayerSearchResult[]> {
// Create base query
// This would need to be implemented with a more complex query or in-memory filtering
// This would need to be implemented with a more complex query or in-memory filtering
// Execute query and process results
* @param query Search query
async searchOdds(query: string, filters?: SearchFilters): Promise<OddsSearchResult[]> {
// Create base query
// This would need to be implemented with a more complex query or in-memory filtering
// This would need to be implemented with a more complex query or in-memory filtering
// Execute query and process results
const historyQuery = query(
* Save a search query to history
* @param query Search query
query: string,
query,
console.error('Error saving search query:', error);
const historyQuery = query(
const preferencesQuery = query(
const preferencesQuery = query(
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
where('userId', '==', userId),
where('userId', '==', userId)
where('userId', '==', userId),
where('userId', '==', userId),
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
orderBy('timestamp', 'desc'),
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
* @param limit Maximum number of history items to return
limit(maxItems)
limit(1)
limit(1)
export interface SearchPreferences {
preferredContentTypes: string[];
// Get user preferences to check if history should be saved
const preferences = await this.getSearchPreferences(userId);
if (!preferences.saveHistory) {
if (preferences.maxHistoryItems > 0) {
if (allHistory.length > preferences.maxHistoryItems) {
const itemsToDelete = allHistory.slice(preferences.maxHistoryItems);
deleteDoc(doc.ref)
* Get search preferences for a user
* @returns Search preferences
async getSearchPreferences(userId: string): Promise<SearchPreferences> {
const preferencesQuery = query(
collection(firestore, 'searchPreferences'),
const snapshot = await getDocs(preferencesQuery);
// Return default preferences
return this.getDefaultSearchPreferences();
return snapshot.docs[0].data() as SearchPreferences;
console.error('Error getting search preferences:', error);
return this.getDefaultSearchPreferences();
* Update search preferences for a user
* @param preferences Search preferences
async updateSearchPreferences(userId: string, preferences: SearchPreferences): Promise<void> {
const preferencesQuery = query(
collection(firestore, 'searchPreferences'),
const snapshot = await getDocs(preferencesQuery);
// Create new preferences
await addDoc(collection(firestore, 'searchPreferences'), {
...preferences
// Update existing preferences
// Convert preferences to a plain object for Firestore
const preferencesData = {
defaultFilters: preferences.defaultFilters,
saveHistory: preferences.saveHistory,
showRecentSearches: preferences.showRecentSearches,
autocompleteEnabled: preferences.autocompleteEnabled,
maxHistoryItems: preferences.maxHistoryItems,
preferredContentTypes: preferences.preferredContentTypes
await updateDoc(snapshot.docs[0].ref, preferencesData);
console.error('Error updating search preferences:', error);
* Get default search preferences
* @returns Default search preferences
private getDefaultSearchPreferences(): SearchPreferences {
preferredContentTypes: ['news', 'teams', 'players', 'odds']
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await deleteDoc(docRef);
// With:
await firebaseService.deleteDocument('collection', 'docId');
```

## Migration Guide for services/sportsDataService.ts

### Current Service Usage

```javascript
async searchUFCFighters(query: string): Promise<UFCFighter[]> {
return await ufcService.searchFighters(query);
return handleApiError(`Error searching UFC fighters for "${query}"`, error);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/stripeTaxService.js

### Current Service Usage

```javascript
const transaction = await db.query(
await db.query(
const transactions = await db.query(
const result = await db.query(
limit: 100,
reference: item.id || `item_${Date.now()}`,
* @param {string} options.reference - Reference ID (e.g., payment intent ID)
reference,
if (!reference) throw new Error('Reference ID is required');
reference,
reference,
await storeTransactionInDatabase(taxTransaction, reference);
reference,
reference: item.id || `item_${Date.now()}`,
* @param {string} reference - Reference ID (e.g., payment intent ID)
async function storeTransactionInDatabase(taxTransaction, reference) {
[reference]
logger.warn('Transaction not found in database', { reference });
reference,
reference: 'test_item',
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/stripeTaxService.ts

### Current Service Usage

```javascript
const transaction = await db.query(
reference: item.id || `item_${Date.now()}`,
reference,
reference: string;
logger.warn('Stripe Tax is disabled, skipping transaction recording', { reference });
if (!reference) throw new Error('Reference ID is required');
reference,
reference,
await storeTransactionInDatabase(taxTransaction, reference);
reference,
* @param reference - Reference ID (e.g., payment intent ID)
reference: string
[reference]
logger.warn('Transaction not found in database', { reference });
reference,
reference,
reference: 'test_item',
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/subscriptionAnalyticsService.ts

### Current Imports

```javascript
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { auth, firestore, functions } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
collection,
const subscriptionsCollectionRef = collection(userDocRef, 'subscriptions');
const purchasesCollectionRef = collection(userDocRef, 'purchases');
doc,
const userDocRef = doc(firestore, 'users', userId);
subscriptionsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
const data = doc.data() as SubscriptionData;
purchasesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
const data = doc.data() as PurchaseData;
getDocs,
const subscriptionsSnapshot = await getDocs(subscriptionsCollectionRef);
const purchasesSnapshot = await getDocs(purchasesCollectionRef);
query,
where,
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
const generateReportFunc = httpsCallable(functions, 'generateSubscriptionReport');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for services/subscriptionService.ts

### Current Imports

```javascript
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const firestore = getFirestore();
const functions = getFunctions();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const subscriptionsRef = collection(firestore, 'users', userId, 'subscriptions');
const giftSubscriptionsRef = collection(firestore, 'giftSubscriptions');
const giftSubscriptionsRef = collection(firestore, 'giftSubscriptions');
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// Get user document
const userDocRef = doc(firestore, 'users', userId);
// Get the subscription document
const subscriptionDoc = await getDoc(doc(subscriptionsRef, userData.subscriptionId));
// Get the gift subscription document
const giftSubscriptionRef = doc(firestore, 'giftSubscriptions', code);
querySnapshot.forEach((doc) => {
id: doc.id,
...doc.data()
querySnapshot.forEach((doc) => {
id: doc.id,
...doc.data()
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const userDoc = await getDoc(userDocRef);
const subscriptionDoc = await getDoc(doc(subscriptionsRef, userData.subscriptionId));
const giftSubscriptionDoc = await getDoc(giftSubscriptionRef);
const querySnapshot = await getDocs(q);
const querySnapshot = await getDocs(q);
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const q = query(giftSubscriptionsRef, where('purchasedBy', '==', userId));
const querySnapshot = await getDocs(q);
// Convert query snapshot to array of gift subscriptions
querySnapshot.forEach((doc) => {
const q = query(giftSubscriptionsRef, where('redeemedBy', '==', userId));
const querySnapshot = await getDocs(q);
// Convert query snapshot to array of gift subscriptions
querySnapshot.forEach((doc) => {
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
const q = query(giftSubscriptionsRef, where('purchasedBy', '==', userId));
const q = query(giftSubscriptionsRef, where('redeemedBy', '==', userId));
import { getFunctions, httpsCallable } from 'firebase/functions';
const createGiftSubscriptionFn = httpsCallable(functions, 'createGiftSubscription');
const redeemGiftSubscriptionFn = httpsCallable(functions, 'redeemGiftSubscription');
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);

// Replace:
const functionRef = httpsCallable(functions, 'functionName');
const result = await functionRef(data);
// With:
const result = await firebaseService.callFunction('functionName', data);
```

## Migration Guide for services/teamsService.js

### Current Service Usage

```javascript
* @param {string} query - Search query
export async function searchTeams(query, sportFilters = null) {
// If no query, return all teams
if (!query) {
const normalizedQuery = query.toLowerCase();
* @param {number} limit - Maximum number of teams to return
export async function getPopularTeams(sport = null, limit = 10) {
return sortedTeams.slice(0, limit);
return sortedTeams.slice(0, limit);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/ufcService.ts

### Current Service Usage

```javascript
async searchFighters(query: string): Promise<UFCFighter[]> {
const searchResults = await fetchFromSherdogApi<any>('/search', { q: query, type: 'fighters' });
console.error(`Error searching fighters from Sherdog for "${query}":`, sherdogError);
// Filter fighters based on query
const normalizedQuery = query.toLowerCase();
console.error(`Error searching fighters for "${query}":`, error);
return handleUfcApiError(`Error searching fighters for "${query}"`, error, [] as UFCFighter[]);
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
// Extract the actual fighter ID from our prefixed ID format
// Extract the actual event ID from our prefixed ID format
// If the result is just a reference, fetch the full fighter details
// Extract the actual fight ID from our prefixed ID format
// Extract the actual fight ID from our prefixed ID format
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/userPreferencesService.js

### Current Imports

```javascript
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
const userDoc = await getDoc(doc(db, 'users', userId));
const userDoc = await getDoc(doc(db, 'users', userId));
await setDoc(doc(db, 'users', userId), {
await updateDoc(doc(db, 'users', userId), {
const userDoc = await getDoc(doc(db, 'users', userId));
await setDoc(doc(db, 'users', userId), {
await updateDoc(doc(db, 'users', userId), updateData);
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
const userDoc = await getDoc(doc(db, 'users', userId));
const userDoc = await getDoc(doc(db, 'users', userId));
const userDoc = await getDoc(doc(db, 'users', userId));
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
await setDoc(doc(db, 'users', userId), {
await setDoc(doc(db, 'users', userId), {
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
await updateDoc(doc(db, 'users', userId), {
await updateDoc(doc(db, 'users', userId), updateData);
* User Preferences Service for AI Sports Edge
* This module provides functions for managing user preferences
// Default user preferences
// Content preferences
// Channel preferences
* Get user preferences
* @returns {Promise<Object>} User preferences
export const getUserPreferences = async (userId) => {
// User doesn't exist, create with default preferences
// If user exists but doesn't have preferences, use defaults
if (!userData.preferences) {
...userData.preferences
console.error('Error getting user preferences:', error);
* Update user preferences
* @param {Object} preferences - New preferences
export const updateUserPreferences = async (userId, preferences) => {
// User doesn't exist, create with provided preferences
preferences,
// User exists, update preferences
preferences
console.error('Error updating user preferences:', error);
* Update a specific preference
* @param {string} path - Preference path (e.g., 'notifications.predictions')
export const updatePreference = async (userId, path, value) => {
// User doesn't exist, create with default preferences and update the specific path
const preferences = { ...DEFAULT_PREFERENCES };
setNestedValue(preferences, path, value);
preferences,
// User exists, update the specific preference
updateData[`preferences.${path}`] = value;
console.error('Error updating preference:', error);
getUserPreferences,
updateUserPreferences,
updatePreference
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/userPreferencesService.ts

### Current Imports

```javascript
import { auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
class UserPreferencesService {
export const userPreferencesService = new UserPreferencesService();
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/userService.ts

### Current Imports

```javascript
import { FirebaseError } from 'firebase/app';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, updateDoc, setDoc, getDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Initializations

```javascript
const db = getFirestore();
const db = getFirestore();
const db = getFirestore();
const db = getFirestore();
```

### Migration

Remove these initializations and use the firebaseService instead.

### Current Service Usage

```javascript
// Also log to a separate collection for audit purposes
console.log(`userService: Logging ${verificationType} data to audit collection`);
info(LogCategory.USER, `Logging ${verificationType} data to audit collection`, { userId });
console.log(`userService: Successfully logged ${verificationType} data to audit collection`);
info(LogCategory.USER, `Successfully logged ${verificationType} data to audit collection`, { userId });
console.error(`userService: Error logging ${verificationType} data to audit collection:`, auditError);
logError(LogCategory.USER, `Firestore error (${auditError.code}) logging ${verificationType} data to audit collection`, auditError);
logError(LogCategory.USER, `Error logging ${verificationType} data to audit collection`, auditError as Error);
import { getFirestore, doc, updateDoc, setDoc, getDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
const userRef = doc(db, 'users', userId);
console.log(`userService: Checking if user document exists for ${userId}`);
// Check if user document exists
console.log(`userService: User document exists, updating document for ${userId}`);
info(LogCategory.USER, 'Updating existing user document', { userId });
// Update existing document
console.log(`userService: User document updated successfully for ${userId}`);
info(LogCategory.USER, 'User document updated successfully', { userId });
console.log(`userService: User document does not exist, creating new document for ${userId}`);
info(LogCategory.USER, 'Creating new user document', { userId });
// Create new document
console.log(`userService: User document created successfully for ${userId}`);
info(LogCategory.USER, 'User document created successfully', { userId });
} catch (docError) {
console.error(`userService: Error checking/updating user document for ${userId}:`, docError);
if (docError instanceof FirestoreError) {
console.error(`userService: Firestore error code: ${docError.code}`);
logError(LogCategory.USER, `Firestore error (${docError.code}) checking/updating user document`, docError);
logError(LogCategory.USER, 'Error checking/updating user document', docError as Error);
safeErrorCapture(docError as Error);
throw docError;
const userRef = doc(db, 'users', userId);
console.log(`userService: Updating user document with ${verificationType} data`);
// Update user document
console.log(`userService: Successfully updated user document with ${verificationType} data`);
console.error(`userService: Error updating user document with ${verificationType} data:`, updateError);
const verificationRef = doc(db, 'verifications', `${userId}_${verificationType}_${Date.now()}`);
const userRef = doc(db, 'users', userId);
console.log(`userService: Fetching user document for ${userId}`);
console.log(`userService: User document does not exist for ${userId}`);
info(LogCategory.USER, 'User document not found for verification check', { userId });
console.log(`userService: User document fetched for ${userId}, checking ${verificationType} status`);
} catch (docError) {
console.error(`userService: Error fetching user document for ${userId}:`, docError);
if (docError instanceof FirestoreError) {
console.error(`userService: Firestore error code: ${docError.code}`);
logError(LogCategory.USER, `Firestore error (${docError.code}) fetching user document for verification check`, docError);
logError(LogCategory.USER, 'Error fetching user document for verification check', docError as Error);
safeErrorCapture(docError as Error);
const userRef = doc(db, 'users', userId);
console.log(`userService: Fetching user document for ${userId}`);
console.log(`userService: User document does not exist for ${userId}`);
info(LogCategory.USER, 'User document not found for getting verification data', { userId });
console.log(`userService: User document fetched for ${userId}, extracting verification data`);
} catch (docError) {
console.error(`userService: Error fetching user document for ${userId}:`, docError);
if (docError instanceof FirestoreError) {
console.error(`userService: Firestore error code: ${docError.code}`);
logError(LogCategory.USER, `Firestore error (${docError.code}) fetching user document for verification data`, docError);
logError(LogCategory.USER, 'Error fetching user document for verification data', docError as Error);
safeErrorCapture(docError as Error);
import { getFirestore, doc, updateDoc, setDoc, getDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
const userDoc = await getDoc(userRef);
const userDoc = await getDoc(userRef);
const userDoc = await getDoc(userRef);
import { getFirestore, doc, updateDoc, setDoc, getDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
await setDoc(userRef, {
await setDoc(verificationRef, {
import { getFirestore, doc, updateDoc, setDoc, getDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
await updateDoc(userRef, {
await updateDoc(userRef, {
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/userSportsPreferencesService.ts

### Current Imports

```javascript
import { auth, firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
const userId = auth.currentUser?.uid;
collection,
const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');
const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');
const betsCollectionRef = collection(userDocRef, 'bets');
doc,
const userDocRef = doc(db, 'users', userId);
const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');
const userDocRef = doc(db, 'users', userId);
const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');
const userDocRef = doc(db, 'users', userId);
const bets: BetData[] = betsSnapshot.docs.map(doc => doc.data() as BetData);
getDoc,
getDocs,
const userPrefsDoc = await getDoc(prefsDocRef);
const betsSnapshot = await getDocs(betsCollectionRef);
setDoc,
await setDoc(
query,
where,
limit,
* User sports preferences interface
export interface UserSportsPreferences {
notificationPreferences: {
* Default user sports preferences
const defaultPreferences: UserSportsPreferences = {
notificationPreferences: {
* Get user sports preferences
* @returns User sports preferences
export const getUserSportsPreferences = async (): Promise<UserSportsPreferences> => {
const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');
const userPrefsDoc = await getDoc(prefsDocRef);
if (userPrefsDoc.exists()) {
return userPrefsDoc.data() as UserSportsPreferences;
// If no preferences exist, create default ones
await saveUserSportsPreferences(defaultPreferences);
return defaultPreferences;
console.error('Error getting user sports preferences:', error);
return defaultPreferences;
* Save user sports preferences
* @param preferences User sports preferences
export const saveUserSportsPreferences = async (preferences: Partial<UserSportsPreferences>): Promise<void> => {
const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');
prefsDocRef,
preferences,
await trackEvent('sports_preferences_updated', {
favorite_teams_count: preferences.favoriteTeams?.length || 0,
favorite_sports_count: preferences.favoriteSports?.length || 0
console.error('Error saving user sports preferences:', error);
const prefs = await getUserSportsPreferences();
if (!prefs.favoriteTeams.includes(teamName)) {
prefs.favoriteTeams.push(teamName);
await saveUserSportsPreferences({ favoriteTeams: prefs.favoriteTeams });
const prefs = await getUserSportsPreferences();
const index = prefs.favoriteTeams.indexOf(teamName);
prefs.favoriteTeams.splice(index, 1);
await saveUserSportsPreferences({ favoriteTeams: prefs.favoriteTeams });
getUserSportsPreferences,
saveUserSportsPreferences,
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);
```

## Migration Guide for services/venueService.ts

### Current Service Usage

```javascript
* @param limit Maximum number of venues to return (default: 5)
limit = 5
.slice(0, limit);
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

Review the Firebase service usage and replace with appropriate firebaseService methods.

## Migration Guide for services/viewCounterService.ts

### Current Imports

```javascript
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { firestore, auth } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
const user = userId || auth.currentUser?.uid;
const user = userId || auth.currentUser?.uid;
// View counter collection and fields
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
await setDoc(doc(db, VIEW_COUNTERS_COLLECTION, userId), initialData);
const docRef = doc(db, VIEW_COUNTERS_COLLECTION, user);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
const data = docSnap.data();
const docRef = doc(db, VIEW_COUNTERS_COLLECTION, user);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
await updateDoc(docRef, {
await setDoc(docRef, {
await updateDoc(doc(db, VIEW_COUNTERS_COLLECTION, userId), {
await updateDoc(doc(db, VIEW_COUNTERS_COLLECTION, userId), {
const docRef = doc(db, VIEW_COUNTERS_COLLECTION, userId);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
const serverCount = docSnap.data()[FIELD_COUNT] || 0;
await updateDoc(docRef, {
await updateDoc(docRef, {
serverCount: docSnap.exists() ? docSnap.data()[FIELD_COUNT] || 0 : 0
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
const docSnap = await getDoc(docRef);
const docSnap = await getDoc(docRef);
const docSnap = await getDoc(docRef);
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
await setDoc(doc(db, VIEW_COUNTERS_COLLECTION, userId), initialData);
await setDoc(docRef, {
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
await updateDoc(docRef, {
await updateDoc(doc(db, VIEW_COUNTERS_COLLECTION, userId), {
await updateDoc(doc(db, VIEW_COUNTERS_COLLECTION, userId), {
await updateDoc(docRef, {
await updateDoc(docRef, {
reason: 'limit_reached'
reason: 'approaching_limit'
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await updateDoc(docRef, data);
// With:
await firebaseService.updateDocument('collection', 'docId', data);
```

## Migration Guide for services/weatherService.ts

### Current Imports

```javascript
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
```

### Suggested Import

```javascript
import firebaseService from '../services/firebaseService';

```

### Current Service Usage

```javascript
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
const venueDoc = await getDoc(doc(db, 'venues', venueId));
const gameDoc = await getDoc(doc(db, 'games', gameId));
const playerDoc = await getDoc(doc(db, 'players', playerId));
const correlationsDoc = await getDoc(doc(db, 'weatherCorrelations', playerId));
await setDoc(doc(db, 'weatherCorrelations', playerId), {
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
const venueDoc = await getDoc(doc(db, 'venues', venueId));
const gameDoc = await getDoc(doc(db, 'games', gameId));
const playerDoc = await getDoc(doc(db, 'players', playerId));
const correlationsDoc = await getDoc(doc(db, 'weatherCorrelations', playerId));
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
await setDoc(doc(db, 'weatherCorrelations', playerId), {
* @param forceRefresh Force refresh from API
* @param forceRefresh Force refresh from API
```

### Suggested Migration

Replace direct Firebase service calls with firebaseService methods:

```javascript
// Replace:
const docRef = doc(firestore, 'collection', 'docId');
const docSnap = await getDoc(docRef);
const data = docSnap.exists() ? docSnap.data() : null;
// With:
const data = await firebaseService.getDocument('collection', 'docId');

// Replace:
const docRef = doc(firestore, 'collection', 'docId');
await setDoc(docRef, data);
// With:
await firebaseService.setDocument('collection', 'docId', data);
```
