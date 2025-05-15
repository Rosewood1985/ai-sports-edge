# Machine Learning Integration Architecture

## Overview

This document outlines the architecture for implementing machine learning features for predictive analytics in AI Sports Edge. The goal is to provide users with data-driven predictions and insights to improve their betting decisions.

## Goals

1. Implement ML models for predicting game outcomes, player performance, and betting opportunities
2. Create a scalable ML pipeline for data processing, model training, and inference
3. Integrate ML predictions into the user interface in an intuitive way
4. Establish a feedback loop to continuously improve model accuracy

## Architecture Components

### 1. Data Processing Pipeline

A robust pipeline for collecting, cleaning, and preparing data for ML models.

```typescript
// services/mlDataPipelineService.ts

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file';
  refreshInterval: number; // in minutes
  lastRefreshed?: Date;
  config: Record<string, any>;
}

export interface DataTransformation {
  id: string;
  name: string;
  description: string;
  inputDatasetIds: string[];
  outputDatasetId: string;
  transformationFunction: string; // Stored as a string for flexibility
  parameters: Record<string, any>;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  schema: Record<string, string>; // field name -> data type
  sourceId?: string;
  transformationId?: string;
  lastUpdated: Date;
  rowCount: number;
  sampleData?: Record<string, any>[];
}
```

The data pipeline will handle:

1. **Data Collection**: Scheduled fetching from various sources (APIs, databases)
2. **Data Cleaning**: Handling missing values, outliers, and inconsistencies
3. **Feature Engineering**: Creating derived features that improve model performance
4. **Data Transformation**: Normalizing, encoding categorical variables, etc.
5. **Dataset Management**: Versioning and storing processed datasets

### 2. ML Model Service

A service for managing ML models, including training, evaluation, and inference.

```typescript
// services/mlModelService.ts

export interface MLModel {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'clustering';
  algorithm: string;
  version: string;
  status: 'training' | 'ready' | 'failed' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
  trainDatasetId: string;
  validationDatasetId: string;
  hyperparameters: Record<string, any>;
  metrics: Record<string, number>;
  featureImportance?: Record<string, number>;
}

export interface MLPrediction {
  modelId: string;
  modelVersion: string;
  timestamp: Date;
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number;
  explanations?: Record<string, any>;
}
```

The model service will provide:

1. **Model Training**: APIs for training models on prepared datasets
2. **Model Registry**: Storage and versioning of trained models
3. **Model Evaluation**: Tools for assessing model performance
4. **Model Serving**: APIs for generating predictions from models
5. **Explainability**: Methods for explaining model predictions

### 3. Prediction Types

We'll implement several types of predictions to enhance the betting experience:

#### Game Outcome Predictions

```typescript
// models/gameOutcomePrediction.ts

export interface GameOutcomePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  predictedWinner: string;
  winProbability: number; // 0-1
  predictedScoreHome: number;
  predictedScoreAway: number;
  confidenceLevel: number; // 0-1
  keyFactors: {
    factor: string;
    impact: number; // -1 to 1
  }[];
  modelId: string;
  generatedAt: Date;
}
```

#### Player Performance Predictions

```typescript
// models/playerPerformancePrediction.ts

export interface PlayerPerformancePrediction {
  playerId: string;
  playerName: string;
  gameId: string;
  predictedStats: {
    [statName: string]: {
      predictedValue: number;
      confidenceInterval: [number, number]; // [lower, upper]
      probability: number; // Probability of exceeding a threshold
    };
  };
  overallPerformanceRating: number; // 0-100
  keyMatchupFactors: {
    factor: string;
    impact: number; // -1 to 1
  }[];
  modelId: string;
  generatedAt: Date;
}
```

#### Betting Opportunity Predictions

```typescript
// models/bettingOpportunityPrediction.ts

export interface BettingOpportunityPrediction {
  gameId: string;
  betType: 'moneyline' | 'spread' | 'over-under' | 'prop';
  betDetails: Record<string, any>;
  bookmakerOdds: number;
  predictedProbability: number; // 0-1
  expectedValue: number; // Positive means value bet
  valueRating: number; // 0-100, higher means better value
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-1
  reasoning: string[];
  modelId: string;
  generatedAt: Date;
}
```

### 4. ML Model Implementation

We'll use a combination of approaches for our ML models:

#### Statistical Models

For baseline predictions with interpretability:

```python
# ml/models/statistical_models.py

def train_poisson_regression_model(training_data):
    """
    Train a Poisson regression model for predicting scores in games.
    """
    # Feature engineering
    X = create_team_features(training_data)
    y_home = training_data['home_score']
    y_away = training_data['away_score']
    
    # Train models
    home_model = PoissonRegressor().fit(X, y_home)
    away_model = PoissonRegressor().fit(X, y_away)
    
    return {
        'home_model': home_model,
        'away_model': away_model
    }

def predict_game_outcome(models, game_features):
    """
    Predict the outcome of a game using trained Poisson models.
    """
    home_score_pred = models['home_model'].predict(game_features)
    away_score_pred = models['away_model'].predict(game_features)
    
    # Simulate game outcomes using Poisson distribution
    simulated_outcomes = simulate_game_outcomes(home_score_pred, away_score_pred, n_simulations=10000)
    
    # Calculate probabilities
    home_win_prob = simulated_outcomes['home_win'] / simulated_outcomes['total']
    away_win_prob = simulated_outcomes['away_win'] / simulated_outcomes['total']
    draw_prob = simulated_outcomes['draw'] / simulated_outcomes['total']
    
    return {
        'predicted_home_score': home_score_pred,
        'predicted_away_score': away_score_pred,
        'home_win_probability': home_win_prob,
        'away_win_probability': away_win_prob,
        'draw_probability': draw_prob,
        'simulated_outcomes': simulated_outcomes
    }
```

#### Machine Learning Models

For more complex patterns and higher accuracy:

```python
# ml/models/ml_models.py

def train_gradient_boosting_model(training_data, target, hyperparameters=None):
    """
    Train a gradient boosting model for various prediction tasks.
    """
    # Default hyperparameters
    if hyperparameters is None:
        hyperparameters = {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 5,
            'min_samples_split': 5,
            'min_samples_leaf': 2
        }
    
    # Feature engineering
    X = create_features(training_data)
    y = training_data[target]
    
    # Train-validation split
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    model = GradientBoostingRegressor(**hyperparameters)
    model.fit(X_train, y_train)
    
    # Evaluate model
    val_predictions = model.predict(X_val)
    metrics = calculate_metrics(y_val, val_predictions)
    
    # Feature importance
    feature_importance = dict(zip(X.columns, model.feature_importances_))
    
    return {
        'model': model,
        'metrics': metrics,
        'feature_importance': feature_importance
    }

def predict_with_confidence(model, features):
    """
    Generate predictions with confidence intervals using bootstrapping.
    """
    # Make base prediction
    prediction = model.predict(features)
    
    # Bootstrap for confidence intervals
    bootstrap_predictions = []
    for _ in range(1000):
        # Sample with replacement from training data
        bootstrap_indices = np.random.choice(len(model.estimators_), size=len(model.estimators_), replace=True)
        bootstrap_estimators = [model.estimators_[i] for i in bootstrap_indices]
        
        # Predict with bootstrap estimators
        bootstrap_pred = sum(estimator.predict(features) for estimator in bootstrap_estimators) / len(bootstrap_estimators)
        bootstrap_predictions.append(bootstrap_pred)
    
    # Calculate confidence intervals
    confidence_intervals = np.percentile(bootstrap_predictions, [5, 95], axis=0)
    
    return {
        'prediction': prediction,
        'confidence_lower': confidence_intervals[0],
        'confidence_upper': confidence_intervals[1],
        'confidence_range': confidence_intervals[1] - confidence_intervals[0]
    }
```

#### Deep Learning Models

For complex time series and pattern recognition:

```python
# ml/models/deep_learning_models.py

def build_lstm_model(input_shape, output_size):
    """
    Build an LSTM model for sequence prediction tasks.
    """
    model = Sequential([
        LSTM(64, input_shape=input_shape, return_sequences=True),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(output_size)
    ])
    
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def train_player_performance_model(player_data, sequence_length=10):
    """
    Train a model to predict player performance based on recent games.
    """
    # Prepare sequences
    X, y = prepare_sequences(player_data, sequence_length)
    
    # Train-validation split
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Build and train model
    model = build_lstm_model(input_shape=(sequence_length, X.shape[2]), output_size=y.shape[1])
    
    history = model.fit(
        X_train, y_train,
        epochs=50,
        batch_size=32,
        validation_data=(X_val, y_val),
        callbacks=[
            EarlyStopping(patience=5, restore_best_weights=True)
        ]
    )
    
    # Evaluate model
    val_predictions = model.predict(X_val)
    metrics = calculate_metrics(y_val, val_predictions)
    
    return {
        'model': model,
        'history': history.history,
        'metrics': metrics
    }
```

### 5. Prediction Integration

Components for integrating predictions into the user interface:

```typescript
// components/GamePredictionCard.tsx

const GamePredictionCard: React.FC<{ gameId: string }> = ({ gameId }) => {
  const [prediction, setPrediction] = useState<GameOutcomePrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const gamePrediction = await mlPredictionService.getGamePrediction(gameId);
        setPrediction(gamePrediction);
      } catch (error) {
        console.error('Error fetching prediction:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrediction();
  }, [gameId]);
  
  if (loading) {
    return <LoadingIndicator />;
  }
  
  if (!prediction) {
    return <NoPredictionAvailable />;
  }
  
  return (
    <Card>
      <Header>
        <TeamLogos homeTeam={prediction.homeTeam} awayTeam={prediction.awayTeam} />
        <PredictionConfidence confidence={prediction.confidenceLevel} />
      </Header>
      
      <WinProbabilityChart 
        homeTeam={prediction.homeTeam}
        awayTeam={prediction.awayTeam}
        homeWinProb={prediction.winProbability}
        awayWinProb={1 - prediction.winProbability}
      />
      
      <PredictedScore
        homeTeam={prediction.homeTeam}
        awayTeam={prediction.awayTeam}
        homeScore={prediction.predictedScoreHome}
        awayScore={prediction.predictedScoreAway}
      />
      
      <KeyFactorsSection factors={prediction.keyFactors} />
      
      <Footer>
        <ModelInfo modelId={prediction.modelId} generatedAt={prediction.generatedAt} />
        <FeedbackButtons onFeedback={handleFeedback} />
      </Footer>
    </Card>
  );
};
```

```typescript
// components/BettingOpportunityList.tsx

const BettingOpportunityList: React.FC = () => {
  const [opportunities, setOpportunities] = useState<BettingOpportunityPrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    minValueRating: 60,
    betTypes: ['moneyline', 'spread', 'over-under'],
    riskLevel: ['low', 'medium', 'high']
  });
  
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const allOpportunities = await mlPredictionService.getBettingOpportunities();
        
        // Apply filters
        const filteredOpportunities = allOpportunities.filter(opp => 
          opp.valueRating >= filters.minValueRating &&
          filters.betTypes.includes(opp.betType) &&
          filters.riskLevel.includes(opp.riskLevel)
        );
        
        // Sort by value rating (descending)
        filteredOpportunities.sort((a, b) => b.valueRating - a.valueRating);
        
        setOpportunities(filteredOpportunities);
      } catch (error) {
        console.error('Error fetching betting opportunities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpportunities();
  }, [filters]);
  
  return (
    <View>
      <Header title="Value Betting Opportunities" />
      
      <FilterControls filters={filters} onChangeFilters={setFilters} />
      
      {loading ? (
        <LoadingIndicator />
      ) : opportunities.length === 0 ? (
        <NoOpportunitiesMessage />
      ) : (
        <FlatList
          data={opportunities}
          keyExtractor={item => item.gameId + item.betType + JSON.stringify(item.betDetails)}
          renderItem={({ item }) => (
            <BettingOpportunityCard opportunity={item} />
          )}
        />
      )}
    </View>
  );
};
```

### 6. Feedback Loop System

A system for collecting user feedback on predictions to improve models over time:

```typescript
// services/mlFeedbackService.ts

export interface PredictionFeedback {
  predictionId: string;
  userId: string;
  feedbackType: 'accurate' | 'inaccurate' | 'useful' | 'not-useful';
  comments?: string;
  actualOutcome?: Record<string, any>;
  createdAt: Date;
}

export const submitPredictionFeedback = async (
  predictionId: string,
  feedbackType: 'accurate' | 'inaccurate' | 'useful' | 'not-useful',
  comments?: string
): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const feedback: PredictionFeedback = {
      predictionId,
      userId,
      feedbackType,
      comments,
      createdAt: new Date()
    };
    
    await firestore.collection('predictionFeedback').add(feedback);
    
    // Track analytics event
    analyticsService.trackEvent('prediction_feedback', {
      predictionId,
      feedbackType
    });
  } catch (error) {
    console.error('Error submitting prediction feedback:', error);
    throw error;
  }
};

export const updatePredictionWithActualOutcome = async (
  predictionId: string,
  actualOutcome: Record<string, any>
): Promise<void> => {
  try {
    // Update prediction record with actual outcome
    await firestore.collection('predictions').doc(predictionId).update({
      actualOutcome,
      wasAccurate: calculateAccuracy(predictionId, actualOutcome)
    });
    
    // Add to training data for model improvement
    await addToTrainingData(predictionId, actualOutcome);
  } catch (error) {
    console.error('Error updating prediction with actual outcome:', error);
    throw error;
  }
};
```

## Implementation Plan

1. **Phase 1: Data Pipeline (7 days)**
   - Implement data collection from sports APIs
   - Create data cleaning and transformation pipeline
   - Set up feature engineering process
   - Build dataset management system

2. **Phase 2: ML Model Development (10 days)**
   - Implement statistical models for baseline predictions
   - Develop gradient boosting models for improved accuracy
   - Create deep learning models for complex patterns
   - Build model evaluation and selection framework

3. **Phase 3: Prediction Service (5 days)**
   - Implement prediction generation service
   - Create APIs for accessing predictions
   - Set up scheduled prediction updates
   - Implement confidence scoring

4. **Phase 4: UI Integration (7 days)**
   - Create prediction visualization components
   - Implement betting opportunity discovery UI
   - Build player performance prediction views
   - Develop explanation components for predictions

5. **Phase 5: Feedback System (3 days)**
   - Implement user feedback collection
   - Create actual outcome tracking
   - Build model performance monitoring
   - Set up automated model retraining

## Success Metrics

The success of this implementation will be measured by:

1. **Prediction Accuracy**: Measured against actual outcomes
2. **User Engagement**: Increase in interaction with prediction features
3. **Betting Performance**: Improvement in user betting results when following predictions
4. **Conversion Impact**: Increase in premium subscriptions due to ML features

## Future Enhancements

1. **Personalized Predictions**: Tailor predictions based on user preferences and betting history
2. **Real-time Updates**: Update predictions during games based on live data
3. **Ensemble Models**: Combine multiple models for improved accuracy
4. **Advanced Visualizations**: Create more intuitive ways to understand predictions
5. **Automated Strategy Generation**: Suggest optimal betting strategies based on predictions