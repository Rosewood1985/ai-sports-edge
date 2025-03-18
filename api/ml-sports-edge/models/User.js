/**
 * User Model
 * Represents a user with betting preferences and history
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  profile: {
    displayName: String,
    avatar: String,
    location: String,
    timezone: String,
    bio: String
  },
  preferences: {
    favoriteSports: [{
      type: String,
      enum: ['NBA', 'NFL', 'MLB', 'NHL', 'WNBA', 'NCAA', 'F1', 'UFC', 'SOCCER']
    }],
    favoriteTeams: [String],
    betTypes: [{
      type: String,
      enum: ['spread', 'moneyline', 'overUnder', 'prop', 'parlay', 'teaser']
    }],
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    notificationPreferences: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'gameDay', 'never'],
          default: 'gameDay'
        },
        types: {
          predictions: {
            type: Boolean,
            default: true
          },
          results: {
            type: Boolean,
            default: true
          },
          news: {
            type: Boolean,
            default: true
          }
        }
      },
      push: {
        enabled: {
          type: Boolean,
          default: true
        },
        types: {
          predictions: {
            type: Boolean,
            default: true
          },
          results: {
            type: Boolean,
            default: true
          },
          news: {
            type: Boolean,
            default: false
          }
        }
      }
    },
    displayPreferences: {
      oddsFormat: {
        type: String,
        enum: ['american', 'decimal', 'fractional'],
        default: 'american'
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      defaultView: {
        type: String,
        enum: ['games', 'predictions', 'bets'],
        default: 'predictions'
      }
    }
  },
  bettingHistory: [{
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game'
    },
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prediction'
    },
    betType: {
      type: String,
      enum: ['spread', 'moneyline', 'overUnder', 'prop', 'parlay', 'teaser']
    },
    pick: String, // 'home', 'away', 'over', 'under', etc.
    odds: Number,
    stake: Number,
    potentialWinnings: Number,
    result: {
      type: String,
      enum: ['win', 'loss', 'push', 'pending'],
      default: 'pending'
    },
    profit: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    platform: {
      type: String,
      enum: ['web', 'ios', 'android'],
      default: 'web'
    },
    bookmaker: String
  }],
  stats: {
    totalBets: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    pushes: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    totalStake: {
      type: Number,
      default: 0
    },
    totalProfit: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    },
    sportWinRates: {
      NBA: {
        type: Number,
        default: 0
      },
      NFL: {
        type: Number,
        default: 0
      },
      MLB: {
        type: Number,
        default: 0
      },
      NHL: {
        type: Number,
        default: 0
      },
      WNBA: {
        type: Number,
        default: 0
      },
      NCAA: {
        type: Number,
        default: 0
      },
      F1: {
        type: Number,
        default: 0
      },
      UFC: {
        type: Number,
        default: 0
      },
      SOCCER: {
        type: Number,
        default: 0
      }
    },
    betTypeWinRates: {
      spread: {
        type: Number,
        default: 0
      },
      moneyline: {
        type: Number,
        default: 0
      },
      overUnder: {
        type: Number,
        default: 0
      },
      prop: {
        type: Number,
        default: 0
      },
      parlay: {
        type: Number,
        default: 0
      },
      teaser: {
        type: Number,
        default: 0
      }
    },
    streaks: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        win: {
          type: Number,
          default: 0
        },
        loss: {
          type: Number,
          default: 0
        }
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  savedPredictions: [{
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prediction'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium', 'pro'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentMethod: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled', 'trial'],
      default: 'active'
    }
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastLogin: Date,
    lastActivity: Date,
    platform: {
      type: String,
      enum: ['web', 'ios', 'android'],
      default: 'web'
    },
    version: String
  }
}, { timestamps: true });

// Indexes for efficient querying
UserSchema.index({ 'preferences.favoriteSports': 1 });
UserSchema.index({ 'preferences.favoriteTeams': 1 });
UserSchema.index({ 'subscription.tier': 1 });
UserSchema.index({ 'stats.winRate': -1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.profile.displayName || this.email.split('@')[0];
});

// Method to calculate user stats
UserSchema.methods.calculateStats = function() {
  const bets = this.bettingHistory;
  
  if (!bets || bets.length === 0) {
    return;
  }
  
  // Initialize counters
  let totalBets = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let totalStake = 0;
  let totalProfit = 0;
  
  // Sport-specific counters
  const sportBets = {};
  const sportWins = {};
  
  // Bet type counters
  const typeBets = {};
  const typeWins = {};
  
  // Current streak
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  
  // Process each bet
  bets.forEach(bet => {
    if (bet.result === 'pending') {
      return; // Skip pending bets
    }
    
    totalBets++;
    totalStake += bet.stake || 0;
    totalProfit += bet.profit || 0;
    
    // Initialize sport counters if needed
    if (!sportBets[bet.sport]) {
      sportBets[bet.sport] = 0;
      sportWins[bet.sport] = 0;
    }
    
    // Initialize bet type counters if needed
    if (!typeBets[bet.betType]) {
      typeBets[bet.betType] = 0;
      typeWins[bet.betType] = 0;
    }
    
    // Increment counters based on result
    sportBets[bet.sport]++;
    typeBets[bet.betType]++;
    
    if (bet.result === 'win') {
      wins++;
      sportWins[bet.sport]++;
      typeWins[bet.betType]++;
      
      // Update streak
      if (currentStreak >= 0) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      
      // Update longest win streak
      if (currentStreak > longestWinStreak) {
        longestWinStreak = currentStreak;
      }
    } else if (bet.result === 'loss') {
      losses++;
      
      // Update streak
      if (currentStreak <= 0) {
        currentStreak--;
      } else {
        currentStreak = -1;
      }
      
      // Update longest loss streak
      if (-currentStreak > longestLossStreak) {
        longestLossStreak = -currentStreak;
      }
    } else if (bet.result === 'push') {
      pushes++;
      // Pushes don't affect streak
    }
  });
  
  // Calculate win rates
  const winRate = totalBets > 0 ? wins / totalBets : 0;
  const roi = totalStake > 0 ? totalProfit / totalStake : 0;
  
  // Calculate sport-specific win rates
  const sportWinRates = {};
  Object.keys(sportBets).forEach(sport => {
    sportWinRates[sport] = sportBets[sport] > 0 ? sportWins[sport] / sportBets[sport] : 0;
  });
  
  // Calculate bet type win rates
  const betTypeWinRates = {};
  Object.keys(typeBets).forEach(type => {
    betTypeWinRates[type] = typeBets[type] > 0 ? typeWins[type] / typeBets[type] : 0;
  });
  
  // Update stats
  this.stats = {
    totalBets,
    wins,
    losses,
    pushes,
    winRate,
    totalStake,
    totalProfit,
    roi,
    sportWinRates,
    betTypeWinRates,
    streaks: {
      current: currentStreak,
      longest: {
        win: longestWinStreak,
        loss: longestLossStreak
      }
    },
    lastUpdated: new Date()
  };
};

// Pre-save hook to update stats and timestamps
UserSchema.pre('save', function(next) {
  if (this.isModified('bettingHistory')) {
    this.calculateStats();
  }
  
  this.metadata.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', UserSchema);