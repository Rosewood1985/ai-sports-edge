#!/usr/bin/env python3
"""
ML Sports Edge Main Module
A module for running the entire ML Sports Edge pipeline
"""

import os
import json
import logging
import argparse
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from data.data_processor import DataProcessor
from models.feature_engineering import FeatureExtractor
from models.model_trainer import ModelTrainer
from models.predictor import Predictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ml_sports_edge.log'),
        logging.StreamHandler()
    ]
)

class MLSportsEdge:
    """
    Main class for running the ML Sports Edge pipeline
    """
    
    def __init__(self, config_path: str = 'config.json'):
        """
        Initialize the ML Sports Edge pipeline
        
        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.data_processor = DataProcessor()
        self.feature_extractor = FeatureExtractor()
        self.model_trainer = ModelTrainer()
        self.predictor = Predictor()
        
        logging.info("ML Sports Edge initialized")
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load configuration from file
        
        Args:
            config_path: Path to configuration file
            
        Returns:
            Configuration dictionary
        """
        # Default configuration
        default_config = {
            'sports': [
                {
                    'name': 'basketball',
                    'leagues': ['nba'],
                    'targets': ['home_team_winning']
                },
                {
                    'name': 'football',
                    'leagues': ['nfl'],
                    'targets': ['home_team_winning']
                }
            ],
            'update_frequency': {
                'data': 3600,  # 1 hour
                'models': 86400,  # 1 day
                'predictions': 3600  # 1 hour
            },
            'confidence_threshold': 0.7
        }
        
        # Try to load configuration from file
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                logging.info(f"Loaded configuration from {config_path}")
                return config
            except Exception as e:
                logging.error(f"Error loading configuration from {config_path}: {e}")
        
        # Create default configuration file
        try:
            with open(config_path, 'w') as f:
                json.dump(default_config, f, indent=2)
            logging.info(f"Created default configuration file at {config_path}")
        except Exception as e:
            logging.error(f"Error creating default configuration file at {config_path}: {e}")
        
        return default_config
    
    def run_pipeline(self, sport: str, league: str, target: str, train_models: bool = False) -> Dict[str, Any]:
        """
        Run the entire ML Sports Edge pipeline for a specific sport, league, and target
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            target: Target variable to predict
            train_models: Whether to train new models
            
        Returns:
            Dictionary with pipeline results
        """
        logging.info(f"Running ML Sports Edge pipeline for {sport}/{league} with target {target}")
        
        results = {}
        
        # Step 1: Process data
        logging.info("Step 1: Processing data")
        data = self.data_processor.process_data(sport, league)
        results['data'] = {
            'shape': data.shape,
            'columns': list(data.columns)
        }
        
        if data.empty:
            logging.warning(f"No data processed for {sport}/{league}")
            return results
        
        # Step 2: Extract features
        logging.info("Step 2: Extracting features")
        features = self.feature_extractor.extract_features(data, sport)
        results['features'] = {
            'shape': features.shape,
            'columns': list(features.columns)
        }
        
        if features.empty:
            logging.warning(f"No features extracted for {sport}/{league}")
            return results
        
        # Step 3: Train models (if requested)
        if train_models:
            logging.info("Step 3: Training models")
            model_results = self.model_trainer.train_models(features, sport, target)
            results['models'] = {
                'trained': bool(model_results),
                'evaluation': model_results.get('evaluation', {})
            }
        
        # Step 4: Make predictions
        logging.info("Step 4: Making predictions")
        predictions = self.predictor.predict(sport, league, target)
        results['predictions'] = {
            'shape': predictions.shape,
            'columns': list(predictions.columns)
        }
        
        if predictions.empty:
            logging.warning(f"No predictions made for {sport}/{league}")
            return results
        
        # Step 5: Get value bets
        logging.info("Step 5: Getting value bets")
        confidence_threshold = self.config.get('confidence_threshold', 0.7)
        value_bets = self.predictor.get_value_bets(predictions, confidence_threshold)
        results['value_bets'] = {
            'count': len(value_bets),
            'bets': value_bets.to_dict('records') if not value_bets.empty else []
        }
        
        logging.info(f"ML Sports Edge pipeline completed for {sport}/{league} with target {target}")
        
        return results
    
    def run_all(self, train_models: bool = False) -> Dict[str, Dict[str, Dict[str, Any]]]:
        """
        Run the pipeline for all configured sports, leagues, and targets
        
        Args:
            train_models: Whether to train new models
            
        Returns:
            Dictionary with all pipeline results
        """
        logging.info("Running ML Sports Edge pipeline for all configured sports")
        
        all_results = {}
        
        for sport_config in self.config.get('sports', []):
            sport = sport_config.get('name')
            leagues = sport_config.get('leagues', [])
            targets = sport_config.get('targets', ['home_team_winning'])
            
            all_results[sport] = {}
            
            for league in leagues:
                all_results[sport][league] = {}
                
                for target in targets:
                    results = self.run_pipeline(sport, league, target, train_models)
                    all_results[sport][league][target] = results
        
        return all_results
    
    def get_predictions(self, sport: Optional[str] = None, league: Optional[str] = None) -> Dict[str, Any]:
        """
        Get the latest predictions
        
        Args:
            sport: Sport code (optional)
            league: League code (optional)
            
        Returns:
            Dictionary with predictions
        """
        logging.info(f"Getting latest predictions for {sport or 'all'}/{league or 'all'}")
        
        predictions_dir = self.predictor.predictions_dir
        
        if not os.path.exists(predictions_dir):
            logging.warning(f"Predictions directory {predictions_dir} does not exist")
            return {}
        
        # Get all prediction files
        prediction_files = []
        for root, _, files in os.walk(predictions_dir):
            for file in files:
                if file.endswith('.csv'):
                    prediction_files.append(os.path.join(root, file))
        
        if not prediction_files:
            logging.warning(f"No prediction files found in {predictions_dir}")
            return {}
        
        # Filter by sport and league
        filtered_files = prediction_files
        
        if sport:
            filtered_files = [f for f in filtered_files if f'/{sport}/' in f or f'\\{sport}\\' in f]
        
        if league:
            filtered_files = [f for f in filtered_files if f'_{league}_' in f]
        
        if not filtered_files:
            logging.warning(f"No prediction files found for {sport or 'all'}/{league or 'all'}")
            return {}
        
        # Get the most recent prediction file
        most_recent_file = max(filtered_files, key=os.path.getmtime)
        
        # Load predictions
        try:
            import pandas as pd
            predictions = pd.read_csv(most_recent_file)
            
            # Get value bets
            confidence_threshold = self.config.get('confidence_threshold', 0.7)
            value_bets = self.predictor.get_value_bets(predictions, confidence_threshold)
            
            return {
                'file': most_recent_file,
                'timestamp': datetime.fromtimestamp(os.path.getmtime(most_recent_file)).isoformat(),
                'predictions': predictions.to_dict('records'),
                'value_bets': value_bets.to_dict('records') if not value_bets.empty else []
            }
        except Exception as e:
            logging.error(f"Error loading predictions from {most_recent_file}: {e}")
            return {}


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='ML Sports Edge')
    parser.add_argument('--sport', type=str, help='Sport code (e.g., basketball, football)')
    parser.add_argument('--league', type=str, help='League code (e.g., nba, nfl)')
    parser.add_argument('--target', type=str, default='home_team_winning', help='Target variable to predict')
    parser.add_argument('--train', action='store_true', help='Train new models')
    parser.add_argument('--all', action='store_true', help='Run for all configured sports, leagues, and targets')
    parser.add_argument('--predictions', action='store_true', help='Get latest predictions')
    
    args = parser.parse_args()
    
    ml_sports_edge = MLSportsEdge()
    
    if args.predictions:
        # Get latest predictions
        predictions = ml_sports_edge.get_predictions(args.sport, args.league)
        
        if predictions:
            print(f"\nLatest predictions from {predictions['timestamp']}:")
            
            value_bets = predictions.get('value_bets', [])
            if value_bets:
                print(f"\nValue bets ({len(value_bets)}):")
                for i, bet in enumerate(value_bets):
                    home_team = bet['home_team_name']
                    away_team = bet['away_team_name']
                    
                    if bet.get('home_value_bet'):
                        team = home_team
                        odds = bet.get('home_odds')
                        prob = bet.get('ensemble_probability')
                        value = bet.get('home_value')
                    else:
                        team = away_team
                        odds = bet.get('away_odds')
                        prob = 1 - bet.get('ensemble_probability')
                        value = bet.get('away_value')
                    
                    print(f"{i+1}. {home_team} vs {away_team}: Bet on {team}")
                    print(f"   Odds: {odds:.2f}, Model probability: {prob:.2f}, Value: {value:.2f}")
            else:
                print("No value bets found")
        else:
            print("No predictions found")
    
    elif args.all:
        # Run for all configured sports, leagues, and targets
        results = ml_sports_edge.run_all(args.train)
        
        print("\nPipeline results:")
        for sport, sport_results in results.items():
            for league, league_results in sport_results.items():
                for target, target_results in league_results.items():
                    print(f"\n{sport}/{league}/{target}:")
                    
                    value_bets = target_results.get('value_bets', {}).get('bets', [])
                    if value_bets:
                        print(f"Value bets ({len(value_bets)}):")
                        for i, bet in enumerate(value_bets[:5]):  # Show top 5
                            home_team = bet['home_team_name']
                            away_team = bet['away_team_name']
                            
                            if bet.get('home_value_bet'):
                                team = home_team
                                odds = bet.get('home_odds')
                                prob = bet.get('ensemble_probability')
                                value = bet.get('home_value')
                            else:
                                team = away_team
                                odds = bet.get('away_odds')
                                prob = 1 - bet.get('ensemble_probability')
                                value = bet.get('away_value')
                            
                            print(f"{i+1}. {home_team} vs {away_team}: Bet on {team}")
                            print(f"   Odds: {odds:.2f}, Model probability: {prob:.2f}, Value: {value:.2f}")
                        
                        if len(value_bets) > 5:
                            print(f"   ... and {len(value_bets) - 5} more")
                    else:
                        print("No value bets found")
    
    elif args.sport and args.league:
        # Run for specific sport, league, and target
        results = ml_sports_edge.run_pipeline(args.sport, args.league, args.target, args.train)
        
        print(f"\nPipeline results for {args.sport}/{args.league}/{args.target}:")
        
        value_bets = results.get('value_bets', {}).get('bets', [])
        if value_bets:
            print(f"\nValue bets ({len(value_bets)}):")
            for i, bet in enumerate(value_bets):
                home_team = bet['home_team_name']
                away_team = bet['away_team_name']
                
                if bet.get('home_value_bet'):
                    team = home_team
                    odds = bet.get('home_odds')
                    prob = bet.get('ensemble_probability')
                    value = bet.get('home_value')
                else:
                    team = away_team
                    odds = bet.get('away_odds')
                    prob = 1 - bet.get('ensemble_probability')
                    value = bet.get('away_value')
                
                print(f"{i+1}. {home_team} vs {away_team}: Bet on {team}")
                print(f"   Odds: {odds:.2f}, Model probability: {prob:.2f}, Value: {value:.2f}")
        else:
            print("No value bets found")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()