/**
 * Lazy loaded components
 * This file centralizes all lazy-loaded components to make imports cleaner
 */

import { createLazyComponent } from '../utils/codeSplitting';

// Lazy load OddsMovementAlerts component
export const LazyOddsMovementAlerts = createLazyComponent(
  () => import('./OddsMovementAlerts'),
  { text: 'Loading alerts...' }
);

// Lazy load ParlayIntegration component
export const LazyParlayIntegration = createLazyComponent(
  () => import('./ParlayIntegration'),
  { size: 'small' }
);

// Lazy load SportSelector component
export const LazySportSelector = createLazyComponent(
  () => import('./SportSelector'),
  { size: 'small', text: 'Loading sports...' }
);