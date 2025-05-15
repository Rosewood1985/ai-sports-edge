#!/usr/bin/env python3
"""
prepare_dataset.py

This script connects to Firestore, fetches completed games data,
extracts relevant fields for model training, and saves the data as CSV.
"""

import os
import json
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import argparse

# Set up argument parser
parser = argparse.ArgumentParser(description='Prepare dataset for AI Sports Edge model training')
parser.add_argument('--days', type=int, default=90, help='Number of days of historical data to fetch')
parser.add_argument('--output', type=str, default='games_data.csv', help='Output CSV filename')
parser.add_argument('--service-account', type=str, default='serviceAccountKey.json', 
                    help='Path to Firebase service account key')
args = parser.parse_args()

def initialize_firebase(service_account_path):
    """Initialize Firebase with the provided service account key"""
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            # Initialize Firebase Admin SDK
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
        
        # Get Firestore client
        db = firestore.client()
        print("Firebase initialized successfully")
        return db
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

def fetch_completed_games(db, days_back=90):
    """
    Fetch completed games from Firestore
    
    Args:
        db: Firestore client
        days_back: Number of days of historical data to fetch
        
    Returns:
        List of game documents
    """
    try:
        # Calculate date threshold
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Convert to Firestore timestamp
        start_timestamp = firestore.Timestamp.from_datetime(start_date)
        
        # Query completed games
        games_ref = db.collection('games')
        query = (games_ref
                .where('result', '!=', 'pending')  # Only completed games
                .where('startTime', '>=', start_timestamp)  # Within date range
                .limit(10000))  # Limit to prevent excessive data
        
        # Execute query
        game_docs = query.stream()
        
        # Convert to list of dictionaries
        games = []
        for doc in game_docs:
            game_data = doc.to_dict()
            game_data['id'] = doc.id
            games.append(game_data)
        
        print(f"Fetched {len(games)} completed games from the last {days_back} days")
        return games
    
    except Exception as e:
        print(f"Error fetching completed games: {e}")
        return []

def extract_features(games):
    """
    Extract relevant features from game data
    
    Args:
        games: List of game documents
        
    Returns:
        DataFrame with extracted features
    """
    try:
        # Extract relevant fields
        extracted_data = []
        
        for game in games:
            # Skip games without necessary data
            if not all(k in game for k in ['momentumScore', 'result']):
                continue
                
            # Extract basic fields
            game_features = {
                'gameId': game.get('id', ''),
                'sport': game.get('sport', ''),
                'league': game.get('league', ''),
                'teamA': game.get('teamA', ''),
                'teamB': game.get('teamB', ''),
                'startTime': game.get('startTime', None),
                'result': game.get('result', ''),
                'momentumScore': game.get('momentumScore', 0),
                'lineMovement': game.get('lineMovement', 0),
                'publicBetPct': game.get('publicBetPct', 50),
                'confidence': game.get('confidence', 0),
                'aiPredictedWinner': game.get('aiPredictedWinner', ''),
                'actualWinner': game.get('actualWinner', '')
            }
            
            # Convert Firestore timestamp to datetime
            if game_features['startTime'] and hasattr(game_features['startTime'], 'seconds'):
                game_features['startTime'] = datetime.fromtimestamp(game_features['startTime'].seconds)
            
            # Add binary target variable (1 for win, 0 for loss)
            if game_features['result'] == 'win':
                game_features['target'] = 1
            elif game_features['result'] == 'loss':
                game_features['target'] = 0
            else:
                # Skip pushes or invalid results
                continue
                
            extracted_data.append(game_features)
        
        # Convert to DataFrame
        df = pd.DataFrame(extracted_data)
        
        print(f"Extracted features for {len(df)} games")
        return df
    
    except Exception as e:
        print(f"Error extracting features: {e}")
        return pd.DataFrame()

def save_dataset(df, output_path):
    """
    Save the dataset to CSV
    
    Args:
        df: DataFrame with game features
        output_path: Path to save the CSV file
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        
        # Save to CSV
        df.to_csv(output_path, index=False)
        
        print(f"Dataset saved to {output_path}")
        
        # Also save a sample as JSON for inspection
        sample = df.head(5).to_dict(orient='records')
        json_path = os.path.splitext(output_path)[0] + '_sample.json'
        with open(json_path, 'w') as f:
            json.dump(sample, f, indent=2, default=str)
        
        print(f"Sample saved to {json_path}")
    
    except Exception as e:
        print(f"Error saving dataset: {e}")

def main():
    """Main function to prepare the dataset"""
    # Initialize Firebase
    db = initialize_firebase(args.service_account)
    if not db:
        return
    
    # Fetch completed games
    games = fetch_completed_games(db, days_back=args.days)
    if not games:
        return
    
    # Extract features
    df = extract_features(games)
    if df.empty:
        return
    
    # Save dataset
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    output_path = os.path.join(output_dir, args.output)
    save_dataset(df, output_path)
    
    print("Dataset preparation complete")

if __name__ == "__main__":
    main()