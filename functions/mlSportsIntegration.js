/**
 * ML Sports Integration - Connect All Sports Data to ML Model
 * AI Sports Edge - Complete sports data integration for ML predictions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { wrapScheduledFunction, captureCloudFunctionError, trackFunctionPerformance } = require("./sentryConfig");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firestore
const db = admin.firestore();

// Sports configuration for ML integration
const SPORTS_CONFIG = {
  // Core sports already integrated
  "basketball_nba": {
    collection: "nba_games",
    oddsMarkets: ["h2h", "spreads", "totals"],
    features: ["momentum", "homeAdvantage", "recentForm", "headToHead"],
    predictionWeight: 1.05,
    mlModelKey: "NBA"
  },
  "americanfootball_nfl": {
    collection: "nfl_games",
    oddsMarkets: ["h2h", "spreads", "totals"],
    features: ["momentum", "homeAdvantage", "weatherImpact", "injuryReport"],
    predictionWeight: 1.1,
    mlModelKey: "NFL"
  },
  "baseball_mlb": {
    collection: "mlb_games",
    oddsMarkets: ["h2h", "spreads", "totals"],
    features: ["pitcherMatchup", "ballparkFactors", "weatherImpact", "bullpenDepth"],
    predictionWeight: 0.95,
    mlModelKey: "MLB"
  },
  // Hockey integration
  "icehockey_nhl": {
    collection: "nhl_games",
    oddsMarkets: ["h2h", "spreads", "totals"],
    features: ["goaltenderStats", "powerPlayEfficiency", "penaltyKill", "shotQuality"],
    predictionWeight: 0.9,
    mlModelKey: "NHL"
  },
  // College sports
  "basketball_ncaab": {
    collection: "ncaab_games",
    oddsMarkets: ["h2h", "spreads", "totals"],
    features: ["momentum", "homeAdvantage", "tournamentExperience", "coachingAdjustments"],
    predictionWeight: 0.85,
    mlModelKey: "NCAAB"
  },
  "americanfootball_ncaaf": {
    collection: "ncaaf_games",
    oddsMarkets: ["h2h", "spreads", "totals"],
    features: ["momentum", "homeAdvantage", "recruitingClass", "bowlExperience"],
    predictionWeight: 0.9,
    mlModelKey: "NCAAF"
  },
  // Combat sports (already integrated)
  "mma_ufc": {
    collection: "ufc_events",
    oddsMarkets: ["h2h", "method", "rounds"],
    features: ["fightingStyle", "reachAdvantage", "experienceLevel", "weightCutImpact"],
    predictionWeight: 1.15,
    mlModelKey: "UFC"
  },
  // Soccer integration
  "soccer_epl": {
    collection: "soccer_games",
    oddsMarkets: ["h2h", "spreads", "totals"],
    features: ["formGuide", "homeAdvantage", "keyPlayerAvailability", "tacticalMatchup"],
    predictionWeight: 0.8,
    mlModelKey: "Soccer"
  },
  // Tennis integration
  "tennis_atp": {
    collection: "tennis_matches",
    oddsMarkets: ["h2h", "sets", "games"],
    features: ["surfaceAdvantage", "recentForm", "headToHeadRecord", "physicalCondition"],
    predictionWeight: 1.0,
    mlModelKey: "Tennis"
  },
  // Golf integration
  "golf_pga": {
    collection: "golf_tournaments",
    oddsMarkets: ["outright", "top10", "matchups"],
    features: ["courseHistory", "recentForm", "weatherConditions", "puttingStats"],
    predictionWeight: 0.75,
    mlModelKey: "Golf"
  },
  // Racing integration (horse racing already handled separately)
  "motorsport_f1": {
    collection: "f1_races",
    oddsMarkets: ["outright", "podium", "fastest_lap"],
    features: ["trackRecord", "carPerformance", "weatherConditions", "gridPosition"],
    predictionWeight: 1.2,
    mlModelKey: "Formula1"
  }
};

/**
 * Comprehensive sports data integration for ML predictions
 * Runs daily to ensure all sports have data connected to ML model
 */
exports.integrateAllSportsToML = wrapScheduledFunction(
  "integrateAllSportsToML",
  "0 8 * * *", // 8 AM daily
  onSchedule("0 8 * * *", async (event) => {
    const startTime = Date.now();
    console.log("Starting comprehensive sports ML integration...");
    
    try {
      const integrationResults = {};
      
      // Process each sport configuration
      for (const [sportKey, config] of Object.entries(SPORTS_CONFIG)) {
        console.log(`Processing ${sportKey} for ML integration...`);
        
        try {
          const sportResult = await integrateSportToML(sportKey, config);
          integrationResults[sportKey] = sportResult;
          
          console.log(`✅ ${sportKey}: ${sportResult.gamesProcessed} games integrated`);
        } catch (error) {
          console.error(`❌ Error processing ${sportKey}:`, error);
          integrationResults[sportKey] = { error: error.message, gamesProcessed: 0 };
          
          captureCloudFunctionError(error, "integrateAllSportsToML", {
            sport: sportKey,
            config: config
          });
        }
      }
      
      // Save integration summary
      await db.collection("ml_integration_logs").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        results: integrationResults,
        totalSports: Object.keys(SPORTS_CONFIG).length,
        successfulSports: Object.values(integrationResults).filter(r => !r.error).length
      });
      
      trackFunctionPerformance("integrateAllSportsToML", Date.now() - startTime, true);
      
      console.log("✅ Sports ML integration completed successfully");
      return integrationResults;
      
    } catch (error) {
      console.error("❌ Error in sports ML integration:", error);
      captureCloudFunctionError(error, "integrateAllSportsToML");
      trackFunctionPerformance("integrateAllSportsToML", Date.now() - startTime, false);
      throw error;
    }
  })
);

/**
 * Integrate a specific sport into the ML prediction system
 */
async function integrateSportToML(sportKey, config) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Query games for the sport from the specified collection
  const gamesRef = db.collection(config.collection);
  const gamesQuery = gamesRef
    .where("gameDate", ">=", today.toISOString().split("T")[0])
    .where("gameDate", "<=", tomorrow.toISOString().split("T")[0])
    .where("sport", "==", config.mlModelKey);
  
  const gamesSnapshot = await gamesQuery.get();
  
  if (gamesSnapshot.empty) {
    return { gamesProcessed: 0, message: "No games found for today" };
  }
  
  let processedCount = 0;
  
  // Process each game for ML prediction readiness
  for (const gameDoc of gamesSnapshot.docs) {
    const gameData = gameDoc.data();
    
    // Prepare ML features based on sport-specific configuration
    const mlFeatures = await prepareMlFeatures(gameData, config);
    
    // Update game document with ML-ready features
    await gameDoc.ref.update({
      mlFeatures: mlFeatures,
      mlReadyTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      mlModelKey: config.mlModelKey,
      predictionWeight: config.predictionWeight,
      lastMLUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    processedCount++;
  }
  
  return { 
    gamesProcessed: processedCount,
    collection: config.collection,
    mlModelKey: config.mlModelKey
  };
}

/**
 * Prepare ML features for a specific sport
 */
async function prepareMlFeatures(gameData, config) {
  const features = {};
  
  // Base features common to all sports
  features.momentumScore = gameData.momentumScore || 0;
  features.lineMovement = gameData.lineMovement || 0;
  features.publicBetPct = gameData.publicBetPct || 50;
  features.confidence = gameData.confidence || 0;
  features.isHomeTeam = gameData.isHomeTeam || false;
  features.streakIndicator = gameData.streakIndicator || 0;
  
  // Sport-specific feature engineering
  for (const feature of config.features) {
    switch (feature) {
    case "momentum":
      features.teamAMomentum = await calculateTeamMomentum(gameData.teamA, config.mlModelKey);
      features.teamBMomentum = await calculateTeamMomentum(gameData.teamB, config.mlModelKey);
      break;
        
    case "homeAdvantage":
      features.homeAdvantageScore = await calculateHomeAdvantage(gameData.venue, config.mlModelKey);
      break;
        
    case "weatherImpact":
      if (gameData.weather) {
        features.weatherScore = calculateWeatherImpact(gameData.weather, config.mlModelKey);
      }
      break;
        
    case "recentForm":
      features.teamAForm = await calculateRecentForm(gameData.teamA, config.mlModelKey);
      features.teamBForm = await calculateRecentForm(gameData.teamB, config.mlModelKey);
      break;
        
    case "headToHead":
      features.headToHeadAdvantage = await calculateHeadToHeadRecord(
        gameData.teamA, 
        gameData.teamB, 
        config.mlModelKey
      );
      break;
        
    default:
      // Sport-specific features can be handled here
      if (gameData[feature]) {
        features[feature] = gameData[feature];
      }
    }
  }
  
  return features;
}

/**
 * Helper functions for feature calculation
 */
async function calculateTeamMomentum(teamId, sport) {
  // Calculate team momentum based on recent performance
  // This would typically look at the last 5-10 games
  return Math.random() * 100; // Placeholder - implement actual logic
}

async function calculateHomeAdvantage(venue, sport) {
  // Calculate home field/court advantage for specific venue
  return Math.random() * 10; // Placeholder - implement actual logic
}

function calculateWeatherImpact(weatherData, sport) {
  // Calculate how weather affects game outcome (mainly for outdoor sports)
  const outdoorSports = ["NFL", "MLB", "Soccer", "Golf", "Formula1"];
  if (!outdoorSports.includes(sport)) return 0;
  
  return Math.random() * 5; // Placeholder - implement actual logic
}

async function calculateRecentForm(teamId, sport) {
  // Calculate team's recent form over last few games
  return Math.random() * 100; // Placeholder - implement actual logic
}

async function calculateHeadToHeadRecord(teamA, teamB, sport) {
  // Calculate head-to-head advantage based on historical matchups
  return Math.random() * 20 - 10; // Placeholder - implement actual logic
}

/**
 * Export individual sport integration functions for testing
 */
exports.integrateSportToML = integrateSportToML;
exports.prepareMlFeatures = prepareMlFeatures;
exports.SPORTS_CONFIG = SPORTS_CONFIG;

console.log("ML Sports Integration module loaded successfully");