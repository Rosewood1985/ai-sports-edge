import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'firebase/auth';
import {
  getFirestore,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  FirestoreError,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  FieldValue,
  increment as firestoreIncrement
} from 'firebase/firestore';
import { info, error as logError, LogCategory } from './loggingService';
import { safeErrorCapture } from './errorUtils';
import { FirebaseError } from 'firebase/app';
import { enhancedCacheService, CacheStrategy } from './enhancedCacheService';
import { auth, firestore } from '../config/firebase';

/**
 * User data interface with denormalized structure
 */
export interface OptimizedUserData {
  // Basic user info
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  
  // Embedded preferences (previously in separate collection)
  preferences?: {
    theme?: {
      preset: 'light' | 'dark' | 'team_colors';
      teamId?: string;
    };
    favoriteTeams?: string[];
    favoriteSports?: string[];
    favoriteLeagues?: string[];
    bettingInterests?: string[];
    notificationPreferences?: {
      highImpactNews: boolean;
      favoriteTeamNews: boolean;
      bettingOpportunities: boolean;
      injuryUpdates: boolean;
    };
  };
  
  // Embedded verification data (previously scattered across user document)
  verifications?: {
    ageVerification?: {
      confirmed: boolean;
      timestamp: string;
    };
    selfExclusionCheck?: {
      response: boolean;
      timestamp: string;
    };
    responsibleGamblingAcknowledgment?: {
      acknowledged: boolean;
      timestamp: string;
    };
    waiverAcceptance?: {
      accepted: boolean;
      timestamp: string;
    };
    gdprConsent?: {
      essentialConsent: boolean;
      marketingConsent?: boolean;
      analyticsConsent?: boolean;
      timestamp: string;
    };
    cookieConsent?: {
      essentialCookies: boolean;
      marketingCookies?: boolean;
      analyticsCookies?: boolean;
      timestamp: string;
    };
    [key: string]: any; // Allow any verification type
  };
  
  // Embedded streak data (for quick access)
  streaks?: {
    current: number;
    longest: number;
    lastActiveDate: any; // Firestore timestamp
    availableRewards: number;
  };
  
  // Embedded followed picks (limited to recent/active)
  followedPicks?: Record<string, {
    followedAt: any; // Firestore timestamp
    notificationEnabled: boolean;
  }>;
  
  // Metadata
  isPremium?: boolean;
  premiumExpiresAt?: any; // Firestore timestamp
  lastActive?: any; // Firestore timestamp
}

/**
 * Default user preferences
 */
const defaultPreferences = {
  theme: {
    preset: 'light' as const
  },
  favoriteTeams: [],
  favoriteSports: ['basketball', 'football', 'baseball'],
  favoriteLeagues: ['NBA', 'NFL', 'MLB'],
  bettingInterests: ['point-spreads', 'over-under'],
  notificationPreferences: {
    highImpactNews: true,
    favoriteTeamNews: true,
    bettingOpportunities: true,
    injuryUpdates: true
  }
};

/**
 * Get current user ID
 * @returns User ID or null if not authenticated
 */
const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

/**
 * Get user data with caching
 * @param userId User ID
 * @param options Cache options
 * @returns User data
 */
export const getUserData = async (
  userId?: string,
  options?: {
    forceRefresh?: boolean;
    strategy?: CacheStrategy;
  }
): Promise<OptimizedUserData | null> => {
  try {
    // Get user ID
    const uid = userId || getCurrentUserId();
    
    if (!uid) {
      console.warn('optimizedUserService: No user ID provided or user not authenticated');
      return null;
    }
    
    // Cache key
    const cacheKey = `user:${uid}`;
    
    // Get user data with caching
    const result = await enhancedCacheService.get<OptimizedUserData>(
      cacheKey,
      async () => {
        // Fetch from Firestore
        const userRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log(`optimizedUserService: User document does not exist for ${uid}`);
          // Return empty user data structure instead of null
          return {
            id: uid,
            preferences: defaultPreferences,
            verifications: {},
            streaks: {
              current: 0,
              longest: 0,
              lastActiveDate: serverTimestamp(),
              availableRewards: 0
            },
            followedPicks: {}
          };
        }
        
        const userData = userDoc.data() as OptimizedUserData;
        
        // Add ID to data
        userData.id = uid;
        
        // Fetch preferences if not embedded yet (for backward compatibility)
        if (!userData.preferences) {
          try {
            const prefsDocRef = firebaseService.firestore.firebaseService.firestore.doc(firebaseService.firestore.firebaseService.firestore.collection(userRef, 'preferences'), 'sports');
            const prefsDoc = await getDoc(prefsDocRef);
            
            if (prefsDoc.exists()) {
              userData.preferences = {
                ...defaultPreferences,
                ...prefsDoc.data()
              };
            } else {
              userData.preferences = defaultPreferences;
            }
          } catch (prefsError) {
            console.error('optimizedUserService: Error fetching preferences:', prefsError);
            userData.preferences = defaultPreferences;
          }
        }
        
        return userData;
      },
      {
        strategy: options?.strategy || CacheStrategy.CACHE_FIRST,
        forceRefresh: options?.forceRefresh || false,
        expiration: 1000 * 60 * 5 // 5 minutes
      }
    );
    
    return result.data;
  } catch (error) {
    console.error('optimizedUserService: Error getting user data:', error);
    logError(LogCategory.USER, 'Error getting user data', error as Error);
    safeErrorCapture(error as Error);
    return null;
  }
};

/**
 * Update user data with denormalized approach
 * @param userId User ID
 * @param data Data to update
 * @param options Update options
 * @returns Promise that resolves when the update is complete
 */
export const updateUserData = async (
  userId: string,
  data: Partial<OptimizedUserData>,
  options?: {
    merge?: boolean;
    invalidateCache?: boolean;
  }
): Promise<void> => {
  try {
    // Validate inputs
    if (!userId) {
      const error = new Error('User ID is required');
      console.error('optimizedUserService: Missing user ID for update');
      logError(LogCategory.USER, 'Missing user ID for update', error);
      safeErrorCapture(error);
      throw error;
    }
    
    if (!data || Object.keys(data).length === 0) {
      const error = new Error('Update data is required');
      console.error('optimizedUserService: Empty update data');
      logError(LogCategory.USER, 'Empty update data', error);
      safeErrorCapture(error);
      throw error;
    }
    
    const userRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'users', userId);
    
    // Add updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`optimizedUserService: Updating existing user document for ${userId}`);
      info(LogCategory.USER, 'Updating existing user document', { userId });
      
      // Update existing document
      if (options?.merge !== false) {
        await updateDoc(userRef, updateData);
      } else {
        // Replace document
        await setDoc(userRef, updateData);
      }
    } else {
      console.log(`optimizedUserService: Creating new user document for ${userId}`);
      info(LogCategory.USER, 'Creating new user document', { userId });
      
      // Create new document
      await setDoc(userRef, {
        ...updateData,
        createdAt: serverTimestamp()
      });
    }
    
    // Invalidate cache if requested
    if (options?.invalidateCache !== false) {
      await enhancedCacheService.invalidate(`user:${userId}`);
    }
    
    console.log(`optimizedUserService: User document updated successfully for ${userId}`);
    info(LogCategory.USER, 'User document updated successfully', { userId });
  } catch (error) {
    console.error('optimizedUserService: Error updating user data:', error);
    
    // Log the error with our logging service
    if (error instanceof FirebaseError) {
      console.error(`optimizedUserService: Firebase error code: ${error.code}`);
      logError(LogCategory.USER, `Firebase error (${error.code}) updating user data`, error);
    } else {
      logError(LogCategory.USER, 'Error updating user data', error as Error);
    }
    
    // Track the error with our error tracking service
    safeErrorCapture(error as Error);
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};

/**
 * Update user preferences with denormalized approach
 * @param userId User ID
 * @param preferences Preferences to update
 * @returns Promise that resolves when the update is complete
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<OptimizedUserData['preferences']>
): Promise<void> => {
  try {
    // Get current user data
    const userData = await getUserData(userId);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Merge with existing preferences
    const updatedPreferences = {
      ...userData.preferences,
      ...preferences
    };
    
    // Update user document with new preferences
    await updateUserData(userId, {
      preferences: updatedPreferences
    });
    
    // For backward compatibility, also update the preferences subcollection
    try {
      const userRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'users', userId);
      const prefsDocRef = firebaseService.firestore.firebaseService.firestore.doc(firebaseService.firestore.firebaseService.firestore.collection(userRef, 'preferences'), 'sports');
      
      await setDoc(prefsDocRef, updatedPreferences, { merge: true });
    } catch (prefsError) {
      console.error('optimizedUserService: Error updating preferences subcollection:', prefsError);
      // Don't throw here, as the main update was successful
    }
  } catch (error) {
    console.error('optimizedUserService: Error updating user preferences:', error);
    logError(LogCategory.USER, 'Error updating user preferences', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Add a team to favorite teams
 * @param userId User ID
 * @param teamName Team name
 */
export const addFavoriteTeam = async (userId: string, teamName: string): Promise<void> => {
  try {
    // Get current user data
    const userData = await getUserData(userId);
    
    if (!userData || !userData.preferences) {
      throw new Error('User preferences not found');
    }
    
    // Check if team is already in favorites
    const favoriteTeams = userData.preferences.favoriteTeams || [];
    if (!favoriteTeams.includes(teamName)) {
      // Add team to favorites
      favoriteTeams.push(teamName);
      
      // Update user preferences
      await updateUserPreferences(userId, {
        favoriteTeams
      });
    }
  } catch (error) {
    console.error('optimizedUserService: Error adding favorite team:', error);
    logError(LogCategory.USER, 'Error adding favorite team', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Remove a team from favorite teams
 * @param userId User ID
 * @param teamName Team name
 */
export const removeFavoriteTeam = async (userId: string, teamName: string): Promise<void> => {
  try {
    // Get current user data
    const userData = await getUserData(userId);
    
    if (!userData || !userData.preferences) {
      throw new Error('User preferences not found');
    }
    
    // Check if team is in favorites
    const favoriteTeams = userData.preferences.favoriteTeams || [];
    const index = favoriteTeams.indexOf(teamName);
    
    if (index !== -1) {
      // Remove team from favorites
      favoriteTeams.splice(index, 1);
      
      // Update user preferences
      await updateUserPreferences(userId, {
        favoriteTeams
      });
    }
  } catch (error) {
    console.error('optimizedUserService: Error removing favorite team:', error);
    logError(LogCategory.USER, 'Error removing favorite team', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Save verification data to the user's profile
 * @param userId User ID
 * @param verificationType Type of verification
 * @param data Verification data
 */
export const saveVerificationData = async (
  userId: string,
  verificationType: keyof OptimizedUserData['verifications'],
  data: any
): Promise<void> => {
  try {
    // Get current user data
    const userData = await getUserData(userId);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Create verifications object if it doesn't exist
    const verifications = userData.verifications || {};
    
    // Update verification data with type assertion
    verifications[verificationType as string] = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    // Update user document
    await updateUserData(userId, {
      verifications
    });
    
    // For audit purposes, also log to a separate collection
    try {
      const verificationRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'verifications', `${userId}_${verificationType}_${Date.now()}`);
      
      await setDoc(verificationRef, {
        userId,
        verificationType,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        createdAt: serverTimestamp()
      });
    } catch (auditError) {
      console.error('optimizedUserService: Error logging verification data to audit collection:', auditError);
      // Don't throw here, as the main update was successful
    }
  } catch (error) {
    console.error('optimizedUserService: Error saving verification data:', error);
    logError(LogCategory.USER, 'Error saving verification data', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Check if user has completed a specific verification
 * @param userId User ID
 * @param verificationType Type of verification
 * @returns Whether the verification is complete
 */
export const hasCompletedVerification = async (
  userId: string,
  verificationType: keyof OptimizedUserData['verifications']
): Promise<boolean> => {
  try {
    // Get user data
    const userData = await getUserData(userId);
    
    if (!userData || !userData.verifications) {
      return false;
    }
    
    // Check verification status
    const verification = userData.verifications[verificationType];
    
    if (!verification) {
      return false;
    }
    
    // Check specific verification types with type assertions
    switch (verificationType) {
      case 'ageVerification':
        return (verification as any).confirmed === true;
      case 'selfExclusionCheck':
        return (verification as any).response === false; // false means not on self-exclusion list
      case 'responsibleGamblingAcknowledgment':
        return (verification as any).acknowledged === true;
      case 'waiverAcceptance':
        return (verification as any).accepted === true;
      case 'gdprConsent':
        return (verification as any).essentialConsent === true;
      case 'cookieConsent':
        return (verification as any).essentialCookies === true;
      default:
        return false;
    }
  } catch (error) {
    console.error('optimizedUserService: Error checking verification status:', error);
    logError(LogCategory.USER, 'Error checking verification status', error as Error);
    safeErrorCapture(error as Error);
    return false;
  }
};

/**
 * Update user streak data
 * @param userId User ID
 * @param streakData Streak data to update
 */
export const updateUserStreak = async (
  userId: string,
  streakData: Partial<OptimizedUserData['streaks']> = {}
): Promise<void> => {
  try {
    // Get current user data
    const userData = await getUserData(userId);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Merge with existing streak data
    const currentStreaks = userData.streaks || {
      current: 0,
      longest: 0,
      lastActiveDate: serverTimestamp(),
      availableRewards: 0
    };
    
    const updatedStreaks = {
      ...currentStreaks,
      ...streakData,
      // Ensure all required properties are present
      current: (streakData.current !== undefined) ? streakData.current : currentStreaks.current,
      longest: (streakData.longest !== undefined) ? streakData.longest : currentStreaks.longest,
      availableRewards: (streakData.availableRewards !== undefined) ? streakData.availableRewards : currentStreaks.availableRewards,
      lastActiveDate: serverTimestamp()
    };
    
    // Update user document
    await updateUserData(userId, {
      streaks: updatedStreaks,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('optimizedUserService: Error updating user streak:', error);
    logError(LogCategory.USER, 'Error updating user streak', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Follow a pick
 * @param userId User ID
 * @param pickId Pick ID
 * @param notificationEnabled Whether notifications are enabled
 */
export const followPick = async (
  userId: string,
  pickId: string,
  notificationEnabled: boolean = true
): Promise<void> => {
  try {
    // Get current user data
    const userData = await getUserData(userId);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Create followedPicks object if it doesn't exist
    const followedPicks = userData.followedPicks || {};
    
    // Add pick to followed picks
    followedPicks[pickId] = {
      followedAt: serverTimestamp(),
      notificationEnabled
    };
    
    // Update user document
    await updateUserData(userId, {
      followedPicks
    });
    
    // Update pick followers count
    try {
      const pickRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'aiPicks', pickId);
      
      await updateDoc(pickRef, {
        followers: firestoreIncrement(1)
      });
    } catch (pickError) {
      console.error('optimizedUserService: Error updating pick followers count:', pickError);
      // Don't throw here, as the main update was successful
    }
  } catch (error) {
    console.error('optimizedUserService: Error following pick:', error);
    logError(LogCategory.USER, 'Error following pick', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Unfollow a pick
 * @param userId User ID
 * @param pickId Pick ID
 */
export const unfollowPick = async (
  userId: string,
  pickId: string
): Promise<void> => {
  try {
    // Get current user data
    const userData = await getUserData(userId);
    
    if (!userData || !userData.followedPicks) {
      throw new Error('User followed picks not found');
    }
    
    // Check if pick is followed
    if (userData.followedPicks[pickId]) {
      // Create new followed picks object without the pick
      const followedPicks = { ...userData.followedPicks };
      delete followedPicks[pickId];
      
      // Update user document
      await updateUserData(userId, {
        followedPicks
      });
      
      // Update pick followers count
      try {
        const pickRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'aiPicks', pickId);
        
        await updateDoc(pickRef, {
          followers: firestoreIncrement(-1)
        });
      } catch (pickError) {
        console.error('optimizedUserService: Error updating pick followers count:', pickError);
        // Don't throw here, as the main update was successful
      }
    }
  } catch (error) {
    console.error('optimizedUserService: Error unfollowing pick:', error);
    logError(LogCategory.USER, 'Error unfollowing pick', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * Get user's followed picks
 * @param userId User ID
 * @returns Followed picks
 */
export const getFollowedPicks = async (
  userId: string
): Promise<Record<string, {
  followedAt: any;
  notificationEnabled: boolean;
}> | null> => {
  try {
    // Get user data
    const userData = await getUserData(userId);
    
    if (!userData) {
      return null;
    }
    
    return userData.followedPicks || {};
  } catch (error) {
    console.error('optimizedUserService: Error getting followed picks:', error);
    logError(LogCategory.USER, 'Error getting followed picks', error as Error);
    safeErrorCapture(error as Error);
    return null;
  }
};


/**
 * Migrate existing user data to the denormalized structure
 * @param userId User ID
 */
export const migrateUserData = async (userId: string): Promise<void> => {
  try {
    console.log(`optimizedUserService: Migrating user data for ${userId}`);
    info(LogCategory.USER, 'Migrating user data', { userId });
    
    const userRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'users', userId);
    
    // Get user document
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`optimizedUserService: User document does not exist for ${userId}`);
      return;
    }
    
    const userData = userDoc.data() as any;
    
    // Create optimized user data
    const optimizedData: OptimizedUserData = {
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      phoneNumber: userData.phoneNumber,
      createdAt: userData.createdAt,
      updatedAt: serverTimestamp(),
      
      // Initialize embedded objects
      preferences: {},
      verifications: {},
      streaks: {
        current: 0,
        longest: 0,
        lastActiveDate: userData.lastActive || serverTimestamp(),
        availableRewards: 0
      },
      followedPicks: {} as Record<string, {
        followedAt: any;
        notificationEnabled: boolean;
      }>,
      
      // Metadata
      isPremium: userData.isPremium || false,
      premiumExpiresAt: userData.premiumExpiresAt,
      lastActive: userData.lastActive || serverTimestamp()
    };
    
    // Migrate preferences
    try {
      const prefsDocRef = firebaseService.firestore.firebaseService.firestore.doc(firebaseService.firestore.firebaseService.firestore.collection(userRef, 'preferences'), 'sports');
      const prefsDoc = await getDoc(prefsDocRef);
      
      if (prefsDoc.exists()) {
        optimizedData.preferences = prefsDoc.data() as any;
      } else {
        optimizedData.preferences = defaultPreferences;
      }
    } catch (prefsError) {
      console.error('optimizedUserService: Error migrating preferences:', prefsError);
      optimizedData.preferences = defaultPreferences;
    }
    
    // Migrate verifications
    optimizedData.verifications = {
      ageVerification: userData.ageVerification,
      selfExclusionCheck: userData.selfExclusionCheck,
      responsibleGamblingAcknowledgment: userData.responsibleGamblingAcknowledgment,
      waiverAcceptance: userData.waiverAcceptance,
      gdprConsent: userData.gdprConsent,
      cookieConsent: userData.cookieConsent
    };
    
    // Migrate streaks
    try {
      const streaksRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'userStreaks', userId);
      const streaksDoc = await getDoc(streaksRef);
      
      if (streaksDoc.exists()) {
        const streaksData = streaksDoc.data();
        optimizedData.streaks = {
          current: streaksData.currentStreak || 0,
          longest: streaksData.longestStreak || 0,
          lastActiveDate: streaksData.lastActiveDate || serverTimestamp(),
          availableRewards: streaksData.rewards?.availableRewards || 0
        };
      }
    } catch (streaksError) {
      console.error('optimizedUserService: Error migrating streaks:', streaksError);
    }
    
    // Migrate followed picks
    try {
      const userPicksRef = firebaseService.firestore.firebaseService.firestore.collection(firestore, 'userPicks');
      const userPicksQuery = firebaseService.firestore.firebaseService.firestore.query(userPicksRef, firebaseService.firestore.firebaseService.firestore.where('userId', '==', userId));
      const userPicksSnapshot = await getDocs(userPicksQuery);
      
      if (!userPicksSnapshot.empty) {
        userPicksSnapshot.forEach(doc => {
          const pickData = doc.data();
          // Ensure followedPicks is initialized
          if (!optimizedData.followedPicks) {
            optimizedData.followedPicks = {};
          }
          
          optimizedData.followedPicks[pickData.pickId] = {
            followedAt: pickData.followedAt,
            notificationEnabled: pickData.notificationEnabled || true
          };
        });
      }
    } catch (picksError) {
      console.error('optimizedUserService: Error migrating followed picks:', picksError);
    }
    
    // Update user document with optimized data
    await setDoc(userRef, optimizedData, { merge: true });
    
    console.log(`optimizedUserService: User data migration completed for ${userId}`);
    info(LogCategory.USER, 'User data migration completed', { userId });
  } catch (error) {
    console.error('optimizedUserService: Error migrating user data:', error);
    logError(LogCategory.USER, 'Error migrating user data', error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
};

export default {
  getUserData,
  updateUserData,
  updateUserPreferences,
  addFavoriteTeam,
  removeFavoriteTeam,
  saveVerificationData,
  hasCompletedVerification,
  updateUserStreak,
  followPick,
  unfollowPick,
  getFollowedPicks,
  migrateUserData
};