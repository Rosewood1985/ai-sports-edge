#!/usr/bin/env python3
"""
AI Sports Edge - Game Outcome Prediction Script

This script loads a trained ML model and predicts the outcome of a game
based on input features. It's designed to be called from a Firebase Cloud Function.
"""

import os
import sys
import json
import argparse
import logging
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define feature columns used by the model
FEATURE_COLUMNS = [
    'momentumScore',
    'lineMovement',
    'publicBetPct',
    'confidence',
    'isHomeTeam',
    'streakIndicator',
    # Add any additional features used by your model
]

# Define sport-specific adjustments
SPORT_ADJUSTMENTS = {
    'NBA': 1.05,
    'NFL': 1.1,
    'MLB': 0.95,
    'NHL': 0.9,
    'NCAAB': 0.85,
    'NCAAF': 0.9,
    'UFC': 1.15,
    'Soccer': 0.8,
    'Tennis': 1.0,
    'Golf': 0.75,
    'Formula1': 1.2,
    'default': 1.0
}

# Define league-specific adjustments
LEAGUE_ADJUSTMENTS = {
    'Premier League': 1.1,
    'La Liga': 1.05,
    'Bundesliga': 1.0,
    'Serie A': 1.0,
    'Ligue 1': 0.95,
    'MLS': 0.85,
    'Champions League': 1.15,
    'default': 1.0
}

def load_model(model_path: str) -> Any:
    """
    Load the trained ML model from a pickle file
    
    Args:
        model_path: Path to the model pickle file
        
    Returns:
        The loaded model object
    """
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        logger.info(f"Model loaded successfully from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def preprocess_input(game_data: Dict[str, Any]) -> pd.DataFrame:
    """
    Preprocess the input game data into a format suitable for the model
    
    Args:
        game_data: Dictionary containing game information
        
    Returns:
        DataFrame with features ready for prediction
    """
    try:
        # Extract features
        features = {}
        
        # Add required features
        for col in FEATURE_COLUMNS:
            if col in game_data:
                features[col] = game_data[col]
            else:
                # Use default values for missing features
                if col == 'isHomeTeam':
                    features[col] = False
                elif col in ['momentumScore', 'lineMovement', 'streakIndicator']:
                    features[col] = 0
                elif col == 'publicBetPct':
                    features[col] = 50
                elif col == 'confidence':
                    features[col] = 0
                else:
                    features[col] = 0
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        logger.info(f"Input preprocessed successfully: {df.to_dict(orient='records')}")
        return df
    
    except Exception as e:
        logger.error(f"Error preprocessing input: {e}")
        raise

def adjust_confidence(
    base_confidence: float,
    sport: str,
    league: str,
    momentum_score: float
) -> float:
    """
    Adjust the model's confidence score based on sport, league, and momentum
    
    Args:
        base_confidence: The raw confidence score from the model
        sport: The sport (e.g., 'NBA', 'NFL')
        league: The league (e.g., 'Premier League')
        momentum_score: The momentum score for the game
        
    Returns:
        Adjusted confidence score
    """
    # Get sport adjustment factor
    sport_factor = SPORT_ADJUSTMENTS.get(sport, SPORT_ADJUSTMENTS['default'])
    
    # Get league adjustment factor
    league_factor = LEAGUE_ADJUSTMENTS.get(league, LEAGUE_ADJUSTMENTS['default'])
    
    # Calculate momentum adjustment (higher momentum = higher confidence)
    momentum_factor = 1.0 + (abs(momentum_score) / 100)
    
    # Apply adjustments
    adjusted_confidence = base_confidence * sport_factor * league_factor * momentum_factor
    
    # Ensure confidence is between 0 and 100
    adjusted_confidence = max(0, min(100, adjusted_confidence))
    
    logger.info(f"Adjusted confidence: {adjusted_confidence:.2f} (base: {base_confidence:.2f}, " +
                f"sport: {sport_factor}, league: {league_factor}, momentum: {momentum_factor})")
    
    return adjusted_confidence

def generate_insight_text(
    team_a: str,
    team_b: str,
    predicted_winner: str,
    confidence: float,
    momentum_score: float
) -> str:
    """
    Generate an AI insight text based on the prediction
    
    Args:
        team_a: Name of team A
        team_b: Name of team B
        predicted_winner: Name of the predicted winner
        confidence: Confidence score (0-100)
        momentum_score: Momentum score
        
    Returns:
        Generated insight text
    """
    # Determine confidence level text
    if confidence >= 80:
        confidence_text = "high confidence"
    elif confidence >= 60:
        confidence_text = "moderate confidence"
    else:
        confidence_text = "low confidence"
    
    # Determine momentum text
    if abs(momentum_score) >= 20:
        if momentum_score > 0:
            momentum_text = f"strong positive momentum ({momentum_score:.1f})"
        else:
            momentum_text = f"strong negative momentum ({momentum_score:.1f})"
    elif abs(momentum_score) >= 10:
        if momentum_score > 0:
            momentum_text = f"positive momentum ({momentum_score:.1f})"
        else:
            momentum_text = f"negative momentum ({momentum_score:.1f})"
    else:
        momentum_text = f"balanced momentum ({momentum_score:.1f})"
    
    # Generate insight text
    loser = team_b if predicted_winner == team_a else team_a
    
    insight = (
        f"Our AI model predicts {predicted_winner} to win against {loser} with {confidence_text} "
        f"({confidence:.1f}%). {predicted_winner} has {momentum_text} heading into this matchup. "
        f"Recent performance trends and statistical analysis suggest {predicted_winner} has a "
        f"favorable edge in this contest."
    )
    
    return insight

def predict_outcome(
    model: Any,
    game_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Predict the outcome of a game using the loaded model
    
    Args:
        model: The loaded ML model
        game_data: Dictionary containing game information
        
    Returns:
        Dictionary with prediction results
    """
    try:
        # Preprocess input
        features_df = preprocess_input(game_data)
        
        # Make prediction
        prediction_proba = model.predict_proba(features_df)[0]
        prediction = model.predict(features_df)[0]
        
        # Get base confidence (probability of the predicted class)
        base_confidence = prediction_proba[1] if prediction == 1 else prediction_proba[0]
        base_confidence *= 100  # Convert to percentage
        
        # Determine predicted winner
        team_a = game_data.get('teamA', 'Team A')
        team_b = game_data.get('teamB', 'Team B')
        predicted_winner = team_a if prediction == 1 else team_b
        
        # Get sport and league
        sport = game_data.get('sport', 'default')
        league = game_data.get('league', 'default')
        
        # Get momentum score
        momentum_score = game_data.get('momentumScore', 0)
        
        # Adjust confidence
        adjusted_confidence = adjust_confidence(base_confidence, sport, league, momentum_score)
        
        # Generate insight text
        insight_text = generate_insight_text(
            team_a, team_b, predicted_winner, adjusted_confidence, momentum_score
        )
        
        # Prepare result
        result = {
            'gameId': game_data.get('gameId', ''),
            'predictedOutcome': int(prediction),
            'predictedWinner': predicted_winner,
            'baseConfidence': float(base_confidence),
            'adjustedConfidence': float(adjusted_confidence),
            'aiInsightText': insight_text,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Prediction result: {result}")
        return result
    
    except Exception as e:
        logger.error(f"Error predicting outcome: {e}")
        raise

def main():
    """Main function to run the prediction script"""
    parser = argparse.ArgumentParser(description='Predict game outcome using ML model')
    parser.add_argument('--model', required=True, help='Path to the model pickle file')
    parser.add_argument('--input', required=True, help='Path to the input JSON file')
    parser.add_argument('--output', help='Path to save the output JSON file')
    
    args = parser.parse_args()
    
    try:
        # Load model
        model = load_model(args.model)
        
        # Load input data
        with open(args.input, 'r') as f:
            game_data = json.load(f)
        
        # Make prediction
        result = predict_outcome(model, game_data)
        
        # Print result to stdout
        print(json.dumps(result, indent=2))
        
        # Save result to output file if specified
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
            logger.info(f"Result saved to {args.output}")
        
    except Exception as e:
        logger.error(f"Error in main function: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()