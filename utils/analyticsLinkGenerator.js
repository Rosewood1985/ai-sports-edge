/**
 * Analytics Link Generator
 * Generates links to analytics pages for sports events
 */

/**
 * Generate a link to the analytics page for a sports event
 * @param {Object} options - Options for generating the link
 * @param {string} options.sport - Sport name (e.g., 'NBA', 'NFL')
 * @param {string} options.teams - Teams involved in the event
 * @param {string} options.eventId - ID of the event
 * @param {string} options.analysisType - Type of analysis (e.g., 'player_stats', 'team_comparison')
 * @returns {string} URL to the analytics page
 */
export function generateAnalyticsLink(options) {
  const { sport, teams, eventId, analysisType = 'general' } = options;

  // Base URL for analytics pages
  const baseUrl = '/analytics';

  // Format the teams for the URL
  const formattedTeams = teams
    ? teams
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    : '';

  // Format the sport for the URL
  const formattedSport = sport ? sport.toLowerCase() : 'general';

  // Build the URL
  let url = `${baseUrl}/${formattedSport}`;

  // Add event-specific path if available
  if (eventId) {
    url += `/events/${eventId}`;
  } else if (formattedTeams) {
    url += `/teams/${formattedTeams}`;
  }

  // Add analysis type
  url += `/${analysisType}`;

  return url;
}

/**
 * Generate a link to the player analytics page
 * @param {Object} options - Options for generating the link
 * @param {string} options.sport - Sport name (e.g., 'NBA', 'NFL')
 * @param {string} options.playerId - ID of the player
 * @param {string} options.playerName - Name of the player
 * @param {string} options.analysisType - Type of analysis (e.g., 'season_stats', 'career_stats')
 * @returns {string} URL to the player analytics page
 */
export function generatePlayerAnalyticsLink(options) {
  const { sport, playerId, playerName, analysisType = 'season_stats' } = options;

  // Base URL for player analytics pages
  const baseUrl = '/analytics';

  // Format the player name for the URL
  const formattedPlayerName = playerName
    ? playerName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    : '';

  // Format the sport for the URL
  const formattedSport = sport ? sport.toLowerCase() : 'general';

  // Build the URL
  let url = `${baseUrl}/${formattedSport}/players`;

  // Add player-specific path
  if (playerId) {
    url += `/${playerId}`;
  } else if (formattedPlayerName) {
    url += `/${formattedPlayerName}`;
  }

  // Add analysis type
  url += `/${analysisType}`;

  return url;
}

/**
 * Generate a link to the team analytics page
 * @param {Object} options - Options for generating the link
 * @param {string} options.sport - Sport name (e.g., 'NBA', 'NFL')
 * @param {string} options.teamId - ID of the team
 * @param {string} options.teamName - Name of the team
 * @param {string} options.analysisType - Type of analysis (e.g., 'season_stats', 'historical_performance')
 * @returns {string} URL to the team analytics page
 */
export function generateTeamAnalyticsLink(options) {
  const { sport, teamId, teamName, analysisType = 'season_stats' } = options;

  // Base URL for team analytics pages
  const baseUrl = '/analytics';

  // Format the team name for the URL
  const formattedTeamName = teamName
    ? teamName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    : '';

  // Format the sport for the URL
  const formattedSport = sport ? sport.toLowerCase() : 'general';

  // Build the URL
  let url = `${baseUrl}/${formattedSport}/teams`;

  // Add team-specific path
  if (teamId) {
    url += `/${teamId}`;
  } else if (formattedTeamName) {
    url += `/${formattedTeamName}`;
  }

  // Add analysis type
  url += `/${analysisType}`;

  return url;
}

/**
 * Generate a link to the league analytics page
 * @param {Object} options - Options for generating the link
 * @param {string} options.sport - Sport name (e.g., 'NBA', 'NFL')
 * @param {string} options.analysisType - Type of analysis (e.g., 'standings', 'league_leaders')
 * @returns {string} URL to the league analytics page
 */
export function generateLeagueAnalyticsLink(options) {
  const { sport, analysisType = 'standings' } = options;

  // Base URL for league analytics pages
  const baseUrl = '/analytics';

  // Format the sport for the URL
  const formattedSport = sport ? sport.toLowerCase() : 'general';

  // Build the URL
  const url = `${baseUrl}/${formattedSport}/league/${analysisType}`;

  return url;
}
