// /services/balldontlieService.ts

const BALLDONTLIE_API = "https://www.balldontlie.io/api/v1";

/**
 * Fetch NBA games played on a specific date.
 * @param date - Date in YYYY-MM-DD format (example: '2025-04-27')
 */
export async function fetchGamesByDate(date: string) {
  try {
    const response = await fetch(`${BALLDONTLIE_API}/games?dates[]=${date}`);
    const data = await response.json();
    return data.data; // Return array of games
  } catch (error) {
    console.error("❌ Error fetching games by date:", error);
    return [];
  }
}

/**
 * Fetch season averages for a player by playerId and season year.
 * @param playerId - The player's balldontlie ID
 * @param season - The NBA season year (example: 2024 for 2024-25 season)
 */
export async function fetchPlayerSeasonAverages(playerId: number, season: number) {
  try {
    const response = await fetch(`${BALLDONTLIE_API}/season_averages?player_ids[]=${playerId}&season=${season}`);
    const data = await response.json();
    return data.data[0] || null; // Return first result or null
  } catch (error) {
    console.error("❌ Error fetching player season averages:", error);
    return null;
  }
}