# Notification Personalization Plan

## Overview

The current notification system in AI Sports Edge has basic personalization based on user preferences for sports and notification types. However, to make the notification API truly personalized for each user, we need to implement more advanced personalization features that consider user interests, behavior, and preferences.

## Current State Analysis

### Strengths
- Basic filtering of notifications based on user preferences (sports, notification types)
- Support for different notification channels (web, mobile)
- Integration with OneSignal for cross-platform notifications
- User preference management system already in place

### Limitations
- Limited personalization of notification content
- No time-based controls for notification delivery
- No frequency controls to prevent notification fatigue
- No prioritization based on user interests or behavior
- No analytics to improve personalization over time

## Personalization Enhancement Plan

### 1. Enhanced User Notification Preferences

#### 1.1 Notification Preference Schema Updates

```javascript
// Add to DEFAULT_PREFERENCES in userPreferencesService.js
notifications: {
  // Existing preferences
  predictions: true,
  valueBets: true,
  gameReminders: true,
  modelPerformance: true,
  
  // New preferences
  frequency: 'normal', // 'low', 'normal', 'high'
  quietHours: {
    enabled: false,
    start: '22:00', // 10 PM
    end: '08:00'    // 8 AM
  },
  maxPerDay: 10,
  priorityOnly: false, // Only send high-priority notifications
  
  // Content preferences
  includeOdds: true,
  includeStats: true,
  includeNews: true,
  
  // Channel preferences
  channels: {
    push: true,
    email: true,
    inApp: true
  },
  
  // RSS feed specific notifications
  rssAlerts: {
    enabled: true,
    favoriteTeamsOnly: false,
    favoritePlayersOnly: false,
    keywordAlerts: []
  }
}
```

#### 1.2 User Preference UI Updates

Create a dedicated notification preferences screen that allows users to:
- Set notification frequency
- Configure quiet hours
- Set maximum notifications per day
- Choose notification content preferences
- Configure RSS feed alert preferences

### 2. Notification Content Personalization

#### 2.1 Dynamic Content Generation

```javascript
/**
 * Generate personalized notification content based on user preferences
 * @param {Object} baseContent - Base notification content
 * @param {Object} userData - User data and preferences
 * @returns {Object} Personalized notification content
 */
function generatePersonalizedContent(baseContent, userData) {
  const { title, message, data } = baseContent;
  const { preferences, favorites } = userData;
  
  let personalizedTitle = title;
  let personalizedMessage = message;
  
  // Personalize based on favorite teams
  if (data.teams && favorites.teams.length > 0) {
    const favoriteTeam = favorites.teams.find(team => 
      data.teams.includes(team)
    );
    
    if (favoriteTeam) {
      personalizedTitle = `${favoriteTeam}: ${title}`;
    }
  }
  
  // Add odds information if user prefers it
  if (preferences.notifications.includeOdds && data.odds) {
    personalizedMessage += ` Odds: ${formatOdds(data.odds, preferences.betting.oddsFormat)}`;
  }
  
  // Add stats if user prefers them
  if (preferences.notifications.includeStats && data.stats) {
    personalizedMessage += ` ${formatStats(data.stats)}`;
  }
  
  return {
    title: personalizedTitle,
    message: personalizedMessage,
    data
  };
}
```

#### 2.2 Notification Templates

Create a template system for notifications that can be customized based on user preferences:

```javascript
const NOTIFICATION_TEMPLATES = {
  prediction: {
    title: 'New Prediction Available',
    message: 'Check out our prediction for {homeTeam} vs {awayTeam}',
    titleWithFavorite: '{favoriteTeam} Prediction Available',
    messageWithOdds: 'Our prediction for {homeTeam} vs {awayTeam}. Odds: {odds}'
  },
  valueBet: {
    title: 'Value Betting Opportunity',
    message: "We've identified a {edge}% edge on {team}",
    titleWithFavorite: '{favoriteTeam} Betting Opportunity',
    messageWithOdds: "{edge}% edge on {team}. Odds: {odds}"
  },
  // More templates...
}
```

### 3. Notification Delivery Optimization

#### 3.1 Time-Based Delivery

```javascript
/**
 * Check if current time is within user's quiet hours
 * @param {Object} quietHours - User's quiet hours settings
 * @returns {boolean} Whether current time is in quiet hours
 */
function isInQuietHours(quietHours) {
  if (!quietHours.enabled) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  const startTime = quietHours.start;
  const endTime = quietHours.end;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }
  
  // Normal quiet hours
  return currentTime >= startTime && currentTime < endTime;
}
```

#### 3.2 Frequency Management

```javascript
/**
 * Check if user has reached their notification limit for the day
 * @param {string} userId - User ID
 * @param {number} maxPerDay - Maximum notifications per day
 * @returns {Promise<boolean>} Whether user has reached their limit
 */
async function hasReachedDailyLimit(userId, maxPerDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const notificationsSnapshot = await admin.firestore()
    .collection('notificationLogs')
    .where('userId', '==', userId)
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
    .get();
  
  return notificationsSnapshot.size >= maxPerDay;
}
```

#### 3.3 Notification Prioritization

```javascript
/**
 * Calculate notification priority score based on user preferences and behavior
 * @param {Object} notification - Notification data
 * @param {Object} userData - User data and preferences
 * @returns {number} Priority score (higher = more important)
 */
function calculatePriorityScore(notification, userData) {
  let score = 0;
  const { data } = notification;
  const { preferences, favorites, analytics } = userData;
  
  // Base priority by notification type
  const typePriorities = {
    valueBet: 5,
    prediction: 4,
    gameReminder: 3,
    modelPerformance: 2,
    news: 1
  };
  
  score += typePriorities[data.type] || 0;
  
  // Boost score for favorite teams
  if (data.teams && favorites.teams.some(team => data.teams.includes(team))) {
    score += 3;
  }
  
  // Boost score for favorite players
  if (data.players && favorites.players.some(player => data.players.includes(player))) {
    score += 2;
  }
  
  // Boost score based on user engagement history
  if (analytics && analytics.engagementRates) {
    const engagementRate = analytics.engagementRates[data.type] || 0;
    score += engagementRate * 2; // 0-2 points based on engagement rate (0-1)
  }
  
  return score;
}
```

### 4. Enhanced Notification Service

Update the notification service to incorporate these personalization features:

```javascript
/**
 * Send a personalized notification to a user
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID
 * @param {string} options.type - Notification type
 * @param {Object} options.data - Notification data
 * @returns {Promise} - Promise that resolves when notification is sent
 */
async function sendPersonalizedNotification(options) {
  const { userId, type, data } = options;
  
  // Get user data and preferences
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  if (!userDoc.exists) {
    console.log(`User ${userId} not found`);
    return null;
  }
  
  const userData = userDoc.data();
  const { preferences } = userData;
  
  // Check if user wants this type of notification
  if (!preferences.notifications[type]) {
    console.log(`User ${userId} has disabled ${type} notifications`);
    return null;
  }
  
  // Check quiet hours
  if (isInQuietHours(preferences.notifications.quietHours)) {
    console.log(`Skipping notification for user ${userId} during quiet hours`);
    return null;
  }
  
  // Check daily limit
  if (await hasReachedDailyLimit(userId, preferences.notifications.maxPerDay)) {
    console.log(`User ${userId} has reached daily notification limit`);
    return null;
  }
  
  // Get notification template
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) {
    console.error(`No template found for notification type: ${type}`);
    return null;
  }
  
  // Generate base content from template
  const baseContent = {
    title: template.title,
    message: template.message,
    data
  };
  
  // Personalize content
  const personalizedContent = generatePersonalizedContent(baseContent, userData);
  
  // Calculate priority
  const priorityScore = calculatePriorityScore(personalizedContent, userData);
  
  // Skip low-priority notifications if user only wants priority notifications
  if (preferences.notifications.priorityOnly && priorityScore < 5) {
    console.log(`Skipping low-priority notification for user ${userId}`);
    return null;
  }
  
  // Send notification
  const result = await notificationService.sendToUsers({
    title: personalizedContent.title,
    message: personalizedContent.message,
    data: {
      ...personalizedContent.data,
      priorityScore
    },
    userIds: [userId],
    platform: 'all'
  });
  
  // Log notification for analytics
  await admin.firestore().collection('notificationLogs').add({
    userId,
    type,
    content: personalizedContent,
    priorityScore,
    timestamp: admin.firestore.Timestamp.now()
  });
  
  return result;
}
```

### 5. RSS Feed Notification Integration

Enhance the RSS feed system to send personalized notifications for important news:

```javascript
/**
 * Send notifications for important RSS feed items
 * @param {Array} newItems - New RSS feed items
 * @returns {Promise} - Promise that resolves when notifications are sent
 */
async function sendRssNotifications(newItems) {
  if (!newItems || !newItems.length) return null;
  
  // Get users with RSS notifications enabled
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('preferences.notifications.rssAlerts.enabled', '==', true)
    .get();
  
  if (usersSnapshot.empty) {
    console.log('No users have RSS notifications enabled');
    return null;
  }
  
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Process each item
  const promises = newItems.map(async (item) => {
    // Find users who should receive this notification
    const relevantUsers = users.filter(user => {
      const rssPrefs = user.preferences.notifications.rssAlerts;
      
      // Check if user only wants notifications for favorite teams
      if (rssPrefs.favoriteTeamsOnly && item.teams) {
        const hasRelevantTeam = user.favorites.teams.some(team => 
          item.teams.includes(team)
        );
        if (!hasRelevantTeam) return false;
      }
      
      // Check if user only wants notifications for favorite players
      if (rssPrefs.favoritePlayersOnly && item.players) {
        const hasRelevantPlayer = user.favorites.players.some(player => 
          item.players.includes(player)
        );
        if (!hasRelevantPlayer) return false;
      }
      
      // Check for keyword alerts
      if (rssPrefs.keywordAlerts && rssPrefs.keywordAlerts.length > 0) {
        const itemText = [
          item.title || '',
          item.description || '',
          item.teams || ''
        ].join(' ').toLowerCase();
        
        const hasKeyword = rssPrefs.keywordAlerts.some(keyword => 
          itemText.includes(keyword.toLowerCase())
        );
        
        if (!hasKeyword) return false;
      }
      
      return true;
    });
    
    if (!relevantUsers.length) return null;
    
    // Send personalized notifications to each relevant user
    return Promise.all(relevantUsers.map(user => 
      sendPersonalizedNotification({
        userId: user.id,
        type: 'news',
        data: {
          title: item.title,
          description: item.description,
          teams: item.teams,
          players: item.players,
          sport: item.sport,
          url: item.link,
          pubDate: item.pubDate,
          source: item.source
        }
      })
    ));
  });
  
  return Promise.all(promises);
}
```

### 6. Notification Analytics and Optimization

Implement a system to track notification engagement and optimize future notifications:

```javascript
/**
 * Track notification engagement
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @param {string} action - Engagement action (open, click, dismiss)
 * @returns {Promise} - Promise that resolves when tracking is complete
 */
async function trackNotificationEngagement(notificationId, userId, action) {
  // Log the engagement
  await admin.firestore().collection('notificationEngagements').add({
    notificationId,
    userId,
    action,
    timestamp: admin.firestore.Timestamp.now()
  });
  
  // Update user engagement rates
  const userRef = admin.firestore().collection('users').doc(userId);
  
  return admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return;
    
    const userData = userDoc.data();
    const notificationLog = await admin.firestore()
      .collection('notificationLogs')
      .doc(notificationId)
      .get();
    
    if (!notificationLog.exists) return;
    
    const notificationType = notificationLog.data().type;
    
    // Initialize analytics if needed
    if (!userData.analytics) {
      userData.analytics = {
        engagementRates: {}
      };
    }
    
    if (!userData.analytics.engagementRates) {
      userData.analytics.engagementRates = {};
    }
    
    // Calculate new engagement rate using exponential moving average
    const currentRate = userData.analytics.engagementRates[notificationType] || 0;
    const engagementValue = action === 'open' || action === 'click' ? 1 : 0;
    const alpha = 0.3; // Weight for new data point
    const newRate = (alpha * engagementValue) + ((1 - alpha) * currentRate);
    
    userData.analytics.engagementRates[notificationType] = newRate;
    
    // Update user document
    transaction.update(userRef, {
      'analytics.engagementRates': userData.analytics.engagementRates
    });
  });
}
```

## Implementation Phases

### Phase 1: Enhanced User Preferences
- Update user preference schema
- Create notification preferences UI
- Implement quiet hours and frequency controls

### Phase 2: Content Personalization
- Implement notification templates
- Create dynamic content generation
- Add personalization based on user favorites

### Phase 3: Delivery Optimization
- Implement time-based delivery
- Add frequency management
- Create notification prioritization system

### Phase 4: RSS Feed Integration
- Enhance RSS feed system to trigger notifications
- Implement keyword-based alerts
- Add team and player-specific notifications

### Phase 5: Analytics and Optimization
- Implement notification engagement tracking
- Create analytics dashboard
- Add automatic optimization based on user behavior

## Technical Considerations

### Database Schema Updates
- Add notification logs collection
- Add notification engagement collection
- Update user preferences schema

### Performance Considerations
- Batch notification processing for efficiency
- Implement caching for frequently accessed user preferences
- Use cloud functions for background processing

### Security Considerations
- Ensure proper authentication for notification preferences
- Validate user input for notification settings
- Implement rate limiting for notification APIs

## Success Metrics

- Increased notification engagement rates
- Reduced notification opt-out rates
- Higher user retention for users receiving personalized notifications
- Improved user satisfaction with notification content and frequency

## Conclusion

By implementing this personalization plan, the AI Sports Edge notification system will deliver highly relevant, timely, and engaging notifications to each user based on their individual preferences, interests, and behavior. This will enhance the user experience, increase engagement, and improve overall user satisfaction with the app.