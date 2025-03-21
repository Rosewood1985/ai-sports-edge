import axios, { AxiosError } from 'axios';
import { geolocationService, LocationData } from './geolocationService';
import { API_KEYS, API_BASE_URLS, isApiKeyConfigured } from '../config/apiKeys';
import { analyticsService } from './analyticsService';
import { cacheService } from './cacheService';

/**
 * Interface for venue data
 */
export interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  teams: string[];
  sports: string[];
  latitude: number;
  longitude: number;
  distance?: number; // Distance from user in kilometers
  imageUrl?: string; // URL to venue image
  website?: string; // Venue website
  yearBuilt?: number; // Year the venue was built
  hasRoof?: boolean; // Whether the venue has a roof
  address?: string; // Full address
  upcomingEvents?: VenueEvent[]; // Upcoming events at the venue
}

/**
 * Interface for venue event
 */
export interface VenueEvent {
  id: string;
  name: string;
  date: string;
  type: string; // e.g., "Game", "Concert", etc.
  teams?: string[]; // Teams playing (if applicable)
  ticketUrl?: string; // URL to purchase tickets
}

/**
 * Interface for venue filter options
 */
export interface VenueFilterOptions {
  sports?: string[]; // Filter by sports
  capacity?: { min?: number; max?: number }; // Filter by capacity range
  hasRoof?: boolean; // Filter by roof
  teams?: string[]; // Filter by teams
  distance?: number; // Maximum distance in kilometers
  sortBy?: 'distance' | 'capacity' | 'name'; // Sort options
  sortDirection?: 'asc' | 'desc'; // Sort direction
}

/**
 * Service for managing sports venues
 */
class VenueService {
  private apiKey: string | null = API_KEYS.SPORTS_DATA_API_KEY;
  
  private cachedVenues: Venue[] | null = null;
  private lastVenueUpdate: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
  
  /**
   * Mock venue data for testing or when API is not available
   */
  private mockVenues: Venue[] = [
    {
      id: 'v1',
      name: 'Yankee Stadium',
      city: 'New York',
      state: 'New York',
      country: 'United States',
      capacity: 54251,
      teams: ['New York Yankees'],
      sports: ['Baseball'],
      latitude: 40.8296,
      longitude: -73.9262
    },
    {
      id: 'v2',
      name: 'Citi Field',
      city: 'New York',
      state: 'New York',
      country: 'United States',
      capacity: 41922,
      teams: ['New York Mets'],
      sports: ['Baseball'],
      latitude: 40.7571,
      longitude: -73.8458
    },
    {
      id: 'v3',
      name: 'MetLife Stadium',
      city: 'East Rutherford',
      state: 'New Jersey',
      country: 'United States',
      capacity: 82500,
      teams: ['New York Giants', 'New York Jets'],
      sports: ['Football'],
      latitude: 40.8135,
      longitude: -74.0744
    },
    {
      id: 'v4',
      name: 'Madison Square Garden',
      city: 'New York',
      state: 'New York',
      country: 'United States',
      capacity: 19812,
      teams: ['New York Knicks', 'New York Rangers'],
      sports: ['Basketball', 'Hockey'],
      latitude: 40.7505,
      longitude: -73.9934
    },
    {
      id: 'v5',
      name: 'Barclays Center',
      city: 'Brooklyn',
      state: 'New York',
      country: 'United States',
      capacity: 19000,
      teams: ['Brooklyn Nets', 'New York Liberty'],
      sports: ['Basketball'],
      latitude: 40.6826,
      longitude: -73.9754
    },
    {
      id: 'v6',
      name: 'Fenway Park',
      city: 'Boston',
      state: 'Massachusetts',
      country: 'United States',
      capacity: 37755,
      teams: ['Boston Red Sox'],
      sports: ['Baseball'],
      latitude: 42.3467,
      longitude: -71.0972
    },
    {
      id: 'v7',
      name: 'TD Garden',
      city: 'Boston',
      state: 'Massachusetts',
      country: 'United States',
      capacity: 19580,
      teams: ['Boston Celtics', 'Boston Bruins'],
      sports: ['Basketball', 'Hockey'],
      latitude: 42.3662,
      longitude: -71.0621
    },
    {
      id: 'v8',
      name: 'Dodger Stadium',
      city: 'Los Angeles',
      state: 'California',
      country: 'United States',
      capacity: 56000,
      teams: ['Los Angeles Dodgers'],
      sports: ['Baseball'],
      latitude: 34.0739,
      longitude: -118.2400
    },
    {
      id: 'v9',
      name: 'Crypto.com Arena',
      city: 'Los Angeles',
      state: 'California',
      country: 'United States',
      capacity: 19079,
      teams: ['Los Angeles Lakers', 'Los Angeles Clippers', 'Los Angeles Kings'],
      sports: ['Basketball', 'Hockey'],
      latitude: 34.0430,
      longitude: -118.2673
    },
    {
      id: 'v10',
      name: 'Wrigley Field',
      city: 'Chicago',
      state: 'Illinois',
      country: 'United States',
      capacity: 41649,
      teams: ['Chicago Cubs'],
      sports: ['Baseball'],
      latitude: 41.9484,
      longitude: -87.6553
    }
  ];
  
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
   * Maximum number of retry attempts for API calls
   */
  private readonly MAX_RETRY_ATTEMPTS = 3;
  
  /**
   * Delay between retry attempts in milliseconds
   */
  private readonly RETRY_DELAY = 1000;
  
  /**
   * Get all venues with retry mechanism and improved caching
   * @param useCache Whether to use cached venues if available
   * @returns Array of venues
   */
  async getAllVenues(useCache = true): Promise<Venue[]> {
    try {
      // Use the cache service to get venues
      if (useCache) {
        const cachedVenues = await cacheService.getVenues();
        if (cachedVenues) {
          console.log('Using cached venues data');
          return cachedVenues;
        }
      }
      
      // If no API key, use mock data
      if (!isApiKeyConfigured('SPORTS_DATA_API_KEY')) {
        console.log('No Sports Data API key available, using mock venue data');
        analyticsService.trackEvent('venue_service_fallback', { reason: 'missing_api_key' });
        
        // Cache the mock venues
        await cacheService.cacheVenues(this.mockVenues);
        return this.mockVenues;
      }
      
      // Define the fetch function for venues
      const fetchVenues = async (): Promise<Venue[]> => {
        // Try to fetch venues from API with retry mechanism
        let venues: Venue[] | null = null;
        let attempts = 0;
        
        while (venues === null && attempts < this.MAX_RETRY_ATTEMPTS) {
          try {
            attempts++;
            
            // Track API call attempt
            analyticsService.trackEvent('venue_api_call', {
              attempt: attempts,
              max_attempts: this.MAX_RETRY_ATTEMPTS
            });
            
            // Attempt to fetch venues from the API
            const response = await axios.get(`${API_BASE_URLS.SPORTS_DATA_API}/mlb/scores/json/Stadiums`, {
              params: {
                key: this.apiKey
              },
              timeout: 10000 // 10 second timeout
            });
            
            if (response.status === 200 && Array.isArray(response.data)) {
              // Transform API response to our venue format
              venues = response.data.map((stadium: any) => ({
                id: stadium.StadiumID.toString(),
                name: stadium.Name,
                city: stadium.City,
                state: stadium.State,
                country: stadium.Country,
                capacity: stadium.Capacity || 0,
                teams: [stadium.TeamName].filter(Boolean),
                sports: ['Baseball'],
                latitude: stadium.GeoLat,
                longitude: stadium.GeoLong,
                address: stadium.Address,
                yearBuilt: stadium.Opened,
                hasRoof: stadium.Type?.toLowerCase().includes('dome') || stadium.Type?.toLowerCase().includes('roof')
              }));
              
              // Track successful API call
              analyticsService.trackEvent('venue_api_success', {
                attempt: attempts,
                venue_count: venues.length
              });
            } else {
              throw new Error(`Invalid response: ${response.status}`);
            }
          } catch (apiError) {
            const error = apiError as AxiosError;
            console.error(`Error fetching venues from API (attempt ${attempts}/${this.MAX_RETRY_ATTEMPTS}):`, error.message);
            
            // Track API error
            analyticsService.trackEvent('venue_api_error', {
              attempt: attempts,
              error: error.message,
              status: error.response?.status,
              code: error.code
            });
            
            // If we haven't reached max attempts, wait before retrying
            if (attempts < this.MAX_RETRY_ATTEMPTS) {
              await new Promise<void>((resolve) => {
                setTimeout(resolve, this.RETRY_DELAY * attempts);
              });
            }
          }
        }
        
        // If we successfully got venues from the API, return them
        if (venues) {
          return venues;
        }
        
        // If all API calls failed, use mock data
        console.log('All API attempts failed, using mock venue data as fallback');
        analyticsService.trackEvent('venue_service_fallback', { reason: 'api_failure' });
        return this.mockVenues;
      };
      
      // Use the cache service to get or fetch venues
      const venues = await cacheService.get<Venue[]>('venues', fetchVenues);
      
      // Cache the venues for future use
      await cacheService.cacheVenues(venues);
      
      return venues;
    } catch (error) {
      console.error('Error getting venues:', error);
      analyticsService.trackError(error as Error, { method: 'getAllVenues' });
      return this.mockVenues; // Fallback to mock data
    }
  }
  
  /**
   * Get venues near a specific location
   * @param location User's location
   * @param maxDistance Maximum distance in kilometers (default: 50)
   * @param limit Maximum number of venues to return (default: 5)
   * @returns Array of nearby venues with distance information
   */
  async getNearbyVenues(
    location: LocationData | null = null, 
    maxDistance = 50, 
    limit = 5
  ): Promise<Venue[]> {
    try {
      // If no location provided, get the user's location
      const userLocation = location || await geolocationService.getUserLocation();
      
      if (!userLocation) {
        throw new Error('No location data available');
      }
      
      // Get all venues
      const allVenues = await this.getAllVenues();
      
      // Calculate distance for each venue and filter by maxDistance
      const venuesWithDistance = allVenues.map(venue => {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          venue.latitude,
          venue.longitude
        );
        
        return {
          ...venue,
          distance
        };
      })
      .filter(venue => venue.distance <= maxDistance)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
      
      return venuesWithDistance;
    } catch (error) {
      console.error('Error getting nearby venues:', error);
      return [];
    }
  }
  
  /**
   * Get venues for specific teams
   * @param teamNames Array of team names
   * @returns Array of venues for the specified teams
   */
  async getVenuesForTeams(teamNames: string[]): Promise<Venue[]> {
    try {
      const allVenues = await this.getAllVenues();
      
      // Filter venues by team names
      const teamVenues = allVenues.filter(venue => 
        venue.teams.some(team => teamNames.includes(team))
      );
      
      return teamVenues;
    } catch (error) {
      console.error('Error getting venues for teams:', error);
      return [];
    }
  }
  
  /**
   * Get venues for a specific sport
   * @param sport Sport name
   * @returns Array of venues for the specified sport
   */
  async getVenuesForSport(sport: string): Promise<Venue[]> {
    try {
      const allVenues = await this.getAllVenues();
      
      // Filter venues by sport
      const sportVenues = allVenues.filter(venue => 
        venue.sports.includes(sport)
      );
      
      return sportVenues;
    } catch (error) {
      console.error('Error getting venues for sport:', error);
      return [];
    }
  }
  
  /**
   * Filter venues based on various criteria
   * @param options Filter options
   * @param location User location (for distance calculation)
   * @returns Array of filtered venues
   */
  async filterVenues(options: VenueFilterOptions, location?: LocationData): Promise<Venue[]> {
    try {
      // Get all venues
      let venues = await this.getAllVenues();
      
      // If location is provided, calculate distances
      if (location) {
        venues = venues.map(venue => ({
          ...venue,
          distance: this.calculateDistance(
            location.latitude,
            location.longitude,
            venue.latitude,
            venue.longitude
          )
        }));
      }
      
      // Apply filters
      if (options.sports && options.sports.length > 0) {
        venues = venues.filter(venue =>
          venue.sports.some(sport => options.sports!.includes(sport))
        );
      }
      
      if (options.teams && options.teams.length > 0) {
        venues = venues.filter(venue =>
          venue.teams.some(team => options.teams!.includes(team))
        );
      }
      
      if (options.hasRoof !== undefined) {
        venues = venues.filter(venue => venue.hasRoof === options.hasRoof);
      }
      
      if (options.capacity) {
        if (options.capacity.min !== undefined) {
          venues = venues.filter(venue => venue.capacity >= options.capacity!.min!);
        }
        if (options.capacity.max !== undefined) {
          venues = venues.filter(venue => venue.capacity <= options.capacity!.max!);
        }
      }
      
      if (options.distance !== undefined && location) {
        venues = venues.filter(venue =>
          (venue.distance || Infinity) <= options.distance!
        );
      }
      
      // Apply sorting
      if (options.sortBy) {
        const direction = options.sortDirection === 'desc' ? -1 : 1;
        
        venues.sort((a, b) => {
          switch (options.sortBy) {
            case 'distance':
              return direction * ((a.distance || Infinity) - (b.distance || Infinity));
            case 'capacity':
              return direction * (a.capacity - b.capacity);
            case 'name':
              return direction * a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });
      }
      
      return venues;
    } catch (error) {
      console.error('Error filtering venues:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming events at a venue
   * @param venueId Venue ID
   * @returns Array of upcoming events
   */
  async getUpcomingEvents(venueId: string): Promise<VenueEvent[]> {
    try {
      // In a real implementation, this would fetch from an API
      // For now, return mock data
      return [
        {
          id: `event-${venueId}-1`,
          name: 'Regular Season Game',
          date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
          type: 'Game',
          teams: ['Home Team', 'Away Team'],
          ticketUrl: 'https://ticketmaster.com'
        },
        {
          id: `event-${venueId}-2`,
          name: 'Concert Event',
          date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
          type: 'Concert',
          ticketUrl: 'https://ticketmaster.com'
        }
      ];
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }
  
  /**
   * Clear cached venues
   */
  clearCache(): void {
    this.cachedVenues = null;
    this.lastVenueUpdate = 0;
    console.log('Venue cache cleared');
  }
}

export const venueService = new VenueService();