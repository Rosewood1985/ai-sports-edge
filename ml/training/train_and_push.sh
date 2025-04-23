#!/bin/bash
# train_and_push.sh
#
# This script runs the ML training pipeline and deploys the model
# to Firebase Storage for use by the prediction functions.

set -e  # Exit on any error

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/data"
MODEL_DIR="${SCRIPT_DIR}/../models"
FIREBASE_STORAGE_PATH="models"
MODEL_FILENAME="model.pkl"
METADATA_FILENAME="model_metadata.json"

# Create directories if they don't exist
mkdir -p "${DATA_DIR}"
mkdir -p "${MODEL_DIR}"

echo -e "${YELLOW}Starting AI Sports Edge ML training pipeline...${NC}"

# Step 1: Prepare dataset
echo -e "${YELLOW}Step 1: Preparing dataset...${NC}"
python3 "${SCRIPT_DIR}/prepare_dataset.py" --days 90 --output "${DATA_DIR}/games_data.csv"

if [ $? -ne 0 ]; then
  echo -e "${RED}Dataset preparation failed! Aborting pipeline.${NC}"
  exit 1
fi

# Step 2: Feature engineering
echo -e "${YELLOW}Step 2: Performing feature engineering...${NC}"
python3 "${SCRIPT_DIR}/feature_engineering.py" --input "${DATA_DIR}/games_data.csv" --output "${DATA_DIR}/train_ready.csv"

if [ $? -ne 0 ]; then
  echo -e "${RED}Feature engineering failed! Aborting pipeline.${NC}"
  exit 1
fi

# Step 3: Train model
echo -e "${YELLOW}Step 3: Training model...${NC}"
python3 "${SCRIPT_DIR}/train_model.py" --input "${DATA_DIR}/train_ready.csv" --output "${MODEL_DIR}/${MODEL_FILENAME}" --test-size 0.2

if [ $? -ne 0 ]; then
  echo -e "${RED}Model training failed! Aborting pipeline.${NC}"
  exit 1
fi

echo -e "${GREEN}Model training completed successfully!${NC}"

# Step 4: Deploy model to Firebase Storage
echo -e "${YELLOW}Step 4: Deploying model to Firebase Storage...${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo -e "${RED}Firebase CLI not found. Please install it with 'npm install -g firebase-tools'.${NC}"
  exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}You need to log in to Firebase first.${NC}"
  firebase login
fi

# Upload model file
echo -e "${YELLOW}Uploading model file...${NC}"
firebase storage:upload "${MODEL_DIR}/${MODEL_FILENAME}" --public "${FIREBASE_STORAGE_PATH}/${MODEL_FILENAME}"

if [ $? -ne 0 ]; then
  echo -e "${RED}Model upload failed! Please check your Firebase configuration.${NC}"
  exit 1
fi

# Upload metadata file if it exists
if [ -f "${MODEL_DIR}/${METADATA_FILENAME}" ]; then
  echo -e "${YELLOW}Uploading model metadata...${NC}"
  firebase storage:upload "${MODEL_DIR}/${METADATA_FILENAME}" --public "${FIREBASE_STORAGE_PATH}/${METADATA_FILENAME}"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Metadata upload failed! Continuing anyway.${NC}"
  fi
fi

# Get the download URL for the model
MODEL_URL=$(firebase storage:url "${FIREBASE_STORAGE_PATH}/${MODEL_FILENAME}" 2>/dev/null)

if [ -n "${MODEL_URL}" ]; then
  echo -e "${GREEN}Model deployed successfully!${NC}"
  echo -e "Model URL: ${MODEL_URL}"
  
  # Update the Remote Config with the new model URL
  echo -e "${YELLOW}Updating Remote Config with new model URL...${NC}"
  
  # This would typically use the Firebase Admin SDK or REST API
  # For now, we'll just print the command
  echo -e "firebase functions:config:set ml.model_path=\"${MODEL_URL}\""
  
  # Uncomment to actually set the config
  # firebase functions:config:set ml.model_path="${MODEL_URL}"
else
  echo -e "${RED}Failed to get model URL. Manual configuration may be required.${NC}"
fi

# Step 5: Trigger function redeployment to pick up new model
echo -e "${YELLOW}Step 5: Triggering function redeployment...${NC}"
echo -e "To deploy the updated functions, run:"
echo -e "cd ../../functions && npm run build && cd .. && firebase deploy --only functions:predictTodayGames,functions:markAIPickOfDay"

echo -e "${GREEN}Training and deployment pipeline completed!${NC}"
echo -e "Timestamp: $(date)"

# Optional: Run a test prediction
echo -e "${YELLOW}Would you like to run a test prediction? (y/n)${NC}"
read -r run_test

if [[ "${run_test}" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Running test prediction...${NC}"
  
  # Create a test input file
  TEST_INPUT="${DATA_DIR}/test_input.json"
  cat > "${TEST_INPUT}" << EOF
{
  "gameId": "test_game_123",
  "teamA": "Test Team A",
  "teamB": "Test Team B",
  "sport": "NBA",
  "league": "NBA",
  "momentumScore": 15,
  "lineMovement": 2.5,
  "publicBetPct": 40,
  "confidence": 75,
  "isHomeTeam": true,
  "streakIndicator": 3
}
EOF
  
  # Run prediction
  python3 "${SCRIPT_DIR}/../inference/predict_outcome.py" --model "${MODEL_DIR}/${MODEL_FILENAME}" --input "${TEST_INPUT}"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Test prediction successful!${NC}"
  else
    echo -e "${RED}Test prediction failed.${NC}"
  fi
fi

exit 0