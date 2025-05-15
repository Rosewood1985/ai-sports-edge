/**
 * SelfLearningService.js
 * Orchestrates the self-learning process for ML models
 */

const GameResultsCollector = require('./GameResultsCollector');
const PerformanceEvaluator = require('./PerformanceEvaluator');
const RetrainingOrchestrator = require('./RetrainingOrchestrator');
const ModelRegistry = require('../ml/ModelRegistry');
const Game = require('../models/Game');
const Prediction = require('../models/Prediction');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const logger = require('../utils/logger');

class SelfLearningService {
  constructor() {
    this.gameResultsCollector = new GameResultsCollector();
    this.performanceEvaluator = new PerformanceEvaluator();
    this.retrainingOrchestrator = new RetrainingOrchestrator();
    this.modelRegistry = new ModelRegistry();
    
    // Configuration
    this.config = {
      // Performance thresholds that trigger retraining
      thresholds: {
        accuracy: 0.65,  // Minimum acceptable accuracy
        dataGrowth: 0.1, // Minimum data growth rate to trigger retraining
        errorRate: 0.2   // Maximum acceptable error rate
      },
      // Scheduling
      schedule: {
        resultCollection: '0 */6 * * *',  // Every 6 hours
        evaluation: '0 2 * * *',          // Daily at 2 AM
        retraining: '0 3 * * 1'           // Weekly on Monday at 3 AM
      }
    };
  }
  
  /**
   * Initialize the self-learning service
   */
  async initialize() {
    logger.info('Initializing Self-Learning Service...');
    
    // Schedule regular tasks
    this.scheduleResultCollection();
    this.schedulePerformanceEvaluation();
    this.scheduleRetraining();
    
    logger.info('Self-Learning Service initialized successfully');
  }
  
  /**
   * Schedule regular collection of game results
   */
  scheduleResultCollection() {
    schedule.scheduleJob(this.config.schedule.resultCollection, async () => {
      logger.info('Starting scheduled game results collection...');
      await this.collectGameResults();
    });
  }
  
  /**
   * Schedule regular performance evaluation
   */
  schedulePerformanceEvaluation() {
    schedule.scheduleJob(this.config.schedule.evaluation, async () => {
      logger.info('Starting scheduled performance evaluation...');
      await this.evaluatePerformance();
    });
  }
  
  /**
   * Schedule regular model retraining
   */
  scheduleRetraining() {
    schedule.scheduleJob(this.config.schedule.retraining, async () => {
      logger.info('Starting scheduled model retraining...');
      await this.retrainModels();
    });
  }
  
  /**
   * Collect official game results
   */
  async collectGameResults() {
    try {
      // Get games that need results
      const games = await Game.find({
        'result.completed': false,
        date: { $lt: new Date() } // Games in the past
      }).sort({ date: -1 }).limit(100);
      
      logger.info(`Found ${games.length} games that need results`);
      
      // Collect results for each game
      for (const game of games) {
        const results = await this.gameResultsCollector.fetchGameResults(game);
        
        if (results) {
          // Update game with official results
          game.result.homeScore = results.homeScore;
          game.result.awayScore = results.awayScore;
          game.result.completed = true;
          
          // Calculate betting results
          game.calculateResult();
          
          await game.save();
          logger.info(`Updated results for game ${game._id}: ${game.homeTeam.name} ${results.homeScore} - ${results.awayScore} ${game.awayTeam.name}`);
          
          // Update predictions for this game
          await this.updatePredictions(game);
        }
      }
      
      logger.info('Game results collection completed');
    } catch (error) {
      logger.error('Error collecting game results:', error);
    }
  }
  
  /**
   * Update predictions with actual results
   * @param {Object} game - Game with official results
   */
  async updatePredictions(game) {
    try {
      // Find all predictions for this game
      const predictions = await Prediction.find({ gameId: game._id });
      
      logger.info(`Found ${predictions.length} predictions for game ${game._id}`);
      
      // Update each prediction with actual results
      for (const prediction of predictions) {
        prediction.evaluatePrediction(game.result);
        await prediction.save();
      }
    } catch (error) {
      logger.error(`Error updating predictions for game ${game._id}:`, error);
    }
  }
  
  /**
   * Evaluate model performance
   */
  async evaluatePerformance() {
    try {
      // Get performance metrics for each model type
      const spreadMetrics = await this.performanceEvaluator.evaluateSpreadModel();
      const overUnderMetrics = await this.performanceEvaluator.evaluateOverUnderModel();
      const moneylineMetrics = await this.performanceEvaluator.evaluateMoneylineModel();
      const scoreMetrics = await this.performanceEvaluator.evaluateScoreModel();
      
      logger.info('Performance evaluation completed');
      logger.info('Spread model metrics:', spreadMetrics);
      logger.info('Over/Under model metrics:', overUnderMetrics);
      logger.info('Moneyline model metrics:', moneylineMetrics);
      logger.info('Score model metrics:', scoreMetrics);
      
      // Store metrics in database for tracking
      await this.storePerformanceMetrics({
        spread: spreadMetrics,
        overUnder: overUnderMetrics,
        moneyline: moneylineMetrics,
        score: scoreMetrics,
        timestamp: new Date()
      });
      
      // Check if any model needs retraining
      const needsRetraining = this.checkRetrainingNeeded({
        spread: spreadMetrics,
        overUnder: overUnderMetrics,
        moneyline: moneylineMetrics,
        score: scoreMetrics
      });
      
      if (needsRetraining) {
        logger.info('Performance below threshold, triggering retraining...');
        await this.retrainModels();
      }
    } catch (error) {
      logger.error('Error evaluating model performance:', error);
    }
  }
  
  /**
   * Store performance metrics in database
   * @param {Object} metrics - Performance metrics
   */
  async storePerformanceMetrics(metrics) {
    try {
      // This would store metrics in a database collection
      // For now, we'll just log them
      logger.info('Storing performance metrics:', metrics);
    } catch (error) {
      logger.error('Error storing performance metrics:', error);
    }
  }
  
  /**
   * Check if retraining is needed based on performance metrics
   * @param {Object} metrics - Performance metrics for each model
   * @returns {boolean} Whether retraining is needed
   */
  checkRetrainingNeeded(metrics) {
    // Check spread model
    if (metrics.spread.accuracy < this.config.thresholds.accuracy) {
      logger.info(`Spread model accuracy (${metrics.spread.accuracy}) below threshold (${this.config.thresholds.accuracy})`);
      return true;
    }
    
    // Check over/under model
    if (metrics.overUnder.accuracy < this.config.thresholds.accuracy) {
      logger.info(`Over/Under model accuracy (${metrics.overUnder.accuracy}) below threshold (${this.config.thresholds.accuracy})`);
      return true;
    }
    
    // Check moneyline model
    if (metrics.moneyline.accuracy < this.config.thresholds.accuracy) {
      logger.info(`Moneyline model accuracy (${metrics.moneyline.accuracy}) below threshold (${this.config.thresholds.accuracy})`);
      return true;
    }
    
    // Check score model
    if (metrics.score.mse > this.config.thresholds.errorRate) {
      logger.info(`Score model MSE (${metrics.score.mse}) above threshold (${this.config.thresholds.errorRate})`);
      return true;
    }
    
    // Check calibration error
    if (metrics.spread.calibration && metrics.spread.calibration.averageCalibrationError > 0.1) {
      logger.info(`Spread model calibration error (${metrics.spread.calibration.averageCalibrationError}) above threshold (0.1)`);
      return true;
    }
    
    logger.info('All model metrics within acceptable thresholds, no retraining needed');
    return false;
  }
  
  /**
   * Retrain models with latest data
   */
  async retrainModels() {
    try {
      logger.info('Starting model retraining process...');
      
      // Get training data
      const trainingData = await this.retrainingOrchestrator.prepareTrainingData();
      
      // Retrain models
      const results = await this.retrainingOrchestrator.retrainModels(trainingData);
      
      // Register new models
      await this.modelRegistry.registerModels(results.models, results.versions);
      
      logger.info('Model retraining completed successfully');
      logger.info('New model versions:', results.versions);
      
      // Deploy new models
      await this.modelRegistry.deployModels(results.versions);
      
      logger.info('New models deployed successfully');
    } catch (error) {
      logger.error('Error retraining models:', error);
    }
  }
  
  /**
   * Manually trigger the self-learning cycle
   */
  async triggerSelfLearningCycle() {
    logger.info('Manually triggering self-learning cycle...');
    
    await this.collectGameResults();
    await this.evaluatePerformance();
    
    logger.info('Self-learning cycle completed');
  }
}

module.exports = new SelfLearningService();