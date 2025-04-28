/**
 * PerformanceEvaluator.js
 * Evaluates model performance by comparing predictions with actual results
 */

const Prediction = require('../models/Prediction');
const Game = require('../models/Game');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class PerformanceEvaluator {
  /**
   * Evaluate spread model performance
   * @returns {Promise<Object>} Performance metrics
   */
  async evaluateSpreadModel() {
    try {
      // Get completed predictions with results
      const predictions = await Prediction.find({
        'result.spreadResult': { $in: ['correct', 'incorrect'] }
      }).sort({ timestamp: -1 }).limit(1000);
      
      logger.info(`Found ${predictions.length} spread predictions with results`);
      
      // Calculate metrics
      const totalPredictions = predictions.length;
      const correctPredictions = predictions.filter(p => p.result.spreadResult === 'correct').length;
      
      // Calculate accuracy
      const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
      
      // Calculate precision and recall for home team predictions
      const homePredictions = predictions.filter(p => p.predictions.spread.pick === 'home');
      const homeCorrect = homePredictions.filter(p => p.result.spreadResult === 'correct').length;
      const homeActual = predictions.filter(p => p.result.spreadResult === 'home').length;
      
      const precision = homePredictions.length > 0 ? homeCorrect / homePredictions.length : 0;
      const recall = homeActual > 0 ? homeCorrect / homeActual : 0;
      
      // Calculate F1 score
      const f1 = precision > 0 && recall > 0 
        ? 2 * (precision * recall) / (precision + recall) 
        : 0;
      
      // Calculate confidence calibration
      const calibration = this.calculateCalibration(predictions, 'spread');
      
      // Calculate metrics by confidence level
      const confidenceBuckets = this.calculateConfidenceBuckets(predictions, 'spread');
      
      // Analyze error patterns
      const incorrectPredictions = predictions.filter(p => p.result.spreadResult === 'incorrect');
      const errorPatterns = this.analyzeErrorPatterns(incorrectPredictions);
      
      return {
        accuracy,
        precision,
        recall,
        f1,
        totalPredictions,
        correctPredictions,
        calibration,
        confidenceBuckets,
        errorPatterns,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error evaluating spread model:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate over/under model performance
   * @returns {Promise<Object>} Performance metrics
   */
  async evaluateOverUnderModel() {
    try {
      // Get completed predictions with results
      const predictions = await Prediction.find({
        'result.overUnderResult': { $in: ['correct', 'incorrect'] }
      }).sort({ timestamp: -1 }).limit(1000);
      
      logger.info(`Found ${predictions.length} over/under predictions with results`);
      
      // Calculate metrics
      const totalPredictions = predictions.length;
      const correctPredictions = predictions.filter(p => p.result.overUnderResult === 'correct').length;
      
      // Calculate accuracy
      const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
      
      // Calculate precision and recall for over predictions
      const overPredictions = predictions.filter(p => p.predictions.overUnder.pick === 'over');
      const overCorrect = overPredictions.filter(p => p.result.overUnderResult === 'correct').length;
      const overActual = predictions.filter(p => p.result.overUnderResult === 'over').length;
      
      const precision = overPredictions.length > 0 ? overCorrect / overPredictions.length : 0;
      const recall = overActual > 0 ? overCorrect / overActual : 0;
      
      // Calculate F1 score
      const f1 = precision > 0 && recall > 0 
        ? 2 * (precision * recall) / (precision + recall) 
        : 0;
      
      // Calculate confidence calibration
      const calibration = this.calculateCalibration(predictions, 'overUnder');
      
      // Calculate metrics by confidence level
      const confidenceBuckets = this.calculateConfidenceBuckets(predictions, 'overUnder');
      
      // Analyze error patterns
      const incorrectPredictions = predictions.filter(p => p.result.overUnderResult === 'incorrect');
      const errorPatterns = this.analyzeErrorPatterns(incorrectPredictions);
      
      return {
        accuracy,
        precision,
        recall,
        f1,
        totalPredictions,
        correctPredictions,
        calibration,
        confidenceBuckets,
        errorPatterns,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error evaluating over/under model:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate moneyline model performance
   * @returns {Promise<Object>} Performance metrics
   */
  async evaluateMoneylineModel() {
    try {
      // Get completed predictions with results
      const predictions = await Prediction.find({
        'result.moneylineResult': { $in: ['correct', 'incorrect'] }
      }).sort({ timestamp: -1 }).limit(1000);
      
      logger.info(`Found ${predictions.length} moneyline predictions with results`);
      
      // Calculate metrics
      const totalPredictions = predictions.length;
      const correctPredictions = predictions.filter(p => p.result.moneylineResult === 'correct').length;
      
      // Calculate accuracy
      const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
      
      // Calculate precision and recall for home team predictions
      const homePredictions = predictions.filter(p => p.predictions.moneyline.pick === 'home');
      const homeCorrect = homePredictions.filter(p => p.result.moneylineResult === 'correct').length;
      const homeActual = predictions.filter(p => p.result.moneylineResult === 'home').length;
      
      const precision = homePredictions.length > 0 ? homeCorrect / homePredictions.length : 0;
      const recall = homeActual > 0 ? homeCorrect / homeActual : 0;
      
      // Calculate F1 score
      const f1 = precision > 0 && recall > 0 
        ? 2 * (precision * recall) / (precision + recall) 
        : 0;
      
      // Calculate confidence calibration
      const calibration = this.calculateCalibration(predictions, 'moneyline');
      
      // Calculate metrics by confidence level
      const confidenceBuckets = this.calculateConfidenceBuckets(predictions, 'moneyline');
      
      // Analyze error patterns
      const incorrectPredictions = predictions.filter(p => p.result.moneylineResult === 'incorrect');
      const errorPatterns = this.analyzeErrorPatterns(incorrectPredictions);
      
      // Calculate ROI
      const roi = this.calculateROI(predictions, 'moneyline');
      
      return {
        accuracy,
        precision,
        recall,
        f1,
        roi,
        totalPredictions,
        correctPredictions,
        calibration,
        confidenceBuckets,
        errorPatterns,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error evaluating moneyline model:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate score model performance
   * @returns {Promise<Object>} Performance metrics
   */
  async evaluateScoreModel() {
    try {
      // Get completed predictions with score accuracy
      const predictions = await Prediction.find({
        'result.scoreAccuracy': { $exists: true }
      }).sort({ timestamp: -1 }).limit(1000);
      
      logger.info(`Found ${predictions.length} score predictions with results`);
      
      // Calculate metrics
      const totalPredictions = predictions.length;
      
      // Calculate mean squared error
      let totalHomeError = 0;
      let totalAwayError = 0;
      
      predictions.forEach(prediction => {
        if (prediction.result.scoreAccuracy) {
          const homeError = 100 - prediction.result.scoreAccuracy.home;
          const awayError = 100 - prediction.result.scoreAccuracy.away;
          
          totalHomeError += homeError * homeError;
          totalAwayError += awayError * awayError;
        }
      });
      
      const mseHome = totalPredictions > 0 ? totalHomeError / totalPredictions : 0;
      const mseAway = totalPredictions > 0 ? totalAwayError / totalPredictions : 0;
      const mse = (mseHome + mseAway) / 2;
      
      // Calculate root mean squared error
      const rmse = Math.sqrt(mse);
      
      // Calculate mean absolute error
      let totalHomeAbsError = 0;
      let totalAwayAbsError = 0;
      
      predictions.forEach(prediction => {
        if (prediction.result.scoreAccuracy) {
          const homeError = 100 - prediction.result.scoreAccuracy.home;
          const awayError = 100 - prediction.result.scoreAccuracy.away;
          
          totalHomeAbsError += Math.abs(homeError);
          totalAwayAbsError += Math.abs(awayError);
        }
      });
      
      const maeHome = totalPredictions > 0 ? totalHomeAbsError / totalPredictions : 0;
      const maeAway = totalPredictions > 0 ? totalAwayAbsError / totalPredictions : 0;
      const mae = (maeHome + maeAway) / 2;
      
      return {
        mse,
        rmse,
        mae,
        mseHome,
        mseAway,
        maeHome,
        maeAway,
        totalPredictions,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error evaluating score model:', error);
      throw error;
    }
  }
  
  /**
   * Calculate confidence calibration
   * @param {Array} predictions - Predictions to evaluate
   * @param {string} type - Prediction type (spread, overUnder, moneyline)
   * @returns {Object} Calibration metrics
   */
  calculateCalibration(predictions, type) {
    // Group predictions by confidence level (rounded to nearest 0.1)
    const confidenceBins = {};
    
    predictions.forEach(prediction => {
      const confidence = prediction.predictions[type].confidence;
      const binKey = Math.round(confidence * 10) / 10;
      
      if (!confidenceBins[binKey]) {
        confidenceBins[binKey] = {
          total: 0,
          correct: 0
        };
      }
      
      confidenceBins[binKey].total++;
      
      if (prediction.result[`${type}Result`] === 'correct') {
        confidenceBins[binKey].correct++;
      }
    });
    
    // Calculate calibration error
    let calibrationError = 0;
    let totalPredictions = 0;
    
    Object.entries(confidenceBins).forEach(([confidence, bin]) => {
      const actualAccuracy = bin.correct / bin.total;
      const expectedAccuracy = parseFloat(confidence);
      
      calibrationError += Math.abs(actualAccuracy - expectedAccuracy) * bin.total;
      totalPredictions += bin.total;
    });
    
    const averageCalibrationError = totalPredictions > 0 ? calibrationError / totalPredictions : 0;
    
    return {
      bins: confidenceBins,
      averageCalibrationError
    };
  }
  
  /**
   * Calculate metrics by confidence level
   * @param {Array} predictions - Predictions to evaluate
   * @param {string} type - Prediction type (spread, overUnder, moneyline)
   * @returns {Object} Metrics by confidence level
   */
  calculateConfidenceBuckets(predictions, type) {
    // Define confidence buckets
    const buckets = {
      low: { min: 0.5, max: 0.65, total: 0, correct: 0 },
      medium: { min: 0.65, max: 0.8, total: 0, correct: 0 },
      high: { min: 0.8, max: 1.0, total: 0, correct: 0 }
    };
    
    // Categorize predictions by confidence
    predictions.forEach(prediction => {
      const confidence = prediction.predictions[type].confidence;
      const result = prediction.result[`${type}Result`];
      
      // Find the appropriate bucket
      for (const [bucketName, bucket] of Object.entries(buckets)) {
        if (confidence >= bucket.min && confidence <= bucket.max) {
          bucket.total++;
          
          if (result === 'correct') {
            bucket.correct++;
          }
          
          break;
        }
      }
    });
    
    // Calculate accuracy for each bucket
    for (const bucket of Object.values(buckets)) {
      bucket.accuracy = bucket.total > 0 ? bucket.correct / bucket.total : 0;
    }
    
    return buckets;
  }
  
  /**
   * Calculate ROI for predictions
   * @param {Array} predictions - Predictions to evaluate
   * @param {string} type - Prediction type (spread, overUnder, moneyline)
   * @returns {Object} ROI metrics
   */
  calculateROI(predictions, type) {
    let totalStake = 0;
    let totalReturn = 0;
    
    predictions.forEach(prediction => {
      // Assume $100 stake per bet
      const stake = 100;
      totalStake += stake;
      
      // Calculate return based on odds and result
      if (prediction.result[`${type}Result`] === 'correct') {
        const odds = prediction.predictions[type].pick === 'home'
          ? prediction.game?.odds?.closing?.homeMoneyline
          : prediction.game?.odds?.closing?.awayMoneyline;
        
        // Convert American odds to decimal
        let decimalOdds;
        if (odds > 0) {
          decimalOdds = (odds / 100) + 1;
        } else {
          decimalOdds = (100 / Math.abs(odds)) + 1;
        }
        
        // Calculate return (stake * decimal odds)
        const returnAmount = stake * decimalOdds;
        totalReturn += returnAmount;
      }
    });
    
    // Calculate ROI
    const roi = totalStake > 0 ? (totalReturn - totalStake) / totalStake : 0;
    
    return {
      totalStake,
      totalReturn,
      profit: totalReturn - totalStake,
      roi
    };
  }
  
  /**
   * Analyze error patterns
   * @param {Array} predictions - Incorrect predictions
   * @returns {Object} Error patterns
   */
  analyzeErrorPatterns(predictions) {
    // This would be a more complex analysis in a real system
    // For now, we'll just count errors by sport and team
    
    const sportErrors = {};
    const teamErrors = {};
    const factorErrors = {};
    
    predictions.forEach(prediction => {
      // Count errors by sport
      const sport = prediction.sport;
      sportErrors[sport] = (sportErrors[sport] || 0) + 1;
      
      // Get the game
      const game = prediction.game;
      if (game) {
        // Count errors by team
        const homeTeam = game.homeTeam.name;
        const awayTeam = game.awayTeam.name;
        
        teamErrors[homeTeam] = (teamErrors[homeTeam] || 0) + 1;
        teamErrors[awayTeam] = (teamErrors[awayTeam] || 0) + 1;
      }
      
      // Count errors by factor
      const factors = prediction.predictions.spread?.factors || [];
      factors.forEach(factor => {
        factorErrors[factor.name] = (factorErrors[factor.name] || 0) + 1;
      });
    });
    
    return {
      sportErrors,
      teamErrors,
      factorErrors
    };
  }
  
  /**
   * Evaluate model performance by sport
   * @param {string} sport - Sport to evaluate
   * @returns {Promise<Object>} Performance metrics by sport
   */
  async evaluatePerformanceBySport(sport) {
    try {
      // Get completed predictions for this sport
      const predictions = await Prediction.find({
        sport,
        'result.spreadResult': { $exists: true }
      }).sort({ timestamp: -1 }).limit(500);
      
      logger.info(`Found ${predictions.length} predictions for ${sport}`);
      
      // Calculate metrics for each model type
      const spreadMetrics = this.calculateMetrics(predictions, 'spread');
      const overUnderMetrics = this.calculateMetrics(predictions, 'overUnder');
      const moneylineMetrics = this.calculateMetrics(predictions, 'moneyline');
      
      return {
        sport,
        spreadMetrics,
        overUnderMetrics,
        moneylineMetrics,
        totalPredictions: predictions.length,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error evaluating performance for ${sport}:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate metrics for a specific prediction type
   * @param {Array} predictions - Predictions to evaluate
   * @param {string} type - Prediction type (spread, overUnder, moneyline)
   * @returns {Object} Metrics
   */
  calculateMetrics(predictions, type) {
    // Filter predictions with results for this type
    const filteredPredictions = predictions.filter(p => 
      p.result[`${type}Result`] === 'correct' || 
      p.result[`${type}Result`] === 'incorrect'
    );
    
    // Calculate accuracy
    const totalPredictions = filteredPredictions.length;
    const correctPredictions = filteredPredictions.filter(p => p.result[`${type}Result`] === 'correct').length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    
    return {
      accuracy,
      totalPredictions,
      correctPredictions
    };
  }
}

module.exports = PerformanceEvaluator;