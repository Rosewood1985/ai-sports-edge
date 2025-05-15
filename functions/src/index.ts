import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'firebase-functions';
import { loadRemoteConfig } from './config';

// Log when the functions are initialized
functions.logger.info('Firebase Functions initializing');

// Load Remote Config values before exporting functions
(async () => {
  try {
    // Load Remote Config values
    await loadRemoteConfig();
    
    // Now export the functions
    functions.logger.info('Remote Config loaded, exporting functions');
  } catch (error) {
    functions.logger.error('Error loading Remote Config:', error);
    functions.logger.info('Continuing with default values');
  }
})();

// Export all functions
export { predictTodayGames } from './predictTodayGames';
export { markAIPickOfDay } from './markAIPickOfDay';
export { updateStatsPage } from './updateStatsPage';

functions.logger.info('Firebase Functions initialized');