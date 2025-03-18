/**
 * Admin Routes
 * Endpoints for model management and system administration
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const AdminController = require('../controllers/admin.controller');

// All admin routes require authentication and admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @route GET /api/admin/models/performance
 * @desc Get model performance metrics
 * @access Admin
 */
router.get('/models/performance', AdminController.getModelPerformance);

/**
 * @route POST /api/admin/models/retrain
 * @desc Trigger model retraining
 * @access Admin
 */
router.post('/models/retrain', AdminController.retrainModel);

/**
 * @route GET /api/admin/models/versions
 * @desc Get all model versions
 * @access Admin
 */
router.get('/models/versions', AdminController.getModelVersions);

/**
 * @route POST /api/admin/models/deploy
 * @desc Deploy a specific model version
 * @access Admin
 */
router.post('/models/deploy', AdminController.deployModel);

/**
 * @route POST /api/admin/data/sync
 * @desc Trigger data synchronization
 * @access Admin
 */
router.post('/data/sync', AdminController.syncData);

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Admin
 */
router.get('/users', AdminController.getAllUsers);

/**
 * @route GET /api/admin/stats
 * @desc Get system statistics
 * @access Admin
 */
router.get('/stats', AdminController.getSystemStats);

/**
 * @route POST /api/admin/feature-flags
 * @desc Update feature flags
 * @access Admin
 */
router.post('/feature-flags', AdminController.updateFeatureFlags);

module.exports = router;