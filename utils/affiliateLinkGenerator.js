/**
 * Affiliate Link Generator for AI Sports Edge
 * Generates affiliate links for various betting platforms
 */

/**
 * Generate FanDuel affiliate link for a news item
 * @param {Object} event - News event with teams, sport, and odds info
 * @param {string} affiliateId - User's FanDuel affiliate ID
 * @returns {string} FanDuel affiliate link
 */
export function generateFanDuelAffiliateLink(event, affiliateId) {
  // Base FanDuel URL
  const baseUrl = 'https://www.fanduel.com/';
  
  // Construct path based on sport
  let path = '';
  switch (event.sport) {
    case 'NBA':
      path = 'nba/games';
      break;
    case 'NFL':
      path = 'nfl/games';
      break;
    case 'MLB':
      path = 'mlb/games';
      break;
    case 'NHL':
      path = 'nhl/games';
      break;
    case 'UFC':
      path = 'ufc/events';
      break;
    case 'SOCCER':
      path = 'soccer/games';
      break;
    case 'TENNIS':
      path = 'tennis/matches';
      break;
    case 'F1':
      path = 'racing/formula-1';
      break;
    default:
      path = 'sports';
  }
  
  // Add event-specific parameters if available
  const params = new URLSearchParams();
  if (event.eventId) {
    params.append('eventId', event.eventId);
  }
  
  // Always add affiliate ID
  params.append('aid', affiliateId || 'default');
  
  // Track the source
  params.append('src', 'newsticker');
  
  // Add team names if available
  if (event.teams) {
    // Try to extract team names from the teams field
    const teamNames = extractTeamNames(event.teams);
    if (teamNames.length === 2) {
      params.append('team1', encodeURIComponent(teamNames[0]));
      params.append('team2', encodeURIComponent(teamNames[1]));
    }
  }
  
  return `${baseUrl}${path}?${params.toString()}`;
}

/**
 * Generate generic FanDuel affiliate link
 * @param {string} sport - Sport key
 * @param {string} affiliateId - User's FanDuel affiliate ID
 * @returns {string} FanDuel affiliate link
 */
export function generateGenericAffiliateLink(sport, affiliateId) {
  // Base FanDuel URL
  const baseUrl = 'https://www.fanduel.com/';
  
  // Construct path based on sport
  let path = '';
  switch (sport) {
    case 'NBA':
      path = 'nba';
      break;
    case 'NFL':
      path = 'nfl';
      break;
    case 'MLB':
      path = 'mlb';
      break;
    case 'NHL':
      path = 'nhl';
      break;
    case 'UFC':
      path = 'ufc';
      break;
    case 'SOCCER':
      path = 'soccer';
      break;
    case 'TENNIS':
      path = 'tennis';
      break;
    case 'F1':
      path = 'racing/formula-1';
      break;
    default:
      path = 'sports';
  }
  
  // Add affiliate ID
  const params = new URLSearchParams();
  params.append('aid', affiliateId || 'default');
  params.append('src', 'app');
  
  return `${baseUrl}${path}?${params.toString()}`;
}

/**
 * Generate BetMGM affiliate link
 * @param {Object} event - News event with teams, sport, and odds info
 * @param {string} affiliateId - User's BetMGM affiliate ID
 * @returns {string} BetMGM affiliate link
 */
export function generateBetMGMAffiliateLink(event, affiliateId) {
  // Base BetMGM URL
  const baseUrl = 'https://sports.betmgm.com/en/sports/';
  
  // Construct path based on sport
  let path = '';
  switch (event.sport) {
    case 'NBA':
      path = 'basketball/nba';
      break;
    case 'NFL':
      path = 'football/nfl';
      break;
    case 'MLB':
      path = 'baseball/mlb';
      break;
    case 'NHL':
      path = 'hockey/nhl';
      break;
    case 'UFC':
      path = 'mma/ufc';
      break;
    case 'SOCCER':
      path = 'soccer';
      break;
    case 'TENNIS':
      path = 'tennis';
      break;
    case 'F1':
      path = 'motorsports/formula-1';
      break;
    default:
      path = '';
  }
  
  // Add affiliate ID
  const params = new URLSearchParams();
  params.append('affiliate', affiliateId || 'default');
  params.append('src', 'ai-sports-edge');
  
  return `${baseUrl}${path}?${params.toString()}`;
}

/**
 * Generate DraftKings affiliate link
 * @param {Object} event - News event with teams, sport, and odds info
 * @param {string} affiliateId - User's DraftKings affiliate ID
 * @returns {string} DraftKings affiliate link
 */
export function generateDraftKingsAffiliateLink(event, affiliateId) {
  // Base DraftKings URL
  const baseUrl = 'https://sportsbook.draftkings.com/';
  
  // Construct path based on sport
  let path = '';
  switch (event.sport) {
    case 'NBA':
      path = 'leagues/basketball/nba';
      break;
    case 'NFL':
      path = 'leagues/football/nfl';
      break;
    case 'MLB':
      path = 'leagues/baseball/mlb';
      break;
    case 'NHL':
      path = 'leagues/hockey/nhl';
      break;
    case 'UFC':
      path = 'leagues/mma/ufc';
      break;
    case 'SOCCER':
      path = 'leagues/soccer';
      break;
    case 'TENNIS':
      path = 'leagues/tennis';
      break;
    case 'F1':
      path = 'leagues/racing/formula-1';
      break;
    default:
      path = '';
  }
  
  // Add affiliate ID
  const params = new URLSearchParams();
  params.append('aid', affiliateId || 'default');
  params.append('src', 'ai-sports-edge');
  
  return `${baseUrl}${path}?${params.toString()}`;
}

/**
 * Extract team names from a string
 * @param {string} teamsString - String containing team names (e.g., "Lakers vs. Celtics")
 * @returns {Array<string>} Array of team names
 */
function extractTeamNames(teamsString) {
  if (!teamsString) return [];
  
  // Common separators in team matchups
  const separators = [' vs ', ' vs. ', ' at ', ' @ ', '-'];
  
  for (const separator of separators) {
    if (teamsString.includes(separator)) {
      return teamsString.split(separator).map(team => team.trim());
    }
  }
  
  // If no separator found, return the whole string
  return [teamsString];
}

/**
 * Get the default affiliate ID for a sportsbook
 * @param {string} sportsbook - Sportsbook name (e.g., 'fanduel', 'betmgm')
 * @returns {string} Default affiliate ID
 */
export function getDefaultAffiliateId(sportsbook) {
  const defaults = {
    fanduel: 'ai-sports-edge-001',
    betmgm: 'ai-sports-edge-002',
    draftkings: 'ai-sports-edge-003'
  };
  
  return defaults[sportsbook.toLowerCase()] || 'default';
}

/**
 * Generate affiliate link for any supported sportsbook
 * @param {string} sportsbook - Sportsbook name (e.g., 'fanduel', 'betmgm')
 * @param {Object} event - News event with teams, sport, and odds info
 * @param {string} affiliateId - User's affiliate ID
 * @returns {string} Affiliate link
 */
export function generateAffiliateLink(sportsbook, event, affiliateId) {
  const sportsbookLower = sportsbook.toLowerCase();
  
  switch (sportsbookLower) {
    case 'fanduel':
      return generateFanDuelAffiliateLink(event, affiliateId);
    case 'betmgm':
      return generateBetMGMAffiliateLink(event, affiliateId);
    case 'draftkings':
      return generateDraftKingsAffiliateLink(event, affiliateId);
    default:
      // Default to FanDuel
      return generateFanDuelAffiliateLink(event, affiliateId);
  }
}