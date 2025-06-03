/**
 * Recommendation Routes
 * Endpoints for personalized betting recommendations
 */

const express = require('express');

const router = express.Router();
const RecommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route GET /api/recommendations/user/:userId
 * @desc Get personalized betting recommendations for a user
 * @access Private
 */
router.get('/user/:userId', authenticate, RecommendationController.getUserRecommendations);

/**
 * @route GET /api/recommendations/trending
 * @desc Get trending bets among users
 * @access Public
 */
router.get('/trending', RecommendationController.getTrendingRecommendations);

/**
 * @route GET /api/recommendations/value
 * @desc Get value bets based on model vs. market odds
 * @access Public
 */
router.get('/value', RecommendationController.getValueBets);

/**
 * @route GET /api/recommendations/sport/:sportType
 * @desc Get recommendations for a specific sport
 * @access Public
 */
router.get('/sport/:sportType', RecommendationController.getRecommendationsBySport);

/**
 * @route GET /api/recommendations/daily
 * @desc Get daily recommended picks
 * @access Public
 */
router.get('/daily', RecommendationController.getDailyPicks);

/**
 * @route POST /api/recommendations/feedback
 * @desc Submit feedback on a recommendation
 * @access Private
 */
router.post('/feedback', authenticate, RecommendationController.submitRecommendationFeedback);

module.exports = router;
