// ✅ MIGRATED: Firebase Atomic Architecture
import { firebaseService } from '../atomic';

/**
 * Firebase Service
 *
 * This file is maintained for backward compatibility.
 * It re-exports the atomic firebaseService.
 * New code should import directly from '../atomic'.
 */

// Re-export the atomic firebaseService
export { firebaseService };
export default firebaseService;
