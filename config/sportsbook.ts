export const SPORTSBOOK_CONFIG = {
  draftkings: {
    name: 'DraftKings',
    fieldLabels: {
      stake: 'Wager Amount',
      payout: 'To Win',
      odds: 'Odds',
    },
    identifiers: ['draftkings', 'draftking', 'dk sportsbook'],
    patterns: {
      betAmount: /(?:wager|bet)\s*(?:amount)?\s*\$?(\d+(?:\.\d{2})?)/i,
      toWin: /(?:to\s*win|payout)\s*\$?(\d+(?:\.\d{2})?)/i,
      odds: /([+-]?\d{3,4})/g,
      teams: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+vs?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    },
  },
  fanduel: {
    name: 'FanDuel',
    fieldLabels: {
      stake: 'Bet Amount',
      payout: 'Potential Payout',
      odds: 'Odds',
    },
    identifiers: ['fanduel', 'fan duel', 'fd sportsbook'],
    patterns: {
      betAmount: /(?:bet|stake)\s*(?:amount)?\s*\$?(\d+(?:\.\d{2})?)/i,
      potentialPayout: /(?:potential\s*payout|to\s*win)\s*\$?(\d+(?:\.\d{2})?)/i,
      odds: /([+-]?\d{3,4})/g,
      teams: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+@\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    },
  },
  betmgm: {
    name: 'BetMGM',
    fieldLabels: {
      stake: 'Risk',
      payout: 'To Win',
      odds: 'Odds',
    },
    identifiers: ['betmgm', 'bet mgm', 'mgm'],
    patterns: {
      riskAmount: /(?:risk|stake)\s*\$?(\d+(?:\.\d{2})?)/i,
      toWin: /(?:to\s*win|return)\s*\$?(\d+(?:\.\d{2})?)/i,
      odds: /([+-]?\d{3,4})/g,
    },
  },
  caesars: {
    name: 'Caesars',
    fieldLabels: {
      stake: 'Risk',
      payout: 'To Win',
      odds: 'Odds',
    },
    identifiers: ['caesars', 'caesar', 'cz'],
    patterns: {
      riskAmount: /(?:risk|bet)\s*\$?(\d+(?:\.\d{2})?)/i,
      toWin: /(?:to\s*win|payout)\s*\$?(\d+(?:\.\d{2})?)/i,
      odds: /([+-]?\d{3,4})/g,
    },
  },
  generic: {
    name: 'Other Sportsbook',
    fieldLabels: {
      stake: 'Bet Amount',
      payout: 'Potential Payout',
      odds: 'Odds',
    },
    identifiers: [],
    patterns: {
      betAmount: /(?:bet|wager|stake|risk)\s*(?:amount)?\s*\$?(\d+(?:\.\d{2})?)/i,
      payout: /(?:payout|to\s*win|return|potential)\s*\$?(\d+(?:\.\d{2})?)/i,
      odds: /([+-]?\d{3,4})/g,
    },
  },
};

export const TIER_CONFIG = {
  insight: {
    name: 'Insight',
    price: 29.99,
    features: {
      manualEntry: true,
      screenshotUpload: false,
      monthlyUploads: 0,
      analytics: ['basic_stats', 'monthly_trends', 'sport_filters'],
    },
  },
  analyst: {
    name: 'Analyst',
    price: 79.99,
    features: {
      manualEntry: true,
      screenshotUpload: true,
      monthlyUploads: 60,
      analytics: [
        'basic_stats',
        'monthly_trends',
        'sport_filters',
        'roi_by_bet_type',
        'ai_commentary',
        'model_comparison',
        'confidence_alignment',
        'interactive_dashboards',
        'csv_export',
      ],
    },
  },
  edge_collective: {
    name: 'Edge Collective',
    price: 199.99,
    features: {
      manualEntry: true,
      screenshotUpload: true,
      monthlyUploads: 60,
      analytics: [
        'basic_stats',
        'monthly_trends',
        'sport_filters',
        'roi_by_bet_type',
        'ai_commentary',
        'model_comparison',
        'confidence_alignment',
        'interactive_dashboards',
        'csv_export',
        'group_analytics',
        'shared_insights',
      ],
    },
  },
};
