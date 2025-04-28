/**
 * BettingAffiliateContext
 * Provides context for betting affiliate functionality throughout the app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bettingAffiliateService, ButtonSettings } from '../services/bettingAffiliateService';

// Define context types
export interface BettingAffiliateContextType {
  affiliateCode: string;
  isEnabled: boolean;
  buttonSettings: ButtonSettings;
  favoriteTeams: string[];
  primaryTeam: string;
  showBetButton: (contentType: string, teamId?: string) => boolean;
  trackButtonClick: (location: string, teamId?: string, userId?: string, gameId?: string) => void;
  trackButtonImpression: (location: string, teamId?: string, userId?: string, gameId?: string) => void;
  trackConversion: (conversionType: string, conversionValue?: number, userId?: string) => void;
  updateAffiliateCode: (code: string) => Promise<void>;
  updateButtonSettings: (settings: Partial<ButtonSettings>) => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  addFavoriteTeam: (teamId: string) => Promise<void>;
  removeFavoriteTeam: (teamId: string) => Promise<void>;
  setPrimaryTeam: (teamId: string) => Promise<void>;
  getButtonColors: (teamId?: string) => any;
}

// Create context with default values
const BettingAffiliateContext = createContext<BettingAffiliateContextType>({
  affiliateCode: '',
  isEnabled: true,
  buttonSettings: {
    size: 'medium',
    animation: 'pulse',
    position: 'inline',
    style: 'default'
  },
  favoriteTeams: [],
  primaryTeam: '',
  showBetButton: () => false,
  trackButtonClick: () => {},
  trackButtonImpression: () => {},
  trackConversion: () => {},
  updateAffiliateCode: async () => {},
  updateButtonSettings: async () => {},
  setEnabled: async () => {},
  addFavoriteTeam: async () => {},
  removeFavoriteTeam: async () => {},
  setPrimaryTeam: async () => {},
  getButtonColors: () => null,
});

// Storage keys
const STORAGE_KEYS = {
  FAVORITE_TEAMS: 'favorite_teams',
  PRIMARY_TEAM: 'primary_team',
};

// Provider component
export const BettingAffiliateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // State
  const [affiliateCode, setAffiliateCode] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [buttonSettings, setButtonSettings] = useState<ButtonSettings>({
    size: 'medium',
    animation: 'pulse',
    position: 'inline',
    style: 'default'
  });
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [primaryTeam, setPrimaryTeamState] = useState<string>('');

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load affiliate code
        const code = await bettingAffiliateService.loadAffiliateCode();
        setAffiliateCode(code);
        
        // Load enabled state
        const enabled = await bettingAffiliateService.isEnabled();
        setIsEnabled(enabled);
        
        // Load button settings
        const settings = await bettingAffiliateService.loadButtonSettings();
        setButtonSettings(settings);
        
        // Load favorite teams
        const teamsJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_TEAMS);
        if (teamsJson) {
          setFavoriteTeams(JSON.parse(teamsJson));
        }
        
        // Load primary team
        const primary = await AsyncStorage.getItem(STORAGE_KEYS.PRIMARY_TEAM);
        if (primary) {
          setPrimaryTeamState(primary);
        }
      } catch (error) {
        console.error('Error loading betting affiliate settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Determine if bet button should be shown
  const showBetButton = (contentType: string, teamId?: string): boolean => {
    if (!isEnabled) return false;
    
    // Use service to determine if button should be shown
    return bettingAffiliateService.shouldShowBetButton(contentType, teamId, favoriteTeams);
  };

  // Track button impressions
  const trackButtonImpression = (location: string, teamId?: string, userId?: string, gameId?: string): void => {
    bettingAffiliateService.trackButtonImpression(location, teamId, userId, gameId);
  };

  // Track button clicks
  const trackButtonClick = (location: string, teamId?: string, userId?: string, gameId?: string): void => {
    bettingAffiliateService.trackButtonClick(location, affiliateCode, teamId, userId, gameId);
  };
  
  // Track conversions
  const trackConversion = (conversionType: string, conversionValue?: number, userId?: string): void => {
    bettingAffiliateService.trackConversion(conversionType, conversionValue, userId);
  };

  // Update affiliate code
  const updateAffiliateCode = async (code: string): Promise<void> => {
    try {
      await bettingAffiliateService.saveAffiliateCode(code);
      setAffiliateCode(code);
    } catch (error) {
      console.error('Error saving affiliate code:', error);
    }
  };

  // Update button settings
  const updateButtonSettings = async (settings: Partial<ButtonSettings>): Promise<void> => {
    try {
      const newSettings = { ...buttonSettings, ...settings };
      await bettingAffiliateService.saveButtonSettings(newSettings);
      setButtonSettings(newSettings);
    } catch (error) {
      console.error('Error saving button settings:', error);
    }
  };

  // Enable or disable affiliate buttons
  const setEnabled = async (enabled: boolean): Promise<void> => {
    try {
      await bettingAffiliateService.setEnabled(enabled);
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error saving affiliate enabled state:', error);
    }
  };

  // Add favorite team
  const addFavoriteTeam = async (teamId: string): Promise<void> => {
    try {
      if (!favoriteTeams.includes(teamId)) {
        const newFavoriteTeams = [...favoriteTeams, teamId];
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_TEAMS, JSON.stringify(newFavoriteTeams));
        setFavoriteTeams(newFavoriteTeams);
        
        // If no primary team is set, set this as primary
        if (!primaryTeam) {
          await AsyncStorage.setItem(STORAGE_KEYS.PRIMARY_TEAM, teamId);
          setPrimaryTeamState(teamId);
        }
      }
    } catch (error) {
      console.error('Error adding favorite team:', error);
    }
  };

  // Remove favorite team
  const removeFavoriteTeam = async (teamId: string): Promise<void> => {
    try {
      if (favoriteTeams.includes(teamId)) {
        const newFavoriteTeams = favoriteTeams.filter(id => id !== teamId);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_TEAMS, JSON.stringify(newFavoriteTeams));
        setFavoriteTeams(newFavoriteTeams);
        
        // If primary team is removed, clear primary team
        if (primaryTeam === teamId) {
          await AsyncStorage.removeItem(STORAGE_KEYS.PRIMARY_TEAM);
          setPrimaryTeamState('');
        }
      }
    } catch (error) {
      console.error('Error removing favorite team:', error);
    }
  };

  // Set primary team
  const setPrimaryTeam = async (teamId: string): Promise<void> => {
    try {
      // Ensure team is in favorite teams
      if (!favoriteTeams.includes(teamId)) {
        await addFavoriteTeam(teamId);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.PRIMARY_TEAM, teamId);
      setPrimaryTeamState(teamId);
    } catch (error) {
      console.error('Error setting primary team:', error);
    }
  };

  // Get button colors based on team ID
  const getButtonColors = (teamId?: string) => {
    return bettingAffiliateService.getButtonColors(teamId || primaryTeam);
  };

  // Context value
  const contextValue: BettingAffiliateContextType = {
    affiliateCode,
    isEnabled,
    buttonSettings,
    favoriteTeams,
    primaryTeam,
    showBetButton,
    trackButtonClick,
    trackButtonImpression,
    trackConversion,
    updateAffiliateCode,
    updateButtonSettings,
    setEnabled,
    addFavoriteTeam,
    removeFavoriteTeam,
    setPrimaryTeam,
    getButtonColors,
  };

  return (
    <BettingAffiliateContext.Provider value={contextValue}>
      {children}
    </BettingAffiliateContext.Provider>
  );
};

// Custom hook to use the context
export const useBettingAffiliate = () => useContext(BettingAffiliateContext);

export default BettingAffiliateContext;