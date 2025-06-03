/**
 * Game Model
 * Represents a sports game with teams, odds, and results
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema(
  {
    sport: {
      type: String,
      required: true,
      enum: ['NBA', 'NFL', 'MLB', 'NHL', 'WNBA', 'NCAA', 'F1', 'UFC', 'SOCCER'],
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    homeTeam: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      stats: {
        recentForm: [Number], // Last N games results (1 for win, 0 for loss)
        homeRecord: {
          wins: Number,
          losses: Number,
        },
        offensiveRating: Number,
        defensiveRating: Number,
        pace: Number,
        strengthOfSchedule: Number,
      },
    },
    awayTeam: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      stats: {
        recentForm: [Number], // Last N games results (1 for win, 0 for loss)
        awayRecord: {
          wins: Number,
          losses: Number,
        },
        offensiveRating: Number,
        defensiveRating: Number,
        pace: Number,
        strengthOfSchedule: Number,
      },
    },
    odds: {
      opening: {
        spread: Number,
        overUnder: Number,
        homeMoneyline: Number,
        awayMoneyline: Number,
      },
      closing: {
        spread: Number,
        overUnder: Number,
        homeMoneyline: Number,
        awayMoneyline: Number,
      },
      movement: {
        spread: Number, // Difference between opening and closing
        overUnder: Number,
        homeMoneyline: Number,
        awayMoneyline: Number,
      },
      source: {
        type: String,
        default: 'The Odds API',
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    result: {
      homeScore: Number,
      awayScore: Number,
      spreadResult: {
        type: String,
        enum: ['home', 'away', 'push', null],
        default: null,
      },
      totalResult: {
        type: String,
        enum: ['over', 'under', 'push', null],
        default: null,
      },
      moneylineResult: {
        type: String,
        enum: ['home', 'away', null],
        default: null,
      },
      completed: {
        type: Boolean,
        default: false,
      },
    },
    factors: {
      injuries: [
        {
          team: {
            type: String,
            enum: ['home', 'away'],
          },
          playerId: String,
          playerName: String,
          position: String,
          impact: {
            type: String,
            enum: ['high', 'medium', 'low'],
          },
        },
      ],
      weather: {
        condition: String,
        temperature: Number,
        windSpeed: Number,
        precipitation: Number,
        impact: {
          type: String,
          enum: ['high', 'medium', 'low', 'none'],
        },
      },
      travelDistance: {
        home: Number,
        away: Number,
      },
      restDays: {
        home: Number,
        away: Number,
      },
      backToBack: {
        home: Boolean,
        away: Boolean,
      },
    },
    metadata: {
      season: String,
      week: Number,
      tournament: String,
      venue: String,
      attendance: Number,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
GameSchema.index({ sport: 1, date: 1 });
GameSchema.index({ 'homeTeam.name': 1, 'awayTeam.name': 1 });
GameSchema.index({ 'result.completed': 1 });

// Virtual for margin of victory
GameSchema.virtual('marginOfVictory').get(function () {
  if (this.result.homeScore !== undefined && this.result.awayScore !== undefined) {
    return this.result.homeScore - this.result.awayScore;
  }
  return null;
});

// Method to check if a game is in the past
GameSchema.methods.isPast = function () {
  return new Date() > this.date;
};

// Method to calculate the result after the game is completed
GameSchema.methods.calculateResult = function () {
  if (
    !this.result.completed ||
    this.result.homeScore === undefined ||
    this.result.awayScore === undefined
  ) {
    return;
  }

  // Calculate moneyline result
  if (this.result.homeScore > this.result.awayScore) {
    this.result.moneylineResult = 'home';
  } else {
    this.result.moneylineResult = 'away';
  }

  // Calculate spread result
  const homeScoreWithSpread = this.result.homeScore + this.odds.closing.spread;
  if (homeScoreWithSpread > this.result.awayScore) {
    this.result.spreadResult = 'home';
  } else if (homeScoreWithSpread < this.result.awayScore) {
    this.result.spreadResult = 'away';
  } else {
    this.result.spreadResult = 'push';
  }

  // Calculate total result
  const totalScore = this.result.homeScore + this.result.awayScore;
  if (totalScore > this.odds.closing.overUnder) {
    this.result.totalResult = 'over';
  } else if (totalScore < this.odds.closing.overUnder) {
    this.result.totalResult = 'under';
  } else {
    this.result.totalResult = 'push';
  }
};

// Pre-save hook to update the result
GameSchema.pre('save', function (next) {
  if (
    this.isModified('result.homeScore') ||
    this.isModified('result.awayScore') ||
    this.isModified('result.completed')
  ) {
    if (this.result.completed) {
      this.calculateResult();
    }
  }

  // Update the updatedAt timestamp
  this.metadata.updatedAt = new Date();

  next();
});

module.exports = mongoose.model('Game', GameSchema);
