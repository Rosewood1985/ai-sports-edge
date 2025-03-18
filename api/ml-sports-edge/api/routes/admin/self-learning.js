/**
 * Self-Learning Admin Routes
 * Provides endpoints for managing the self-learning system
 */

const express = require('express');
const router = express.Router();
const SelfLearningService = require('../../../services/SelfLearningService');
const ModelRegistry = require('../../../ml/ModelRegistry');
const authenticate = require('../../middleware/authenticate');
const adminAuth = require('../../middleware/adminAuth');
const logger = require('../../../utils/logger');

// Initialize ModelRegistry
const modelRegistry = new ModelRegistry();
modelRegistry.initialize().catch(err => {
  logger.error('Failed to initialize ModelRegistry:', err);
});

/**
 * @route GET /api/admin/self-learning/status
 * @desc Get self-learning system status
 * @access Private (Admin only)
 */
router.get('/status', authenticate, adminAuth, async (req, res) => {
  try {
    // Get active model versions
    const activeVersions = modelRegistry.getActiveVersions();
    
    // Get model performance metrics
    const spreadMetrics = await SelfLearningService.performanceEvaluator.evaluateSpreadModel();
    const overUnderMetrics = await SelfLearningService.performanceEvaluator.evaluateOverUnderModel();
    const moneylineMetrics = await SelfLearningService.performanceEvaluator.evaluateMoneylineModel();
    const scoreMetrics = await SelfLearningService.performanceEvaluator.evaluateScoreModel();
    
    res.json({
      activeVersions,
      performance: {
        spread: spreadMetrics,
        overUnder: overUnderMetrics,
        moneyline: moneylineMetrics,
        score: scoreMetrics
      },
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error getting self-learning status:', error);
    res.status(500).json({ error: 'Failed to get self-learning status' });
  }
});

/**
 * @route POST /api/admin/self-learning/trigger
 * @desc Manually trigger the self-learning cycle
 * @access Private (Admin only)
 */
router.post('/trigger', authenticate, adminAuth, async (req, res) => {
  try {
    logger.info('Manually triggering self-learning cycle');
    
    // Trigger self-learning cycle
    await SelfLearningService.triggerSelfLearningCycle();
    
    res.json({ 
      success: true, 
      message: 'Self-learning cycle triggered successfully',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error triggering self-learning cycle:', error);
    res.status(500).json({ error: 'Failed to trigger self-learning cycle' });
  }
});

/**
 * @route POST /api/admin/self-learning/retrain
 * @desc Manually retrain models
 * @access Private (Admin only)
 */
router.post('/retrain', authenticate, adminAuth, async (req, res) => {
  try {
    logger.info('Manually retraining models');
    
    // Prepare training data
    const trainingData = await SelfLearningService.retrainingOrchestrator.prepareTrainingData();
    
    // Retrain models
    const results = await SelfLearningService.retrainingOrchestrator.retrainModels(trainingData);
    
    // Register new models
    await modelRegistry.registerModels(results.models, results.versions);
    
    res.json({
      success: true,
      message: 'Models retrained successfully',
      versions: results.versions,
      performance: results.performance,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error retraining models:', error);
    res.status(500).json({ error: 'Failed to retrain models' });
  }
});

/**
 * @route POST /api/admin/self-learning/deploy
 * @desc Deploy model versions
 * @access Private (Admin only)
 */
router.post('/deploy', authenticate, adminAuth, async (req, res) => {
  try {
    const { versions } = req.body;
    
    if (!versions || typeof versions !== 'object') {
      return res.status(400).json({ error: 'Invalid versions object' });
    }
    
    logger.info('Deploying model versions:', versions);
    
    // Deploy models
    await modelRegistry.deployModels(versions);
    
    res.json({
      success: true,
      message: 'Models deployed successfully',
      versions,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error deploying models:', error);
    res.status(500).json({ error: 'Failed to deploy models' });
  }
});

/**
 * @route GET /api/admin/self-learning/models
 * @desc Get model versions
 * @access Private (Admin only)
 */
router.get('/models', authenticate, adminAuth, async (req, res) => {
  try {
    // Get active model versions
    const activeVersions = modelRegistry.getActiveVersions();
    
    // Get model history
    const history = modelRegistry.getModelHistory();
    
    res.json({
      activeVersions,
      history,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting model versions:', error);
    res.status(500).json({ error: 'Failed to get model versions' });
  }
});

/**
 * @route GET /api/admin/self-learning/models/:modelType
 * @desc Get model versions for a specific model type
 * @access Private (Admin only)
 */
router.get('/models/:modelType', authenticate, adminAuth, async (req, res) => {
  try {
    const { modelType } = req.params;
    
    // Get active model version
    const activeVersions = modelRegistry.getActiveVersions();
    const activeVersion = activeVersions[modelType];
    
    // Get model history
    const history = modelRegistry.getModelHistory(modelType);
    
    // Get model metadata
    const metadata = await modelRegistry.getModelMetadata(modelType, activeVersion);
    
    res.json({
      modelType,
      activeVersion,
      metadata,
      history,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error getting model versions for ${req.params.modelType}:`, error);
    res.status(500).json({ error: `Failed to get model versions for ${req.params.modelType}` });
  }
});

/**
 * @route POST /api/admin/self-learning/rollback
 * @desc Rollback to a previous model version
 * @access Private (Admin only)
 */
router.post('/rollback', authenticate, adminAuth, async (req, res) => {
  try {
    const { modelType, version } = req.body;
    
    if (!modelType || !version) {
      return res.status(400).json({ error: 'Model type and version are required' });
    }
    
    logger.info(`Rolling back model ${modelType} to version ${version}`);
    
    // Rollback model
    await modelRegistry.rollbackModel(modelType, version);
    
    res.json({
      success: true,
      message: `Model ${modelType} rolled back to version ${version} successfully`,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error rolling back model:', error);
    res.status(500).json({ error: 'Failed to rollback model' });
  }
});

/**
 * @route GET /api/admin/self-learning/compare
 * @desc Compare model versions
 * @access Private (Admin only)
 */
router.get('/compare', authenticate, adminAuth, async (req, res) => {
  try {
    const { modelType, version1, version2 } = req.query;
    
    if (!modelType || !version1 || !version2) {
      return res.status(400).json({ error: 'Model type and both versions are required' });
    }
    
    logger.info(`Comparing model ${modelType} versions ${version1} and ${version2}`);
    
    // Compare model versions
    const comparison = await modelRegistry.compareModelVersions(modelType, version1, version2);
    
    res.json({
      comparison,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error comparing model versions:', error);
    res.status(500).json({ error: 'Failed to compare model versions' });
  }
});

/**
 * @route GET /api/admin/self-learning/performance
 * @desc Get model performance metrics
 * @access Private (Admin only)
 */
router.get('/performance', authenticate, adminAuth, async (req, res) => {
  try {
    // Get model performance metrics
    const spreadMetrics = await SelfLearningService.performanceEvaluator.evaluateSpreadModel();
    const overUnderMetrics = await SelfLearningService.performanceEvaluator.evaluateOverUnderModel();
    const moneylineMetrics = await SelfLearningService.performanceEvaluator.evaluateMoneylineModel();
    const scoreMetrics = await SelfLearningService.performanceEvaluator.evaluateScoreModel();
    
    res.json({
      performance: {
        spread: spreadMetrics,
        overUnder: overUnderMetrics,
        moneyline: moneylineMetrics,
        score: scoreMetrics
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting model performance metrics:', error);
    res.status(500).json({ error: 'Failed to get model performance metrics' });
  }
});

/**
 * @route GET /api/admin/self-learning/performance/:sport
 * @desc Get model performance metrics for a specific sport
 * @access Private (Admin only)
 */
router.get('/performance/:sport', authenticate, adminAuth, async (req, res) => {
  try {
    const { sport } = req.params;
    
    // Get model performance metrics for this sport
    const metrics = await SelfLearningService.performanceEvaluator.evaluatePerformanceBySport(sport);
    
    res.json({
      sport,
      performance: metrics,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error getting model performance metrics for ${req.params.sport}:`, error);
    res.status(500).json({ error: `Failed to get model performance metrics for ${req.params.sport}` });
  }
});

module.exports = router;