/**
 * Players Service for AI Sports Edge
 * Provides functions for fetching and managing player data
 */

import Player from '../models/Player';

// Cache for players data
let playersCache = {};
let lastFetchTime = {};
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Fetch players for a specific sport
 * @param {string} sport - Sport key (e.g., 'NBA', 'NFL')
 * @returns {Promise<Array<Player>>} Array of Player objects
 */
export async function fetchPlayersBySport(sport) {
  const sportKey = sport.toUpperCase();

  // Check cache first
  if (playersCache[sportKey] && Date.now() - lastFetchTime[sportKey] < CACHE_TTL) {
    return playersCache[sportKey];
  }

  try {
    // Fetch players from API
    const response = await fetch(`/api/players/${sportKey.toLowerCase()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Convert to Player objects
    const players = data.map(player => Player.fromAPI(player));

    // Update cache
    playersCache[sportKey] = players;
    lastFetchTime[sportKey] = Date.now();

    return players;
  } catch (error) {
    console.error(`Error fetching players for ${sport}:`, error);
    return playersCache[sportKey] || [];
  }
}

/**
 * Fetch players for a specific team
 * @param {string} teamId - Team ID
 * @returns {Promise<Array<Player>>} Array of Player objects
 */
export async function fetchPlayersByTeam(teamId) {
  try {
    // Fetch players from API
    const response = await fetch(`/api/teams/${teamId}/players`);

    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Convert to Player objects
    return data.map(player => Player.fromAPI(player));
  } catch (error) {
    console.error(`Error fetching players for team ${teamId}:`, error);
    return [];
  }
}

/**
 * Fetch all players across all sports
 * @returns {Promise<Object>} Object with sport keys and their players
 */
export async function fetchAllPlayers() {
  const supportedSports = ['NBA', 'NFL', 'MLB', 'NHL', 'UFC', 'SOCCER', 'TENNIS'];
  const allPlayers = {};

  // Fetch players for each sport in parallel
  const promises = supportedSports.map(async sport => {
    try {
      const players = await fetchPlayersBySport(sport);
      allPlayers[sport] = players;
    } catch (error) {
      console.error(`Error fetching players for ${sport}:`, error);
      allPlayers[sport] = [];
    }
  });

  await Promise.all(promises);

  return allPlayers;
}

/**
 * Search players by name across all sports
 * @param {string} query - Search query
 * @param {Array<string>} [sportFilters] - Optional array of sports to filter by
 * @returns {Promise<Array<Player>>} Array of matching Player objects
 */
export async function searchPlayers(query, sportFilters = null) {
  // Determine which sports to search
  const sportsToSearch = sportFilters || ['NBA', 'NFL', 'MLB', 'NHL', 'UFC', 'SOCCER', 'TENNIS'];

  // Fetch players for all specified sports
  const allPlayers = {};

  for (const sport of sportsToSearch) {
    allPlayers[sport] = await fetchPlayersBySport(sport);
  }

  // If no query, return all players
  if (!query) {
    return Object.values(allPlayers).flat();
  }

  const normalizedQuery = query.toLowerCase();

  // Search across all fetched players
  const results = [];

  Object.values(allPlayers).forEach(players => {
    const matchingPlayers = players.filter(
      player =>
        player.name.toLowerCase().includes(normalizedQuery) ||
        player.position.toLowerCase().includes(normalizedQuery) ||
        player.getFirstName().toLowerCase().includes(normalizedQuery) ||
        player.getLastName().toLowerCase().includes(normalizedQuery)
    );

    results.push(...matchingPlayers);
  });

  return results;
}

/**
 * Get player by ID
 * @param {string} id - Player ID
 * @returns {Promise<Player|null>} Player object or null if not found
 */
export async function getPlayerById(id) {
  // Check all cached sports
  for (const sport in playersCache) {
    const player = playersCache[sport].find(p => p.id === id);
    if (player) {
      return player;
    }
  }

  try {
    // If not found in cache, fetch directly
    const response = await fetch(`/api/players/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch player: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Player.fromAPI(data);
  } catch (error) {
    console.error(`Error fetching player ${id}:`, error);
    return null;
  }
}

/**
 * Get players by IDs
 * @param {Array<string>} ids - Array of player IDs
 * @returns {Promise<Array<Player>>} Array of Player objects
 */
export async function getPlayersByIds(ids) {
  if (!ids || !ids.length) {
    return [];
  }

  const players = [];

  for (const id of ids) {
    const player = await getPlayerById(id);
    if (player) {
      players.push(player);
    }
  }

  return players;
}

/**
 * Clear players cache
 * @param {string} sport - Optional sport to clear cache for (or all if not specified)
 */
export function clearPlayersCache(sport = null) {
  if (sport) {
    const sportKey = sport.toUpperCase();
    delete playersCache[sportKey];
    delete lastFetchTime[sportKey];
  } else {
    playersCache = {};
    lastFetchTime = {};
  }
}

/**
 * Get popular players
 * @param {string} sport - Optional sport to filter by
 * @param {number} limit - Maximum number of players to return
 * @returns {Promise<Array<Player>>} Array of popular Player objects
 */
export async function getPopularPlayers(sport = null, limit = 10) {
  try {
    // If sport is specified, fetch only for that sport
    if (sport) {
      const players = await fetchPlayersBySport(sport);

      // Sort by popularity (assuming stats has a popularity field)
      const sortedPlayers = players.sort((a, b) => {
        const aPopularity = a.stats.popularity || 0;
        const bPopularity = b.stats.popularity || 0;
        return bPopularity - aPopularity;
      });

      return sortedPlayers.slice(0, limit);
    }

    // Otherwise, fetch for all sports and combine
    const allPlayers = await fetchAllPlayers();
    const combinedPlayers = Object.values(allPlayers).flat();

    // Sort by popularity
    const sortedPlayers = combinedPlayers.sort((a, b) => {
      const aPopularity = a.stats.popularity || 0;
      const bPopularity = b.stats.popularity || 0;
      return bPopularity - aPopularity;
    });

    return sortedPlayers.slice(0, limit);
  } catch (error) {
    console.error('Error fetching popular players:', error);
    return [];
  }
}

/**
 * Get player statistics
 * @param {string} playerId - Player ID
 * @param {string} [season] - Optional season (e.g., '2024-2025')
 * @returns {Promise<Object|null>} Player statistics or null if not found
 */
export async function getPlayerStatistics(playerId, season = null) {
  try {
    let url = `/api/players/${playerId}/statistics`;

    if (season) {
      url += `?season=${encodeURIComponent(season)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to fetch player statistics: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching statistics for player ${playerId}:`, error);
    return null;
  }
}
