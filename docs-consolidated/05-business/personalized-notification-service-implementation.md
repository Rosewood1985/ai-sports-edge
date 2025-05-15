# Personalized Notification Service Implementation

This document provides the implementation details for the personalized notification service that will be integrated into the AI Sports Edge application. This service extends the existing notification system to provide highly personalized notifications based on user preferences, behavior, and interests.

## File Structure

```
functions/
  ├── notificationService.js (existing)
  ├── notifications.js (existing)
  ├── personalizedNotificationService.js (new)
  └── notificationTemplates.js (new)
```

## Implementation Details

### 1. Notification Templates (notificationTemplates.js)

```javascript
/**
 * Notification Templates for AI Sports Edge
 * Provides templates for different types of notifications
 */

// Template variables:
// {homeTeam} - Home team name
// {awayTeam} - Away team name
// {favoriteTeam} - User's favorite team
// {edge} - Betting edge percentage
// {team} - Team name
// {odds} - Formatted odds
// {stats} - Formatted stats
// {score} - Game score
// {player} - Player name

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
  gameReminder: {
    title: 'Game Starting Soon',
    message: '{homeTeam} vs {awayTeam} starts in 30 minutes',
    titleWithFavorite: '{favoriteTeam} Game Starting Soon',
    messageWithStats: '{homeTeam} ({homeRecord}) vs {awayTeam} ({awayRecord}) starts in 30 minutes'
  },
  modelPerformance: {
    title: 'Weekly Model Performance Update',
    message: 'Overall accuracy: {accuracy}% ({correct}/{total})',
    titleWithFavorite: '{favoriteTeam} Model Performance',
    messageWithStats: 'Overall accuracy: {accuracy}% ({correct}/{total})\n{sportBreakdown}'
  },
  news: {
    title: 'Sports News Update',
    message: '{title}',
    titleWithFavorite: '{favoriteTeam} News Update',
    messageWithSource: '{title} - via {source}'
  },
  playerUpdate: {
    title: 'Player Update',
    message: '{player} {update}',
    titleWithFavorite: '{player} Update',
    messageWithStats: '{player} {update}: {stats}'
  }
};

/**
 * Format a template with provided variables
 * @param {string} template - Template string
 * @param {Object} variables - Variables to insert
 * @returns {string} Formatted string
 */
function formatTemplate(template, variables) {
  let result = template;
  
  // Replace all variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Get a notification template
 * @param {string} type - Notification type
 * @param {string} variant - Template variant (default, withFavorite, withOdds, withStats, withSource)
 * @param {Object} variables - Variables to insert
 * @returns {Object} Formatted title and message
 */
function getNotificationTemplate(type, variant = 'default', variables = {}) {
  const templates = NOTIFICATION_TEMPLATES[type];
  
  if (!templates) {
    console.error(`No template found for notification type: ${type}`);
    return {
      title: 'Notification',
      message: 'You have a new notification'
    };
  }
  
  let titleTemplate = templates.title;
  let messageTemplate = templates.message;
  
  // Get the appropriate template variant
  switch (variant) {
    case 'withFavorite':
      titleTemplate = templates.titleWithFavorite || titleTemplate;
      break;
    case 'withOdds':
      messageTemplate = templates.messageWithOdds || messageTemplate;
      break;
    case 'withStats':
      messageTemplate = templates.messageWithStats || messageTemplate;
      break;
    case 'withSource':
      messageTemplate = templates.messageWithSource || messageTemplate;
      break;
  }
  
  // Format the templates
  return {
    title: formatTemplate(titleTemplate, variables),
    message: formatTemplate(messageTemplate, variables)
  };
}

module.exports = {
  NOTIFICATION_TEMPLATES,
  formatTemplate,
  getNotificationTemplate
};
```

### 2. Personalized Notification Service (personalizedNotificationService.js)

```javascript
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const notificationService = require('./notificationService');
const { getNotificationTemplate } = require('./notificationTemplates');

/**
 * Personalized Notification Service for AI Sports Edge
 * Extends the base notification service with personalization features
 */
class PersonalizedNotificationService {
  constructor() {
    this.notificationService = notificationService;
  }
  
  /**
   * Check if current time is within user's quiet hours
   * @param {Object} quietHours - User's quiet hours settings
   * @returns {boolean} Whether current time is in quiet hours
   */
  isInQuietHours(quietHours) {
    if (!quietHours || !quietHours.enabled) return false;
    
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
  
  /**
   * Check if user has reached their notification limit for the day
   * @param {string} userId - User ID
   * @param {number} maxPerDay - Maximum notifications per day
   * @returns {Promise<boolean>} Whether user has reached their limit
   */
  async hasReachedDailyLimit(userId, maxPerDay) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notificationsSnapshot = await admin.firestore()
      .collection('notificationLogs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();
    
    return notificationsSnapshot.size >= maxPerDay;
  }
  
  /**
   * Calculate notification priority score based on user preferences and behavior
   * @param {Object} notification - Notification data
   * @param {Object} userData - User data and preferences
   * @returns {number} Priority score (higher = more important)
   */
  calculatePriorityScore(notification, userData) {
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
    if (data.teams && favorites && favorites.teams && favorites.teams.length > 0) {
      const hasTeam = favorites.teams.some(team => 
        data.teams.includes(team)
      );
      
      if (hasTeam) {
        score += 3;
      }
    }
    
    // Boost score for favorite players
    if (data.players && favorites && favorites.players && favorites.players.length > 0) {
      const hasPlayer = favorites.players.some(player => 
        data.players.includes(player)
      );
      
      if (hasPlayer) {
        score += 2;
      }
    }
    
    // Boost score based on user engagement history
    if (analytics && analytics.engagementRates) {
      const engagementRate = analytics.engagementRates[data.type] || 0;
      score += engagementRate * 2; // 0-2 points based on engagement rate (0-1)
    }
    
    return score;
  }
  
  /**
   * Generate personalized notification content based on user preferences
   * @param {Object} baseContent - Base notification content
   * @param {Object} userData - User data and preferences
   * @returns {Object} Personalized notification content
   */
  generatePersonalizedContent(baseContent, userData) {
    const { title, message, data } = baseContent;
    const { preferences, favorites } = userData;
    
    let personalizedTitle = title;
    let personalizedMessage = message;
    let templateVariant = 'default';
    const templateVariables = { ...data };
    
    // Check for favorite team
    let favoriteTeam = null;
    if (data.teams && favorites && favorites.teams && favorites.teams.length > 0) {
      favoriteTeam = favorites.teams.find(team => 
        data.teams.includes(team)
      );
      
      if (favoriteTeam) {
        templateVariant = 'withFavorite';
        templateVariables.favoriteTeam = favoriteTeam;
      }
    }
    
    // Add odds information if user prefers it
    if (preferences.notifications && preferences.notifications.includeOdds && data.odds) {
      if (templateVariant !== 'withFavorite') {
        templateVariant = 'withOdds';
      }
      templateVariables.odds = this.formatOdds(data.odds, preferences.betting?.oddsFormat || 'american');
    }
    
    // Add stats if user prefers them
    if (preferences.notifications && preferences.notifications.includeStats && data.stats) {
      if (templateVariant !== 'withFavorite' && templateVariant !== 'withOdds') {
        templateVariant = 'withStats';
      }
      templateVariables.stats = this.formatStats(data.stats);
    }
    
    // Get personalized content from template
    const template = getNotificationTemplate(data.type, templateVariant, templateVariables);
    
    return {
      title: template.title,
      message: template.message,
      data
    };
  }
  
  /**
   * Format odds based on user preference
   * @param {number} odds - American odds
   * @param {string} format - Odds format (american, decimal, fractional)
   * @returns {string} Formatted odds
   */
  formatOdds(odds, format = 'american') {
    if (typeof odds !== 'number') return '';
    
    switch (format) {
      case 'decimal':
        // Convert American odds to decimal
        if (odds > 0) {
          return ((odds / 100) + 1).toFixed(2);
        } else {
          return (1 - (100 / odds)).toFixed(2);
        }
      case 'fractional':
        // Convert American odds to fractional
        if (odds > 0) {
          const gcd = this.getGCD(odds, 100);
          return `${odds / gcd}/${100 / gcd}`;
        } else {
          const absOdds = Math.abs(odds);
          const gcd = this.getGCD(100, absOdds);
          return `${100 / gcd}/${absOdds / gcd}`;
        }
      case 'american':
      default:
        // Return American odds with + or - sign
        return odds > 0 ? `+${odds}` : odds.toString();
    }
  }
  
  /**
   * Calculate greatest common divisor (for fractional odds)
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Greatest common divisor
   */
  getGCD(a, b) {
    if (!b) return a;
    return this.getGCD(b, a % b);
  }
  
  /**
   * Format stats for notification
   * @param {Object} stats - Stats object
   * @returns {string} Formatted stats
   */
  formatStats(stats) {
    if (!stats || typeof stats !== 'object') return '';
    
    // Format based on stats type
    if (stats.type === 'player') {
      return `${stats.points || 0} pts, ${stats.rebounds || 0} reb, ${stats.assists || 0} ast`;
    } else if (stats.type === 'team') {
      return `${stats.wins || 0}-${stats.losses || 0}`;
    } else {
      // Generic stats formatting
      return Object.entries(stats)
        .filter(([key]) => key !== 'type')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
  }
  
  /**
   * Send a personalized notification to a user
   * @param {Object} options - Notification options
   * @param {string} options.userId - User ID
   * @param {string} options.type - Notification type
   * @param {Object} options.data - Notification data
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendPersonalizedNotification(options) {
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
    if (!preferences.notifications || !preferences.notifications[type]) {
      console.log(`User ${userId} has disabled ${type} notifications`);
      return null;
    }
    
    // Check quiet hours
    if (this.isInQuietHours(preferences.notifications.quietHours)) {
      console.log(`Skipping notification for user ${userId} during quiet hours`);
      return null;
    }
    
    // Check daily limit
    if (preferences.notifications.maxPerDay && 
        await this.hasReachedDailyLimit(userId, preferences.notifications.maxPerDay)) {
      console.log(`User ${userId} has reached daily notification limit`);
      return null;
    }
    
    // Generate base content
    const baseContent = {
      title: '',
      message: '',
      data: {
        ...data,
        type
      }
    };
    
    // Personalize content
    const personalizedContent = this.generatePersonalizedContent(baseContent, userData);
    
    // Calculate priority
    const priorityScore = this.calculatePriorityScore(personalizedContent, userData);
    
    // Skip low-priority notifications if user only wants priority notifications
    if (preferences.notifications.priorityOnly && priorityScore < 5) {
      console.log(`Skipping low-priority notification for user ${userId}`);
      return null;
    }
    
    // Determine which channels to send to
    const channels = preferences.notifications.channels || { push: true };
    
    // Send notification through appropriate channels
    const promises = [];
    
    // Push notification
    if (channels.push) {
      promises.push(this.notificationService.sendToUsers({
        title: personalizedContent.title,
        message: personalizedContent.message,
        data: {
          ...personalizedContent.data,
          priorityScore
        },
        userIds: [userId],
        platform: 'all'
      }));
    }
    
    // Log notification for analytics
    await admin.firestore().collection('notificationLogs').add({
      userId,
      type,
      content: personalizedContent,
      priorityScore,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    return Promise.all(promises);
  }
  
  /**
   * Send personalized notifications to multiple users
   * @param {Object} options - Notification options
   * @param {Array<string>} options.userIds - User IDs
   * @param {string} options.type - Notification type
   * @param {Object} options.data - Notification data
   * @returns {Promise} - Promise that resolves when notifications are sent
   */
  async sendPersonalizedNotifications(options) {
    const { userIds, type, data } = options;
    
    if (!userIds || !userIds.length) {
      console.log('No users provided for personalized notifications');
      return null;
    }
    
    const promises = userIds.map(userId => 
      this.sendPersonalizedNotification({
        userId,
        type,
        data
      })
    );
    
    return Promise.all(promises);
  }
  
  /**
   * Track notification engagement
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @param {string} action - Engagement action (open, click, dismiss)
   * @returns {Promise} - Promise that resolves when tracking is complete
   */
  async trackNotificationEngagement(notificationId, userId, action) {
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
}

// Export a singleton instance
module.exports = new PersonalizedNotificationService();
```

### 3. Updated Notifications.js (modifications)

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const personalizedNotificationService = require('./personalizedNotificationService');

/**
 * Trigger notification when new predictions are available
 */
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
      console.log('No users found for prediction notification');
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    console.log(`Sending prediction notification to ${userIds.length} users`);
    
    // Send personalized notifications
    return personalizedNotificationService.sendPersonalizedNotifications({
      userIds,
      type: 'prediction',
      data: {
        predictionId: context.params.predictionId,
        sport: prediction.sport,
        homeTeam: prediction.homeTeam,
        awayTeam: prediction.awayTeam,
        teams: [prediction.homeTeam, prediction.awayTeam],
        screen: 'Odds'
      }
    });
  });

/**
 * Trigger notification for value betting opportunities
 */
exports.sendValueBetNotifications = functions.firestore
  .document('valueBets/{betId}')
  .onCreate(async (snapshot, context) => {
    const valueBet = snapshot.data();
    
    // Only send notifications for high-value bets
    if (valueBet.value < 0.1) { // 10% edge
      console.log(`Value bet ${context.params.betId} has low value (${valueBet.value}), skipping notification`);
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
      console.log('No premium users found for value bet notification');
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    console.log(`Sending value bet notification to ${userIds.length} premium users`);
    
    // Send personalized notifications
    return personalizedNotificationService.sendPersonalizedNotifications({
      userIds,
      type: 'valueBet',
      data: {
        betId: context.params.betId,
        sport: valueBet.sport,
        team: valueBet.team,
        teams: [valueBet.team],
        edge: Math.round(valueBet.value * 100),
        odds: valueBet.odds,
        screen: 'Odds'
      }
    });
  });

// Similar updates for other notification functions...
```

### 4. RSS Feed Integration

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
    // Extract teams and players from item
    const teams = extractTeams(item);
    const players = extractPlayers(item);
    
    // Find users who should receive this notification
    const relevantUsers = users.filter(user => {
      const rssPrefs = user.preferences.notifications.rssAlerts;
      
      // Check if user only wants notifications for favorite teams
      if (rssPrefs.favoriteTeamsOnly && teams.length > 0) {
        const hasRelevantTeam = user.favorites.teams.some(team => 
          teams.includes(team)
        );
        if (!hasRelevantTeam) return false;
      }
      
      // Check if user only wants notifications for favorite players
      if (rssPrefs.favoritePlayersOnly && players.length > 0) {
        const hasRelevantPlayer = user.favorites.players.some(player => 
          players.includes(player)
        );
        if (!hasRelevantPlayer) return false;
      }
      
      // Check for keyword alerts
      if (rssPrefs.keywordAlerts && rssPrefs.keywordAlerts.length > 0) {
        const itemText = [
          item.title || '',
          item.description || '',
          teams.join(' ')
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
      personalizedNotificationService.sendPersonalizedNotification({
        userId: user.id,
        type: 'news',
        data: {
          title: item.title,
          description: item.description,
          teams,
          players,
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

/**
 * Extract team names from RSS item
 * @param {Object} item - RSS item
 * @returns {Array} Array of team names
 */
function extractTeams(item) {
  // If item already has teams property, use it
  if (item.teams && Array.isArray(item.teams)) {
    return item.teams;
  }
  
  // Otherwise, try to extract from title and description
  const teams = [];
  const teamDatabase = require('../data/teams.json');
  
  const itemText = [
    item.title || '',
    item.description || ''
  ].join(' ');
  
  // Check for team names in the text
  teamDatabase.forEach(team => {
    if (itemText.includes(team.name)) {
      teams.push(team.name);
    }
    
    // Check for team nicknames
    if (team.nicknames) {
      team.nicknames.forEach(nickname => {
        if (itemText.includes(nickname)) {
          teams.push(team.name);
        }
      });
    }
  });
  
  return [...new Set(teams)]; // Remove duplicates
}

/**
 * Extract player names from RSS item
 * @param {Object} item - RSS item
 * @returns {Array} Array of player names
 */
function extractPlayers(item) {
  // If item already has players property, use it
  if (item.players && Array.isArray(item.players)) {
    return item.players;
  }
  
  // Otherwise, try to extract from title and description
  const players = [];
  const playerDatabase = require('../data/players.json');
  
  const itemText = [
    item.title || '',
    item.description || ''
  ].join(' ');
  
  // Check for player names in the text
  playerDatabase.forEach(player => {
    if (itemText.includes(player.name)) {
      players.push(player.name);
    }
  });
  
  return [...new Set(players)]; // Remove duplicates
}

// Export the function
module.exports = {
  sendRssNotifications
};
```

## User Preference Schema Updates

The user preferences schema needs to be updated to support the new notification personalization features. Here's the updated schema:

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

## Database Schema Updates

### Notification Logs Collection

```javascript
// notificationLogs/{notificationId}
{
  userId: 'user123',
  type: 'prediction',
  content: {
    title: 'Lakers Prediction Available',
    message: 'Our prediction for Lakers vs Celtics. Odds: +150',
    data: {
      predictionId: 'pred123',
      sport: 'NBA',
      homeTeam: 'Lakers',
      awayTeam: 'Celtics',
      teams: ['Lakers', 'Celtics'],
      screen: 'Odds'
    }
  },
  priorityScore: 7,
  timestamp: Timestamp
}
```

### Notification Engagements Collection

```javascript
// notificationEngagements/{engagementId}
{
  notificationId: 'notification123',
  userId: 'user123',
  action: 'open', // 'open', 'click', 'dismiss'
  timestamp: Timestamp
}
```

### User Analytics

```javascript
// users/{userId}
{
  // Existing user data...
  
  analytics: {
    engagementRates: {
      prediction: 0.75,
      valueBet: 0.9,
      gameReminder: 0.6,
      modelPerformance: 0.3,
      news: 0.5
    }
  }
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

## Conclusion

This implementation plan provides a comprehensive approach to personalizing notifications in the AI Sports Edge application. By implementing these changes, the application will be able to deliver highly relevant, timely, and engaging notifications to each user based on their individual preferences, interests, and behavior.