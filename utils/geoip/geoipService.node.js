/**
 * GeoIP service for Node.js environments
 * This uses the MaxMind GeoIP2 database for IP geolocation
 */

const fs = require('fs');
const path = require('path');
const requestIp = require('request-ip');
const geoip2 = require('@maxmind/geoip2-node');

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
        ipAddress: ipAddress,
        accuracy: response.location?.accuracyRadius || 0
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