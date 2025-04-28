/**
 * FanDuel Cookie Service
 * 
 * This service manages cookies for FanDuel integration to ensure a seamless user experience
 * when transitioning from the AI Sports Edge app to the FanDuel app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';
import { FANDUEL_CONFIG } from '../config/affiliateConfig';

// Storage keys
const STORAGE_KEYS = {
  FANDUEL_COOKIES: 'fanduel_cookies',
  LAST_INTERACTION: 'fanduel_last_interaction',
  CONVERSION_TRACKING: 'fanduel_conversion_tracking',
};

class FanduelCookieService {
  /**
   * Initialize cookies for FanDuel integration
   * @param {string} userId User ID
   * @param {string} gameId Game ID
   * @param {string} teamId Team ID
   * @returns {Promise<boolean>} Success status
   */
  async initializeCookies(userId, gameId, teamId) {
    try {
      // Create cookie data
      const cookieData = {
        userId,
        gameId,
        teamId,
        affiliateId: FANDUEL_CONFIG.AFFILIATE_ID,
        timestamp: Date.now(),
        platform: Platform.OS,
        source: 'ai-sports-edge',
      };
      
      // Store cookie data
      await AsyncStorage.setItem(STORAGE_KEYS.FANDUEL_COOKIES, JSON.stringify(cookieData));
      
      // Track initialization
      analyticsService.trackEvent('fanduel_cookies_initialized', {
        userId,
        gameId,
        teamId,
        timestamp: Date.now(),
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing FanDuel cookies:', error);
      return false;
    }
  }
  
  /**
   * Get stored cookie data
   * @returns {Promise<Object|null>} Cookie data or null if not found
   */
  async getCookieData() {
    try {
      const cookieData = await AsyncStorage.getItem(STORAGE_KEYS.FANDUEL_COOKIES);
      return cookieData ? JSON.parse(cookieData) : null;
    } catch (error) {
      console.error('Error getting FanDuel cookie data:', error);
      return null;
    }
  }
  
  /**
   * Track user interaction with FanDuel
   * @param {string} interactionType Type of interaction
   * @param {Object} additionalData Additional data to track
   * @returns {Promise<boolean>} Success status
   */
  async trackInteraction(interactionType, additionalData = {}) {
    try {
      // Get existing cookie data
      const cookieData = await this.getCookieData();
      if (!cookieData) {
        return false;
      }
      
      // Create interaction data
      const interactionData = {
        interactionType,
        timestamp: Date.now(),
        cookieData,
        ...additionalData,
      };
      
      // Store last interaction
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_INTERACTION, JSON.stringify(interactionData));
      
      // Track interaction
      analyticsService.trackEvent('fanduel_interaction', interactionData);
      
      return true;
    } catch (error) {
      console.error('Error tracking FanDuel interaction:', error);
      return false;
    }
  }
  
  /**
   * Generate URL with cookie parameters
   * @param {string} baseUrl Base URL
   * @returns {Promise<string>} URL with cookie parameters
   */
  async generateUrlWithCookies(baseUrl) {
    try {
      // Get cookie data
      const cookieData = await this.getCookieData();
      if (!cookieData) {
        return baseUrl;
      }
      
      // Add cookie parameters to URL
      const url = new URL(baseUrl);
      
      // Add affiliate ID
      url.searchParams.append('aff_id', cookieData.affiliateId);
      
      // Add user ID and game ID as subId
      const subId = [cookieData.userId, cookieData.gameId].filter(Boolean).join('-');
      if (subId) {
        url.searchParams.append('subId', subId);
      }
      
      // Add team ID
      if (cookieData.teamId) {
        url.searchParams.append('team', cookieData.teamId);
      }
      
      // Add tracking parameters
      url.searchParams.append('utm_source', 'aisportsedge');
      url.searchParams.append('utm_medium', 'affiliate');
      url.searchParams.append('utm_campaign', 'betbutton');
      url.searchParams.append('utm_content', Platform.OS);
      
      // Add cookie flag
      url.searchParams.append('cookie_enabled', 'true');
      
      // Track URL generation
      this.trackInteraction('url_generated', { url: url.toString() });
      
      return url.toString();
    } catch (error) {
      console.error('Error generating URL with cookies:', error);
      return baseUrl;
    }
  }
  
  /**
   * Track conversion from AI Sports Edge to FanDuel
   * @param {string} conversionType Type of conversion
   * @param {number} conversionValue Value of conversion
   * @returns {Promise<boolean>} Success status
   */
  async trackConversion(conversionType, conversionValue = 0) {
    try {
      // Get cookie data
      const cookieData = await this.getCookieData();
      if (!cookieData) {
        return false;
      }
      
      // Create conversion data
      const conversionData = {
        conversionType,
        conversionValue,
        timestamp: Date.now(),
        cookieData,
      };
      
      // Get existing conversion tracking
      const existingTrackingJson = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSION_TRACKING);
      const existingTracking = existingTrackingJson ? JSON.parse(existingTrackingJson) : [];
      
      // Add new conversion
      existingTracking.push(conversionData);
      
      // Store updated conversion tracking
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSION_TRACKING, JSON.stringify(existingTracking));
      
      // Track conversion
      analyticsService.trackEvent('fanduel_conversion', conversionData);
      
      return true;
    } catch (error) {
      console.error('Error tracking FanDuel conversion:', error);
      return false;
    }
  }
  
  /**
   * Clear cookies
   * @returns {Promise<boolean>} Success status
   */
  async clearCookies() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.FANDUEL_COOKIES);
      return true;
    } catch (error) {
      console.error('Error clearing FanDuel cookies:', error);
      return false;
    }
  }
}

export const fanduelCookieService = new FanduelCookieService();