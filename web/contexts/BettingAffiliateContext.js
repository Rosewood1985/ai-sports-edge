/**
 * Web-specific BettingAffiliateContext
 * Provides context for betting affiliate functionality for the web app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Define context types
const BettingAffiliateContext = createContext({
  affiliateCode: '',
  isEnabled: true,
  buttonSettings: {
    size: 'medium',
    animation: 'pulse',
    position: 'inline',
    style: 'default',
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

// Web storage helper functions
const getLocalStorage = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
    return false;
  }
};

// Storage keys
const STORAGE_KEYS = {
  AFFILIATE_CODE: 'betting_affiliate_code',
  AFFILIATE_ENABLED: 'betting_affiliate_enabled',
  BUTTON_SETTINGS: 'betting_affiliate_button_settings',
  FAVORITE_TEAMS: 'favorite_teams',
  PRIMARY_TEAM: 'primary_team',
};

// Provider component
export const BettingAffiliateProvider = ({ children }) => {
  // State
  const [affiliateCode, setAffiliateCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [buttonSettings, setButtonSettings] = useState({
    size: 'medium',
    animation: 'pulse',
    position: 'inline',
    style: 'default',
  });
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [primaryTeam, setPrimaryTeamState] = useState('');

  // Load settings from storage on mount
  useEffect(() => {
    // Load affiliate code
    const code = getLocalStorage(STORAGE_KEYS.AFFILIATE_CODE, '');
    setAffiliateCode(code);

    // Load enabled state
    const enabled = getLocalStorage(STORAGE_KEYS.AFFILIATE_ENABLED, true);
    setIsEnabled(enabled);

    // Load button settings
    const settings = getLocalStorage(STORAGE_KEYS.BUTTON_SETTINGS, buttonSettings);
    setButtonSettings(settings);

    // Load favorite teams
    const teams = getLocalStorage(STORAGE_KEYS.FAVORITE_TEAMS, []);
    setFavoriteTeams(teams);

    // Load primary team
    const primary = getLocalStorage(STORAGE_KEYS.PRIMARY_TEAM, '');
    setPrimaryTeamState(primary);
  }, []);

  // Determine if bet button should be shown
  const showBetButton = (contentType, teamId) => {
    if (!isEnabled) return false;

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
  };

  // Track button impressions (web version - simplified)
  const trackButtonImpression = (location, teamId, userId, gameId) => {
    console.log('Button impression:', { location, teamId, userId, gameId });
    // In a real implementation, this would send analytics data
  };

  // Track button clicks (web version - simplified)
  const trackButtonClick = (location, teamId, userId, gameId) => {
    console.log('Button click:', { location, teamId, userId, gameId, affiliateCode });
    // In a real implementation, this would send analytics data
  };

  // Track conversions (web version - simplified)
  const trackConversion = (conversionType, conversionValue, userId) => {
    console.log('Conversion:', { conversionType, conversionValue, userId });
    // In a real implementation, this would send analytics data
  };

  // Update affiliate code
  const updateAffiliateCode = async code => {
    setLocalStorage(STORAGE_KEYS.AFFILIATE_CODE, code);
    setAffiliateCode(code);
  };

  // Update button settings
  const updateButtonSettings = async settings => {
    const newSettings = { ...buttonSettings, ...settings };
    setLocalStorage(STORAGE_KEYS.BUTTON_SETTINGS, newSettings);
    setButtonSettings(newSettings);
  };

  // Enable or disable affiliate buttons
  const setEnabled = async enabled => {
    setLocalStorage(STORAGE_KEYS.AFFILIATE_ENABLED, enabled);
    setIsEnabled(enabled);
  };

  // Add favorite team
  const addFavoriteTeam = async teamId => {
    if (!favoriteTeams.includes(teamId)) {
      const newFavoriteTeams = [...favoriteTeams, teamId];
      setLocalStorage(STORAGE_KEYS.FAVORITE_TEAMS, newFavoriteTeams);
      setFavoriteTeams(newFavoriteTeams);

      // If no primary team is set, set this as primary
      if (!primaryTeam) {
        setLocalStorage(STORAGE_KEYS.PRIMARY_TEAM, teamId);
        setPrimaryTeamState(teamId);
      }
    }
  };

  // Remove favorite team
  const removeFavoriteTeam = async teamId => {
    if (favoriteTeams.includes(teamId)) {
      const newFavoriteTeams = favoriteTeams.filter(id => id !== teamId);
      setLocalStorage(STORAGE_KEYS.FAVORITE_TEAMS, newFavoriteTeams);
      setFavoriteTeams(newFavoriteTeams);

      // If primary team is removed, clear primary team
      if (primaryTeam === teamId) {
        setLocalStorage(STORAGE_KEYS.PRIMARY_TEAM, '');
        setPrimaryTeamState('');
      }
    }
  };

  // Set primary team
  const setPrimaryTeam = async teamId => {
    // Ensure team is in favorite teams
    if (!favoriteTeams.includes(teamId)) {
      await addFavoriteTeam(teamId);
    }

    setLocalStorage(STORAGE_KEYS.PRIMARY_TEAM, teamId);
    setPrimaryTeamState(teamId);
  };

  // Get button colors based on team ID (simplified for web)
  const getButtonColors = teamId => {
    if (!teamId) return null;

    // In a real implementation, this would get team colors from a service
    // For now, return default colors
    return {
      backgroundColor: '#0066ff',
      textColor: '#ffffff',
      glowColor: '#4d94ff',
      hoverColor: '#0052cc',
    };
  };

  // Context value
  const contextValue = {
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
