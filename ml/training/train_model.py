#!/usr/bin/env python3
"""
train_model.py

This script loads the enhanced dataset created by feature_engineering.py,
trains an XGBoost model for game outcome prediction, evaluates its performance,
and saves the trained model for inference.
"""

import os
import json
import pickle
import pandas as pd
import numpy as np
import argparse
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import matplotlib.pyplot as plt
import seaborn as sns

# Set up argument parser
parser = argparse.ArgumentParser(description='Train AI Sports Edge prediction model')
parser.add_argument('--input', type=str, default='data/train_ready.csv', 
                    help='Input CSV file with enhanced features')
parser.add_argument('--output', type=str, default='../models/model.pkl', 
                    help='Output path for trained model')
parser.add_argument('--test-size', type=float, default=0.2,
                    help='Proportion of data to use for testing')
parser.add_argument('--tune-hyperparams', action='store_true',
                    help='Perform hyperparameter tuning')
args = parser.parse_args()

def load_dataset(input_path):
    """
    Load the enhanced dataset
    
    Args:
        input_path: Path to the enhanced dataset CSV
        
    Returns:
        DataFrame with enhanced features
    """
    try:
        # Check if file exists
        if not os.path.exists(input_path):
            print(f"Error: Input file {input_path} not found")
            return None
        
        # Load CSV
        df = pd.read_csv(input_path)
        
        print(f"Loaded dataset with {len(df)} rows and {len(df.columns)} columns")
        return df
    
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return None

def prepare_features_and_target(df):
    """
    Prepare features and target variables
    
    Args:
        df: DataFrame with enhanced features
        
    Returns:
        X: Feature matrix
        y: Target vector
        feature_names: List of feature names
    """
    try:
        # Check if target column exists
        if 'target' not in df.columns:
            print("Error: 'target' column not found in dataset")
            return None, None, None
        
        # Define features to use
        core_features = [
            'momentumScore',
            'lineMovement',
            'publicBetPct',
            'confidence'
        ]
        
        # Add derived features if they exist
        derived_features = [
            'sharpEdgeSignal',
            'lineMoveImpact',
            'publicFadeScore',
            'aiLineDisagreement',
            'homeTeamAdvantage',
            'streakIndicator'
        ]
        
        # Combine features that exist in the dataset
        feature_names = [f for f in core_features + derived_features if f in df.columns]
        
        # Check if we have enough features
        if len(feature_names) < 3:
            print("Warning: Less than 3 features available. Model may not perform well.")
        
        # Extract features and target
        X = df[feature_names].copy()
        y = df['target'].copy()
        
        # Handle missing values
        X = X.fillna(0)
        
        print(f"Prepared {len(feature_names)} features for training")
        print("Features:", feature_names)
        
        return X, y, feature_names
    
    except Exception as e:
        print(f"Error preparing features and target: {e}")
        return None, None, None

def train_xgboost_model(X, y, feature_names, tune_hyperparams=False):
    """
    Train XGBoost model
    
    Args:
        X: Feature matrix
        y: Target vector
        feature_names: List of feature names
        tune_hyperparams: Whether to perform hyperparameter tuning
        
    Returns:
        Trained model
    """
    try:
        # Split data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=args.test_size, random_state=42, stratify=y
        )
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Testing set: {X_test.shape[0]} samples")
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Initialize model
        if tune_hyperparams:
            print("Performing hyperparameter tuning...")
            # Define parameter grid
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [3, 5, 7],
                'learning_rate': [0.01, 0.1, 0.2],
                'subsample': [0.8, 1.0],
                'colsample_bytree': [0.8, 1.0]
            }
            
            # Initialize model for tuning
            xgb_model = xgb.XGBClassifier(
                objective='binary:logistic',
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss'
            )
            
            # Perform grid search
            grid_search = GridSearchCV(
                estimator=xgb_model,
                param_grid=param_grid,
                cv=3,
                scoring='accuracy',
                n_jobs=-1,
                verbose=1
            )
            
            # Fit grid search
            grid_search.fit(X_train_scaled, y_train)
            
            # Get best parameters
            best_params = grid_search.best_params_
            print("Best parameters:", best_params)
            
            # Initialize model with best parameters
            model = xgb.XGBClassifier(
                objective='binary:logistic',
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss',
                **best_params
            )
        else:
            # Use default parameters
            model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                objective='binary:logistic',
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss'
            )
        
        # Train model
        print("Training model...")
        model.fit(
            X_train_scaled, y_train,
            eval_set=[(X_test_scaled, y_test)],
            early_stopping_rounds=10,
            verbose=True
        )
        
        # Evaluate model
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        print("\nModel Performance:")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1 Score: {f1:.4f}")
        
        # Calculate confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        print("\nConfusion Matrix:")
        print(cm)
        
        # Save evaluation results
        evaluation_results = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1': float(f1),
            'confusion_matrix': cm.tolist(),
            'feature_importance': dict(zip(feature_names, model.feature_importances_.tolist())),
            'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'model_params': model.get_params()
        }
        
        # Save feature importance plot
        plt.figure(figsize=(10, 6))
        xgb.plot_importance(model, max_num_features=10)
        plt.tight_layout()
        
        # Create models directory if it doesn't exist
        models_dir = os.path.dirname(os.path.abspath(args.output))
        os.makedirs(models_dir, exist_ok=True)
        
        # Save plot
        plot_path = os.path.join(models_dir, 'feature_importance.png')
        plt.savefig(plot_path)
        print(f"Feature importance plot saved to {plot_path}")
        
        # Save evaluation results
        eval_path = os.path.join(models_dir, 'evaluation_results.json')
        with open(eval_path, 'w') as f:
            json.dump(evaluation_results, f, indent=2)
        print(f"Evaluation results saved to {eval_path}")
        
        # Save scaler
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        print(f"Feature scaler saved to {scaler_path}")
        
        # Create a model package with metadata
        model_package = {
            'model': model,
            'scaler': scaler,
            'feature_names': feature_names,
            'evaluation': evaluation_results
        }
        
        return model_package
    
    except Exception as e:
        print(f"Error training model: {e}")
        return None

def save_model(model_package, output_path):
    """
    Save the trained model
    
    Args:
        model_package: Dictionary containing model and metadata
        output_path: Path to save the model
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        
        # Save model package
        with open(output_path, 'wb') as f:
            pickle.dump(model_package, f)
        
        print(f"Model saved to {output_path}")
        
        # Save a separate metadata file (JSON)
        metadata_path = os.path.splitext(output_path)[0] + '_metadata.json'
        metadata = {
            'feature_names': model_package['feature_names'],
            'evaluation': model_package['evaluation'],
            'model_type': str(type(model_package['model']).__name__),
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Model metadata saved to {metadata_path}")
    
    except Exception as e:
        print(f"Error saving model: {e}")

def main():
    """Main function to train the model"""
    # Resolve input path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, args.input)
    
    # Load dataset
    df = load_dataset(input_path)
    if df is None:
        return
    
    # Prepare features and target
    X, y, feature_names = prepare_features_and_target(df)
    if X is None:
        return
    
    # Train model
    model_package = train_xgboost_model(X, y, feature_names, tune_hyperparams=args.tune_hyperparams)
    if model_package is None:
        return
    
    # Resolve output path
    output_path = os.path.abspath(args.output)
    
    # Save model
    save_model(model_package, output_path)
    
    print("Model training complete")

if __name__ == "__main__":
    main()