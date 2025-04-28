/**
 * Firebase Service
 * Handles interactions with Firebase for cross-platform data synchronization
 */

import { Platform } from 'react-native';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { app, auth, firestore as db } from '../config/firebase';

// Define types
export interface UserData {
  purchasedOdds?: PurchasedOdds[];
  userPreferences?: UserPreferences;
  lastSyncTimestamp?: number;
}

export interface PurchasedOdds {
  gameId: string;
  timestamp: number;
  platform: string;
}

export interface UserPreferences {
  favoriteTeams: string[];
  primaryTeam: string;
  buttonSettings: any;
  affiliateEnabled: boolean;
  affiliateCode: string;
  lastUpdated?: number;
  lastPlatform?: string;
}

class FirebaseService {
  private userId: string | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set up auth state listener if auth is available
      if (auth) {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            this.userId = user.uid;
          } else {
            this.userId = null;
          }
        });
      } else {
        console.warn('Firebase auth is not available, using mock authentication');
      }

      this.isInitialized = true;
      console.log('Firebase service initialized');
    } catch (error) {
      console.error('Error initializing Firebase service:', error);
    }
  }

  /**
   * Get user data from Firestore
   * @param userId User ID
   * @param lastSyncTimestamp Last sync timestamp
   * @returns User data
   */
  async getUserData(userId: string, lastSyncTimestamp: number = 0): Promise<UserData | null> {
    try {
      // Check if Firestore is available
      if (!db) {
        console.warn('Firestore is not available, using mock data');
        return this.getMockUserData(userId);
      }

      // Get user document
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as UserData;

      // Get purchased odds that were updated after last sync
      if (lastSyncTimestamp > 0) {
        const purchasedOddsQuery = query(
          collection(db, 'users', userId, 'purchasedOdds'),
          where('timestamp', '>', lastSyncTimestamp)
        );

        const purchasedOddsSnapshot = await getDocs(purchasedOddsQuery);
        const purchasedOdds: PurchasedOdds[] = [];

        purchasedOddsSnapshot.forEach((doc) => {
          const data = doc.data();
          purchasedOdds.push({
            gameId: doc.id,
            timestamp: data.timestamp,
            platform: data.platform || 'unknown',
          });
        });

        userData.purchasedOdds = purchasedOdds;
      }

      return userData;
    } catch (error) {
      console.error('Error getting user data:', error);
      return this.getMockUserData(userId);
    }
  }

  /**
   * Get mock user data for development or when Firebase is unavailable
   * @param userId User ID
   * @returns Mock user data
   */
  private getMockUserData(userId: string): UserData {
    return {
      purchasedOdds: [],
      userPreferences: {
        favoriteTeams: [],
        primaryTeam: '',
        buttonSettings: {
          size: 'medium',
          animation: 'pulse',
          position: 'inline',
          style: 'default'
        },
        affiliateEnabled: true,
        affiliateCode: 'MOCK_CODE',
        lastUpdated: Date.now(),
        lastPlatform: Platform.OS
      },
      lastSyncTimestamp: Date.now()
    };
  }

  /**
   * Update user data in Firestore
   * @param userId User ID
   * @param data User data to update
   */
  async updateUserData(userId: string, data: UserData): Promise<void> {
    try {
      // Check if Firestore is available
      if (!db) {
        console.warn('Firestore is not available, skipping update');
        return;
      }

      // Get user document reference
      const userDocRef = doc(db, 'users', userId);

      // Check if user document exists
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          ...data,
          lastSyncTimestamp: Date.now(),
          lastUpdated: serverTimestamp(),
        });
      } else {
        // Create new document
        await setDoc(userDocRef, {
          ...data,
          lastSyncTimestamp: Date.now(),
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp(),
          platform: Platform.OS,
        });
      }

      // Update purchased odds subcollection
      if (data.purchasedOdds && data.purchasedOdds.length > 0) {
        for (const purchase of data.purchasedOdds) {
          const purchaseDocRef = doc(db, 'users', userId, 'purchasedOdds', purchase.gameId);
          await setDoc(purchaseDocRef, {
            timestamp: purchase.timestamp,
            platform: purchase.platform,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }

      console.log('User data updated successfully');
    } catch (error) {
      console.error('Error updating user data:', error);
      // Don't throw error in production, just log it
      if (__DEV__) {
        throw error;
      }
    }
  }

  /**
   * Get current user ID
   * @returns Current user ID or null if not authenticated
   */
  getCurrentUserId(): string | null {
    return this.userId || (auth ? auth.currentUser?.uid : null) || null;
  }
}

export const firebaseService = new FirebaseService();