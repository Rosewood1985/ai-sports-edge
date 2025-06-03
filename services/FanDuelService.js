/**
 * FanDuelService.js
 * Service for FanDuel integration and affiliate linking
 */

import apiKeys from '../utils/apiKeys';

/**
 * FanDuelService class for FanDuel integration and affiliate linking
 */
class FanDuelService {
  constructor() {
    // FanDuel affiliate configuration
    this.config = {
      affiliateId: apiKeys.getFanDuelAffiliateId(),
      baseUrl: 'https://account.sportsbook.fanduel.com/join',
      deepLinkBaseUrl: 'https://sportsbook.fanduel.com/navigation',
      mobileAppScheme: 'fanduel://',
      trackingParams: {
        utm_source: 'ai_sports_edge',
        utm_medium: 'affiliate',
        utm_campaign: 'sports_odds',
      },
    };
  }

  /**
   * Generate a FanDuel affiliate link
   * @param {Object} options - Options for the affiliate link
   * @param {string} options.sport - Sport key (e.g., 'nba', 'ncaab', 'f1')
   * @param {string} options.betType - Bet type (e.g., 'moneyline', 'spread', 'total')
   * @param {string} options.campaignId - Campaign ID for tracking
   * @returns {string} FanDuel affiliate link
   */
  generateAffiliateLink(options = {}) {
    const { sport, betType, campaignId } = options;

    // Build tracking parameters
    const trackingParams = {
      ...this.config.trackingParams,
      ...(campaignId && { utm_campaign: campaignId }),
      ...(sport && { utm_content: sport }),
      ...(betType && { utm_term: betType }),
    };

    // Convert tracking parameters to URL query string
    const queryParams = Object.entries(trackingParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // Build the affiliate link
    return `${this.config.baseUrl}?${queryParams}&pid=${this.config.affiliateId}`;
  }

  /**
   * Generate a deep link to a specific bet on FanDuel
   * @param {Object} options - Options for the deep link
   * @param {string} options.sport - Sport key (e.g., 'nba', 'ncaab', 'f1')
   * @param {string} options.eventId - Event ID
   * @param {string} options.betType - Bet type (e.g., 'moneyline', 'spread', 'total')
   * @param {string} options.team - Team or player name
   * @param {string} options.campaignId - Campaign ID for tracking
   * @returns {string} FanDuel deep link
   */
  generateDeepLink(options = {}) {
    const { sport, eventId, betType, team, campaignId } = options;

    // Map our sport keys to FanDuel sport paths
    const sportPathMap = {
      nba: 'basketball/nba',
      wnba: 'basketball/wnba',
      ncaab: 'basketball/college-basketball',
      ncaaw: 'basketball/college-basketball',
      f1: 'motor-racing/formula-1',
    };

    // Map our bet types to FanDuel bet type paths
    const betTypePathMap = {
      moneyline: 'moneyline',
      spread: 'spread',
      total: 'total',
      'player-prop': 'player-props',
      'race-winner': 'race-winner',
    };

    // Build the path for the deep link
    let path = sportPathMap[sport.toLowerCase()] || sport.toLowerCase();

    if (eventId) {
      path += `/${eventId}`;
    }

    if (betType && betTypePathMap[betType.toLowerCase()]) {
      path += `/${betTypePathMap[betType.toLowerCase()]}`;
    }

    // Build tracking parameters
    const trackingParams = {
      ...this.config.trackingParams,
      ...(campaignId && { utm_campaign: campaignId }),
      ...(sport && { utm_content: sport }),
      ...(betType && { utm_term: betType }),
      ...(team && { team }),
    };

    // Convert tracking parameters to URL query string
    const queryParams = Object.entries(trackingParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // Build the deep link
    return `${this.config.deepLinkBaseUrl}/${path}?${queryParams}&pid=${this.config.affiliateId}`;
  }

  /**
   * Generate a mobile app deep link
   * @param {Object} options - Options for the mobile app deep link
   * @param {string} options.sport - Sport key (e.g., 'nba', 'ncaab', 'f1')
   * @param {string} options.eventId - Event ID
   * @param {string} options.betType - Bet type (e.g., 'moneyline', 'spread', 'total')
   * @returns {string} FanDuel mobile app deep link
   */
  generateMobileAppDeepLink(options = {}) {
    const { sport, eventId, betType } = options;

    // Build the path for the deep link
    let path = sport.toLowerCase();

    if (eventId) {
      path += `/${eventId}`;
    }

    if (betType) {
      path += `/${betType.toLowerCase()}`;
    }

    // Build the mobile app deep link
    return `${this.config.mobileAppScheme}${path}`;
  }

  /**
   * Generate a universal link that works for both web and mobile app
   * @param {Object} options - Options for the universal link
   * @returns {Object} Universal link object with web and app links
   */
  generateUniversalLink(options = {}) {
    return {
      webUrl: this.generateDeepLink(options),
      appUrl: this.generateMobileAppDeepLink(options),
      fallbackUrl: this.generateAffiliateLink(options),
    };
  }

  /**
   * Track a conversion
   * @param {Object} data - Conversion data
   * @param {string} data.userId - User ID
   * @param {string} data.eventType - Event type (e.g., 'click', 'signup', 'deposit')
   * @param {string} data.source - Traffic source
   * @param {number} data.value - Conversion value
   * @returns {Promise<Object>} Tracking result
   */
  async trackConversion(data = {}) {
    try {
      // Make an API call to FanDuel's conversion tracking API
      console.log('Tracking conversion:', data);

      // Implement real API call to FanDuel's tracking endpoint
      const response = await fetch('https://affiliates.fanduel.com/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeys.getFanDuelApiKey()}`,
        },
        body: JSON.stringify({
          userId: data.userId,
          eventType: data.eventType,
          source: data.source || 'ai_sports_edge',
          value: data.value || 0,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`FanDuel API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error tracking conversion:', error);
      throw error;
    }
  }
}

// Export singleton instance
const fanDuelService = new FanDuelService();
export default fanDuelService;
