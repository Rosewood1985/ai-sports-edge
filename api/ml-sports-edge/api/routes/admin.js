/**
 * Admin Routes
 * Provides endpoints for administrative functions
 */

const express = require('express');

const router = express.Router();
const logger = require('../../utils/logger');
const adminAuth = require('../middleware/adminAuth');
const authenticate = require('../middleware/authenticate');

// Import sub-routes
const selfLearningRoutes = require('./admin/self-learning');

// Use self-learning routes
router.use('/self-learning', selfLearningRoutes);

/**
 * @route GET /api/admin/status
 * @desc Get API status
 * @access Private (Admin only)
 */
router.get('/status', authenticate, adminAuth, (req, res) => {
  res.json({
    status: 'operational',
    version: process.env.API_VERSION || '1.0.0',
    timestamp: new Date(),
  });
});

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Private (Admin only)
 */
router.get('/users', authenticate, adminAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * @route GET /api/admin/predictions
 * @desc Get all predictions
 * @access Private (Admin only)
 */
router.get('/predictions', authenticate, adminAuth, async (req, res) => {
  try {
    const Prediction = require('../../models/Prediction');
    const { limit = 100, sport, confidence } = req.query;

    // Build query
    const query = {};

    if (sport) {
      query.sport = sport;
    }

    if (confidence) {
      const confidenceValue = parseFloat(confidence);
      if (!isNaN(confidenceValue)) {
        query['predictions.spread.confidence'] = { $gte: confidenceValue };
      }
    }

    const predictions = await Prediction.find(query).sort({ timestamp: -1 }).limit(parseInt(limit));

    res.json(predictions);
  } catch (error) {
    logger.error('Error getting predictions:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

/**
 * @route GET /api/admin/games
 * @desc Get all games
 * @access Private (Admin only)
 */
router.get('/games', authenticate, adminAuth, async (req, res) => {
  try {
    const Game = require('../../models/Game');
    const { limit = 100, sport, completed } = req.query;

    // Build query
    const query = {};

    if (sport) {
      query.sport = sport;
    }

    if (completed !== undefined) {
      query['result.completed'] = completed === 'true';
    }

    const games = await Game.find(query).sort({ date: -1 }).limit(parseInt(limit));

    res.json(games);
  } catch (error) {
    logger.error('Error getting games:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

/**
 * @route POST /api/admin/sync-data
 * @desc Sync data from external APIs
 * @access Private (Admin only)
 */
router.post('/sync-data', authenticate, adminAuth, async (req, res) => {
  try {
    const { source } = req.body;

    if (!source) {
      return res.status(400).json({ error: 'Source is required' });
    }

    logger.info(`Syncing data from ${source}`);

    // Implement data sync logic based on source
    let result;

    switch (source) {
      case 'odds':
        // Sync odds data
        result = { message: 'Odds data sync initiated' };
        break;
      case 'games':
        // Sync games data
        result = { message: 'Games data sync initiated' };
        break;
      case 'teams':
        // Sync teams data
        result = { message: 'Teams data sync initiated' };
        break;
      case 'players':
        // Sync players data
        result = { message: 'Players data sync initiated' };
        break;
      default:
        return res.status(400).json({ error: 'Invalid source' });
    }

    res.json({
      success: true,
      source,
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error syncing data:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

/**
 * @route GET /api/admin/logs
 * @desc Get API logs
 * @access Private (Admin only)
 */
router.get('/logs', authenticate, adminAuth, async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;

    // Implement log retrieval logic
    // This is a placeholder - in a real system, you would retrieve logs from a database or log file

    res.json({
      logs: [
        {
          level: 'info',
          message: 'API server started',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          level: 'info',
          message: 'Database connected',
          timestamp: new Date(Date.now() - 3590000),
        },
        {
          level: 'error',
          message: 'Failed to fetch odds data',
          timestamp: new Date(Date.now() - 1800000),
        },
      ],
      level,
      limit: parseInt(limit),
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

/**
 * @route POST /api/admin/clear-cache
 * @desc Clear API cache
 * @access Private (Admin only)
 */
router.post('/clear-cache', authenticate, adminAuth, async (req, res) => {
  try {
    const { cache } = req.body;

    if (!cache) {
      return res.status(400).json({ error: 'Cache type is required' });
    }

    logger.info(`Clearing ${cache} cache`);

    // Implement cache clearing logic based on cache type
    let result;

    switch (cache) {
      case 'predictions':
        // Clear predictions cache
        result = { message: 'Predictions cache cleared' };
        break;
      case 'games':
        // Clear games cache
        result = { message: 'Games cache cleared' };
        break;
      case 'odds':
        // Clear odds cache
        result = { message: 'Odds cache cleared' };
        break;
      case 'all':
        // Clear all caches
        result = { message: 'All caches cleared' };
        break;
      default:
        return res.status(400).json({ error: 'Invalid cache type' });
    }

    res.json({
      success: true,
      cache,
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router;
