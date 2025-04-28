/**
 * Machine Learning Model Service
 * Handles prediction model training, evaluation, and inference
 */

const tf = require('@tensorflow/tfjs-node');
const { RandomForestClassifier } = require('ml-random-forest');
const NodeCache = require('node-cache');
const Game = require('../../models/Game');
const Prediction = require('../../models/Prediction');

// Cache for model instances and predictions
const modelCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour TTL, check every 10 minutes

class ModelService {
  constructor() {
    this.models = {
      spread: null,
      overUnder: null,
      moneyline: null,
      score: null
    };
    
    this.modelInfo = {
      version: '1.0.0',
      lastTrained: null,
      performance: {}
    };
    
    // Feature importance for different prediction types
    this.featureImportance = {
      spread: {},
      overUnder: {},
      moneyline: {}
    };
  }
  
  /**
   * Initialize models
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Try to load cached models
      const cachedModels = modelCache.get('models');
      if (cachedModels) {
        console.log('Loading models from cache');
        this.models = cachedModels;
        this.modelInfo = modelCache.get('modelInfo') || this.modelInfo;
        return;
      }
      
      // Load or train models
      await this.loadModels();
      
      // Cache the models
      modelCache.set('models', this.models);
      modelCache.set('modelInfo', this.modelInfo);
      
      console.log('Models initialized successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }
  }
  
  /**
   * Load models from storage or train new ones
   * @returns {Promise<void>}
   */
  async loadModels() {
    try {
      // Try to load saved models
      try {
        this.models.spread = await tf.loadLayersModel('file://./models/spread/model.json');
        this.models.overUnder = await tf.loadLayersModel('file://./models/overUnder/model.json');
        this.models.moneyline = await tf.loadLayersModel('file://./models/moneyline/model.json');
        this.models.score = await tf.loadLayersModel('file://./models/score/model.json');
        
        console.log('Loaded saved models');
      } catch (loadError) {
        console.log('Could not load saved models, training new ones');
        await this.trainModels();
      }
    } catch (error) {
      console.error('Error loading models:', error);
      throw error;
    }
  }
  
  /**
   * Train all prediction models
   * @returns {Promise<void>}
   */
  async trainModels() {
    try {
      console.log('Training models...');
      
      // Get training data
      const trainingData = await this.getTrainingData();
      
      if (!trainingData || trainingData.length === 0) {
        console.warn('No training data available');
        return;
      }
      
      // Train spread model
      this.models.spread = await this.trainSpreadModel(trainingData);
      
      // Train over/under model
      this.models.overUnder = await this.trainOverUnderModel(trainingData);
      
      // Train moneyline model
      this.models.moneyline = await this.trainMoneylineModel(trainingData);
      
      // Train score prediction model
      this.models.score = await this.trainScoreModel(trainingData);
      
      // Save models
      await this.saveModels();
      
      // Update model info
      this.modelInfo.lastTrained = new Date();
      
      console.log('Models trained successfully');
    } catch (error) {
      console.error('Error training models:', error);
      throw error;
    }
  }
  
  /**
   * Get training data from the database
   * @returns {Promise<Array>} Training data
   */
  async getTrainingData() {
    try {
      // Get completed games with results
      const games = await Game.find({
        'result.completed': true,
        'result.homeScore': { $exists: true },
        'result.awayScore': { $exists: true }
      }).sort({ date: -1 }).limit(10000);
      
      return games;
    } catch (error) {
      console.error('Error getting training data:', error);
      throw error;
    }
  }
  
  /**
   * Train spread prediction model
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} Trained model
   */
  async trainSpreadModel(trainingData) {
    try {
      // Extract features and labels
      const { features, labels } = this.prepareSpreadData(trainingData);
      
      // Create and train random forest model
      const model = new RandomForestClassifier({
        nEstimators: 100,
        maxDepth: 10,
        seed: 42
      });
      
      model.train(features, labels);
      
      // Evaluate model
      const predictions = model.predict(features);
      const accuracy = this.calculateAccuracy(predictions, labels);
      
      this.modelInfo.performance.spread = {
        accuracy,
        samples: features.length
      };
      
      // Get feature importance
      this.featureImportance.spread = this.calculateFeatureImportance(model, features);
      
      return model;
    } catch (error) {
      console.error('Error training spread model:', error);
      throw error;
    }
  }
  
  /**
   * Train over/under prediction model
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} Trained model
   */
  async trainOverUnderModel(trainingData) {
    try {
      // Extract features and labels
      const { features, labels } = this.prepareOverUnderData(trainingData);
      
      // Create and train random forest model
      const model = new RandomForestClassifier({
        nEstimators: 100,
        maxDepth: 10,
        seed: 42
      });
      
      model.train(features, labels);
      
      // Evaluate model
      const predictions = model.predict(features);
      const accuracy = this.calculateAccuracy(predictions, labels);
      
      this.modelInfo.performance.overUnder = {
        accuracy,
        samples: features.length
      };
      
      // Get feature importance
      this.featureImportance.overUnder = this.calculateFeatureImportance(model, features);
      
      return model;
    } catch (error) {
      console.error('Error training over/under model:', error);
      throw error;
    }
  }
  
  /**
   * Train moneyline prediction model
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} Trained model
   */
  async trainMoneylineModel(trainingData) {
    try {
      // Extract features and labels
      const { features, labels } = this.prepareMoneylineData(trainingData);
      
      // Create and train random forest model
      const model = new RandomForestClassifier({
        nEstimators: 100,
        maxDepth: 10,
        seed: 42
      });
      
      model.train(features, labels);
      
      // Evaluate model
      const predictions = model.predict(features);
      const accuracy = this.calculateAccuracy(predictions, labels);
      
      this.modelInfo.performance.moneyline = {
        accuracy,
        samples: features.length
      };
      
      // Get feature importance
      this.featureImportance.moneyline = this.calculateFeatureImportance(model, features);
      
      return model;
    } catch (error) {
      console.error('Error training moneyline model:', error);
      throw error;
    }
  }
  
  /**
   * Train score prediction model
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} Trained model
   */
  async trainScoreModel(trainingData) {
    try {
      // Extract features and labels
      const { features, homeScores, awayScores } = this.prepareScoreData(trainingData);
      
      // Convert to tensors
      const xs = tf.tensor2d(features);
      const yHome = tf.tensor1d(homeScores);
      const yAway = tf.tensor1d(awayScores);
      
      // Create model
      const model = tf.sequential();
      
      // Add layers
      model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [features[0].length]
      }));
      
      model.add(tf.layers.dense({
        units: 32,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 2, // Predict home and away scores
        activation: 'linear'
      }));
      
      // Compile model
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mse']
      });
      
      // Train model
      await model.fit(xs, tf.stack([yHome, yAway], 1), {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      });
      
      // Evaluate model
      const predictions = model.predict(xs);
      const predArray = await predictions.array();
      
      const mseHome = tf.metrics.meanSquaredError(yHome, tf.tensor1d(predArray.map(p => p[0]))).arraySync();
      const mseAway = tf.metrics.meanSquaredError(yAway, tf.tensor1d(predArray.map(p => p[1]))).arraySync();
      
      this.modelInfo.performance.score = {
        mseHome,
        mseAway,
        samples: features.length
      };
      
      return model;
    } catch (error) {
      console.error('Error training score model:', error);
      throw error;
    }
  }
  
  /**
   * Prepare data for spread prediction
   * @param {Array} games - Game data
   * @returns {Object} Features and labels
   */
  prepareSpreadData(games) {
    const features = [];
    const labels = [];
    
    games.forEach(game => {
      if (!game.odds || !game.odds.closing || !game.odds.closing.spread || !game.result.spreadResult) {
        return;
      }
      
      // Extract features
      const feature = this.extractGameFeatures(game);
      
      // Extract label (0 for away, 1 for home, 2 for push)
      let label;
      if (game.result.spreadResult === 'home') {
        label = 1;
      } else if (game.result.spreadResult === 'away') {
        label = 0;
      } else {
        label = 2;
      }
      
      features.push(feature);
      labels.push(label);
    });
    
    return { features, labels };
  }
  
  /**
   * Prepare data for over/under prediction
   * @param {Array} games - Game data
   * @returns {Object} Features and labels
   */
  prepareOverUnderData(games) {
    const features = [];
    const labels = [];
    
    games.forEach(game => {
      if (!game.odds || !game.odds.closing || !game.odds.closing.overUnder || !game.result.totalResult) {
        return;
      }
      
      // Extract features
      const feature = this.extractGameFeatures(game);
      
      // Extract label (0 for under, 1 for over, 2 for push)
      let label;
      if (game.result.totalResult === 'over') {
        label = 1;
      } else if (game.result.totalResult === 'under') {
        label = 0;
      } else {
        label = 2;
      }
      
      features.push(feature);
      labels.push(label);
    });
    
    return { features, labels };
  }
  
  /**
   * Prepare data for moneyline prediction
   * @param {Array} games - Game data
   * @returns {Object} Features and labels
   */
  prepareMoneylineData(games) {
    const features = [];
    const labels = [];
    
    games.forEach(game => {
      if (!game.odds || !game.odds.closing || !game.result.moneylineResult) {
        return;
      }
      
      // Extract features
      const feature = this.extractGameFeatures(game);
      
      // Extract label (0 for away, 1 for home)
      const label = game.result.moneylineResult === 'home' ? 1 : 0;
      
      features.push(feature);
      labels.push(label);
    });
    
    return { features, labels };
  }
  
  /**
   * Prepare data for score prediction
   * @param {Array} games - Game data
   * @returns {Object} Features and labels
   */
  prepareScoreData(games) {
    const features = [];
    const homeScores = [];
    const awayScores = [];
    
    games.forEach(game => {
      if (!game.result.homeScore || !game.result.awayScore) {
        return;
      }
      
      // Extract features
      const feature = this.extractGameFeatures(game);
      
      // Extract scores
      const homeScore = game.result.homeScore;
      const awayScore = game.result.awayScore;
      
      features.push(feature);
      homeScores.push(homeScore);
      awayScores.push(awayScore);
    });
    
    return { features, homeScores, awayScores };
  }
  
  /**
   * Extract features from a game
   * @param {Object} game - Game data
   * @returns {Array} Feature vector
   */
  extractGameFeatures(game) {
    // Basic features
    const features = [
      // Team stats
      game.homeTeam.stats?.offensiveRating || 0,
      game.homeTeam.stats?.defensiveRating || 0,
      game.homeTeam.stats?.pace || 0,
      game.homeTeam.stats?.strengthOfSchedule || 0,
      game.awayTeam.stats?.offensiveRating || 0,
      game.awayTeam.stats?.defensiveRating || 0,
      game.awayTeam.stats?.pace || 0,
      game.awayTeam.stats?.strengthOfSchedule || 0,
      
      // Home/away records
      game.homeTeam.stats?.homeRecord?.wins || 0,
      game.homeTeam.stats?.homeRecord?.losses || 0,
      game.awayTeam.stats?.awayRecord?.wins || 0,
      game.awayTeam.stats?.awayRecord?.losses || 0,
      
      // Odds
      game.odds?.closing?.spread || 0,
      game.odds?.closing?.overUnder || 0,
      game.odds?.closing?.homeMoneyline || 0,
      game.odds?.closing?.awayMoneyline || 0,
      
      // Line movement
      game.odds?.movement?.spread || 0,
      game.odds?.movement?.overUnder || 0,
      game.odds?.movement?.homeMoneyline || 0,
      game.odds?.movement?.awayMoneyline || 0,
      
      // Contextual factors
      game.factors?.restDays?.home || 0,
      game.factors?.restDays?.away || 0,
      game.factors?.backToBack?.home ? 1 : 0,
      game.factors?.backToBack?.away ? 1 : 0,
      
      // Weather (if applicable)
      game.factors?.weather?.temperature || 0,
      game.factors?.weather?.windSpeed || 0,
      game.factors?.weather?.precipitation || 0
    ];
    
    // Add recent form (last 5 games)
    const homeForm = game.homeTeam.stats?.recentForm || [];
    const awayForm = game.awayTeam.stats?.recentForm || [];
    
    // Pad or truncate to 5 games
    for (let i = 0; i < 5; i++) {
      features.push(i < homeForm.length ? homeForm[i] : 0);
    }
    
    for (let i = 0; i < 5; i++) {
      features.push(i < awayForm.length ? awayForm[i] : 0);
    }
    
    return features;
  }
  
  /**
   * Calculate accuracy of predictions
   * @param {Array} predictions - Predicted values
   * @param {Array} actual - Actual values
   * @returns {number} Accuracy
   */
  calculateAccuracy(predictions, actual) {
    let correct = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === actual[i]) {
        correct++;
      }
    }
    
    return correct / predictions.length;
  }
  
  /**
   * Calculate feature importance
   * @param {Object} model - Trained model
   * @param {Array} features - Feature vectors
   * @returns {Object} Feature importance
   */
  calculateFeatureImportance(model, features) {
    // This is a simplified implementation
    // In a real system, you would use permutation importance or other methods
    
    const featureNames = [
      'homeOffensiveRating',
      'homeDefensiveRating',
      'homePace',
      'homeStrengthOfSchedule',
      'awayOffensiveRating',
      'awayDefensiveRating',
      'awayPace',
      'awayStrengthOfSchedule',
      'homeWins',
      'homeLosses',
      'awayWins',
      'awayLosses',
      'spread',
      'overUnder',
      'homeMoneyline',
      'awayMoneyline',
      'spreadMovement',
      'overUnderMovement',
      'homeMoneylineMovement',
      'awayMoneylineMovement',
      'homeRestDays',
      'awayRestDays',
      'homeBackToBack',
      'awayBackToBack',
      'temperature',
      'windSpeed',
      'precipitation'
    ];
    
    // Add recent form feature names
    for (let i = 0; i < 5; i++) {
      featureNames.push(`homeForm${i+1}`);
    }
    
    for (let i = 0; i < 5; i++) {
      featureNames.push(`awayForm${i+1}`);
    }
    
    // Get importance values (random for this example)
    const importance = {};
    featureNames.forEach((name, index) => {
      importance[name] = Math.random(); // In a real system, get actual importance
    });
    
    return importance;
  }
  
  /**
   * Save models to storage
   * @returns {Promise<void>}
   */
  async saveModels() {
    try {
      // Save TensorFlow models
      if (this.models.score) {
        await this.models.score.save('file://./models/score');
      }
      
      // For non-TensorFlow models, we would need to serialize them
      // This is a simplified implementation
      console.log('Models saved successfully');
    } catch (error) {
      console.error('Error saving models:', error);
      throw error;
    }
  }
  
  /**
   * Make predictions for a game
   * @param {Object} game - Game data
   * @returns {Promise<Object>} Predictions
   */
  async predictGame(game) {
    try {
      // Check if models are initialized
      if (!this.models.spread || !this.models.overUnder || !this.models.moneyline || !this.models.score) {
        await this.initialize();
      }
      
      // Extract features
      const features = this.extractGameFeatures(game);
      
      // Make predictions
      const spreadPrediction = this.predictSpread(features);
      const overUnderPrediction = this.predictOverUnder(features);
      const moneylinePrediction = this.predictMoneyline(features);
      const scorePrediction = await this.predictScore(features);
      
      // Create prediction object
      const prediction = {
        gameId: game._id,
        sport: game.sport,
        timestamp: new Date(),
        predictions: {
          spread: spreadPrediction,
          overUnder: overUnderPrediction,
          moneyline: moneylinePrediction,
          score: scorePrediction
        },
        modelInfo: {
          version: this.modelInfo.version,
          type: 'ensemble',
          features: Object.keys(this.featureImportance.spread),
          performance: this.modelInfo.performance
        }
      };
      
      return prediction;
    } catch (error) {
      console.error('Error making predictions:', error);
      throw error;
    }
  }
  
  /**
   * Predict spread outcome
   * @param {Array} features - Feature vector
   * @returns {Object} Spread prediction
   */
  predictSpread(features) {
    // Make prediction
    const prediction = this.models.spread.predict([features])[0];
    
    // Calculate confidence
    const probabilities = this.models.spread.predictProbabilities([features])[0];
    const confidence = Math.max(...probabilities);
    
    // Determine pick
    let pick;
    if (prediction === 1) {
      pick = 'home';
    } else if (prediction === 0) {
      pick = 'away';
    } else {
      pick = null; // Push
    }
    
    // Get top factors
    const factors = this.getTopFactors(this.featureImportance.spread, features);
    
    return {
      pick,
      confidence,
      value: this.calculateValue(pick, confidence, features[12], features[14], features[15]), // spread, homeML, awayML
      factors
    };
  }
  
  /**
   * Predict over/under outcome
   * @param {Array} features - Feature vector
   * @returns {Object} Over/under prediction
   */
  predictOverUnder(features) {
    // Make prediction
    const prediction = this.models.overUnder.predict([features])[0];
    
    // Calculate confidence
    const probabilities = this.models.overUnder.predictProbabilities([features])[0];
    const confidence = Math.max(...probabilities);
    
    // Determine pick
    let pick;
    if (prediction === 1) {
      pick = 'over';
    } else if (prediction === 0) {
      pick = 'under';
    } else {
      pick = null; // Push
    }
    
    // Get top factors
    const factors = this.getTopFactors(this.featureImportance.overUnder, features);
    
    return {
      pick,
      confidence,
      value: this.calculateValue(pick, confidence, features[13]), // overUnder
      factors
    };
  }
  
  /**
   * Predict moneyline outcome
   * @param {Array} features - Feature vector
   * @returns {Object} Moneyline prediction
   */
  predictMoneyline(features) {
    // Make prediction
    const prediction = this.models.moneyline.predict([features])[0];
    
    // Calculate confidence
    const probabilities = this.models.moneyline.predictProbabilities([features])[0];
    const confidence = Math.max(...probabilities);
    
    // Determine pick
    const pick = prediction === 1 ? 'home' : 'away';
    
    // Get top factors
    const factors = this.getTopFactors(this.featureImportance.moneyline, features);
    
    return {
      pick,
      confidence,
      value: this.calculateValue(pick, confidence, 0, features[14], features[15]), // homeML, awayML
      factors
    };
  }
  
  /**
   * Predict game score
   * @param {Array} features - Feature vector
   * @returns {Promise<Object>} Score prediction
   */
  async predictScore(features) {
    // Convert to tensor
    const xs = tf.tensor2d([features]);
    
    // Make prediction
    const prediction = this.models.score.predict(xs);
    const [homeScore, awayScore] = await prediction.array()[0];
    
    // Round scores
    const homeScoreRounded = Math.round(homeScore);
    const awayScoreRounded = Math.round(awayScore);
    
    // Calculate confidence (simplified)
    const homeConfidence = 0.7; // In a real system, calculate based on model uncertainty
    const awayConfidence = 0.7;
    
    return {
      homeScore: {
        prediction: homeScoreRounded,
        confidence: homeConfidence
      },
      awayScore: {
        prediction: awayScoreRounded,
        confidence: awayConfidence
      },
      factors: [] // In a real system, calculate factors
    };
  }
  
  /**
   * Get top factors influencing a prediction
   * @param {Object} importance - Feature importance
   * @param {Array} features - Feature vector
   * @returns {Array} Top factors
   */
  getTopFactors(importance, features) {
    // Get feature names
    const featureNames = Object.keys(importance);
    
    // Calculate impact (importance * feature value)
    const impacts = featureNames.map((name, index) => ({
      name,
      weight: importance[name],
      impact: importance[name] * (index < features.length ? features[index] : 0)
    }));
    
    // Sort by absolute impact
    impacts.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    
    // Return top 5 factors
    return impacts.slice(0, 5);
  }
  
  /**
   * Calculate expected value of a bet
   * @param {string} pick - Prediction pick
   * @param {number} confidence - Prediction confidence
   * @param {number} spread - Spread
   * @param {number} homeMoneyline - Home moneyline
   * @param {number} awayMoneyline - Away moneyline
   * @returns {number} Expected value
   */
  calculateValue(pick, confidence, spread, homeMoneyline, awayMoneyline) {
    // This is a simplified implementation
    // In a real system, you would use Kelly criterion or other methods
    
    if (!pick) {
      return 0;
    }
    
    let odds;
    if (pick === 'home') {
      odds = homeMoneyline;
    } else if (pick === 'away') {
      odds = awayMoneyline;
    } else if (pick === 'over' || pick === 'under') {
      odds = -110; // Standard odds for over/under
    } else {
      return 0;
    }
    
    // Convert American odds to probability
    let impliedProbability;
    if (odds > 0) {
      impliedProbability = 100 / (odds + 100);
    } else {
      impliedProbability = Math.abs(odds) / (Math.abs(odds) + 100);
    }
    
    // Calculate edge (model probability - implied probability)
    const edge = confidence - impliedProbability;
    
    // Calculate expected value
    const expectedValue = (confidence * 1) - ((1 - confidence) * 1);
    
    return edge > 0 ? expectedValue : 0;
  }
  
  /**
   * Get model performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformance() {
    return this.modelInfo.performance;
  }
  
  /**
   * Get model version and training info
   * @returns {Object} Model info
   */
  getModelInfo() {
    return {
      version: this.modelInfo.version,
      lastTrained: this.modelInfo.lastTrained,
      performance: this.modelInfo.performance
    };
  }
}

// Export singleton instance
const modelService = new ModelService();
module.exports = modelService;