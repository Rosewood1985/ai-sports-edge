# AI Sports Edge ML Pipeline

This directory contains the machine learning pipeline for AI Sports Edge, which powers the AI Pick of the Day feature and game predictions.

## Overview

The ML pipeline consists of several components:

1. **Data Preparation**: Fetches game data from Firestore and prepares it for training
2. **Feature Engineering**: Creates derived features to improve prediction accuracy
3. **Model Training**: Trains an XGBoost model to predict game outcomes with confidence scores
4. **Inference**: Applies the trained model to new games to generate predictions
5. **Deployment**: Pushes the trained model to Firebase Storage for use by the prediction API

## Directory Structure

```
ml/
├── README.md                 # This file
├── models/                   # Directory for storing trained models
├── training/                 # Training scripts and data
│   ├── data/                 # Training data
│   ├── prepare_dataset.py    # Script to prepare dataset from Firestore
│   ├── feature_engineering.py # Script to create derived features
│   ├── train_model.py        # Script to train the model
│   ├── predict_outcome.py    # Script for inference
│   └── train_and_push.sh     # Script to run the entire pipeline
└── utils/                    # Utility functions
```

## Setup

Before running the ML pipeline, you need to set up the dependencies:

1. Run the setup script:
   ```
   ./setup-ml-dependencies.sh
   ```

2. This will:
   - Create necessary directories
   - Guide you through setting up a Firebase service account key
   - Install required Python packages
   - Create sample data for initial training

## Usage

### Training the Model

To train the model, run:

```bash
./ml/training/train_and_push.sh
```

This will:
1. Prepare the dataset from Firestore (or use sample data)
2. Perform feature engineering
3. Train the model
4. Evaluate the model performance
5. Save the model to the `ml/models` directory
6. Push the model to Firebase Storage

### Making Predictions

The model is used by the `predictTodayGames` Firebase Function to make predictions for upcoming games. The function:

1. Fetches today's games from Firestore
2. Loads the model from Firebase Storage
3. Generates predictions with confidence scores
4. Writes the predictions back to Firestore

## Model Details

### Features

The model uses the following features:

- **Basic Game Info**: Teams, sport, league, date
- **Betting Data**: Spread, over/under, public betting percentage
- **Sharp Signals**: Sharp betting percentage, line movement
- **Team Form**: Recent performance of both teams
- **Injuries**: Injury status of key players
- **Derived Features**:
  - sharpEdgeSignal: Difference between sharp and public betting
  - lineMoveImpact: Impact of line movement on the spread
  - publicFadeScore: Score indicating when to fade the public

### Performance Metrics

The model is evaluated on:

- Accuracy: Overall prediction accuracy
- Precision: Precision of high-confidence picks
- Recall: Recall of high-confidence picks
- ROI: Return on investment if betting on predictions

## Maintenance

The model should be retrained periodically (e.g., monthly) to incorporate new data and maintain prediction accuracy. The `updateStatsPage` Firebase Function tracks model performance over time.

## Troubleshooting

If you encounter issues:

1. Check that the service account key is properly set up
2. Verify that all Python dependencies are installed
3. Ensure that the Firestore database contains sufficient game data
4. Check the Firebase Storage bucket for the latest model

For more detailed logs, run the training scripts individually with the `--verbose` flag.