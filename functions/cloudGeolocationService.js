/**
 * Cloud Functions compatible Geolocation Service
 * Designed specifically for Firebase Functions environment without browser dependencies
 */

const axios = require('axios');

class CloudGeolocationService {
  constructor() {
    this.initialized = true;
    this.apiKey = process.env.IPGEOLOCATION_API_KEY;
    this.baseUrl = 'https://api.ipgeolocation.io/ipgeo';
  }

  /**
   * Initialize the service (no-op for cloud functions)
   */
  async initialize() {
    return true;
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Extract client IP from Firebase Functions request
   * @param {Object} req - Firebase Functions request object
   * @returns {string|null} Client IP address
   */
  getClientIP(req) {
    try {
      // Try various headers that might contain the real IP
      const possibleHeaders = [
        'x-forwarded-for',
        'x-real-ip',
        'x-client-ip',
        'cf-connecting-ip', // Cloudflare
        'x-cluster-client-ip',
        'x-forwarded',
        'forwarded-for',
        'forwarded'
      ];

      for (const header of possibleHeaders) {
        const headerValue = req.get(header);
        if (headerValue) {
          // x-forwarded-for can contain multiple IPs, take the first one
          const ip = headerValue.split(',')[0].trim();
          if (this.isValidIP(ip)) {
            return ip;
          }
        }
      }

      // Fallback to connection remote address
      if (req.connection && req.connection.remoteAddress) {
        return req.connection.remoteAddress;
      }

      // Firebase Functions specific
      if (req.ip) {
        return req.ip;
      }

      return null;
    } catch (error) {
      console.error('Error extracting client IP:', error);
      return null;
    }
  }

  /**
   * Validate IP address format
   * @param {string} ip - IP address to validate
   * @returns {boolean} True if valid IP
   */
  isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Get location data from IP address using external API
   * @param {string} ipAddress - IP address to look up
   * @returns {Promise<Object|null>} Location data
   */
  async getLocationFromIP(ipAddress) {
    try {
      if (!ipAddress || !this.isValidIP(ipAddress)) {
        console.warn('Invalid IP address provided:', ipAddress);
        return this.getDefaultLocation();
      }

      // Skip private/local IPs
      if (this.isPrivateIP(ipAddress)) {
        console.log('Private IP detected, returning default location');
        return this.getDefaultLocation();
      }

      const url = `${this.baseUrl}?apiKey=${this.apiKey}&ip=${ipAddress}`;
      
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'AI-Sports-Edge/1.0'
        }
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        
        return {
          city: data.city || 'Unknown',
          state: data.state_prov || 'Unknown',
          country: data.country_name || 'Unknown',
          latitude: parseFloat(data.latitude) || 0,
          longitude: parseFloat(data.longitude) || 0,
          timezone: data.time_zone?.name || 'Unknown',
          postalCode: data.zipcode || 'Unknown',
          ipAddress: ipAddress,
          accuracy: data.accuracy || 0,
          source: 'ipgeolocation-api'
        };
      }

      throw new Error('Invalid API response');
    } catch (error) {
      console.error('Error getting location from IP:', error.message);
      return this.getDefaultLocation(ipAddress);
    }
  }

  /**
   * Check if IP is private/local
   * @param {string} ip - IP address to check
   * @returns {boolean} True if private IP
   */
  isPrivateIP(ip) {
    if (!ip) return true;
    
    // Private IP ranges
    const privateRanges = [
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^127\./, // 127.0.0.0/8 (localhost)
      /^169\.254\./, // 169.254.0.0/16 (link-local)
      /^::1$/, // IPv6 localhost
      /^fc00:/, // IPv6 private
      /^fe80:/ // IPv6 link-local
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Get location data from Firebase Functions request
   * @param {Object} req - Firebase Functions request object
   * @returns {Promise<Object>} Location data
   */
  async getLocationFromRequest(req) {
    try {
      const clientIp = this.getClientIP(req);
      
      if (!clientIp) {
        console.warn('Could not determine client IP from request');
        return this.getDefaultLocation();
      }
      
      return await this.getLocationFromIP(clientIp);
    } catch (error) {
      console.error('Error getting location from request:', error);
      return this.getDefaultLocation();
    }
  }

  /**
   * Get default location data
   * @param {string} ipAddress - IP address (optional)
   * @returns {Object} Default location data
   */
  getDefaultLocation(ipAddress = 'Unknown') {
    return {
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
      postalCode: 'Unknown',
      ipAddress: ipAddress,
      accuracy: 0,
      source: 'default-fallback'
    };
  }

  /**
   * Get user's timezone from location data
   * @param {Object} locationData - Location data object
   * @returns {string} Timezone string
   */
  getTimezoneFromLocation(locationData) {
    if (locationData && locationData.timezone && locationData.timezone !== 'Unknown') {
      return locationData.timezone;
    }
    return 'UTC';
  }

  /**
   * Format location for display
   * @param {Object} locationData - Location data object
   * @returns {string} Formatted location string
   */
  formatLocationDisplay(locationData) {
    if (!locationData) return 'Unknown Location';
    
    const parts = [];
    
    if (locationData.city && locationData.city !== 'Unknown') {
      parts.push(locationData.city);
    }
    
    if (locationData.state && locationData.state !== 'Unknown') {
      parts.push(locationData.state);
    }
    
    if (locationData.country && locationData.country !== 'Unknown') {
      parts.push(locationData.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }
}

// Export singleton instance
const cloudGeolocationService = new CloudGeolocationService();
module.exports = cloudGeolocationService;