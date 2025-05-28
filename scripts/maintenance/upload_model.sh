#!/bin/bash

# Set the path to the model file
MODEL_FILE="ml/models/model.pkl"

# Set the destination path in Firebase Storage
DESTINATION="gs://ai-sports-edge.appspot.com/models/model.pkl"

# Upload the model file to Firebase Storage
gsutil cp $MODEL_FILE $DESTINATION

echo "Model uploaded successfully to $DESTINATION"