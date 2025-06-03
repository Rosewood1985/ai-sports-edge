/**
 * Location-Based Notifications for AI Sports Edge
 * This module provides functions for sending location-based notifications to users
 */

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const cloudGeolocationService = require("./cloudGeolocationService");
const personalizedNotificationService = require("./personalizedNotificationService");

/**
 * Process location-based notifications for all users
 * @returns {Promise} Promise that resolves when notifications are processed
 */
async function processLocationBasedNotifications() {
  console.log("Processing location-based notifications");
  
  // Get users with location-based notifications enabled
  const usersSnapshot = await admin.firestore()
    .collection("users")
    .where("preferences.notifications.locationBased.enabled", "==", true)
    .get();
  
  if (usersSnapshot.empty) {
    console.log("No users have location-based notifications enabled");
    return null;
  }
  
  console.log(`Found ${usersSnapshot.size} users with location-based notifications enabled`);
  
  const promises = [];
  
  // Process each user
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Skip users who have reached their daily limit
    if (
      userData.preferences.notifications.maxPerDay &&
      await personalizedNotificationService.hasReachedDailyLimit(
        userId, 
        userData.preferences.notifications.maxPerDay
      )
    ) {
      console.log(`User ${userId} has reached daily notification limit`);
      continue;
    }
    
    // Skip users in quiet hours
    if (personalizedNotificationService.isInQuietHours(userData.preferences.notifications.quietHours)) {
      console.log(`Skipping notifications for user ${userId} during quiet hours`);
      continue;
    }
    
    // Process location-based notifications for this user
    promises.push(processUserLocationNotifications(userId, userData));
  }
  
  return Promise.all(promises);
}

/**
 * Process location-based notifications for a specific user
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 * @returns {Promise} Promise that resolves when notifications are processed
 */
async function processUserLocationNotifications(userId, userData) {
  try {
    // Get user location
    let location;
    
    // Check if user has cached location
    if (userData.location && userData.location.timestamp) {
      const now = Date.now();
      const timestamp = userData.location.timestamp.toMillis();
      
      // Use cached location if it's less than 24 hours old
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        location = userData.location;
      }
    }
    
    // If no cached location, get current location
    if (!location) {
      location = await geolocationService.getUserLocation();
      
      // Save location to user document
      await admin.firestore().collection("users").doc(userId).update({
        location: {
          ...location,
          timestamp: admin.firestore.Timestamp.now()
        }
      });
    }
    
    if (!location) {
      console.log(`Could not determine location for user ${userId}`);
      return null;
    }
    
    console.log(`Processing location-based notifications for user ${userId} in ${location.city}, ${location.state}`);
    
    // Get local teams
    const localTeams = await geolocationService.getLocalTeams(location);
    
    if (localTeams.length === 0) {
      console.log(`No local teams found for user ${userId}`);
      return null;
    }
    
    console.log(`Found ${localTeams.length} local teams for user ${userId}`);
    
    // Check if user has already been notified about these teams
    const notificationsSnapshot = await admin.firestore()
      .collection("notificationLogs")
      .where("userId", "==", userId)
      .where("type", "==", "localTeam")
      .get();
    
    const notifiedTeams = new Set();
    
    notificationsSnapshot.forEach(doc => {
      const notification = doc.data();
      if (notification.content && notification.content.data && notification.content.data.team) {
        notifiedTeams.add(notification.content.data.team);
      }
    });
    
    // Filter out teams the user has already been notified about
    const newTeams = localTeams.filter(team => !notifiedTeams.has(team));
    
    if (newTeams.length === 0) {
      console.log(`User ${userId} has already been notified about all local teams`);
      return null;
    }
    
    console.log(`Sending notifications for ${newTeams.length} new local teams to user ${userId}`);
    
    // Send notifications for new teams
    const promises = newTeams.map(team => 
      personalizedNotificationService.sendPersonalizedNotification({
        userId,
        type: "localTeam",
        data: {
          team,
          teams: [team],
          isLocal: true,
          location
        }
      })
    );
    
    // Get localized odds suggestions
    const oddsSuggestions = await geolocationService.getLocalizedOddsSuggestions(location);
    
    if (oddsSuggestions.length > 0) {
      console.log(`Sending ${oddsSuggestions.length} localized odds suggestions to user ${userId}`);
      
      // Send notifications for odds suggestions
      oddsSuggestions.forEach(odds => {
        promises.push(
          personalizedNotificationService.sendPersonalizedNotification({
            userId,
            type: "localOdds",
            data: {
              team: odds.team,
              teams: [odds.team],
              odds: odds.odds,
              suggestion: odds.suggestion,
              isLocal: true,
              location
            }
          })
        );
      });
    }
    
    return Promise.all(promises);
  } catch (error) {
    console.error(`Error processing location-based notifications for user ${userId}:`, error);
    return null;
  }
}

/**
 * Cloud function to process location-based notifications
 */
exports.processLocationNotifications = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    return processLocationBasedNotifications();
  });

/**
 * Cloud function to process location-based notifications when a user's location changes
 */
exports.processLocationNotificationsOnLocationChange = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if location has changed
    if (
      !before.location ||
      !after.location ||
      before.location.city !== after.location.city ||
      before.location.state !== after.location.state
    ) {
      // Process location-based notifications for this user
      return processUserLocationNotifications(context.params.userId, after);
    }
    
    return null;
  });

/**
 * Cloud function to process location-based notifications when a user enables location-based notifications
 */
exports.processLocationNotificationsOnPreferenceChange = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if location-based notifications have been enabled
    const beforeEnabled = before.preferences?.notifications?.locationBased?.enabled || false;
    const afterEnabled = after.preferences?.notifications?.locationBased?.enabled || false;
    
    if (!beforeEnabled && afterEnabled) {
      // Process location-based notifications for this user
      return processUserLocationNotifications(context.params.userId, after);
    }
    
    return null;
  });

module.exports = {
  processLocationBasedNotifications,
  processUserLocationNotifications
};