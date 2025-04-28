/**
 * GeoIP service for web environments
 * This is a browser-compatible version that provides fallback functionality
 */

// Web fallback service
const webGeoipService = {
  initialized: true,
  
  initialize: async () => true,
  
  isInitialized: () => true,
  
  getLocationFromIP: async (ipAddress) => ({
    city: 'Unknown',
    state: 'Unknown',
    country: 'Unknown',
    latitude: 0,
    longitude: 0,
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Unknown',
    postalCode: 'Unknown',
    ipAddress: ipAddress || 'Unknown',
    accuracy: 0,
    source: 'web-fallback'
  }),
  
  getClientIP: () => null,
  
  getLocationFromRequest: async () => ({
    city: 'Unknown',
    state: 'Unknown',
    country: 'Unknown',
    latitude: 0,
    longitude: 0,
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Unknown',
    postalCode: 'Unknown',
    ipAddress: 'Unknown',
    accuracy: 0,
    source: 'web-fallback'
  })
};

export default webGeoipService;