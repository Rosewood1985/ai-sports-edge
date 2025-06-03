/**
 * User Routes
 * Endpoints for user preferences, history, and stats
 */

const express = require('express');

const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route GET /api/users/:userId/preferences
 * @desc Get user preferences
 * @access Private
 */
router.get('/:userId/preferences', authenticate, UserController.getUserPreferences);

/**
 * @route PUT /api/users/:userId/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put('/:userId/preferences', authenticate, UserController.updateUserPreferences);

/**
 * @route GET /api/users/:userId/history
 * @desc Get user betting history
 * @access Private
 */
router.get('/:userId/history', authenticate, UserController.getUserHistory);

/**
 * @route POST /api/users/:userId/history
 * @desc Add new bet to user history
 * @access Private
 */
router.post('/:userId/history', authenticate, UserController.addBetToHistory);

/**
 * @route GET /api/users/:userId/stats
 * @desc Get user betting statistics
 * @access Private
 */
router.get('/:userId/stats', authenticate, UserController.getUserStats);

/**
 * @route GET /api/users/:userId/recommendations
 * @desc Get personalized recommendations for user
 * @access Private
 */
router.get('/:userId/recommendations', authenticate, UserController.getUserRecommendations);

/**
 * @route POST /api/users/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', UserController.registerUser);

/**
 * @route POST /api/users/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', UserController.loginUser);

module.exports = router;
