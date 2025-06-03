/**
 * Model Training Script
 * Trains machine learning models for sports predictions
 */

require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const RandomForest = require('ml-random-forest').RandomForestClassifier;

// Data directory
const DATA_DIR = path.join(__dirname, '..', 'data', 'raw');
const MODELS_DIR = path.join(__dirname, 'saved');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

/**
 * Load and preprocess data for model training
 * @param {string} sport - Sport key
 * @returns {Object} - Processed data for training
 */
function loadAndPreprocessData(sport) {
  console.log(`Loading and preprocessing data for ${sport}...`);

  // In a real implementation, this would:
  // 1. Load historical game data from files or database
  // 2. Clean and normalize the data
  // 3. Extract features and labels
  // 4. Split into training and validation sets

  // For demonstration, we'll create synthetic data
  const syntheticData = generateSyntheticData(sport);

  return syntheticData;
}

/**
 * Generate synthetic data for model training
 * @param {string} sport - Sport key
 * @returns {Object} - Synthetic data for training
 */
function generateSyntheticData(sport) {
  console.log(`Generating synthetic data for ${sport}...`);

  // Number of samples
  const numSamples = 1000;

  // Features:
  // - Home team strength (0-1)
  // - Away team strength (0-1)
  // - Home team recent form (0-1)
  // - Away team recent form (0-1)
  // - Home court advantage (0-1)
  // - Rest days home team (normalized)
  // - Rest days away team (normalized)
  // - Historical matchup advantage (0-1)

  const features = [];
  const spreadLabels = [];
  const totalLabels = [];
  const moneylineLabels = [];

  for (let i = 0; i < numSamples; i++) {
    // Generate random feature values
    const homeStrength = Math.random();
    const awayStrength = Math.random();
    const homeForm = Math.random();
    const awayForm = Math.random();
    const homeAdvantage = Math.random() * 0.2 + 0.1; // 0.1-0.3
    const homeRestDays = Math.min(Math.random() * 5, 4) / 4; // 0-4 days, normalized
    const awayRestDays = Math.min(Math.random() * 5, 4) / 4; // 0-4 days, normalized
    const historicalAdvantage = Math.random();

    // Create feature vector
    const featureVector = [
      homeStrength,
      awayStrength,
      homeForm,
      awayForm,
      homeAdvantage,
      homeRestDays,
      awayRestDays,
      historicalAdvantage,
    ];

    features.push(featureVector);

    // Generate labels based on features
    // Spread: 0 = away covers, 1 = home covers
    const spreadProb =
      0.4 + 0.3 * (homeStrength - awayStrength) + 0.2 * (homeForm - awayForm) + 0.1 * homeAdvantage;
    spreadLabels.push(Math.random() < spreadProb ? 1 : 0);

    // Total: 0 = under, 1 = over
    const totalProb =
      0.5 +
      0.2 * (homeStrength + awayStrength) +
      0.1 * (homeForm + awayForm) -
      0.1 * (homeRestDays + awayRestDays);
    totalLabels.push(Math.random() < totalProb ? 1 : 0);

    // Moneyline: 0 = away wins, 1 = home wins
    const moneylineProb =
      0.5 +
      0.25 * (homeStrength - awayStrength) +
      0.15 * (homeForm - awayForm) +
      0.1 * homeAdvantage;
    moneylineLabels.push(Math.random() < moneylineProb ? 1 : 0);
  }

  return {
    features,
    labels: {
      spread: spreadLabels,
      total: totalLabels,
      moneyline: moneylineLabels,
    },
  };
}

/**
 * Train a TensorFlow.js model for spread prediction
 * @param {Array} features - Feature vectors
 * @param {Array} labels - Labels
 * @param {string} sport - Sport key
 * @returns {Object} - Trained model and metrics
 */
async function trainTensorFlowModel(features, labels, sport) {
  console.log(`Training TensorFlow.js model for ${sport}...`);

  // Convert to tensors
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  // Create model
  const model = tf.sequential();

  // Add layers
  model.add(
    tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [features[0].length],
    })
  );

  model.add(
    tf.layers.dense({
      units: 8,
      activation: 'relu',
    })
  );

  model.add(
    tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    })
  );

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  // Train model
  const history = await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    verbose: 0,
  });

  // Get final accuracy
  const accuracy = history.history.acc[history.history.acc.length - 1];
  const valAccuracy = history.history.val_acc[history.history.val_acc.length - 1];

  console.log(`${sport} model training completed:`);
  console.log(`- Training accuracy: ${(accuracy * 100).toFixed(2)}%`);
  console.log(`- Validation accuracy: ${(valAccuracy * 100).toFixed(2)}%`);

  // Save model
  const modelPath = path.join(MODELS_DIR, `${sport.toLowerCase()}_tf_model`);
  await model.save(`file://${modelPath}`);
  console.log(`Model saved to ${modelPath}`);

  return {
    model,
    metrics: {
      accuracy,
      valAccuracy,
    },
  };
}

/**
 * Train a Random Forest model for prediction
 * @param {Array} features - Feature vectors
 * @param {Array} labels - Labels
 * @param {string} sport - Sport key
 * @param {string} betType - Bet type (spread, total, moneyline)
 * @returns {Object} - Trained model and metrics
 */
function trainRandomForestModel(features, labels, sport, betType) {
  console.log(`Training Random Forest model for ${sport} ${betType}...`);

  // Create and train model
  const rf = new RandomForest({
    nEstimators: 100,
    maxDepth: 10,
    seed: 42,
  });

  // Train model
  rf.train(features, labels);

  // Make predictions on training data to evaluate
  const predictions = rf.predict(features);

  // Calculate accuracy
  let correct = 0;
  for (let i = 0; i < labels.length; i++) {
    if (predictions[i] === labels[i]) {
      correct++;
    }
  }
  const accuracy = correct / labels.length;

  console.log(`${sport} ${betType} Random Forest model training completed:`);
  console.log(`- Training accuracy: ${(accuracy * 100).toFixed(2)}%`);

  // Save model (in a real implementation, we would serialize the model)
  const modelInfo = {
    sport,
    betType,
    accuracy,
    timestamp: new Date().toISOString(),
    // We can't actually save the RF model easily in this demo,
    // but in a real implementation we would serialize it
    modelType: 'RandomForest',
    hyperparameters: {
      nEstimators: 100,
      maxDepth: 10,
    },
  };

  const modelInfoPath = path.join(MODELS_DIR, `${sport.toLowerCase()}_${betType}_rf_info.json`);
  fs.writeFileSync(modelInfoPath, JSON.stringify(modelInfo, null, 2));
  console.log(`Model info saved to ${modelInfoPath}`);

  return {
    model: rf,
    metrics: {
      accuracy,
    },
  };
}

/**
 * Train all models for a specific sport
 * @param {string} sport - Sport key
 */
async function trainModelsForSport(sport) {
  console.log(`Training all models for ${sport}...`);

  // Load and preprocess data
  const data = loadAndPreprocessData(sport);

  // Train Random Forest models for each bet type
  const spreadRfModel = trainRandomForestModel(data.features, data.labels.spread, sport, 'spread');

  const totalRfModel = trainRandomForestModel(data.features, data.labels.total, sport, 'total');

  const moneylineRfModel = trainRandomForestModel(
    data.features,
    data.labels.moneyline,
    sport,
    'moneyline'
  );

  // Train TensorFlow.js model for moneyline (as an example)
  const tfModel = await trainTensorFlowModel(data.features, data.labels.moneyline, sport);

  console.log(`Completed model training for ${sport}`);

  return {
    randomForest: {
      spread: spreadRfModel,
      total: totalRfModel,
      moneyline: moneylineRfModel,
    },
    tensorflow: tfModel,
  };
}

/**
 * Main function to train all models
 */
async function trainAllModels() {
  console.log('Starting model training process...');

  // List of sports to train models for
  const sports = ['NBA', 'NHL']; // Reduced list for demonstration

  // Train models for each sport
  for (const sport of sports) {
    await trainModelsForSport(sport);
  }

  console.log('Model training process completed');
}

// Execute if run directly
if (require.main === module) {
  trainAllModels()
    .then(() => {
      console.log('Training script completed successfully');
    })
    .catch(error => {
      console.error('Error in training script:', error);
      process.exit(1);
    });
}

module.exports = {
  loadAndPreprocessData,
  trainRandomForestModel,
  trainTensorFlowModel,
  trainModelsForSport,
  trainAllModels,
};
