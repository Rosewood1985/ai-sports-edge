# ML Sports Edge API

A custom machine learning API for AI Sports Edge that provides personalized betting suggestions and predictions.

## Overview

The ML Sports Edge API combines multiple data sources and implements machine learning to provide personalized betting suggestions to users of the AI Sports Edge platform. It analyzes historical game data, player statistics, and betting odds to generate predictions with confidence scores.

## Features

- **Game Outcome Prediction**: Predicts winners, scores, and betting lines
- **Confidence Scoring**: Provides confidence levels for each prediction
- **Feature Importance**: Identifies key factors influencing predictions
- **Value Bet Analysis**: Calculates expected value of bets
- **Personalized Recommendations**: Tailors suggestions based on user preferences and betting history
- **Performance Tracking**: Monitors prediction accuracy and other metrics

## Architecture

The API follows a modular architecture with the following components:

- **Data Collection Layer**: Fetches data from external APIs and user profiles
- **Data Processing Layer**: Normalizes data and extracts features
- **Machine Learning Models**: Trains and evaluates prediction models
- **Recommendation Engine**: Generates personalized betting suggestions
- **API Layer**: Exposes RESTful endpoints for client applications

## API Endpoints

### Prediction Endpoints

- `GET /api/predictions/games`: Get predictions for upcoming games
- `GET /api/predictions/games/:gameId`: Get detailed prediction for a specific game
- `GET /api/predictions/players/:playerId`: Get player performance predictions
- `GET /api/predictions/sports/:sportType`: Get predictions filtered by sport type
- `GET /api/predictions/trending`: Get trending predictions based on model confidence
- `POST /api/predictions/feedback`: Submit feedback on a prediction

### Recommendation Endpoints

- `GET /api/recommendations/user/:userId`: Get personalized betting recommendations
- `GET /api/recommendations/trending`: Get trending bets among users
- `GET /api/recommendations/value`: Get value bets based on model vs. market odds
- `GET /api/recommendations/sport/:sportType`: Get recommendations for a specific sport
- `GET /api/recommendations/daily`: Get daily recommended picks
- `POST /api/recommendations/feedback`: Submit feedback on a recommendation

### User Endpoints

- `GET /api/users/:userId/preferences`: Get user preferences
- `PUT /api/users/:userId/preferences`: Update user preferences
- `GET /api/users/:userId/history`: Get user betting history
- `GET /api/users/:userId/stats`: Get user betting statistics

### Admin Endpoints

- `GET /api/admin/models/performance`: Get model performance metrics
- `POST /api/admin/models/retrain`: Trigger model retraining
- `GET /api/admin/data/sync`: Trigger data synchronization

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Machine Learning**: TensorFlow.js, ml-random-forest
- **Authentication**: JWT
- **Caching**: Node-Cache

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- API keys for sports data providers

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/ai-sports-edge/ml-sports-edge.git
   cd ml-sports-edge
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/ml-sports-edge
   JWT_SECRET=your_jwt_secret
   ODDS_API_KEY=your_odds_api_key
   ```

4. Start the server:
   ```
   npm start
   ```

### Development

For development with auto-restart:
```
npm run dev
```

### Training Models

To train the machine learning models:
```
npm run train
```

### Fetching Data

To fetch fresh data from external APIs:
```
npm run fetch-data
```

## Deployment

The API is deployed to the GoDaddy web app at [aisportsedge.app](https://aisportsedge.app).

To deploy:
```
./scripts/deploy-and-push.sh
```

This script will:
1. Run tests
2. Deploy to the GoDaddy web app
3. Push changes to GitHub
4. Create a deployment tag

## Machine Learning Models

The API uses several machine learning models:

- **Spread Prediction**: Random Forest classifier to predict if the home team will cover the spread
- **Over/Under Prediction**: Random Forest classifier to predict if the total score will go over or under the line
- **Moneyline Prediction**: Random Forest classifier to predict the winner of the game
- **Score Prediction**: Neural network to predict the final score of the game

## Data Models

- **Game**: Represents a sports game with teams, odds, and results
- **Prediction**: Represents a prediction for a game with confidence scores and factors
- **User**: Represents a user with betting preferences and history

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Contact

For questions or support, contact [support@aisportsedge.app](mailto:support@aisportsedge.app).