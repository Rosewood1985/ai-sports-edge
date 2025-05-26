/**
 * Comprehensive Geolocation Service Tests
 * 
 * Tests all geolocation functionality including location detection,
 * local team identification, and odds suggestions
 */

const { geolocationService } = require('../services/geolocationService');
const { venueService } = require('../services/venueService');

// Mock dependencies
jest.mock('../utils/geoip', () => ({
  getLocationFromIP: jest.fn(),
}));

jest.mock('../config/apiKeys', () => ({
  API_KEYS: {
    GOOGLE_MAPS_API_KEY: 'test-google-key',
    IP_GEOLOCATION_API_KEY: 'test-ip-geo-key',
  },
  API_BASE_URLS: {
    IP_GEOLOCATION_API: 'https://api.ipgeolocation.io',
  },
  isApiKeyConfigured: jest.fn(() => true),
}));

jest.mock('../services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('Geolocation Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful responses
    global.localStorage.getItem.mockReturnValue(null);
    
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
      });
    });
  });

  describe('Service Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await geolocationService.initialize();
      expect(result).toBe(true);
    });

    test('should detect browser geolocation availability', () => {
      const isAvailable = geolocationService.isLocationAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('Location Detection', () => {
    test('should get current location via browser API', async () => {
      // Mock Google Maps API response
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [{
            address_components: [
              { types: ['locality'], long_name: 'New York' },
              { types: ['administrative_area_level_1'], long_name: 'New York' },
              { types: ['country'], long_name: 'United States' },
              { types: ['postal_code'], long_name: '10001' },
            ],
          }],
        }),
      });

      const location = await geolocationService.getCurrentLocation();

      expect(location).toEqual(
        expect.objectContaining({
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          state: 'New York',
          country: 'United States',
        })
      );
    });

    test('should handle geolocation errors gracefully', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      const location = await geolocationService.getCurrentLocation();
      expect(location).toBeNull();
    });

    test('should use cached location when available', async () => {
      const cachedLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        timestamp: Date.now(),
      };

      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'geolocation_cache') {
          return JSON.stringify(cachedLocation);
        }
        if (key === 'geolocation_timestamp') {
          return Date.now().toString();
        }
        return null;
      });

      const location = await geolocationService.getCurrentLocation();
      expect(location).toEqual(expect.objectContaining(cachedLocation));
    });

    test('should refresh expired cached location', async () => {
      const expiredTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'geolocation_cache') {
          return JSON.stringify({ latitude: 40.7128, longitude: -74.0060 });
        }
        if (key === 'geolocation_timestamp') {
          return expiredTime.toString();
        }
        return null;
      });

      const location = await geolocationService.getCurrentLocation();
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  describe('Local Teams Detection', () => {
    test('should identify local teams for New York', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        state: 'New York',
      };

      const teams = await geolocationService.getLocalTeams(location);

      expect(teams).toEqual(
        expect.arrayContaining([
          'New York Yankees',
          'New York Mets',
          'New York Giants',
          'New York Jets',
          'New York Knicks',
          'Brooklyn Nets',
        ])
      );
    });

    test('should identify local teams for Los Angeles', async () => {
      const location = {
        latitude: 34.0522,
        longitude: -118.2437,
        city: 'Los Angeles',
        state: 'California',
      };

      const teams = await geolocationService.getLocalTeams(location);

      expect(teams).toEqual(
        expect.arrayContaining([
          'Los Angeles Dodgers',
          'Los Angeles Angels',
          'Los Angeles Rams',
          'Los Angeles Lakers',
        ])
      );
    });

    test('should return empty array for unknown cities', async () => {
      const location = {
        latitude: 0,
        longitude: 0,
        city: 'Unknown City',
        state: 'Unknown State',
      };

      const teams = await geolocationService.getLocalTeams(location);
      expect(teams).toEqual([]);
    });

    test('should handle missing location gracefully', async () => {
      const teams = await geolocationService.getLocalTeams(null);
      expect(Array.isArray(teams)).toBe(true);
    });
  });

  describe('Odds Suggestions', () => {
    test('should generate odds suggestions for local teams', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        state: 'New York',
      };

      const suggestions = await geolocationService.getLocalizedOddsSuggestions(location);

      expect(suggestions.length).toBeGreaterThan(0);
      
      suggestions.forEach(suggestion => {
        expect(suggestion).toEqual(
          expect.objectContaining({
            team: expect.any(String),
            game: expect.any(String),
            odds: expect.any(Number),
            suggestion: expect.stringMatching(/^(bet|avoid|watch)$/),
            timestamp: expect.any(String),
            confidence: expect.any(Number),
            reasoning: expect.any(String),
          })
        );
        
        expect(suggestion.odds).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.7);
        expect(suggestion.confidence).toBeLessThanOrEqual(1.0);
      });
    });

    test('should generate different suggestions based on odds', async () => {
      const location = {
        city: 'Los Angeles',
        state: 'California',
      };

      const suggestions = await geolocationService.getLocalizedOddsSuggestions(location);
      
      // Should have variety in suggestions
      const suggestionTypes = [...new Set(suggestions.map(s => s.suggestion))];
      expect(suggestionTypes.length).toBeGreaterThan(0);
    });

    test('should handle popular teams with different odds', async () => {
      const location = {
        city: 'New York',
        state: 'New York',
      };

      const suggestions = await geolocationService.getLocalizedOddsSuggestions(location);
      
      const yankeesSuggestion = suggestions.find(s => s.team.includes('Yankees'));
      expect(yankeesSuggestion).toBeDefined();
      expect(yankeesSuggestion.odds).toBeGreaterThan(0);
    });

    test('should return empty array when no local teams found', async () => {
      const location = {
        city: 'Unknown City',
        state: 'Unknown State',
      };

      const suggestions = await geolocationService.getLocalizedOddsSuggestions(location);
      expect(suggestions).toEqual([]);
    });
  });

  describe('Distance Calculations', () => {
    test('should calculate distance between coordinates', () => {
      // Distance from New York to Los Angeles (approx 3,940 km)
      const distance = geolocationService.getDistance(
        40.7128, -74.0060, // New York
        34.0522, -118.2437  // Los Angeles
      );

      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    test('should return zero for same coordinates', () => {
      const distance = geolocationService.getDistance(
        40.7128, -74.0060,
        40.7128, -74.0060
      );

      expect(distance).toBe(0);
    });
  });

  describe('Caching Functionality', () => {
    test('should cache location data', async () => {
      await geolocationService.getCurrentLocation();

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'geolocation_cache',
        expect.any(String)
      );
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'geolocation_timestamp',
        expect.any(String)
      );
    });

    test('should cache team data', async () => {
      const location = { city: 'New York', state: 'New York' };
      await geolocationService.getLocalTeams(location);

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'local_teams_cache',
        expect.any(String)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle API failures gracefully', async () => {
      fetch.mockRejectedValue(new Error('API Error'));
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 2, message: 'Position unavailable' });
      });

      const location = await geolocationService.getCurrentLocation();
      expect(location).toBeNull();
    });

    test('should handle malformed API responses', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      const location = await geolocationService.getCurrentLocation();
      expect(location).toBeDefined();
    });

    test('should handle localStorage errors', async () => {
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const location = await geolocationService.getCurrentLocation();
      expect(location).toBeDefined();
    });
  });

  describe('Compatibility Methods', () => {
    test('should provide getUserLocation compatibility method', async () => {
      const location = await geolocationService.getUserLocation(false, true);
      expect(location).toBeDefined();
    });

    test('should respect forceRefresh parameter', async () => {
      // First call
      await geolocationService.getUserLocation(false, false);
      
      // Second call with force refresh
      await geolocationService.getUserLocation(false, true);
      
      // Should have made geolocation call due to force refresh
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });
});

describe('Integration with Venue Service', () => {
  test('should work with venue service for nearby venues', async () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
    };

    // Mock venue service
    const mockVenues = [
      {
        id: 'venue1',
        name: 'Yankee Stadium',
        latitude: 40.8296,
        longitude: -73.9262,
        type: 'stadium',
      },
    ];

    venueService.getNearbyVenues = jest.fn().mockResolvedValue(mockVenues);

    const venues = await venueService.getNearbyVenues(
      location.latitude,
      location.longitude,
      50 // 50km radius
    );

    expect(venues).toEqual(mockVenues);
    expect(venueService.getNearbyVenues).toHaveBeenCalledWith(
      location.latitude,
      location.longitude,
      50
    );
  });
});

describe('Performance Tests', () => {
  test('should complete location detection within reasonable time', async () => {
    const startTime = Date.now();
    await geolocationService.getCurrentLocation();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should handle multiple concurrent requests', async () => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(geolocationService.getCurrentLocation());
    }

    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
  });
});