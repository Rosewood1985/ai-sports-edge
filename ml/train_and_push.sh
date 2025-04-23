#!/bin/bash
# train_and_push.sh
#
# This script runs the entire ML training pipeline:
# 1. Prepares the dataset from Firestore
# 2. Performs feature engineering
# 3. Trains the model
# 4. Deploys the model for inference
#
# Usage: ./train_and_push.sh [--days=90] [--tune-hyperparams]

set -e  # Exit on any error

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Default parameters
DAYS=90
TUNE_HYPERPARAMS=false
SERVICE_ACCOUNT="serviceAccountKey.json"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --days=*)
      DAYS="${arg#*=}"
      ;;
    --tune-hyperparams)
      TUNE_HYPERPARAMS=true
      ;;
    --service-account=*)
      SERVICE_ACCOUNT="${arg#*=}"
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: ./train_and_push.sh [--days=90] [--tune-hyperparams] [--service-account=path/to/key.json]"
      exit 1
      ;;
  esac
done

# Create directories if they don't exist
mkdir -p "$SCRIPT_DIR/training/data"
mkdir -p "$SCRIPT_DIR/models"

echo "===== AI Sports Edge ML Training Pipeline ====="
echo "Starting training process at $(date)"
echo "Using data from the last $DAYS days"
if [ "$TUNE_HYPERPARAMS" = true ]; then
  echo "Hyperparameter tuning enabled"
fi
echo "=============================================="

# Step 1: Prepare dataset
echo -e "\n\n===== Step 1: Preparing Dataset ====="
python3 "$SCRIPT_DIR/training/prepare_dataset.py" \
  --days="$DAYS" \
  --output="data/games_data.csv" \
  --service-account="$SERVICE_ACCOUNT"

# Check if dataset was created
if [ ! -f "$SCRIPT_DIR/training/data/games_data.csv" ]; then
  echo "Error: Dataset was not created. Exiting."
  exit 1
fi

# Step 2: Feature engineering
echo -e "\n\n===== Step 2: Feature Engineering ====="
python3 "$SCRIPT_DIR/training/feature_engineering.py" \
  --input="data/games_data.csv" \
  --output="data/train_ready.csv"

# Check if enhanced dataset was created
if [ ! -f "$SCRIPT_DIR/training/data/train_ready.csv" ]; then
  echo "Error: Enhanced dataset was not created. Exiting."
  exit 1
fi

# Step 3: Train model
echo -e "\n\n===== Step 3: Training Model ====="
TRAIN_CMD="python3 \"$SCRIPT_DIR/training/train_model.py\" --input=\"data/train_ready.csv\" --output=\"../models/model.pkl\""
if [ "$TUNE_HYPERPARAMS" = true ]; then
  TRAIN_CMD="$TRAIN_CMD --tune-hyperparams"
fi
eval "$TRAIN_CMD"

# Check if model was created
if [ ! -f "$SCRIPT_DIR/models/model.pkl" ]; then
  echo "Error: Model was not created. Exiting."
  exit 1
fi

# Step 4: Test the model with a sample prediction
echo -e "\n\n===== Step 4: Testing Model ====="
# Create a sample game data file
SAMPLE_GAME='{
  "gameId": "test-game-1",
  "teamA": "Team A",
  "teamB": "Team B",
  "momentumScore": 15,
  "lineMovement": 2.5,
  "publicBetPct": 45,
  "confidence": 75,
  "isHomeTeam": true
}'
echo "$SAMPLE_GAME" > "$SCRIPT_DIR/models/sample_game.json"

# Run prediction
python3 "$SCRIPT_DIR/inference/predict_outcome.py" \
  --model="$SCRIPT_DIR/models/model.pkl" \
  --input="$SCRIPT_DIR/models/sample_game.json"

# Step 5: Deploy model (if applicable)
echo -e "\n\n===== Step 5: Deploying Model ====="
# This step depends on your deployment strategy
# For example, you might copy the model to a specific location
# or trigger a cloud function deployment

# Option 1: Copy to a deployment directory
DEPLOY_DIR="$SCRIPT_DIR/../functions/models"
if [ -d "$DEPLOY_DIR" ]; then
  echo "Copying model to deployment directory: $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"
  cp "$SCRIPT_DIR/models/model.pkl" "$DEPLOY_DIR/"
  cp "$SCRIPT_DIR/models/model_metadata.json" "$DEPLOY_DIR/" 2>/dev/null || true
  echo "Model deployed to: $DEPLOY_DIR"
else
  echo "Deployment directory not found. Skipping deployment."
fi

# Option 2: Trigger a cloud function deployment
# Uncomment and modify if you have a cloud deployment
# echo "Triggering cloud function deployment..."
# firebase deploy --only functions:predictTodayGames

echo -e "\n\n===== Training Pipeline Complete ====="
echo "Completed at: $(date)"
echo "Model saved to: $SCRIPT_DIR/models/model.pkl"
echo "=============================================="

# Print a summary of the training process
echo -e "\nTraining Summary:"
echo "- Data from the last $DAYS days"
if [ "$TUNE_HYPERPARAMS" = true ]; then
  echo "- Hyperparameter tuning was enabled"
fi
echo "- Model evaluation results are in: $SCRIPT_DIR/models/evaluation_results.json"
echo "- Feature importance plot saved to: $SCRIPT_DIR/models/feature_importance.png"

echo -e "\nTo make predictions with this model, use:"
echo "python3 $SCRIPT_DIR/inference/predict_outcome.py --model=$SCRIPT_DIR/models/model.pkl --input=your_game_data.json"

exit 0