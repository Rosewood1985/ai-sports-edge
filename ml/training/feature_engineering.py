#!/usr/bin/env python3
"""
feature_engineering.py

This script loads the raw dataset created by prepare_dataset.py,
adds derived features for improved model performance, and saves
the enhanced dataset for training.
"""

import os
import pandas as pd
import numpy as np
import argparse
from datetime import datetime

# Set up argument parser
parser = argparse.ArgumentParser(description='Feature engineering for AI Sports Edge model training')
parser.add_argument('--input', type=str, default='data/games_data.csv', 
                    help='Input CSV file with raw game data')
parser.add_argument('--output', type=str, default='data/train_ready.csv', 
                    help='Output CSV file for enhanced dataset')
args = parser.parse_args()

def load_dataset(input_path):
    """
    Load the raw dataset
    
    Args:
        input_path: Path to the raw dataset CSV
        
    Returns:
        DataFrame with raw game data
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

def add_derived_features(df):
    """
    Add derived features to the dataset
    
    Args:
        df: DataFrame with raw game data
        
    Returns:
        DataFrame with added features
    """
    try:
        print("Adding derived features...")
        
        # Make a copy to avoid modifying the original
        enhanced_df = df.copy()
        
        # 1. sharpEdgeSignal: 1 if momentumScore > 10 and publicBetPct < 40
        enhanced_df['sharpEdgeSignal'] = np.where(
            (enhanced_df['momentumScore'] > 10) & (enhanced_df['publicBetPct'] < 40),
            1,  # True
            0   # False
        )
        
        # 2. lineMoveImpact: lineMovement * confidence
        enhanced_df['lineMoveImpact'] = enhanced_df['lineMovement'] * enhanced_df['confidence']
        
        # 3. publicFadeScore: momentumScore - publicBetPct
        enhanced_df['publicFadeScore'] = enhanced_df['momentumScore'] - enhanced_df['publicBetPct']
        
        # 4. aiLineDisagreement: absolute difference between AI pick line and sportsbook line
        # Note: This assumes columns 'aiLine' and 'bookLine' exist
        # If they don't, we'll create a placeholder
        if 'aiLine' in enhanced_df.columns and 'bookLine' in enhanced_df.columns:
            enhanced_df['aiLineDisagreement'] = abs(enhanced_df['aiLine'] - enhanced_df['bookLine'])
        else:
            # Create a placeholder based on confidence and lineMovement
            enhanced_df['aiLineDisagreement'] = abs(enhanced_df['confidence'] / 10 - enhanced_df['lineMovement'])
            print("Warning: 'aiLine' or 'bookLine' columns not found. Created placeholder for aiLineDisagreement.")
        
        # 5. momentumCategory: categorize momentum score
        enhanced_df['momentumCategory'] = pd.cut(
            enhanced_df['momentumScore'],
            bins=[-float('inf'), -10, 10, float('inf')],
            labels=['negative', 'neutral', 'positive']
        )
        
        # 6. confidenceCategory: categorize confidence
        enhanced_df['confidenceCategory'] = pd.cut(
            enhanced_df['confidence'],
            bins=[0, 60, 80, 100],
            labels=['low', 'medium', 'high']
        )
        
        # 7. dayOfWeek: extract day of week from startTime
        if 'startTime' in enhanced_df.columns:
            # Check if startTime is already a datetime
            if pd.api.types.is_datetime64_any_dtype(enhanced_df['startTime']):
                enhanced_df['dayOfWeek'] = pd.to_datetime(enhanced_df['startTime']).dt.dayofweek
            else:
                # Try to convert to datetime
                try:
                    enhanced_df['dayOfWeek'] = pd.to_datetime(enhanced_df['startTime']).dt.dayofweek
                except:
                    print("Warning: Could not extract dayOfWeek from startTime")
        
        # 8. homeTeamAdvantage: 1 if team is playing at home
        if 'isHomeTeam' in enhanced_df.columns:
            enhanced_df['homeTeamAdvantage'] = enhanced_df['isHomeTeam'].astype(int)
        else:
            # Create a random placeholder (50% chance of being home team)
            enhanced_df['homeTeamAdvantage'] = np.random.randint(0, 2, size=len(enhanced_df))
            print("Warning: 'isHomeTeam' column not found. Created random placeholder for homeTeamAdvantage.")
        
        # 9. streakIndicator: consecutive wins or losses
        # This would require historical data in sequence, so we'll create a placeholder
        enhanced_df['streakIndicator'] = np.random.randint(-3, 4, size=len(enhanced_df))
        print("Warning: Created random placeholder for streakIndicator.")
        
        # Print feature statistics
        print("\nFeature statistics:")
        for feature in ['sharpEdgeSignal', 'lineMoveImpact', 'publicFadeScore', 'aiLineDisagreement']:
            if feature in enhanced_df.columns:
                print(f"{feature}: mean={enhanced_df[feature].mean():.2f}, std={enhanced_df[feature].std():.2f}")
        
        return enhanced_df
    
    except Exception as e:
        print(f"Error adding derived features: {e}")
        return df

def save_enhanced_dataset(df, output_path):
    """
    Save the enhanced dataset
    
    Args:
        df: DataFrame with enhanced features
        output_path: Path to save the enhanced dataset
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        
        # Save to CSV
        df.to_csv(output_path, index=False)
        
        print(f"Enhanced dataset saved to {output_path}")
        
        # Save feature importance analysis
        if 'target' in df.columns:
            feature_importance = analyze_feature_importance(df)
            importance_path = os.path.splitext(output_path)[0] + '_importance.csv'
            feature_importance.to_csv(importance_path, index=True)
            print(f"Feature importance analysis saved to {importance_path}")
    
    except Exception as e:
        print(f"Error saving enhanced dataset: {e}")

def analyze_feature_importance(df):
    """
    Analyze feature importance using correlation with target
    
    Args:
        df: DataFrame with features and target
        
    Returns:
        Series with feature importance scores
    """
    try:
        # Select numeric columns only
        numeric_df = df.select_dtypes(include=[np.number])
        
        # Calculate correlation with target
        if 'target' in numeric_df.columns:
            correlations = numeric_df.corr()['target'].sort_values(ascending=False)
            return correlations
        else:
            print("Warning: 'target' column not found in numeric columns")
            return pd.Series()
    
    except Exception as e:
        print(f"Error analyzing feature importance: {e}")
        return pd.Series()

def main():
    """Main function to perform feature engineering"""
    # Resolve input path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, args.input)
    
    # Load dataset
    df = load_dataset(input_path)
    if df is None:
        return
    
    # Add derived features
    enhanced_df = add_derived_features(df)
    
    # Resolve output path
    output_path = os.path.join(script_dir, args.output)
    
    # Save enhanced dataset
    save_enhanced_dataset(enhanced_df, output_path)
    
    print("Feature engineering complete")

if __name__ == "__main__":
    main()