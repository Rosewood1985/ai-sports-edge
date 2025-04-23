#!/bin/bash
# Deployment script for AI Sports Edge

echo "Starting deployment process..."

# Step 1: Install required Python packages
echo "Installing required Python packages..."
pip install numpy scikit-learn pandas

# Step 2: Build and deploy Firebase Functions
echo "Building and deploying Firebase Functions..."
cd functions
npm install
npm install eslint --save-dev
npm run build
firebase deploy --only functions

# Step 3: Create ML model directory in Firebase Storage
echo "Creating ML model directory in Firebase Storage..."
mkdir -p ../ml/models_deploy

# Step 4: Generate dummy model for testing
echo "Generating dummy ML model..."
cd ../ml/models
python create_dummy_model.py

# Step 5: Copy model to deployment directory
echo "Copying model to deployment directory..."
cp model.pkl ../models_deploy/

# Step 6: Upload ML model to Firebase Storage
echo "Uploading ML model to Firebase Storage..."
cd ../..
gsutil cp ml/models_deploy/model.pkl gs://ai-sports-edge.appspot.com/models/model.pkl

# Step 7: Update Firebase Remote Config
echo "Updating Firebase Remote Config..."
firebase functions:config:set ml.model_path="gs://ai-sports-edge.appspot.com/models/model.pkl"

# Step 8: Deploy frontend components
echo "Building and deploying frontend components for production..."
NODE_ENV=production npm run build:prod
firebase deploy --only hosting

echo "Deployment completed successfully!"