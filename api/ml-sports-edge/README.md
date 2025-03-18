# ML Sports Edge API

A machine learning API for sports betting predictions and personalized recommendations, leveraging multiple sports data sources.

## Overview

ML Sports Edge API is a comprehensive machine learning platform that combines data from multiple sports APIs to provide accurate predictions and personalized recommendations for sports betting. The API uses advanced machine learning techniques to predict game outcomes, point spreads, over/under totals, and player performance across multiple sports.

## Features

- **Multi-Source Data Integration**: Combines data from multiple sports APIs for more accurate predictions
- **Game Predictions**: Predict outcomes, spreads, and totals for upcoming games
- **Player Performance Predictions**: Predict player stats for upcoming games
- **Personalized Recommendations**: Tailored betting suggestions based on user preferences and history
- **Value Bet Detection**: Identify bets with positive expected value
- **Trend Analysis**: Track and analyze betting trends
- **Multiple Sports Support**: NBA, WNBA, MLB, NHL, NCAA, Formula 1, UFC, and more

## Tech Stack

- **Backend**: Node.js with Express
- **Machine Learning**: TensorFlow.js, ml-random-forest
- **Database**: MongoDB (configurable)
- **Authentication**: JWT
- **Data Sources**: Odds API, ESPN API, NHL Stats API, SportRadar API, Sherdog API, and more

## Project Structure

```
ml-sports-edge/
├── api/                  # API endpoints
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Middleware functions
│   ├── models/           # Data models
│   └── routes/           # API routes
├── data/                 # Data collection and processing
│   ├── fetch-enhanced.js # Enhanced data fetcher
│   ├── normalize.js      # Data normalizer
│   └── raw/              # Raw data storage
├── models/               # ML models
│   ├── features.js       # Feature engineering
│   ├── train-enhanced.js # Enhanced model training
│   └── saved/            # Saved model files
├── run-pipeline.js       # Pipeline runner
├── server.js             # Main server file
└── package.json          # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (optional)
- API keys for data sources:
  - Odds API
  - SportRadar API
  - NCAA Basketball API

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/ml-sports-edge.git
   cd ml-sports-edge
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with your configuration
   ```
   PORT=3001
   JWT_SECRET=your_jwt_secret
   MONGODB_URI=your_mongodb_uri
   ODDS_API_KEY=your_odds_api_key
   SPORTRADAR_API_KEY=your_sportradar_api_key
   NCAA_BASKETBALL_API_KEY=your_ncaa_api_key
   ```

4. Run the data pipeline
   ```
   node run-pipeline.js
   ```

5. Start the server
   ```
   npm start
   ```

## Data Pipeline

The ML Sports Edge API uses a comprehensive data pipeline to collect, process, and analyze sports data:

1. **Data Collection**: Fetch data from multiple sports APIs
   ```
   node data/fetch-enhanced.js
   ```

2. **Data Normalization**: Transform data into a consistent format
   ```
   node data/normalize.js
   ```

3. **Feature Engineering**: Extract and create features for ML models
   ```
   node models/features.js
   ```

4. **Model Training**: Train ML models using the extracted features
   ```
   node models/train-enhanced.js
   ```

5. **Run Complete Pipeline**: Execute all steps in sequence
   ```
   node run-pipeline.js
   ```

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

### Users

- `GET /api/users/:userId/preferences` - Get user preferences
- `PUT /api/users/:userId/preferences` - Update user preferences
- `GET /api/users/:userId/history` - Get user betting history
- `POST /api/users/:userId/history` - Add new bet to user history
- `GET /api/users/:userId/stats` - Get user betting statistics
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user

### Admin

- `GET /api/admin/models/performance` - Get model performance metrics
- `POST /api/admin/models/retrain` - Trigger model retraining
- `GET /api/admin/models/versions` - Get all model versions
- `POST /api/admin/models/deploy` - Deploy a specific model version
- `POST /api/admin/data/sync` - Trigger data synchronization
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get system statistics

## Data Sources

The API collects data from multiple sources:

1. **Odds API**: Current betting odds for all supported sports
   - API Key: Required
   - Endpoint: `https://api.the-odds-api.com/v4/sports`
   - Sports: NBA, WNBA, MLB, NHL, NCAA, Formula 1, UFC

2. **ESPN API**: Game schedules, scores, and team information
   - No authentication required
   - Endpoint: `https://site.api.espn.com/apis/site/v2/sports`
   - Sports: NBA, WNBA, MLB, NHL, NCAA, Formula 1

3. **NHL Stats API**: Detailed hockey statistics
   - No authentication required
   - Endpoint: `https://api-web.nhl.com`
   - Sports: NHL

4. **SportRadar API**: Detailed statistics for multiple sports
   - API Key: Required
   - Endpoint: `https://api.sportradar.com`
   - Sports: NBA, NFL, MLB, NHL, UFC

5. **NCAA Basketball API**: College basketball data
   - API Key: Required
   - Endpoint: `https://api.sportradar.com`
   - Sports: NCAA Men's and Women's Basketball

6. **Sherdog API**: UFC/MMA event and fighter data
   - No authentication required
   - Endpoint: `https://sherdog-api.vercel.app/api`
   - Sports: UFC/MMA

## Machine Learning Models

The API uses multiple machine learning models:

1. **TensorFlow.js Neural Networks**: For complex pattern recognition
   - Used for: Spread, moneyline, and total predictions
   - Architecture: Multi-layer perceptron with dropout

2. **Random Forest**: For robust classification and regression
   - Used for: Spread, moneyline, and total predictions
   - Implementation: ml-random-forest package

3. **Ensemble Methods**: For combining multiple models
   - Used for: Final predictions with confidence scores
   - Approach: Weighted averaging of model outputs

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected endpoints require a valid token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Development

### Running in Development Mode

```
npm run dev
```

### Testing

```
npm test
```

## Deployment

The API can be deployed to any Node.js hosting platform:

1. **Heroku**
   ```
   heroku create
   git push heroku main
   ```

2. **AWS**
   ```
   npm run build
   # Deploy to AWS using your preferred method
   ```

3. **Docker**
   ```
   docker build -t ml-sports-edge .
   docker run -p 3001:3001 ml-sports-edge
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [TensorFlow.js](https://www.tensorflow.org/js)
- [ml-random-forest](https://github.com/mljs/random-forest)
- [The Odds API](https://the-odds-api.com/)
- [ESPN API](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [NHL Stats API](https://gitlab.com/dword4/nhlapi)
- [SportRadar API](https://developer.sportradar.com/)
- [Sherdog API](https://sherdog-api.vercel.app/)