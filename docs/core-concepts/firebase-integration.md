# Firebase Integration

## Overview

AI Sports Edge uses Firebase as its primary backend service, providing authentication, database, storage, and cloud functions. This document provides an overview of how Firebase is integrated into the application using the atomic architecture.

## Firebase Services Used

- **Authentication**: User authentication and management
- **Firestore**: NoSQL database for storing application data
- **Storage**: File storage for user uploads and application assets
- **Cloud Functions**: Serverless functions for backend logic
- **Cloud Messaging**: Push notifications
- **Analytics**: User behavior tracking
- **Crashlytics**: Crash reporting

## Architecture

The Firebase integration follows the atomic architecture pattern:

- **Atoms**: Basic Firebase initialization and configuration
- **Molecules**: Individual Firebase service wrappers
- **Organisms**: Integrated Firebase service that combines all Firebase functionality

### Atoms

- `firebaseApp.js`: Initializes the Firebase app
- `firebaseConfig.js`: Contains Firebase configuration
- `firebaseUtils.js`: Utility functions for Firebase

### Molecules

- `firebaseAuth.js`: Authentication functionality
- `firebaseFirestore.js`: Database operations
- `firebaseStorage.js`: Storage operations
- `firebaseMessaging.js`: Push notification functionality
- `firebaseAnalytics.js`: Analytics tracking
- `firebaseCrashlytics.js`: Crash reporting

### Organisms

- `firebaseService.js`: Integrated Firebase service that combines all Firebase functionality

## Implementation

### Implementation Note

This documentation uses the modular Firebase SDK syntax (Firebase v9+), which provides better tree-shaking and smaller bundle sizes compared to the older namespaced syntax.

### Firebase Initialization

```javascript
// atoms/firebaseApp.js
import { initializeApp, getApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';

let app;

export const initializeFirebaseApp = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    return app;
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    throw error;
  }
};

export const getFirebaseApp = () => {
  if (!app) {
    return initializeFirebaseApp();
  }
  return app;
};

export default getFirebaseApp();
```

### Firebase Authentication

```javascript
// molecules/firebaseAuth.js
import {
  getAuth,
  signInWithEmailAndPassword as signIn,
  signOut as signOutUser,
  onAuthStateChanged as onAuthChange,
} from 'firebase/auth';
import firebaseApp from '../atoms/firebaseApp';

const auth = getAuth(firebaseApp);

export const signInWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signIn(auth, email, password);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await signOutUser(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = callback => {
  return onAuthChange(auth, callback);
};

export default {
  signInWithEmailAndPassword,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
};
```

### Firebase Firestore

```javascript
// molecules/firebaseFirestore.js
import { getFirestore, doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import firebaseApp from '../atoms/firebaseApp';

const firestore = getFirestore(firebaseApp);

export const getDocument = async (collectionName, id) => {
  try {
    const docRef = doc(firestore, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const setDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(firestore, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const queryDocuments = async (collectionName, queryFn) => {
  try {
    const collectionRef = collection(firestore, collectionName);
    let queryRef = collectionRef;

    if (queryFn) {
      queryRef = queryFn(query(collectionRef));
    }

    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
};

export default {
  getDocument,
  setDocument,
  queryDocuments,
};
```

### Integrated Firebase Service

```javascript
// organisms/firebaseService.js
import firebaseApp, { initializeFirebaseApp } from '../atoms/firebaseApp';
import auth from '../molecules/firebaseAuth';
import firestore from '../molecules/firebaseFirestore';
import storage from '../molecules/firebaseStorage';
import messaging from '../molecules/firebaseMessaging';
import analytics from '../molecules/firebaseAnalytics';
import crashlytics from '../molecules/firebaseCrashlytics';

export const initialize = () => {
  try {
    initializeFirebaseApp();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export default {
  initialize,
  app: firebaseApp,
  auth,
  firestore,
  storage,
  messaging,
  analytics,
  crashlytics,
};
```

## Usage Examples

### Authentication

```javascript
import { firebaseService } from '../atomic/organisms';

// Sign in
const signIn = async (email, password) => {
  try {
    const userCredential = await firebaseService.auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  try {
    await firebaseService.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = () => {
  return firebaseService.auth.getCurrentUser();
};

// Listen for auth state changes
const listenForAuthChanges = callback => {
  return firebaseService.auth.onAuthStateChanged(callback);
};
```

### Firestore

```javascript
import { firebaseService } from '../atomic/organisms';
import { where } from 'firebase/firestore';

// Get document
const getUserData = async userId => {
  try {
    const userData = await firebaseService.firestore.getDocument('users', userId);
    return userData;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};

// Set document
const updateUserData = async (userId, data) => {
  try {
    await firebaseService.firestore.setDocument('users', userId, data);
  } catch (error) {
    console.error('Update user data error:', error);
    throw error;
  }
};

// Query documents
const getActiveUsers = async () => {
  try {
    const users = await firebaseService.firestore.queryDocuments('users', query =>
      query.where('status', '==', 'active')
    );
    return users;
  } catch (error) {
    console.error('Get active users error:', error);
    throw error;
  }
};
```

### Firebase Analytics

```javascript
// molecules/firebaseAnalytics.js
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { Platform } from 'react-native';
import firebaseApp from '../atoms/firebaseApp';

// Initialize Firebase Analytics
let analytics = null;

// Only initialize on web platforms or when running in a compatible environment
export const initializeAnalytics = () => {
  try {
    // Firebase Analytics is primarily supported on Web and iOS/Android via native SDKs
    // It's not available in all React Native environments
    if (
      Platform.OS === 'web' ||
      (Platform.OS !== 'web' && typeof global.nativeModuleProxy !== 'undefined')
    ) {
      analytics = getAnalytics(firebaseApp);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
    return false;
  }
};

// Log an event to Firebase Analytics
export const trackEvent = (eventName, eventParams = {}) => {
  try {
    if (!analytics) {
      const initialized = initializeAnalytics();
      if (!initialized) return false;
    }

    logEvent(analytics, eventName, eventParams);
    return true;
  } catch (error) {
    console.error('Error tracking event in Firebase Analytics:', error);
    return false;
  }
};

// Set the user ID for Firebase Analytics
export const setAnalyticsUserId = userId => {
  try {
    if (!analytics) {
      const initialized = initializeAnalytics();
      if (!initialized) return false;
    }

    if (userId) {
      setUserId(analytics, userId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting user ID in Firebase Analytics:', error);
    return false;
  }
};

// Set user properties for Firebase Analytics
export const setAnalyticsUserProperties = properties => {
  try {
    if (!analytics) {
      const initialized = initializeAnalytics();
      if (!initialized) return false;
    }

    setUserProperties(analytics, properties);
    return true;
  } catch (error) {
    console.error('Error setting user properties in Firebase Analytics:', error);
    return false;
  }
};

export default {
  initializeAnalytics,
  trackEvent,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
};
```

## Usage Examples

### Firebase Analytics

```javascript
import { firebaseService } from '../atomic/organisms';

// Initialize Firebase Analytics
const initAnalytics = () => {
  const initialized = firebaseService.analytics.initializeAnalytics();
  return initialized;
};

// Track a standard event
const trackPurchase = (transactionId, value, currency, items) => {
  return firebaseService.analytics.trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items,
  });
};

// Track a custom event
const trackBettingSlipCreated = (betType, odds, potentialWinnings) => {
  return firebaseService.analytics.trackEvent('betting_slip_created', {
    bet_type: betType,
    odds: odds,
    potential_winnings: potentialWinnings,
    event_category: 'engagement',
    event_label: 'betting',
  });
};

// Set user ID after login
const setUserIdentifier = userId => {
  return firebaseService.analytics.setAnalyticsUserId(userId);
};

// Set user properties
const setUserPreferences = preferences => {
  const userProperties = {
    favorite_sport: preferences.favoriteSport,
    preferred_odds_format: preferences.oddsFormat,
    subscription_tier: preferences.subscriptionTier,
    user_region: preferences.region,
  };

  return firebaseService.analytics.setAnalyticsUserProperties(userProperties);
};

// Track user journey through a feature
const trackUserJourney = async (journeyName, stepNumber, stepName, additionalData = {}) => {
  return firebaseService.analytics.trackEvent('user_journey_step', {
    journey_name: journeyName,
    step_number: stepNumber,
    step_name: stepName,
    ...additionalData,
  });
};

// Track conversion
const trackConversion = (conversionType, value) => {
  return firebaseService.analytics.trackEvent('conversion', {
    conversion_type: conversionType,
    value: value,
    event_category: 'conversion',
  });
};
```

### Common Analytics Events

Firebase Analytics provides a set of recommended events that you should use when applicable:

```javascript
// User signs up
firebaseService.analytics.trackEvent('sign_up', {
  method: 'email', // or 'google', 'facebook', etc.
});

// User logs in
firebaseService.analytics.trackEvent('login', {
  method: 'email', // or 'google', 'facebook', etc.
});

// User views content
firebaseService.analytics.trackEvent('screen_view', {
  firebase_screen: 'GameDetailsScreen',
  firebase_screen_class: 'GameDetailsScreen',
});

// User makes a purchase
firebaseService.analytics.trackEvent('purchase', {
  transaction_id: 'T12345',
  value: 29.99,
  currency: 'USD',
  items: [
    {
      item_id: 'premium_subscription',
      item_name: 'Premium Subscription',
      item_category: 'subscription',
      price: 29.99,
      quantity: 1,
    },
  ],
});

// User starts a subscription
firebaseService.analytics.trackEvent('begin_checkout', {
  value: 29.99,
  currency: 'USD',
  items: [
    {
      item_id: 'premium_subscription',
      item_name: 'Premium Subscription',
      item_category: 'subscription',
      price: 29.99,
      quantity: 1,
    },
  ],
});

// User completes a tutorial
firebaseService.analytics.trackEvent('tutorial_complete', {
  tutorial_name: 'betting_basics',
  tutorial_steps: 5,
  time_spent: 180, // seconds
});

// User shares content
firebaseService.analytics.trackEvent('share', {
  content_type: 'betting_tip',
  item_id: 'tip_12345',
});
```

### Tracking User Journeys

To track a user's journey through your app, you can create a sequence of events that represent the steps in the journey:

```javascript
// Example: Tracking a user's journey through the betting process

// Step 1: User views available games
const trackBettingJourneyStep1 = async (sportType, gameCount) => {
  return firebaseService.analytics.trackEvent('betting_journey', {
    step: 1,
    step_name: 'view_games',
    sport_type: sportType,
    game_count: gameCount,
  });
};

// Step 2: User selects a game
const trackBettingJourneyStep2 = async (gameId, homeTeam, awayTeam) => {
  return firebaseService.analytics.trackEvent('betting_journey', {
    step: 2,
    step_name: 'select_game',
    game_id: gameId,
    home_team: homeTeam,
    away_team: awayTeam,
  });
};

// Step 3: User creates a betting slip
const trackBettingJourneyStep3 = async (betType, odds, stake) => {
  return firebaseService.analytics.trackEvent('betting_journey', {
    step: 3,
    step_name: 'create_slip',
    bet_type: betType,
    odds: odds,
    stake: stake,
  });
};

// Step 4: User confirms bet
const trackBettingJourneyStep4 = async (slipId, totalStake, potentialWinnings) => {
  return firebaseService.analytics.trackEvent('betting_journey', {
    step: 4,
    step_name: 'confirm_bet',
    slip_id: slipId,
    total_stake: totalStake,
    potential_winnings: potentialWinnings,
  });
};

// Track journey completion (conversion)
const trackBettingJourneyComplete = async (slipId, totalStake, potentialWinnings) => {
  return firebaseService.analytics.trackEvent('betting_journey_complete', {
    slip_id: slipId,
    total_stake: totalStake,
    potential_winnings: potentialWinnings,
    journey_name: 'betting_process',
    conversion_value: totalStake,
  });
};
```

### Best Practices for Firebase Analytics Implementation

1. **Use Standard Events When Possible**: Firebase Analytics provides a set of recommended events. Use these standard events when applicable to benefit from built-in reporting.

2. **Consistent Naming Convention**: Use a consistent naming convention for custom events and parameters. Snake_case is recommended for event names and parameters.

3. **Limit Event Parameters**: Firebase Analytics has a limit of 25 parameters per event. Prioritize the most important parameters.

4. **Set User Properties for Segmentation**: Use user properties to segment your analytics data. This allows you to analyze behavior across different user groups.

5. **Track User Journeys**: Define key user journeys in your app and track each step to identify drop-off points and optimize the user experience.

6. **Implement Early**: Implement analytics early in the development process to collect data from the beginning.

7. **Test Analytics Implementation**: Verify that events are being properly logged using the Firebase Debug View or DebugView in the Firebase console.

8. **Document Custom Events**: Maintain documentation of all custom events and parameters to ensure consistent usage across the app.

9. **Consider Privacy Regulations**: Ensure your analytics implementation complies with privacy regulations like GDPR and CCPA. Implement consent management if necessary.

10. **Analyze and Act on Data**: Regularly review analytics data and use insights to improve the app experience.

### Consent Management

For applications that need to comply with privacy regulations like GDPR, implement consent management:

```javascript
// molecules/firebaseAnalytics.js (additional functions)

// Analytics consent status
let analyticsConsent = false;

// Set analytics consent status
export const setAnalyticsConsent = hasConsent => {
  analyticsConsent = hasConsent;
  return analyticsConsent;
};

// Check if user has given consent
export const hasAnalyticsConsent = () => {
  return analyticsConsent;
};

// Modified trackEvent function with consent check
export const trackEventWithConsent = (eventName, eventParams = {}) => {
  if (!analyticsConsent) {
    console.log('Analytics consent not provided, event not tracked');
    return false;
  }

  return trackEvent(eventName, eventParams);
};
```

### Integration with Other Analytics Systems

Firebase Analytics can be used alongside other analytics systems:

```javascript
// services/analyticsService.js

import { firebaseService } from '../atomic/organisms';

// Track event across multiple analytics systems
export const trackCrossAnalyticsEvent = async (eventName, eventData) => {
  try {
    // Track in Firebase Analytics
    firebaseService.analytics.trackEvent(eventName, eventData);

    // Track in Google Analytics (Web)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventData);
    }

    // Track in custom analytics system (e.g., Firestore)
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const analyticsRef = doc(
        firestore,
        'analytics_events',
        `${userId}_${eventName}_${Date.now()}`
      );

      await setDoc(analyticsRef, {
        eventName: eventName,
        userId: userId,
        ...eventData,
        timestamp: Timestamp.now(),
      });
    }

    return true;
  } catch (error) {
    console.error('Cross-analytics tracking error:', error);
    return false;
  }
};
```

## Security Rules

Firebase security rules are used to secure the database and storage:

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

// Storage security rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Cloud Functions

Cloud Functions are used for server-side logic:

```javascript
// Example Cloud Function
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.syncSubscriptionStatus = functions.firestore
  .document('subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    const subscriptionData = change.after.exists ? change.after.data() : null;
    if (!subscriptionData) return null;

    const userId = subscriptionData.userId;
    if (!userId) return null;

    const userRef = admin.firestore().doc(`users/${userId}`);

    return userRef.update({
      subscriptionStatus: subscriptionData.status,
      subscriptionExpiration: subscriptionData.expirationDate,
      subscriptionTier: subscriptionData.tier,
    });
  });
```

## Best Practices

1. **Use the Firebase Service**: Always use the Firebase service from the atomic architecture instead of directly using Firebase
2. **Error Handling**: Always handle errors from Firebase operations
3. **Offline Support**: Configure Firestore for offline support
4. **Security Rules**: Keep security rules up to date
5. **Batch Operations**: Use batch operations for multiple writes
6. **Transactions**: Use transactions for operations that need to be atomic
7. **Indexing**: Create indexes for complex queries
8. **Data Structure**: Design the data structure for efficient queries

## Related Documentation

- [Firebase Implementation Guide](../implementation-guides/firebase-guide.md) - Comprehensive guide for implementing Firebase services
- [Service API](../api-reference/service-api.md) - API documentation for Firebase services
- [Atomic Architecture](atomic-architecture.md) - Overview of the atomic design principles used in the project
- [Testing](../implementation-guides/testing.md) - Testing strategies for Firebase services
- [Component API](../api-reference/component-api.md) - API documentation for components that use Firebase services
