#!/bin/bash
# Script to make predictions using the trained ML models

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
DATE=""
OUTPUT_FORMAT="json"
CONFIDENCE_THRESHOLD=0.6

while [[ $# -gt 0 ]]; do
    case $1 in
        --sport)
            SPORT="$2"
            shift 2
            ;;
        --date)
            DATE="$2"
            shift 2
            ;;
        --output-format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --confidence-threshold)
            CONFIDENCE_THRESHOLD="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$SPORT" ]; then
    echo -e "${RED}Error: Sport is required. Available sports: nba, nfl, mlb, nhl, ncaa_mens, ncaa_womens${NC}"
    exit 1
fi

if [ -z "$DATE" ]; then
    # Use today's date if not provided
    DATE=$(date +%Y-%m-%d)
fi

# Install required Python packages
section "Installing required Python packages"
pip3 install -r api/ml-sports-edge/requirements.txt

# Create a temporary Python script to make predictions
TMP_PY_FILE=$(mktemp)
cat > "$TMP_PY_FILE" << EOF
#!/usr/bin/env python3
"""
ML Model Prediction Script
Makes predictions using the trained ML models
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import requests

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'api', 'ml-sports-edge', 'models', 'trained')
PREDICTIONS_DIR = os.path.join(BASE_DIR, 'api', 'ml-sports-edge', 'data', 'predictions')
FEATURES_DIR = os.path.join(BASE_DIR, 'api', 'ml-sports-edge', 'data', 'features')

# Ensure directories exist
os.makedirs(PREDICTIONS_DIR, exist_ok=True)

# Prediction parameters
SPORT = "${SPORT}".upper()
DATE = "${DATE}"
OUTPUT_FORMAT = "${OUTPUT_FORMAT}"
CONFIDENCE_THRESHOLD = float(${CONFIDENCE_THRESHOLD})

# API configuration
API_CONFIG = {
    'ODDS_API': {
        'BASE_URL': 'https://api.the-odds-api.com/v4',
        'API_KEY': os.environ.get('ODDS_API_KEY', 'fdf4ad2d50a6b6d2ca77e52734851aa4'),
        'SPORTS': {
            'NBA': 'basketball_nba',
            'WNBA': 'basketball_wnba',
            'MLB': 'baseball_mlb',
            'NHL': 'icehockey_nhl',
            'NCAA_MENS': 'basketball_ncaa',
            'NCAA_WOMENS': 'basketball_ncaaw',
        }
    },
    'ESPN_API': {
        'BASE_URL': 'https://site.api.espn.com/apis/site/v2/sports',
        'ENDPOINTS': {
            'NBA': {
                'SCOREBOARD': 'basketball/nba/scoreboard',
            },
            'WNBA': {
                'SCOREBOARD': 'basketball/wnba/scoreboard',
            },
            'MLB': {
                'SCOREBOARD': 'baseball/mlb/scoreboard',
            },
            'NHL': {
                'SCOREBOARD': 'hockey/nhl/scoreboard',
            },
            'NCAA_MENS': {
                'SCOREBOARD': 'basketball/mens-college-basketball/scoreboard',
            },
            'NCAA_WOMENS': {
                'SCOREBOARD': 'basketball/womens-college-basketball/scoreboard',
            }
        }
    }
}

def fetch_odds_data(sport):
    """
    Fetch odds data from the Odds API
    
    Args:
        sport (str): Sport key
        
    Returns:
        list: List of games with odds data
    """
    sport_key = API_CONFIG['ODDS_API']['SPORTS'].get(sport)
    if not sport_key:
        print(f"No Odds API mapping for {sport}")
        return []
    
    url = f"{API_CONFIG['ODDS_API']['BASE_URL']}/sports/{sport_key}/odds"
    params = {
        'apiKey': API_CONFIG['ODDS_API']['API_KEY'],
        'regions': 'us',
        'markets': 'h2h,spreads,totals',
        'oddsFormat': 'american',
        'dateFormat': 'iso'
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching odds data: {e}")
        return []

def fetch_espn_data(sport):
    """
    Fetch game data from the ESPN API
    
    Args:
        sport (str): Sport key
        
    Returns:
        dict: ESPN scoreboard data
    """
    endpoints = API_CONFIG['ESPN_API']['ENDPOINTS'].get(sport)
    if not endpoints or not endpoints.get('SCOREBOARD'):
        print(f"No ESPN API scoreboard endpoint for {sport}")
        return None
    
    url = f"{API_CONFIG['ESPN_API']['BASE_URL']}/{endpoints['SCOREBOARD']}"
    params = {
        'dates': DATE.replace('-', '')
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching ESPN data: {e}")
        return None

def prepare_game_data(odds_data, espn_data):
    """
    Prepare game data for prediction
    
    Args:
        odds_data (list): Odds data from the Odds API
        espn_data (dict): ESPN scoreboard data
        
    Returns:
        list: List of games with features
    """
    if not odds_data:
        print("No odds data available")
        return []
    
    games = []
    
    for game in odds_data:
        # Basic game info
        game_info = {
            'id': game.get('id'),
            'sport': SPORT,
            'date': game.get('commence_time'),
            'homeTeam': None,
            'awayTeam': None,
            'odds': {
                'homeMoneyline': None,
                'awayMoneyline': None,
                'spread': None,
                'overUnder': None
            }
        }
        
        # Determine home and away teams
        if 'home_team' in game and 'away_team' in game:
            game_info['homeTeam'] = game['home_team']
            game_info['awayTeam'] = game['away_team']
        else:
            # Try to determine from bookmakers
            bookmakers = game.get('bookmakers', [])
            if bookmakers:
                markets = bookmakers[0].get('markets', [])
                h2h_market = next((m for m in markets if m['key'] == 'h2h'), None)
                if h2h_market and len(h2h_market['outcomes']) == 2:
                    # Assume first team is home (not always accurate)
                    game_info['homeTeam'] = h2h_market['outcomes'][0]['name']
                    game_info['awayTeam'] = h2h_market['outcomes'][1]['name']
        
        # Extract odds
        bookmakers = game.get('bookmakers', [])
        if bookmakers:
            # Prefer FanDuel if available
            fanduel = next((b for b in bookmakers if b['key'] == 'fanduel'), None)
            bookmaker = fanduel or bookmakers[0]
            
            # Moneyline
            h2h_market = next((m for m in bookmaker['markets'] if m['key'] == 'h2h'), None)
            if h2h_market:
                for outcome in h2h_market['outcomes']:
                    if outcome['name'] == game_info['homeTeam']:
                        game_info['odds']['homeMoneyline'] = outcome['price']
                    elif outcome['name'] == game_info['awayTeam']:
                        game_info['odds']['awayMoneyline'] = outcome['price']
            
            # Spread
            spreads_market = next((m for m in bookmaker['markets'] if m['key'] == 'spreads'), None)
            if spreads_market:
                for outcome in spreads_market['outcomes']:
                    if outcome['name'] == game_info['homeTeam']:
                        game_info['odds']['spread'] = outcome['point']
            
            # Over/Under
            totals_market = next((m for m in bookmaker['markets'] if m['key'] == 'totals'), None)
            if totals_market and totals_market['outcomes']:
                game_info['odds']['overUnder'] = totals_market['outcomes'][0]['point']
        
        # Add ESPN data if available
        if espn_data and 'events' in espn_data:
            for event in espn_data['events']:
                home_team = None
                away_team = None
                
                for competitor in event['competitions'][0]['competitors']:
                    if competitor['homeAway'] == 'home':
                        home_team = competitor['team']['displayName']
                    else:
                        away_team = competitor['team']['displayName']
                
                # Check if this is the same game
                if (game_info['homeTeam'] in home_team or home_team in game_info['homeTeam']) and \
                   (game_info['awayTeam'] in away_team or away_team in game_info['awayTeam']):
                    # Add ESPN data
                    game_info['espn_id'] = event['id']
                    game_info['venue'] = event['competitions'][0].get('venue', {}).get('fullName')
                    game_info['status'] = event['status']['type']['state']
                    
                    # Add team stats if available
                    for competitor in event['competitions'][0]['competitors']:
                        team_stats = {}
                        for stat in competitor.get('statistics', []):
                            team_stats[stat['name']] = stat['value']
                        
                        if competitor['homeAway'] == 'home':
                            game_info['homeTeamStats'] = team_stats
                        else:
                            game_info['awayTeamStats'] = team_stats
                    
                    break
        
        games.append(game_info)
    
    return games

def extract_features(games):
    """
    Extract features for prediction
    
    Args:
        games (list): List of games with data
        
    Returns:
        tuple: X (features), games (with additional data)
    """
    # Load feature names from a previous feature extraction
    features_path = os.path.join(FEATURES_DIR, f"{SPORT.lower()}_features.json")
    if not os.path.exists(features_path):
        print(f"No feature data found for {SPORT}")
        return None, games
    
    with open(features_path, 'r') as f:
        feature_data = json.load(f)
    
    if not feature_data or len(feature_data) == 0:
        print(f"Empty feature data for {SPORT}")
        return None, games
    
    # Get feature names (excluding non-numeric and target variables)
    exclude_cols = ['homeTeam', 'awayTeam', 'homeWin', 'dataSource']
    feature_names = [k for k in feature_data[0].keys() if k not in exclude_cols and isinstance(feature_data[0][k], (int, float))]
    
    # Extract features for each game
    X = []
    for game in games:
        features = {}
        
        # Basic features
        features['homeMoneyline'] = game['odds']['homeMoneyline']
        features['awayMoneyline'] = game['odds']['awayMoneyline']
        features['spread'] = game['odds']['spread']
        features['overUnder'] = game['odds']['overUnder']
        
        # Convert moneyline odds to implied probability
        if features['homeMoneyline']:
            if features['homeMoneyline'] > 0:
                features['homeImpliedProbability'] = 100 / (features['homeMoneyline'] + 100)
            else:
                features['homeImpliedProbability'] = abs(features['homeMoneyline']) / (abs(features['homeMoneyline']) + 100)
        
        if features['awayMoneyline']:
            if features['awayMoneyline'] > 0:
                features['awayImpliedProbability'] = 100 / (features['awayMoneyline'] + 100)
            else:
                features['awayImpliedProbability'] = abs(features['awayMoneyline']) / (abs(features['awayMoneyline']) + 100)
        
        # Add ESPN stats if available
        if 'homeTeamStats' in game:
            for stat, value in game['homeTeamStats'].items():
                features[f'home{stat}'] = value
        
        if 'awayTeamStats' in game:
            for stat, value in game['awayTeamStats'].items():
                features[f'away{stat}'] = value
        
        # Ensure all feature names are present
        feature_vector = []
        for name in feature_names:
            if name in features:
                feature_vector.append(features[name])
            else:
                # Use mean value from training data
                mean_value = np.mean([d.get(name, 0) for d in feature_data if name in d])
                feature_vector.append(mean_value)
        
        X.append(feature_vector)
        
        # Store feature vector in game data
        game['features'] = dict(zip(feature_names, feature_vector))
    
    return np.array(X), games

def load_model_and_predict(X, games):
    """
    Load the trained model and make predictions
    
    Args:
        X (np.ndarray): Features
        games (list): List of games with data
        
    Returns:
        list: Games with predictions
    """
    model_path = os.path.join(MODELS_DIR, f"{SPORT.lower()}_model.h5")
    if not os.path.exists(model_path):
        print(f"No trained model found for {SPORT}")
        return games
    
    # Load model
    model = load_model(model_path)
    
    # Make predictions
    predictions = model.predict(X)
    
    # Add predictions to games
    for i, game in enumerate(games):
        home_win_probability = float(predictions[i][0])
        away_win_probability = 1 - home_win_probability
        
        game['prediction'] = {
            'homeWinProbability': home_win_probability,
            'awayWinProbability': away_win_probability,
            'predictedWinner': game['homeTeam'] if home_win_probability > 0.5 else game['awayTeam'],
            'confidence': max(home_win_probability, away_win_probability),
            'recommendedBet': None
        }
        
        # Determine if this is a value bet
        if home_win_probability > 0.5 and game['odds']['homeMoneyline'] > 0:
            # Underdog home team predicted to win
            game['prediction']['recommendedBet'] = {
                'team': game['homeTeam'],
                'type': 'moneyline',
                'odds': game['odds']['homeMoneyline'],
                'value': home_win_probability - (100 / (game['odds']['homeMoneyline'] + 100))
            }
        elif away_win_probability > 0.5 and game['odds']['awayMoneyline'] > 0:
            # Underdog away team predicted to win
            game['prediction']['recommendedBet'] = {
                'team': game['awayTeam'],
                'type': 'moneyline',
                'odds': game['odds']['awayMoneyline'],
                'value': away_win_probability - (100 / (game['odds']['awayMoneyline'] + 100))
            }
        elif home_win_probability > (abs(game['odds']['homeMoneyline']) / (abs(game['odds']['homeMoneyline']) + 100) + 0.05):
            # Home team has value (at least 5% edge)
            game['prediction']['recommendedBet'] = {
                'team': game['homeTeam'],
                'type': 'moneyline',
                'odds': game['odds']['homeMoneyline'],
                'value': home_win_probability - (abs(game['odds']['homeMoneyline']) / (abs(game['odds']['homeMoneyline']) + 100))
            }
        elif away_win_probability > (abs(game['odds']['awayMoneyline']) / (abs(game['odds']['awayMoneyline']) + 100) + 0.05):
            # Away team has value (at least 5% edge)
            game['prediction']['recommendedBet'] = {
                'team': game['awayTeam'],
                'type': 'moneyline',
                'odds': game['odds']['awayMoneyline'],
                'value': away_win_probability - (abs(game['odds']['awayMoneyline']) / (abs(game['odds']['awayMoneyline']) + 100))
            }
    
    return games

def save_predictions(games):
    """
    Save predictions to file
    
    Args:
        games (list): List of games with predictions
        
    Returns:
        str: Path to the saved predictions file
    """
    # Filter games by confidence threshold
    confident_games = [game for game in games if game['prediction']['confidence'] >= CONFIDENCE_THRESHOLD]
    
    # Create predictions object
    predictions = {
        'sport': SPORT,
        'date': DATE,
        'timestamp': datetime.now().isoformat(),
        'confidenceThreshold': CONFIDENCE_THRESHOLD,
        'games': games,
        'confidentPicks': confident_games
    }
    
    # Save to file
    predictions_path = os.path.join(PREDICTIONS_DIR, f"{SPORT.lower()}_predictions_{DATE}.json")
    with open(predictions_path, 'w') as f:
        json.dump(predictions, f, indent=2)
    
    return predictions_path

def format_output(games):
    """
    Format predictions for output
    
    Args:
        games (list): List of games with predictions
        
    Returns:
        str: Formatted output
    """
    if OUTPUT_FORMAT == 'json':
        # Already saved as JSON, just return the count
        return f"Predictions for {len(games)} games saved to JSON file"
    
    # Format as text
    output = f"Predictions for {SPORT} on {DATE}\n"
    output += "=" * 80 + "\n\n"
    
    # Filter games by confidence threshold
    confident_games = [game for game in games if game['prediction']['confidence'] >= CONFIDENCE_THRESHOLD]
    
    output += f"Found {len(confident_games)} games with confidence >= {CONFIDENCE_THRESHOLD}\n\n"
    
    for game in sorted(confident_games, key=lambda g: g['prediction']['confidence'], reverse=True):
        output += f"{game['homeTeam']} vs {game['awayTeam']}\n"
        output += f"Game Time: {game['date']}\n"
        output += f"Odds: {game['homeTeam']} {game['odds']['homeMoneyline']} | {game['awayTeam']} {game['odds']['awayMoneyline']}\n"
        output += f"Spread: {game['odds']['spread']} | Over/Under: {game['odds']['overUnder']}\n"
        output += f"Prediction: {game['prediction']['predictedWinner']} to win"
        output += f" (Confidence: {game['prediction']['confidence']:.2f})\n"
        
        if game['prediction']['recommendedBet']:
            bet = game['prediction']['recommendedBet']
            output += f"Recommended Bet: {bet['team']} {bet['odds']} ({bet['value']:.2f} edge)\n"
        
        output += "-" * 80 + "\n\n"
    
    return output

def main():
    """Main function to make predictions"""
    print(f"Making predictions for {SPORT} on {DATE}...")
    
    # Fetch odds data
    odds_data = fetch_odds_data(SPORT)
    if not odds_data:
        print(f"No odds data available for {SPORT} on {DATE}")
        return
    
    # Fetch ESPN data
    espn_data = fetch_espn_data(SPORT)
    
    # Prepare game data
    games = prepare_game_data(odds_data, espn_data)
    if not games:
        print(f"No games found for {SPORT} on {DATE}")
        return
    
    print(f"Found {len(games)} games for {SPORT} on {DATE}")
    
    # Extract features
    X, games = extract_features(games)
    if X is None:
        print(f"Failed to extract features for {SPORT}")
        return
    
    # Load model and make predictions
    games = load_model_and_predict(X, games)
    
    # Save predictions
    predictions_path = save_predictions(games)
    print(f"Predictions saved to {predictions_path}")
    
    # Format and print output
    output = format_output(games)
    print(output)

if __name__ == "__main__":
    main()
EOF

# Make the script executable
chmod +x "$TMP_PY_FILE"

# Run the script
section "Making predictions"
echo -e "Sport: ${YELLOW}${SPORT}${NC}"
echo -e "Date: ${YELLOW}${DATE}${NC}"
echo -e "Output Format: ${YELLOW}${OUTPUT_FORMAT}${NC}"
echo -e "Confidence Threshold: ${YELLOW}${CONFIDENCE_THRESHOLD}${NC}"

python3 "$TMP_PY_FILE"

# Remove the temporary file
rm "$TMP_PY_FILE"

section "Prediction Completed"
echo -e "${GREEN}Predictions have been made successfully.${NC}"
echo -e "The predictions are available in the following location:"
echo -e "  - ${YELLOW}api/ml-sports-edge/data/predictions/${NC}"

echo -e "\n${GREEN}You can now use these predictions for betting decisions.${NC}"