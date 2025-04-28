#!/usr/bin/env python3
"""
Test script for the game outcome prediction pipeline.
This script creates a sample game input, runs the prediction, and displays the results.
"""

import os
import json
import argparse
import subprocess
import tempfile
from datetime import datetime

def create_sample_game_data():
    """Create a sample game data for testing"""
    return {
        "gameId": "game_123456",
        "teamA": "Los Angeles Lakers",
        "teamB": "Boston Celtics",
        "sport": "NBA",
        "league": "NBA",
        "startTime": datetime.now().isoformat(),
        "momentumScore": 15.5,
        "lineMovement": -2.5,
        "publicBetPct": 65,
        "confidence": 75,
        "isHomeTeam": True,
        "streakIndicator": 3
    }

def run_prediction(model_path, game_data):
    """Run the prediction script with the sample game data"""
    # Create a temporary file for the game data
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
        json.dump(game_data, temp_file)
        temp_file_path = temp_file.name
    
    try:
        # Get the path to the prediction script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        predict_script_path = os.path.join(script_dir, 'predict_outcome.py')
        
        # Run the prediction script
        cmd = [
            'python3',
            predict_script_path,
            '--model', model_path,
            '--input', temp_file_path
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Check if the command was successful
        if result.returncode != 0:
            print(f"Error running prediction script: {result.stderr}")
            return None
        
        # Parse the output
        try:
            # Find the JSON part of the output
            output = result.stdout
            json_start = output.find('{')
            json_end = output.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_output = output[json_start:json_end]
                prediction_result = json.loads(json_output)
                return prediction_result
            else:
                print(f"Could not find JSON in output: {output}")
                return None
        except json.JSONDecodeError as e:
            print(f"Error parsing prediction result: {e}")
            print(f"Output: {result.stdout}")
            return None
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

def main():
    """Main function to run the test"""
    parser = argparse.ArgumentParser(description='Test the game outcome prediction pipeline')
    parser.add_argument('--model', help='Path to the model pickle file')
    
    args = parser.parse_args()
    
    # If model path is not provided, use the default path
    if not args.model:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(os.path.dirname(script_dir), 'models')
        args.model = os.path.join(model_dir, 'model.pkl')
    
    # Check if the model file exists
    if not os.path.exists(args.model):
        print(f"Model file not found: {args.model}")
        print("Please create a model first using ml/models/create_dummy_model.py")
        return
    
    # Create sample game data
    game_data = create_sample_game_data()
    print(f"Sample game data: {json.dumps(game_data, indent=2)}")
    
    # Run prediction
    print("\nRunning prediction...")
    prediction_result = run_prediction(args.model, game_data)
    
    # Display results
    if prediction_result:
        print("\nPrediction result:")
        print(json.dumps(prediction_result, indent=2))
        
        # Display summary
        winner = prediction_result.get('predictedWinner')
        confidence = prediction_result.get('adjustedConfidence')
        insight = prediction_result.get('aiInsightText')
        
        print("\nSummary:")
        print(f"Predicted Winner: {winner}")
        print(f"Confidence: {confidence:.2f}%")
        print(f"AI Insight: {insight}")
    else:
        print("Prediction failed.")

if __name__ == '__main__':
    main()