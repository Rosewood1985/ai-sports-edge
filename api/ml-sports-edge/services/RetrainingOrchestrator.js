/**
 * RetrainingOrchestrator.js
 * Manages the model retraining process
 */

const Game = require('../models/Game');
const Prediction = require('../models/Prediction');
const ModelService = require('../ml/ModelService');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class RetrainingOrchestrator {
  /**
   * Prepare training data for model retraining
   * @returns {Promise<Object>} Training data
   */
  async prepareTrainingData() {
    try {
      logger.info('Preparing training data...');
      
      // Get completed games with results
      const games = await Game.find({
        'result.completed': true,
        'result.homeScore': { $exists: true },
        'result.awayScore': { $exists: true }
      }).sort({ date: -1 }).limit(10000);
      
      logger.info(`Found ${games.length} completed games for training`);
      
      // Get predictions for analysis
      const predictions = await Prediction.find({
        'result.spreadResult': { $exists: true }
      }).sort({ timestamp: -1 }).limit(5000);
      
      logger.info(`Found ${predictions.length} evaluated predictions for analysis`);
      
      // Analyze prediction errors to improve feature selection
      const errorAnalysis = await this.analyzePredictionErrors(predictions);
      
      // Split data into training, validation, and test sets
      const { trainingSet, validationSet, testSet } = this.splitData(games);
      
      logger.info(`Split data into ${trainingSet.length} training, ${validationSet.length} validation, and ${testSet.length} test samples`);
      
      return {
        games,
        trainingSet,
        validationSet,
        testSet,
        predictions,
        errorAnalysis
      };
    } catch (error) {
      logger.error('Error preparing training data:', error);
      throw error;
    }
  }
  
  /**
   * Split data into training, validation, and test sets
   * @param {Array} games - Games to split
   * @returns {Object} Split data sets
   */
  splitData(games) {
    // Shuffle games
    const shuffledGames = [...games].sort(() => Math.random() - 0.5);
    
    // Split into 70% training, 15% validation, 15% test
    const trainingSize = Math.floor(shuffledGames.length * 0.7);
    const validationSize = Math.floor(shuffledGames.length * 0.15);
    
    const trainingSet = shuffledGames.slice(0, trainingSize);
    const validationSet = shuffledGames.slice(trainingSize, trainingSize + validationSize);
    const testSet = shuffledGames.slice(trainingSize + validationSize);
    
    return { trainingSet, validationSet, testSet };
  }
  
  /**
   * Analyze prediction errors to improve feature selection
   * @param {Array} predictions - Predictions to analyze
   * @returns {Promise<Object>} Error analysis
   */
  async analyzePredictionErrors(predictions) {
    try {
      // Group predictions by result
      const correctPredictions = predictions.filter(p => 
        p.result.spreadResult === 'correct' || 
        p.result.overUnderResult === 'correct' || 
        p.result.moneylineResult === 'correct'
      );
      
      const incorrectPredictions = predictions.filter(p => 
        p.result.spreadResult === 'incorrect' || 
        p.result.overUnderResult === 'incorrect' || 
        p.result.moneylineResult === 'incorrect'
      );
      
      logger.info(`Analyzing ${correctPredictions.length} correct and ${incorrectPredictions.length} incorrect predictions`);
      
      // Analyze feature importance in correct vs. incorrect predictions
      const featureAnalysis = this.analyzeFeatureImportance(correctPredictions, incorrectPredictions);
      
      // Analyze confidence calibration
      const confidenceAnalysis = this.analyzeConfidenceCalibration(predictions);
      
      // Analyze sport-specific patterns
      const sportAnalysis = this.analyzeSportPatterns(predictions);
      
      // Analyze team-specific patterns
      const teamAnalysis = await this.analyzeTeamPatterns(predictions);
      
      return {
        featureAnalysis,
        confidenceAnalysis,
        sportAnalysis,
        teamAnalysis
      };
    } catch (error) {
      logger.error('Error analyzing prediction errors:', error);
      throw error;
    }
  }
  
  /**
   * Analyze feature importance in correct vs. incorrect predictions
   * @param {Array} correctPredictions - Correct predictions
   * @param {Array} incorrectPredictions - Incorrect predictions
   * @returns {Object} Feature importance analysis
   */
  analyzeFeatureImportance(correctPredictions, incorrectPredictions) {
    // This would be a more sophisticated analysis in a real system
    // For now, we'll just count the most common factors in each group
    
    const correctFactors = {};
    const incorrectFactors = {};
    
    // Count factors in correct predictions
    correctPredictions.forEach(prediction => {
      const factors = [
        ...(prediction.predictions.spread?.factors || []),
        ...(prediction.predictions.overUnder?.factors || []),
        ...(prediction.predictions.moneyline?.factors || [])
      ];
      
      factors.forEach(factor => {
        correctFactors[factor.name] = (correctFactors[factor.name] || 0) + 1;
      });
    });
    
    // Count factors in incorrect predictions
    incorrectPredictions.forEach(prediction => {
      const factors = [
        ...(prediction.predictions.spread?.factors || []),
        ...(prediction.predictions.overUnder?.factors || []),
        ...(prediction.predictions.moneyline?.factors || [])
      ];
      
      factors.forEach(factor => {
        incorrectFactors[factor.name] = (incorrectFactors[factor.name] || 0) + 1;
      });
    });
    
    // Calculate factor importance ratio (correct / incorrect)
    const factorImportance = {};
    
    Object.keys({ ...correctFactors, ...incorrectFactors }).forEach(factor => {
      const correctCount = correctFactors[factor] || 0;
      const incorrectCount = incorrectFactors[factor] || 0;
      
      // Avoid division by zero
      const ratio = incorrectCount > 0 ? correctCount / incorrectCount : correctCount;
      
      factorImportance[factor] = {
        correctCount,
        incorrectCount,
        ratio
      };
    });
    
    return factorImportance;
  }
  
  /**
   * Analyze confidence calibration
   * @param {Array} predictions - Predictions to analyze
   * @returns {Object} Confidence calibration analysis
   */
  analyzeConfidenceCalibration(predictions) {
    // Group predictions by confidence level (rounded to nearest 0.1)
    const confidenceBins = {};
    
    // Analyze spread predictions
    predictions.forEach(prediction => {
      if (!prediction.predictions.spread || !prediction.result.spreadResult) {
        return;
      }
      
      const confidence = prediction.predictions.spread.confidence;
      const binKey = Math.round(confidence * 10) / 10;
      
      if (!confidenceBins[binKey]) {
        confidenceBins[binKey] = {
          total: 0,
          correct: 0
        };
      }
      
      confidenceBins[binKey].total++;
      
      if (prediction.result.spreadResult === 'correct') {
        confidenceBins[binKey].correct++;
      }
    });
    
    // Calculate actual accuracy for each bin
    Object.keys(confidenceBins).forEach(bin => {
      const { total, correct } = confidenceBins[bin];
      confidenceBins[bin].accuracy = total > 0 ? correct / total : 0;
      confidenceBins[bin].calibrationError = Math.abs(confidenceBins[bin].accuracy - parseFloat(bin));
    });
    
    return confidenceBins;
  }
  
  /**
   * Analyze sport-specific patterns
   * @param {Array} predictions - Predictions to analyze
   * @returns {Object} Sport-specific patterns
   */
  analyzeSportPatterns(predictions) {
    // Group predictions by sport
    const sportGroups = {};
    
    predictions.forEach(prediction => {
      const sport = prediction.sport;
      
      if (!sportGroups[sport]) {
        sportGroups[sport] = {
          total: 0,
          correct: {
            spread: 0,
            overUnder: 0,
            moneyline: 0
          },
          incorrect: {
            spread: 0,
            overUnder: 0,
            moneyline: 0
          }
        };
      }
      
      sportGroups[sport].total++;
      
      // Count correct/incorrect predictions by type
      if (prediction.result.spreadResult === 'correct') {
        sportGroups[sport].correct.spread++;
      } else if (prediction.result.spreadResult === 'incorrect') {
        sportGroups[sport].incorrect.spread++;
      }
      
      if (prediction.result.overUnderResult === 'correct') {
        sportGroups[sport].correct.overUnder++;
      } else if (prediction.result.overUnderResult === 'incorrect') {
        sportGroups[sport].incorrect.overUnder++;
      }
      
      if (prediction.result.moneylineResult === 'correct') {
        sportGroups[sport].correct.moneyline++;
      } else if (prediction.result.moneylineResult === 'incorrect') {
        sportGroups[sport].incorrect.moneyline++;
      }
    });
    
    // Calculate accuracy by sport and prediction type
    Object.keys(sportGroups).forEach(sport => {
      const group = sportGroups[sport];
      
      group.accuracy = {
        spread: (group.correct.spread + group.incorrect.spread > 0) 
          ? group.correct.spread / (group.correct.spread + group.incorrect.spread) 
          : 0,
        overUnder: (group.correct.overUnder + group.incorrect.overUnder > 0)
          ? group.correct.overUnder / (group.correct.overUnder + group.incorrect.overUnder)
          : 0,
        moneyline: (group.correct.moneyline + group.incorrect.moneyline > 0)
          ? group.correct.moneyline / (group.correct.moneyline + group.incorrect.moneyline)
          : 0
      };
    });
    
    return sportGroups;
  }
  
  /**
   * Analyze team-specific patterns
   * @param {Array} predictions - Predictions to analyze
   * @returns {Promise<Object>} Team-specific patterns
   */
  async analyzeTeamPatterns(predictions) {
    // Group predictions by team
    const teamGroups = {};
    
    // Get all game IDs from predictions
    const gameIds = [...new Set(predictions.map(p => p.gameId))];
    
    // Get games for these predictions
    const games = await Game.find({ _id: { $in: gameIds } });
    
    // Create a map of game ID to game
    const gameMap = {};
    games.forEach(game => {
      gameMap[game._id.toString()] = game;
    });
    
    // Analyze predictions by team
    predictions.forEach(prediction => {
      const game = gameMap[prediction.gameId.toString()];
      
      if (!game) {
        return;
      }
      
      const homeTeam = game.homeTeam.name;
      const awayTeam = game.awayTeam.name;
      
      // Initialize team groups if needed
      if (!teamGroups[homeTeam]) {
        teamGroups[homeTeam] = {
          total: 0,
          home: { total: 0, correct: 0 },
          away: { total: 0, correct: 0 }
        };
      }
      
      if (!teamGroups[awayTeam]) {
        teamGroups[awayTeam] = {
          total: 0,
          home: { total: 0, correct: 0 },
          away: { total: 0, correct: 0 }
        };
      }
      
      // Update home team stats
      teamGroups[homeTeam].total++;
      teamGroups[homeTeam].home.total++;
      
      if (prediction.result.spreadResult === 'correct') {
        teamGroups[homeTeam].home.correct++;
      }
      
      // Update away team stats
      teamGroups[awayTeam].total++;
      teamGroups[awayTeam].away.total++;
      
      if (prediction.result.spreadResult === 'correct') {
        teamGroups[awayTeam].away.correct++;
      }
    });
    
    // Calculate accuracy by team
    Object.keys(teamGroups).forEach(team => {
      const group = teamGroups[team];
      
      group.home.accuracy = group.home.total > 0 ? group.home.correct / group.home.total : 0;
      group.away.accuracy = group.away.total > 0 ? group.away.correct / group.away.total : 0;
      group.overall = {
        total: group.home.total + group.away.total,
        correct: group.home.correct + group.away.correct,
        accuracy: (group.home.total + group.away.total > 0)
          ? (group.home.correct + group.away.correct) / (group.home.total + group.away.total)
          : 0
      };
    });
    
    return teamGroups;
  }
  
  /**
   * Retrain models with training data
   * @param {Object} trainingData - Training data
   * @returns {Promise<Object>} Retraining results
   */
  async retrainModels(trainingData) {
    try {
      logger.info('Retraining models with new data...');
      
      // Apply insights from error analysis
      const enhancedTrainingData = this.enhanceTrainingData(trainingData);
      
      // Retrain models using ModelService
      await ModelService.trainModels(enhancedTrainingData.trainingSet);
      
      // Evaluate models on validation set
      const validationResults = await this.evaluateModels(ModelService.models, enhancedTrainingData.validationSet);
      
      logger.info('Validation results:', validationResults);
      
      // Get model versions
      const versions = {
        spread: ModelService.modelInfo.version,
        overUnder: ModelService.modelInfo.version,
        moneyline: ModelService.modelInfo.version,
        score: ModelService.modelInfo.version
      };
      
      // Return models and versions
      return {
        models: ModelService.models,
        versions,
        performance: ModelService.getPerformance(),
        validationResults
      };
    } catch (error) {
      logger.error('Error retraining models:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate models on a dataset
   * @param {Object} models - Models to evaluate
   * @param {Array} dataset - Dataset to evaluate on
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluateModels(models, dataset) {
    try {
      logger.info(`Evaluating models on ${dataset.length} samples`);
      
      // Make predictions on dataset
      const predictions = [];
      
      for (const game of dataset) {
        try {
          const prediction = await ModelService.predictGame(game);
          predictions.push(prediction);
        } catch (error) {
          logger.error(`Error predicting game ${game._id}:`, error);
        }
      }
      
      // Calculate metrics
      const spreadCorrect = predictions.filter(p => 
        p.predictions.spread.pick === (game.result.homeScore > game.result.awayScore ? 'home' : 'away')
      ).length;
      
      const overUnderCorrect = predictions.filter(p => {
        const totalScore = game.result.homeScore + game.result.awayScore;
        return (p.predictions.overUnder.pick === 'over' && totalScore > game.odds.closing.overUnder) ||
               (p.predictions.overUnder.pick === 'under' && totalScore < game.odds.closing.overUnder);
      }).length;
      
      const moneylineCorrect = predictions.filter(p => 
        p.predictions.moneyline.pick === (game.result.homeScore > game.result.awayScore ? 'home' : 'away')
      ).length;
      
      // Calculate accuracy
      const spreadAccuracy = predictions.length > 0 ? spreadCorrect / predictions.length : 0;
      const overUnderAccuracy = predictions.length > 0 ? overUnderCorrect / predictions.length : 0;
      const moneylineAccuracy = predictions.length > 0 ? moneylineCorrect / predictions.length : 0;
      
      return {
        spreadAccuracy,
        overUnderAccuracy,
        moneylineAccuracy,
        totalPredictions: predictions.length
      };
    } catch (error) {
      logger.error('Error evaluating models:', error);
      throw error;
    }
  }
  
  /**
   * Enhance training data with insights from error analysis
   * @param {Object} trainingData - Training data
   * @returns {Object} Enhanced training data
   */
  enhanceTrainingData(trainingData) {
    // This would be a more sophisticated enhancement in a real system
    // For now, we'll just apply some basic feature engineering
    
    // Get feature importance from error analysis
    const { featureAnalysis } = trainingData.errorAnalysis;
    
    // Sort features by importance
    const sortedFeatures = Object.entries(featureAnalysis)
      .sort(([, a], [, b]) => b.ratio - a.ratio)
      .map(([name]) => name);
    
    logger.info('Top important features:', sortedFeatures.slice(0, 10));
    
    // Apply feature engineering to training data
    const enhancedTrainingSet = trainingData.trainingSet.map(game => {
      // Create a copy of the game
      const enhancedGame = { ...game };
      
      // Add engineered features based on error analysis
      enhancedGame.engineeredFeatures = this.engineerFeatures(game, featureAnalysis);
      
      return enhancedGame;
    });
    
    // Apply same feature engineering to validation and test sets
    const enhancedValidationSet = trainingData.validationSet.map(game => {
      const enhancedGame = { ...game };
      enhancedGame.engineeredFeatures = this.engineerFeatures(game, featureAnalysis);
      return enhancedGame;
    });
    
    const enhancedTestSet = trainingData.testSet.map(game => {
      const enhancedGame = { ...game };
      enhancedGame.engineeredFeatures = this.engineerFeatures(game, featureAnalysis);
      return enhancedGame;
    });
    
    return {
      ...trainingData,
      trainingSet: enhancedTrainingSet,
      validationSet: enhancedValidationSet,
      testSet: enhancedTestSet
    };
  }
  
  /**
   * Engineer features for a game
   * @param {Object} game - Game to engineer features for
   * @param {Object} featureAnalysis - Feature importance analysis
   * @returns {Object} Engineered features
   */
  engineerFeatures(game, featureAnalysis) {
    // This would be a more sophisticated feature engineering in a real system
    // For now, we'll just add some basic features
    
    const engineeredFeatures = {};
    
    // Add home/away win streak
    if (game.homeTeam.stats?.recentForm) {
      const homeWinStreak = this.calculateWinStreak(game.homeTeam.stats.recentForm);
      engineeredFeatures.homeWinStreak = homeWinStreak;
    }
    
    if (game.awayTeam.stats?.recentForm) {
      const awayWinStreak = this.calculateWinStreak(game.awayTeam.stats.recentForm);
      engineeredFeatures.awayWinStreak = awayWinStreak;
    }
    
    // Add home/away rest advantage
    if (game.factors?.restDays) {
      const restAdvantage = (game.factors.restDays.home || 0) - (game.factors.restDays.away || 0);
      engineeredFeatures.restAdvantage = restAdvantage;
    }
    
    // Add line movement features
    if (game.odds?.movement) {
      engineeredFeatures.spreadMovement = game.odds.movement.spread || 0;
      engineeredFeatures.overUnderMovement = game.odds.movement.overUnder || 0;
      engineeredFeatures.homeMoneylineMovement = game.odds.movement.homeMoneyline || 0;
      engineeredFeatures.awayMoneylineMovement = game.odds.movement.awayMoneyline || 0;
    }
    
    return engineeredFeatures;
  }
  
  /**
   * Calculate win streak from recent form
   * @param {Array} recentForm - Recent form (1 for win, 0 for loss)
   * @returns {number} Win streak
   */
  calculateWinStreak(recentForm) {
    let streak = 0;
    
    for (let i = recentForm.length - 1; i >= 0; i--) {
      if (recentForm[i] === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

module.exports = RetrainingOrchestrator;