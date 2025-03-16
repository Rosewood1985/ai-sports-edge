import { League, Team, Event, LeagueFilter } from '../types/sports';
import { handleApiError } from '../utils/errorHandling';

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// Cache storage
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class SportsDataService {
  private leaguesCache: CacheItem<League[]> | null = null;
  private teamsCache: Map<string, CacheItem<Team[]>> = new Map();
  private eventsCache: Map<string, CacheItem<Event[]>> = new Map();
  
  private isCacheValid<T>(cache: CacheItem<T> | null): boolean {
    if (!cache) return false;
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }

  /**
   * Fetch all available leagues from TheSportsDB API
   */
  async fetchAllLeagues(): Promise<League[]> {
    try {
      if (this.isCacheValid(this.leaguesCache)) {
        return this.leaguesCache!.data;
      }
      
      const response = await fetch('https://thesportsdb.com/api/v1/json/3/all_leagues.php');
      const data = await response.json();
      
      if (!data.leagues) {
        throw new Error('No leagues data returned from API');
      }
      
      const leagues: League[] = data.leagues;
      
      // Update cache
      this.leaguesCache = {
        data: leagues,
        timestamp: Date.now()
      };
      
      return leagues;
    } catch (error) {
      return handleApiError('Error fetching leagues', error);
    }
  }

  /**
   * Fetch only U.S. leagues
   */
  async fetchUSLeagues(): Promise<League[]> {
    try {
      const allLeagues = await this.fetchAllLeagues();
      const americanLeagues = allLeagues.filter(league => 
        league.strCountry === "USA");
      
      console.log("American Leagues:", americanLeagues);
      return americanLeagues;
    } catch (error) {
      return handleApiError('Error fetching American leagues', error);
    }
  }

  /**
   * Fetch all college sports leagues/conferences
   */
  async fetchCollegeLeagues(): Promise<League[]> {
    try {
      const allLeagues = await this.fetchAllLeagues();
      
      // Filter for college leagues
      const collegeLeagues = allLeagues.filter(league => 
        (league.strLeagueAlternate?.includes("NCAA") || 
         league.strLeague.toLowerCase().includes("college") ||
         league.strLeague.includes("NCAA")));
      
      // Mark these as college leagues
      collegeLeagues.forEach(league => {
        league.isCollege = true;
      });
      
      console.log("College Leagues:", collegeLeagues);
      return collegeLeagues;
    } catch (error) {
      return handleApiError('Error fetching college leagues', error);
    }
  }

  /**
   * Fetch leagues with custom filters
   */
  async fetchLeaguesByFilter(filter: LeagueFilter): Promise<League[]> {
    try {
      const allLeagues = await this.fetchAllLeagues();
      
      return allLeagues.filter(league => {
        // Apply country filter if specified
        if (filter.country && league.strCountry !== filter.country) {
          return false;
        }
        
        // Apply sport filter if specified
        if (filter.sport && league.strSport !== filter.sport) {
          return false;
        }
        
        // Apply college filter if specified
        if (filter.isCollege !== undefined) {
          const isCollegeLeague = 
            league.strLeagueAlternate?.includes("NCAA") || 
            league.strLeague.toLowerCase().includes("college") ||
            league.strLeague.includes("NCAA");
          
          if (filter.isCollege !== isCollegeLeague) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      return handleApiError('Error fetching filtered leagues', error);
    }
  }

  /**
   * Fetch teams by league ID
   */
  async fetchTeamsByLeague(leagueId: string): Promise<Team[]> {
    try {
      // Check cache first
      if (this.teamsCache.has(leagueId) && 
          this.isCacheValid(this.teamsCache.get(leagueId)!)) {
        return this.teamsCache.get(leagueId)!.data;
      }
      
      const response = await fetch(
        `https://thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id=${leagueId}`
      );
      const data = await response.json();
      
      if (!data.teams) {
        return [];
      }
      
      const teams: Team[] = data.teams;
      
      // Update cache
      this.teamsCache.set(leagueId, {
        data: teams,
        timestamp: Date.now()
      });
      
      return teams;
    } catch (error) {
      return handleApiError(`Error fetching teams for league ${leagueId}`, error);
    }
  }

  /**
   * Fetch upcoming events by league ID
   */
  async fetchUpcomingEventsByLeague(leagueId: string): Promise<Event[]> {
    try {
      // Check cache first
      if (this.eventsCache.has(leagueId) && 
          this.isCacheValid(this.eventsCache.get(leagueId)!)) {
        return this.eventsCache.get(leagueId)!.data;
      }
      
      const response = await fetch(
        `https://thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`
      );
      const data = await response.json();
      
      if (!data.events) {
        return [];
      }
      
      const events: Event[] = data.events;
      
      // Update cache
      this.eventsCache.set(leagueId, {
        data: events,
        timestamp: Date.now()
      });
      
      return events;
    } catch (error) {
      return handleApiError(`Error fetching events for league ${leagueId}`, error);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.leaguesCache = null;
    this.teamsCache.clear();
    this.eventsCache.clear();
  }
}

// Export as singleton
export const sportsDataService = new SportsDataService();