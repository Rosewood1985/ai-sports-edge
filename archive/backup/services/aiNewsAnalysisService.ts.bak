import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '../config/firebase';
import { NewsItem } from './sportsNewsService';
import { getUserBettingHistorySummary } from './userSportsPreferencesService';
import { trackEvent } from './analyticsService';

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  keywords: {
    word: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }[];
}

/**
 * Odds impact prediction
 */
export interface OddsImpactPrediction {
  impactLevel: 'high' | 'medium' | 'low' | 'none';
  predictedChange: number; // Percentage change in odds
  confidence: number; // 0 to 1
  affectedMarkets: string[]; // e.g., 'moneyline', 'spread', 'over-under'
  reasoning: string;
}

/**
 * Historical correlation analysis
 */
export interface HistoricalCorrelation {
  correlationStrength: 'strong' | 'moderate' | 'weak' | 'none';
  similarEvents: {
    description: string;
    date: string;
    outcome: string;
    oddsImpact: number;
  }[];
  predictedOutcome: string;
  confidence: number; // 0 to 1
}

/**
 * Personalized news summary
 */
export interface PersonalizedNewsSummary {
  summary: string;
  relevanceToUser: 'high' | 'medium' | 'low';
  bettingAdvice: string;
  recommendedActions: string[];
}

/**
 * Analyze sentiment of a news article
 * @param newsItem News item to analyze
 * @returns Sentiment analysis result
 */
export const analyzeSentiment = async (newsItem: NewsItem): Promise<SentimentAnalysis> => {
  try {
    // In a production environment, this would call a Firebase function
    // For now, we'll return mock data
    
    // Track the event
    await trackEvent('ai_sentiment_analysis_generated', {
      news_id: newsItem.id,
      category: newsItem.category
    });
    
    // Generate mock sentiment analysis based on the content
    return generateMockSentimentAnalysis(newsItem);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return generateMockSentimentAnalysis(newsItem);
  }
};

/**
 * Predict odds impact of a news article
 * @param newsItem News item to analyze
 * @returns Odds impact prediction
 */
export const predictOddsImpact = async (newsItem: NewsItem): Promise<OddsImpactPrediction> => {
  try {
    // In a production environment, this would call a Firebase function
    // For now, we'll return mock data
    
    // Track the event
    await trackEvent('ai_odds_impact_predicted', {
      news_id: newsItem.id,
      category: newsItem.category
    });
    
    // Generate mock odds impact prediction based on the content
    return generateMockOddsImpactPrediction(newsItem);
  } catch (error) {
    console.error('Error predicting odds impact:', error);
    return generateMockOddsImpactPrediction(newsItem);
  }
};

/**
 * Analyze historical correlations for a news article
 * @param newsItem News item to analyze
 * @returns Historical correlation analysis
 */
export const analyzeHistoricalCorrelations = async (newsItem: NewsItem): Promise<HistoricalCorrelation> => {
  try {
    // In a production environment, this would call a Firebase function
    // For now, we'll return mock data
    
    // Track the event
    await trackEvent('ai_historical_correlation_analyzed', {
      news_id: newsItem.id,
      category: newsItem.category
    });
    
    // Generate mock historical correlation analysis based on the content
    return generateMockHistoricalCorrelation(newsItem);
  } catch (error) {
    console.error('Error analyzing historical correlations:', error);
    return generateMockHistoricalCorrelation(newsItem);
  }
};

/**
 * Generate a personalized news summary based on user's betting history
 * @param newsItem News item to summarize
 * @returns Personalized news summary
 */
export const generatePersonalizedSummary = async (newsItem: NewsItem): Promise<PersonalizedNewsSummary> => {
  try {
    // Get user's betting history summary
    const bettingHistory = await getUserBettingHistorySummary();
    
    // In a production environment, this would call a Firebase function
    // For now, we'll return mock data
    
    // Track the event
    await trackEvent('ai_personalized_summary_generated', {
      news_id: newsItem.id,
      category: newsItem.category
    });
    
    // Generate mock personalized summary based on the content and betting history
    return generateMockPersonalizedSummary(newsItem, bettingHistory);
  } catch (error) {
    console.error('Error generating personalized summary:', error);
    return generateMockPersonalizedSummary(newsItem, {
      favoredBetTypes: [],
      favoredTeams: [],
      averageBetAmount: 0,
      winRate: 0
    });
  }
};

/**
 * Generate mock sentiment analysis
 * @param newsItem News item
 * @returns Mock sentiment analysis
 */
const generateMockSentimentAnalysis = (newsItem: NewsItem): SentimentAnalysis => {
  const content = newsItem.content.toLowerCase();
  
  // Simple keyword-based sentiment analysis
  const positiveWords = ['win', 'victory', 'success', 'improve', 'strong', 'positive', 'healthy', 'return'];
  const negativeWords = ['injury', 'loss', 'defeat', 'fail', 'struggle', 'negative', 'weak', 'out'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  const keywords: {word: string; sentiment: 'positive' | 'negative' | 'neutral'; score: number}[] = [];
  
  // Count positive and negative words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      positiveCount += matches.length;
      keywords.push({
        word,
        sentiment: 'positive',
        score: 0.7 + Math.random() * 0.3 // Random score between 0.7 and 1.0
      });
    }
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      negativeCount += matches.length;
      keywords.push({
        word,
        sentiment: 'negative',
        score: -(0.7 + Math.random() * 0.3) // Random score between -0.7 and -1.0
      });
    }
  });
  
  // Calculate overall sentiment
  let sentiment: 'positive' | 'negative' | 'neutral';
  let score: number;
  
  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    score = Math.min(0.9, 0.5 + (positiveCount - negativeCount) * 0.1);
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    score = Math.max(-0.9, -0.5 - (negativeCount - positiveCount) * 0.1);
  } else {
    sentiment = 'neutral';
    score = 0;
  }
  
  // Add some neutral keywords if we don't have enough
  if (keywords.length < 3) {
    const neutralWords = ['game', 'team', 'player', 'season', 'league'];
    for (let i = 0; i < 3 - keywords.length; i++) {
      keywords.push({
        word: neutralWords[i],
        sentiment: 'neutral',
        score: 0
      });
    }
  }
  
  return {
    sentiment,
    score,
    confidence: 0.7 + Math.random() * 0.3, // Random confidence between 0.7 and 1.0
    keywords: keywords.slice(0, 5) // Limit to 5 keywords
  };
};

/**
 * Generate mock odds impact prediction
 * @param newsItem News item
 * @returns Mock odds impact prediction
 */
const generateMockOddsImpactPrediction = (newsItem: NewsItem): OddsImpactPrediction => {
  const content = newsItem.content.toLowerCase();
  const title = newsItem.title.toLowerCase();
  const category = newsItem.category;
  
  // Determine impact level based on category and content
  let impactLevel: 'high' | 'medium' | 'low' | 'none';
  let predictedChange: number;
  let confidence: number;
  let affectedMarkets: string[] = [];
  let reasoning: string;
  
  // High impact for injuries to star players
  if (category === 'injury' && 
      (content.includes('star') || content.includes('key player') || content.includes('starter'))) {
    impactLevel = 'high';
    predictedChange = 5 + Math.random() * 10; // 5-15% change
    confidence = 0.8 + Math.random() * 0.2; // 0.8-1.0 confidence
    affectedMarkets = ['moneyline', 'spread', 'over-under'];
    reasoning = 'Injury to a key player typically has significant impact on all betting markets.';
  } 
  // Medium impact for lineup changes
  else if (category === 'lineup') {
    impactLevel = 'medium';
    predictedChange = 2 + Math.random() * 5; // 2-7% change
    confidence = 0.6 + Math.random() * 0.3; // 0.6-0.9 confidence
    affectedMarkets = ['spread', 'over-under'];
    reasoning = 'Lineup changes can affect team performance and point totals.';
  }
  // Medium to high impact for trades
  else if (category === 'trade') {
    impactLevel = content.includes('star') ? 'high' : 'medium';
    predictedChange = 3 + Math.random() * 8; // 3-11% change
    confidence = 0.7 + Math.random() * 0.2; // 0.7-0.9 confidence
    affectedMarkets = ['moneyline', 'futures'];
    reasoning = 'Trade impacts team composition and future performance expectations.';
  }
  // Low impact for general news
  else {
    impactLevel = 'low';
    predictedChange = Math.random() * 3; // 0-3% change
    confidence = 0.5 + Math.random() * 0.3; // 0.5-0.8 confidence
    affectedMarkets = ['futures'];
    reasoning = 'General news typically has minimal immediate impact on betting odds.';
  }
  
  return {
    impactLevel,
    predictedChange,
    confidence,
    affectedMarkets,
    reasoning
  };
};

/**
 * Generate mock historical correlation
 * @param newsItem News item
 * @returns Mock historical correlation
 */
const generateMockHistoricalCorrelation = (newsItem: NewsItem): HistoricalCorrelation => {
  const category = newsItem.category;
  const teams = newsItem.teams;
  
  // Generate mock similar events based on category
  const similarEvents = [];
  
  if (category === 'injury') {
    similarEvents.push({
      description: `Similar injury to ${teams[0]} player in 2023`,
      date: '2023-11-15',
      outcome: 'Team lost next 3 games',
      oddsImpact: -8.5
    });
    similarEvents.push({
      description: `Star player injury in same position for ${teams[0]}`,
      date: '2022-03-22',
      outcome: 'Team underperformed by 15% for remainder of season',
      oddsImpact: -12.3
    });
  } else if (category === 'lineup') {
    similarEvents.push({
      description: `Similar lineup change for ${teams[0]} last season`,
      date: '2024-01-08',
      outcome: 'Team performance improved by 5%',
      oddsImpact: 3.2
    });
    similarEvents.push({
      description: `Comparable rotation adjustment by ${teams[0]} coach`,
      date: '2023-12-12',
      outcome: 'No significant impact on team performance',
      oddsImpact: 0.5
    });
  } else if (category === 'trade') {
    similarEvents.push({
      description: `Similar trade by ${teams[0]} in previous season`,
      date: '2023-02-09',
      outcome: 'Team improved win percentage by 10%',
      oddsImpact: 7.8
    });
    similarEvents.push({
      description: `Comparable player movement between rival teams`,
      date: '2022-07-15',
      outcome: 'Both teams saw performance changes',
      oddsImpact: 5.4
    });
  } else {
    similarEvents.push({
      description: 'Similar announcement last season',
      date: '2023-09-30',
      outcome: 'Minimal impact on team performance',
      oddsImpact: 1.2
    });
    similarEvents.push({
      description: 'Comparable news item from previous year',
      date: '2022-10-05',
      outcome: 'No measurable impact on outcomes',
      oddsImpact: 0.3
    });
  }
  
  // Determine correlation strength based on category
  let correlationStrength: 'strong' | 'moderate' | 'weak' | 'none';
  let predictedOutcome: string;
  let confidence: number;
  
  if (category === 'injury') {
    correlationStrength = 'strong';
    predictedOutcome = `${teams[0]} likely to underperform in next 2-3 games`;
    confidence = 0.75 + Math.random() * 0.2;
  } else if (category === 'trade') {
    correlationStrength = 'moderate';
    predictedOutcome = `${teams[0]} performance expected to change by 5-10%`;
    confidence = 0.6 + Math.random() * 0.2;
  } else if (category === 'lineup') {
    correlationStrength = 'moderate';
    predictedOutcome = 'Short-term adjustment period expected';
    confidence = 0.5 + Math.random() * 0.3;
  } else {
    correlationStrength = 'weak';
    predictedOutcome = 'Minimal impact expected based on historical patterns';
    confidence = 0.4 + Math.random() * 0.3;
  }
  
  return {
    correlationStrength,
    similarEvents,
    predictedOutcome,
    confidence
  };
};

/**
 * Generate mock personalized summary
 * @param newsItem News item
 * @param bettingHistory User's betting history summary
 * @returns Mock personalized summary
 */
const generateMockPersonalizedSummary = (
  newsItem: NewsItem, 
  bettingHistory: {
    favoredBetTypes: string[];
    favoredTeams: string[];
    averageBetAmount: number;
    winRate: number;
  }
): PersonalizedNewsSummary => {
  const { favoredTeams, favoredBetTypes } = bettingHistory;
  const newsTeams = newsItem.teams;
  const category = newsItem.category;
  
  // Determine relevance based on user's favorite teams
  let relevance: 'high' | 'medium' | 'low' = 'low';
  let summary = '';
  let bettingAdvice = '';
  let recommendedActions: string[] = [];
  
  // Check if the news involves any of the user's favorite teams
  const relevantTeams = newsTeams.filter(team => favoredTeams.includes(team));
  
  if (relevantTeams.length > 0) {
    relevance = 'high';
    summary = `This news directly impacts ${relevantTeams.join(', ')}, which you follow closely. `;
    
    if (category === 'injury') {
      summary += `The injury situation could significantly affect upcoming games.`;
      bettingAdvice = `Consider adjusting your betting strategy for upcoming ${relevantTeams[0]} games.`;
      recommendedActions = [
        `Wait for line movements before betting on ${relevantTeams[0]}`,
        'Monitor injury reports for updates',
        `Consider "under" bets if the injury affects scoring`
      ];
    } else if (category === 'lineup') {
      summary += `The lineup changes may alter team dynamics and performance.`;
      bettingAdvice = `Watch for how these changes affect team chemistry in the next game.`;
      recommendedActions = [
        'Wait one game to see the impact of lineup changes',
        `Consider live betting on ${relevantTeams[0]} after assessing performance`,
        'Look for player prop opportunities with new starters'
      ];
    } else if (category === 'trade') {
      summary += `This trade could have long-term implications for team performance.`;
      bettingAdvice = `Reassess your season-long bets involving ${relevantTeams[0]}.`;
      recommendedActions = [
        `Consider futures bets on ${relevantTeams[0]} if the trade strengthens the team`,
        'Look for value in upcoming game lines before the market adjusts',
        'Monitor player props for traded players in their new environment'
      ];
    } else {
      summary += `Stay informed about this development for your future betting decisions.`;
      bettingAdvice = `No immediate betting action recommended based on this news.`;
      recommendedActions = [
        'Continue monitoring the situation',
        'No immediate betting action needed'
      ];
    }
  } else {
    // News doesn't involve favorite teams, but might still be relevant
    if (category === 'injury' && newsItem.content.includes('star player')) {
      relevance = 'medium';
      summary = `While this doesn't involve your favorite teams, star player injuries can create betting opportunities.`;
      bettingAdvice = `Look for value bets against ${newsTeams[0]} in upcoming games.`;
      recommendedActions = [
        `Consider betting against ${newsTeams[0]} in their next game`,
        'Look for adjusted over/under lines that may not fully account for the injury'
      ];
    } else if (category === 'trade' && newsItem.content.includes('major')) {
      relevance = 'medium';
      summary = `This major trade could affect league dynamics and future matchups.`;
      bettingAdvice = `Consider how this might impact any futures bets you have.`;
      recommendedActions = [
        'Reassess any futures bets that might be affected',
        'Look for value in upcoming games involving these teams'
      ];
    } else {
      relevance = 'low';
      summary = `This news has limited relevance to your betting preferences.`;
      bettingAdvice = `No specific betting action recommended based on your history.`;
      recommendedActions = ['No action needed'];
    }
  }
  
  // Add betting type specific advice if applicable
  if (favoredBetTypes.includes('spread') && category === 'injury') {
    bettingAdvice += ` For spread bets, expect line movements of 2-4 points.`;
    recommendedActions.push('Wait for spread adjustments before betting');
  } else if (favoredBetTypes.includes('over-under') && category === 'lineup') {
    bettingAdvice += ` For over/under bets, watch for total adjustments based on new offensive/defensive balance.`;
    recommendedActions.push("Compare new lineup's pace metrics to team averages");
  }
  
  return {
    summary,
    relevanceToUser: relevance,
    bettingAdvice,
    recommendedActions
  };
};

export default {
  analyzeSentiment,
  predictOddsImpact,
  analyzeHistoricalCorrelations,
  generatePersonalizedSummary
};