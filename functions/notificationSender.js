const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

/**
 * Notification templates for different event types
 */
const NOTIFICATION_TEMPLATES = {
  // Game start notifications
  game_start: {
    title: "{homeTeam} vs {awayTeam} is about to begin!",
    body: "Tip-off is in {timeUntilStart}. Don't miss the action!",
    data: {
      category: "game_start",
      gameId: "{gameId}",
      deepLink: "aisportsedge://game/{gameId}"
    },
    imageUrl: "{gameImageUrl}"
  },
  
  // Game end notifications
  game_end: {
    title: "Final Score: {homeTeam} {homeScore} - {awayScore} {awayTeam}",
    body: "Check out the game summary and your bet results.",
    data: {
      category: "game_end",
      gameId: "{gameId}",
      deepLink: "aisportsedge://game/{gameId}"
    },
    imageUrl: "{gameImageUrl}"
  },
  
  // Betting opportunity notifications
  bet_opportunity: {
    title: "Hot Betting Opportunity!",
    body: "{description}",
    data: {
      category: "bet_opportunity",
      gameId: "{gameId}",
      betType: "{betType}",
      deepLink: "aisportsedge://bet/opportunity/{gameId}?type={betType}"
    },
    imageUrl: "{opportunityImageUrl}"
  },
  
  // Bet result notifications
  bet_result: {
    title: "Bet Result: {result}",
    body: "Your bet on {betDescription} has {resultVerb}. {winningsText}",
    data: {
      category: "bet_result",
      betId: "{betId}",
      deepLink: "aisportsedge://bet/{betId}"
    },
    imageUrl: "{resultImageUrl}"
  },
  
  // Player update notifications
  player_update: {
    title: "{playerName} Update",
    body: "{updateDescription}",
    data: {
      category: "player_update",
      playerId: "{playerId}",
      deepLink: "aisportsedge://player/{playerId}"
    },
    imageUrl: "{playerImageUrl}"
  },
  
  // Team update notifications
  team_update: {
    title: "{teamName} Update",
    body: "{updateDescription}",
    data: {
      category: "team_update",
      teamId: "{teamId}",
      deepLink: "aisportsedge://team/{teamId}"
    },
    imageUrl: "{teamImageUrl}"
  },
  
  // Subscription notifications
  subscription: {
    title: "Subscription Update",
    body: "{updateDescription}",
    data: {
      category: "subscription",
      subscriptionId: "{subscriptionId}",
      deepLink: "aisportsedge://subscription/{subscriptionId}"
    }
  },
  
  // Referral notifications
  referral: {
    title: "Referral Bonus!",
    body: "{referrerName} has joined using your referral code. You've earned {bonusDescription}!",
    data: {
      category: "referral",
      referralId: "{referralId}",
      deepLink: "aisportsedge://referral/history"
    }
  },
  
  // System notifications
  system: {
    title: "{title}",
    body: "{body}",
    data: {
      category: "system",
      deepLink: "{deepLink}"
    }
  }
};

/**
 * Replace template variables in a string
 * @param {string} template Template string with variables in {varName} format
 * @param {Object} data Data object with variable values
 * @returns {string} String with variables replaced
 */
function replaceTemplateVariables(template, data) {
  if (!template) return "";
  
  return template.replace(/{([^}]+)}/g, (match, variable) => {
    return data[variable] !== undefined ? data[variable] : match;
  });
}

/**
 * Process a notification template with data
 * @param {string} templateName Template name
 * @param {Object} data Data for template variables
 * @returns {Object} Processed notification object
 */
function processTemplate(templateName, data) {
  const template = NOTIFICATION_TEMPLATES[templateName];
  
  if (!template) {
    console.error(`Template not found: ${templateName}`);
    return null;
  }
  
  // Process title and body
  const title = replaceTemplateVariables(template.title, data);
  const body = replaceTemplateVariables(template.body, data);
  
  // Process data object
  const processedData = {};
  
  if (template.data) {
    Object.entries(template.data).forEach(([key, value]) => {
      processedData[key] = replaceTemplateVariables(value, data);
    });
  }
  
  // Add any additional data
  Object.entries(data).forEach(([key, value]) => {
    if (!processedData[key]) {
      processedData[key] = value;
    }
  });
  
  // Process image URL if present
  let imageUrl = null;
  if (template.imageUrl) {
    imageUrl = replaceTemplateVariables(template.imageUrl, data);
  }
  
  return {
    title,
    body,
    data: processedData,
    imageUrl
  };
}

/**
 * Send a notification to a specific user
 * @param {string} userId User ID
 * @param {string} templateName Template name
 * @param {Object} data Data for template variables
 * @returns {Promise<Object>} Send result
 */
async function sendNotificationToUser(userId, templateName, data) {
  try {
    // Get user's push token
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`User not found: ${userId}`);
      return { success: false, error: "User not found" };
    }
    
    const userData = userDoc.data();
    const pushToken = userData.pushToken;
    
    if (!pushToken) {
      console.error(`No push token for user: ${userId}`);
      return { success: false, error: "No push token" };
    }
    
    // Check notification preferences
    const preferences = userData.notificationPreferences || {};
    
    // If notifications are disabled, don't send
    if (preferences.enabled === false) {
      console.log(`Notifications disabled for user: ${userId}`);
      return { success: false, error: "Notifications disabled" };
    }
    
    // If category is disabled, don't send
    const category = templateName;
    if (preferences.categories && preferences.categories[category] === false) {
      console.log(`Notifications for category ${category} disabled for user: ${userId}`);
      return { success: false, error: "Category disabled" };
    }
    
    // Check quiet hours
    if (preferences.quiet_hours && preferences.quiet_hours.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const { start_hour, end_hour } = preferences.quiet_hours;
      
      let isInQuietHours = false;
      
      if (start_hour <= end_hour) {
        // Simple case: start hour is before end hour
        isInQuietHours = currentHour >= start_hour && currentHour < end_hour;
      } else {
        // Complex case: start hour is after end hour (spans midnight)
        isInQuietHours = currentHour >= start_hour || currentHour < end_hour;
      }
      
      if (isInQuietHours) {
        console.log(`In quiet hours for user: ${userId}`);
        return { success: false, error: "In quiet hours" };
      }
    }
    
    // Process template
    const notification = processTemplate(templateName, data);
    
    if (!notification) {
      return { success: false, error: "Invalid template" };
    }
    
    // Send notification
    const message = {
      to: pushToken,
      title: notification.title,
      body: notification.body,
      data: notification.data
    };
    
    // Add image if present
    if (notification.imageUrl) {
      message.mutableContent = true;
      message.data.imageUrl = notification.imageUrl;
    }
    
    // Send to Expo push service
    const result = await sendPushNotification(message);
    
    // Log notification
    await logNotification(userId, templateName, notification, result);
    
    return { success: true, result };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a notification to multiple users
 * @param {string[]} userIds User IDs
 * @param {string} templateName Template name
 * @param {Object} data Data for template variables
 * @returns {Promise<Object>} Send result
 */
async function sendNotificationToUsers(userIds, templateName, data) {
  try {
    const results = await Promise.all(
      userIds.map(userId => sendNotificationToUser(userId, templateName, data))
    );
    
    const successCount = results.filter(result => result.success).length;
    
    return {
      success: true,
      totalCount: userIds.length,
      successCount,
      failureCount: userIds.length - successCount,
      results
    };
  } catch (error) {
    console.error("Error sending notifications to users:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a notification to users with specific criteria
 * @param {Object} criteria Criteria for selecting users
 * @param {string} templateName Template name
 * @param {Object} data Data for template variables
 * @returns {Promise<Object>} Send result
 */
async function sendNotificationWithCriteria(criteria, templateName, data) {
  try {
    // Build query based on criteria
    let query = admin.firestore().collection("users");
    
    // Apply criteria
    Object.entries(criteria).forEach(([field, value]) => {
      query = query.where(field, "==", value);
    });
    
    // Get matching users
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log("No users match criteria");
      return { success: false, error: "No matching users" };
    }
    
    // Extract user IDs
    const userIds = snapshot.docs.map(doc => doc.id);
    
    // Send notification to users
    return await sendNotificationToUsers(userIds, templateName, data);
  } catch (error) {
    console.error("Error sending notification with criteria:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a push notification using Expo push service
 * @param {Object} message Message to send
 * @returns {Promise<Object>} Send result
 */
async function sendPushNotification(message) {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

/**
 * Log a notification in the database
 * @param {string} userId User ID
 * @param {string} templateName Template name
 * @param {Object} notification Notification object
 * @param {Object} result Send result
 * @returns {Promise<void>}
 */
async function logNotification(userId, templateName, notification, result) {
  try {
    await admin.firestore().collection("notificationLogs").add({
      userId,
      templateName,
      notification,
      result,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging notification:", error);
  }
}

// Cloud Functions

/**
 * Send notification to user
 */
exports.sendNotificationToUser = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to send notifications"
    );
  }
  
  // Check if user is an admin
  const { userId, templateName, templateData } = data;
  
  if (!userId || !templateName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "userId and templateName are required"
    );
  }
  
  return await sendNotificationToUser(userId, templateName, templateData || {});
});

/**
 * Send notification to multiple users
 */
exports.sendNotificationToUsers = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to send notifications"
    );
  }
  
  // Check if user is an admin
  const { userIds, templateName, templateData } = data;
  
  if (!userIds || !Array.isArray(userIds) || !templateName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "userIds array and templateName are required"
    );
  }
  
  return await sendNotificationToUsers(userIds, templateName, templateData || {});
});

/**
 * Send notification with criteria
 */
exports.sendNotificationWithCriteria = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to send notifications"
    );
  }
  
  // Check if user is an admin
  const { criteria, templateName, templateData } = data;
  
  if (!criteria || typeof criteria !== "object" || !templateName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "criteria object and templateName are required"
    );
  }
  
  return await sendNotificationWithCriteria(criteria, templateName, templateData || {});
});

/**
 * Send game start notifications
 */
exports.sendGameStartNotifications = functions.pubsub.schedule("every 5 minutes").onRun(async (context) => {
  try {
    // Get games starting soon (within the next 15 minutes)
    const now = admin.firestore.Timestamp.now();
    const fifteenMinutesFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 15 * 60 * 1000
    );
    
    const gamesSnapshot = await admin.firestore()
      .collection("games")
      .where("startTime", ">", now)
      .where("startTime", "<=", fifteenMinutesFromNow)
      .where("notificationSent", "==", false)
      .get();
    
    if (gamesSnapshot.empty) {
      console.log("No games starting soon");
      return null;
    }
    
    console.log(`Found ${gamesSnapshot.size} games starting soon`);
    
    // Process each game
    const promises = gamesSnapshot.docs.map(async (gameDoc) => {
      const game = gameDoc.data();
      
      // Find users interested in this game
      const interestedUsersSnapshot = await admin.firestore()
        .collection("userPreferences")
        .where("favoriteTeams", "array-contains-any", [game.homeTeamId, game.awayTeamId])
        .get();
      
      const userIds = interestedUsersSnapshot.docs.map(doc => doc.id);
      
      if (userIds.length === 0) {
        console.log(`No users interested in game ${gameDoc.id}`);
        return;
      }
      
      // Calculate time until start
      const minutesUntilStart = Math.floor(
        (game.startTime.toMillis() - now.toMillis()) / (60 * 1000)
      );
      
      let timeUntilStart;
      if (minutesUntilStart < 5) {
        timeUntilStart = "a few minutes";
      } else {
        timeUntilStart = `${minutesUntilStart} minutes`;
      }
      
      // Prepare notification data
      const templateData = {
        gameId: gameDoc.id,
        homeTeam: game.homeTeamName,
        awayTeam: game.awayTeamName,
        timeUntilStart,
        gameImageUrl: game.imageUrl || `https://aisportsedge.com/api/game-image/${gameDoc.id}`
      };
      
      // Send notification
      const result = await sendNotificationToUsers(
        userIds,
        "game_start",
        templateData
      );
      
      // Mark game as notified
      await gameDoc.ref.update({ notificationSent: true });
      
      return result;
    });
    
    await Promise.all(promises);
    
    return null;
  } catch (error) {
    console.error("Error sending game start notifications:", error);
    return null;
  }
});

/**
 * Send bet result notifications
 */
exports.sendBetResultNotification = functions.firestore
  .document("bets/{betId}")
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Check if bet was just settled
      if (
        beforeData.status !== "settled" &&
        afterData.status === "settled" &&
        afterData.result
      ) {
        const userId = afterData.userId;
        const betId = context.params.betId;
        
        // Get user
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        
        if (!userDoc.exists) {
          console.error(`User not found: ${userId}`);
          return;
        }
        
        // Prepare notification data
        let resultText, resultVerb, winningsText;
        
        switch (afterData.result) {
        case "win":
          resultText = "Win";
          resultVerb = "won";
          winningsText = `You won ${formatCurrency(afterData.potentialWinnings)}!`;
          break;
        case "loss":
          resultText = "Loss";
          resultVerb = "lost";
          winningsText = "";
          break;
        case "push":
          resultText = "Push";
          resultVerb = "pushed";
          winningsText = "Your stake has been returned.";
          break;
        default:
          resultText = afterData.result;
          resultVerb = "been settled";
          winningsText = "";
        }
        
        // Get bet description
        let betDescription = `${afterData.teamName} vs ${afterData.opponentName}`;
        
        if (afterData.betType) {
          betDescription += ` (${formatBetType(afterData.betType)})`;
        }
        
        // Prepare template data
        const templateData = {
          betId,
          result: resultText,
          resultVerb,
          winningsText,
          betDescription,
          resultImageUrl: afterData.result === "win"
            ? "https://aisportsedge.com/images/win.png"
            : "https://aisportsedge.com/images/loss.png"
        };
        
        // Send notification
        await sendNotificationToUser(userId, "bet_result", templateData);
      }
      
      return;
    } catch (error) {
      console.error("Error sending bet result notification:", error);
      return;
    }
  });

/**
 * Format currency
 * @param {number} amount Amount
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

/**
 * Format bet type
 * @param {string} betType Bet type
 * @returns {string} Formatted bet type
 */
function formatBetType(betType) {
  switch (betType) {
  case "moneyline":
    return "Moneyline";
  case "spread":
    return "Spread";
  case "overUnder":
    return "Over/Under";
  case "prop":
    return "Prop";
  case "parlay":
    return "Parlay";
  case "futures":
    return "Futures";
  default:
    return betType;
  }
}