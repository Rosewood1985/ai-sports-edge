# ML API Integration Summary

## Overview

We have successfully integrated a comprehensive machine learning API into the AI Sports Edge platform. This integration enables the platform to provide accurate predictions and personalized recommendations for sports betting across multiple sports, leveraging data from various sports APIs.

## Components Implemented

### 1. ML API Server

- **Location**: `/api/ml-sports-edge/`
- **Technology**: Node.js, Express, TensorFlow.js, ml-random-forest
- **Features**:
  - Multi-source data collection from various sports APIs
  - Data normalization and feature engineering
  - Machine learning model training and prediction
  - RESTful API endpoints for predictions and recommendations

### 2. Web App Integration

- **New Components**:
  - `MLPredictionCard.js`: React component to display predictions
  - `PredictionsPage.js`: Page component to display predictions for different sports
  - `MLPredictionService.js`: Service to fetch predictions from the ML API
  - `predictions.css`: Styles for the prediction components

- **Updated Components**:
  - `App.js`: Added route for the Predictions page
  - `Header.js`: Added link to the Predictions page

### 3. Deployment Script

- **Location**: `/scripts/update-web-with-ml-api.js`
- **Purpose**: Automates the process of updating the web app with the ML API integration

## Data Sources

The ML API integrates data from multiple sources:

1. **Odds API**: Betting odds for all supported sports
2. **ESPN API**: Game schedules, scores, and team information
3. **NHL Stats API**: Detailed hockey statistics
4. **SportRadar API**: Detailed statistics for multiple sports
5. **NCAA Basketball API**: College basketball data
6. **Sherdog API**: UFC/MMA event and fighter data

## Supported Sports

The ML API supports predictions for the following sports:

- NBA (National Basketball Association)
- WNBA (Women's National Basketball Association)
- MLB (Major League Baseball)
- NHL (National Hockey League)
- NCAA Men's Basketball
- NCAA Women's Basketball
- Formula 1
- UFC/MMA

## Prediction Types

The ML API provides the following types of predictions:

1. **Game Predictions**:
   - Spread (point spread)
   - Moneyline (winner)
   - Total (over/under)

2. **Player Predictions**:
   - Points
   - Rebounds
   - Assists
   - Other statistics

3. **Race Predictions** (Formula 1):
   - Race winner
   - Podium finishers

4. **Fight Predictions** (UFC/MMA):
   - Fight winner
   - Method of victory
   - Round prediction

## How to Use

### Starting the ML API Server

```bash
cd api/ml-sports-edge
npm install
node server.js
```

The API server will start on port 3001 by default.

### Running the Data Pipeline

To collect data, normalize it, extract features, and train models:

```bash
cd api/ml-sports-edge
node run-pipeline.js
```

You can also run individual steps of the pipeline:

```bash
# Collect data from sports APIs
node data/fetch-enhanced.js

# Normalize data
node data/normalize.js

# Extract features
node models/features.js

# Train models
node models/train-enhanced.js
```

### Testing the ML API

To test the ML API and ensure it's working correctly:

```bash
cd api/ml-sports-edge
node test-pipeline.js
```

### Updating the Web App

To update the web app with the ML API integration:

```bash
node scripts/update-web-with-ml-api.js
```

This script will:
1. Install ML API dependencies
2. Start the ML API server
3. Build the web app
4. Deploy the web app to the hosting service

## API Endpoints

### Predictions

- `GET /api/predictions/games` - Get predictions for upcoming games
- `GET /api/predictions/games/:gameId` - Get detailed prediction for a specific game
- `GET /api/predictions/players/:playerId` - Get player performance predictions
- `GET /api/predictions/sports/:sportType` - Get predictions filtered by sport type
- `GET /api/predictions/trending` - Get trending predictions based on model confidence

### Recommendations

- `GET /api/recommendations/user/:userId` - Get personalized betting recommendations for a user
- `GET /api/recommendations/trending` - Get trending bets among users
- `GET /api/recommendations/value` - Get value bets based on model vs. market odds
- `GET /api/recommendations/sport/:sportType` - Get recommendations for a specific sport
- `GET /api/recommendations/daily` - Get daily recommended picks

## Environment Variables

The ML API requires the following environment variables:

```
PORT=3001
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/ml-sports-edge
ODDS_API_KEY=your_odds_api_key
SPORTRADAR_API_KEY=your_sportradar_api_key
NCAA_BASKETBALL_API_KEY=your_ncaa_api_key
```

Copy the `.env.example` file to `.env` and fill in your values.

## Next Steps

1. **Enhance Data Collection**:
   - Add more historical data for better model training
   - Implement more sophisticated data collection strategies

2. **Improve Models**:
   - Fine-tune hyperparameters for better accuracy
   - Implement more advanced machine learning techniques

3. **Expand Sports Coverage**:
   - Add support for more sports (e.g., soccer, tennis, golf)
   - Add more prediction types for existing sports

4. **User Personalization**:
   - Implement user preference-based recommendations
   - Track user betting history for personalized insights

5. **Performance Optimization**:
   - Optimize data processing for faster predictions
   - Implement caching strategies for better performance

## Conclusion

The ML API integration provides a solid foundation for AI-powered sports predictions and recommendations. By leveraging data from multiple sources and using advanced machine learning techniques, the platform can provide accurate and valuable insights to users, enhancing their sports betting experience.