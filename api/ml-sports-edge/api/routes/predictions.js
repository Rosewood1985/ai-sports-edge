/**
 * Prediction Routes
 * Endpoints for game and player predictions
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const PredictionController = require('../controllers/prediction.controller');

/**
 * @route GET /api/predictions/games
 * @desc Get predictions for upcoming games
 * @access Public
 */
router.get('/games', PredictionController.getGamePredictions);

/**
 * @route GET /api/predictions/games/:gameId
 * @desc Get detailed prediction for a specific game
 * @access Public
 */
router.get('/games/:gameId', PredictionController.getGamePredictionById);

/**
 * @route GET /api/predictions/players/:playerId
 * @desc Get player performance predictions
 * @access Public
 */
router.get('/players/:playerId', PredictionController.getPlayerPrediction);

/**
 * @route GET /api/predictions/sports/:sportType
 * @desc Get predictions filtered by sport type
 * @access Public
 */
router.get('/sports/:sportType', PredictionController.getPredictionsBySport);

/**
 * @route GET /api/predictions/trending
 * @desc Get trending predictions based on model confidence
 * @access Public
 */
router.get('/trending', PredictionController.getTrendingPredictions);

/**
 * @route POST /api/predictions/feedback
 * @desc Submit feedback on a prediction
 * @access Private
 */
router.post('/feedback', authenticate, PredictionController.submitPredictionFeedback);

module.exports = router;