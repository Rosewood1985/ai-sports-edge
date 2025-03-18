import { db, auth } from '../../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service for managing user preferences
 */
class UserPreferencesService {
  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        return this.getDefaultPreferences();
      }
      
      const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
      
      if (userPrefsDoc.exists()) {
        return userPrefsDoc.data();
      } else {
        // Create default preferences if none exist
        const defaultPrefs = this.getDefaultPreferences();
        await this.saveUserPreferences(defaultPrefs);
        return defaultPrefs;
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }
  
  /**
   * Save user preferences
   * @param {Object} preferences - User preferences to save
   * @returns {Promise<void>}
   */
  async saveUserPreferences(preferences) {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const userPrefsRef = doc(db, 'userPreferences', userId);
      const userPrefsDoc = await getDoc(userPrefsRef);
      
      if (userPrefsDoc.exists()) {
        // Update existing preferences
        await updateDoc(userPrefsRef, {
          ...preferences,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new preferences
        await setDoc(userPrefsRef, {
          ...preferences,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }
  
  /**
   * Get default preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      sports: ['football', 'basketball', 'baseball', 'hockey'],
      bettingContentOnly: false,
      favoriteTeams: [],
      maxNewsItems: 20
    };
  }
}

export default new UserPreferencesService();