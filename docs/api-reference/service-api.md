# Service API Reference

This document provides detailed API documentation for services in the AI Sports Edge application.

## Table of Contents

- [Firebase Services](#firebase-services)
  - [FirebaseService](#firebaseservice)
  - [FirebaseAuth](#firebaseauth)
  - [FirebaseFirestore](#firebasefirestore)
- [Analytics Services](#analytics-services)
  - [AnalyticsService](#analyticsservice)
  - [BettingAnalyticsService](#bettinganalyticsservice)
  - [EnhancedAnalyticsService](#enhancedanalyticsservice)
- [Data Services](#data-services)
  - [CacheService](#cacheservice)
  - [EnhancedCacheService](#enhancedcacheservice)
  - [DataSyncService](#datasyncservice)
- [Sports Data Services](#sports-data-services)
  - [OddsService](#oddsservice)
  - [UfcOddsService](#ufcoddsservice)
  - [ParlayOddsService](#parlayoddsservice)
  - [TeamsService](#teamsservice)
- [User Services](#user-services)
  - [UserPreferencesService](#userpreferencesservice)
  - [PersonalizationService](#personalizationservice)
  - [SubscriptionService](#subscriptionservice)
- [Monitoring Services](#monitoring-services)
  - [MonitoringService](#monitoringservice)
  - [LoggingService](#loggingservice)
  - [ErrorTrackingService](#errortrackingservice)
- [Payment Services](#payment-services)
  - [PaymentService](#paymentservice)
  - [StripeTaxService](#stripetaxservice)
- [Geolocation Services](#geolocation-services)
  - [GeolocationService](#geolocationservice)
  - [VenueService](#venueservice)
  - [WeatherAdjustmentService](#weatheradjustmentservice)
- [AI Services](#ai-services)
  - [AIPickSelector](#aipickselector)
  - [AIPredictionService](#aipredictionservice)
  - [AINewsAnalysisService](#ainewsanalysisservices)

## Firebase Services

### FirebaseService

The `FirebaseService` handles interactions with Firebase for cross-platform data synchronization.

#### Methods

##### `initialize(): Promise<void>`

Initializes the Firebase service.

**Returns:** A promise that resolves when initialization is complete.

**Example:**

```typescript
import { firebaseService } from 'services/firebaseService';

// Initialize the service
await firebaseService.initialize();
```

##### `getUserData(userId: string, lastSyncTimestamp?: number): Promise<UserData | null>`

Gets user data from Firestore.

**Parameters:**

- `userId: string` - The ID of the user to get data for
- `lastSyncTimestamp?: number` - Optional timestamp to get only data updated after this time

**Returns:** A promise that resolves to the user data or null if not found.

**Example:**

```typescript
import { firebaseService } from 'services/firebaseService';

// Get user data
const userData = await firebaseService.getUserData('user123', Date.now() - 86400000); // Data from last 24 hours
```

##### `updateUserData(userId: string, data: UserData): Promise<void>`

Updates user data in Firestore.

**Parameters:**

- `userId: string` - The ID of the user to update data for
- `data: UserData` - The data to update

**Returns:** A promise that resolves when the update is complete.

**Example:**

```typescript
import { firebaseService } from 'services/firebaseService';

// Update user data
await firebaseService.updateUserData('user123', {
  userPreferences: {
    favoriteTeams: ['team1', 'team2'],
    primaryTeam: 'team1',
    affiliateEnabled: true,
    affiliateCode: 'CODE123',
    buttonSettings: { size: 'medium' },
  },
});
```

##### `getCurrentUserId(): string | null`

Gets the ID of the currently authenticated user.

**Returns:** The user ID or null if not authenticated.

**Example:**

```typescript
import { firebaseService } from 'services/firebaseService';

// Get current user ID
const userId = firebaseService.getCurrentUserId();
if (userId) {
  console.log(`User is authenticated with ID: ${userId}`);
} else {
  console.log('User is not authenticated');
}
```

### FirebaseAuth

The `FirebaseAuth` service handles user authentication with Firebase.

#### Methods

##### `signIn(email: string, password: string): Promise<UserCredential>`

Signs in a user with email and password.

**Parameters:**

- `email: string` - The user's email
- `password: string` - The user's password

**Returns:** A promise that resolves to the user credentials.

**Example:**

```typescript
import { firebaseAuth } from 'atomic/molecules/firebaseAuth';

// Sign in a user
try {
  const userCredential = await firebaseAuth.signIn('user@example.com', 'password123');
  console.log('User signed in:', userCredential.user.uid);
} catch (error) {
  console.error('Sign in error:', error);
}
```

##### `signUp(email: string, password: string): Promise<UserCredential>`

Creates a new user with email and password.

**Parameters:**

- `email: string` - The user's email
- `password: string` - The user's password

**Returns:** A promise that resolves to the user credentials.

**Example:**

```typescript
import { firebaseAuth } from 'atomic/molecules/firebaseAuth';

// Sign up a new user
try {
  const userCredential = await firebaseAuth.signUp('newuser@example.com', 'password123');
  console.log('User created:', userCredential.user.uid);
} catch (error) {
  console.error('Sign up error:', error);
}
```

##### `signOut(): Promise<void>`

Signs out the current user.

**Returns:** A promise that resolves when sign out is complete.

**Example:**

```typescript
import { firebaseAuth } from 'atomic/molecules/firebaseAuth';

// Sign out the current user
await firebaseAuth.signOut();
console.log('User signed out');
```

##### `resetPassword(email: string): Promise<void>`

Sends a password reset email to the specified email address.

**Parameters:**

- `email: string` - The email address to send the reset link to

**Returns:** A promise that resolves when the reset email is sent.

**Example:**

```typescript
import { firebaseAuth } from 'atomic/molecules/firebaseAuth';

// Send password reset email
try {
  await firebaseAuth.resetPassword('user@example.com');
  console.log('Password reset email sent');
} catch (error) {
  console.error('Password reset error:', error);
}
```

### FirebaseFirestore

The `FirebaseFirestore` service handles interactions with Firestore database.

#### Methods

##### `getDocument(collection: string, id: string): Promise<DocumentData | null>`

Gets a document from Firestore.

**Parameters:**

- `collection: string` - The collection to get the document from
- `id: string` - The ID of the document to get

**Returns:** A promise that resolves to the document data or null if not found.

**Example:**

```typescript
import { firebaseFirestore } from 'atomic/molecules/firebaseFirestore';

// Get a document
const document = await firebaseFirestore.getDocument('users', 'user123');
if (document) {
  console.log('Document data:', document);
} else {
  console.log('Document not found');
}
```

##### `setDocument(collection: string, id: string, data: DocumentData): Promise<void>`

Sets a document in Firestore.

**Parameters:**

- `collection: string` - The collection to set the document in
- `id: string` - The ID of the document to set
- `data: DocumentData` - The data to set

**Returns:** A promise that resolves when the document is set.

**Example:**

```typescript
import { firebaseFirestore } from 'atomic/molecules/firebaseFirestore';

// Set a document
await firebaseFirestore.setDocument('users', 'user123', {
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
});
```

##### `updateDocument(collection: string, id: string, data: Partial<DocumentData>): Promise<void>`

Updates a document in Firestore.

**Parameters:**

- `collection: string` - The collection containing the document
- `id: string` - The ID of the document to update
- `data: Partial<DocumentData>` - The data to update

**Returns:** A promise that resolves when the document is updated.

**Example:**

```typescript
import { firebaseFirestore } from 'atomic/molecules/firebaseFirestore';

// Update a document
await firebaseFirestore.updateDocument('users', 'user123', {
  name: 'Jane Doe',
  updatedAt: new Date(),
});
```

##### `deleteDocument(collection: string, id: string): Promise<void>`

Deletes a document from Firestore.

**Parameters:**

- `collection: string` - The collection containing the document
- `id: string` - The ID of the document to delete

**Returns:** A promise that resolves when the document is deleted.

**Example:**

```typescript
import { firebaseFirestore } from 'atomic/molecules/firebaseFirestore';

// Delete a document
await firebaseFirestore.deleteDocument('users', 'user123');
```

##### `queryDocuments(collection: string, queryFn: (query: Query) => Query): Promise<DocumentData[]>`

Queries documents in Firestore.

**Parameters:**

- `collection: string` - The collection to query
- `queryFn: (query: Query) => Query` - A function that builds the query

**Returns:** A promise that resolves to an array of document data.

**Example:**

```typescript
import { firebaseFirestore } from 'atomic/molecules/firebaseFirestore';
import { where, orderBy, limit } from 'firebase/firestore';

// Query documents
const documents = await firebaseFirestore.queryDocuments('users', query =>
  query.where('age', '>=', 18).orderBy('createdAt', 'desc').limit(10)
);
console.log('Query results:', documents);
```

## Analytics Services

### AnalyticsService

The `AnalyticsService` handles tracking of user events and analytics data.

#### Methods

##### `trackEvent(eventName: string, params?: Record<string, any>): void`

Tracks an analytics event.

**Parameters:**

- `eventName: string` - The name of the event to track
- `params?: Record<string, any>` - Optional parameters for the event

**Example:**

```typescript
import { analyticsService } from 'services/analyticsService';

// Track a simple event
analyticsService.trackEvent('button_click');

// Track an event with parameters
analyticsService.trackEvent('purchase_completed', {
  productId: 'premium_subscription',
  value: 9.99,
  currency: 'USD',
});
```

##### `setUserProperties(properties: Record<string, any>): void`

Sets user properties for analytics.

**Parameters:**

- `properties: Record<string, any>` - The properties to set

**Example:**

```typescript
import { analyticsService } from 'services/analyticsService';

// Set user properties
analyticsService.setUserProperties({
  userType: 'premium',
  favoriteTeam: 'Lakers',
  preferredSport: 'basketball',
});
```

##### `trackScreenView(screenName: string, screenClass?: string): void`

Tracks a screen view event.

**Parameters:**

- `screenName: string` - The name of the screen
- `screenClass?: string` - Optional class name of the screen

**Example:**

```typescript
import { analyticsService } from 'services/analyticsService';

// Track screen view
analyticsService.trackScreenView('GameDetails', 'GameDetailsScreen');
```

### BettingAnalyticsService

The `BettingAnalyticsService` handles analytics specific to betting activities.

#### Methods

##### `trackBet(betData: BetData): void`

Tracks a betting event.

**Parameters:**

- `betData: BetData` - Data about the bet

**Example:**

```typescript
import { bettingAnalyticsService } from 'services/bettingAnalyticsService';

// Track a bet
bettingAnalyticsService.trackBet({
  gameId: 'game123',
  betType: 'moneyline',
  betAmount: 50,
  odds: -110,
  team: 'Lakers',
  timestamp: Date.now(),
});
```

##### `getBettingPerformance(userId: string, timeRange?: TimeRange): Promise<BettingPerformance>`

Gets betting performance analytics for a user.

**Parameters:**

- `userId: string` - The ID of the user
- `timeRange?: TimeRange` - Optional time range for the data

**Returns:** A promise that resolves to the betting performance data.

**Example:**

```typescript
import { bettingAnalyticsService } from 'services/bettingAnalyticsService';

// Get betting performance
const performance = await bettingAnalyticsService.getBettingPerformance('user123', {
  start: new Date('2025-01-01'),
  end: new Date('2025-05-01'),
});
console.log('Betting performance:', performance);
```

## Data Services

### CacheService

The `CacheService` provides caching functionality for data.

#### Methods

##### `set(key: string, data: any, ttl?: number): Promise<void>`

Sets data in the cache.

**Parameters:**

- `key: string` - The key to store the data under
- `data: any` - The data to cache
- `ttl?: number` - Optional time-to-live in milliseconds

**Returns:** A promise that resolves when the data is cached.

**Example:**

```typescript
import { cacheService } from 'services/cacheService';

// Cache data for 1 hour
await cacheService.set('user_profile_123', userProfile, 3600000);
```

##### `get<T>(key: string): Promise<T | null>`

Gets data from the cache.

**Parameters:**

- `key: string` - The key to retrieve data for

**Returns:** A promise that resolves to the cached data or null if not found.

**Example:**

```typescript
import { cacheService } from 'services/cacheService';

// Get cached data
const userProfile = await cacheService.get('user_profile_123');
if (userProfile) {
  console.log('Cache hit:', userProfile);
} else {
  console.log('Cache miss');
}
```

##### `remove(key: string): Promise<void>`

Removes data from the cache.

**Parameters:**

- `key: string` - The key to remove

**Returns:** A promise that resolves when the data is removed.

**Example:**

```typescript
import { cacheService } from 'services/cacheService';

// Remove cached data
await cacheService.remove('user_profile_123');
```

##### `clear(): Promise<void>`

Clears all data from the cache.

**Returns:** A promise that resolves when the cache is cleared.

**Example:**

```typescript
import { cacheService } from 'services/cacheService';

// Clear the entire cache
await cacheService.clear();
```

## Sports Data Services

### OddsService

The `OddsService` provides access to sports betting odds data.

#### Methods

##### `getOdds(sportId: string, date?: Date): Promise<OddsData[]>`

Gets odds data for a sport.

**Parameters:**

- `sportId: string` - The ID of the sport
- `date?: Date` - Optional date to get odds for

**Returns:** A promise that resolves to an array of odds data.

**Example:**

```typescript
import { oddsService } from 'services/OddsService';

// Get today's NBA odds
const nbaOdds = await oddsService.getOdds('nba');
console.log('NBA odds:', nbaOdds);

// Get odds for a specific date
const mlbOdds = await oddsService.getOdds('mlb', new Date('2025-07-15'));
console.log('MLB odds for July 15, 2025:', mlbOdds);
```

##### `getGameOdds(gameId: string): Promise<GameOdds | null>`

Gets odds data for a specific game.

**Parameters:**

- `gameId: string` - The ID of the game

**Returns:** A promise that resolves to the game odds or null if not found.

**Example:**

```typescript
import { oddsService } from 'services/OddsService';

// Get odds for a specific game
const gameOdds = await oddsService.getGameOdds('game123');
if (gameOdds) {
  console.log('Game odds:', gameOdds);
} else {
  console.log('No odds found for this game');
}
```

##### `getOddsComparison(gameId: string): Promise<OddsComparison>`

Gets odds comparison data for a game across different bookmakers.

**Parameters:**

- `gameId: string` - The ID of the game

**Returns:** A promise that resolves to the odds comparison data.

**Example:**

```typescript
import { oddsService } from 'services/OddsService';

// Get odds comparison for a game
const comparison = await oddsService.getOddsComparison('game123');
console.log('Odds comparison:', comparison);
```

## User Services

### UserPreferencesService

The `UserPreferencesService` manages user preferences and settings.

#### Methods

##### `getPreferences(userId: string): Promise<UserPreferences>`

Gets preferences for a user.

**Parameters:**

- `userId: string` - The ID of the user

**Returns:** A promise that resolves to the user preferences.

**Example:**

```typescript
import { userPreferencesService } from 'services/userPreferencesService';

// Get user preferences
const preferences = await userPreferencesService.getPreferences('user123');
console.log('User preferences:', preferences);
```

##### `updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void>`

Updates preferences for a user.

**Parameters:**

- `userId: string` - The ID of the user
- `preferences: Partial<UserPreferences>` - The preferences to update

**Returns:** A promise that resolves when the preferences are updated.

**Example:**

```typescript
import { userPreferencesService } from 'services/userPreferencesService';

// Update user preferences
await userPreferencesService.updatePreferences('user123', {
  favoriteTeams: ['Lakers', 'Dodgers'],
  notificationsEnabled: true,
  darkMode: true,
});
```

##### `resetPreferences(userId: string): Promise<void>`

Resets preferences for a user to default values.

**Parameters:**

- `userId: string` - The ID of the user

**Returns:** A promise that resolves when the preferences are reset.

**Example:**

```typescript
import { userPreferencesService } from 'services/userPreferencesService';

// Reset user preferences
await userPreferencesService.resetPreferences('user123');
```

## Monitoring Services

### MonitoringService

The `MonitoringService` provides application monitoring functionality.

#### Methods

##### `initialize(): Promise<void>`

Initializes the monitoring service.

**Returns:** A promise that resolves when initialization is complete.

**Example:**

```typescript
import { monitoringService } from 'services/monitoringService';

// Initialize monitoring
await monitoringService.initialize();
```

##### `trackError(error: Error, context?: Record<string, any>): void`

Tracks an error in the monitoring system.

**Parameters:**

- `error: Error` - The error to track
- `context?: Record<string, any>` - Optional context information

**Example:**

```typescript
import { monitoringService } from 'services/monitoringService';

// Track an error
try {
  // Some code that might throw an error
} catch (error) {
  monitoringService.trackError(error, {
    component: 'PaymentProcessor',
    userId: 'user123',
    action: 'processPayment',
  });
}
```

##### `trackPerformance(name: string, durationMs: number, attributes?: Record<string, any>): void`

Tracks a performance metric.

**Parameters:**

- `name: string` - The name of the performance metric
- `durationMs: number` - The duration in milliseconds
- `attributes?: Record<string, any>` - Optional attributes

**Example:**

```typescript
import { monitoringService } from 'services/monitoringService';

// Track performance
const startTime = Date.now();
// Some operation
const endTime = Date.now();
monitoringService.trackPerformance('dataFetch', endTime - startTime, {
  endpoint: '/api/games',
  dataSize: '1.2MB',
});
```

## Cross-References

- For information on the underlying architectural principles, see [Core Concepts](../core-concepts/README.md)
- For practical guides on using these services, see [Implementation Guides](../implementation-guides/README.md)
- For information on components that use these services, see [Component API](component-api.md)
- For information on utility functions that these services may use, see [Utility Functions](utility-functions.md)
