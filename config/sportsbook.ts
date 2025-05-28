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
    monthlyPrice: 19.99,
    annualPrice: 167.92, // 30% off from $239.88
    features: {
      manualEntry: true,
      screenshotUpload: false,
      monthlyUploads: 0,
      analytics: ['basic_stats', 'monthly_trends', 'sport_filters'],
    },
  },
  analyst: {
    name: 'Analyst', 
    monthlyPrice: 74.99,
    annualPrice: 629.92, // 30% off from $899.88
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
    monthlyPrice: 189.99,
    annualPrice: 1595.92, // 30% off from $2,279.88
    splitPayment: {
      // Split payment options for 1-3 users
      solo: {
        monthly: 189.99,
        annual: 1595.92,
      },
      duo: {
        monthly: 95.00, // $189.99 ÷ 2
        annual: 797.96, // $1595.92 ÷ 2
      },
      trio: {
        monthly: 63.33, // $189.99 ÷ 3 (rounded)
        annual: 531.97, // $1595.92 ÷ 3 (rounded)
      },
    },
    groupActivation: {
      signupWindow: 48, // hours
      minMembers: 1,
      maxMembers: 3,
    },
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
        'aggregate_performance',
        'group_leaderboard',
        'collaborative_tools',
      ],
    },
  },
};

// Legacy price field for backward compatibility
export const LEGACY_TIER_CONFIG = {
  insight: { ...TIER_CONFIG.insight, price: TIER_CONFIG.insight.monthlyPrice },
  analyst: { ...TIER_CONFIG.analyst, price: TIER_CONFIG.analyst.monthlyPrice },
  edge_collective: { ...TIER_CONFIG.edge_collective, price: TIER_CONFIG.edge_collective.monthlyPrice },
};
