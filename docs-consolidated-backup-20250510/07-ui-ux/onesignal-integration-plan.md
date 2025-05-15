# OneSignal Integration Plan for AI Sports Edge

## Overview

This document outlines the implementation plan for integrating OneSignal push notifications into both the web and mobile versions of AI Sports Edge. OneSignal will enable us to send timely notifications about game predictions, betting opportunities, and other important updates to our users.

## Prerequisites

1. Create a OneSignal account at [onesignal.com](https://onesignal.com)
2. Create two OneSignal apps:
   - Web Push app for the web version
   - Mobile Push app for the iOS/Android app

## Implementation Steps

### 1. Web App Integration

#### 1.1 Install OneSignal SDK

Add the OneSignal SDK to the `public/index.html` file:

```html
<!-- OneSignal Web Push Notifications -->
<script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async=""></script>
<script>
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(function() {
    OneSignal.init({
      appId: "YOUR_ONESIGNAL_WEB_APP_ID",
      safari_web_id: "YOUR_SAFARI_WEB_ID", // Only needed for Safari
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true, // For development only
    });
  });
</script>
```

#### 1.2 Create Service Worker

Create a OneSignal service worker file in the public directory:

```javascript
// public/OneSignalSDKWorker.js
importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
```

#### 1.3 Implement Permission Request Flow

Create a notification permission component:

```jsx
// components/NotificationPermission.jsx
import React, { useEffect, useState } from 'react';

const NotificationPermission = () => {
  const [permissionState, setPermissionState] = useState('default');

  useEffect(() => {
    if (typeof OneSignal !== 'undefined') {
      OneSignal.push(() => {
        OneSignal.getNotificationPermission((permission) => {
          setPermissionState(permission);
        });
      });
    }
  }, []);

  const requestPermission = () => {
    if (typeof OneSignal !== 'undefined') {
      OneSignal.push(() => {
        OneSignal.registerForPushNotifications();
      });
    }
  };

  if (permissionState === 'granted') {
    return null;
  }

  return (
    <div className="notification-permission">
      <p>Get real-time updates on game predictions and betting opportunities!</p>
      <button onClick={requestPermission} className="button primary-button">
        Enable Notifications
      </button>
    </div>
  );
};

export default NotificationPermission;
```

Add this component to the web app's main layout.

### 2. Mobile App Integration

#### 2.1 Install OneSignal React Native SDK

```bash
npm install react-native-onesignal
```

#### 2.2 Configure iOS

Update `ios/Podfile` to include OneSignal:

```ruby
target 'AISportsEdge' do
  # ...existing config...
  pod 'OneSignalXCFramework', '>= 3.0.0', '< 4.0'
end
```

Update `ios/AISportsEdge/Info.plist` to include required permissions:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

#### 2.3 Configure Android

Update `android/app/build.gradle`:

```gradle
dependencies {
  // ...existing dependencies...
  implementation 'com.onesignal:OneSignal:[4.0.0, 4.99.99]'
}
```

Update `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <application>
    <!-- ... -->
    <meta-data android:name="com.onesignal.NotificationServiceExtension"
               android:value="com.aisportsedge.NotificationServiceExtension" />
  </application>
</manifest>
```

#### 2.4 Initialize OneSignal in App.tsx

Create a OneSignal provider component:

```tsx
// components/OneSignalProvider.tsx
import React, { useEffect } from 'react';
import OneSignal from 'react-native-onesignal';

interface OneSignalProviderProps {
  children: React.ReactNode;
}

const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize OneSignal
    OneSignal.setAppId('YOUR_ONESIGNAL_MOBILE_APP_ID');
    
    // Prompt for push notifications
    OneSignal.promptForPushNotificationsWithUserResponse();
    
    // Handle notification opened
    OneSignal.setNotificationOpenedHandler((openedEvent) => {
      console.log('Notification opened:', openedEvent);
      const { action, notification } = openedEvent;
      
      // Handle deep linking based on notification data
      if (notification.additionalData && notification.additionalData.screen) {
        // Navigate to the specified screen
        // This will be handled by the navigation service
      }
    });
    
    // Handle notifications received while app is in foreground
    OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
      console.log('Notification received in foreground:', notificationReceivedEvent);
      
      // Complete the event to show the notification
      notificationReceivedEvent.complete(notificationReceivedEvent.getNotification());
    });
    
    return () => {
      // Clean up OneSignal listeners if needed
    };
  }, []);
  
  return <>{children}</>;
};

export default OneSignalProvider;
```

Update App.tsx to include the OneSignal provider:

```tsx
// App.tsx
import OneSignalProvider from './components/OneSignalProvider';

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      <PersonalizationProvider>
        <BettingAffiliateProvider>
          <StripeProvider>
            <OneSignalProvider>
              <NavigationContainer theme={NeonTheme}>
                {/* ... existing code ... */}
              </NavigationContainer>
            </OneSignalProvider>
          </StripeProvider>
        </BettingAffiliateProvider>
      </PersonalizationProvider>
    </ThemeProvider>
  );
}
```

### 3. Backend Integration

#### 3.1 Create Notification Service

Create a notification service to manage sending notifications:

```javascript
// services/NotificationService.js
const axios = require('axios');

class NotificationService {
  constructor() {
    this.oneSignalApiKey = process.env.ONESIGNAL_API_KEY;
    this.oneSignalWebAppId = process.env.ONESIGNAL_WEB_APP_ID;
    this.oneSignalMobileAppId = process.env.ONESIGNAL_MOBILE_APP_ID;
  }

  /**
   * Send a notification to all users
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.data - Additional data to send with the notification
   * @param {string} options.url - URL to open when notification is clicked (web only)
   * @param {string} options.platform - 'web', 'mobile', or 'all'
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendToAll({ title, message, data = {}, url, platform = 'all' }) {
    const appIds = [];
    
    if (platform === 'web' || platform === 'all') {
      appIds.push(this.oneSignalWebAppId);
    }
    
    if (platform === 'mobile' || platform === 'all') {
      appIds.push(this.oneSignalMobileAppId);
    }
    
    const promises = appIds.map(appId => {
      return this.sendNotification({
        app_id: appId,
        headings: { en: title },
        contents: { en: message },
        data,
        url,
        included_segments: ['All']
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Send a notification to specific users
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.data - Additional data to send with the notification
   * @param {string} options.url - URL to open when notification is clicked (web only)
   * @param {Array<string>} options.userIds - Array of OneSignal user IDs
   * @param {string} options.platform - 'web', 'mobile', or 'all'
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendToUsers({ title, message, data = {}, url, userIds, platform = 'all' }) {
    const appIds = [];
    
    if (platform === 'web' || platform === 'all') {
      appIds.push(this.oneSignalWebAppId);
    }
    
    if (platform === 'mobile' || platform === 'all') {
      appIds.push(this.oneSignalMobileAppId);
    }
    
    const promises = appIds.map(appId => {
      return this.sendNotification({
        app_id: appId,
        headings: { en: title },
        contents: { en: message },
        data,
        url,
        include_external_user_ids: userIds
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Send a notification based on user tags/filters
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.data - Additional data to send with the notification
   * @param {string} options.url - URL to open when notification is clicked (web only)
   * @param {Array<Object>} options.filters - Array of OneSignal filters
   * @param {string} options.platform - 'web', 'mobile', or 'all'
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendToFilters({ title, message, data = {}, url, filters, platform = 'all' }) {
    const appIds = [];
    
    if (platform === 'web' || platform === 'all') {
      appIds.push(this.oneSignalWebAppId);
    }
    
    if (platform === 'mobile' || platform === 'all') {
      appIds.push(this.oneSignalMobileAppId);
    }
    
    const promises = appIds.map(appId => {
      return this.sendNotification({
        app_id: appId,
        headings: { en: title },
        contents: { en: message },
        data,
        url,
        filters
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Send a notification using the OneSignal API
   * @param {Object} payload - OneSignal notification payload
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendNotification(payload) {
    try {
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.oneSignalApiKey}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending OneSignal notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
```

#### 3.2 Implement Notification Triggers

Create notification triggers for various events:

```javascript
// functions/notifications.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const NotificationService = require('../services/NotificationService');

// Trigger notification when new predictions are available
exports.sendPredictionNotifications = functions.firestore
  .document('predictions/{predictionId}')
  .onCreate(async (snapshot, context) => {
    const prediction = snapshot.data();
    
    // Get users who are interested in this sport
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where(`preferences.sports.${prediction.sport}`, '==', true)
      .get();
    
    if (usersSnapshot.empty) {
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    // Send notification
    return NotificationService.sendToUsers({
      title: 'New Prediction Available',
      message: `Check out our prediction for ${prediction.homeTeam} vs ${prediction.awayTeam}`,
      data: {
        predictionId: context.params.predictionId,
        sport: prediction.sport,
        screen: 'Odds'
      },
      userIds
    });
  });

// Trigger notification for value betting opportunities
exports.sendValueBetNotifications = functions.firestore
  .document('valueBets/{betId}')
  .onCreate(async (snapshot, context) => {
    const valueBet = snapshot.data();
    
    // Only send notifications for high-value bets
    if (valueBet.value < 0.1) { // 10% edge
      return null;
    }
    
    // Get premium users
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('subscription.status', '==', 'active')
      .where('subscription.plan', 'in', ['pro', 'elite'])
      .where(`preferences.sports.${valueBet.sport}`, '==', true)
      .get();
    
    if (usersSnapshot.empty) {
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    // Send notification
    return NotificationService.sendToUsers({
      title: 'Value Betting Opportunity',
      message: `We've identified a ${Math.round(valueBet.value * 100)}% edge on ${valueBet.team}`,
      data: {
        betId: context.params.betId,
        sport: valueBet.sport,
        screen: 'Odds'
      },
      userIds
    });
  });

// Trigger notification for game start reminders
exports.sendGameStartReminders = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    // Get games starting in the next 30 minutes
    const now = admin.firestore.Timestamp.now();
    const thirtyMinutesFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 30 * 60 * 1000
    );
    
    const gamesSnapshot = await admin.firestore()
      .collection('games')
      .where('startTime', '>', now)
      .where('startTime', '<=', thirtyMinutesFromNow)
      .get();
    
    if (gamesSnapshot.empty) {
      return null;
    }
    
    // Process each game
    const promises = gamesSnapshot.docs.map(async (doc) => {
      const game = doc.data();
      
      // Get users interested in this game
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where(`preferences.sports.${game.sport}`, '==', true)
        .where('preferences.gameReminders', '==', true)
        .get();
      
      if (usersSnapshot.empty) {
        return null;
      }
      
      // Get user IDs
      const userIds = usersSnapshot.docs.map(doc => doc.id);
      
      // Send notification
      return NotificationService.sendToUsers({
        title: 'Game Starting Soon',
        message: `${game.homeTeam} vs ${game.awayTeam} starts in 30 minutes`,
        data: {
          gameId: doc.id,
          sport: game.sport,
          screen: 'Odds'
        },
        userIds
      });
    });
    
    return Promise.all(promises);
  });
```

### 4. User Preference Management

#### 4.1 Create Notification Settings Screen

Create a notification settings screen for users to manage their notification preferences:

```tsx
// screens/NotificationSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { firebase } from '../config/firebase';
import OneSignal from 'react-native-onesignal';

const NotificationSettingsScreen = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    predictions: true,
    valueBets: true,
    gameReminders: true,
    scoreUpdates: false,
    modelPerformance: true
  });
  
  useEffect(() => {
    // Load user preferences from Firestore
    const loadPreferences = async () => {
      try {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        const doc = await firebase.firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        
        if (doc.exists) {
          const data = doc.data();
          if (data.preferences && data.preferences.notifications) {
            setSettings(data.preferences.notifications);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  const updateSetting = async (key, value) => {
    try {
      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Update OneSignal tags
      OneSignal.sendTag(key, value ? 'true' : 'false');
      
      // Update Firestore
      const user = firebase.auth().currentUser;
      if (!user) return;
      
      await firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .set({
          preferences: {
            notifications: {
              [key]: value
            }
          }
        }, { merge: true });
    } catch (error) {
      console.error('Error updating notification setting:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Notification Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Predictions</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Receive notifications when new predictions are available
          </Text>
        </View>
        <Switch
          value={settings.predictions}
          onValueChange={(value) => updateSetting('predictions', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Value Bets</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Get notified about high-value betting opportunities
          </Text>
        </View>
        <Switch
          value={settings.valueBets}
          onValueChange={(value) => updateSetting('valueBets', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Game Reminders</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Receive reminders 30 minutes before game start
          </Text>
        </View>
        <Switch
          value={settings.gameReminders}
          onValueChange={(value) => updateSetting('gameReminders', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Score Updates</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Get real-time score updates for games you're following
          </Text>
        </View>
        <Switch
          value={settings.scoreUpdates}
          onValueChange={(value) => updateSetting('scoreUpdates', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Model Performance</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Receive weekly updates on prediction model performance
          </Text>
        </View>
        <Switch
          value={settings.modelPerformance}
          onValueChange={(value) => updateSetting('modelPerformance', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
});

export default NotificationSettingsScreen;
```

#### 4.2 Update App.tsx to Include Notification Settings Screen

Add the notification settings screen to the navigation stack:

```tsx
// App.tsx
<Stack.Screen
  name="NotificationSettings"
  component={NotificationSettingsScreen}
  options={{
    title: "NOTIFICATION SETTINGS",
    headerBackTitle: "Back"
  }}
/>
```

### 5. Testing and Deployment

#### 5.1 Testing Web Push Notifications

1. Deploy the web app to a test environment
2. Verify that the permission prompt appears
3. Test sending notifications from the OneSignal dashboard
4. Verify that notifications are received

#### 5.2 Testing Mobile Push Notifications

1. Build the app for iOS and Android
2. Install on test devices
3. Verify that the permission prompt appears
4. Test sending notifications from the OneSignal dashboard
5. Verify that notifications are received
6. Test deep linking from notifications

#### 5.3 Testing Backend Integration

1. Deploy the Firebase functions
2. Trigger test events (new predictions, value bets, etc.)
3. Verify that notifications are sent to the appropriate users

#### 5.4 Production Deployment

1. Update the OneSignal app IDs to production values
2. Deploy the web app to production
3. Submit the mobile app to the App Store and Google Play
4. Monitor notification delivery and user engagement

## Notification Strategy

### Types of Notifications

| Notification Type | Description | Frequency | Priority |
|-------------------|-------------|-----------|----------|
| Predictions | New predictions for upcoming games | Daily | Medium |
| Value Bets | High-value betting opportunities | Real-time | High |
| Game Reminders | Reminders before game start | 30 minutes before game | Medium |
| Score Updates | Updates on game scores | Real-time (opt-in) | Low |
| Model Performance | Summary of prediction accuracy | Weekly | Low |

### Personalization

Notifications will be personalized based on user preferences:

1. **Sports Preferences**: Users will only receive notifications for sports they're interested in
2. **Notification Types**: Users can enable/disable specific types of notifications
3. **Frequency**: Users can set the frequency of notifications (e.g., daily, weekly)
4. **Time of Day**: Users can set preferred time windows for non-urgent notifications

### Best Practices

1. **Relevance**: Only send notifications that are relevant to the user
2. **Timing**: Send notifications at appropriate times
3. **Frequency**: Avoid notification fatigue by limiting the number of notifications
4. **Value**: Ensure each notification provides value to the user
5. **Clear Actions**: Include clear actions that users can take from the notification

## Conclusion

The OneSignal integration will enhance the AI Sports Edge platform by providing timely notifications about game predictions, betting opportunities, and other important updates. This will improve user engagement and retention, ultimately leading to a better user experience and increased revenue.

## Next Steps

1. Set up OneSignal account and create apps for web and mobile
2. Implement web app integration
3. Implement mobile app integration
4. Set up backend notification service
5. Implement notification triggers
6. Create notification settings screen
7. Test and deploy