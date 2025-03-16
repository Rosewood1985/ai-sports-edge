import { useState, useEffect, useCallback } from 'react';
import { fetchOdds } from '../config/oddsApi';
import { OddsApiResponse, Game, DailyInsight } from '../types/odds';
import { getAIPredictions, getLiveUpdates, getDailyInsights } from '../services/aiPredictionService';
import { userPreferencesService } from '../services/userPreferencesService';

interface UseOddsDataResult {
  data: Game[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  dailyInsights: DailyInsight | null;
  refreshLiveData: () => void;
  filteredByLeagues: boolean;
}

// Mapping between TheSportsDB league IDs and The Odds API sport keys
// This is a simplified mapping - in a real app, this would be more comprehensive
const leagueToSportKeyMap: Record<string, string> = {
  // Soccer leagues
  '4328': 'soccer_epl',           // English Premier League
  '4331': 'soccer_spain_la_liga', // Spanish La Liga
  '4332': 'soccer_germany_bundesliga', // German Bundesliga
  '4334': 'soccer_italy_serie_a', // Italian Serie A
  '4335': 'soccer_france_ligue_one', // French Ligue 1
  '4346': 'soccer_uefa_champs_league', // UEFA Champions League
  
  // Basketball leagues
  '4387': 'basketball_nba',       // NBA
  '4388': 'basketball_ncaab',     // NCAA Basketball
  '4408': 'basketball_euroleague', // Euroleague
  
  // American Football leagues
  '4391': 'americanfootball_nfl', // NFL
  '4392': 'americanfootball_ncaaf', // NCAA Football
  
  // Baseball leagues
  '4424': 'baseball_mlb',         // MLB
  '4429': 'baseball_ncaa',        // NCAA Baseball
  
  // Ice Hockey leagues
  '4380': 'icehockey_nhl',        // NHL
  '4381': 'icehockey_nhl',        // NCAA Hockey
};

/**
 * Custom hook for fetching and managing odds data
 * @param {string} sport - Sport key (e.g., "americanfootball_nfl")
 * @param {string[]} markets - Markets to fetch (e.g., ["h2h", "spreads"])
 * @param {number} maxRetries - Maximum number of retry attempts for failed API calls
 * @param {boolean} enableLiveUpdates - Whether to enable real-time updates
 * @param {boolean} enableAIPredictions - Whether to enable AI predictions
 * @param {boolean} filterByUserLeagues - Whether to filter odds by user's selected leagues
 * @returns {UseOddsDataResult} - Object containing data, loading state, error state, and refresh function
 */
export const useOddsData = (
  sport = "americanfootball_nfl",
  markets = ["h2h", "spreads"],
  maxRetries = 3,
  enableLiveUpdates = true,
  enableAIPredictions = true,
  filterByUserLeagues = true
): UseOddsDataResult => {
  const [data, setData] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight | null>(null);
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [filteredByLeagues, setFilteredByLeagues] = useState<boolean>(false);

  // Load user's selected leagues
  useEffect(() => {
    const loadSelectedLeagues = async () => {
      if (filterByUserLeagues) {
        try {
          const leagueIds = await userPreferencesService.getSelectedLeagueIds();
          setSelectedLeagueIds(leagueIds);
          setFilteredByLeagues(leagueIds.length > 0);
        } catch (err) {
          console.error("Error loading selected leagues:", err);
        }
      }
    };

    loadSelectedLeagues();
  }, [filterByUserLeagues]);

  // Load daily insights
  useEffect(() => {
    const loadInsights = async () => {
      try {
        const insights = await getDailyInsights();
        setDailyInsights(insights);
      } catch (err) {
        console.error("Error loading daily insights:", err);
      }
    };

    loadInsights();
  }, []);

  // Set up live updates interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (enableLiveUpdates && data.length > 0) {
      intervalId = setInterval(() => {
        // Use a functional update to avoid dependency on data
        setData(currentData => getLiveUpdates(currentData));
      }, 60000); // Update every 60 seconds instead of 30 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [enableLiveUpdates]); // Remove data from dependencies

  // Helper function moved inside loadData to break dependency cycle

  // Helper function to filter games by leagues - moved inside loadData to break dependency cycle
  const filterGamesByLeaguesInternal = (games: Game[], leagueIds: string[]): Game[] => {
    if (!filterByUserLeagues || leagueIds.length === 0) {
      return games;
    }

    // Get sport keys from selected league IDs
    const selectedSportKeys = leagueIds
      .map(id => leagueToSportKeyMap[id])
      .filter(key => key); // Filter out undefined values

    if (selectedSportKeys.length === 0) {
      return games; // No mappable leagues selected, return all games
    }

    // Filter games by sport keys
    return games.filter(game => selectedSportKeys.includes(game.sport_key));
  };

  const loadData = useCallback(async (retry = false) => {
    if (retry) {
      setRetryCount(prev => prev + 1);
    } else {
      setRetryCount(0);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch odds data with cache enabled
      const response = await fetchOdds(sport, markets, "us", true);
      
      if (response && response.success) {
        let processedData = response.data;
        
        // Add AI predictions if enabled
        if (enableAIPredictions) {
          processedData = await getAIPredictions(processedData);
        }
        
        // Add live updates if enabled
        if (enableLiveUpdates) {
          processedData = getLiveUpdates(processedData);
        }
        
        // Filter by user's selected leagues if enabled
        if (filterByUserLeagues && selectedLeagueIds.length > 0) {
          // Use internal function instead of the memoized one to break dependency cycle
          processedData = filterGamesByLeaguesInternal(processedData, selectedLeagueIds);
        }
        
        setData(processedData);
        setRetryCount(0);
        
        // If data came from cache, show a message but don't treat as error
        if (response.fromCache) {
          setError("Using cached data. Live updates may be limited due to API rate limits.");
        } else {
          setError(null);
        }
      } else {
        // If we got no data and hit rate limits, show a specific message
        if (response.fromCache === false) {
          throw new Error("API rate limit reached. Please try again later.");
        } else {
          throw new Error("No data received");
        }
      }
    } catch (err: any) {
      console.error("Error fetching odds:", err);
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => loadData(true), delay);
        setError(`Loading failed. Retrying (${retryCount + 1}/${maxRetries})...`);
      } else {
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 429) {
            setError("API rate limit reached. Please try again later.");
          } else {
            setError(`API Error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError("Network error. Please check your connection.");
        } else {
          // Something happened in setting up the request
          setError(`Error: ${err.message}`);
        }
      }
    } finally {
      if (retryCount >= maxRetries) setLoading(false);
    }
  }, [sport, markets, retryCount, maxRetries, enableLiveUpdates, enableAIPredictions, filterByUserLeagues, selectedLeagueIds]);
  // Removed filterGamesByLeagues from dependencies

  // Refresh live data without reloading from API
  const refreshLiveData = useCallback(() => {
    if (data.length > 0) {
      // Use functional update to avoid dependency on data
      setData(currentData => getLiveUpdates(currentData));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh: () => loadData(false),
    dailyInsights,
    refreshLiveData,
    filteredByLeagues
  };
};

export default useOddsData;