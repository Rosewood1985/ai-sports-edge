import axios from 'axios';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { API_KEYS, API_BASE_URLS, isApiKeyConfigured } from '../config/apiKeys';
import { analyticsService } from './analyticsService';
import { geoipService } from '../utils/geoip/geoipService.js';
import { cacheService } from './cacheService';

// Cache keys
const LOCATION_CACHE_KEY = 'geolocation_cache';
const LOCATION_TIMESTAMP_KEY = 'geolocation_timestamp';
const TEAMS_CACHE_KEY = 'local_teams_cache';
const MOVEMENT_THRESHOLD = 0.01; // Approximately 1km

// City to team mapping
const cityTeamMap: Record<string, string[]> = {
  'New York': ['New York Yankees', 'New York Mets', 'New York Giants', 'New York Jets', 'New York Knicks', 'Brooklyn Nets'],
  'Los Angeles': ['Los Angeles Dodgers', 'Los Angeles Angels', 'Los Angeles Rams', 'Los Angeles Chargers', 'Los Angeles Lakers', 'Los Angeles Clippers'],
  'Chicago': ['Chicago Cubs', 'Chicago White Sox', 'Chicago Bears', 'Chicago Bulls'],
  'Boston': ['Boston Red Sox', 'New England Patriots', 'Boston Celtics', 'Boston Bruins'],
  'Philadelphia': ['Philadelphia Phillies', 'Philadelphia Eagles', 'Philadelphia 76ers', 'Philadelphia Flyers'],
  'Dallas': ['Dallas Cowboys', 'Dallas Mavericks', 'Dallas Stars', 'Texas Rangers'],
  'San Francisco': ['San Francisco 49ers', 'San Francisco Giants', 'Golden State Warriors'],
  'Washington': ['Washington Nationals', 'Washington Commanders', 'Washington Wizards', 'Washington Capitals'],
  'Houston': ['Houston Astros', 'Houston Texans', 'Houston Rockets'],
  'Atlanta': ['Atlanta Braves', 'Atlanta Falcons', 'Atlanta Hawks'],
  'Miami': ['Miami Marlins', 'Miami Dolphins', 'Miami Heat'],
  'Denver': ['Denver Broncos', 'Denver Nuggets', 'Colorado Rockies', 'Colorado Avalanche'],
  'Phoenix': ['Arizona Cardinals', 'Phoenix Suns', 'Arizona Diamondbacks', 'Arizona Coyotes'],
  'Seattle': ['Seattle Seahawks', 'Seattle Mariners', 'Seattle Kraken'],
  'Detroit': ['Detroit Tigers', 'Detroit Lions', 'Detroit Pistons', 'Detroit Red Wings'],
  'Minneapolis': ['Minnesota Twins', 'Minnesota Vikings', 'Minnesota Timberwolves', 'Minnesota Wild'],
  'St. Louis': ['St. Louis Cardinals', 'St. Louis Blues'],
  'Tampa': ['Tampa Bay Buccaneers', 'Tampa Bay Rays', 'Tampa Bay Lightning'],
  'Pittsburgh': ['Pittsburgh Steelers', 'Pittsburgh Pirates', 'Pittsburgh Penguins'],
  'Cleveland': ['Cleveland Browns', 'Cleveland Guardians', 'Cleveland Cavaliers']
};

// Location data interface
export interface LocationData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// Odds suggestion interface
export interface OddsSuggestion {
  team: string;
  game: string;
  odds: number;
  suggestion: 'bet' | 'avoid';
}

/**
 * Geolocation service for getting user location and related data
 */
class GeolocationService {
  private apiKey: string | null =
    // Try to get API key from environment variables
    process.env.REACT_APP_IPGEOLOCATION_API_KEY ||
    // Try to get API key from Expo Constants
    (Constants.expoConfig?.extra?.ipgeolocationApiKey as string) ||
    null;
  private cachedLocation: LocationData | null = null;
  private cachedLocalTeams: string[] | null = null;
  private lastLocationUpdate: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private readonly BACKGROUND_REFRESH_INTERVAL = 1000 * 60 * 15; // 15 minutes
  private backgroundRefreshTimer: any = null;

  /**
   * Initialize the geolocation service
   * @param apiKey - IPgeolocation.io API key
   */
  initialize(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('Geolocation service initialized');
    
    // Load cached location data
    this.loadCachedData();
    
    // Start background refresh timer
    this.startBackgroundRefresh();
  }
  
  /**
   * Load cached location data from AsyncStorage
   */
  private async loadCachedData(): Promise<void> {
    try {
      // Load cached location
      const cachedLocationStr = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      const timestampStr = await AsyncStorage.getItem(LOCATION_TIMESTAMP_KEY);
      
      if (cachedLocationStr && timestampStr) {
        this.cachedLocation = JSON.parse(cachedLocationStr);
        this.lastLocationUpdate = parseInt(timestampStr, 10);
        
        console.log('Loaded cached location data');
      }
      
      // Load cached teams
      const cachedTeamsStr = await AsyncStorage.getItem(TEAMS_CACHE_KEY);
      if (cachedTeamsStr) {
        this.cachedLocalTeams = JSON.parse(cachedTeamsStr);
        console.log('Loaded cached local teams');
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
      // Continue without cached data
    }
  }
  
  /**
   * Start background refresh timer
   */
  private startBackgroundRefresh(): void {
    // Clear existing timer if any
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }
    
    // Set up new timer
    this.backgroundRefreshTimer = setInterval(async () => {
      try {
        // Only refresh if we have cached data
        if (this.cachedLocation) {
          console.log('Background refresh: updating location data');
          
          // Get fresh location data without using cache
          await this.getUserLocation(false, false);
        }
      } catch (error) {
        console.error('Error in background refresh:', error);
      }
    }, this.BACKGROUND_REFRESH_INTERVAL);
    
    console.log('Background refresh timer started');
  }
  
  /**
   * Stop background refresh timer
   */
  private stopBackgroundRefresh(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
      this.backgroundRefreshTimer = null;
      console.log('Background refresh timer stopped');
    }
  }

  /**
   * Check if the service is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get user location based on IP address or device GPS with improved caching
   * @param useCache - Whether to use cached location data if available
   * @param forceIP - Force using IP-based geolocation even on mobile
   * @returns {Promise<LocationData | null>} User location data
   */
  async getUserLocation(useCache: boolean = true, forceIP: boolean = false): Promise<LocationData | null> {
    try {
      // Check if we have cached location data using the cache service
      if (useCache) {
        const cachedLocation = await cacheService.getLocation();
        if (cachedLocation) {
          console.log('Using cached location data');
          return cachedLocation;
        }
      }

      // Track analytics event
      analyticsService.trackEvent('get_user_location', {
        method: forceIP ? 'ip' : (Platform.OS === 'web' ? 'ip' : 'gps'),
        useCache
      });

      let locationData: LocationData | null = null;

      // On mobile, try to use device GPS first unless forced to use IP
      if (!forceIP && Platform.OS !== 'web') {
        locationData = await this.getDeviceLocation();
        
        // Check if location has changed significantly
        if (locationData && this.cachedLocation) {
          const hasMovedSignificantly = this.hasLocationChangedSignificantly(
            this.cachedLocation,
            locationData
          );
          
          if (hasMovedSignificantly) {
            console.log('Location has changed significantly, updating cache');
            // Clear local teams cache since location has changed
            this.cachedLocalTeams = null;
            await cacheService.invalidate('teams');
            
            // Track movement in analytics
            analyticsService.trackEvent('location_changed', {
              oldCity: this.cachedLocation.city,
              newCity: locationData.city,
              distance: this.calculateDistance(
                this.cachedLocation.latitude,
                this.cachedLocation.longitude,
                locationData.latitude,
                locationData.longitude
              )
            });
          }
        }
      }

      // If device location failed or we're on web, use IP-based geolocation
      if (!locationData) {
        locationData = await this.getIPLocation();
      }

      if (locationData) {
        // Cache the location data
        this.cachedLocation = locationData;
        this.lastLocationUpdate = Date.now();
        
        // Save to cache service
        await cacheService.cacheLocation(locationData);
        
        // Also save to AsyncStorage for backward compatibility
        await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
        await AsyncStorage.setItem(LOCATION_TIMESTAMP_KEY, this.lastLocationUpdate.toString());
      }

      return locationData;
    } catch (error) {
      console.error('Error getting user location:', error);
      analyticsService.trackError(error as Error, { method: 'getUserLocation' });
      
      // If we have cached data, return it as fallback
      if (this.cachedLocation) {
        console.log('Returning cached location as fallback after error');
        return this.cachedLocation;
      }
      
      // Try to get from cache service as a last resort
      try {
        const cachedLocation = await cacheService.getLocation();
        if (cachedLocation) {
          console.log('Returning cached location from cache service as fallback after error');
          return cachedLocation;
        }
      } catch (cacheError) {
        console.error('Error getting cached location:', cacheError);
      }
      
      return null;
    }
  }

  /**
   * Get location based on device GPS
   * @returns {Promise<LocationData | null>} Location data
   */
  private async getDeviceLocation(): Promise<LocationData | null> {
    try {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return null;
      }

      // Get the current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      // Reverse geocode to get address information
      const [geocodeResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (!geocodeResult) {
        console.log('Failed to reverse geocode location');
        return null;
      }

      // Format the location data
      const locationData: LocationData = {
        city: geocodeResult.city || 'Unknown',
        state: geocodeResult.region || 'Unknown',
        country: geocodeResult.country || 'Unknown',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      return locationData;
    } catch (error) {
      console.error('Error getting device location:', error);
      return null;
    }
  }

  /**
   * Get location based on IP address
   * @returns {Promise<LocationData | null>} Location data
   */
  /**
   * Get the client's IP address
   * @returns {Promise<string>} Client IP address
   */
  private async getClientIP(): Promise<string> {
    try {
      // Try to get the IP from ipify.org
      const response = await axios.get('https://api.ipify.org?format=json');
      
      if (response.status === 200 && response.data && response.data.ip) {
        return response.data.ip;
      }
      
      // Fallback to another service if ipify.org fails
      const fallbackResponse = await axios.get('https://api64.ipify.org?format=json');
      
      if (fallbackResponse.status === 200 && fallbackResponse.data && fallbackResponse.data.ip) {
        return fallbackResponse.data.ip;
      }
      
      // If all else fails, return a default IP for testing
      console.warn('Could not determine client IP, using default IP for testing');
      return '8.8.8.8'; // Google DNS IP for testing
    } catch (error) {
      console.error('Error getting client IP:', error);
      return '8.8.8.8'; // Google DNS IP for testing
    }
  }

  /**
   * Get location based on IP address
   * @returns {Promise<LocationData | null>} Location data
   */
  private async getIPLocation(): Promise<LocationData | null> {
    try {
      // Try to use the GeoIP service first
      if (await geoipService.initialize()) {
        // Get the client IP address
        const ipAddress = await this.getClientIP();
        
        const geoipData = await geoipService.getLocationFromIP(ipAddress);
        
        if (geoipData) {
          const locationData: LocationData = {
            city: geoipData.city,
            state: geoipData.state,
            country: geoipData.country,
            latitude: geoipData.latitude,
            longitude: geoipData.longitude,
            timezone: geoipData.timezone
          };
          
          return locationData;
        }
      }
      
      // Fall back to the original implementation if GeoIP service fails
      if (!this.apiKey) {
        console.error('API key not set for geolocation service');
        return null;
      }

      const response = await axios.get('https://api.ipgeolocation.io/ipgeo', {
        params: {
          apiKey: this.apiKey
        }
      });

      if (response.status !== 200) {
        throw new Error(`Status code ${response.status}`);
      }

      const locationData: LocationData = {
        city: response.data.city,
        state: response.data.state_prov,
        country: response.data.country_name,
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
        timezone: response.data.time_zone.name
      };

      return locationData;
    } catch (error) {
      console.error('Error getting IP location:', error);
      return null;
    }
  }

  /**
   * Get local teams based on user location with improved caching
   * @param location - User location data
   * @param useCache - Whether to use cached teams if available
   * @returns {Promise<string[]>} Local teams
   */
  async getLocalTeams(location?: LocationData | null, useCache: boolean = true): Promise<string[]> {
    try {
      // Check if we have cached teams using the cache service
      if (useCache) {
        const cachedTeams = await cacheService.getTeams();
        if (cachedTeams && cachedTeams.length > 0) {
          console.log('Using cached teams data');
          this.cachedLocalTeams = cachedTeams;
          return cachedTeams;
        }
      }

      // If no location provided, get the user's location
      const locationData = location || await this.getUserLocation();
      
      if (!locationData) {
        console.error('No location data available');
        return [];
      }

      const { city, state } = locationData;

      // Track analytics event
      analyticsService.trackEvent('get_local_teams', {
        city,
        state,
        country: locationData.country
      });

      // Define a function to fetch teams based on location
      const fetchTeams = async (): Promise<string[]> => {
        // Check if we have teams for the user's city
        if (cityTeamMap[city]) {
          return cityTeamMap[city];
        }

        // If not, check for teams in the user's state
        const stateTeams: string[] = [];
        Object.entries(cityTeamMap).forEach(([cityName, teams]) => {
          if (cityName.includes(state) || state.includes(cityName)) {
            stateTeams.push(...teams);
          }
        });

        if (stateTeams.length > 0) {
          return stateTeams;
        }

        // If no teams found, return empty array
        return [];
      };

      // Fetch teams and cache them
      const teams = await fetchTeams();
      
      if (teams.length > 0) {
        this.cachedLocalTeams = teams;
        
        // Cache teams using the cache service
        await cacheService.cacheTeams(teams);
        
        // Also save to AsyncStorage for backward compatibility
        await AsyncStorage.setItem(TEAMS_CACHE_KEY, JSON.stringify(teams));
      }
      
      return teams;
    } catch (error) {
      console.error('Error getting local teams:', error);
      analyticsService.trackError(error as Error, { method: 'getLocalTeams' });
      return [];
    }
  }

  /**
   * Maximum number of retry attempts for API calls
   */
  private readonly MAX_ODDS_RETRY_ATTEMPTS = 2;
  
  /**
   * Delay between retry attempts in milliseconds
   */
  private readonly ODDS_RETRY_DELAY = 1000;
  
  /**
   * Get localized odds suggestions for local teams with improved caching and error handling
   * @param localTeams - Local teams (if not provided, will fetch them)
   * @returns {Promise<OddsSuggestion[]>} Localized odds suggestions
   */
  async getLocalizedOddsSuggestions(localTeams?: string[]): Promise<OddsSuggestion[]> {
    try {
      // If no teams provided, get the local teams
      const teams = localTeams || await this.getLocalTeams();
      
      if (teams.length === 0) {
        console.log('No local teams found, cannot generate odds suggestions');
        return [];
      }

      // Track analytics event
      analyticsService.trackEvent('get_localized_odds', {
        teamCount: teams.length
      });
      
      // Check if we have cached odds for any of the teams
      const cachedSuggestions: OddsSuggestion[] = [];
      for (const team of teams) {
        const cachedOdds = await cacheService.getOdds(team);
        if (cachedOdds) {
          cachedSuggestions.push(cachedOdds);
        }
      }
      
      // If we have cached odds for all teams, return them
      if (cachedSuggestions.length === teams.length) {
        console.log('Using cached odds data for all teams');
        return cachedSuggestions;
      }
      
      // Get teams that don't have cached odds
      const teamsToFetch = teams.filter(team =>
        !cachedSuggestions.some(suggestion => suggestion.team === team)
      );
      
      // Try to fetch real odds data from API
      if (isApiKeyConfigured('ODDS_API_KEY')) {
        let attempts = 0;
        let apiSuggestions: OddsSuggestion[] = [];
        
        while (apiSuggestions.length === 0 && attempts < this.MAX_ODDS_RETRY_ATTEMPTS) {
          try {
            attempts++;
            
            // Track API call attempt
            analyticsService.trackEvent('odds_api_call', {
              attempt: attempts,
              max_attempts: this.MAX_ODDS_RETRY_ATTEMPTS,
              teams_to_fetch: teamsToFetch.length
            });
            
            const response = await axios.get(`${API_BASE_URLS.ODDS_API}/sports/upcoming/odds`, {
              params: {
                apiKey: API_KEYS.ODDS_API_KEY,
                regions: 'us',
                markets: 'h2h,spreads',
                oddsFormat: 'american'
              },
              timeout: 8000 // 8 second timeout
            });
            
            if (response.status === 200 && Array.isArray(response.data)) {
              // Filter for games involving local teams
              for (const game of response.data) {
                const homeTeam = game.home_team;
                const awayTeam = game.away_team;
                
                // Check if either team is in our local teams list
                const localTeam = teamsToFetch.find(team =>
                  homeTeam.includes(team) ||
                  awayTeam.includes(team) ||
                  team.includes(homeTeam) ||
                  team.includes(awayTeam)
                );
                
                if (localTeam) {
                  // Get the odds for the local team
                  const isHome = homeTeam.includes(localTeam) || localTeam.includes(homeTeam);
                  const teamName = isHome ? homeTeam : awayTeam;
                  
                  // Find the market with the best odds
                  let bestOdds = 0;
                  let bestMarket = null;
                  
                  for (const market of game.bookmakers) {
                    for (const outcome of market.markets[0].outcomes) {
                      if (outcome.name === teamName && outcome.price > bestOdds) {
                        bestOdds = outcome.price;
                        bestMarket = market.title;
                      }
                    }
                  }
                  
                  // Determine if this is a good bet based on the odds
                  const isFavorite = bestOdds < 0; // Negative odds mean favorite in American format
                  const suggestion: OddsSuggestion = {
                    team: localTeam,
                    game: `${homeTeam} vs. ${awayTeam}`,
                    odds: bestOdds,
                    suggestion: isFavorite ? 'bet' : 'avoid' // Simple logic: bet on favorites
                  };
                  
                  apiSuggestions.push(suggestion);
                  
                  // Cache the odds for this team
                  await cacheService.cacheOdds(localTeam, suggestion);
                }
              }
              
              // Track successful API call
              if (apiSuggestions.length > 0) {
                analyticsService.trackEvent('odds_api_success', {
                  attempt: attempts,
                  suggestions_count: apiSuggestions.length
                });
              }
            } else {
              throw new Error(`Invalid response: ${response.status}`);
            }
          } catch (apiError) {
            console.error(`Error fetching odds from API (attempt ${attempts}/${this.MAX_ODDS_RETRY_ATTEMPTS}):`, apiError);
            
            // Track API error
            analyticsService.trackEvent('odds_api_error', {
              attempt: attempts,
              error: apiError instanceof Error ? apiError.message : 'Unknown error'
            });
            
            // If we haven't reached max attempts, wait before retrying
            if (attempts < this.MAX_ODDS_RETRY_ATTEMPTS) {
              await new Promise<void>((resolve) => {
                setTimeout(resolve, this.ODDS_RETRY_DELAY * attempts);
              });
            }
          }
        }
        
        // If we got suggestions from the API, combine with cached suggestions
        if (apiSuggestions.length > 0) {
          return [...cachedSuggestions, ...apiSuggestions];
        }
      }

      // Generate mock odds suggestions for teams without cached odds
      console.log('Using mock odds data as fallback');
      const mockSuggestions: OddsSuggestion[] = teamsToFetch.map(team => {
        // Generate more realistic odds
        const isFavorite = Math.random() > 0.5;
        const odds = isFavorite
          ? -(Math.floor(Math.random() * 250) + 100) // Favorite: -100 to -350
          : (Math.floor(Math.random() * 250) + 100);  // Underdog: +100 to +350
        
        // Generate opponent name
        const opponents = [
          'Boston Celtics', 'Los Angeles Lakers', 'Chicago Bulls',
          'Miami Heat', 'Golden State Warriors', 'Dallas Cowboys',
          'New York Yankees', 'Los Angeles Dodgers'
        ];
        const opponent = opponents[Math.floor(Math.random() * opponents.length)];
        
        const suggestion: OddsSuggestion = {
          team,
          game: `${team} vs. ${opponent}`,
          odds,
          suggestion: isFavorite ? 'bet' : 'avoid' // Suggest betting on favorites
        };
        
        // Cache the mock odds for this team
        cacheService.cacheOdds(team, suggestion);
        
        return suggestion;
      });

      // Combine cached and mock suggestions
      return [...cachedSuggestions, ...mockSuggestions];
    } catch (error) {
      console.error('Error getting localized odds suggestions:', error);
      analyticsService.trackError(error as Error, { method: 'getLocalizedOddsSuggestions' });
      return [];
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 Latitude of point 1
   * @param lon1 Longitude of point 1
   * @param lat2 Latitude of point 2
   * @param lon2 Longitude of point 2
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  /**
   * Convert degrees to radians
   * @param deg Degrees
   * @returns Radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * Check if location has changed significantly
   * @param oldLocation Old location
   * @param newLocation New location
   * @returns True if location has changed significantly
   */
  private hasLocationChangedSignificantly(oldLocation: LocationData, newLocation: LocationData): boolean {
    // If city has changed, consider it significant
    if (oldLocation.city !== newLocation.city) {
      return true;
    }
    
    // Calculate distance between old and new locations
    const distance = this.calculateDistance(
      oldLocation.latitude,
      oldLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );
    
    // Consider it significant if moved more than threshold
    return distance > MOVEMENT_THRESHOLD;
  }

  /**
   * Clear cached location data
   */
  clearCache(): void {
    this.cachedLocation = null;
    this.cachedLocalTeams = null;
    this.lastLocationUpdate = 0;
    
    // Clear cache service
    cacheService.invalidate('location');
    cacheService.invalidate('teams');
    
    // Clear AsyncStorage cache for backward compatibility
    AsyncStorage.removeItem(LOCATION_CACHE_KEY);
    AsyncStorage.removeItem(LOCATION_TIMESTAMP_KEY);
    AsyncStorage.removeItem(TEAMS_CACHE_KEY);
    
    console.log('Geolocation cache cleared');
  }
}

export const geolocationService = new GeolocationService();
export default geolocationService;