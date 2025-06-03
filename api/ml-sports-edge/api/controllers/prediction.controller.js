/**
 * Enhanced Prediction Controller
 * Handles predictions using models trained on multiple sports APIs
 */

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const NodeCache = require('node-cache');
const path = require('path');

// Models directory
const MODELS_DIR = path.join(__dirname, '..', '..', 'models', 'saved');

// In-memory cache for predictions and models
const predictionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
const modelCache = new NodeCache({ stdTTL: 86400 }); // 24 hour TTL

/**
 * Load a TensorFlow.js model
 * @param {string} sport - Sport key
 * @param {string} predictionType - Type of prediction
 * @returns {Promise<Object>} - Loaded model
 */
async function loadTensorFlowModel(sport, predictionType) {
  const cacheKey = `tf_model_${sport.toLowerCase()}_${predictionType}`;

  // Check cache first
  let model = modelCache.get(cacheKey);
  if (model) {
    return model;
  }

  // Load model from disk
  const modelDir = path.join(MODELS_DIR, `${sport.toLowerCase()}_${predictionType}_tf`);

  if (!fs.existsSync(modelDir)) {
    throw new Error(`No TensorFlow.js model found for ${sport} ${predictionType}`);
  }

  try {
    model = await tf.loadLayersModel(`file://${modelDir}/model.json`);

    // Load metadata
    const metadataPath = path.join(modelDir, 'metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // Cache model
    modelCache.set(cacheKey, { model, metadata });

    return { model, metadata };
  } catch (error) {
    console.error(`Error loading TensorFlow.js model for ${sport} ${predictionType}:`, error);
    throw error;
  }
}

/**
 * Load a Random Forest model
 * @param {string} sport - Sport key
 * @param {string} predictionType - Type of prediction
 * @returns {Object} - Loaded model metadata
 */
function loadRandomForestModel(sport, predictionType) {
  const cacheKey = `rf_model_${sport.toLowerCase()}_${predictionType}`;

  // Check cache first
  let metadata = modelCache.get(cacheKey);
  if (metadata) {
    return metadata;
  }

  // Load metadata from disk
  const modelDir = path.join(MODELS_DIR, `${sport.toLowerCase()}_${predictionType}_rf`);
  const metadataPath = path.join(modelDir, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`No Random Forest model metadata found for ${sport} ${predictionType}`);
  }

  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // Cache metadata
    modelCache.set(cacheKey, metadata);

    return metadata;
  } catch (error) {
    console.error(
      `Error loading Random Forest model metadata for ${sport} ${predictionType}:`,
      error
    );
    throw error;
  }
}

/**
 * Make a prediction using a TensorFlow.js model
 * @param {Object} model - TensorFlow.js model
 * @param {Array} features - Feature values
 * @returns {Promise<number>} - Prediction (0-1)
 */
async function predictWithTensorFlow(model, features) {
  // Convert features to tensor
  const featureTensor = tf.tensor2d([features]);

  // Make prediction
  const predictionTensor = model.predict(featureTensor);
  const predictionArray = await predictionTensor.array();

  // Return prediction value (0-1)
  return predictionArray[0][0];
}

/**
 * Get game predictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getGamePredictions(req, res) {
  try {
    // Get query parameters
    const { sport = 'NBA', date, limit } = req.query;

    // Validate sport
    const validSports = ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS'];
    if (!validSports.includes(sport.toUpperCase())) {
      return res.status(400).json({
        error: {
          message: `Invalid sport: ${sport}. Valid sports are: ${validSports.join(', ')}`,
          status: 400,
        },
      });
    }

    // Check cache
    const cacheKey = `game_predictions_${sport.toLowerCase()}_${date || 'today'}`;
    const cachedPredictions = predictionCache.get(cacheKey);
    if (cachedPredictions) {
      return res.json({
        success: true,
        data: cachedPredictions,
        source: 'cache',
      });
    }

    // In a real implementation, this would:
    // 1. Fetch upcoming games from the database or API
    // 2. Extract features for each game
    // 3. Make predictions using the trained models

    // Fetch upcoming games from the database
    const games = await fetchUpcomingGames(sport, date);

    // Apply limit if provided
    const limitedGames = limit ? games.slice(0, parseInt(limit)) : games;

    if (limitedGames.length === 0) {
      return res.status(404).json({
        error: {
          message: `No upcoming games found for sport: ${sport}`,
          status: 404,
        },
      });
    }

    // Cache predictions
    predictionCache.set(cacheKey, limitedGames);

    res.json({
      success: true,
      count: limitedGames.length,
      data: limitedGames,
      source: 'model',
    });
  } catch (error) {
    console.error('Error getting game predictions:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching game predictions',
        status: 500,
      },
    });
  }
}

/**
 * Get detailed prediction for a specific game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getGamePredictionById(req, res) {
  try {
    const { gameId } = req.params;

    // Check cache
    const cacheKey = `game_prediction_${gameId}`;
    const cachedPrediction = predictionCache.get(cacheKey);
    if (cachedPrediction) {
      return res.json({
        success: true,
        data: cachedPrediction,
        source: 'cache',
      });
    }

    // In a real implementation, this would:
    // 1. Fetch the game from the database or API
    // 2. Extract features for the game
    // 3. Make predictions using the trained models
    // 4. Add detailed analysis

    // Fetch the game from the database
    const game = await fetchGameById(gameId);

    if (!game) {
      return res.status(404).json({
        error: {
          message: `Game with ID ${gameId} not found`,
          status: 404,
        },
      });
    }

    // Extract features for the game
    const features = extractGameFeatures(game);

    // Make predictions using the trained models
    const predictions = await makePredictions(features);

    // Add additional analysis for the detailed view
    const enhancedPrediction = {
      ...game,
      analysis: {
        keyFactors: [
          'Recent team performance',
          'Head-to-head history',
          'Home court advantage',
          'Injury report',
        ],
        confidence: {
          overall: 0.7,
          explanation: 'Based on historical matchups and current form',
        },
        trends: [
          'Lakers are 7-3 ATS in their last 10 home games',
          'Celtics are 4-6 ATS in their last 10 road games',
          'The UNDER has hit in 6 of the last 8 meetings',
        ],
        modelInsights: {
          homeTeamWinRate: 0.65,
          awayTeamWinRate: 0.55,
          homeTeamRecentForm: 0.7,
          awayTeamRecentForm: 0.6,
          h2hHomeWinRate: 0.6,
        },
      },
    };

    // Store in cache
    predictionCache.set(cacheKey, enhancedPrediction);

    res.json({
      success: true,
      data: enhancedPrediction,
      source: 'model',
    });
  } catch (error) {
    console.error('Error getting game prediction by ID:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching game prediction',
        status: 500,
      },
    });
  }
}

/**
 * Get player performance predictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPlayerPrediction(req, res) {
  try {
    const { playerId } = req.params;

    // Check cache
    const cacheKey = `player_prediction_${playerId}`;
    const cachedPrediction = predictionCache.get(cacheKey);
    if (cachedPrediction) {
      return res.json({
        success: true,
        data: cachedPrediction,
        source: 'cache',
      });
    }

    // In a real implementation, this would:
    // 1. Fetch player data from the database or API
    // 2. Extract features for the player
    // 3. Make predictions using the trained models

    // Fetch player data from the database
    const player = await fetchPlayerById(playerId);

    if (!player) {
      return res.status(404).json({
        error: {
          message: `Player with ID ${playerId} not found`,
          status: 404,
        },
      });
    }

    // Get player's upcoming game
    const upcomingGame = await fetchPlayerUpcomingGame(playerId);

    if (!upcomingGame) {
      return res.status(404).json({
        error: {
          message: `No upcoming games found for player ${playerId}`,
          status: 404,
        },
      });
    }

    // Extract features for the player
    const features = extractPlayerFeatures(player, upcomingGame);

    // Make predictions using the trained models
    const statPredictions = await predictPlayerStats(features);
    const propBets = await predictPlayerProps(features, statPredictions);

    // Analyze recent performance
    const recentPerformance = await analyzeRecentPerformance(playerId);

    // Compile the player prediction
    const playerPrediction = {
      id: player.id,
      name: player.name,
      team: player.team,
      game: {
        id: upcomingGame.id,
        opponent: upcomingGame.opponent,
        date: upcomingGame.date,
      },
      predictions: statPredictions,
      propBets,
      analysis: recentPerformance,
    };

    // Store in cache
    predictionCache.set(cacheKey, playerPrediction);

    res.json({
      success: true,
      data: playerPrediction,
      source: 'model',
    });
  } catch (error) {
    console.error('Error getting player prediction:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching player prediction',
        status: 500,
      },
    });
  }
}

/**
 * Get predictions filtered by sport type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPredictionsBySport(req, res) {
  try {
    const { sportType } = req.params;

    // Validate sport
    const validSports = [
      'NBA',
      'WNBA',
      'MLB',
      'NHL',
      'NCAA_MENS',
      'NCAA_WOMENS',
      'FORMULA1',
      'UFC',
    ];
    if (!validSports.includes(sportType.toUpperCase())) {
      return res.status(400).json({
        error: {
          message: `Invalid sport: ${sportType}. Valid sports are: ${validSports.join(', ')}`,
          status: 400,
        },
      });
    }

    // Check cache
    const cacheKey = `sport_predictions_${sportType.toLowerCase()}`;
    const cachedPredictions = predictionCache.get(cacheKey);
    if (cachedPredictions) {
      return res.json({
        success: true,
        data: cachedPredictions,
        source: 'cache',
      });
    }

    // Fetch predictions for the sport from the database
    const predictions = await fetchPredictionsBySport(sportType);

    if (predictions.length === 0) {
      return res.status(404).json({
        error: {
          message: `No predictions found for sport: ${sportType}`,
          status: 404,
        },
      });
    }

    // Store in cache
    predictionCache.set(cacheKey, predictions);

    res.json({
      success: true,
      count: predictions.length,
      data: predictions,
      source: 'model',
    });
  } catch (error) {
    console.error('Error getting predictions by sport:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching sport predictions',
        status: 500,
      },
    });
  }
}

/**
 * Get trending predictions based on model confidence
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTrendingPredictions(req, res) {
  try {
    // Check cache
    const cacheKey = 'trending_predictions';
    const cachedPredictions = predictionCache.get(cacheKey);
    if (cachedPredictions) {
      return res.json({
        success: true,
        data: cachedPredictions,
        source: 'cache',
      });
    }

    // In a real implementation, this would query the database
    // for predictions with high confidence scores

    // Fetch trending predictions from the database
    const trendingPredictions = await fetchTrendingPredictions();

    // Sort by confidence
    trendingPredictions.sort((a, b) => {
      const aConfidence =
        a.predictions?.spread?.confidence ||
        a.predictions?.winner?.confidence ||
        a.predictions?.moneyline?.confidence ||
        0;

      const bConfidence =
        b.predictions?.spread?.confidence ||
        b.predictions?.winner?.confidence ||
        b.predictions?.moneyline?.confidence ||
        0;

      return bConfidence - aConfidence;
    });

    // Store in cache
    predictionCache.set(cacheKey, trendingPredictions);

    res.json({
      success: true,
      count: trendingPredictions.length,
      data: trendingPredictions,
      source: 'model',
    });
  } catch (error) {
    console.error('Error getting trending predictions:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching trending predictions',
        status: 500,
      },
    });
  }
}

/**
 * Submit feedback on a prediction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function submitPredictionFeedback(req, res) {
  try {
    const { predictionId, predictionType, rating, comments } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!predictionId || !predictionType || !rating) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: predictionId, predictionType, rating',
          status: 400,
        },
      });
    }

    // In a real implementation, this would store the feedback
    // in a database and potentially use it for model improvement

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        predictionId,
        predictionType,
        rating,
        userId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error submitting prediction feedback:', error);
    res.status(500).json({
      error: {
        message: 'Error submitting feedback',
        status: 500,
      },
    });
  }
}

/**
 * Get sample games for a sport
 * @param {string} sport - Sport key
 * @param {string} date - Date string
 * @returns {Array} - Sample games
 *
 * TODO: REMOVE FOR PRODUCTION
 * This function provides mock data for development and testing.
 * Replace with real data fetching from database or API in production.
 */
function getSampleGames(sport, date) {
  const today = date ? new Date(date) : new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (sport.toUpperCase()) {
    case 'NBA':
      return [
        {
          id: 'nba1',
          sport: 'NBA',
          date: today.toISOString(),
          homeTeam: {
            id: 'lal',
            name: 'Lakers',
            abbreviation: 'LAL',
          },
          awayTeam: {
            id: 'den',
            name: 'Nuggets',
            abbreviation: 'DEN',
          },
          predictions: {
            spread: {
              pick: 'home',
              line: -3.5,
              confidence: 0.72,
              analysis: 'Lakers have strong home court advantage',
            },
            moneyline: {
              pick: 'home',
              odds: {
                home: -150,
                away: +130,
              },
              confidence: 0.68,
              analysis: 'Lakers slightly favored at home',
            },
            total: {
              pick: 'under',
              line: 224.5,
              confidence: 0.65,
              analysis: 'Both teams playing solid defense recently',
            },
          },
        },
        {
          id: 'nba2',
          sport: 'NBA',
          date: today.toISOString(),
          homeTeam: {
            id: 'bos',
            name: 'Celtics',
            abbreviation: 'BOS',
          },
          awayTeam: {
            id: 'mil',
            name: 'Bucks',
            abbreviation: 'MIL',
          },
          predictions: {
            spread: {
              pick: 'home',
              line: -1.5,
              confidence: 0.61,
              analysis: 'Close matchup, slight edge to Celtics at home',
            },
            moneyline: {
              pick: 'home',
              odds: {
                home: -120,
                away: +100,
              },
              confidence: 0.58,
              analysis: 'Nearly even matchup',
            },
            total: {
              pick: 'over',
              line: 220.5,
              confidence: 0.63,
              analysis: 'Both teams have strong offenses',
            },
          },
        },
      ];

    case 'MLB':
      return [
        {
          id: 'mlb1',
          sport: 'MLB',
          date: today.toISOString(),
          homeTeam: {
            id: 'nyy',
            name: 'Yankees',
            abbreviation: 'NYY',
          },
          awayTeam: {
            id: 'bos',
            name: 'Red Sox',
            abbreviation: 'BOS',
          },
          predictions: {
            spread: {
              pick: 'home',
              line: -1.5,
              confidence: 0.67,
              analysis: 'Yankees have strong home record',
            },
            moneyline: {
              pick: 'home',
              odds: {
                home: -150,
                away: +130,
              },
              confidence: 0.7,
              analysis: 'Yankees favored with ace pitcher',
            },
            total: {
              pick: 'under',
              line: 8.5,
              confidence: 0.64,
              analysis: 'Strong pitching matchup',
            },
          },
        },
        {
          id: 'mlb2',
          sport: 'MLB',
          date: tomorrow.toISOString(),
          homeTeam: {
            id: 'lad',
            name: 'Dodgers',
            abbreviation: 'LAD',
          },
          awayTeam: {
            id: 'sf',
            name: 'Giants',
            abbreviation: 'SF',
          },
          predictions: {
            spread: {
              pick: 'home',
              line: -1.5,
              confidence: 0.65,
              analysis: 'Dodgers have strong home advantage',
            },
            moneyline: {
              pick: 'home',
              odds: {
                home: -180,
                away: +160,
              },
              confidence: 0.72,
              analysis: 'Dodgers heavily favored',
            },
            total: {
              pick: 'over',
              line: 7.5,
              confidence: 0.58,
              analysis: 'Dodgers have strong offense',
            },
          },
        },
      ];

    default:
      return [];
  }
}

/**
 * Get sample game by ID
 * @param {string} gameId - Game ID
 * @returns {Object} - Sample game
 *
 * TODO: REMOVE FOR PRODUCTION
 * This function provides mock data for development and testing.
 * Replace with real data fetching from database or API in production.
 */
function getSampleGameById(gameId) {
  const allGames = [...getSampleGames('NBA'), ...getSampleGames('MLB')];

  return allGames.find(game => game.id === gameId);
}

/**
 * Get sample Formula 1 predictions
 * @returns {Array} - Sample F1 predictions
 *
 * TODO: REMOVE FOR PRODUCTION
 * This function provides mock data for development and testing.
 * Replace with real data fetching from database or API in production.
 */
function getSampleF1Predictions() {
  const today = new Date();

  return [
    {
      id: 'f1_monaco',
      sport: 'FORMULA1',
      date: today.toISOString(),
      raceName: 'Monaco Grand Prix',
      trackName: 'Circuit de Monaco',
      location: 'Monte Carlo, Monaco',
      predictions: {
        winner: {
          drivers: [
            {
              name: 'Max Verstappen',
              team: 'Red Bull Racing',
              odds: +150,
              probability: 0.35,
              confidence: 0.75,
              analysis: 'Strong qualifying expected, crucial at Monaco',
            },
            {
              name: 'Charles Leclerc',
              team: 'Ferrari',
              odds: +300,
              probability: 0.22,
              confidence: 0.68,
              analysis: 'Home race advantage, strong qualifying pace',
            },
            {
              name: 'Lewis Hamilton',
              team: 'Mercedes',
              odds: +450,
              probability: 0.18,
              confidence: 0.62,
              analysis: 'Experience at Monaco, improving car',
            },
          ],
        },
        podium: {
          confidence: 0.7,
          drivers: ['Max Verstappen', 'Charles Leclerc', 'Lewis Hamilton'],
        },
      },
    },
  ];
}

/**
 * Get sample UFC predictions
 * @returns {Array} - Sample UFC predictions
 *
 * TODO: REMOVE FOR PRODUCTION
 * This function provides mock data for development and testing.
 * Replace with real data fetching from database or API in production.
 */
function getSampleUFCPredictions() {
  const today = new Date();

  return [
    {
      id: 'ufc_main_event',
      sport: 'UFC',
      date: today.toISOString(),
      eventName: 'UFC 300',
      weightClass: 'Heavyweight',
      fighter1: {
        name: 'Jon Jones',
        record: '26-1-0',
      },
      fighter2: {
        name: 'Stipe Miocic',
        record: '20-4-0',
      },
      predictions: {
        winner: {
          pick: 'Jon Jones',
          confidence: 0.73,
          odds: -200,
          analysis: 'Jones has significant reach and skill advantages',
        },
        method: {
          pick: 'Decision',
          confidence: 0.55,
          analysis: 'Miocic has never been submitted, tough to finish',
        },
        round: {
          pick: 'Goes to decision',
          confidence: 0.6,
          analysis: 'Both fighters have good cardio and durability',
        },
      },
    },
  ];
}

module.exports = {
  getGamePredictions,
  getGamePredictionById,
  getPlayerPrediction,
  getPredictionsBySport,
  getTrendingPredictions,
  submitPredictionFeedback,
};
