/**
 * Atomic Architecture Index
 * It provides a single entry point for importing components from any level.
 * This file exports all components from the atomic architecture.
 * 
 * Example usage:
 * import { firebaseService, themeProvider, MainLayout, HomePage } from './atomic';
 */

// Re-export all atoms
export * from './atoms';

// Re-export all molecules
export * from './molecules';

// Re-export all organisms
export * from './organisms';

// Re-export all pages
export * from './pages';

// Re-export all templates
export * from './templates';