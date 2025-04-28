#!/usr/bin/env python3
"""
Feature Engineering
A module for extracting features from processed sports data
"""

import os
import json
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class FeatureExtractor:
    """
    Extract features from processed sports data for ML models
    """
    
    def __init__(self, output_dir: str = 'data/features'):
        """
        Initialize the feature extractor
        
        Args:
            output_dir: Directory to save extracted features
        """
        self.output_dir = output_dir
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        logging.info("FeatureExtractor initialized")
    
    def extract_features(self, df: pd.DataFrame, sport: str) -> pd.DataFrame:
        """
        Extract features from processed data
        
        Args:
            df: DataFrame with processed data
            sport: Sport code (e.g., 'basketball', 'football')
            
        Returns:
            DataFrame with extracted features
        """
        logging.info(f"Extracting features for {sport}")
        
        if df.empty:
            logging.warning(f"No data to extract features from for {sport}")
            return pd.DataFrame()
        
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Extract common features
        features_df = self._extract_common_features(features_df)
        
        # Extract sport-specific features
        if sport == 'basketball':
            features_df = self._extract_basketball_features(features_df)
        elif sport == 'football':
            features_df = self._extract_football_features(features_df)
        elif sport == 'baseball':
            features_df = self._extract_baseball_features(features_df)
        elif sport == 'soccer':
            features_df = self._extract_soccer_features(features_df)
        
        # Extract market-based features
        features_df = self._extract_market_features(features_df)
        
        # Extract combined features
        features_df = self._extract_combined_features(features_df)
        
        # Save extracted features
        self._save_features(features_df, sport)
        
        return features_df
    
    def _extract_common_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract common features for all sports
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with common features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Convert score columns to numeric
        score_columns = ['home_team_score', 'away_team_score']
        for col in score_columns:
            if col in features_df.columns:
                features_df[col] = pd.to_numeric(features_df[col], errors='coerce')
        
        # Calculate score difference
        if 'home_team_score' in features_df.columns and 'away_team_score' in features_df.columns:
            features_df['score_difference'] = features_df['home_team_score'] - features_df['away_team_score']
            features_df['total_score'] = features_df['home_team_score'] + features_df['away_team_score']
            features_df['home_team_winning'] = (features_df['score_difference'] > 0).astype(int)
            features_df['away_team_winning'] = (features_df['score_difference'] < 0).astype(int)
            features_df['tie_game'] = (features_df['score_difference'] == 0).astype(int)
        
        # Extract game status features
        if 'status' in features_df.columns:
            features_df['game_in_progress'] = (features_df['status'] == 'STATUS_IN_PROGRESS').astype(int)
            features_df['game_completed'] = (features_df['status'] == 'STATUS_FINAL').astype(int)
        
        # Extract data source features
        if 'has_espn_data' in features_df.columns:
            features_df['has_espn_data'] = features_df['has_espn_data'].astype(int)
        
        if 'has_bet365_data' in features_df.columns:
            features_df['has_bet365_data'] = features_df['has_bet365_data'].astype(int)
        
        # Extract date features
        if 'date' in features_df.columns:
            features_df['date'] = pd.to_datetime(features_df['date'], errors='coerce')
            features_df['day_of_week'] = features_df['date'].dt.dayofweek
            features_df['is_weekend'] = (features_df['day_of_week'] >= 5).astype(int)
            features_df['month'] = features_df['date'].dt.month
            features_df['year'] = features_df['date'].dt.year
        
        return features_df
    
    def _extract_basketball_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract basketball-specific features
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with basketball features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Extract field goal percentage features
        fg_columns = [col for col in features_df.columns if 'field_goal_percentage' in col]
        for col in fg_columns:
            if col in features_df.columns:
                features_df[col] = features_df[col].str.rstrip('%').astype(float) / 100
        
        # Extract three-point percentage features
        tp_columns = [col for col in features_df.columns if 'three_point_percentage' in col]
        for col in tp_columns:
            if col in features_df.columns:
                features_df[col] = features_df[col].str.rstrip('%').astype(float) / 100
        
        # Extract free throw percentage features
        ft_columns = [col for col in features_df.columns if 'free_throw_percentage' in col]
        for col in ft_columns:
            if col in features_df.columns:
                features_df[col] = features_df[col].str.rstrip('%').astype(float) / 100
        
        # Calculate shooting efficiency
        if 'home_field_goal_percentage' in features_df.columns and 'home_three_point_percentage' in features_df.columns:
            features_df['home_shooting_efficiency'] = (
                features_df['home_field_goal_percentage'] * 0.5 + 
                features_df['home_three_point_percentage'] * 0.5
            )
        
        if 'away_field_goal_percentage' in features_df.columns and 'away_three_point_percentage' in features_df.columns:
            features_df['away_shooting_efficiency'] = (
                features_df['away_field_goal_percentage'] * 0.5 + 
                features_df['away_three_point_percentage'] * 0.5
            )
        
        # Calculate rebounding advantage
        if 'home_rebounds' in features_df.columns and 'away_rebounds' in features_df.columns:
            features_df['home_rebounding_advantage'] = features_df['home_rebounds'] - features_df['away_rebounds']
        
        # Calculate turnover differential
        if 'home_turnovers' in features_df.columns and 'away_turnovers' in features_df.columns:
            features_df['home_turnover_advantage'] = features_df['away_turnovers'] - features_df['home_turnovers']
        
        return features_df
    
    def _extract_football_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract football-specific features
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with football features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Extract yards per play features
        if 'home_total_yards' in features_df.columns and 'home_total_plays' in features_df.columns:
            features_df['home_yards_per_play'] = pd.to_numeric(features_df['home_total_yards'], errors='coerce') / pd.to_numeric(features_df['home_total_plays'], errors='coerce')
        
        if 'away_total_yards' in features_df.columns and 'away_total_plays' in features_df.columns:
            features_df['away_yards_per_play'] = pd.to_numeric(features_df['away_total_yards'], errors='coerce') / pd.to_numeric(features_df['away_total_plays'], errors='coerce')
        
        # Calculate turnover differential
        if 'home_turnovers' in features_df.columns and 'away_turnovers' in features_df.columns:
            features_df['home_turnover_advantage'] = pd.to_numeric(features_df['away_turnovers'], errors='coerce') - pd.to_numeric(features_df['home_turnovers'], errors='coerce')
        
        # Calculate time of possession advantage
        if 'home_time_of_possession' in features_df.columns and 'away_time_of_possession' in features_df.columns:
            # Convert time of possession to seconds
            features_df['home_possession_seconds'] = features_df['home_time_of_possession'].apply(
                lambda x: int(x.split(':')[0]) * 60 + int(x.split(':')[1]) if isinstance(x, str) and ':' in x else np.nan
            )
            
            features_df['away_possession_seconds'] = features_df['away_time_of_possession'].apply(
                lambda x: int(x.split(':')[0]) * 60 + int(x.split(':')[1]) if isinstance(x, str) and ':' in x else np.nan
            )
            
            features_df['home_possession_advantage'] = features_df['home_possession_seconds'] - features_df['away_possession_seconds']
        
        # Calculate third down efficiency
        if 'home_third_down_efficiency' in features_df.columns:
            features_df['home_third_down_percentage'] = features_df['home_third_down_efficiency'].apply(
                lambda x: float(x.split('-')[0]) / float(x.split('-')[1]) if isinstance(x, str) and '-' in x else np.nan
            )
        
        if 'away_third_down_efficiency' in features_df.columns:
            features_df['away_third_down_percentage'] = features_df['away_third_down_efficiency'].apply(
                lambda x: float(x.split('-')[0]) / float(x.split('-')[1]) if isinstance(x, str) and '-' in x else np.nan
            )
        
        return features_df
    
    def _extract_baseball_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract baseball-specific features
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with baseball features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Extract hits and errors features
        if 'home_hits' in features_df.columns and 'home_errors' in features_df.columns:
            features_df['home_hits'] = pd.to_numeric(features_df['home_hits'], errors='coerce')
            features_df['home_errors'] = pd.to_numeric(features_df['home_errors'], errors='coerce')
            features_df['home_hit_error_ratio'] = features_df['home_hits'] / (features_df['home_errors'] + 1)
        
        if 'away_hits' in features_df.columns and 'away_errors' in features_df.columns:
            features_df['away_hits'] = pd.to_numeric(features_df['away_hits'], errors='coerce')
            features_df['away_errors'] = pd.to_numeric(features_df['away_errors'], errors='coerce')
            features_df['away_hit_error_ratio'] = features_df['away_hits'] / (features_df['away_errors'] + 1)
        
        # Calculate hit differential
        if 'home_hits' in features_df.columns and 'away_hits' in features_df.columns:
            features_df['home_hit_advantage'] = features_df['home_hits'] - features_df['away_hits']
        
        # Calculate error differential
        if 'home_errors' in features_df.columns and 'away_errors' in features_df.columns:
            features_df['home_error_advantage'] = features_df['away_errors'] - features_df['home_errors']
        
        return features_df
    
    def _extract_soccer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract soccer-specific features
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with soccer features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Extract possession features
        if 'home_possession' in features_df.columns:
            features_df['home_possession'] = features_df['home_possession'].str.rstrip('%').astype(float) / 100
        
        if 'away_possession' in features_df.columns:
            features_df['away_possession'] = features_df['away_possession'].str.rstrip('%').astype(float) / 100
        
        # Calculate possession advantage
        if 'home_possession' in features_df.columns and 'away_possession' in features_df.columns:
            features_df['home_possession_advantage'] = features_df['home_possession'] - features_df['away_possession']
        
        # Extract shots on target features
        if 'home_shots_on_target' in features_df.columns and 'home_shots' in features_df.columns:
            features_df['home_shots_on_target'] = pd.to_numeric(features_df['home_shots_on_target'], errors='coerce')
            features_df['home_shots'] = pd.to_numeric(features_df['home_shots'], errors='coerce')
            features_df['home_shot_accuracy'] = features_df['home_shots_on_target'] / features_df['home_shots']
        
        if 'away_shots_on_target' in features_df.columns and 'away_shots' in features_df.columns:
            features_df['away_shots_on_target'] = pd.to_numeric(features_df['away_shots_on_target'], errors='coerce')
            features_df['away_shots'] = pd.to_numeric(features_df['away_shots'], errors='coerce')
            features_df['away_shot_accuracy'] = features_df['away_shots_on_target'] / features_df['away_shots']
        
        # Calculate shot differential
        if 'home_shots' in features_df.columns and 'away_shots' in features_df.columns:
            features_df['home_shot_advantage'] = features_df['home_shots'] - features_df['away_shots']
        
        # Calculate shots on target differential
        if 'home_shots_on_target' in features_df.columns and 'away_shots_on_target' in features_df.columns:
            features_df['home_shots_on_target_advantage'] = features_df['home_shots_on_target'] - features_df['away_shots_on_target']
        
        return features_df
    
    def _extract_market_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract market-based features
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with market features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Convert odds columns to numeric
        odds_columns = ['home_odds', 'draw_odds', 'away_odds']
        for col in odds_columns:
            if col in features_df.columns:
                features_df[col] = pd.to_numeric(features_df[col], errors='coerce')
        
        # Calculate implied probabilities
        if 'home_odds' in features_df.columns:
            features_df['home_implied_probability'] = 1 / features_df['home_odds']
        
        if 'draw_odds' in features_df.columns:
            features_df['draw_implied_probability'] = 1 / features_df['draw_odds']
        
        if 'away_odds' in features_df.columns:
            features_df['away_implied_probability'] = 1 / features_df['away_odds']
        
        # Calculate market confidence
        if 'home_implied_probability' in features_df.columns and 'away_implied_probability' in features_df.columns:
            features_df['market_confidence_home'] = features_df['home_implied_probability'] / (features_df['home_implied_probability'] + features_df['away_implied_probability'])
            features_df['market_confidence_away'] = features_df['away_implied_probability'] / (features_df['home_implied_probability'] + features_df['away_implied_probability'])
            features_df['market_confidence_difference'] = features_df['market_confidence_home'] - features_df['market_confidence_away']
        
        # Identify favorite
        if 'home_odds' in features_df.columns and 'away_odds' in features_df.columns:
            features_df['home_is_favorite'] = (features_df['home_odds'] < features_df['away_odds']).astype(int)
            features_df['away_is_favorite'] = (features_df['away_odds'] < features_df['home_odds']).astype(int)
        
        # Extract EV features
        features_df = self._extract_ev_features(features_df)
        
        return features_df
    
    def _extract_ev_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract EV-related features
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with EV features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Process EV features
        ev_columns = [
            'home_ev', 'away_ev', 'draw_ev', 'max_ev',
            'fair_home_odds', 'fair_away_odds', 'fair_draw_odds',
            'home_value', 'away_value', 'draw_value'
        ]
        
        for col in ev_columns:
            if col in features_df.columns:
                features_df[col] = pd.to_numeric(features_df[col], errors='coerce')
        
        # Calculate EV-based features
        if 'home_ev' in features_df.columns and 'away_ev' in features_df.columns:
            # EV difference
            features_df['ev_difference'] = features_df['home_ev'] - features_df['away_ev']
            
            # Positive EV indicators
            features_df['home_positive_ev'] = (features_df['home_ev'] > 0).astype(int)
            features_df['away_positive_ev'] = (features_df['away_ev'] > 0).astype(int)
            
            # High EV indicators (>5%)
            features_df['home_high_ev'] = (features_df['home_ev'] > 5).astype(int)
            features_df['away_high_ev'] = (features_df['away_ev'] > 5).astype(int)
        
        # Calculate odds difference between actual and fair odds
        if 'home_odds' in features_df.columns and 'fair_home_odds' in features_df.columns:
            features_df['home_odds_difference'] = features_df['home_odds'] - features_df['fair_home_odds']
            features_df['home_odds_ratio'] = features_df['home_odds'] / features_df['fair_home_odds']
        
        if 'away_odds' in features_df.columns and 'fair_away_odds' in features_df.columns:
            features_df['away_odds_difference'] = features_df['away_odds'] - features_df['fair_away_odds']
            features_df['away_odds_ratio'] = features_df['away_odds'] / features_df['fair_away_odds']
        
        if 'draw_odds' in features_df.columns and 'fair_draw_odds' in features_df.columns:
            features_df['draw_odds_difference'] = features_df['draw_odds'] - features_df['fair_draw_odds']
            features_df['draw_odds_ratio'] = features_df['draw_odds'] / features_df['fair_draw_odds']
        
        return features_df
    
    def _extract_combined_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract combined features using both statistical and market data
        
        Args:
            df: DataFrame with processed data
            
        Returns:
            DataFrame with combined features
        """
        # Create a copy of the DataFrame
        features_df = df.copy()
        
        # Calculate market vs. score discrepancy
        if 'market_confidence_home' in features_df.columns and 'score_difference' in features_df.columns:
            # Normalize score difference
            max_score_diff = features_df['score_difference'].abs().max()
            if max_score_diff > 0:
                features_df['normalized_score_difference'] = features_df['score_difference'] / max_score_diff
            else:
                features_df['normalized_score_difference'] = 0
            
            # Calculate discrepancy
            features_df['market_score_discrepancy'] = features_df['market_confidence_home'] - (features_df['normalized_score_difference'] + 1) / 2
        
        # Calculate value bet indicators
        if 'home_implied_probability' in features_df.columns and 'away_implied_probability' in features_df.columns:
            # Simple value bet indicator based on implied probabilities
            features_df['home_value_bet'] = (
                (features_df['home_is_favorite'] == 1) & 
                (features_df['score_difference'] > 0) & 
                (features_df['home_implied_probability'] < 0.7)
            ).astype(int)
            
            features_df['away_value_bet'] = (
                (features_df['away_is_favorite'] == 1) &
                (features_df['score_difference'] < 0) &
                (features_df['away_implied_probability'] < 0.7)
            ).astype(int)
        
        # Incorporate EV features into value bet indicators
        if 'home_ev' in features_df.columns and 'away_ev' in features_df.columns:
            # EV-based value bet indicators
            features_df['home_ev_value_bet'] = (features_df['home_ev'] > 5).astype(int)
            features_df['away_ev_value_bet'] = (features_df['away_ev'] > 5).astype(int)
            
            # Combined value bet indicators (traditional + EV)
            features_df['home_combined_value_bet'] = (
                (features_df['home_value_bet'] == 1) |
                (features_df['home_ev_value_bet'] == 1)
            ).astype(int)
            
            features_df['away_combined_value_bet'] = (
                (features_df['away_value_bet'] == 1) |
                (features_df['away_ev_value_bet'] == 1)
            ).astype(int)
            
            # Strong value bet indicators (traditional + EV > 10%)
            features_df['home_strong_value_bet'] = (
                (features_df['home_value_bet'] == 1) &
                (features_df['home_ev'] > 10)
            ).astype(int)
            
            features_df['away_strong_value_bet'] = (
                (features_df['away_value_bet'] == 1) &
                (features_df['away_ev'] > 10)
            ).astype(int)
        
        return features_df
    
    def _save_features(self, df: pd.DataFrame, sport: str) -> None:
        """
        Save extracted features
        
        Args:
            df: DataFrame with extracted features
            sport: Sport code
        """
        if df.empty:
            logging.warning(f"No features to save for {sport}")
            return
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{sport}_features_{timestamp}.csv"
        filepath = os.path.join(self.output_dir, filename)
        
        # Save to CSV
        df.to_csv(filepath, index=False)
        
        logging.info(f"Saved extracted features to {filepath}")


def main():
    """Main function to test the feature extractor"""
    # Load processed data
    data_dir = 'data/processed'
    
    # Find the most recent processed data file for NBA
    nba_files = [f for f in os.listdir(data_dir) if f.startswith('basketball_nba_')]
    if nba_files:
        nba_file = sorted(nba_files)[-1]
        nba_data = pd.read_csv(os.path.join(data_dir, nba_file))
        
        # Extract features
        extractor = FeatureExtractor()
        nba_features = extractor.extract_features(nba_data, 'basketball')
        
        print(f"Extracted {len(nba_features.columns)} features for {len(nba_features)} NBA events")
    else:
        print("No processed NBA data found")


if __name__ == "__main__":
    main()