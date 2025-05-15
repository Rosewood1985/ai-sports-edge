/**
 * Enhanced Model Training Script
 * Trains machine learning models using features from multiple sports APIs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs-node');
const RandomForest = require('ml-random-forest').RandomForestClassifier;

// Data directories
const FEATURES_DIR = path.join(__dirname, '..', 'data', 'features');
const MODELS_DIR = path.join(__dirname, 'saved');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

/**
 * Load feature data for a sport and prediction type
 * @param {string} sport - Sport key
 * @param {string} predictionType - Type of prediction (spread, moneyline, total, winner)
 * @returns {Array} - Feature data
 */
function loadFeatureData(sport, predictionType) {
  // Find the most recent feature data file for the sport and prediction type
  const files = fs.readdirSync(FEATURES_DIR)
    .filter(file => file.startsWith(`${sport.toLowerCase()}_${predictionType}_features_`))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log(`No feature data found for ${sport} ${predictionType}`);
    return null;
  }
  
  const filePath = path.join(FEATURES_DIR, files[0]);
  console.log(`Loading feature data for ${sport} ${predictionType} from ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading feature data for ${sport} ${predictionType}:`, error);
    return null;
  }
}

/**
 * Prepare data for model training
 * @param {Array} featureData - Feature data
 * @returns {Object} - Prepared data for training
 */
function prepareData(featureData) {
  // Filter out features without labels (future events)
  const labeledData = featureData.filter(item => item.label !== null);
  
  if (labeledData.length === 0) {
    console.log('No labeled data available for training');
    return null;
  }
  
  console.log(`Preparing data for training with ${labeledData.length} labeled examples`);
  
  // Get feature names (excluding metadata and label)
  const excludeFields = ['gameId', 'raceId', 'fightId', 'eventId', 'date', 'homeTeam', 'awayTeam', 
                         'fighter1Name', 'fighter2Name', 'driverName', 'raceName', 'trackName', 
                         'eventName', 'label'];
  
  const featureNames = Object.keys(labeledData[0]).filter(key => !excludeFields.includes(key));
  
  // Extract features and labels
  const features = labeledData.map(item => featureNames.map(name => item[name]));
  const labels = labeledData.map(item => item.label);
  
  // Split data into training, validation, and test sets (70/15/15)
  const numExamples = features.length;
  const numTraining = Math.floor(numExamples * 0.7);
  const numValidation = Math.floor(numExamples * 0.15);
  
  // Shuffle data
  const indices = Array.from(Array(numExamples).keys());
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Split data
  const trainIndices = indices.slice(0, numTraining);
  const valIndices = indices.slice(numTraining, numTraining + numValidation);
  const testIndices = indices.slice(numTraining + numValidation);
  
  const trainFeatures = trainIndices.map(i => features[i]);
  const trainLabels = trainIndices.map(i => labels[i]);
  
  const valFeatures = valIndices.map(i => features[i]);
  const valLabels = valIndices.map(i => labels[i]);
  
  const testFeatures = testIndices.map(i => features[i]);
  const testLabels = testIndices.map(i => labels[i]);
  
  return {
    featureNames,
    trainFeatures,
    trainLabels,
    valFeatures,
    valLabels,
    testFeatures,
    testLabels
  };
}

/**
 * Train a TensorFlow.js model
 * @param {Array} trainFeatures - Training features
 * @param {Array} trainLabels - Training labels
 * @param {Array} valFeatures - Validation features
 * @param {Array} valLabels - Validation labels
 * @param {number} numFeatures - Number of features
 * @returns {Object} - Trained model and metrics
 */
async function trainTensorFlowModel(trainFeatures, trainLabels, valFeatures, valLabels, numFeatures) {
  console.log('Training TensorFlow.js model...');
  
  // Convert to tensors
  const xs = tf.tensor2d(trainFeatures);
  const ys = tf.tensor2d(trainLabels.map(l => [l]));
  
  const valXs = tf.tensor2d(valFeatures);
  const valYs = tf.tensor2d(valLabels.map(l => [l]));
  
  // Create model
  const model = tf.sequential();
  
  // Add layers
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    inputShape: [numFeatures]
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  
  // Train model
  const history = await model.fit(xs, ys, {
    epochs: 100,
    batchSize: 32,
    validationData: [valXs, valYs],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_accuracy = ${logs.val_acc.toFixed(4)}`);
        }
      }
    }
  });
  
  // Get final metrics
  const trainLoss = history.history.loss[history.history.loss.length - 1];
  const trainAccuracy = history.history.acc[history.history.acc.length - 1];
  const valLoss = history.history.val_loss[history.history.val_loss.length - 1];
  const valAccuracy = history.history.val_acc[history.history.val_acc.length - 1];
  
  console.log('TensorFlow.js model training completed:');
  console.log(`- Training loss: ${trainLoss.toFixed(4)}`);
  console.log(`- Training accuracy: ${(trainAccuracy * 100).toFixed(2)}%`);
  console.log(`- Validation loss: ${valLoss.toFixed(4)}`);
  console.log(`- Validation accuracy: ${(valAccuracy * 100).toFixed(2)}%`);
  
  return {
    model,
    metrics: {
      trainLoss,
      trainAccuracy,
      valLoss,
      valAccuracy
    }
  };
}

/**
 * Train a Random Forest model
 * @param {Array} trainFeatures - Training features
 * @param {Array} trainLabels - Training labels
 * @param {Array} valFeatures - Validation features
 * @param {Array} valLabels - Validation labels
 * @returns {Object} - Trained model and metrics
 */
function trainRandomForestModel(trainFeatures, trainLabels, valFeatures, valLabels) {
  console.log('Training Random Forest model...');
  
  // Create and train model
  const rf = new RandomForest({
    nEstimators: 100,
    maxDepth: 15,
    seed: 42
  });
  
  // Train model
  rf.train(trainFeatures, trainLabels);
  
  // Make predictions on training data
  const trainPredictions = rf.predict(trainFeatures);
  
  // Calculate training accuracy
  let trainCorrect = 0;
  for (let i = 0; i < trainLabels.length; i++) {
    if (trainPredictions[i] === trainLabels[i]) {
      trainCorrect++;
    }
  }
  const trainAccuracy = trainCorrect / trainLabels.length;
  
  // Make predictions on validation data
  const valPredictions = rf.predict(valFeatures);
  
  // Calculate validation accuracy
  let valCorrect = 0;
  for (let i = 0; i < valLabels.length; i++) {
    if (valPredictions[i] === valLabels[i]) {
      valCorrect++;
    }
  }
  const valAccuracy = valCorrect / valLabels.length;
  
  console.log('Random Forest model training completed:');
  console.log(`- Training accuracy: ${(trainAccuracy * 100).toFixed(2)}%`);
  console.log(`- Validation accuracy: ${(valAccuracy * 100).toFixed(2)}%`);
  
  return {
    model: rf,
    metrics: {
      trainAccuracy,
      valAccuracy
    }
  };
}

/**
 * Evaluate model on test data
 * @param {Object} model - Trained model
 * @param {string} modelType - Type of model ('tf' or 'rf')
 * @param {Array} testFeatures - Test features
 * @param {Array} testLabels - Test labels
 * @returns {Object} - Evaluation metrics
 */
async function evaluateModel(model, modelType, testFeatures, testLabels) {
  console.log(`Evaluating ${modelType} model on test data...`);
  
  let predictions;
  
  if (modelType === 'tf') {
    // Make predictions with TensorFlow.js model
    const testXs = tf.tensor2d(testFeatures);
    const predictionsTensor = model.predict(testXs);
    const predictionsArray = await predictionsTensor.array();
    predictions = predictionsArray.map(p => p[0] >= 0.5 ? 1 : 0);
  } else {
    // Make predictions with Random Forest model
    predictions = model.predict(testFeatures);
  }
  
  // Calculate accuracy
  let correct = 0;
  for (let i = 0; i < testLabels.length; i++) {
    if (predictions[i] === testLabels[i]) {
      correct++;
    }
  }
  const accuracy = correct / testLabels.length;
  
  // Calculate precision, recall, and F1 score
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  for (let i = 0; i < testLabels.length; i++) {
    if (predictions[i] === 1 && testLabels[i] === 1) {
      truePositives++;
    } else if (predictions[i] === 1 && testLabels[i] === 0) {
      falsePositives++;
    } else if (predictions[i] === 0 && testLabels[i] === 1) {
      falseNegatives++;
    }
  }
  
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = 2 * precision * recall / (precision + recall) || 0;
  
  console.log(`${modelType} model evaluation results:`);
  console.log(`- Test accuracy: ${(accuracy * 100).toFixed(2)}%`);
  console.log(`- Precision: ${(precision * 100).toFixed(2)}%`);
  console.log(`- Recall: ${(recall * 100).toFixed(2)}%`);
  console.log(`- F1 score: ${(f1Score * 100).toFixed(2)}%`);
  
  return {
    accuracy,
    precision,
    recall,
    f1Score
  };
}

/**
 * Save TensorFlow.js model
 * @param {Object} model - Trained TensorFlow.js model
 * @param {string} sport - Sport key
 * @param {string} predictionType - Type of prediction
 * @param {Object} metrics - Model metrics
 */
async function saveTensorFlowModel(model, sport, predictionType, metrics) {
  const modelDir = path.join(MODELS_DIR, `${sport.toLowerCase()}_${predictionType}_tf`);
  
  // Save model
  await model.save(`file://${modelDir}`);
  
  // Save model metadata
  const metadata = {
    sport,
    predictionType,
    modelType: 'tensorflow',
    metrics,
    timestamp: new Date().toISOString(),
    featureVersion: 1
  };
  
  fs.writeFileSync(
    path.join(modelDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`TensorFlow.js model saved to ${modelDir}`);
}

/**
 * Save Random Forest model
 * @param {Object} model - Trained Random Forest model
 * @param {string} sport - Sport key
 * @param {string} predictionType - Type of prediction
 * @param {Object} metrics - Model metrics
 * @param {Array} featureNames - Feature names
 */
function saveRandomForestModel(model, sport, predictionType, metrics, featureNames) {
  const modelDir = path.join(MODELS_DIR, `${sport.toLowerCase()}_${predictionType}_rf`);
  
  // Ensure model directory exists
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }
  
  // Save model metadata
  const metadata = {
    sport,
    predictionType,
    modelType: 'randomforest',
    metrics,
    timestamp: new Date().toISOString(),
    featureVersion: 1,
    featureNames,
    hyperparameters: {
      nEstimators: 100,
      maxDepth: 15
    }
  };
  
  fs.writeFileSync(
    path.join(modelDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  // Save model (in a real implementation, we would serialize the model)
  // For now, we'll just save the metadata
  console.log(`Random Forest model metadata saved to ${modelDir}`);
}

/**
 * Train models for a specific sport and prediction type
 * @param {string} sport - Sport key
 * @param {string} predictionType - Type of prediction
 */
async function trainModels(sport, predictionType) {
  console.log(`Training models for ${sport} ${predictionType}...`);
  
  // Load feature data
  const featureData = loadFeatureData(sport, predictionType);
  if (!featureData) {
    console.log(`No feature data available for ${sport} ${predictionType}`);
    return;
  }
  
  // Prepare data for training
  const data = prepareData(featureData);
  if (!data) {
    console.log(`Could not prepare data for ${sport} ${predictionType}`);
    return;
  }
  
  const { featureNames, trainFeatures, trainLabels, valFeatures, valLabels, testFeatures, testLabels } = data;
  
  // Train TensorFlow.js model
  const tfResult = await trainTensorFlowModel(
    trainFeatures,
    trainLabels,
    valFeatures,
    valLabels,
    featureNames.length
  );
  
  // Evaluate TensorFlow.js model
  const tfEvaluation = await evaluateModel(
    tfResult.model,
    'tf',
    testFeatures,
    testLabels
  );
  
  // Save TensorFlow.js model
  await saveTensorFlowModel(
    tfResult.model,
    sport,
    predictionType,
    {
      ...tfResult.metrics,
      ...tfEvaluation
    }
  );
  
  // Train Random Forest model
  const rfResult = trainRandomForestModel(
    trainFeatures,
    trainLabels,
    valFeatures,
    valLabels
  );
  
  // Evaluate Random Forest model
  const rfEvaluation = await evaluateModel(
    rfResult.model,
    'rf',
    testFeatures,
    testLabels
  );
  
  // Save Random Forest model
  saveRandomForestModel(
    rfResult.model,
    sport,
    predictionType,
    {
      ...rfResult.metrics,
      ...rfEvaluation
    },
    featureNames
  );
  
  console.log(`Completed training models for ${sport} ${predictionType}`);
  
  // Return evaluation results
  return {
    tensorflow: {
      ...tfResult.metrics,
      ...tfEvaluation
    },
    randomForest: {
      ...rfResult.metrics,
      ...rfEvaluation
    }
  };
}

/**
 * Train models for a specific sport
 * @param {string} sport - Sport key
 */
async function trainModelsForSport(sport) {
  console.log(`Training all models for ${sport}...`);
  
  const results = {};
  
  // Determine prediction types based on sport
  let predictionTypes;
  
  if (sport === 'FORMULA1' || sport === 'UFC') {
    predictionTypes = ['winner'];
  } else {
    predictionTypes = ['spread', 'moneyline', 'total'];
  }
  
  // Train models for each prediction type
  for (const predictionType of predictionTypes) {
    try {
      results[predictionType] = await trainModels(sport, predictionType);
    } catch (error) {
      console.error(`Error training models for ${sport} ${predictionType}:`, error);
    }
  }
  
  // Save overall results
  const resultsPath = path.join(MODELS_DIR, `${sport.toLowerCase()}_training_results.json`);
  fs.writeFileSync(
    resultsPath,
    JSON.stringify({
      sport,
      timestamp: new Date().toISOString(),
      results
    }, null, 2)
  );
  
  console.log(`Saved training results for ${sport} to ${resultsPath}`);
  
  return results;
}

/**
 * Train models for all sports
 */
async function trainAllSportsModels() {
  console.log('Starting model training process...');
  
  // List of sports to train models for
  const sports = ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS', 'FORMULA1', 'UFC'];
  
  const allResults = {};
  
  // Train models for each sport
  for (const sport of sports) {
    try {
      allResults[sport] = await trainModelsForSport(sport);
    } catch (error) {
      console.error(`Error training models for ${sport}:`, error);
    }
  }
  
  // Save overall results
  const resultsPath = path.join(MODELS_DIR, 'all_training_results.json');
  fs.writeFileSync(
    resultsPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      results: allResults
    }, null, 2)
  );
  
  console.log(`Saved all training results to ${resultsPath}`);
  console.log('Model training process completed');
  
  return allResults;
}

// Execute if run directly
if (require.main === module) {
  trainAllSportsModels()
    .then(() => {
      console.log('Enhanced model training script completed successfully');
    })
    .catch(error => {
      console.error('Error in enhanced model training script:', error);
      process.exit(1);
    });
}

module.exports = {
  trainModels,
  trainModelsForSport,
  trainAllSportsModels,
  trainTensorFlowModel,
  trainRandomForestModel,
  evaluateModel
};