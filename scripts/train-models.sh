#!/bin/bash
# Script to train ML models using the extracted features

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 to run this script.${NC}"
    exit 1
fi

# Parse command line arguments
SPORT=""
MODEL_TYPE="all"
EPOCHS=100
BATCH_SIZE=32
LEARNING_RATE=0.001
VALIDATION_SPLIT=0.2
EARLY_STOPPING=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --sport)
            SPORT="$2"
            shift 2
            ;;
        --model-type)
            MODEL_TYPE="$2"
            shift 2
            ;;
        --epochs)
            EPOCHS="$2"
            shift 2
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --learning-rate)
            LEARNING_RATE="$2"
            shift 2
            ;;
        --validation-split)
            VALIDATION_SPLIT="$2"
            shift 2
            ;;
        --no-early-stopping)
            EARLY_STOPPING=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Install required Python packages
section "Installing required Python packages"
pip3 install -r api/ml-sports-edge/requirements.txt

# Create a temporary Python script to train the model
TMP_PY_FILE=$(mktemp)
cat > "$TMP_PY_FILE" << EOF
#!/usr/bin/env python3
"""
ML Model Training Script
Trains ML models using the extracted features
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.optimizers import Adam
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns

# Set random seed for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEATURES_DIR = os.path.join(BASE_DIR, 'api', 'ml-sports-edge', 'data', 'features')
MODELS_DIR = os.path.join(BASE_DIR, 'api', 'ml-sports-edge', 'models', 'trained')
PLOTS_DIR = os.path.join(BASE_DIR, 'api', 'ml-sports-edge', 'data', 'plots')

# Ensure directories exist
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)

# Training parameters
SPORT = "${SPORT}"
MODEL_TYPE = "${MODEL_TYPE}"
EPOCHS = ${EPOCHS}
BATCH_SIZE = ${BATCH_SIZE}
LEARNING_RATE = ${LEARNING_RATE}
VALIDATION_SPLIT = ${VALIDATION_SPLIT}
EARLY_STOPPING = ${EARLY_STOPPING}

def load_features(sport):
    """
    Load features for a specific sport
    
    Args:
        sport (str): Sport key
        
    Returns:
        pd.DataFrame: DataFrame containing features
    """
    features_path = os.path.join(FEATURES_DIR, f"{sport.lower()}_features.json")
    
    if not os.path.exists(features_path):
        print(f"No features found for {sport}")
        return None
    
    with open(features_path, 'r') as f:
        features = json.load(f)
    
    # Convert to DataFrame
    df = pd.DataFrame(features)
    
    # Remove rows with missing target variable
    df = df.dropna(subset=['homeWin'])
    
    # Remove rows with missing key features
    key_features = ['homeMoneyline', 'awayMoneyline']
    df = df.dropna(subset=key_features)
    
    print(f"Loaded {len(df)} feature sets for {sport}")
    return df

def prepare_data(df):
    """
    Prepare data for model training
    
    Args:
        df (pd.DataFrame): DataFrame containing features
        
    Returns:
        tuple: X_train, X_test, y_train, y_test, feature_names
    """
    # Define target variable
    y = df['homeWin'].values
    
    # Define features
    # Exclude non-numeric columns and target variable
    exclude_cols = ['homeTeam', 'awayTeam', 'homeWin', 'dataSource']
    feature_cols = [col for col in df.columns if col not in exclude_cols and pd.api.types.is_numeric_dtype(df[col])]
    
    # Handle missing values
    X = df[feature_cols].copy()
    X = X.fillna(X.mean())
    
    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Standardize features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    
    return X_train, X_test, y_train, y_test, feature_cols

def build_model(input_dim):
    """
    Build a neural network model
    
    Args:
        input_dim (int): Number of input features
        
    Returns:
        tf.keras.Model: Neural network model
    """
    model = Sequential([
        Dense(128, activation='relu', input_dim=input_dim),
        BatchNormalization(),
        Dropout(0.3),
        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(32, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(1, activation='sigmoid')
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_model(X_train, y_train, X_test, y_test, sport):
    """
    Train a neural network model
    
    Args:
        X_train (np.ndarray): Training features
        y_train (np.ndarray): Training target
        X_test (np.ndarray): Testing features
        y_test (np.ndarray): Testing target
        sport (str): Sport key
        
    Returns:
        tf.keras.Model: Trained model
    """
    # Build model
    model = build_model(X_train.shape[1])
    
    # Define callbacks
    callbacks = []
    
    if EARLY_STOPPING:
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        callbacks.append(early_stopping)
    
    # Model checkpoint
    model_path = os.path.join(MODELS_DIR, f"{sport.lower()}_model.h5")
    checkpoint = ModelCheckpoint(
        model_path,
        monitor='val_loss',
        save_best_only=True
    )
    callbacks.append(checkpoint)
    
    # Train model
    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_split=VALIDATION_SPLIT,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate model
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Test Loss: {loss:.4f}")
    print(f"Test Accuracy: {accuracy:.4f}")
    
    # Calculate additional metrics
    y_pred = (model.predict(X_test) > 0.5).astype(int).flatten()
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    
    # Save metrics
    metrics = {
        'loss': float(loss),
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1)
    }
    
    metrics_path = os.path.join(MODELS_DIR, f"{sport.lower()}_metrics.json")
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    # Plot training history
    plot_history(history, sport)
    
    return model

def plot_history(history, sport):
    """
    Plot training history
    
    Args:
        history (tf.keras.callbacks.History): Training history
        sport (str): Sport key
    """
    # Plot accuracy
    plt.figure(figsize=(12, 5))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'])
    plt.plot(history.history['val_accuracy'])
    plt.title(f'{sport} Model Accuracy')
    plt.ylabel('Accuracy')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='upper left')
    
    # Plot loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'])
    plt.plot(history.history['val_loss'])
    plt.title(f'{sport} Model Loss')
    plt.ylabel('Loss')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='upper left')
    
    plt.tight_layout()
    
    # Save plot
    plot_path = os.path.join(PLOTS_DIR, f"{sport.lower()}_training_history.png")
    plt.savefig(plot_path)
    plt.close()

def main():
    """Main function to train models"""
    if SPORT:
        # Train model for a specific sport
        sports = [SPORT]
    else:
        # Train models for all sports
        sports = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS']
    
    for sport in sports:
        print(f"Training model for {sport}...")
        
        # Load features
        df = load_features(sport)
        
        if df is None or len(df) == 0:
            print(f"Skipping {sport} due to insufficient data")
            continue
        
        # Prepare data
        X_train, X_test, y_train, y_test, feature_cols = prepare_data(df)
        
        # Train model
        model = train_model(X_train, y_train, X_test, y_test, sport)
        
        print(f"Model for {sport} trained successfully")

if __name__ == "__main__":
    main()
EOF

# Make the script executable
chmod +x "$TMP_PY_FILE"

# Run the script
section "Training ML models"
if [ -n "$SPORT" ]; then
    echo -e "Sport: ${YELLOW}${SPORT}${NC}"
else
    echo -e "Sport: ${YELLOW}All Sports${NC}"
fi
echo -e "Model Type: ${YELLOW}${MODEL_TYPE}${NC}"
echo -e "Epochs: ${YELLOW}${EPOCHS}${NC}"
echo -e "Batch Size: ${YELLOW}${BATCH_SIZE}${NC}"
echo -e "Learning Rate: ${YELLOW}${LEARNING_RATE}${NC}"
echo -e "Validation Split: ${YELLOW}${VALIDATION_SPLIT}${NC}"
echo -e "Early Stopping: ${YELLOW}${EARLY_STOPPING}${NC}"

python3 "$TMP_PY_FILE"

# Remove the temporary file
rm "$TMP_PY_FILE"

section "Model Training Completed"
echo -e "${GREEN}ML models have been trained successfully.${NC}"
echo -e "The trained models are available in the following location:"
echo -e "  - ${YELLOW}api/ml-sports-edge/models/trained/${NC}"
echo -e "The training history plots are available in the following location:"
echo -e "  - ${YELLOW}api/ml-sports-edge/data/plots/${NC}"

echo -e "\n${GREEN}You can now use these models for predictions.${NC}"
echo -e "To make predictions using the trained models, run:"
echo -e "  ${YELLOW}./scripts/make-predictions.sh${NC}"