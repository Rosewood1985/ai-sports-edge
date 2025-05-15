#!/usr/bin/env python3
"""
Model Trainer
A module for training ML models using extracted features
"""

import os
import json
import logging
import pandas as pd
import numpy as np
import pickle
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.pipeline import Pipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class ModelTrainer:
    """
    Train ML models using extracted features
    """
    
    def __init__(self, models_dir: str = 'models'):
        """
        Initialize the model trainer
        
        Args:
            models_dir: Directory to save trained models
        """
        self.models_dir = models_dir
        
        # Create models directory if it doesn't exist
        os.makedirs(self.models_dir, exist_ok=True)
        
        logging.info("ModelTrainer initialized")
    
    def train_models(self, df: pd.DataFrame, sport: str, target: str = 'home_team_winning') -> Dict[str, Any]:
        """
        Train models for a specific sport and target
        
        Args:
            df: DataFrame with extracted features
            sport: Sport code (e.g., 'basketball', 'football')
            target: Target variable to predict
            
        Returns:
            Dictionary with trained models and evaluation metrics
        """
        logging.info(f"Training models for {sport} with target {target}")
        
        if df.empty:
            logging.warning(f"No data to train models for {sport}")
            return {}
        
        # Check if target exists in DataFrame
        if target not in df.columns:
            logging.error(f"Target {target} not found in DataFrame")
            return {}
        
        # Prepare data for training
        X, y, feature_names = self._prepare_data(df, target)
        
        if X.shape[0] == 0 or y.shape[0] == 0:
            logging.warning(f"No valid data to train models for {sport}")
            return {}
        
        # Split data into train and test sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train models
        models = self._train_models(X_train, y_train, feature_names)
        
        # Evaluate models
        evaluation = self._evaluate_models(models, X_test, y_test)
        
        # Save models
        self._save_models(models, sport, target, feature_names, evaluation)
        
        # Return models and evaluation
        return {
            'models': models,
            'evaluation': evaluation,
            'feature_names': feature_names
        }
    
    def _prepare_data(self, df: pd.DataFrame, target: str) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Prepare data for model training
        
        Args:
            df: DataFrame with extracted features
            target: Target variable to predict
            
        Returns:
            Tuple of (X, y, feature_names)
        """
        # Create a copy of the DataFrame
        df_copy = df.copy()
        
        # Drop rows with missing target values
        df_copy = df_copy.dropna(subset=[target])
        
        # Select features
        feature_names = self._select_features(df_copy, target)
        
        # Drop rows with missing feature values
        df_copy = df_copy.dropna(subset=feature_names)
        
        # Extract features and target
        X = df_copy[feature_names].values
        y = df_copy[target].values
        
        return X, y, feature_names
    
    def _select_features(self, df: pd.DataFrame, target: str) -> List[str]:
        """
        Select features for model training
        
        Args:
            df: DataFrame with extracted features
            target: Target variable to predict
            
        Returns:
            List of selected feature names
        """
        # Get all columns except the target
        all_features = [col for col in df.columns if col != target]
        
        # Remove non-numeric columns
        numeric_features = []
        for feature in all_features:
            if pd.api.types.is_numeric_dtype(df[feature]):
                numeric_features.append(feature)
        
        # Remove columns with too many missing values
        valid_features = []
        for feature in numeric_features:
            missing_ratio = df[feature].isna().mean()
            if missing_ratio < 0.3:  # Less than 30% missing values
                valid_features.append(feature)
        
        # Remove highly correlated features
        uncorrelated_features = self._remove_correlated_features(df[valid_features])
        
        return uncorrelated_features
    
    def _remove_correlated_features(self, df: pd.DataFrame, threshold: float = 0.95) -> List[str]:
        """
        Remove highly correlated features
        
        Args:
            df: DataFrame with features
            threshold: Correlation threshold
            
        Returns:
            List of uncorrelated feature names
        """
        # Calculate correlation matrix
        corr_matrix = df.corr().abs()
        
        # Select upper triangle of correlation matrix
        upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        
        # Find features with correlation greater than threshold
        to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
        
        # Return uncorrelated features
        return [column for column in df.columns if column not in to_drop]
    
    def _train_models(self, X_train: np.ndarray, y_train: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
        """
        Train multiple models
        
        Args:
            X_train: Training features
            y_train: Training target
            feature_names: List of feature names
            
        Returns:
            Dictionary with trained models
        """
        models = {}
        
        # Random Forest
        logging.info("Training Random Forest model")
        rf_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('model', RandomForestClassifier(random_state=42))
        ])
        
        rf_params = {
            'model__n_estimators': [100, 200],
            'model__max_depth': [None, 10, 20],
            'model__min_samples_split': [2, 5, 10]
        }
        
        rf_grid = GridSearchCV(rf_pipeline, rf_params, cv=5, scoring='accuracy', n_jobs=-1)
        rf_grid.fit(X_train, y_train)
        
        models['random_forest'] = {
            'pipeline': rf_grid.best_estimator_,
            'best_params': rf_grid.best_params_,
            'feature_importance': self._get_feature_importance(rf_grid.best_estimator_, feature_names)
        }
        
        # Gradient Boosting
        logging.info("Training Gradient Boosting model")
        gb_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('model', GradientBoostingClassifier(random_state=42))
        ])
        
        gb_params = {
            'model__n_estimators': [100, 200],
            'model__max_depth': [3, 5, 7],
            'model__learning_rate': [0.01, 0.1, 0.2]
        }
        
        gb_grid = GridSearchCV(gb_pipeline, gb_params, cv=5, scoring='accuracy', n_jobs=-1)
        gb_grid.fit(X_train, y_train)
        
        models['gradient_boosting'] = {
            'pipeline': gb_grid.best_estimator_,
            'best_params': gb_grid.best_params_,
            'feature_importance': self._get_feature_importance(gb_grid.best_estimator_, feature_names)
        }
        
        # Logistic Regression
        logging.info("Training Logistic Regression model")
        lr_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('model', LogisticRegression(random_state=42, max_iter=1000))
        ])
        
        lr_params = {
            'model__C': [0.1, 1.0, 10.0],
            'model__penalty': ['l1', 'l2'],
            'model__solver': ['liblinear']
        }
        
        lr_grid = GridSearchCV(lr_pipeline, lr_params, cv=5, scoring='accuracy', n_jobs=-1)
        lr_grid.fit(X_train, y_train)
        
        models['logistic_regression'] = {
            'pipeline': lr_grid.best_estimator_,
            'best_params': lr_grid.best_params_,
            'feature_importance': self._get_feature_importance(lr_grid.best_estimator_, feature_names)
        }
        
        return models
    
    def _get_feature_importance(self, pipeline: Pipeline, feature_names: List[str]) -> Dict[str, float]:
        """
        Get feature importance from a trained model
        
        Args:
            pipeline: Trained model pipeline
            feature_names: List of feature names
            
        Returns:
            Dictionary with feature importance
        """
        model = pipeline.named_steps['model']
        
        if hasattr(model, 'feature_importances_'):
            # For tree-based models
            importance = model.feature_importances_
        elif hasattr(model, 'coef_'):
            # For linear models
            importance = np.abs(model.coef_[0])
        else:
            return {}
        
        # Create dictionary of feature importance
        importance_dict = {}
        for i, feature in enumerate(feature_names):
            importance_dict[feature] = float(importance[i])
        
        # Sort by importance
        importance_dict = {k: v for k, v in sorted(importance_dict.items(), key=lambda item: item[1], reverse=True)}
        
        return importance_dict
    
    def _evaluate_models(self, models: Dict[str, Any], X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Dict[str, float]]:
        """
        Evaluate trained models
        
        Args:
            models: Dictionary with trained models
            X_test: Test features
            y_test: Test target
            
        Returns:
            Dictionary with evaluation metrics
        """
        evaluation = {}
        
        for model_name, model_info in models.items():
            logging.info(f"Evaluating {model_name} model")
            
            pipeline = model_info['pipeline']
            
            # Make predictions
            y_pred = pipeline.predict(X_test)
            y_prob = pipeline.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred),
                'recall': recall_score(y_test, y_pred),
                'f1': f1_score(y_test, y_pred),
                'roc_auc': roc_auc_score(y_test, y_prob)
            }
            
            evaluation[model_name] = metrics
        
        return evaluation
    
    def _save_models(self, models: Dict[str, Any], sport: str, target: str, feature_names: List[str], evaluation: Dict[str, Dict[str, float]]) -> None:
        """
        Save trained models
        
        Args:
            models: Dictionary with trained models
            sport: Sport code
            target: Target variable
            feature_names: List of feature names
            evaluation: Dictionary with evaluation metrics
        """
        # Create sport directory if it doesn't exist
        sport_dir = os.path.join(self.models_dir, sport)
        os.makedirs(sport_dir, exist_ok=True)
        
        # Create timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save each model
        for model_name, model_info in models.items():
            # Create model directory
            model_dir = os.path.join(sport_dir, f"{model_name}_{target}_{timestamp}")
            os.makedirs(model_dir, exist_ok=True)
            
            # Save model
            model_path = os.path.join(model_dir, 'model.pkl')
            with open(model_path, 'wb') as f:
                pickle.dump(model_info['pipeline'], f)
            
            # Save metadata
            metadata = {
                'sport': sport,
                'target': target,
                'model_name': model_name,
                'feature_names': feature_names,
                'best_params': model_info['best_params'],
                'feature_importance': model_info['feature_importance'],
                'evaluation': evaluation[model_name],
                'timestamp': timestamp
            }
            
            metadata_path = os.path.join(model_dir, 'metadata.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logging.info(f"Saved {model_name} model to {model_dir}")


def main():
    """Main function to test the model trainer"""
    # Load extracted features
    features_dir = 'data/features'
    
    # Find the most recent features file for NBA
    nba_files = [f for f in os.listdir(features_dir) if f.startswith('basketball_features_')]
    if nba_files:
        nba_file = sorted(nba_files)[-1]
        nba_features = pd.read_csv(os.path.join(features_dir, nba_file))
        
        # Train models
        trainer = ModelTrainer()
        result = trainer.train_models(nba_features, 'basketball', 'home_team_winning')
        
        if result:
            print("Models trained successfully")
            for model_name, metrics in result['evaluation'].items():
                print(f"\n{model_name} evaluation:")
                for metric, value in metrics.items():
                    print(f"  {metric}: {value:.4f}")
        else:
            print("Failed to train models")
    else:
        print("No extracted features found for NBA")


if __name__ == "__main__":
    main()