/**
 * Services index file
 * Exports all services for easy importing
 */

// Odds Services
import oddsService from './OddsService';
import nbaOddsService from './NbaOddsService';
import wnbaOddsService from './WnbaOddsService';
import ncaaOddsService from './NcaaOddsService';
import mlbOddsService from './MlbOddsService';
import nhlOddsService from './NhlOddsService';
import ufcOddsService from './UfcOddsService';
import formula1OddsService from './Formula1OddsService';
import soccerOddsService from './SoccerOddsService';
import horseRacingOddsService from './HorseRacingOddsService';

// Weather Services
import weatherService from './weatherService';
import weatherAdjustmentService from './WeatherAdjustmentService';

// Other Services
import analyticsService from './analyticsService';
import firebaseService from './firebaseService';
import firebaseSubscriptionService from './firebaseSubscriptionService';
import personalizationService from './personalizationService';
import mlSportsEdgeService from './ml-sports-edge/MLSportsEdgeService';

// Export all services
export {
  // Odds Services
  oddsService,
  nbaOddsService,
  wnbaOddsService,
  ncaaOddsService,
  mlbOddsService,
  nhlOddsService,
  ufcOddsService,
  formula1OddsService,
  soccerOddsService,
  horseRacingOddsService,
  
  // Weather Services
  weatherService,
  weatherAdjustmentService,
  
  // Other Services
  analyticsService,
  firebaseService,
  firebaseSubscriptionService,
  personalizationService,
  mlSportsEdgeService
};