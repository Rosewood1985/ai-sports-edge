/**
 * Betting Affiliate Service
 * Handles affiliate link generation, tracking, and button visibility logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getTeamColors } from '../config/teamColors';
import { analyticsService } from './analyticsService';
import { abTestingService, ButtonVariation, ButtonSize, ButtonPosition, ButtonText } from './abTestingService';
import { gameUrlService, BettingSite } from './gameUrlService';

// Define types for button settings
export interface ButtonSettings {
  size: 'small' | 'medium' | 'large';
  animation: 'none' | 'pulse' | 'flicker' | 'surge';
  position: 'inline' | 'floating' | 'fixed';
  style: 'default' | 'team-colored';
}

// Define analytics events
export const ANALYTICS_EVENTS = {
  BUTTON_IMPRESSION: 'bet_button_impression',
  BUTTON_CLICK: 'bet_button_click',
  CONVERSION: 'bet_button_conversion',
  FAVORITE_TEAM_SELECTED: 'favorite_team_selected',
  PRIMARY_TEAM_SELECTED: 'primary_team_selected',
};

// Storage keys
const STORAGE_KEYS = {
  AFFILIATE_CODE: 'betting_affiliate_code',
  AFFILIATE_ENABLED: 'betting_affiliate_enabled',
  BUTTON_SETTINGS: 'betting_affiliate_button_settings',
  FAVORITE_TEAMS: 'favorite_teams',
  PRIMARY_TEAM: 'primary_team',
};

class BettingAffiliateService {
  /**
   * Generate affiliate link with proper parameters
   * @param baseUrl Base URL for the betting site
   * @param affiliateCode Affiliate code to include in URL
   * @param teamId Optional team ID to include in URL
   * @param userId Optional user ID for tracking
   * @param gameId Optional game ID for tracking
   * @returns Complete affiliate URL with tracking parameters
   */
  async generateAffiliateLink(baseUrl: string, affiliateCode: string, teamId?: string, userId?: string, gameId?: string): Promise<string> {
    // Try to get a specific game URL if gameId is provided
    let specificUrl = baseUrl;
    if (gameId) {
      const gameUrl = await gameUrlService.getGameUrl(gameId, BettingSite.FANDUEL);
      if (gameUrl) {
        specificUrl = gameUrl;
      }
    }
    
    // Add affiliate code
    let url = specificUrl.includes('?')
      ? `${specificUrl}&aff_id=${encodeURIComponent(affiliateCode)}`
      : `${specificUrl}?aff_id=${encodeURIComponent(affiliateCode)}`;
    
    // Add subId for tracking specific user and game
    if (userId || gameId) {
      const subId = [userId, gameId].filter(Boolean).join('-');
      if (subId) {
        url += `&subId=${encodeURIComponent(subId)}`;
      }
    }
    
    if (teamId) {
      url += `&team=${encodeURIComponent(teamId)}`;
    }
    
    // Add tracking parameters
    url += `&utm_source=aisportsedge&utm_medium=affiliate&utm_campaign=betbutton`;
    
    // Add platform info
    url += `&utm_content=${Platform.OS}`;
    
    return url;
  }
  
  /**
   * Track button impression for analytics
   * @param location Location where button was shown
   * @param teamId Optional team ID associated with the button
   * @param userId Optional user ID for tracking
   * @param gameId Optional game ID for tracking
   */
  trackButtonImpression(location: string, teamId?: string, userId?: string, gameId?: string): void {
    // Track the event using the analytics service
    analyticsService.trackEvent(ANALYTICS_EVENTS.BUTTON_IMPRESSION, {
      location,
      teamId,
      userId,
      gameId,
      platform: 'FanDuel',
      timestamp: Date.now(),
    });
    
    // Also track for A/B testing
    abTestingService.trackButtonImpression(location, teamId, userId, gameId);
  }
  
  /**
   * Track button click for analytics
   * @param location Location where button was clicked
   * @param affiliateCode Affiliate code used in the link
   * @param teamId Optional team ID associated with the button
   * @param userId Optional user ID for tracking
   * @param gameId Optional game ID for tracking
   */
  trackButtonClick(location: string, affiliateCode: string, teamId?: string, userId?: string, gameId?: string): void {
    // Track the event using the analytics service
    analyticsService.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
      location,
      affiliateCode,
      teamId,
      userId,
      gameId,
      platform: 'FanDuel',
      timestamp: Date.now(),
    });
    
    // Also track as a user action for better categorization
    analyticsService.trackUserAction('affiliate_link_clicked', {
      platform: 'FanDuel',
      location,
      teamId,
      userId,
      gameId,
      timestamp: Date.now(),
    });
    
    // Also track for A/B testing
    abTestingService.trackButtonClick(location, teamId, userId, gameId);
  }
  
  /**
   * Determine if bet button should be shown
   * @param contentType Type of content being viewed
   * @param teamId Optional team ID associated with the content
   * @param favoriteTeams User's favorite teams
   * @returns Boolean indicating if button should be shown
   */
  shouldShowBetButton(contentType: string, teamId?: string, favoriteTeams: string[] = []): boolean {
    // Always show on odds pages
    if (contentType === 'odds') return true;
    
    // Always show in header and footer
    if (contentType === 'header' || contentType === 'footer') return true;
    
    // Show for favorite teams
    if (teamId && favoriteTeams.includes(teamId)) return true;
    
    // Don't show on FAQ pages (except header/footer)
    if (contentType === 'faq') return false;
    
    // Show based on content type
    switch (contentType) {
      case 'game':
      case 'prediction':
      case 'stats':
      case 'home':
      case 'pricing':
        return true;
      default:
        return false;
    }
  }
  
  /**
   * Get button settings based on user preferences and subscription
   * @param isPremium Whether user has premium subscription
   * @param primaryTeam User's primary team for theming
   * @returns Button settings object
   */
  getButtonSettings(isPremium: boolean, primaryTeam?: string): ButtonSettings {
    return {
      size: 'medium',
      animation: isPremium ? 'surge' : 'pulse',
      position: 'inline',
      style: isPremium && primaryTeam ? 'team-colored' : 'default'
    };
  }
  
  /**
   * Save affiliate code to storage
   * @param code Affiliate code to save
   */
  async saveAffiliateCode(code: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AFFILIATE_CODE, code);
    } catch (error) {
      console.error('Error saving affiliate code:', error);
    }
  }
  
  /**
   * Load affiliate code from storage
   * @returns Affiliate code or empty string if not found
   */
  async loadAffiliateCode(): Promise<string> {
    try {
      const code = await AsyncStorage.getItem(STORAGE_KEYS.AFFILIATE_CODE);
      return code || '';
    } catch (error) {
      console.error('Error loading affiliate code:', error);
      return '';
    }
  }
  
  /**
   * Save button settings to storage
   * @param settings Button settings to save
   */
  async saveButtonSettings(settings: ButtonSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BUTTON_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving button settings:', error);
    }
  }
  
  /**
   * Load button settings from storage
   * @returns Button settings or default settings if not found
   */
  async loadButtonSettings(): Promise<ButtonSettings> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.BUTTON_SETTINGS);
      return settings ? JSON.parse(settings) : this.getButtonSettings(false);
    } catch (error) {
      console.error('Error loading button settings:', error);
      return this.getButtonSettings(false);
    }
  }
  
  /**
   * Enable or disable affiliate buttons
   * @param enabled Whether buttons should be enabled
   */
  async setEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AFFILIATE_ENABLED, String(enabled));
    } catch (error) {
      console.error('Error saving affiliate enabled state:', error);
    }
  }
  
  /**
   * Check if affiliate buttons are enabled
   * @returns Boolean indicating if buttons are enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.AFFILIATE_ENABLED);
      return enabled !== null ? enabled === 'true' : true;
    } catch (error) {
      console.error('Error loading affiliate enabled state:', error);
      return true;
    }
  }
  
  /**
   * Get button colors based on team ID
   * @param teamId Team ID to get colors for
   * @returns Object with button colors or null if team not found
   */
  getButtonColors(teamId?: string) {
    if (!teamId) return null;
    
    const teamColors = getTeamColors(teamId);
    if (!teamColors) return null;
    
    return {
      backgroundColor: teamColors.primaryColor,
      textColor: teamColors.secondaryColor,
      glowColor: teamColors.neonPrimaryColor,
      hoverColor: teamColors.neonSecondaryColor,
    };
  }
  
  /**
   * Track conversion for A/B testing
   * @param conversionType Type of conversion (e.g., 'signup', 'deposit', 'bet')
   * @param conversionValue Optional value of the conversion
   * @param userId Optional user ID
   */
  trackConversion(conversionType: string, conversionValue?: number, userId?: string): void {
    // Track the conversion using the A/B testing service
    abTestingService.trackConversion(conversionType, conversionValue, userId);
    
    // Also track as a regular conversion event
    analyticsService.trackEvent(ANALYTICS_EVENTS.CONVERSION, {
      conversionType,
      conversionValue,
      userId,
      platform: 'FanDuel',
      timestamp: Date.now(),
    });
  }
}

export const bettingAffiliateService = new BettingAffiliateService();