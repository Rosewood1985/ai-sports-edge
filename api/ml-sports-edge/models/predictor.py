#!/usr/bin/env python3
"""
Predictor
A module for making predictions using trained ML models
"""

import os
import json
import logging
import pandas as pd
import numpy as np
import pickle
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime
import glob

from api.ml_sports_edge.data.data_processor import DataProcessor
from api.ml_sports_edge.models.feature_engineering import FeatureExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class Predictor:
    """
    Make predictions using trained ML models
    """
    
    def __init__(self, models_dir: str = 'models', predictions_dir: str = 'predictions'):
        """
        Initialize the predictor
        
        Args:
            models_dir: Directory with trained models
            predictions_dir: Directory to save predictions
        """
        self.models_dir = models_dir
        self.predictions_dir = predictions_dir
        self.data_processor = DataProcessor()
        self.feature_extractor = FeatureExtractor()
        
        # Create predictions directory if it doesn't exist
        os.makedirs(self.predictions_dir, exist_ok=True)
        
        logging.info("Predictor initialized")
    
    def predict(self, sport: str, league: str, target: str = 'home_team_winning') -> pd.DataFrame:
        """
        Make predictions for upcoming games
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            target: Target variable to predict
            
        Returns:
            DataFrame with predictions
        """
        logging.info(f"Making predictions for {sport}/{league} with target {target}")
        
        # Get current data
        current_data = self.data_processor.process_data(sport, league)
        
        if current_data.empty:
            logging.warning(f"No current data for {sport}/{league}")
            return pd.DataFrame()
        
        # Extract features
        features = self.feature_extractor.extract_features(current_data, sport)
        
        if features.empty:
            logging.warning(f"No features extracted for {sport}/{league}")
            return pd.DataFrame()
        
        # Load models
        models = self._load_models(sport, target)
        
        if not models:
            logging.warning(f"No models found for {sport} with target {target}")
            return pd.DataFrame()
        
        # Make predictions
        predictions = self._make_predictions(features, models)
        
        # Save predictions
        self._save_predictions(predictions, sport, league, target)
        
        return predictions
    
    def _load_models(self, sport: str, target: str) -> Dict[str, Any]:
        """
        Load trained models
        
        Args:
            sport: Sport code
            target: Target variable
            
        Returns:
            Dictionary with loaded models
        """
        # Check if sport directory exists
        sport_dir = os.path.join(self.models_dir, sport)
        if not os.path.exists(sport_dir):
            logging.warning(f"No models directory found for {sport}")
            return {}
        
        # Find model directories for the target
        model_dirs = glob.glob(os.path.join(sport_dir, f"*_{target}_*"))
        
        if not model_dirs:
            logging.warning(f"No model directories found for {sport} with target {target}")
            return {}
        
        # Group model directories by model name
        model_groups = {}
        for model_dir in model_dirs:
            model_name = os.path.basename(model_dir).split('_')[0]
            if model_name not in model_groups:
                model_groups[model_name] = []
            model_groups[model_name].append(model_dir)
        
        # Load the most recent model for each model name
        models = {}
        for model_name, dirs in model_groups.items():
            # Sort directories by timestamp (assuming directory name format: model_name_target_timestamp)
            sorted_dirs = sorted(dirs, key=lambda d: os.path.basename(d).split('_')[-1], reverse=True)
            most_recent_dir = sorted_dirs[0]
            
            # Load model
            model_path = os.path.join(most_recent_dir, 'model.pkl')
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                
                # Load metadata
                metadata_path = os.path.join(most_recent_dir, 'metadata.json')
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                else:
                    metadata = {}
                
                models[model_name] = {
                    'model': model,
                    'metadata': metadata
                }
                
                logging.info(f"Loaded {model_name} model from {most_recent_dir}")
            else:
                logging.warning(f"Model file not found in {most_recent_dir}")
        
        return models
    
    def _make_predictions(self, features: pd.DataFrame, models: Dict[str, Any]) -> pd.DataFrame:
        """
        Make predictions using loaded models
        
        Args:
            features: DataFrame with extracted features
            models: Dictionary with loaded models
            
        Returns:
            DataFrame with predictions
        """
        # Create a copy of the features DataFrame
        predictions = features.copy()
        
        # Add prediction columns for each model
        for model_name, model_info in models.items():
            model = model_info['model']
            metadata = model_info['metadata']
            
            # Get feature names used by the model
            feature_names = metadata.get('feature_names', [])
            
            # Check if all required features are available
            missing_features = [f for f in feature_names if f not in predictions.columns]
            if missing_features:
                logging.warning(f"Missing features for {model_name} model: {missing_features}")
                continue
            
            # Select features for prediction
            X = predictions[feature_names].values
            
            # Make predictions
            try:
                y_pred = model.predict(X)
                y_prob = model.predict_proba(X)[:, 1]
                
                # Add predictions to DataFrame
                predictions[f'{model_name}_prediction'] = y_pred
                predictions[f'{model_name}_probability'] = y_prob
                
                logging.info(f"Made predictions using {model_name} model")
            except Exception as e:
                logging.error(f"Error making predictions with {model_name} model: {e}")
        
        # Calculate ensemble prediction
        prediction_columns = [col for col in predictions.columns if col.endswith('_prediction')]
        probability_columns = [col for col in predictions.columns if col.endswith('_probability')]
        
        if prediction_columns:
            # Majority vote for prediction
            predictions['ensemble_prediction'] = predictions[prediction_columns].mode(axis=1)[0]
            
            # Average probability
            if probability_columns:
                predictions['ensemble_probability'] = predictions[probability_columns].mean(axis=1)
        
        return predictions
    
    def _save_predictions(self, predictions: pd.DataFrame, sport: str, league: str, target: str) -> None:
        """
        Save predictions
        
        Args:
            predictions: DataFrame with predictions
            sport: Sport code
            league: League code
            target: Target variable
        """
        if predictions.empty:
            logging.warning(f"No predictions to save for {sport}/{league}")
            return
        
        # Create sport directory if it doesn't exist
        sport_dir = os.path.join(self.predictions_dir, sport)
        os.makedirs(sport_dir, exist_ok=True)
        
        # Create timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Create filename
        filename = f"{sport}_{league}_{target}_predictions_{timestamp}.csv"
        filepath = os.path.join(sport_dir, filename)
        
        # Save to CSV
        predictions.to_csv(filepath, index=False)
        
        logging.info(f"Saved predictions to {filepath}")
    
    def get_value_bets(self, predictions: pd.DataFrame, confidence_threshold: float = 0.7) -> pd.DataFrame:
        """
        Get value bets from predictions
        
        Args:
            predictions: DataFrame with predictions
            confidence_threshold: Minimum confidence threshold for value bets
            
        Returns:
            DataFrame with value bets
        """
        if predictions.empty:
            logging.warning("No predictions to get value bets from")
            return pd.DataFrame()
        
        # Check if ensemble probability column exists
        if 'ensemble_probability' not in predictions.columns:
            logging.warning("No ensemble probability column found in predictions")
            return pd.DataFrame()
        
        # Filter for upcoming games
        upcoming_games = predictions[predictions['status'] != 'STATUS_FINAL'].copy()
        
        if upcoming_games.empty:
            logging.warning("No upcoming games found in predictions")
            return pd.DataFrame()
        
        # Identify value bets
        value_bets = upcoming_games[
            (upcoming_games['ensemble_probability'] > confidence_threshold) |
            (upcoming_games['ensemble_probability'] < (1 - confidence_threshold))
        ].copy()
        
        # Add value bet indicators
        value_bets['home_value_bet'] = (
            (value_bets['ensemble_prediction'] == 1) &
            (value_bets['ensemble_probability'] > confidence_threshold) &
            (value_bets['home_implied_probability'] < value_bets['ensemble_probability'])
        )
        
        value_bets['away_value_bet'] = (
            (value_bets['ensemble_prediction'] == 0) &
            (value_bets['ensemble_probability'] < (1 - confidence_threshold)) &
            (value_bets['away_implied_probability'] < (1 - value_bets['ensemble_probability']))
        )
        
        # Filter for games with value bets
        value_bets = value_bets[value_bets['home_value_bet'] | value_bets['away_value_bet']]
        
        # Add value metrics
        value_bets['home_value'] = value_bets['ensemble_probability'] - value_bets['home_implied_probability']
        value_bets['away_value'] = (1 - value_bets['ensemble_probability']) - value_bets['away_implied_probability']
        
        # Sort by value
        value_bets = value_bets.sort_values(by=['home_value', 'away_value'], ascending=False)
        
        return value_bets


def main():
    """Main function to test the predictor"""
    predictor = Predictor()
    
    # Make predictions for NBA
    nba_predictions = predictor.predict('basketball', 'nba', 'home_team_winning')
    
    if not nba_predictions.empty:
        print(f"Made predictions for {len(nba_predictions)} NBA games")
        
        # Get value bets
        value_bets = predictor.get_value_bets(nba_predictions)
        
        if not value_bets.empty:
            print(f"\nFound {len(value_bets)} value bets:")
            for i, (_, bet) in enumerate(value_bets.iterrows()):
                home_team = bet['home_team_name']
                away_team = bet['away_team_name']
                
                if bet['home_value_bet']:
                    team = home_team
                    odds = bet['home_odds']
                    prob = bet['ensemble_probability']
                    value = bet['home_value']
                else:
                    team = away_team
                    odds = bet['away_odds']
                    prob = 1 - bet['ensemble_probability']
                    value = bet['away_value']
                
                print(f"{i+1}. {home_team} vs {away_team}: Bet on {team}")
                print(f"   Odds: {odds:.2f}, Model probability: {prob:.2f}, Value: {value:.2f}")
        else:
            print("No value bets found")
    else:
        print("No predictions made for NBA")


if __name__ == "__main__":
    main()