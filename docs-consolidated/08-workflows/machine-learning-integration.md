# Machine Learning Integration

This document provides an overview of the machine learning integration in the AI Sports Edge application.

## Overview

The AI Sports Edge application uses TensorFlow.js to provide AI-powered predictions for sports outcomes. The implementation includes:

- TensorFlow.js integration for client-side machine learning
- Sport-specific prediction models
- Feature generation for different sports
- Feedback loop for model improvement
- Multi-language support (English and Spanish)

## Architecture

### mlPredictionService.ts

The `mlPredictionService.ts` file is the core of the machine learning integration. It provides:

- Model loading and caching
- Feature generation for different sports
- Prediction generation
- Feedback collection and processing

### Integration with aiPredictionService.ts

The `aiPredictionService.ts` file has been updated to use the `mlPredictionService.ts` for generating predictions. This provides a seamless transition from the previous implementation to the new machine learning-based approach.

## Model Loading and Caching

Models are loaded from a remote server and cached in memory to improve performance. The caching system includes:

- In-memory cache for fast access
- Fallback to default models when sport-specific models are unavailable
- Automatic cache invalidation when new model versions are available

```typescript
// Example model loading with caching
export const loadModel = async (sport: string): Promise<tf.LayersModel | null> => {
  try {
    // Check if model is already loaded
    if (modelCache[sport]) {
      return modelCache[sport];
    }
    
    // Determine model URL based on sport
    const modelUrl = `${MODEL_BASE_URL}/${sport.toLowerCase()}/model.json`;
    
    // Load model from URL
    const model = await loadLayersModel(modelUrl);
    
    // Cache the model
    modelCache[sport] = model;
    
    return model;
  } catch (error) {
    console.error(`Error loading model for ${sport}:`, error);
    
    // Fall back to default model
    try {
      const defaultModel = await loadLayersModel(`${MODEL_BASE_URL}/default/model.json`);
      modelCache[sport] = defaultModel;
      return defaultModel;
    } catch (fallbackError) {
      console.error('Error loading default model:', fallbackError);
      return null;
    }
  }
};
```

## Feature Generation

Features are generated based on the sport type, with different features for different sports. This provides more accurate predictions by leveraging the unique characteristics of each sport.

```typescript
// Example feature generation
const generateFeatures = (game: Game, sport: string): tf.Tensor => {
  // Base features array
  const features: number[] = [];
  
  // Extract common features
  features.push(
    game.home_team_win_percentage || 0.5,
    game.away_team_win_percentage || 0.5,
    game.home_team_recent_form || 0.5,
    game.away_team_recent_form || 0.5
  );
  
  // Add sport-specific features
  switch (sport) {
    case 'basketball':
      features.push(
        game.home_team_offensive_rating || 100,
        game.away_team_offensive_rating || 100,
        game.home_team_defensive_rating || 100,
        game.away_team_defensive_rating || 100,
        game.home_team_pace || 100,
        game.away_team_pace || 100
      );
      break;
    case 'baseball':
      features.push(
        game.home_team_batting_average || 0.250,
        game.away_team_batting_average || 0.250,
        game.home_team_era || 4.0,
        game.away_team_era || 4.0,
        game.home_pitcher_era || 4.0,
        game.away_pitcher_era || 4.0
      );
      break;
    // Add more sports as needed
    default:
      // Add generic features for unsupported sports
      features.push(0.5, 0.5, 0.5, 0.5);
  }
  
  // Normalize features to [0, 1] range
  const normalizedFeatures = features.map(f => Math.max(0, Math.min(1, f / 100)));
  
  return tf.tensor2d([normalizedFeatures]);
};
```

## Feedback Loop

The feedback loop collects information about prediction accuracy and uses it to improve future predictions. This includes:

- Storing prediction outcomes in Firestore
- Tracking historical accuracy by sport
- Triggering model retraining when enough feedback is collected

```typescript
// Example feedback collection
export const recordFeedback = async (
  gameId: string,
  actualWinner: string
): Promise<boolean> => {
  try {
    // Get the prediction from cache or database
    const prediction = await getPrediction(gameId);
    if (!prediction) {
      console.error('No prediction found for game:', gameId);
      return false;
    }
    
    const wasCorrect = prediction.predicted_winner === actualWinner;
    
    // Create feedback entry
    const feedback = {
      gameId,
      predictedWinner: prediction.predicted_winner,
      actualWinner,
      wasCorrect,
      confidenceScore: prediction.confidence_score,
      timestamp: Date.now()
    };
    
    // Store feedback in database
    await firestore.collection('predictionFeedback').add(feedback);
    
    // Update model accuracy metrics
    await updateModelAccuracy(prediction.sport, wasCorrect);
    
    // Check if retraining is needed
    const feedbackCount = await getFeedbackCount(prediction.sport);
    if (feedbackCount >= RETRAINING_THRESHOLD) {
      // Trigger model retraining
      await triggerModelRetraining(prediction.sport);
    }
    
    return true;
  } catch (error) {
    console.error('Error recording prediction feedback:', error);
    return false;
  }
};
```

## Multi-Language Support

The machine learning integration includes support for multiple languages, with predictions and reasoning available in both English and Spanish.

```typescript
// Example multi-language reasoning generation
const generateReasoning = (
  sport: string,
  team: string,
  language: string
): string => {
  const reasonings = language === 'es'
    ? getSpanishReasonings(sport, team)
    : getEnglishReasonings(sport, team);
  
  return reasonings[Math.floor(Math.random() * reasonings.length)];
};
```

## Performance Considerations

The machine learning integration is designed to be performant on both web and mobile platforms:

- Models are loaded asynchronously to avoid blocking the UI
- Caching is used to avoid repeated model loading
- Feature generation is optimized for performance
- Fallback mechanisms ensure predictions are available even when models fail to load

## Future Enhancements

Planned enhancements for the machine learning integration include:

- More sophisticated feature generation
- Improved model architecture
- Real-time model updates
- More comprehensive feedback loop
- Integration with additional sports