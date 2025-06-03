/**
 * Consent Manager
 *
 * This class manages user consent for various purposes, such as marketing communications,
 * data analytics, third-party sharing, and profiling. It handles the creation, retrieval,
 * and updating of consent records, as well as checking if consent has been given for a
 * specific purpose.
 */

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

import { ConsentType, ConsentMethod, PrivacyRegion } from '../../atoms/privacy/gdprConfig';
import {
  ConsentRecord,
  UserConsentRecord,
  PrivacyPreferences,
} from '../../atoms/privacy/privacyTypes';

/**
 * Class for managing user consent
 */
export class ConsentManager {
  private db = getFirestore();
  private consentCollection = 'consents';
  private usersCollection = 'users';
  private currentPolicyVersions = {
    privacyPolicy: '1.0.0',
    termsOfService: '1.0.0',
    cookiePolicy: '1.0.0',
    marketingConsent: '1.0.0',
  };

  /**
   * Create a consent record
   * @param userId The user ID
   * @param consentType The type of consent
   * @param given Whether consent was given
   * @param method The method used to obtain consent
   * @param policyText The text of the policy that was shown to the user
   * @param ipAddress The IP address of the user (optional)
   * @param userAgent The user agent of the user (optional)
   * @param expiresAt When the consent expires (optional)
   * @returns The ID of the created consent record
   */
  async createConsentRecord(
    userId: string,
    consentType: ConsentType,
    given: boolean,
    method: ConsentMethod,
    policyText: string,
    ipAddress?: string,
    userAgent?: string,
    expiresAt?: Date
  ): Promise<string> {
    try {
      // Get the current policy version for this consent type
      const policyVersion = this.getPolicyVersionForConsentType(consentType);

      // Create the consent record
      const consentRecord: Omit<ConsentRecord, 'id'> = {
        userId,
        consentType,
        given,
        timestamp: new Date(),
        method,
        ipAddress,
        userAgent,
        policyVersion,
        policyText,
        expiresAt,
      };

      // Add the consent record to Firestore
      const docRef = await addDoc(collection(this.db, this.consentCollection), consentRecord);

      console.log(`Created consent record ${docRef.id} for user ${userId}`);

      // Update the user's consent record in their user document
      await this.updateUserConsentRecord(userId, consentType, given, method, policyVersion);

      return docRef.id;
    } catch (error) {
      console.error('Error creating consent record:', error);
      throw error;
    }
  }

  /**
   * Get the current policy version for a consent type
   * @param consentType The type of consent
   * @returns The current policy version
   */
  private getPolicyVersionForConsentType(consentType: ConsentType): string {
    switch (consentType) {
      case ConsentType.PRIVACY_POLICY:
        return this.currentPolicyVersions.privacyPolicy;
      case ConsentType.TERMS_OF_SERVICE:
        return this.currentPolicyVersions.termsOfService;
      case ConsentType.COOKIE_POLICY:
        return this.currentPolicyVersions.cookiePolicy;
      case ConsentType.MARKETING:
        return this.currentPolicyVersions.marketingConsent;
      default:
        return '1.0.0';
    }
  }

  /**
   * Update the user's consent record in their user document
   * @param userId The user ID
   * @param consentType The type of consent
   * @param given Whether consent was given
   * @param method The method used to obtain consent
   * @param version The version of the policy
   */
  private async updateUserConsentRecord(
    userId: string,
    consentType: ConsentType,
    given: boolean,
    method: ConsentMethod,
    version: string
  ): Promise<void> {
    try {
      const userDocRef = doc(this.db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`User document not found for user ${userId}`);
        return;
      }

      const userData = userDoc.data();
      const consentRecords = userData.consentRecords || {};

      // Create or update the consent record for this type
      const userConsentRecord: UserConsentRecord = {
        given,
        timestamp: new Date(),
        method,
        version,
      };

      // Update the user document
      await updateDoc(userDocRef, {
        [`consentRecords.${consentType}`]: userConsentRecord,
        privacySettingsUpdatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error updating user consent record for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all consent records for a user
   * @param userId The user ID
   * @returns Array of consent records
   */
  async getUserConsentRecords(userId: string): Promise<ConsentRecord[]> {
    try {
      const q = query(collection(this.db, this.consentCollection), where('userId', '==', userId));

      const querySnapshot = await getDocs(q);
      const consentRecords: ConsentRecord[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<ConsentRecord, 'id'>;
        consentRecords.push({
          id: doc.id,
          ...data,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : new Date(data.timestamp),
          expiresAt:
            data.expiresAt instanceof Timestamp
              ? data.expiresAt.toDate()
              : data.expiresAt
                ? new Date(data.expiresAt)
                : undefined,
        });
      });

      // Sort by timestamp, newest first
      consentRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return consentRecords;
    } catch (error) {
      console.error(`Error getting consent records for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest consent record for a user and consent type
   * @param userId The user ID
   * @param consentType The type of consent
   * @returns The latest consent record, or null if not found
   */
  async getLatestConsentRecord(
    userId: string,
    consentType: ConsentType
  ): Promise<ConsentRecord | null> {
    try {
      const q = query(
        collection(this.db, this.consentCollection),
        where('userId', '==', userId),
        where('consentType', '==', consentType)
      );

      const querySnapshot = await getDocs(q);
      let latestRecord: ConsentRecord | null = null;
      let latestTimestamp = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<ConsentRecord, 'id'>;
        const timestamp =
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate().getTime()
            : new Date(data.timestamp).getTime();

        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          latestRecord = {
            id: doc.id,
            ...data,
            timestamp:
              data.timestamp instanceof Timestamp
                ? data.timestamp.toDate()
                : new Date(data.timestamp),
            expiresAt:
              data.expiresAt instanceof Timestamp
                ? data.expiresAt.toDate()
                : data.expiresAt
                  ? new Date(data.expiresAt)
                  : undefined,
          };
        }
      });

      return latestRecord;
    } catch (error) {
      console.error(
        `Error getting latest consent record for user ${userId} and type ${consentType}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Check if a user has given consent for a specific type
   * @param userId The user ID
   * @param consentType The type of consent
   * @returns Whether consent has been given
   */
  async hasUserGivenConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const latestRecord = await this.getLatestConsentRecord(userId, consentType);

      if (!latestRecord) {
        return false;
      }

      // Check if the consent has expired
      if (latestRecord.expiresAt && latestRecord.expiresAt < new Date()) {
        return false;
      }

      // Check if the policy version is current
      const currentVersion = this.getPolicyVersionForConsentType(consentType);
      if (latestRecord.policyVersion !== currentVersion) {
        return false;
      }

      return latestRecord.given;
    } catch (error) {
      console.error(
        `Error checking if user ${userId} has given consent for type ${consentType}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update a user's privacy preferences
   * @param userId The user ID
   * @param preferences The privacy preferences to update
   */
  async updatePrivacyPreferences(
    userId: string,
    preferences: Partial<PrivacyPreferences>
  ): Promise<void> {
    try {
      const userDocRef = doc(this.db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`User document not found for user ${userId}`);
        return;
      }

      const userData = userDoc.data();
      const currentPreferences = userData.privacyPreferences || {
        marketingCommunications: false,
        dataAnalytics: false,
        thirdPartySharing: false,
        profiling: false,
      };

      // Update the preferences
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
      };

      // Update the user document
      await updateDoc(userDocRef, {
        privacyPreferences: updatedPreferences,
        privacySettingsUpdatedAt: new Date(),
      });

      // Create consent records for each updated preference
      if (preferences.marketingCommunications !== undefined) {
        await this.createConsentRecord(
          userId,
          ConsentType.MARKETING,
          preferences.marketingCommunications,
          ConsentMethod.SETTINGS,
          'User updated marketing communications preference in privacy settings'
        );
      }

      if (preferences.dataAnalytics !== undefined) {
        await this.createConsentRecord(
          userId,
          ConsentType.ANALYTICS,
          preferences.dataAnalytics,
          ConsentMethod.SETTINGS,
          'User updated data analytics preference in privacy settings'
        );
      }

      if (preferences.thirdPartySharing !== undefined) {
        await this.createConsentRecord(
          userId,
          ConsentType.THIRD_PARTY,
          preferences.thirdPartySharing,
          ConsentMethod.SETTINGS,
          'User updated third-party sharing preference in privacy settings'
        );
      }

      if (preferences.profiling !== undefined) {
        await this.createConsentRecord(
          userId,
          ConsentType.PROFILING,
          preferences.profiling,
          ConsentMethod.SETTINGS,
          'User updated profiling preference in privacy settings'
        );
      }
    } catch (error) {
      console.error(`Error updating privacy preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get a user's privacy preferences
   * @param userId The user ID
   * @returns The user's privacy preferences
   */
  async getPrivacyPreferences(userId: string): Promise<PrivacyPreferences> {
    try {
      const userDocRef = doc(this.db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`User document not found for user ${userId}`);
        return {
          marketingCommunications: false,
          dataAnalytics: false,
          thirdPartySharing: false,
          profiling: false,
        };
      }

      const userData = userDoc.data();
      return (
        userData.privacyPreferences || {
          marketingCommunications: false,
          dataAnalytics: false,
          thirdPartySharing: false,
          profiling: false,
        }
      );
    } catch (error) {
      console.error(`Error getting privacy preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Set a user's region for privacy regulations
   * @param userId The user ID
   * @param region The privacy region
   */
  async setUserPrivacyRegion(userId: string, region: PrivacyRegion): Promise<void> {
    try {
      const userDocRef = doc(this.db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`User document not found for user ${userId}`);
        return;
      }

      // Update the user document
      await updateDoc(userDocRef, {
        region,
        privacySettingsUpdatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error setting privacy region for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get a user's region for privacy regulations
   * @param userId The user ID
   * @returns The user's privacy region, or null if not set
   */
  async getUserPrivacyRegion(userId: string): Promise<PrivacyRegion | null> {
    try {
      const userDocRef = doc(this.db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`User document not found for user ${userId}`);
        return null;
      }

      const userData = userDoc.data();
      return userData.region || null;
    } catch (error) {
      console.error(`Error getting privacy region for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mark privacy onboarding as completed for a user
   * @param userId The user ID
   */
  async completePrivacyOnboarding(userId: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`User document not found for user ${userId}`);
        return;
      }

      // Update the user document
      await updateDoc(userDocRef, {
        privacyOnboardingCompleted: true,
        privacySettingsUpdatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error completing privacy onboarding for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user has completed privacy onboarding
   * @param userId The user ID
   * @returns Whether the user has completed privacy onboarding
   */
  async hasCompletedPrivacyOnboarding(userId: string): Promise<boolean> {
    try {
      const userDocRef = doc(this.db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn(`User document not found for user ${userId}`);
        return false;
      }

      const userData = userDoc.data();
      return userData.privacyOnboardingCompleted || false;
    } catch (error) {
      console.error(`Error checking if user ${userId} has completed privacy onboarding:`, error);
      throw error;
    }
  }
}

export default ConsentManager;
