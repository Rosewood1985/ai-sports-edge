/**
 * Prediction Model
 * Represents a prediction for a game with confidence scores and factors
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PredictionSchema = new Schema({
  gameId: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['NBA', 'NFL', 'MLB', 'NHL', 'WNBA', 'NCAA', 'F1', 'UFC', 'SOCCER'],
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  predictions: {
    spread: {
      pick: {
        type: String,
        enum: ['home', 'away', null],
        default: null
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      value: {
        type: Number, // Expected value of the bet
        default: 0
      },
      factors: [{
        name: String,
        weight: Number,
        impact: Number
      }]
    },
    overUnder: {
      pick: {
        type: String,
        enum: ['over', 'under', null],
        default: null
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      value: {
        type: Number,
        default: 0
      },
      factors: [{
        name: String,
        weight: Number,
        impact: Number
      }]
    },
    moneyline: {
      pick: {
        type: String,
        enum: ['home', 'away', null],
        default: null
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      value: {
        type: Number,
        default: 0
      },
      factors: [{
        name: String,
        weight: Number,
        impact: Number
      }]
    },
    score: {
      homeScore: {
        prediction: Number,
        confidence: {
          type: Number,
          min: 0,
          max: 1
        }
      },
      awayScore: {
        prediction: Number,
        confidence: {
          type: Number,
          min: 0,
          max: 1
        }
      },
      factors: [{
        name: String,
        weight: Number,
        impact: Number
      }]
    }
  },
  modelInfo: {
    version: String,
    type: {
      type: String,
      enum: ['ensemble', 'random-forest', 'gradient-boosting', 'neural-network', 'statistical']
    },
    features: [String],
    performance: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number
    }
  },
  result: {
    spreadResult: {
      type: String,
      enum: ['correct', 'incorrect', 'push', null],
      default: null
    },
    overUnderResult: {
      type: String,
      enum: ['correct', 'incorrect', 'push', null],
      default: null
    },
    moneylineResult: {
      type: String,
      enum: ['correct', 'incorrect', null],
      default: null
    },
    scoreAccuracy: {
      home: Number, // Percentage accuracy of home score prediction
      away: Number  // Percentage accuracy of away score prediction
    }
  },
  feedback: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    isPublic: {
      type: Boolean,
      default: true
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    tags: [String],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

// Indexes for efficient querying
PredictionSchema.index({ 'sport': 1, 'timestamp': -1 });
PredictionSchema.index({ 'predictions.spread.confidence': -1 });
PredictionSchema.index({ 'predictions.overUnder.confidence': -1 });
PredictionSchema.index({ 'predictions.moneyline.confidence': -1 });
PredictionSchema.index({ 'metadata.isPremium': 1 });

// Virtual for average feedback rating
PredictionSchema.virtual('averageRating').get(function() {
  if (!this.feedback || this.feedback.length === 0) {
    return null;
  }
  
  const sum = this.feedback.reduce((total, item) => total + item.rating, 0);
  return sum / this.feedback.length;
});

// Method to evaluate prediction accuracy after game is completed
PredictionSchema.methods.evaluatePrediction = function(gameResult) {
  if (!gameResult || !gameResult.completed) {
    return;
  }
  
  // Evaluate spread prediction
  if (this.predictions.spread.pick && gameResult.spreadResult) {
    if (gameResult.spreadResult === 'push') {
      this.result.spreadResult = 'push';
    } else if (this.predictions.spread.pick === gameResult.spreadResult) {
      this.result.spreadResult = 'correct';
    } else {
      this.result.spreadResult = 'incorrect';
    }
  }
  
  // Evaluate over/under prediction
  if (this.predictions.overUnder.pick && gameResult.totalResult) {
    if (gameResult.totalResult === 'push') {
      this.result.overUnderResult = 'push';
    } else if (this.predictions.overUnder.pick === gameResult.totalResult) {
      this.result.overUnderResult = 'correct';
    } else {
      this.result.overUnderResult = 'incorrect';
    }
  }
  
  // Evaluate moneyline prediction
  if (this.predictions.moneyline.pick && gameResult.moneylineResult) {
    if (this.predictions.moneyline.pick === gameResult.moneylineResult) {
      this.result.moneylineResult = 'correct';
    } else {
      this.result.moneylineResult = 'incorrect';
    }
  }
  
  // Evaluate score prediction accuracy
  if (this.predictions.score.homeScore.prediction !== undefined && 
      this.predictions.score.awayScore.prediction !== undefined &&
      gameResult.homeScore !== undefined &&
      gameResult.awayScore !== undefined) {
    
    const homeScoreDiff = Math.abs(this.predictions.score.homeScore.prediction - gameResult.homeScore);
    const awayScoreDiff = Math.abs(this.predictions.score.awayScore.prediction - gameResult.awayScore);
    
    // Calculate percentage accuracy (100% - percentage error)
    const homeMaxScore = Math.max(this.predictions.score.homeScore.prediction, gameResult.homeScore);
    const awayMaxScore = Math.max(this.predictions.score.awayScore.prediction, gameResult.awayScore);
    
    this.result.scoreAccuracy = {
      home: homeMaxScore > 0 ? 100 - (homeScoreDiff / homeMaxScore * 100) : 100,
      away: awayMaxScore > 0 ? 100 - (awayScoreDiff / awayMaxScore * 100) : 100
    };
  }
};

// Pre-save hook to update timestamps
PredictionSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Prediction', PredictionSchema);