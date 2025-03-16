import axios from "axios";
import { OddsApiResponse } from "../types/odds";

// Replace this with your actual API key from The Odds API
const API_KEY = "fdf4ad2d50a6b6d2ca77e52734851aa4";
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

/**
 * Fetches betting odds for a given sport
 * @param {string} sport - Sport key (e.g., "americanfootball_nfl")
 * @param {string[]} markets - Markets to fetch (e.g., "h2h", "spreads")
 * @param {string} regions - Regions for odds (e.g., "us", "uk", "eu")
 * @returns {Promise<OddsApiResponse>} - Array of games with odds
 */
export const fetchOdds = async (
  sport = "americanfootball_nfl",
  markets = ["h2h", "spreads"],
  regions = "us"
): Promise<OddsApiResponse | null> => {
  try {
    const response = await axios.get<OddsApiResponse>(`${BASE_URL}/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: regions,
        markets: markets.join(","), // Join markets with comma
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching odds:", error);
    return null;
  }
};

export default fetchOdds;