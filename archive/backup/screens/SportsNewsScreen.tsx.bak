import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchSportsNews, NewsItem } from '../services/sportsNewsService';
import { generateAISummary } from '../services/aiSummaryService';
import {
  analyzeSentiment,
  predictOddsImpact,
  analyzeHistoricalCorrelations,
  generatePersonalizedSummary,
  SentimentAnalysis,
  OddsImpactPrediction,
  HistoricalCorrelation,
  PersonalizedNewsSummary
} from '../services/aiNewsAnalysisService';
import { getUserSportsPreferences } from '../services/userSportsPreferencesService';
import { NeonContainer, NeonText } from '../components/ui';
import Header from '../components/Header';
import PremiumFeature from '../components/PremiumFeature';
import { useNavigation } from '@react-navigation/native';
import { trackEvent } from '../services/analyticsService';
import { hasPremiumAccess } from '../services/firebaseSubscriptionService';
import { auth } from '../config/firebase';

/**
 * SportsNewsScreen component displays AI-summarized sports news
 */
const SportsNewsScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'injury' | 'lineup' | 'trade' | 'general'>('all');
  const [focusOn, setFocusOn] = useState<'betting' | 'fantasy' | 'general'>('betting');
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const [personalizedMode, setPersonalizedMode] = useState<boolean>(false);
  const [favoriteTeamsOnly, setFavoriteTeamsOnly] = useState<boolean>(false);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [newsAnalytics, setNewsAnalytics] = useState<{
    [newsId: string]: {
      sentiment?: SentimentAnalysis;
      oddsImpact?: OddsImpactPrediction;
      historicalCorrelation?: HistoricalCorrelation;
      personalizedSummary?: PersonalizedNewsSummary;
    }
  }>({});
  
  const navigation = useNavigation();
  
  useEffect(() => {
    loadNewsData();
    checkPremiumStatus();
    loadUserPreferences();
  }, []);
  
  // Check if user has premium access
  const checkPremiumStatus = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const hasPremium = await hasPremiumAccess(userId);
        setIsPremiumUser(hasPremium);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };
  
  // Load user preferences
  const loadUserPreferences = async () => {
    try {
      const preferences = await getUserSportsPreferences();
      setFavoriteTeams(preferences.favoriteTeams);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };
  
  const loadNewsData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Reset expanded news
      setExpandedNewsId(null);
      
      // Fetch news from API
      let news = await fetchSportsNews();
      
      // Filter by favorite teams if enabled
      if (favoriteTeamsOnly && favoriteTeams.length > 0) {
        news = news.filter(item =>
          item.teams.some(team => favoriteTeams.includes(team))
        );
      }
      
      // Generate AI summaries for each news item
      const newsWithSummaries = await Promise.all(
        news.map(async (item) => {
          const summary = await generateAISummary(item.content, 150, focusOn);
          return {
            ...item,
            aiSummary: summary
          };
        })
      );
      
      setNewsItems(newsWithSummaries);
      
      // For premium users, pre-load some advanced analytics
      if (isPremiumUser && newsWithSummaries.length > 0) {
        // Only analyze the first few items to avoid too many API calls
        const itemsToAnalyze = newsWithSummaries.slice(0, 3);
        
        // Create a new analytics object
        const newAnalytics = { ...newsAnalytics };
        
        // Generate analytics for each item
        await Promise.all(
          itemsToAnalyze.map(async (item) => {
            // Initialize analytics for this item if not exists
            if (!newAnalytics[item.id]) {
              newAnalytics[item.id] = {};
            }
            
            // Generate sentiment analysis
            const sentiment = await analyzeSentiment(item);
            newAnalytics[item.id].sentiment = sentiment;
            
            // Generate odds impact prediction
            const oddsImpact = await predictOddsImpact(item);
            newAnalytics[item.id].oddsImpact = oddsImpact;
            
            // Generate historical correlation analysis
            const historicalCorrelation = await analyzeHistoricalCorrelations(item);
            newAnalytics[item.id].historicalCorrelation = historicalCorrelation;
            
            // Send notification for high-impact news
            if (oddsImpact.impactLevel === 'high' || oddsImpact.impactLevel === 'medium') {
              const { scheduleHighImpactNewsNotification } = await import('../services/notificationService');
              await scheduleHighImpactNewsNotification(
                item.title,
                oddsImpact.impactLevel,
                item.teams
              );
            }
            
            // If personalized mode is enabled, generate personalized summary
            if (personalizedMode) {
              const personalizedSummary = await generatePersonalizedSummary(item);
              newAnalytics[item.id].personalizedSummary = personalizedSummary;
            }
          })
        );
        
        // Update the analytics state
        setNewsAnalytics(newAnalytics);
      }
      
      // Track the event
      await trackEvent('sports_news_viewed', {
        item_count: newsWithSummaries.length,
        focus: focusOn,
        personalized: personalizedMode,
        favorite_teams_only: favoriteTeamsOnly
      });
    } catch (error) {
      console.error('Error loading news data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    loadNewsData(true);
  };
  
  const handleCategoryChange = (category: 'all' | 'injury' | 'lineup' | 'trade' | 'general') => {
    setSelectedCategory(category);
  };
  
  const handleFocusChange = async (focus: 'betting' | 'fantasy' | 'general') => {
    setFocusOn(focus);
    
    // Regenerate summaries with new focus
    setLoading(true);
    
    const newsWithSummaries = await Promise.all(
      newsItems.map(async (item) => {
        const summary = await generateAISummary(item.content, 150, focus);
        return {
          ...item,
          aiSummary: summary
        };
      })
    );
    
    setNewsItems(newsWithSummaries);
    setLoading(false);
    
    // Track the event
    await trackEvent('sports_news_focus_changed', {
      focus
    });
  };
  
  const filteredNews = selectedCategory === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);
  
  const renderCategoryTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabsContainer}
    >
      <TouchableOpacity
        style={[styles.categoryTab, selectedCategory === 'all' && styles.categoryTabActive]}
        onPress={() => handleCategoryChange('all')}
      >
        <Text style={[styles.categoryTabText, selectedCategory === 'all' && styles.categoryTabTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.categoryTab, selectedCategory === 'injury' && styles.categoryTabActive]}
        onPress={() => handleCategoryChange('injury')}
      >
        <Text style={[styles.categoryTabText, selectedCategory === 'injury' && styles.categoryTabTextActive]}>
          Injuries
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.categoryTab, selectedCategory === 'lineup' && styles.categoryTabActive]}
        onPress={() => handleCategoryChange('lineup')}
      >
        <Text style={[styles.categoryTabText, selectedCategory === 'lineup' && styles.categoryTabTextActive]}>
          Lineups
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.categoryTab, selectedCategory === 'trade' && styles.categoryTabActive]}
        onPress={() => handleCategoryChange('trade')}
      >
        <Text style={[styles.categoryTabText, selectedCategory === 'trade' && styles.categoryTabTextActive]}>
          Trades
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.categoryTab, selectedCategory === 'general' && styles.categoryTabActive]}
        onPress={() => handleCategoryChange('general')}
      >
        <Text style={[styles.categoryTabText, selectedCategory === 'general' && styles.categoryTabTextActive]}>
          General
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
  
  const renderFocusTabs = () => (
    <View style={styles.focusTabsContainer}>
      <TouchableOpacity
        style={[styles.focusTab, focusOn === 'betting' && styles.focusTabActive]}
        onPress={() => handleFocusChange('betting')}
      >
        <Text style={[styles.focusTabText, focusOn === 'betting' && styles.focusTabTextActive]}>
          Betting Focus
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.focusTab, focusOn === 'fantasy' && styles.focusTabActive]}
        onPress={() => handleFocusChange('fantasy')}
      >
        <Text style={[styles.focusTabText, focusOn === 'fantasy' && styles.focusTabTextActive]}>
          Fantasy Focus
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.focusTab, focusOn === 'general' && styles.focusTabActive]}
        onPress={() => handleFocusChange('general')}
      >
        <Text style={[styles.focusTabText, focusOn === 'general' && styles.focusTabTextActive]}>
          General Focus
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderNewsItem = (item: NewsItem) => {
    const analytics = newsAnalytics[item.id];
    const isExpanded = expandedNewsId === item.id;
    
    return (
      <View key={item.id} style={styles.newsCard}>
        <View style={styles.newsHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        <Text style={styles.newsTitle}>{item.title}</Text>
        
        <View style={styles.teamsContainer}>
          {item.teams.map((team) => (
            <View key={team} style={styles.teamBadge}>
              <Text style={styles.teamText}>{team}</Text>
            </View>
          ))}
        </View>
        
        <Text
          style={styles.newsContent}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {item.content}
        </Text>
        
        {/* Standard AI Summary for all users */}
        <PremiumFeature>
          <View style={styles.aiSummaryContainer}>
            <View style={styles.aiSummaryHeader}>
              <Ionicons name="flash" size={16} color="#f39c12" />
              <Text style={styles.aiSummaryTitle}>AI Sports Edge</Text>
            </View>
            <Text style={styles.aiSummaryText}>
              {item.aiSummary || 'AI summary not available'}
            </Text>
          </View>
        </PremiumFeature>
        
        {/* Advanced Analytics for Premium Users */}
        {isPremiumUser && analytics && (
          <View style={styles.advancedAnalyticsContainer}>
            {/* Sentiment Analysis */}
            {analytics.sentiment && (
              <View style={styles.analyticsSection}>
                <View style={styles.analyticsSectionHeader}>
                  <Ionicons
                    name="analytics-outline"
                    size={16}
                    color="#3498db"
                  />
                  <Text style={styles.analyticsSectionTitle}>
                    Sentiment Analysis
                  </Text>
                </View>
                <View style={styles.sentimentIndicator}>
                  <View
                    style={[
                      styles.sentimentBar,
                      {
                        backgroundColor:
                          analytics.sentiment.sentiment === 'positive' ? '#2ecc71' :
                          analytics.sentiment.sentiment === 'negative' ? '#e74c3c' :
                          '#f39c12',
                        width: `${Math.abs(analytics.sentiment.score * 100)}%`
                      }
                    ]}
                  />
                  <Text style={styles.sentimentText}>
                    {analytics.sentiment.sentiment.charAt(0).toUpperCase() +
                     analytics.sentiment.sentiment.slice(1)}
                    ({Math.round(analytics.sentiment.score * 100)}%)
                  </Text>
                </View>
              </View>
            )}
            
            {/* Odds Impact */}
            {analytics.oddsImpact && (
              <View style={styles.analyticsSection}>
                <View style={styles.analyticsSectionHeader}>
                  <Ionicons
                    name="trending-up-outline"
                    size={16}
                    color="#3498db"
                  />
                  <Text style={styles.analyticsSectionTitle}>
                    Odds Impact
                  </Text>
                </View>
                <Text style={styles.oddsImpactText}>
                  <Text style={styles.highlightText}>
                    {analytics.oddsImpact.impactLevel.toUpperCase()}
                  </Text> impact expected ({analytics.oddsImpact.predictedChange.toFixed(1)}% change)
                </Text>
                <Text style={styles.oddsImpactReasoning}>
                  {analytics.oddsImpact.reasoning}
                </Text>
              </View>
            )}
            
            {/* Historical Correlation Analysis */}
            {analytics.historicalCorrelation && (
              <View style={[styles.analyticsSection, styles.historicalSection]}>
                <View style={styles.analyticsSectionHeader}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="#16a085"
                  />
                  <Text style={[styles.analyticsSectionTitle, { color: '#16a085' }]}>
                    Historical Analysis
                  </Text>
                  <View style={[
                    styles.correlationBadge,
                    {
                      backgroundColor:
                        analytics.historicalCorrelation.correlationStrength === 'strong' ? 'rgba(46, 204, 113, 0.2)' :
                        analytics.historicalCorrelation.correlationStrength === 'moderate' ? 'rgba(243, 156, 18, 0.2)' :
                        analytics.historicalCorrelation.correlationStrength === 'weak' ? 'rgba(189, 195, 199, 0.2)' :
                        'rgba(189, 195, 199, 0.2)'
                    }
                  ]}>
                    <Text style={[
                      styles.correlationText,
                      {
                        color:
                          analytics.historicalCorrelation.correlationStrength === 'strong' ? '#27ae60' :
                          analytics.historicalCorrelation.correlationStrength === 'moderate' ? '#d35400' :
                          analytics.historicalCorrelation.correlationStrength === 'weak' ? '#7f8c8d' :
                          '#7f8c8d'
                      }
                    ]}>
                      {analytics.historicalCorrelation.correlationStrength.toUpperCase()} CORRELATION
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.predictedOutcomeText}>
                  <Text style={styles.predictedOutcomeLabel}>Predicted Outcome: </Text>
                  {analytics.historicalCorrelation.predictedOutcome}
                  <Text style={styles.confidenceText}> ({Math.round(analytics.historicalCorrelation.confidence * 100)}% confidence)</Text>
                </Text>
                
                <Text style={styles.similarEventsTitle}>Similar Historical Events:</Text>
                {analytics.historicalCorrelation.similarEvents.map((event, index) => (
                  <View key={index} style={styles.similarEventItem}>
                    <Text style={styles.similarEventDescription}>{event.description}</Text>
                    <View style={styles.similarEventDetails}>
                      <Text style={styles.similarEventDate}>{event.date}</Text>
                      <Text style={styles.similarEventOutcome}>{event.outcome}</Text>
                      <Text style={[
                        styles.similarEventImpact,
                        { color: event.oddsImpact >= 0 ? '#27ae60' : '#e74c3c' }
                      ]}>
                        {event.oddsImpact >= 0 ? '+' : ''}{event.oddsImpact.toFixed(1)}% odds change
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            {/* Personalized Summary */}
            {personalizedMode && analytics.personalizedSummary && (
              <View style={[
                styles.analyticsSection,
                styles.personalizedSection
              ]}>
                <View style={styles.analyticsSectionHeader}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color="#9b59b6"
                  />
                  <Text style={[
                    styles.analyticsSectionTitle,
                    { color: '#9b59b6' }
                  ]}>
                    Personalized Insights
                  </Text>
                  <View style={[
                    styles.relevanceBadge,
                    {
                      backgroundColor:
                        analytics.personalizedSummary.relevanceToUser === 'high' ? 'rgba(46, 204, 113, 0.2)' :
                        analytics.personalizedSummary.relevanceToUser === 'medium' ? 'rgba(243, 156, 18, 0.2)' :
                        'rgba(189, 195, 199, 0.2)'
                    }
                  ]}>
                    <Text style={[
                      styles.relevanceText,
                      {
                        color:
                          analytics.personalizedSummary.relevanceToUser === 'high' ? '#27ae60' :
                          analytics.personalizedSummary.relevanceToUser === 'medium' ? '#d35400' :
                          '#7f8c8d'
                      }
                    ]}>
                      {analytics.personalizedSummary.relevanceToUser.toUpperCase()} RELEVANCE
                    </Text>
                  </View>
                </View>
                <Text style={styles.personalizedSummaryText}>
                  {analytics.personalizedSummary.summary}
                </Text>
                <Text style={styles.bettingAdviceTitle}>Betting Advice:</Text>
                <Text style={styles.bettingAdviceText}>
                  {analytics.personalizedSummary.bettingAdvice}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.newsFooter}>
          <Text style={styles.sourceText}>Source: {item.source}</Text>
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => setExpandedNewsId(isExpanded ? null : item.id)}
          >
            <Text style={styles.readMoreText}>
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-forward"}
              size={16}
              color="#3498db"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <NeonContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading sports news...</Text>
        </View>
      </NeonContainer>
    );
  }
  
  return (
    <NeonContainer>
      <Header
        title="AI Sports News"
        onRefresh={onRefresh}
        isLoading={refreshing}
      />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
      >
        <NeonText type="heading" glow={true} style={styles.title}>
          AI Sports News
        </NeonText>
        
        {/* Premium user controls */}
        {isPremiumUser && (
          <View style={styles.premiumControlsContainer}>
            <View style={styles.premiumControlRow}>
              <Text style={styles.premiumControlLabel}>Personalized Mode</Text>
              <Switch
                value={personalizedMode}
                onValueChange={(value) => {
                  setPersonalizedMode(value);
                  loadNewsData(true);
                }}
                trackColor={{ false: '#d9d9d9', true: '#3498db' }}
                thumbColor={personalizedMode ? '#fff' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.premiumControlRow}>
              <Text style={styles.premiumControlLabel}>Favorite Teams Only</Text>
              <Switch
                value={favoriteTeamsOnly}
                onValueChange={(value) => {
                  setFavoriteTeamsOnly(value);
                  loadNewsData(true);
                }}
                trackColor={{ false: '#d9d9d9', true: '#3498db' }}
                thumbColor={favoriteTeamsOnly ? '#fff' : '#f4f3f4'}
              />
            </View>
            
            {favoriteTeams.length === 0 && favoriteTeamsOnly && (
              <Text style={styles.warningText}>
                No favorite teams set. Go to Settings to add favorite teams.
              </Text>
            )}
          </View>
        )}
        
        {renderCategoryTabs()}
        {renderFocusTabs()}
        
        {filteredNews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No news found in this category</Text>
          </View>
        ) : (
          filteredNews.map(renderNewsItem)
        )}
      </ScrollView>
    </NeonContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumControlsContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.2)',
  },
  premiumControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  premiumControlLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  warningText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 8,
    fontStyle: 'italic',
  },
  categoryTabsContainer: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  categoryTabActive: {
    backgroundColor: '#3498db',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  focusTabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  focusTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  focusTabActive: {
    borderBottomColor: '#3498db',
  },
  focusTabText: {
    fontSize: 12,
    color: '#666',
  },
  focusTabTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  teamsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  teamBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  teamText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '600',
  },
  newsContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  aiSummaryContainer: {
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f39c12',
    marginLeft: 4,
  },
  aiSummaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    color: '#3498db',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  advancedAnalyticsContainer: {
    marginBottom: 16,
  },
  analyticsSection: {
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  analyticsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 4,
  },
  sentimentIndicator: {
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
  },
  sentimentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  sentimentText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    paddingTop: 4,
  },
  oddsImpactText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  oddsImpactReasoning: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  highlightText: {
    fontWeight: '700',
    color: '#3498db',
  },
  personalizedSection: {
    borderLeftColor: '#9b59b6',
  },
  historicalSection: {
    borderLeftColor: '#16a085',
  },
  relevanceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  correlationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  relevanceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  correlationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  personalizedSummaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  predictedOutcomeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  predictedOutcomeLabel: {
    fontWeight: '600',
    color: '#16a085',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  similarEventsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a085',
    marginBottom: 8,
  },
  similarEventItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(189, 195, 199, 0.3)',
  },
  similarEventDescription: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  similarEventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  similarEventDate: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  similarEventOutcome: {
    fontSize: 12,
    color: '#333',
    flex: 2,
  },
  similarEventImpact: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  bettingAdviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9b59b6',
    marginBottom: 4,
  },
  bettingAdviceText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
});

export default SportsNewsScreen;