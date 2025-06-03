import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  limit,
  DocumentData,
} from 'firebase/firestore';

import { trackEvent } from './analyticsService';
import { auth, firestore } from '../config/firebase';

/**
 * User sports preferences interface
 */
export interface UserSportsPreferences {
  favoriteTeams: string[];
  favoriteSports: string[];
  favoriteLeagues: string[];
  bettingInterests: string[]; // e.g., 'point-spreads', 'over-under', 'player-props'
  notificationPreferences: {
    highImpactNews: boolean;
    favoriteTeamNews: boolean;
    bettingOpportunities: boolean;
    injuryUpdates: boolean;
  };
}

/**
 * Default user sports preferences
 */
const defaultPreferences: UserSportsPreferences = {
  favoriteTeams: [],
  favoriteSports: ['basketball', 'football', 'baseball'],
  favoriteLeagues: ['NBA', 'NFL', 'MLB'],
  bettingInterests: ['point-spreads', 'over-under'],
  notificationPreferences: {
    highImpactNews: true,
    favoriteTeamNews: true,
    bettingOpportunities: true,
    injuryUpdates: true,
  },
};

/**
 * Get user sports preferences
 * @returns User sports preferences
 */
export const getUserSportsPreferences = async (): Promise<UserSportsPreferences> => {
  try {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = firestore;
    const userDocRef = doc(db, 'users', userId);
    const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');
    const userPrefsDoc = await getDoc(prefsDocRef);

    if (userPrefsDoc.exists()) {
      return userPrefsDoc.data() as UserSportsPreferences;
    } else {
      // If no preferences exist, create default ones
      await saveUserSportsPreferences(defaultPreferences);
      return defaultPreferences;
    }
  } catch (error) {
    console.error('Error getting user sports preferences:', error);
    return defaultPreferences;
  }
};

/**
 * Save user sports preferences
 * @param preferences User sports preferences
 */
export const saveUserSportsPreferences = async (
  preferences: Partial<UserSportsPreferences>
): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = firestore;
    const userDocRef = doc(db, 'users', userId);
    const prefsDocRef = doc(collection(userDocRef, 'preferences'), 'sports');

    await setDoc(prefsDocRef, preferences, { merge: true });

    // Track the event
    await trackEvent('sports_preferences_updated', {
      favorite_teams_count: preferences.favoriteTeams?.length || 0,
      favorite_sports_count: preferences.favoriteSports?.length || 0,
    });
  } catch (error) {
    console.error('Error saving user sports preferences:', error);
    throw error;
  }
};

/**
 * Add a team to favorite teams
 * @param teamName Team name
 */
export const addFavoriteTeam = async (teamName: string): Promise<void> => {
  try {
    const prefs = await getUserSportsPreferences();

    if (!prefs.favoriteTeams.includes(teamName)) {
      prefs.favoriteTeams.push(teamName);
      await saveUserSportsPreferences({ favoriteTeams: prefs.favoriteTeams });
    }
  } catch (error) {
    console.error('Error adding favorite team:', error);
    throw error;
  }
};

/**
 * Remove a team from favorite teams
 * @param teamName Team name
 */
export const removeFavoriteTeam = async (teamName: string): Promise<void> => {
  try {
    const prefs = await getUserSportsPreferences();

    const index = prefs.favoriteTeams.indexOf(teamName);
    if (index !== -1) {
      prefs.favoriteTeams.splice(index, 1);
      await saveUserSportsPreferences({ favoriteTeams: prefs.favoriteTeams });
    }
  } catch (error) {
    console.error('Error removing favorite team:', error);
    throw error;
  }
};

/**
 * Get user's betting history summary
 * This helps personalize AI summaries based on betting patterns
 */
export const getUserBettingHistorySummary = async (): Promise<{
  favoredBetTypes: string[];
  favoredTeams: string[];
  averageBetAmount: number;
  winRate: number;
}> => {
  try {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = firestore;
    const userDocRef = doc(db, 'users', userId);
    const betsCollectionRef = collection(userDocRef, 'bets');
    const betsSnapshot = await getDocs(betsCollectionRef);

    if (betsSnapshot.empty) {
      return {
        favoredBetTypes: [],
        favoredTeams: [],
        averageBetAmount: 0,
        winRate: 0,
      };
    }

    // Process betting history to extract patterns
    interface BetData {
      type?: string;
      team?: string;
      amount?: number;
      result?: string;
    }

    const bets: BetData[] = betsSnapshot.docs.map(doc => doc.data() as BetData);

    // Count bet types
    const betTypeCounts: Record<string, number> = {};
    bets.forEach((bet: BetData) => {
      const type = bet.type || 'unknown';
      betTypeCounts[type] = (betTypeCounts[type] || 0) + 1;
    });

    // Count teams bet on
    const teamCounts: Record<string, number> = {};
    bets.forEach((bet: BetData) => {
      const team = bet.team || 'unknown';
      teamCounts[team] = (teamCounts[team] || 0) + 1;
    });

    // Calculate average bet amount
    const totalAmount = bets.reduce((sum: number, bet: BetData) => sum + (bet.amount || 0), 0);
    const averageBetAmount = bets.length > 0 ? totalAmount / bets.length : 0;

    // Calculate win rate
    const wins = bets.filter((bet: BetData) => bet.result === 'win').length;
    const winRate = bets.length > 0 ? (wins / bets.length) * 100 : 0;

    // Get favored bet types (top 3)
    const favoredBetTypes = Object.entries(betTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    // Get favored teams (top 5)
    const favoredTeams = Object.entries(teamCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    return {
      favoredBetTypes,
      favoredTeams,
      averageBetAmount,
      winRate,
    };
  } catch (error) {
    console.error('Error getting user betting history summary:', error);
    return {
      favoredBetTypes: [],
      favoredTeams: [],
      averageBetAmount: 0,
      winRate: 0,
    };
  }
};

export default {
  getUserSportsPreferences,
  saveUserSportsPreferences,
  addFavoriteTeam,
  removeFavoriteTeam,
  getUserBettingHistorySummary,
};
