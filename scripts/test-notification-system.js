/**
 * Test script for the push notification system
 * 
 * This script tests various aspects of the push notification system:
 * 1. Sending notifications using different templates
 * 2. Testing notification delivery
 * 3. Verifying rich notifications with images
 * 4. Testing notification preferences
 * 
 * Usage: node scripts/test-notification-system.js [userId] [testType]
 * 
 * Where:
 * - userId: The user ID to send notifications to (optional, defaults to test user)
 * - testType: The type of test to run (optional, defaults to 'all')
 *   - 'all': Run all tests
 *   - 'templates': Test notification templates
 *   - 'delivery': Test notification delivery
 *   - 'rich': Test rich notifications with images
 *   - 'preferences': Test notification preferences
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-config/service-account.json');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get command line arguments
const args = process.argv.slice(2);
const userId = args[0] || 'test_user';
const testType = args[1] || 'all';

// Notification templates for testing
const NOTIFICATION_TEMPLATES = {
  // Game start notifications
  game_start: {
    title: '{homeTeam} vs {awayTeam} is about to begin!',
    body: 'Tip-off is in {timeUntilStart}. Don\'t miss the action!',
    data: {
      category: 'game_start',
      gameId: '{gameId}',
      deepLink: 'aisportsedge://game/{gameId}'
    },
    imageUrl: '{gameImageUrl}'
  },
  
  // Game end notifications
  game_end: {
    title: 'Final Score: {homeTeam} {homeScore} - {awayScore} {awayTeam}',
    body: 'Check out the game summary and your bet results.',
    data: {
      category: 'game_end',
      gameId: '{gameId}',
      deepLink: 'aisportsedge://game/{gameId}'
    },
    imageUrl: '{gameImageUrl}'
  },
  
  // Betting opportunity notifications
  bet_opportunity: {
    title: 'Hot Betting Opportunity!',
    body: '{description}',
    data: {
      category: 'bet_opportunity',
      gameId: '{gameId}',
      betType: '{betType}',
      deepLink: 'aisportsedge://bet/opportunity/{gameId}?type={betType}'
    },
    imageUrl: '{opportunityImageUrl}'
  },
  
  // Bet result notifications
  bet_result: {
    title: 'Bet Result: {result}',
    body: 'Your bet on {betDescription} has {resultVerb}. {winningsText}',
    data: {
      category: 'bet_result',
      betId: '{betId}',
      deepLink: 'aisportsedge://bet/{betId}'
    },
    imageUrl: '{resultImageUrl}'
  }
};

/**
 * Replace template variables in a string
 * @param {string} template Template string with variables in {varName} format
 * @param {Object} data Data object with variable values
 * @returns {string} String with variables replaced
 */
function replaceTemplateVariables(template, data) {
  if (!template) return '';
  
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
 * Send a notification to a user
 * @param {string} userId User ID
 * @param {Object} notification Notification object
 * @returns {Promise<Object>} Send result
 */
async function sendNotification(userId, notification) {
  try {
    // Get user's push token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const pushToken = userData.pushToken;
    
    if (!pushToken) {
      console.error(`No push token for user: ${userId}`);
      return { success: false, error: 'No push token' };
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
    
    return { success: true, result };
  } catch (error) {
    console.error('Error sending notification:', error);
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
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Test notification templates
 * @param {string} userId User ID
 * @returns {Promise<void>}
 */
async function testTemplates(userId) {
  console.log('Testing notification templates...');
  
  // Test game start notification
  const gameStartData = {
    homeTeam: 'Lakers',
    awayTeam: 'Celtics',
    timeUntilStart: '15 minutes',
    gameId: 'game123',
    gameImageUrl: 'https://aisportsedge.com/images/games/lakers-celtics.jpg'
  };
  
  const gameStartNotification = processTemplate('game_start', gameStartData);
  console.log('Game Start Notification:', gameStartNotification);
  
  // Test game end notification
  const gameEndData = {
    homeTeam: 'Lakers',
    awayTeam: 'Celtics',
    homeScore: '108',
    awayScore: '102',
    gameId: 'game123',
    gameImageUrl: 'https://aisportsedge.com/images/games/lakers-celtics-final.jpg'
  };
  
  const gameEndNotification = processTemplate('game_end', gameEndData);
  console.log('Game End Notification:', gameEndNotification);
  
  // Test bet opportunity notification
  const betOpportunityData = {
    description: 'Lakers are favored by 5.5 points with 75% win probability',
    gameId: 'game123',
    betType: 'spread',
    opportunityImageUrl: 'https://aisportsedge.com/images/opportunities/lakers-spread.jpg'
  };
  
  const betOpportunityNotification = processTemplate('bet_opportunity', betOpportunityData);
  console.log('Bet Opportunity Notification:', betOpportunityNotification);
  
  // Test bet result notification
  const betResultData = {
    result: 'Win',
    betDescription: 'Lakers -5.5',
    resultVerb: 'won',
    winningsText: 'You won $50!',
    betId: 'bet456',
    resultImageUrl: 'https://aisportsedge.com/images/results/win.jpg'
  };
  
  const betResultNotification = processTemplate('bet_result', betResultData);
  console.log('Bet Result Notification:', betResultNotification);
}

/**
 * Test notification delivery
 * @param {string} userId User ID
 * @returns {Promise<void>}
 */
async function testDelivery(userId) {
  console.log('Testing notification delivery...');
  
  // Create test notification
  const notification = {
    title: 'Test Notification',
    body: 'This is a test notification from the notification system test script.',
    data: {
      category: 'system',
      deepLink: 'aisportsedge://test'
    }
  };
  
  // Send notification
  const result = await sendNotification(userId, notification);
  console.log('Notification Send Result:', result);
}

/**
 * Test rich notifications with images
 * @param {string} userId User ID
 * @returns {Promise<void>}
 */
async function testRichNotifications(userId) {
  console.log('Testing rich notifications with images...');
  
  // Create test notification with image
  const notification = {
    title: 'Rich Notification Test',
    body: 'This notification includes an image.',
    data: {
      category: 'system',
      deepLink: 'aisportsedge://test'
    },
    imageUrl: 'https://aisportsedge.com/images/test/rich-notification.jpg'
  };
  
  // Send notification
  const result = await sendNotification(userId, notification);
  console.log('Rich Notification Send Result:', result);
}

/**
 * Test notification preferences
 * @param {string} userId User ID
 * @returns {Promise<void>}
 */
async function testPreferences(userId) {
  console.log('Testing notification preferences...');
  
  // Get user preferences
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    console.error(`User not found: ${userId}`);
    return;
  }
  
  const userData = userDoc.data();
  const preferences = userData.notificationPreferences || {};
  
  console.log('User Notification Preferences:', preferences);
  
  // Test sending notification for each category
  const categories = [
    'game_start',
    'game_end',
    'bet_opportunity',
    'bet_result',
    'player_update',
    'team_update',
    'subscription',
    'referral',
    'system'
  ];
  
  for (const category of categories) {
    // Check if category is enabled
    const categoryEnabled = preferences.categories?.[category] !== false;
    
    console.log(`Category ${category}: ${categoryEnabled ? 'Enabled' : 'Disabled'}`);
    
    if (categoryEnabled) {
      // Create test notification for category
      const notification = {
        title: `Test ${category} Notification`,
        body: `This is a test notification for the ${category} category.`,
        data: {
          category,
          deepLink: `aisportsedge://${category}/test`
        }
      };
      
      // Send notification
      const result = await sendNotification(userId, notification);
      console.log(`${category} Notification Send Result:`, result);
    }
  }
}

/**
 * Run tests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log(`Running notification system tests for user: ${userId}`);
  console.log(`Test type: ${testType}`);
  
  try {
    if (testType === 'all' || testType === 'templates') {
      await testTemplates(userId);
      console.log('');
    }
    
    if (testType === 'all' || testType === 'delivery') {
      await testDelivery(userId);
      console.log('');
    }
    
    if (testType === 'all' || testType === 'rich') {
      await testRichNotifications(userId);
      console.log('');
    }
    
    if (testType === 'all' || testType === 'preferences') {
      await testPreferences(userId);
      console.log('');
    }
    
    console.log('Tests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Clean up Firebase Admin SDK
    admin.app().delete();
  }
}

// Run tests
runTests();