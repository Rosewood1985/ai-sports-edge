const functions = require('firebase-functions');
const admin = require('firebase-admin');
const personalizedNotificationService = require('./personalizedNotificationService');

/**
 * Extract teams mentioned in RSS item
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
  
  try {
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
  } catch (error) {
    console.error('Error extracting teams:', error);
  }
  
  return [...new Set(teams)]; // Remove duplicates
}

/**
 * Extract players mentioned in RSS item
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
  
  try {
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
  } catch (error) {
    console.error('Error extracting players:', error);
  }
  
  return [...new Set(players)]; // Remove duplicates
}

/**
 * Extract betting opportunities from RSS item
 * @param {Object} item - RSS item
 * @returns {Array} Array of betting opportunities
 */
function extractBettingOpportunities(item) {
  const opportunities = [];
  
  // Keywords that indicate betting opportunities
  const bettingKeywords = [
    'odds', 'betting', 'wager', 'bet', 'favorite', 'underdog',
    'spread', 'line', 'over/under', 'moneyline', 'parlay'
  ];
  
  const itemText = [
    item.title || '',
    item.description || ''
  ].join(' ').toLowerCase();
  
  // Check if any betting keywords are present
  const hasBettingKeywords = bettingKeywords.some(keyword => 
    itemText.includes(keyword)
  );
  
  if (!hasBettingKeywords) return opportunities;
  
  // Extract teams
  const teams = extractTeams(item);
  
  // If we have teams, create betting opportunities
  teams.forEach(team => {
    opportunities.push({
      team,
      type: 'generic',
      source: item.source
    });
  });
  
  return opportunities;
}

/**
 * Calculate relevance score for an RSS item
 * @param {Object} item - RSS item
 * @param {Object} metadata - Extracted metadata
 * @returns {number} Relevance score (0-1)
 */
function calculateRelevanceScore(item, metadata) {
  let score = 0;
  
  // Base score based on source reliability
  const sourceReliability = {
    'ESPN': 0.9,
    'The Athletic': 0.85,
    'Sports Illustrated': 0.8,
    'Bleacher Report': 0.75,
    'Yahoo Sports': 0.8,
    'CBS Sports': 0.8,
    'NBC Sports': 0.8,
    'Fox Sports': 0.75,
    'default': 0.7
  };
  
  score += sourceReliability[item.source] || sourceReliability.default;
  
  // Add points for metadata
  if (metadata.teams && metadata.teams.length > 0) {
    score += 0.1;
  }
  
  if (metadata.players && metadata.players.length > 0) {
    score += 0.1;
  }
  
  if (metadata.bettingOpportunities && metadata.bettingOpportunities.length > 0) {
    score += 0.2;
  }
  
  // Normalize score to 0-1 range
  return Math.min(score, 1);
}

/**
 * Process RSS feed items to extract metadata
 * @param {Array} items - Raw RSS feed items
 * @returns {Array} Processed items with metadata
 */
function processRssItems(items) {
  return items.map(item => {
    // Extract teams mentioned in the item
    const teams = extractTeams(item);
    
    // Extract players mentioned in the item
    const players = extractPlayers(item);
    
    // Extract betting opportunities
    const bettingOpportunities = extractBettingOpportunities(item);
    
    // Calculate relevance score
    const relevanceScore = calculateRelevanceScore(item, {
      teams,
      players,
      bettingOpportunities
    });
    
    // Return enhanced item
    return {
      ...item,
      teams,
      players,
      bettingOpportunities,
      relevanceScore
    };
  });
}

/**
 * Match RSS feed items with user preferences
 * @param {Array} items - Processed RSS feed items
 * @returns {Object} Mapping of user IDs to relevant items
 */
async function matchContentWithUsers(items) {
  // Get all users with RSS notifications enabled
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('preferences.notifications.rssAlerts.enabled', '==', true)
    .get();
  
  if (usersSnapshot.empty) {
    console.log('No users have RSS notifications enabled');
    return {};
  }
  
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Match items with users
  const userMatches = {};
  
  users.forEach(user => {
    const matchedItems = items.filter(item => {
      // Get user preferences
      const rssPrefs = user.preferences?.notifications?.rssAlerts || {};
      
      // Check if user only wants notifications for favorite teams
      if (rssPrefs.favoriteTeamsOnly && item.teams && item.teams.length > 0) {
        const hasRelevantTeam = user.favorites?.teams?.some(team => 
          item.teams.includes(team)
        );
        if (!hasRelevantTeam) return false;
      }
      
      // Check if user only wants notifications for favorite players
      if (rssPrefs.favoritePlayersOnly && item.players && item.players.length > 0) {
        const hasRelevantPlayer = user.favorites?.players?.some(player => 
          item.players.includes(player)
        );
        if (!hasRelevantPlayer) return false;
      }
      
      // Check for keyword alerts
      if (rssPrefs.keywordAlerts && rssPrefs.keywordAlerts.length > 0) {
        const itemText = [
          item.title || '',
          item.description || '',
          (item.teams || []).join(' ')
        ].join(' ').toLowerCase();
        
        const hasKeyword = rssPrefs.keywordAlerts.some(keyword => 
          itemText.includes(keyword.toLowerCase())
        );
        
        if (!hasKeyword) return false;
      }
      
      // Check if item has minimum relevance score
      const minRelevanceScore = 0.5; // Threshold for notification
      if (item.relevanceScore < minRelevanceScore) return false;
      
      return true;
    });
    
    if (matchedItems.length > 0) {
      userMatches[user.id] = matchedItems;
    }
  });
  
  return userMatches;
}

/**
 * Trigger notifications for matched RSS feed items
 * @param {Object} userMatches - Mapping of user IDs to relevant items
 * @returns {Promise} Promise that resolves when notifications are sent
 */
async function triggerRssNotifications(userMatches) {
  const promises = [];
  
  // Process each user
  Object.entries(userMatches).forEach(([userId, items]) => {
    // Sort items by relevance score (highest first)
    const sortedItems = [...items].sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Take top 3 most relevant items to avoid notification fatigue
    const topItems = sortedItems.slice(0, 3);
    
    // Send notification for each item
    topItems.forEach(item => {
      promises.push(
        personalizedNotificationService.sendPersonalizedNotification({
          userId,
          type: 'news',
          data: {
            title: item.title,
            description: item.description,
            teams: item.teams,
            players: item.players,
            sport: item.sport,
            url: item.link,
            pubDate: item.pubDate,
            source: item.source,
            relevanceScore: item.relevanceScore,
            bettingOpportunities: item.bettingOpportunities
          }
        })
      );
    });
  });
  
  return Promise.all(promises);
}

/**
 * Cloud function to process new RSS feed items and send notifications
 */
exports.processRssFeedsAndNotify = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    // Get timestamp of last run
    const lastRunDoc = await admin.firestore()
      .collection('system')
      .doc('rssNotificationLastRun')
      .get();
    
    const lastRunTime = lastRunDoc.exists 
      ? lastRunDoc.data().timestamp.toDate() 
      : new Date(0); // Default to epoch if no previous run
    
    // Get new RSS feed items since last run
    const newItemsSnapshot = await admin.firestore()
      .collection('rssItems')
      .where('pubDate', '>', lastRunTime)
      .orderBy('pubDate', 'desc')
      .get();
    
    if (newItemsSnapshot.empty) {
      console.log('No new RSS feed items since last run');
      
      // Update last run timestamp
      await admin.firestore()
        .collection('system')
        .doc('rssNotificationLastRun')
        .set({
          timestamp: admin.firestore.Timestamp.now()
        });
      
      return null;
    }
    
    console.log(`Found ${newItemsSnapshot.size} new RSS feed items since last run`);
    
    // Process items
    const items = newItemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const processedItems = processRssItems(items);
    
    // Match items with users
    const userMatches = await matchContentWithUsers(processedItems);
    
    // Trigger notifications
    await triggerRssNotifications(userMatches);
    
    // Update last run timestamp
    await admin.firestore()
      .collection('system')
      .doc('rssNotificationLastRun')
      .set({
        timestamp: admin.firestore.Timestamp.now()
      });
    
    return null;
  });

/**
 * Cloud function to process RSS feed items when they are created
 */
exports.onNewRssItem = functions.firestore
  .document('rssItems/{itemId}')
  .onCreate(async (snapshot, context) => {
    const item = snapshot.data();
    
    // Process the item
    const processedItem = processRssItems([item])[0];
    
    // Match item with users
    const userMatches = await matchContentWithUsers([processedItem]);
    
    // Trigger notifications
    return triggerRssNotifications(userMatches);
  });