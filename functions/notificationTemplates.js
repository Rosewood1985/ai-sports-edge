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
  },
  localTeam: {
    title: 'Local Team Alert',
    message: 'We found a local team in your area: {team}',
    titleWithFavorite: 'Your Local Team: {team}',
    messageWithOdds: 'Local team {team} has upcoming games with odds: {odds}'
  },
  localGame: {
    title: 'Local Game Alert',
    message: '{homeTeam} vs {awayTeam} is happening near you',
    titleWithFavorite: '{favoriteTeam} Playing Near You',
    messageWithOdds: '{homeTeam} vs {awayTeam} is happening near you. Odds: {odds}'
  },
  localOdds: {
    title: 'Local Betting Opportunity',
    message: 'Betting opportunity for {team} in your area',
    titleWithFavorite: '{team} Betting Opportunity Near You',
    messageWithOdds: 'Local betting opportunity: {team} at odds {odds}'
  },
  // Referral Program Notifications
  newReferral: {
    title: 'New Referral',
    message: 'Someone has used your referral code!',
    titleWithName: 'New Referral: {referredName}',
    messageWithDetails: '{referredName} has used your referral code! You\'ll receive your reward when they subscribe.'
  },
  referralReward: {
    title: 'Referral Reward',
    message: 'Your referral has subscribed! You\'ve earned rewards.',
    titleWithName: 'Reward from {referredName}',
    messageWithDetails: 'Your referral {referredName} has subscribed! You\'ve earned {rewardPoints} loyalty points and a {rewardDuration}-day subscription extension.'
  },
  milestoneReached: {
    title: 'Referral Milestone Reached',
    message: 'Congratulations! You\'ve reached a referral milestone.',
    titleWithCount: '{count} Referrals Milestone',
    messageWithReward: 'Congratulations! You\'ve reached {count} referrals and earned: {rewardDescription}'
  },
  leaderboardRankChange: {
    title: 'Leaderboard Update',
    message: 'Your position on the referral leaderboard has changed.',
    titleWithRank: 'New Rank: #{newRank}',
    messageWithDetails: 'You\'ve moved from #{oldRank} to #{newRank} on the {period} leaderboard!'
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
    result = result.replace(regex, value || '');
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