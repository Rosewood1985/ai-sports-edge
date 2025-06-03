/**
 * Platform-specific GeoIP service
 * This file provides different implementations for web and Node.js environments
 */

// Web fallback service
const webGeoipService = {
  initialized: true,

  initialize: async () => true,

  isInitialized: () => true,

  getLocationFromIP: async ipAddress => ({
    city: 'Unknown',
    state: 'Unknown',
    country: 'Unknown',
    latitude: 0,
    longitude: 0,
    timezone:
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Unknown',
    postalCode: 'Unknown',
    ipAddress: ipAddress || 'Unknown',
    accuracy: 0,
    source: 'web-fallback',
  }),

  getClientIP: () => null,

  getLocationFromRequest: async () => ({
    city: 'Unknown',
    state: 'Unknown',
    country: 'Unknown',
    latitude: 0,
    longitude: 0,
    timezone:
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Unknown',
    postalCode: 'Unknown',
    ipAddress: 'Unknown',
    accuracy: 0,
    source: 'web-fallback',
  }),
};

// Check if we're in a web environment
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Export the web service for web environments
if (isWeb) {
  // This will be tree-shaken away in Node.js environments
  module.exports = webGeoipService;
}
// For Node.js environments, this code will be executed
else {
  try {
    // Try to load the Node.js implementation
    const fs = require('fs');
    const path = require('path');
    let requestIp, geoip2;

    try {
      requestIp = require('request-ip');
      geoip2 = require('@maxmind/geoip2-node');
    } catch (moduleError) {
      console.log('GeoIP dependencies not available, falling back to web service');
      throw moduleError;
    }

    /**
     * GeoIP service for getting location data based on IP address
     */
    class NodeGeoIPService {
      constructor() {
        // Set the path to the GeoLite2-City.mmdb database
        this.dbPath = path.resolve(__dirname, 'GeoLite2-City.mmdb');
        this.reader = null;
        this.initialized = false;
      }

      /**
       * Initialize the GeoIP service
       * @returns {Promise<boolean>} True if initialization was successful
       */
      async initialize() {
        try {
          if (this.initialized) {
            return true;
          }

          // Check if the database file exists
          if (!fs.existsSync(this.dbPath)) {
            console.error(`GeoIP database file not found at ${this.dbPath}`);
            return false;
          }

          // Read the database file
          const dbBuffer = fs.readFileSync(this.dbPath);

          // Create the reader
          this.reader = geoip2.Reader.openBuffer(dbBuffer);
          this.initialized = true;

          console.log('GeoIP service initialized successfully');
          return true;
        } catch (error) {
          console.error('Error initializing GeoIP service:', error);
          return false;
        }
      }

      /**
       * Check if the service is initialized
       * @returns {boolean} True if initialized
       */
      isInitialized() {
        return this.initialized;
      }

      /**
       * Get location data from an IP address
       * @param {string} ipAddress - IP address to look up
       * @returns {Promise<Object | null>} Location data
       */
      async getLocationFromIP(ipAddress) {
        try {
          if (!this.initialized || !this.reader) {
            const success = await this.initialize();
            if (!success) {
              return null;
            }
          }

          // Look up the IP address
          const response = this.reader.city(ipAddress);

          // Extract the location data
          const locationData = {
            city: response.city?.names?.en || 'Unknown',
            state: response.subdivisions?.[0]?.names?.en || 'Unknown',
            country: response.country?.names?.en || 'Unknown',
            latitude: response.location?.latitude || 0,
            longitude: response.location?.longitude || 0,
            timezone: response.location?.timeZone || 'Unknown',
            postalCode: response.postal?.code || 'Unknown',
            ipAddress,
            accuracy: response.location?.accuracyRadius || 0,
          };

          return locationData;
        } catch (error) {
          console.error('Error getting location from IP:', error);
          return null;
        }
      }

      /**
       * Get client IP address from request
       * @param {Object} req - Express request object
       * @returns {string | null} Client IP address
       */
      getClientIP(req) {
        try {
          return requestIp.getClientIp(req);
        } catch (error) {
          console.error('Error getting client IP:', error);
          return null;
        }
      }

      /**
       * Get location data from request
       * @param {Object} req - Express request object
       * @returns {Promise<Object | null>} Location data
       */
      async getLocationFromRequest(req) {
        try {
          const clientIp = this.getClientIP(req);

          if (!clientIp) {
            console.error('Could not determine client IP address');
            return null;
          }

          return this.getLocationFromIP(clientIp);
        } catch (error) {
          console.error('Error getting location from request:', error);
          return null;
        }
      }
    }

    const nodeGeoipService = new NodeGeoIPService();
    module.exports = nodeGeoipService;
  } catch (error) {
    console.error('Error loading Node.js GeoIP service:', error);
    // Fallback to a simple service if Node.js modules can't be loaded
    module.exports = {
      initialized: false,
      initialize: async () => false,
      isInitialized: () => false,
      getLocationFromIP: async () => null,
      getClientIP: () => null,
      getLocationFromRequest: async () => null,
    };
  }
}
