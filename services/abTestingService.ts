/**
 * A/B Testing Service for FanDuel Affiliate Buttons
 * Uses Firebase Remote Config to test different button variations
 */

import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';

// Define test variations
export enum ButtonVariation {
  DEFAULT = 'default',
  NEON = 'neon',
  GRADIENT = 'gradient',
  TEAM_COLORED = 'team_colored',
  ANIMATED = 'animated',
  STATIC = 'static',
}

export enum ButtonSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum ButtonPosition {
  INLINE = 'inline',
  FLOATING = 'floating',
  FIXED = 'fixed',
}

export enum ButtonText {
  BET_NOW = 'BET NOW',
  PLACE_BET = 'PLACE BET',
  BET_HERE = 'BET HERE',
  GET_ODDS = 'GET ODDS',
}

// Define test groups
export interface TestGroup {
  id: string;
  name: string;
  variation: ButtonVariation;
  size: ButtonSize;
  position: ButtonPosition;
  text: ButtonText;
  color?: string;
  backgroundColor?: string;
}

// Default test groups
const DEFAULT_TEST_GROUPS: TestGroup[] = [
  {
    id: 'A',
    name: 'Default Neon',
    variation: ButtonVariation.NEON,
    size: ButtonSize.MEDIUM,
    position: ButtonPosition.INLINE,
    text: ButtonText.BET_NOW,
  },
  {
    id: 'B',
    name: 'Team Colored',
    variation: ButtonVariation.TEAM_COLORED,
    size: ButtonSize.MEDIUM,
    position: ButtonPosition.INLINE,
    text: ButtonText.BET_NOW,
  },
  {
    id: 'C',
    name: 'Large Animated',
    variation: ButtonVariation.ANIMATED,
    size: ButtonSize.LARGE,
    position: ButtonPosition.INLINE,
    text: ButtonText.PLACE_BET,
  },
  {
    id: 'D',
    name: 'Floating Button',
    variation: ButtonVariation.NEON,
    size: ButtonSize.MEDIUM,
    position: ButtonPosition.FLOATING,
    text: ButtonText.BET_NOW,
  },
];

/**
 * A/B Testing Service
 */
class ABTestingService {
  private testGroups: TestGroup[] = DEFAULT_TEST_GROUPS;
  private activeTestGroup: TestGroup | null = null;
  private isInitialized: boolean = false;
  private userId: string | null = null;
  
  /**
   * Initialize the A/B testing service
   * @param userId User ID for consistent test group assignment
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Set user ID if provided
      if (userId) {
        this.userId = userId;
      }
      
      // In a real implementation, we would fetch test configurations from Firebase Remote Config
      // For now, we'll just use the default test groups
      
      // Assign user to a test group
      this.assignTestGroup();
      
      // Track initialization
      analyticsService.trackEvent('ab_testing_initialized', {
        platform: Platform.OS,
        userId: this.userId,
        testGroupId: this.activeTestGroup?.id,
        testGroupName: this.activeTestGroup?.name,
      });
      
      this.isInitialized = true;
      console.log('A/B testing service initialized with group:', this.activeTestGroup?.name);
    } catch (error) {
      console.error('Error initializing A/B testing service:', error);
    }
  }
  
  /**
   * Assign user to a test group
   * Uses user ID for consistent assignment or random assignment if no user ID
   */
  private assignTestGroup(): void {
    if (this.testGroups.length === 0) {
      return;
    }
    
    let groupIndex = 0;
    
    if (this.userId) {
      // Use user ID to consistently assign the same test group
      // Simple hash function to convert user ID to a number
      const hash = this.userId.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      
      // Modulo to get index within range of test groups
      groupIndex = hash % this.testGroups.length;
    } else {
      // Random assignment
      groupIndex = Math.floor(Math.random() * this.testGroups.length);
    }
    
    this.activeTestGroup = this.testGroups[groupIndex];
  }
  
  /**
   * Get the active test group
   * @returns Active test group or default if not initialized
   */
  getActiveTestGroup(): TestGroup {
    if (!this.activeTestGroup) {
      // Return default if not initialized
      return this.testGroups[0];
    }
    
    return this.activeTestGroup;
  }
  
  /**
   * Track button impression for the current test group
   * @param location Location where button was shown
   * @param teamId Optional team ID
   * @param userId Optional user ID
   * @param gameId Optional game ID
   */
  trackButtonImpression(location: string, teamId?: string, userId?: string, gameId?: string): void {
    if (!this.activeTestGroup) {
      return;
    }
    
    analyticsService.trackEvent('ab_test_button_impression', {
      testGroupId: this.activeTestGroup.id,
      testGroupName: this.activeTestGroup.name,
      buttonVariation: this.activeTestGroup.variation,
      buttonSize: this.activeTestGroup.size,
      buttonPosition: this.activeTestGroup.position,
      buttonText: this.activeTestGroup.text,
      location,
      teamId,
      userId,
      gameId,
      platform: Platform.OS,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Track button click for the current test group
   * @param location Location where button was clicked
   * @param teamId Optional team ID
   * @param userId Optional user ID
   * @param gameId Optional game ID
   */
  trackButtonClick(location: string, teamId?: string, userId?: string, gameId?: string): void {
    if (!this.activeTestGroup) {
      return;
    }
    
    analyticsService.trackEvent('ab_test_button_click', {
      testGroupId: this.activeTestGroup.id,
      testGroupName: this.activeTestGroup.name,
      buttonVariation: this.activeTestGroup.variation,
      buttonSize: this.activeTestGroup.size,
      buttonPosition: this.activeTestGroup.position,
      buttonText: this.activeTestGroup.text,
      location,
      teamId,
      userId,
      gameId,
      platform: Platform.OS,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Track conversion for the current test group
   * @param conversionType Type of conversion (e.g., 'signup', 'deposit', 'bet')
   * @param conversionValue Optional value of the conversion
   * @param userId Optional user ID
   */
  trackConversion(conversionType: string, conversionValue?: number, userId?: string): void {
    if (!this.activeTestGroup) {
      return;
    }
    
    analyticsService.trackEvent('ab_test_conversion', {
      testGroupId: this.activeTestGroup.id,
      testGroupName: this.activeTestGroup.name,
      buttonVariation: this.activeTestGroup.variation,
      buttonSize: this.activeTestGroup.size,
      buttonPosition: this.activeTestGroup.position,
      buttonText: this.activeTestGroup.text,
      conversionType,
      conversionValue,
      userId,
      platform: Platform.OS,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Set user ID
   * @param userId User ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    // Reassign test group based on new user ID
    this.assignTestGroup();
    
    // Track user identification
    analyticsService.trackEvent('ab_testing_user_identified', {
      userId,
      testGroupId: this.activeTestGroup?.id,
      testGroupName: this.activeTestGroup?.name,
    });
  }
}

export const abTestingService = new ABTestingService();