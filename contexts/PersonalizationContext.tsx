import React, { createContext, useContext, useEffect, useState } from 'react';
import { personalizationService, UserPreferences, UserProfile, BettingHistoryItem, PersonalizedContent } from '../services/personalizationService';

/**
 * Personalization context interface
 */
interface PersonalizationContextType {
  // User preferences
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  
  // User profile
  userProfile: UserProfile | null;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Betting history
  bettingHistory: BettingHistoryItem[];
  addBettingHistoryItem: (item: Omit<BettingHistoryItem, 'id'>) => Promise<void>;
  updateBettingHistoryItem: (id: string, updates: Partial<BettingHistoryItem>) => Promise<void>;
  
  // Personalized content
  personalizedContent: PersonalizedContent | null;
  refreshPersonalizedContent: () => Promise<void>;
  
  // Achievements and badges
  addAchievement: (achievement: string) => Promise<void>;
  addBadge: (badge: string) => Promise<void>;
  
  // Recommendations
  getPersonalizedRecommendations: () => Promise<any[]>;
  
  // Loading state
  isLoading: boolean;
}

/**
 * Create personalization context
 */
const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

/**
 * Personalization provider props
 */
interface PersonalizationProviderProps {
  children: React.ReactNode;
}

/**
 * Personalization provider component
 */
export const PersonalizationProvider: React.FC<PersonalizationProviderProps> = ({ children }) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [preferences, setPreferences] = useState<UserPreferences>(personalizationService.getPreferences());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(personalizationService.getUserProfile());
  const [bettingHistory, setBettingHistory] = useState<BettingHistoryItem[]>(personalizationService.getBettingHistory());
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent | null>(null);
  
  /**
   * Initialize personalization service
   */
  useEffect(() => {
    const initializePersonalization = async () => {
      try {
        setIsLoading(true);
        
        // Initialize personalization service
        await personalizationService.initialize();
        
        // Set initial state
        setPreferences(personalizationService.getPreferences());
        setUserProfile(personalizationService.getUserProfile());
        setBettingHistory(personalizationService.getBettingHistory());
        
        // Get personalized content
        const content = await personalizationService.getPersonalizedContent();
        setPersonalizedContent(content);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing personalization:', error);
        setIsLoading(false);
      }
    };
    
    initializePersonalization();
  }, []);
  
  /**
   * Update preferences
   */
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      await personalizationService.updatePreferences(newPreferences);
      setPreferences(personalizationService.getPreferences());
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };
  
  /**
   * Update user profile
   */
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      await personalizationService.updateUserProfile(updates);
      setUserProfile(personalizationService.getUserProfile());
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };
  
  /**
   * Add betting history item
   */
  const addBettingHistoryItem = async (item: Omit<BettingHistoryItem, 'id'>) => {
    try {
      await personalizationService.addBettingHistoryItem(item);
      setBettingHistory(personalizationService.getBettingHistory());
      setUserProfile(personalizationService.getUserProfile());
    } catch (error) {
      console.error('Error adding betting history item:', error);
    }
  };
  
  /**
   * Update betting history item
   */
  const updateBettingHistoryItem = async (id: string, updates: Partial<BettingHistoryItem>) => {
    try {
      await personalizationService.updateBettingHistoryItem(id, updates);
      setBettingHistory(personalizationService.getBettingHistory());
      setUserProfile(personalizationService.getUserProfile());
    } catch (error) {
      console.error('Error updating betting history item:', error);
    }
  };
  
  /**
   * Refresh personalized content
   */
  const refreshPersonalizedContent = async () => {
    try {
      const content = await personalizationService.getPersonalizedContent();
      setPersonalizedContent(content);
    } catch (error) {
      console.error('Error refreshing personalized content:', error);
    }
  };
  
  /**
   * Add achievement
   */
  const addAchievement = async (achievement: string) => {
    try {
      await personalizationService.addAchievement(achievement);
      setUserProfile(personalizationService.getUserProfile());
    } catch (error) {
      console.error('Error adding achievement:', error);
    }
  };
  
  /**
   * Add badge
   */
  const addBadge = async (badge: string) => {
    try {
      await personalizationService.addBadge(badge);
      setUserProfile(personalizationService.getUserProfile());
    } catch (error) {
      console.error('Error adding badge:', error);
    }
  };
  
  /**
   * Get personalized recommendations
   */
  const getPersonalizedRecommendations = async () => {
    try {
      return await personalizationService.getPersonalizedRecommendations();
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  };
  
  // Context value
  const value: PersonalizationContextType = {
    preferences,
    updatePreferences,
    userProfile,
    updateUserProfile,
    bettingHistory,
    addBettingHistoryItem,
    updateBettingHistoryItem,
    personalizedContent,
    refreshPersonalizedContent,
    addAchievement,
    addBadge,
    getPersonalizedRecommendations,
    isLoading,
  };
  
  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
};

/**
 * Use personalization hook
 */
export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  
  return context;
};