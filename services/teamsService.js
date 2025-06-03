/**
 * Teams Service for AI Sports Edge
 * Provides functions for fetching and managing team data
 */

import Team from '../models/Team';

// Cache for teams data
let teamsCache = {};
let lastFetchTime = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch all teams for a specific sport
 * @param {string} sport - Sport key (e.g., 'NBA', 'NFL')
 * @returns {Promise<Array<Team>>} Array of Team objects
 */
export async function fetchTeamsBySport(sport) {
  const sportKey = sport.toUpperCase();

  // Check cache first
  if (teamsCache[sportKey] && Date.now() - lastFetchTime[sportKey] < CACHE_TTL) {
    return teamsCache[sportKey];
  }

  try {
    // Fetch teams from API
    const response = await fetch(`/api/teams/${sportKey.toLowerCase()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Convert to Team objects
    const teams = data.map(team => Team.fromAPI(team));

    // Update cache
    teamsCache[sportKey] = teams;
    lastFetchTime[sportKey] = Date.now();

    return teams;
  } catch (error) {
    console.error(`Error fetching teams for ${sport}:`, error);
    return teamsCache[sportKey] || [];
  }
}

/**
 * Fetch all teams across all sports
 * @returns {Promise<Object>} Object with sport keys and their teams
 */
export async function fetchAllTeams() {
  const supportedSports = ['NBA', 'NFL', 'MLB', 'NHL', 'UFC', 'SOCCER', 'F1', 'TENNIS'];
  const allTeams = {};

  // Fetch teams for each sport in parallel
  const promises = supportedSports.map(async sport => {
    try {
      const teams = await fetchTeamsBySport(sport);
      allTeams[sport] = teams;
    } catch (error) {
      console.error(`Error fetching teams for ${sport}:`, error);
      allTeams[sport] = [];
    }
  });

  await Promise.all(promises);

  return allTeams;
}

/**
 * Search teams by name across all sports
 * @param {string} query - Search query
 * @param {Array<string>} [sportFilters] - Optional array of sports to filter by
 * @returns {Promise<Array<Team>>} Array of matching Team objects
 */
export async function searchTeams(query, sportFilters = null) {
  // Determine which sports to search
  const sportsToSearch = sportFilters || [
    'NBA',
    'NFL',
    'MLB',
    'NHL',
    'UFC',
    'SOCCER',
    'F1',
    'TENNIS',
  ];

  // Fetch teams for all specified sports
  const allTeams = {};

  for (const sport of sportsToSearch) {
    allTeams[sport] = await fetchTeamsBySport(sport);
  }

  // If no query, return all teams
  if (!query) {
    return Object.values(allTeams).flat();
  }

  const normalizedQuery = query.toLowerCase();

  // Search across all fetched teams
  const results = [];

  Object.values(allTeams).forEach(teams => {
    const matchingTeams = teams.filter(
      team =>
        team.name.toLowerCase().includes(normalizedQuery) ||
        team.abbreviation.toLowerCase().includes(normalizedQuery) ||
        team.getCity().toLowerCase().includes(normalizedQuery) ||
        team.getShortName().toLowerCase().includes(normalizedQuery)
    );

    results.push(...matchingTeams);
  });

  return results;
}

/**
 * Get team by ID
 * @param {string} id - Team ID
 * @returns {Promise<Team|null>} Team object or null if not found
 */
export async function getTeamById(id) {
  // Check all cached sports
  for (const sport in teamsCache) {
    const team = teamsCache[sport].find(t => t.id === id);
    if (team) {
      return team;
    }
  }

  // If not found in cache, fetch all teams and try again
  const allTeams = await fetchAllTeams();

  for (const sport in allTeams) {
    const team = allTeams[sport].find(t => t.id === id);
    if (team) {
      return team;
    }
  }

  return null;
}

/**
 * Get teams by IDs
 * @param {Array<string>} ids - Array of team IDs
 * @returns {Promise<Array<Team>>} Array of Team objects
 */
export async function getTeamsByIds(ids) {
  if (!ids || !ids.length) {
    return [];
  }

  const teams = [];

  for (const id of ids) {
    const team = await getTeamById(id);
    if (team) {
      teams.push(team);
    }
  }

  return teams;
}

/**
 * Clear teams cache
 * @param {string} sport - Optional sport to clear cache for (or all if not specified)
 */
export function clearTeamsCache(sport = null) {
  if (sport) {
    const sportKey = sport.toUpperCase();
    delete teamsCache[sportKey];
    delete lastFetchTime[sportKey];
  } else {
    teamsCache = {};
    lastFetchTime = {};
  }
}

/**
 * Get popular teams
 * @param {string} sport - Optional sport to filter by
 * @param {number} limit - Maximum number of teams to return
 * @returns {Promise<Array<Team>>} Array of popular Team objects
 */
export async function getPopularTeams(sport = null, limit = 10) {
  try {
    // If sport is specified, fetch only for that sport
    if (sport) {
      const teams = await fetchTeamsBySport(sport);

      // Sort by popularity (assuming metadata has a popularity field)
      const sortedTeams = teams.sort((a, b) => {
        const aPopularity = a.metadata.popularity || 0;
        const bPopularity = b.metadata.popularity || 0;
        return bPopularity - aPopularity;
      });

      return sortedTeams.slice(0, limit);
    }

    // Otherwise, fetch for all sports and combine
    const allTeams = await fetchAllTeams();
    const combinedTeams = Object.values(allTeams).flat();

    // Sort by popularity
    const sortedTeams = combinedTeams.sort((a, b) => {
      const aPopularity = a.metadata.popularity || 0;
      const bPopularity = b.metadata.popularity || 0;
      return bPopularity - aPopularity;
    });

    return sortedTeams.slice(0, limit);
  } catch (error) {
    console.error('Error fetching popular teams:', error);
    return [];
  }
}
