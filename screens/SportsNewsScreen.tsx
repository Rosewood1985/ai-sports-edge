import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchSportsNews, NewsItem } from '../services/sportsNewsService';
import { generateAISummary } from '../services/aiSummaryService';
import { NeonContainer, NeonText } from '../components/ui';
import Header from '../components/Header';
import PremiumFeature from '../components/PremiumFeature';
import { useNavigation } from '@react-navigation/native';
import { trackEvent } from '../services/analyticsService';

/**
 * SportsNewsScreen component displays AI-summarized sports news
 */
const SportsNewsScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'injury' | 'lineup' | 'trade' | 'general'>('all');
  const [focusOn, setFocusOn] = useState<'betting' | 'fantasy' | 'general'>('betting');
  
  const navigation = useNavigation();
  
  useEffect(() => {
    loadNewsData();
  }, []);
  
  const loadNewsData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const news = await fetchSportsNews();
      
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
      
      // Track the event
      await trackEvent('sports_news_viewed', {
        item_count: newsWithSummaries.length,
        focus: focusOn
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
  
  const renderNewsItem = (item: NewsItem) => (
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
        {item.teams.map((team, index) => (
          <View key={team} style={styles.teamBadge}>
            <Text style={styles.teamText}>{team}</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.newsContent} numberOfLines={3}>
        {item.content}
      </Text>
      
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
      
      <View style={styles.newsFooter}>
        <Text style={styles.sourceText}>Source: {item.source}</Text>
        <TouchableOpacity style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read More</Text>
          <Ionicons name="chevron-forward" size={16} color="#3498db" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
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
});

export default SportsNewsScreen;