#!/usr/bin/env python3
"""
Create a dummy ML model for testing purposes.
This script creates a simple RandomForestClassifier model and saves it as a pickle file.
"""

import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification

# Define feature columns used by the model
FEATURE_COLUMNS = [
    'momentumScore',
    'lineMovement',
    'publicBetPct',
    'confidence',
    'isHomeTeam',
    'streakIndicator',
]

def create_dummy_model():
    """Create a dummy RandomForestClassifier model for testing"""
    # Generate a synthetic dataset
    X, y = make_classification(
        n_samples=1000,
        n_features=len(FEATURE_COLUMNS),
        n_informative=4,
        n_redundant=0,
        n_classes=2,
        random_state=42
    )
    
    # Train a simple RandomForestClassifier
    model = RandomForestClassifier(n_estimators=10, random_state=42)
    model.fit(X, y)
    
    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Dummy model saved to {model_path}")
    return model_path

if __name__ == '__main__':
    model_path = create_dummy_model()
    print(f"Model created successfully at: {model_path}")
    
    # Test the model with a sample input
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    # Create a sample input
    sample_input = np.array([[
        10.0,   # momentumScore
        -2.5,   # lineMovement
        65.0,   # publicBetPct
        75.0,   # confidence
        1.0,    # isHomeTeam
        3.0,    # streakIndicator
    ]])
    
    # Make a prediction
    prediction = model.predict(sample_input)[0]
    prediction_proba = model.predict_proba(sample_input)[0]
    
    print(f"Sample prediction: {prediction}")
    print(f"Sample prediction probabilities: {prediction_proba}")