# OneSignal Implementation Files

This document contains the implementation files for the OneSignal integration. These files can be used as a reference for implementing OneSignal in the AI Sports Edge application.

## Web Implementation

### 1. OneSignal SDK Integration in index.html

Add the following code to `public/index.html` before the closing `</head>` tag:

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
        size: 'medium',
        theme: 'default',
        position: 'bottom-right',
        offset: {
          bottom: '20px',
          right: '20px'
        },
        prenotify: true,
        showCredit: false,
        text: {
          'tip.state.unsubscribed': 'Subscribe to notifications',
          'tip.state.subscribed': 'You are subscribed to notifications',
          'tip.state.blocked': 'You have blocked notifications',
          'message.prenotify': 'Click to subscribe to notifications',
          'message.action.subscribed': 'Thanks for subscribing!',
          'message.action.resubscribed': 'You are subscribed to notifications',
          'message.action.unsubscribed': 'You will no longer receive notifications',
          'dialog.main.title': 'Manage Site Notifications',
          'dialog.main.button.subscribe': 'SUBSCRIBE',
          'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
          'dialog.blocked.title': 'Unblock Notifications',
          'dialog.blocked.message': 'Follow these instructions to allow notifications:'
        }
      },
      allowLocalhostAsSecureOrigin: true, // For development only
      welcomeNotification: {
        title: "Welcome to AI Sports Edge!",
        message: "Thanks for subscribing to notifications. You'll now receive updates on game predictions and betting opportunities."
      },
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "Get real-time updates on game predictions and betting opportunities!",
                acceptButton: "ALLOW",
                cancelButton: "NO THANKS"
              },
              delay: {
                pageViews: 1,
                timeDelay: 20
              }
            }
          ]
        }
      }
    });
  });
</script>
```

### 2. OneSignal Service Worker

Create a file named `OneSignalSDKWorker.js` in the `public` directory:

```javascript
// public/OneSignalSDKWorker.js
importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
```

### 3. NotificationPermission Component

Create a React component for requesting notification permission:

```jsx
// components/NotificationPermission.jsx
import React, { useEffect, useState } from 'react';
import './NotificationPermission.css';

const NotificationPermission = () => {
  const [permissionState, setPermissionState] = useState('default');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if OneSignal is loaded
    if (typeof window.OneSignal !== 'undefined') {
      // Wait for OneSignal to initialize
      window.OneSignal.push(() => {
        // Get current permission state
        window.OneSignal.getNotificationPermission((permission) => {
          setPermissionState(permission);
          
          // Show banner if permission is not granted and user hasn't dismissed it
          if (permission !== 'granted' && !localStorage.getItem('notificationBannerDismissed')) {
            setShowBanner(true);
          }
        });
      });
    }
  }, []);

  const requestPermission = () => {
    if (typeof window.OneSignal !== 'undefined') {
      window.OneSignal.push(() => {
        window.OneSignal.registerForPushNotifications();
      });
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('notificationBannerDismissed', 'true');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="notification-permission-banner">
      <div className="notification-permission-content">
        <div className="notification-icon">🔔</div>
        <div className="notification-text">
          <h3>Stay Updated!</h3>
          <p>Get real-time updates on game predictions and betting opportunities.</p>
        </div>
        <div className="notification-actions">
          <button onClick={requestPermission} className="enable-button">
            Enable Notifications
          </button>
          <button onClick={dismissBanner} className="dismiss-button">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;
```

### 4. NotificationPermission CSS

Create a CSS file for the notification permission component:

```css
/* components/NotificationPermission.css */
.notification-permission-banner {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  max-width: 500px;
  margin: 0 auto;
  background-color: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
}

.notification-permission-content {
  display: flex;
  align-items: center;
  padding: 16px;
}

.notification-icon {
  font-size: 24px;
  margin-right: 16px;
}

.notification-text {
  flex: 1;
}

.notification-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #e94560;
}

.notification-text p {
  margin: 0;
  font-size: 14px;
  color: #ffffff;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  margin-left: 16px;
}

.enable-button {
  background-color: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 8px;
}

.dismiss-button {
  background-color: transparent;
  color: #888;
  border: none;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

@media (max-width: 600px) {
  .notification-permission-content {
    flex-direction: column;
    text-align: center;
  }
  
  .notification-icon {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .notification-actions {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
  }
}
```

## Mobile Implementation

### 1. Install OneSignal React Native SDK

```bash
npm install react-native-onesignal
```

### 2. OneSignalProvider Component

Create a OneSignal provider component:

```tsx
// components/OneSignalProvider.tsx
import React, { useEffect } from 'react';
import OneSignal from 'react-native-onesignal';
import { useNavigation } from '@react-navigation/native';

interface OneSignalProviderProps {
  children: React.ReactNode;
}

const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ children }) => {
  const navigation = useNavigation();

  useEffect(() => {
    // Initialize OneSignal
    OneSignal.setAppId('YOUR_ONESIGNAL_MOBILE_APP_ID');
    
    // Prompt for push notifications
    OneSignal.promptForPushNotificationsWithUserResponse((accepted) => {
      console.log('User accepted notifications:', accepted);
    });
    
    // Handle notification opened
    OneSignal.setNotificationOpenedHandler((openedEvent) => {
      console.log('Notification opened:', openedEvent);
      const { action, notification } = openedEvent;
      
      // Handle deep linking based on notification data
      if (notification.additionalData) {
        const data = notification.additionalData;
        
        // Navigate to the specified screen
        if (data.screen) {
          switch (data.screen) {
            case 'Odds':
              navigation.navigate('Odds');
              break;
            case 'PlayerStats':
              if (data.gameId) {
                navigation.navigate('PlayerStats', { 
                  gameId: data.gameId,
                  gameTitle: data.gameTitle || 'Player Statistics'
                });
              }
              break;
            case 'Formula1':
              navigation.navigate('Formula1');
              break;
            // Add more screens as needed
            default:
              navigation.navigate('PersonalizedHome');
          }
        }
      }
    });
    
    // Handle notifications received while app is in foreground
    OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
      console.log('Notification received in foreground:', notificationReceivedEvent);
      
      // Complete the event to show the notification
      notificationReceivedEvent.complete(notificationReceivedEvent.getNotification());
    });
    
    // Set external user ID when user logs in
    const setExternalUserId = async () => {
      try {
        // Get current user ID from your auth system
        const userId = await getCurrentUserId();
        if (userId) {
          OneSignal.setExternalUserId(userId);
        }
      } catch (error) {
        console.error('Error setting external user ID:', error);
      }
    };
    
    setExternalUserId();
    
    return () => {
      // Clean up OneSignal listeners if needed
    };
  }, [navigation]);
  
  return <>{children}</>;
};

// Helper function to get current user ID
const getCurrentUserId = async () => {
  // Implement your logic to get the current user ID
  // For example, from Firebase Auth
  try {
    const user = firebase.auth().currentUser;
    return user ? user.uid : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export default OneSignalProvider;
```

### 3. Update App.tsx

Update App.tsx to include the OneSignal provider:

```tsx
// App.tsx
import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PersonalizationProvider } from "./contexts/PersonalizationContext";
import { BettingAffiliateProvider } from "./contexts/BettingAffiliateContext";
import { StatusBar } from "react-native";
import StripeProvider from "./components/StripeProvider";
import OneSignalProvider from "./components/OneSignalProvider";
// ... other imports

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

export default App;
```

### 4. NotificationSettingsScreen

Create a notification settings screen:

```tsx
// screens/NotificationSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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
        <ActivityIndicator size="large" color={colors.neon.blue} />
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

## Backend Implementation

### 1. NotificationService.js

Create a notification service:

```javascript
// services/NotificationService.js
const axios = require('axios');
const functions = require('firebase-functions');

class NotificationService {
  constructor() {
    this.oneSignalApiKey = functions.config().onesignal.api_key;
    this.oneSignalWebAppId = functions.config().onesignal.web_app_id;
    this.oneSignalMobileAppId = functions.config().onesignal.mobile_app_id;
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

### 2. Notification Triggers

Create notification triggers:

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
      .where('preferences.notifications.predictions', '==', true)
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
      .where('preferences.notifications.valueBets', '==', true)
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
        .where('preferences.notifications.gameReminders', '==', true)
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

// Send weekly model performance updates
exports.sendModelPerformanceUpdates = functions.pubsub
  .schedule('every monday 09:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Calculate model performance for the past week
    const oneWeekAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    
    const predictionsSnapshot = await admin.firestore()
      .collection('predictions')
      .where('timestamp', '>=', oneWeekAgo)
      .get();
    
    if (predictionsSnapshot.empty) {
      return null;
    }
    
    // Calculate performance metrics
    const predictions = predictionsSnapshot.docs.map(doc => doc.data());
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.result === 'correct').length;
    const accuracy = (correctPredictions / totalPredictions) * 100;
    
    // Group by sport
    const sportPerformance = {};
    predictions.forEach(p => {
      if (!sportPerformance[p.sport]) {
        sportPerformance[p.sport] = {
          total: 0,
          correct: 0
        };
      }
      
      sportPerformance[p.sport].total++;
      if (p.result === 'correct') {
        sportPerformance[p.sport].correct++;
      }
    });
    
    // Format performance message
    let performanceMessage = `Overall accuracy: ${accuracy.toFixed(1)}% (${correctPredictions}/${totalPredictions})`;
    
    Object.entries(sportPerformance).forEach(([sport, data]) => {
      const sportAccuracy = (data.correct / data.total) * 100;
      performanceMessage += `\n${sport}: ${sportAccuracy.toFixed(1)}% (${data.correct}/${data.total})`;
    });
    
    // Get users who want model performance updates
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('preferences.notifications.modelPerformance', '==', true)
      .get();
    
    if (usersSnapshot.empty) {
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    // Send notification
    return NotificationService.sendToUsers({
      title: 'Weekly Model Performance Update',
      message: performanceMessage,
      data: {
        screen: 'PersonalizedHome'
      },
      userIds
    });
  });
```

## Configuration

### 1. Firebase Functions Configuration

Set up the OneSignal configuration in Firebase Functions:

```bash
firebase functions:config:set onesignal.api_key="YOUR_ONESIGNAL_API_KEY" onesignal.web_app_id="YOUR_ONESIGNAL_WEB_APP_ID" onesignal.mobile_app_id="YOUR_ONESIGNAL_MOBILE_APP_ID"
```

### 2. iOS Configuration

#### Info.plist

Add the following to your `ios/AISportsEdge/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

#### AppDelegate.m

Update your `ios/AISportsEdge/AppDelegate.m`:

```objective-c
#import <OneSignal/OneSignal.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Initialize OneSignal
  [OneSignal setLogLevel:ONE_S_LL_VERBOSE visualLevel:ONE_S_LL_NONE];
  [OneSignal initWithLaunchOptions:launchOptions];
  [OneSignal setAppId:@"YOUR_ONESIGNAL_MOBILE_APP_ID"];
  
  // ... rest of your implementation
}

@end
```

### 3. Android Configuration

#### build.gradle

Update your `android/app/build.gradle`:

```gradle
dependencies {
  // ... existing dependencies
  implementation 'com.onesignal:OneSignal:[4.0.0, 4.99.99]'
}
```

#### AndroidManifest.xml

Update your `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <application>
    <!-- ... -->
    <meta-data android:name="com.onesignal.NotificationServiceExtension"
               android:value="com.aisportsedge.NotificationServiceExtension" />
  </application>
</manifest>
```

#### MainApplication.java

Update your `android/app/src/main/java/com/aisportsedge/MainApplication.java`:

```java
import com.onesignal.OneSignal;

public class MainApplication extends Application implements ReactApplication {
  @Override
  public void onCreate() {
    super.onCreate();
    
    // OneSignal Initialization
    OneSignal.initWithContext(this);
    OneSignal.setAppId("YOUR_ONESIGNAL_MOBILE_APP_ID");
    
    // ... rest of your implementation
  }
}
```

## Testing

### 1. Web Testing

To test web push notifications:

1. Deploy the web app to a test environment
2. Open the web app in a browser
3. Allow notifications when prompted
4. Send a test notification from the OneSignal dashboard
5. Verify that the notification is received

### 2. Mobile Testing

To test mobile push notifications:

1. Build the app for iOS and Android
2. Install on test devices
3. Allow notifications when prompted
4. Send a test notification from the OneSignal dashboard
5. Verify that the notification is received
6. Test deep linking by clicking on the notification

### 3. Backend Testing

To test the backend integration:

1. Deploy the Firebase functions
2. Create a test prediction in Firestore
3. Verify that the notification is sent
4. Create a test value bet in Firestore
5. Verify that the notification is sent