const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Firebase Cloud Function that monitors player plus-minus changes
 * and sends push notifications when significant changes occur
 */
exports.monitorPlayerPlusMinus = functions.firestore
  .document('playerPlusMinus/{docId}')
  .onUpdate(async (change, context) => {
    try {
      // Get the previous and current document data
      const previousData = change.before.data();
      const currentData = change.after.data();
      
      // Calculate the change in plus-minus
      const previousPlusMinus = previousData.plusMinus || 0;
      const currentPlusMinus = currentData.plusMinus || 0;
      const plusMinusChange = currentPlusMinus - previousPlusMinus;
      
      // Only send notifications for significant changes (> 5 points in either direction)
      const THRESHOLD = 5;
      if (Math.abs(plusMinusChange) < THRESHOLD) {
        console.log(`Plus-minus change (${plusMinusChange}) below threshold (${THRESHOLD}). No notification sent.`);
        return null;
      }
      
      // Extract player and game information
      const { playerId, playerName, team, gameId } = currentData;
      
      // Get game information
      const gameDoc = await db.collection('games').doc(gameId).get();
      if (!gameDoc.exists) {
        console.log(`Game document ${gameId} not found.`);
        return null;
      }
      
      const gameData = gameDoc.data();
      const gameTitle = `${gameData.home_team} vs ${gameData.away_team}`;
      
      // Determine notification message based on direction of change
      const direction = plusMinusChange > 0 ? 'increased' : 'decreased';
      const emoji = plusMinusChange > 0 ? '📈' : '📉';
      const changeAbs = Math.abs(plusMinusChange);
      
      const title = `${emoji} Player Impact Alert`;
      const body = `${playerName} (${team}) has ${direction} their plus-minus by ${changeAbs} points in ${gameTitle}!`;
      
      // Find users who have access to this feature and have subscribed to notifications
      const premiumUsers = await db.collection('users')
        .where('notificationsEnabled', '==', true)
        .where('subscriptionStatus.active', '==', true)
        .where('subscriptionStatus.planId', 'in', ['premium-monthly', 'premium-yearly'])
        .get();
      
      // Find users with one-time purchases for this game
      const oneTimePurchaseUsers = await db.collection('users')
        .where('notificationsEnabled', '==', true)
        .where(`gameAccess.${gameId}`, '==', true)
        .get();
      
      // Combine user lists (avoiding duplicates)
      const userTokens = new Set();
      
      // Add premium users' tokens
      premiumUsers.forEach(userDoc => {
        const userData = userDoc.data();
        if (userData.fcmToken) {
          userTokens.add(userData.fcmToken);
        }
      });
      
      // Add one-time purchase users' tokens
      oneTimePurchaseUsers.forEach(userDoc => {
        const userData = userDoc.data();
        if (userData.fcmToken) {
          userTokens.add(userData.fcmToken);
        }
      });
      
      // If no users to notify, exit early
      if (userTokens.size === 0) {
        console.log('No users to notify.');
        return null;
      }
      
      // Prepare notification
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          gameId,
          playerId,
          playerName,
          team,
          plusMinus: currentPlusMinus.toString(),
          plusMinusChange: plusMinusChange.toString(),
          type: 'player_plus_minus_alert',
          timestamp: Date.now().toString(),
        },
        tokens: Array.from(userTokens),
      };
      
      // Send notification
      const response = await messaging.sendMulticast(message);
      console.log(`Sent notifications to ${response.successCount} users for ${playerName}'s plus-minus change.`);
      
      // Log failures if any
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(Array.from(userTokens)[idx]);
          }
        });
        console.log('Notification failed for tokens:', failedTokens);
      }
      
      return null;
    } catch (error) {
      console.error('Error sending player plus-minus notifications:', error);
      return null;
    }
  });

/**
 * Function to send a test notification to a specific user
 */
exports.sendTestPlusMinusNotification = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to send test notifications.'
    );
  }
  
  const { userId } = data;
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a userId.'
    );
  }
  
  try {
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found.'
      );
    }
    
    const userData = userDoc.data();
    if (!userData.fcmToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'User does not have a registered FCM token.'
      );
    }
    
    // Send test notification
    const message = {
      notification: {
        title: '📊 Test Player Impact Alert',
        body: 'This is a test notification for player plus-minus alerts.',
      },
      data: {
        type: 'player_plus_minus_alert',
        test: 'true',
        timestamp: Date.now().toString(),
      },
      token: userData.fcmToken,
    };
    
    await messaging.send(message);
    
    return { success: true, message: 'Test notification sent successfully.' };
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error sending test notification.',
      error
    );
  }
});