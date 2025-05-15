const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function to process scheduled notifications
 * 
 * This function runs every minute and checks for scheduled notifications
 * that are due to be sent. It sends the notifications using OneSignal
 * and marks them as sent in Firestore.
 */
exports.processScheduledNotifications = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      console.log('Processing scheduled notifications...');
      
      // Get current time
      const now = admin.firestore.Timestamp.now();
      
      // Query for notifications that are scheduled to be sent now or in the past
      // and have not been sent yet
      const query = db.collection('scheduledNotifications')
        .where('scheduledAt', '<=', now)
        .where('sent', '==', false)
        .limit(100); // Process in batches to avoid timeout
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('No notifications to process');
        return null;
      }
      
      console.log(`Found ${snapshot.size} notifications to process`);
      
      // Process each notification
      const batch = db.batch();
      const processedNotifications = [];
      
      for (const doc of snapshot.docs) {
        const notification = doc.data();
        const notificationId = doc.id;
        
        try {
          // Get user's external ID (OneSignal ID)
          const userDoc = await db.collection('users').doc(notification.userId).get();
          
          if (!userDoc.exists) {
            console.log(`User ${notification.userId} not found, skipping notification ${notificationId}`);
            continue;
          }
          
          const userData = userDoc.data();
          const externalUserId = userData.oneSignalExternalId;
          
          if (!externalUserId) {
            console.log(`User ${notification.userId} has no OneSignal external ID, skipping notification ${notificationId}`);
            continue;
          }
          
          // Get user's notification preferences
          const prefsDoc = await db.collection('users').doc(notification.userId)
            .collection('settings').doc('notifications').get();
          
          // If preferences don't exist or notifications are disabled, skip
          if (!prefsDoc.exists) {
            console.log(`User ${notification.userId} has no notification preferences, skipping notification ${notificationId}`);
            continue;
          }
          
          const prefs = prefsDoc.data();
          
          if (!prefs.enabled) {
            console.log(`User ${notification.userId} has notifications disabled, skipping notification ${notificationId}`);
            continue;
          }
          
          // Check if the specific notification category is enabled
          if (notification.category && !prefs[notification.category]) {
            console.log(`User ${notification.userId} has ${notification.category} notifications disabled, skipping notification ${notificationId}`);
            continue;
          }
          
          // Send notification using OneSignal
          await sendOneSignalNotification(
            notification.title,
            notification.message,
            notification.data,
            externalUserId
          );
          
          // Mark notification as sent
          batch.update(doc.ref, { sent: true, sentAt: now });
          
          processedNotifications.push(notificationId);
          console.log(`Processed notification ${notificationId}`);
        } catch (error) {
          console.error(`Error processing notification ${notificationId}:`, error);
          
          // If there's an error, mark the notification with an error flag
          // but don't mark it as sent so we can retry later
          batch.update(doc.ref, { 
            error: true, 
            errorMessage: error.message,
            errorTimestamp: now
          });
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Successfully processed ${processedNotifications.length} notifications`);
      return null;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      return null;
    }
  });

/**
 * Send a notification using OneSignal
 * @param {string} title Notification title
 * @param {string} message Notification message
 * @param {object} data Additional data
 * @param {string} externalUserId OneSignal external user ID
 */
async function sendOneSignalNotification(title, message, data, externalUserId) {
  try {
    // OneSignal API key and app ID from environment variables
    const oneSignalApiKey = process.env.ONESIGNAL_API_KEY;
    const oneSignalAppId = process.env.ONESIGNAL_APP_ID;
    
    if (!oneSignalApiKey || !oneSignalAppId) {
      throw new Error('OneSignal API key or app ID not configured');
    }
    
    // Prepare notification payload
    const payload = {
      app_id: oneSignalAppId,
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      include_external_user_ids: [externalUserId]
    };
    
    // Send notification
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${oneSignalApiKey}`
        }
      }
    );
    
    console.log('OneSignal notification sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    throw error;
  }
}

/**
 * Cloud Function to clean up old notifications
 * 
 * This function runs once a day and removes notifications that are
 * older than 30 days and have been sent.
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      console.log('Cleaning up old notifications...');
      
      // Get timestamp for 30 days ago
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      
      // Query for notifications that are older than 30 days and have been sent
      const query = db.collection('scheduledNotifications')
        .where('scheduledAt', '<=', thirtyDaysAgo)
        .where('sent', '==', true)
        .limit(500); // Process in batches to avoid timeout
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('No old notifications to clean up');
        return null;
      }
      
      console.log(`Found ${snapshot.size} old notifications to clean up`);
      
      // Delete each notification
      const batch = db.batch();
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Successfully cleaned up ${snapshot.size} old notifications`);
      return null;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return null;
    }
  });