const admin = require('firebase-admin');
const functions = require('firebase-functions');
const notificationService = require('./notificationService');
const { getNotificationTemplate } = require('./notificationTemplates');
const cloudGeolocationService = require('./cloudGeolocationService');

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
      news: 1,
      localTeam: 4,
      localGame: 3,
      localOdds: 4
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
    
    // Boost score for local teams
    if (data.isLocal && preferences.notifications && preferences.notifications.locationBased) {
      score += 3;
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
   * Send a referral notification to a user
   * @param {Object} options - Notification options
   * @param {string} options.userId - User ID of the referrer
   * @param {string} options.referredUserId - User ID of the referred user
   * @param {string} options.type - Notification type (newReferral, referralReward, milestoneReached, leaderboardRankChange)
   * @param {Object} options.data - Additional notification data
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendReferralNotification(options) {
    const { userId, referredUserId, type, data = {} } = options;
    
    if (!userId) {
      console.log('No user ID provided for referral notification');
      return null;
    }
    
    try {
      // Get referrer user data
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        console.log(`User ${userId} not found`);
        return null;
      }
      
      const userData = userDoc.data();
      
      // Get referred user data if available
      let referredUserData = null;
      if (referredUserId) {
        const referredUserDoc = await admin.firestore().collection('users').doc(referredUserId).get();
        if (referredUserDoc.exists) {
          referredUserData = referredUserDoc.data();
        }
      }
      
      // Prepare notification data
      const notificationData = {
        ...data,
        type,
        isReferralNotification: true
      };
      
      // Add referred user name if available
      if (referredUserData) {
        notificationData.referredName = referredUserData.displayName || 'A new user';
      }
      
      // Send the personalized notification
      return this.sendPersonalizedNotification({
        userId,
        type,
        data: notificationData
      });
    } catch (error) {
      console.error('Error sending referral notification:', error);
      return null;
    }
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

  /**
   * Check if user is interested in location-based notifications
   * @param {Object} preferences - User preferences
   * @returns {boolean} Whether user is interested in location-based notifications
   */
  isInterestedInLocationBasedNotifications(preferences) {
    return (
      preferences.notifications &&
      preferences.notifications.locationBased &&
      preferences.notifications.locationBased.enabled
    );
  }

  /**
   * Send location-based notifications to users in a specific area
   * @param {Object} options - Notification options
   * @param {Object} options.location - Location data (city, state, country)
   * @param {string} options.type - Notification type (localTeam, localGame, localOdds)
   * @param {Object} options.data - Notification data
   * @returns {Promise} - Promise that resolves when notifications are sent
   */
  async sendLocationBasedNotifications(options) {
    const { location, type, data } = options;
    
    if (!location || !location.city) {
      console.log('No location provided for location-based notifications');
      return null;
    }
    
    // Get users with location-based notifications enabled
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('preferences.notifications.locationBased.enabled', '==', true)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No users have location-based notifications enabled');
      return null;
    }
    
    const promises = [];
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Skip users who have reached their daily limit
      if (
        userData.preferences.notifications.maxPerDay &&
        await this.hasReachedDailyLimit(userDoc.id, userData.preferences.notifications.maxPerDay)
      ) {
        continue;
      }
      
      // Skip users in quiet hours
      if (this.isInQuietHours(userData.preferences.notifications.quietHours)) {
        continue;
      }
      
      // Send notification
      promises.push(
        this.sendPersonalizedNotification({
          userId: userDoc.id,
          type,
          data: {
            ...data,
            isLocal: true,
            location
          }
        })
      );
    }
    
    return Promise.all(promises);
  }

  /**
   * Send notifications about local teams
   * @param {Object} location - User location
   * @param {Array} localTeams - Local teams
   * @returns {Promise} - Promise that resolves when notifications are sent
   */
  async sendLocalTeamNotifications(location, localTeams) {
    if (!localTeams || !localTeams.length) {
      console.log('No local teams to send notifications about');
      return null;
    }
    
    const promises = [];
    
    // Send a notification for each local team
    for (const team of localTeams) {
      promises.push(
        this.sendLocationBasedNotifications({
          location,
          type: 'localTeam',
          data: {
            team,
            teams: [team],
            message: `We found a local team in your area: ${team}`
          }
        })
      );
    }
    
    return Promise.all(promises);
  }

  /**
   * Send notifications about local games
   * @param {Object} location - User location
   * @param {Array} localGames - Local games
   * @returns {Promise} - Promise that resolves when notifications are sent
   */
  async sendLocalGameNotifications(location, localGames) {
    if (!localGames || !localGames.length) {
      console.log('No local games to send notifications about');
      return null;
    }
    
    const promises = [];
    
    // Send a notification for each local game
    for (const game of localGames) {
      promises.push(
        this.sendLocationBasedNotifications({
          location,
          type: 'localGame',
          data: {
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            teams: [game.homeTeam, game.awayTeam],
            odds: game.odds,
            gameTime: game.startTime,
            message: `${game.homeTeam} vs ${game.awayTeam} is happening near you`
          }
        })
      );
    }
    
    return Promise.all(promises);
  }

  /**
   * Send notifications about local betting opportunities
   * @param {Object} location - User location
   * @param {Array} localOdds - Local betting opportunities
   * @returns {Promise} - Promise that resolves when notifications are sent
   */
  async sendLocalOddsNotifications(location, localOdds) {
    if (!localOdds || !localOdds.length) {
      console.log('No local odds to send notifications about');
      return null;
    }
    
    const promises = [];
    
    // Send a notification for each local betting opportunity
    for (const odds of localOdds) {
      promises.push(
        this.sendLocationBasedNotifications({
          location,
          type: 'localOdds',
          data: {
            team: odds.team,
            teams: [odds.team],
            odds: odds.odds,
            suggestion: odds.suggestion,
            message: `Betting opportunity for ${odds.team} in your area`
          }
        })
      );
    }
    
    return Promise.all(promises);
  }
}

// Export a singleton instance
module.exports = new PersonalizedNotificationService();