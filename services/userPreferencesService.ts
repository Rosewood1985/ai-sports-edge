import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '../config/firebase';
import { League } from '../types/sports';

const SELECTED_LEAGUES_KEY = 'user_selected_leagues';

class UserPreferencesService {
  /**
   * Save user's selected leagues
   */
  async saveSelectedLeagues(leagues: League[]): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const key = `${SELECTED_LEAGUES_KEY}_${userId}`;
      const leagueIds = leagues.map(league => league.idLeague);

      await AsyncStorage.setItem(key, JSON.stringify(leagueIds));
    } catch (error) {
      console.error('Error saving selected leagues:', error);
      throw error;
    }
  }

  /**
   * Get user's selected league IDs
   */
  async getSelectedLeagueIds(): Promise<string[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return [];
      }

      const key = `${SELECTED_LEAGUES_KEY}_${userId}`;
      const storedValue = await AsyncStorage.getItem(key);

      if (!storedValue) {
        return [];
      }

      return JSON.parse(storedValue);
    } catch (error) {
      console.error('Error getting selected leagues:', error);
      return [];
    }
  }

  /**
   * Check if a league is selected by the user
   */
  async isLeagueSelected(leagueId: string): Promise<boolean> {
    const selectedLeagueIds = await this.getSelectedLeagueIds();
    return selectedLeagueIds.includes(leagueId);
  }

  /**
   * Toggle selection status of a league
   */
  async toggleLeagueSelection(league: League): Promise<boolean> {
    try {
      const selectedLeagueIds = await this.getSelectedLeagueIds();
      const isSelected = selectedLeagueIds.includes(league.idLeague);

      let updatedLeagueIds: string[];

      if (isSelected) {
        // Remove from selection
        updatedLeagueIds = selectedLeagueIds.filter(id => id !== league.idLeague);
      } else {
        // Add to selection
        updatedLeagueIds = [...selectedLeagueIds, league.idLeague];
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const key = `${SELECTED_LEAGUES_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedLeagueIds));

      return !isSelected; // Return new selection state
    } catch (error) {
      console.error('Error toggling league selection:', error);
      throw error;
    }
  }
}

// Export as singleton
export const userPreferencesService = new UserPreferencesService();
