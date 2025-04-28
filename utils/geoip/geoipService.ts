import * as fs from 'fs';
import * as path from 'path';
import requestIp from 'request-ip';
import { Request } from 'express';

// Import the Reader class from @maxmind/geoip2-node
const geoip2 = require('@maxmind/geoip2-node');

/**
 * Interface for GeoIP location data
 */
export interface GeoIPLocationData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  postalCode: string;
  ipAddress: string;
  accuracy: number;
}

/**
 * GeoIP service for getting location data based on IP address
 */
class GeoIPService {
  private reader: any = null;
  private dbPath: string;
  private initialized: boolean = false;

  constructor() {
    // Set the path to the GeoLite2-City.mmdb database
    this.dbPath = path.resolve(__dirname, 'GeoLite2-City.mmdb');
  }

  /**
   * Initialize the GeoIP service
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initialize(): Promise<boolean> {
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
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get location data from an IP address
   * @param {string} ipAddress - IP address to look up
   * @returns {Promise<GeoIPLocationData | null>} Location data
   */
  async getLocationFromIP(ipAddress: string): Promise<GeoIPLocationData | null> {
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
      const locationData: GeoIPLocationData = {
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
   * @param {Request} req - Express request object
   * @returns {string | null} Client IP address
   */
  getClientIP(req: Request): string | null {
    try {
      return requestIp.getClientIp(req);
    } catch (error) {
      console.error('Error getting client IP:', error);
      return null;
    }
  }

  /**
   * Get location data from request
   * @param {Request} req - Express request object
   * @returns {Promise<GeoIPLocationData | null>} Location data
   */
  async getLocationFromRequest(req: Request): Promise<GeoIPLocationData | null> {
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

export const geoipService = new GeoIPService();
export default geoipService;