/**
 * Atomic Architecture Index
 * Main entry point for atomic architecture components
 */

// Export atoms
export * from './atoms';

// Export molecules
export * from './molecules';

// Export organisms
export * from './organisms';

// Direct export of services for convenience
export { firebaseService, analyticsService } from './organisms';