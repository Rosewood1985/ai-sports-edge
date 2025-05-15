import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  limit,
  Firestore,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'firebase/auth';
import { info, error as logError, LogCategory } from '../services/loggingService';
import { safeErrorCapture } from '../services/errorUtils';
import { firebaseMonitoringService, FirebaseOperationType, FirebaseServiceType } from '../services/firebaseMonitoringService';
import { OptimizedUserData } from '../services/optimizedUserService';

// Import Firebase services
import * as firebaseConfig from '../config/firebase';

// Get Firebase services with type assertions
const auth = firebaseConfig.auth as Auth;
const firestore = firebaseConfig.firestore as Firestore;

/**
 * Migration progress interface
 */
export interface MigrationProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * Migration options interface
 */
export interface MigrationOptions {
  batchSize?: number;
  onProgress?: (progress: MigrationProgress) => void;
  dryRun?: boolean;
  skipExisting?: boolean;
}

/**
 * Default migration options
 */
const defaultMigrationOptions: MigrationOptions = {
  batchSize: 100,
  dryRun: false,
  skipExisting: true
};

/**
 * Migrate user data to the optimized structure
 * @param userIds User IDs to migrate (optional, if not provided, all users will be migrated)
 * @param options Migration options
 * @returns Migration progress
 */
export async function migrateUserData(
  userIds?: string[],
  options?: MigrationOptions
): Promise<MigrationProgress> {
  const opts = { ...defaultMigrationOptions, ...options };
  
  // Initialize progress
  const progress: MigrationProgress = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    startTime: Date.now(),
    status: 'running'
  };
  
  try {
    console.log('dataMigrationUtils: Starting user data migration');
    info(LogCategory.STORAGE, 'Starting user data migration', { userIds: userIds?.length || 'all' });
    
    // Get users to migrate
    let usersToMigrate: QueryDocumentSnapshot<DocumentData>[] = [];
    
    if (userIds && userIds.length > 0) {
      // Get specific users
      progress.total = userIds.length;
      
      // Get users in batches to avoid large IN queries
      const batchSize = 10; // Firestore IN queries are limited to 10 items
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batchIds = userIds.slice(i, i + batchSize);
        const usersRef = firebaseService.firestore.firebaseService.firestore.collection(firestore, 'users');
        const usersQuery = firebaseService.firestore.firebaseService.firestore.query(usersRef, firebaseService.firestore.firebaseService.firestore.where('__name__', 'in', batchIds));
        const usersSnapshot = await getDocs(usersQuery);
        
        usersToMigrate = [...usersToMigrate, ...usersSnapshot.docs];
      }
    } else {
      // Get all users
      const usersRef = firebaseService.firestore.firebaseService.firestore.collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      usersToMigrate = usersSnapshot.docs;
      progress.total = usersSnapshot.size;
    }
    
    // Update progress
    if (opts.onProgress) {
      opts.onProgress({ ...progress });
    }
    
    // Process users in batches
    const batchSize = opts.batchSize || 100;
    for (let i = 0; i < usersToMigrate.length; i += batchSize) {
      const userBatch = usersToMigrate.slice(i, i + batchSize);
      
      // Process batch
      await Promise.all(userBatch.map(async (userDoc) => {
        const userId = userDoc.id;
        
        try {
          // Start timing
          const startTime = Date.now();
          
          // Check if user already has optimized data
          if (opts.skipExisting) {
            const userData = userDoc.data();
            
            // Check if user already has embedded preferences
            if (userData.preferences) {
              progress.processed++;
              progress.skipped++;
              return;
            }
          }
          
          // Migrate user data
          if (!opts.dryRun) {
            await migrateUser(userId);
          }
          
          // End timing
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          // Track operation
          firebaseMonitoringService.trackOperation({
            type: FirebaseOperationType.BATCH,
            service: FirebaseServiceType.FIRESTORE,
            path: `users/${userId}`,
            duration,
            success: true,
            metadata: {
              operation: 'migrateUser',
              dryRun: opts.dryRun
            }
          });
          
          // Update progress
          progress.processed++;
          progress.succeeded++;
        } catch (error) {
          // Update progress
          progress.processed++;
          progress.failed++;
          
          // Add error
          const errorMessage = error instanceof Error ? error.message : String(error);
          progress.errors.push({
            id: userId,
            error: errorMessage
          });
          
          // Log error
          console.error(`dataMigrationUtils: Error migrating user ${userId}:`, error);
          logError(LogCategory.STORAGE, `Error migrating user ${userId}`, error as Error);
          safeErrorCapture(error as Error);
        }
      }));
      
      // Update progress
      if (opts.onProgress) {
        opts.onProgress({ ...progress });
      }
    }
    
    // Complete migration
    progress.endTime = Date.now();
    progress.status = 'completed';
    
    console.log('dataMigrationUtils: User data migration completed', {
      total: progress.total,
      succeeded: progress.succeeded,
      failed: progress.failed,
      skipped: progress.skipped,
      duration: `${(progress.endTime - progress.startTime) / 1000}s`
    });
    
    info(LogCategory.STORAGE, 'User data migration completed', {
      total: progress.total,
      succeeded: progress.succeeded,
      failed: progress.failed,
      skipped: progress.skipped,
      duration: `${(progress.endTime - progress.startTime) / 1000}s`
    });
    
    return progress;
  } catch (error) {
    // Failed migration
    progress.endTime = Date.now();
    progress.status = 'failed';
    
    console.error('dataMigrationUtils: User data migration failed:', error);
    logError(LogCategory.STORAGE, 'User data migration failed', error as Error);
    safeErrorCapture(error as Error);
    
    return progress;
  }
}

/**
 * Migrate a single user to the optimized structure
 * @param userId User ID
 */
export async function migrateUser(userId: string): Promise<void> {
  try {
    console.log(`dataMigrationUtils: Migrating user ${userId}`);
    
    // Get user document
    const userRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error(`User ${userId} not found`);
    }
    
    const userData = userDoc.data();
    
    // Create optimized user data
    const optimizedData: Partial<OptimizedUserData> = {
      id: userId,
      updatedAt: new Date(),
      
      // Initialize embedded objects
      preferences: {},
      verifications: {},
      streaks: {
        current: 0,
        longest: 0,
        lastActiveDate: userData.lastActive || new Date(),
        availableRewards: 0
      },
      followedPicks: {}
    };
    
    // Migrate preferences
    try {
      const prefsDocRef = firebaseService.firestore.firebaseService.firestore.doc(firebaseService.firestore.firebaseService.firestore.collection(userRef, 'preferences'), 'sports');
      const prefsDoc = await getDoc(prefsDocRef);
      
      if (prefsDoc.exists()) {
        optimizedData.preferences = prefsDoc.data();
      }
    } catch (prefsError) {
      console.error(`dataMigrationUtils: Error migrating preferences for user ${userId}:`, prefsError);
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
          lastActiveDate: streaksData.lastActiveDate || userData.lastActive || new Date(),
          availableRewards: streaksData.rewards?.availableRewards || 0
        };
      }
    } catch (streaksError) {
      console.error(`dataMigrationUtils: Error migrating streaks for user ${userId}:`, streaksError);
    }
    
    // Migrate followed picks
    try {
      const userPicksRef = firebaseService.firestore.firebaseService.firestore.collection(firestore, 'userPicks');
      const userPicksQuery = firebaseService.firestore.firebaseService.firestore.query(userPicksRef, firebaseService.firestore.firebaseService.firestore.where('userId', '==', userId), firebaseService.firestore.firebaseService.firestore.limit(100));
      const userPicksSnapshot = await getDocs(userPicksQuery);
      
      if (!userPicksSnapshot.empty) {
        const followedPicks: Record<string, any> = {};
        
        userPicksSnapshot.forEach(doc => {
          const pickData = doc.data();
          followedPicks[pickData.pickId] = {
            followedAt: pickData.followedAt || new Date(),
            notificationEnabled: pickData.notificationEnabled || true
          };
        });
        
        optimizedData.followedPicks = followedPicks;
      }
    } catch (picksError) {
      console.error(`dataMigrationUtils: Error migrating followed picks for user ${userId}:`, picksError);
    }
    
    // Update user document
    const batch = writeBatch(firestore);
    batch.update(userRef, optimizedData);
    await batch.commit();
    
    console.log(`dataMigrationUtils: User ${userId} migrated successfully`);
  } catch (error) {
    console.error(`dataMigrationUtils: Error migrating user ${userId}:`, error);
    logError(LogCategory.STORAGE, `Error migrating user ${userId}`, error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
}

/**
 * Rollback user data migration
 * @param userId User ID
 */
export async function rollbackUserMigration(userId: string): Promise<void> {
  try {
    console.log(`dataMigrationUtils: Rolling back migration for user ${userId}`);
    
    // Get user document
    const userRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Remove embedded data
    const batch = writeBatch(firestore);
    batch.update(userRef, {
      preferences: null,
      verifications: null,
      streaks: null,
      followedPicks: null
    });
    await batch.commit();
    
    console.log(`dataMigrationUtils: Migration rollback for user ${userId} completed`);
  } catch (error) {
    console.error(`dataMigrationUtils: Error rolling back migration for user ${userId}:`, error);
    logError(LogCategory.STORAGE, `Error rolling back migration for user ${userId}`, error as Error);
    safeErrorCapture(error as Error);
    throw error;
  }
}

export default {
  migrateUserData,
  migrateUser,
  rollbackUserMigration
};