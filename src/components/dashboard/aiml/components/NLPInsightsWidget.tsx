import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';

import { useNLPProcessor } from '../../../../hooks/useEnhancedInsights';
import { NLPSummary, EntityType, SentimentType } from '../../../../types/enhancedInsights';
import ErrorMessage from '../../../ErrorMessage';
import LoadingIndicator from '../../../LoadingIndicator';

interface NLPInsightsWidgetProps {
  textData: string[];
  entityTypes: EntityType[];
}

export const NLPInsightsWidget: React.FC<NLPInsightsWidgetProps> = ({ textData, entityTypes }) => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | 'all'>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | 'all'>('all');

  const {
    processText,
    analyzeSentiment,
    extractEntities,
    extractKeyPhrases,
    analyzeTopics,
    isLoading,
    error,
  } = useNLPProcessor();

  const [nlpResults, setNlpResults] = useState<{ [key: string]: NLPSummary }>({});
  const [selectedResult, setSelectedResult] = useState<NLPSummary | null>(null);

  useEffect(() => {
    processAllTexts();
  }, [textData]);

  const processAllTexts = async () => {
    const results: { [key: string]: NLPSummary } = {};

    for (const text of textData.slice(0, 10)) {
      // Limit for performance
      try {
        const summary = await processText(text);
        results[text.substring(0, 50)] = summary;
      } catch (error) {
        console.warn('Failed to process text:', error);
      }
    }

    setNlpResults(results);
  };

  if (isLoading && Object.keys(nlpResults).length === 0) {
    return <LoadingIndicator />;
  }
  if (error) return <ErrorMessage message={error} />;

  const getSentimentColor = (sentiment: SentimentType): string => {
    switch (sentiment) {
      case 'positive':
        return '#2ECC71';
      case 'negative':
        return '#E74C3C';
      case 'neutral':
        return '#95A5A6';
      case 'mixed':
        return '#F39C12';
      default:
        return '#95A5A6';
    }
  };

  const getSentimentIcon = (sentiment: SentimentType): string => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      case 'neutral':
        return '😐';
      case 'mixed':
        return '🤔';
      default:
        return '❓';
    }
  };

  const getEntityTypeColor = (type: EntityType): string => {
    const colors = {
      person: '#3498DB',
      organization: '#9B59B6',
      location: '#E67E22',
      event: '#1ABC9C',
      product: '#F39C12',
      monetary: '#27AE60',
      temporal: '#E91E63',
    };
    return colors[type] || '#95A5A6';
  };

  const filteredResults = Object.entries(nlpResults).filter(([text, result]) => {
    const matchesSearch =
      searchQuery === '' ||
      text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.keyPhrases.some(phrase =>
        phrase.text.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSentiment =
      selectedSentiment === 'all' || result.sentiment.overall === selectedSentiment;

    const matchesEntity =
      selectedEntityType === 'all' ||
      result.entities.some(entity => entity.type === selectedEntityType);

    return matchesSearch && matchesSentiment && matchesEntity;
  });

  const renderNLPCard = ({ item }: { item: [string, NLPSummary] }) => {
    const [text, result] = item;

    return (
      <TouchableOpacity
        style={[styles.nlpCard, selectedResult === result && styles.selectedCard]}
        onPress={() => setSelectedResult(result)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.textPreview} numberOfLines={2}>
            {text}
          </Text>
          <View
            style={[
              styles.sentimentBadge,
              { backgroundColor: getSentimentColor(result.sentiment.overall) },
            ]}
          >
            <Text style={styles.sentimentText}>
              {getSentimentIcon(result.sentiment.overall)} {result.sentiment.overall}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Confidence:</Text>
            <Text style={styles.scoreValue}>{(result.sentiment.confidence * 100).toFixed(1)}%</Text>
          </View>

          <View style={styles.entitiesPreview}>
            <Text style={styles.entitiesLabel}>Entities:</Text>
            <View style={styles.entityTags}>
              {result.entities.slice(0, 3).map((entity, index) => (
                <View
                  key={index}
                  style={[
                    styles.entityTag,
                    { backgroundColor: getEntityTypeColor(entity.type) + '20' },
                  ]}
                >
                  <Text style={[styles.entityTagText, { color: getEntityTypeColor(entity.type) }]}>
                    {entity.text}
                  </Text>
                </View>
              ))}
              {result.entities.length > 3 && (
                <Text style={styles.moreEntities}>+{result.entities.length - 3} more</Text>
              )}
            </View>
          </View>

          <View style={styles.keyPhrasesPreview}>
            <Text style={styles.keyPhrasesLabel}>Key Phrases:</Text>
            <Text style={styles.keyPhrasesText} numberOfLines={1}>
              {result.keyPhrases
                .slice(0, 3)
                .map(phrase => phrase.text)
                .join(', ')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNLPDetails = () => {
    if (!selectedResult) {
      return (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            Select a text analysis to view detailed NLP insights
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>NLP Analysis Details</Text>
          <View
            style={[
              styles.overallSentimentBadge,
              { backgroundColor: getSentimentColor(selectedResult.sentiment.overall) },
            ]}
          >
            <Text style={styles.overallSentimentText}>
              {getSentimentIcon(selectedResult.sentiment.overall)}{' '}
              {selectedResult.sentiment.overall.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Sentiment Analysis */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
          <View style={styles.sentimentBreakdown}>
            <View style={styles.sentimentItem}>
              <Text style={styles.sentimentItemLabel}>Positive:</Text>
              <View style={styles.sentimentBar}>
                <View
                  style={[
                    styles.sentimentFill,
                    {
                      width: `${selectedResult.sentiment.scores.positive * 100}%`,
                      backgroundColor: '#2ECC71',
                    },
                  ]}
                />
              </View>
              <Text style={styles.sentimentScore}>
                {(selectedResult.sentiment.scores.positive * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.sentimentItem}>
              <Text style={styles.sentimentItemLabel}>Negative:</Text>
              <View style={styles.sentimentBar}>
                <View
                  style={[
                    styles.sentimentFill,
                    {
                      width: `${selectedResult.sentiment.scores.negative * 100}%`,
                      backgroundColor: '#E74C3C',
                    },
                  ]}
                />
              </View>
              <Text style={styles.sentimentScore}>
                {(selectedResult.sentiment.scores.negative * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.sentimentItem}>
              <Text style={styles.sentimentItemLabel}>Neutral:</Text>
              <View style={styles.sentimentBar}>
                <View
                  style={[
                    styles.sentimentFill,
                    {
                      width: `${selectedResult.sentiment.scores.neutral * 100}%`,
                      backgroundColor: '#95A5A6',
                    },
                  ]}
                />
              </View>
              <Text style={styles.sentimentScore}>
                {(selectedResult.sentiment.scores.neutral * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Named Entities */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Named Entities</Text>
          <View style={styles.entitiesGrid}>
            {selectedResult.entities.map((entity, index) => (
              <View
                key={index}
                style={[styles.entityCard, { borderLeftColor: getEntityTypeColor(entity.type) }]}
              >
                <Text style={styles.entityText}>{entity.text}</Text>
                <Text style={[styles.entityType, { color: getEntityTypeColor(entity.type) }]}>
                  {entity.type}
                </Text>
                <Text style={styles.entityConfidence}>
                  {(entity.confidence * 100).toFixed(1)}% confidence
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Phrases */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Key Phrases</Text>
          <View style={styles.keyPhrasesGrid}>
            {selectedResult.keyPhrases.map((phrase, index) => (
              <View key={index} style={styles.keyPhraseCard}>
                <Text style={styles.keyPhraseText}>{phrase.text}</Text>
                <Text style={styles.keyPhraseScore}>Score: {phrase.score.toFixed(3)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Topics */}
        {selectedResult.topics && selectedResult.topics.length > 0 && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Topics</Text>
            <View style={styles.topicsGrid}>
              {selectedResult.topics.map((topic, index) => (
                <View key={index} style={styles.topicCard}>
                  <Text style={styles.topicName}>{topic.name}</Text>
                  <Text style={styles.topicWeight}>Weight: {topic.weight.toFixed(3)}</Text>
                  <View style={styles.topicKeywords}>
                    {topic.keywords.map((keyword, kwIndex) => (
                      <Text key={kwIndex} style={styles.topicKeyword}>
                        {keyword}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Language Metrics */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Language Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedResult.language || 'en'}</Text>
              <Text style={styles.metricLabel}>Language</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedResult.entities.length}</Text>
              <Text style={styles.metricLabel}>Entities</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedResult.keyPhrases.length}</Text>
              <Text style={styles.metricLabel}>Key Phrases</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {(selectedResult.sentiment.confidence * 100).toFixed(0)}%
              </Text>
              <Text style={styles.metricLabel}>Confidence</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NLP Insights</Text>
        <Text style={styles.subtitle}>{Object.keys(nlpResults).length} texts analyzed</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search text or phrases..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, selectedSentiment === 'all' && styles.activeFilterTab]}
            onPress={() => setSelectedSentiment('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedSentiment === 'all' && styles.activeFilterTabText,
              ]}
            >
              All Sentiments
            </Text>
          </TouchableOpacity>

          {(['positive', 'negative', 'neutral', 'mixed'] as SentimentType[]).map(sentiment => (
            <TouchableOpacity
              key={sentiment}
              style={[styles.filterTab, selectedSentiment === sentiment && styles.activeFilterTab]}
              onPress={() => setSelectedSentiment(sentiment)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedSentiment === sentiment && styles.activeFilterTabText,
                ]}
              >
                {getSentimentIcon(sentiment)} {sentiment}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, selectedEntityType === 'all' && styles.activeFilterTab]}
            onPress={() => setSelectedEntityType('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedEntityType === 'all' && styles.activeFilterTabText,
              ]}
            >
              All Entities
            </Text>
          </TouchableOpacity>

          {entityTypes.map(entityType => (
            <TouchableOpacity
              key={entityType}
              style={[
                styles.filterTab,
                selectedEntityType === entityType && styles.activeFilterTab,
              ]}
              onPress={() => setSelectedEntityType(entityType)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedEntityType === entityType && styles.activeFilterTabText,
                ]}
              >
                {entityType}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {/* NLP Results List */}
        <View style={styles.listContainer}>
          <FlatList
            data={filteredResults}
            renderItem={renderNLPCard}
            keyExtractor={item => item[0]}
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
          />
        </View>

        {/* NLP Details */}
        <View style={styles.detailsPane}>{renderNLPDetails()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  filterTabs: {
    marginBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeFilterTab: {
    backgroundColor: '#6f42c1',
    borderColor: '#6f42c1',
  },
  filterTabText: {
    fontSize: 12,
    color: '#495057',
  },
  activeFilterTabText: {
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  listContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  resultsList: {
    padding: 15,
  },
  nlpCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#6f42c1',
  },
  cardHeader: {
    marginBottom: 10,
  },
  textPreview: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  sentimentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardContent: {
    gap: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  entitiesPreview: {
    gap: 4,
  },
  entitiesLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  entityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  entityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  entityTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreEntities: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  keyPhrasesPreview: {
    gap: 4,
  },
  keyPhrasesLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  keyPhrasesText: {
    fontSize: 11,
    color: '#495057',
  },
  detailsPane: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailsContainer: {
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  overallSentimentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  overallSentimentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  detailsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sentimentBreakdown: {
    gap: 8,
  },
  sentimentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sentimentItemLabel: {
    fontSize: 12,
    color: '#666',
    width: 60,
  },
  sentimentBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sentimentFill: {
    height: '100%',
    borderRadius: 4,
  },
  sentimentScore: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  entitiesGrid: {
    gap: 8,
  },
  entityCard: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  entityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  entityType: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  entityConfidence: {
    fontSize: 10,
    color: '#999',
  },
  keyPhrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keyPhraseCard: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keyPhraseText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  keyPhraseScore: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  topicsGrid: {
    gap: 10,
  },
  topicCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  topicWeight: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  topicKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  topicKeyword: {
    fontSize: 10,
    color: '#6f42c1',
    backgroundColor: '#6f42c1' + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6f42c1',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default NLPInsightsWidget;
