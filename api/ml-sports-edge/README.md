# ML Sports Edge

ML Sports Edge is an advanced machine learning system for sports prediction and betting analysis. It leverages multiple data sources, including ESPN API, Odds API, and historical data from sportsbookreview.com to train models that predict game outcomes with high accuracy.

## Features

- **Multi-Sport Support**: Supports NBA, NFL, MLB, NHL, NCAA Basketball, and NCAA Football
- **Advanced Data Collection**: Fetches data from multiple sources including ESPN API, Odds API, and sportsbookreview.com
- **Historical Data Analysis**: Collects and analyzes historical data going back to 2011
- **Feature Engineering**: Extracts sport-specific features for optimal model performance
- **Neural Network Models**: Uses deep learning models for accurate predictions
- **Value Betting**: Identifies value betting opportunities based on model predictions
- **Prediction API**: Provides predictions through a simple API for integration with the main application

## Directory Structure

```
api/ml-sports-edge/
├── data/                  # Data storage
│   ├── raw/               # Raw data from APIs
│   ├── historical/        # Historical data
│   ├── features/          # Extracted features
│   ├── normalized/        # Normalized data
│   ├── predictions/       # Model predictions
│   ├── plots/             # Training history plots
│   └── sportsbookreview/  # Data from sportsbookreview.com
├── models/                # ML models
│   ├── trained/           # Trained model files
│   └── features.js        # Feature extraction code
└── scripts/               # Utility scripts
```

## Data Sources

### ESPN API

The ESPN API provides comprehensive sports data including:
- Game schedules and scores
- Team and player statistics
- Standings and rankings
- Game details and play-by-play data

### Odds API

The Odds API provides betting odds from multiple bookmakers:
- Moneyline odds
- Point spreads
- Over/under totals
- Live odds updates

### Sportsbookreview.com

The sportsbookreview.com scraper collects historical odds data:
- Historical odds going back to 2011
- Data from multiple bookmakers
- Line movement tracking
- Closing odds

## Models

The system uses neural network models with the following architecture:
- Input layer based on sport-specific features
- 3 hidden layers with batch normalization and dropout
- Binary classification output (home team win probability)

## Usage

### Data Collection

To collect data for model training:

```bash
# Collect ESPN and Odds API data
./scripts/update-all.sh

# Collect historical data from sportsbookreview.com
./scripts/run-sportsbookreview-scraper.sh --sport nba --start-date 2022-10-18 --end-date 2023-06-12
```

### Model Training

To train the prediction models:

```bash
# Train models for all sports
./scripts/train-models.sh

# Train model for a specific sport
./scripts/train-models.sh --sport nba --epochs 200 --batch-size 64
```

### Making Predictions

To make predictions for upcoming games:

```bash
# Make predictions for today's NBA games
./scripts/make-predictions.sh --sport nba

# Make predictions for a specific date
./scripts/make-predictions.sh --sport nfl --date 2025-09-15
```

## Integration with AI Sports Edge

The ML Sports Edge component integrates with the main AI Sports Edge application through:

1. **Data Pipeline**: Automated data collection and model training
2. **Prediction API**: REST API for retrieving predictions
3. **Web Interface**: Visualization of predictions and betting recommendations
4. **Mobile App**: Access to predictions on mobile devices

## Performance Metrics

The models are evaluated using the following metrics:
- Accuracy: Percentage of correctly predicted outcomes
- Precision: Percentage of correct positive predictions
- Recall: Percentage of actual positives correctly identified
- F1 Score: Harmonic mean of precision and recall
- ROC AUC: Area under the Receiver Operating Characteristic curve

## Future Improvements

Planned improvements to the ML Sports Edge system:
- Player-level features and injury impact analysis
- Weather data integration for outdoor sports
- Ensemble models combining multiple prediction approaches
- Real-time prediction updates based on line movements
- Bayesian optimization for hyperparameter tuning
- Reinforcement learning for optimal betting strategies

## Requirements

- Node.js 14+
- Python 3.6+
- TensorFlow 2.8+
- Required Python packages listed in requirements.txt