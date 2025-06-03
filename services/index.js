/**
 * Services index file
 * Exports all services for easy importing
 */

// Odds Services
import formula1OddsService from './Formula1OddsService';
import horseRacingOddsService from './HorseRacingOddsService';
import mlbOddsService from './MlbOddsService';
import nbaOddsService from './NbaOddsService';
import ncaaOddsService from './NcaaOddsService';
import nhlOddsService from './NhlOddsService';
import oddsService from './OddsService';
import soccerOddsService from './SoccerOddsService';
import ufcOddsService from './UfcOddsService';

// Weather Services
import weatherAdjustmentService from './WeatherAdjustmentService';
import wnbaOddsService from './WnbaOddsService';

// Other Services
import analyticsService from './analyticsService';
import firebaseService from './firebaseService';
import firebaseSubscriptionService from './firebaseSubscriptionService';
import mlSportsEdgeService from './ml-sports-edge/MLSportsEdgeService';
import personalizationService from './personalizationService';
import weatherService from './weatherService';

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
  mlSportsEdgeService,
};
