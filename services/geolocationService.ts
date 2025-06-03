import axios from 'axios';

import { cacheService } from './cacheService';
import { API_KEYS, API_BASE_URLS, isApiKeyConfigured } from '../config/apiKeys';
import geoipService from '../utils/geoip';

// Cache keys
const LOCATION_CACHE_KEY = 'geolocation_cache';
const LOCATION_TIMESTAMP_KEY = 'geolocation_timestamp';
const TEAMS_CACHE_KEY = 'local_teams_cache';
const MOVEMENT_THRESHOLD = 0.01; // Approximately 1km

// City to team mapping
const cityTeamMap: Record<string, string[]> = {
  'New York': [
    'New York Yankees',
    'New York Mets',
    'New York Giants',
    'New York Jets',
    'New York Knicks',
    'Brooklyn Nets',
  ],
  'Los Angeles': [
    'Los Angeles Dodgers',
    'Los Angeles Angels',
    'Los Angeles Rams',
    'Los Angeles Chargers',
    'Los Angeles Lakers',
    'Los Angeles Clippers',
  ],
  Chicago: ['Chicago Cubs', 'Chicago White Sox', 'Chicago Bears', 'Chicago Bulls'],
  Boston: ['Boston Red Sox', 'New England Patriots', 'Boston Celtics', 'Boston Bruins'],
  Philadelphia: [
    'Philadelphia Phillies',
    'Philadelphia Eagles',
    'Philadelphia 76ers',
    'Philadelphia Flyers',
  ],
  Dallas: ['Dallas Cowboys', 'Dallas Mavericks', 'Dallas Stars', 'Texas Rangers'],
  'San Francisco': ['San Francisco 49ers', 'San Francisco Giants', 'Golden State Warriors'],
  Washington: [
    'Washington Nationals',
    'Washington Commanders',
    'Washington Wizards',
    'Washington Capitals',
  ],
  Houston: ['Houston Astros', 'Houston Texans', 'Houston Rockets'],
  Atlanta: ['Atlanta Braves', 'Atlanta Falcons', 'Atlanta Hawks'],
  Miami: ['Miami Marlins', 'Miami Dolphins', 'Miami Heat'],
  Denver: ['Denver Broncos', 'Denver Nuggets', 'Colorado Rockies', 'Colorado Avalanche'],
};

// Location interface
export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timestamp?: number;
}

// LocationData interface for compatibility
export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timestamp?: number;
  accuracy?: number;
  ip?: string;
}

// Odds suggestion interface
export interface OddsSuggestion {
  team: string;
  game: string;
  odds: number;
  suggestion: 'bet' | 'avoid' | 'watch';
  timestamp: string;
  confidence?: number;
  reasoning?: string;
}

/**
 * Geolocation Service
 * Web-compatible version
 */
class GeolocationService {
  private currentLocation: Location | null = null;
  private isPermissionGranted: boolean = false;

  /**
   * Initialize the geolocation service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check for cached location
      const cachedLocation = await this.getCachedLocation();
      if (cachedLocation) {
        this.currentLocation = cachedLocation;
      }

      // Check browser geolocation permission
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        this.isPermissionGranted = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize geolocation service:', error);
      return false;
    }
  }

  /**
   * Get the current location
   */
  async getCurrentLocation(forceRefresh: boolean = false): Promise<Location | null> {
    try {
      // If we have a cached location and don't need to refresh, return it
      if (this.currentLocation && !forceRefresh) {
        return this.currentLocation;
      }

      // Try to get location from browser geolocation API
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        const position = await this.getBrowserLocation();
        if (position) {
          const { latitude, longitude } = position;

          // Get city information from coordinates
          const locationInfo = await this.getLocationInfoFromCoordinates(latitude, longitude);

          this.currentLocation = {
            latitude,
            longitude,
            ...locationInfo,
            timestamp: Date.now(),
          };

          // Cache the location
          await this.cacheLocation(this.currentLocation);

          return this.currentLocation;
        }
      }

      // If browser geolocation fails, try IP-based geolocation
      const ipLocation = await geoipService.getLocationFromIP();
      if (ipLocation) {
        this.currentLocation = {
          ...ipLocation,
          timestamp: Date.now(),
        };

        // Cache the location
        await this.cacheLocation(this.currentLocation);

        return this.currentLocation;
      }

      // If we still have a cached location, return it even if it's old
      if (this.currentLocation) {
        return this.currentLocation;
      }

      return null;
    } catch (error) {
      console.error('Failed to get current location:', error);

      // If we have a cached location, return it even if it's old
      if (this.currentLocation) {
        return this.currentLocation;
      }

      return null;
    }
  }

  /**
   * Get browser geolocation
   */
  private getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise(resolve => {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          error => {
            console.error('Browser geolocation error:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get location information from coordinates
   */
  private async getLocationInfoFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<{ city?: string; state?: string; country?: string; postalCode?: string }> {
    try {
      // Check if OpenWeather API key is configured
      if (isApiKeyConfigured('OPENWEATHER_API_KEY')) {
        const response = await axios.get(
          `${API_BASE_URLS.OPENWEATHER}/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEYS.OPENWEATHER_API_KEY}`
        );

        if (response.data && response.data.length > 0) {
          const location = response.data[0];
          return {
            city: location.name,
            state: location.state,
            country: location.country,
          };
        }
      }

      // Fallback to Google Maps API if OpenWeather fails
      if (isApiKeyConfigured('GOOGLE_MAPS_API_KEY')) {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEYS.GOOGLE_MAPS_API_KEY}`
        );

        if (response.data && response.data.results && response.data.results.length > 0) {
          const result = response.data.results[0];

          let city, state, country, postalCode;

          // Extract address components
          for (const component of result.address_components) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (component.types.includes('country')) {
              country = component.long_name;
            } else if (component.types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          }

          return {
            city,
            state,
            country,
            postalCode,
          };
        }
      }

      return {};
    } catch (error) {
      console.error('Failed to get location info from coordinates:', error);
      return {};
    }
  }

  /**
   * Get local teams based on location
   */
  async getLocalTeams(): Promise<string[]> {
    try {
      // Try to get from cache first
      const cachedTeams = await this.getCachedTeams();
      if (cachedTeams && cachedTeams.length > 0) {
        return cachedTeams;
      }

      // Get current location
      const location = await this.getCurrentLocation();
      if (!location || !location.city) {
        return [];
      }

      // Find teams for the city
      const city = Object.keys(cityTeamMap).find(
        c => c.toLowerCase() === location.city?.toLowerCase()
      );

      if (city && cityTeamMap[city]) {
        // Cache the teams
        await this.cacheTeams(cityTeamMap[city]);
        return cityTeamMap[city];
      }

      return [];
    } catch (error) {
      console.error('Failed to get local teams:', error);
      return [];
    }
  }

  /**
   * Cache the current location
   */
  private async cacheLocation(location: Location): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
        localStorage.setItem(LOCATION_TIMESTAMP_KEY, Date.now().toString());
      } else {
        await cacheService.set(LOCATION_CACHE_KEY, JSON.stringify(location));
        await cacheService.set(LOCATION_TIMESTAMP_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  }

  /**
   * Get cached location
   */
  private async getCachedLocation(): Promise<Location | null> {
    try {
      let cachedLocationStr: string | null = null;
      let cachedTimestampStr: string | null = null;

      if (typeof localStorage !== 'undefined') {
        cachedLocationStr = localStorage.getItem(LOCATION_CACHE_KEY);
        cachedTimestampStr = localStorage.getItem(LOCATION_TIMESTAMP_KEY);
      } else {
        cachedLocationStr = await cacheService.get(LOCATION_CACHE_KEY);
        cachedTimestampStr = await cacheService.get(LOCATION_TIMESTAMP_KEY);
      }

      if (!cachedLocationStr) {
        return null;
      }

      const cachedLocation = JSON.parse(cachedLocationStr) as Location;
      const cachedTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;

      // Check if cache is expired (24 hours)
      const now = Date.now();
      if (now - cachedTimestamp > 24 * 60 * 60 * 1000) {
        return null;
      }

      return cachedLocation;
    } catch (error) {
      console.error('Failed to get cached location:', error);
      return null;
    }
  }

  /**
   * Cache local teams
   */
  private async cacheTeams(teams: string[]): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TEAMS_CACHE_KEY, JSON.stringify(teams));
      } else {
        await cacheService.set(TEAMS_CACHE_KEY, JSON.stringify(teams));
      }
    } catch (error) {
      console.error('Failed to cache teams:', error);
    }
  }

  /**
   * Get cached teams
   */
  private async getCachedTeams(): Promise<string[] | null> {
    try {
      let cachedTeamsStr: string | null = null;

      if (typeof localStorage !== 'undefined') {
        cachedTeamsStr = localStorage.getItem(TEAMS_CACHE_KEY);
      } else {
        cachedTeamsStr = await cacheService.get(TEAMS_CACHE_KEY);
      }

      if (!cachedTeamsStr) {
        return null;
      }

      return JSON.parse(cachedTeamsStr) as string[];
    } catch (error) {
      console.error('Failed to get cached teams:', error);
      return null;
    }
  }

  /**
   * Get local teams based on location
   */
  async getLocalTeams(location?: LocationData | null): Promise<string[]> {
    try {
      let currentLocation = location;

      // Get current location if not provided
      if (!currentLocation) {
        currentLocation = (await this.getCurrentLocation()) as LocationData;
      }

      if (!currentLocation || !currentLocation.city) {
        return [];
      }

      const city = currentLocation.city;
      const state = currentLocation.state || '';

      // Check if we have teams for the user's city
      if (cityTeamMap[city]) {
        await this.cacheTeams(cityTeamMap[city]);
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
        await this.cacheTeams(stateTeams);
        return stateTeams;
      }

      return [];
    } catch (error) {
      console.error('Error getting local teams:', error);
      return [];
    }
  }

  /**
   * Get localized odds suggestions
   */
  async getLocalizedOddsSuggestions(location?: LocationData | null): Promise<OddsSuggestion[]> {
    try {
      // Get local teams
      const localTeams = await this.getLocalTeams(location);

      if (localTeams.length === 0) {
        return [];
      }

      // Generate odds suggestions for local teams
      return localTeams.map(team => {
        // Generate a realistic opponent
        const opponent = this.generateOpponent(team);

        // Generate realistic odds
        const baseOdds = 2.0;
        const popularityFactor = team.includes('Yankees') || team.includes('Lakers') ? 0.8 : 1.2;
        const odds = baseOdds * popularityFactor * (0.9 + Math.random() * 0.4);

        // Generate suggestion based on odds
        const suggestion: 'bet' | 'avoid' | 'watch' =
          odds < 1.8 ? 'bet' : odds > 2.5 ? 'avoid' : 'watch';

        return {
          team,
          game: `${team} vs. ${opponent}`,
          odds: parseFloat(odds.toFixed(2)),
          suggestion,
          timestamp: new Date().toISOString(),
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
          reasoning: this.generateReasoning(suggestion, odds),
        };
      });
    } catch (error) {
      console.error('Error getting localized odds suggestions:', error);
      return [];
    }
  }

  /**
   * Generate an opponent team name
   */
  private generateOpponent(team: string): string {
    const opponents: Record<string, string[]> = {
      Yankees: ['Red Sox', 'Blue Jays', 'Orioles'],
      Lakers: ['Warriors', 'Clippers', 'Celtics'],
      Cowboys: ['Giants', 'Eagles', 'Commanders'],
      Chiefs: ['Raiders', 'Broncos', 'Chargers'],
    };

    // Find opponent based on team name
    for (const [teamKey, opponentList] of Object.entries(opponents)) {
      if (team.includes(teamKey)) {
        return opponentList[Math.floor(Math.random() * opponentList.length)];
      }
    }

    // Default opponents
    const defaultOpponents = ['Visitors', 'Away Team', 'Opposition'];
    return defaultOpponents[Math.floor(Math.random() * defaultOpponents.length)];
  }

  /**
   * Generate reasoning for betting suggestion
   */
  private generateReasoning(suggestion: string, odds: number): string {
    switch (suggestion) {
      case 'bet':
        return `Favorable odds at ${odds.toFixed(2)}. Good value bet opportunity.`;
      case 'avoid':
        return `High odds at ${odds.toFixed(2)}. Risk outweighs potential reward.`;
      case 'watch':
        return `Moderate odds at ${odds.toFixed(2)}. Monitor for line movement.`;
      default:
        return 'Standard betting recommendation based on current odds.';
    }
  }

  /**
   * Get user location (compatibility method)
   */
  async getUserLocation(
    useGPS: boolean = false,
    forceRefresh: boolean = false
  ): Promise<LocationData | null> {
    const location = await this.getCurrentLocation(forceRefresh);
    return location as LocationData;
  }

  /**
   * Check if location services are available
   */
  isLocationAvailable(): boolean {
    return (
      this.isPermissionGranted || (typeof navigator !== 'undefined' && 'geolocation' in navigator)
    );
  }

  /**
   * Get distance between two coordinates in kilometers
   */
  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Export a singleton instance
export const geolocationService = new GeolocationService();
