/**
 * Privacy Manager
 *
 * This class manages user privacy preferences and consent settings.
 */

import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Privacy preferences interface
 */
export interface PrivacyPreferences {
  marketingConsent: boolean;
  analyticsConsent: boolean;
  thirdPartySharing: boolean;
  profiling: boolean;
  lastUpdated: Date;
}

/**
 * Default privacy preferences
 */
export const defaultPrivacyPreferences: PrivacyPreferences = {
  marketingConsent: false,
  analyticsConsent: true,
  thirdPartySharing: false,
  profiling: false,
  lastUpdated: new Date(),
};

/**
 * Privacy Manager class
 */
class PrivacyManager {
  private db = getFirestore();
  private collectionPath = 'privacyPreferences';

  /**
   * Get user privacy preferences
   * @param userId The user ID
   * @returns The user's privacy preferences
   */
  async getPrivacyPreferences(userId: string): Promise<PrivacyPreferences> {
    try {
      const docRef = doc(this.db, this.collectionPath, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firestore timestamp to Date
        if (data.lastUpdated && typeof data.lastUpdated.toDate === 'function') {
          data.lastUpdated = data.lastUpdated.toDate();
        } else if (data.lastUpdated) {
          data.lastUpdated = new Date(data.lastUpdated);
        }
        return data as PrivacyPreferences;
      } else {
        // Return default preferences if not found
        return { ...defaultPrivacyPreferences };
      }
    } catch (error) {
      console.error('Error getting privacy preferences:', error);
      throw error;
    }
  }

  /**
   * Update user privacy preferences
   * @param userId The user ID
   * @param preferences The privacy preferences to update
   */
  async updatePrivacyPreferences(
    userId: string,
    preferences: Partial<PrivacyPreferences>
  ): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionPath, userId);
      const docSnap = await getDoc(docRef);

      // Add lastUpdated timestamp
      const updatedPreferences = {
        ...preferences,
        lastUpdated: new Date(),
      };

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, updatedPreferences);
      } else {
        // Create new document with default values + updates
        await setDoc(docRef, {
          ...defaultPrivacyPreferences,
          ...updatedPreferences,
        });
      }

      // Log the consent change for audit purposes
      await this.logConsentChange(userId, updatedPreferences);
    } catch (error) {
      console.error('Error updating privacy preferences:', error);
      throw error;
    }
  }

  /**
   * Log consent change for audit purposes
   * @param userId The user ID
   * @param preferences The updated preferences
   */
  private async logConsentChange(
    userId: string,
    preferences: Partial<PrivacyPreferences>
  ): Promise<void> {
    try {
      const logRef = doc(this.db, 'consentLogs', `${userId}_${Date.now()}`);
      await setDoc(logRef, {
        userId,
        preferences,
        timestamp: new Date(),
        ipAddress: 'COLLECTED_AT_RUNTIME', // This should be replaced with actual IP
        userAgent: 'COLLECTED_AT_RUNTIME', // This should be replaced with actual user agent
      });
    } catch (error) {
      console.error('Error logging consent change:', error);
      // Don't throw here, just log the error
    }
  }

  /**
   * Check if user has given consent for a specific purpose
   * @param userId The user ID
   * @param consentType The type of consent to check
   * @returns True if the user has given consent, false otherwise
   */
  async hasConsent(userId: string, consentType: keyof PrivacyPreferences): Promise<boolean> {
    try {
      const preferences = await this.getPrivacyPreferences(userId);
      return preferences[consentType] === true;
    } catch (error) {
      console.error(`Error checking consent for ${consentType}:`, error);
      // Default to false if there's an error
      return false;
    }
  }

  /**
   * Get all users who have given consent for a specific purpose
   * @param consentType The type of consent to check
   * @returns Array of user IDs who have given consent
   */
  async getUsersWithConsent(consentType: keyof PrivacyPreferences): Promise<string[]> {
    // This would typically use a Firestore query, but for simplicity we'll return an empty array
    console.warn('getUsersWithConsent not implemented');
    return [];
  }
}

export default PrivacyManager;
