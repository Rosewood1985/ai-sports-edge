import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Animated } from 'react-native';
import { useInsightStream } from '../../../../hooks/useEnhancedInsights';
import { EnhancedInsight, InsightType, InsightSeverity } from '../../../../types/enhancedInsights';
import LoadingIndicator from '../../../LoadingIndicator';
import ErrorMessage from '../../../ErrorMessage';

interface RealTimeInsightsWidgetProps {
  filters: {
    types: InsightType[];
    severity: InsightSeverity[];
    confidence: number;
  };
}

export const RealTimeInsightsWidget: React.FC<RealTimeInsightsWidgetProps> = ({
  filters
}) => {
  const [isStreamActive, setIsStreamActive] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<EnhancedInsight | null>(null);
  const [displayMode, setDisplayMode] = useState<'list' | 'feed' | 'graph'>('feed');
  const [maxInsights, setMaxInsights] = useState(50);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    insights,
    isStreaming,
    connectionStatus,
    error,
    startStream,
    stopStream,
    clearInsights
  } = useInsightStream({
    types: filters.types,
    severity: filters.severity,
    minConfidence: filters.confidence,
    maxSize: maxInsights
  });

  useEffect(() => {
    if (isStreamActive) {
      startStream();
    } else {
      stopStream();
    }
    
    return () => stopStream();
  }, [isStreamActive, filters]);

  useEffect(() => {
    // Animate new insights
    if (insights.length > 0) {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Auto-scroll to latest insight in feed mode
      if (displayMode === 'feed' && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [insights.length]);

  if (error) return <ErrorMessage message={error} />;

  const getInsightIcon = (type: InsightType): string => {
    const icons = {
      performance: '📊',
      user_behavior: '👤',
      anomaly: '⚠️',
      prediction: '🔮',
      trend: '📈',
      correlation: '🔗',
      recommendation: '💡'
    };
    return icons[type] || '📋';
  };

  const getSeverityColor = (severity: InsightSeverity): string => {
    switch (severity) {
      case 'critical': return '#E74C3C';
      case 'high': return '#E67E22';
      case 'medium': return '#F39C12';
      case 'low': return '#27AE60';
      case 'info': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  const getConnectionStatusColor = (): string => {
    switch (connectionStatus) {
      case 'connected': return '#2ECC71';
      case 'connecting': return '#F39C12';
      case 'disconnected': return '#E74C3C';
      case 'error': return '#8E44AD';
      default: return '#95A5A6';
    }
  };

  const getTimeSinceInsight = (timestamp: string): string => {
    const now = new Date();
    const insightTime = new Date(timestamp);
    const diffMs = now.getTime() - insightTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return insightTime.toLocaleDateString();
  };

  const renderInsightFeedItem = (insight: EnhancedInsight, index: number) => {
    const isNew = index === insights.length - 1;
    
    return (
      <Animated.View
        key={insight.id}
        style={[
          styles.feedItem,
          isNew && {
            transform: [{
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05]
              })
            }],
            opacity: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.8]
            })
          }
        ]}
      >
        <View style={styles.feedItemHeader}>
          <View style={styles.feedItemMeta}>
            <Text style={styles.feedItemIcon}>
              {getInsightIcon(insight.type)}
            </Text>
            <View style={[
              styles.severityDot,
              { backgroundColor: getSeverityColor(insight.severity) }
            ]} />
            <Text style={styles.feedItemTime}>
              {getTimeSinceInsight(insight.timestamp)}
            </Text>
          </View>
          <Text style={styles.feedItemConfidence}>
            {(insight.confidence * 100).toFixed(0)}%
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => setSelectedInsight(insight)}
          style={styles.feedItemContent}
        >
          <Text style={styles.feedItemTitle}>{insight.title}</Text>
          <Text style={styles.feedItemDescription} numberOfLines={2}>
            {insight.description}
          </Text>
          
          {insight.nlpAnalysis && (
            <View style={styles.nlpTags}>
              {insight.nlpAnalysis.keyPhrases.slice(0, 3).map((phrase, idx) => (
                <View key={idx} style={styles.nlpTag}>
                  <Text style={styles.nlpTagText}>{phrase.text}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderInsightListItem = ({ item: insight }: { item: EnhancedInsight }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        selectedInsight?.id === insight.id && styles.selectedListItem
      ]}
      onPress={() => setSelectedInsight(insight)}
    >
      <View style={styles.listItemHeader}>
        <View style={styles.listItemMeta}>
          <Text style={styles.listItemIcon}>
            {getInsightIcon(insight.type)}
          </Text>
          <Text style={styles.listItemType}>{insight.type}</Text>
          <View style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(insight.severity) }
          ]}>
            <Text style={styles.severityText}>{insight.severity}</Text>
          </View>
        </View>
        <Text style={styles.listItemTime}>
          {getTimeSinceInsight(insight.timestamp)}
        </Text>
      </View>
      
      <Text style={styles.listItemTitle}>{insight.title}</Text>
      <Text style={styles.listItemDescription} numberOfLines={1}>
        {insight.description}
      </Text>
      
      <View style={styles.listItemFooter}>
        <Text style={styles.listItemConfidence}>
          Confidence: {(insight.confidence * 100).toFixed(1)}%
        </Text>
        {insight.source && (
          <Text style={styles.listItemSource}>
            Source: {insight.source}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderInsightDetails = () => {
    if (!selectedInsight) {
      return (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            Select an insight to view details
          </Text>
          <Text style={styles.streamStatus}>
            {isStreaming ? 'Streaming live insights...' : 'Stream paused'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>{selectedInsight.title}</Text>
          <View style={[
            styles.detailsSeverityBadge,
            { backgroundColor: getSeverityColor(selectedInsight.severity) }
          ]}>
            <Text style={styles.detailsSeverityText}>
              {selectedInsight.severity.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsMetadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Type:</Text>
            <Text style={styles.metadataValue}>
              {getInsightIcon(selectedInsight.type)} {selectedInsight.type}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Confidence:</Text>
            <Text style={styles.metadataValue}>
              {(selectedInsight.confidence * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Generated:</Text>
            <Text style={styles.metadataValue}>
              {new Date(selectedInsight.timestamp).toLocaleString()}
            </Text>
          </View>
          {selectedInsight.source && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Source:</Text>
              <Text style={styles.metadataValue}>{selectedInsight.source}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionContent}>{selectedInsight.description}</Text>
        </View>

        {selectedInsight.nlpAnalysis && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>NLP Analysis</Text>
            <View style={styles.nlpAnalysisContainer}>
              <View style={styles.sentimentContainer}>
                <Text style={styles.sentimentLabel}>
                  Sentiment: {selectedInsight.nlpAnalysis.sentiment.overall}
                </Text>
                <Text style={styles.sentimentScore}>
                  ({(selectedInsight.nlpAnalysis.sentiment.confidence * 100).toFixed(1)}% confidence)
                </Text>
              </View>
              
              {selectedInsight.nlpAnalysis.keyPhrases.length > 0 && (
                <View style={styles.keyPhrasesContainer}>
                  <Text style={styles.keyPhrasesLabel}>Key Phrases:</Text>
                  <View style={styles.keyPhrasesList}>
                    {selectedInsight.nlpAnalysis.keyPhrases.map((phrase, index) => (
                      <View key={index} style={styles.keyPhraseTag}>
                        <Text style={styles.keyPhraseText}>{phrase.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {selectedInsight.nlpAnalysis.entities.length > 0 && (
                <View style={styles.entitiesContainer}>
                  <Text style={styles.entitiesLabel}>Entities:</Text>
                  <View style={styles.entitiesList}>
                    {selectedInsight.nlpAnalysis.entities.map((entity, index) => (
                      <View key={index} style={styles.entityTag}>
                        <Text style={styles.entityText}>{entity.text}</Text>
                        <Text style={styles.entityType}>({entity.type})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {selectedInsight.impact && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Impact Assessment</Text>
            <View style={styles.impactContainer}>
              <View style={styles.impactItem}>
                <Text style={styles.impactLabel}>Business Impact:</Text>
                <Text style={styles.impactValue}>{selectedInsight.impact.business}</Text>
              </View>
              <View style={styles.impactItem}>
                <Text style={styles.impactLabel}>Technical Impact:</Text>
                <Text style={styles.impactValue}>{selectedInsight.impact.technical}</Text>
              </View>
              <View style={styles.impactItem}>
                <Text style={styles.impactLabel}>User Impact:</Text>
                <Text style={styles.impactValue}>{selectedInsight.impact.user}</Text>
              </View>
              <View style={styles.impactItem}>
                <Text style={styles.impactLabel}>Priority Score:</Text>
                <Text style={styles.impactValue}>{selectedInsight.impact.priority}/10</Text>
              </View>
            </View>
          </View>
        )}

        {selectedInsight.recommendations && selectedInsight.recommendations.length > 0 && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {selectedInsight.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationDescription}>{rec.description}</Text>
                <Text style={styles.recommendationImpact}>
                  Expected Impact: {rec.expectedImpact}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Real-Time Insights</Text>
          <View style={[
            styles.connectionIndicator,
            { backgroundColor: getConnectionStatusColor() }
          ]}>
            <Text style={styles.connectionText}>{connectionStatus}</Text>
          </View>
        </View>
        
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[
              styles.streamToggle,
              { backgroundColor: isStreamActive ? '#E74C3C' : '#2ECC71' }
            ]}
            onPress={() => setIsStreamActive(!isStreamActive)}
          >
            <Text style={styles.streamToggleText}>
              {isStreamActive ? 'Pause' : 'Start'} Stream
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearInsights}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Display Mode Selector */}
      <View style={styles.modeSelector}>
        {['feed', 'list', 'graph'].map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              displayMode === mode && styles.activeModeButton
            ]}
            onPress={() => setDisplayMode(mode as any)}
          >
            <Text style={[
              styles.modeButtonText,
              displayMode === mode && styles.activeModeButtonText
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        
        <Text style={styles.insightCount}>
          {insights.length} insights
        </Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Insights Display */}
        <View style={styles.insightsContainer}>
          {displayMode === 'feed' && (
            <ScrollView
              ref={scrollViewRef}
              style={styles.feedContainer}
              showsVerticalScrollIndicator={false}
            >
              {insights.map((insight, index) => renderInsightFeedItem(insight, index))}
              {insights.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {isStreaming ? 'Waiting for insights...' : 'No insights available'}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
          
          {displayMode === 'list' && (
            <FlatList
              data={insights}
              renderItem={renderInsightListItem}
              keyExtractor={(item) => item.id}
              style={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
          
          {displayMode === 'graph' && (
            <View style={styles.graphContainer}>
              <Text style={styles.graphPlaceholder}>
                📊 Graph visualization coming soon...
              </Text>
            </View>
          )}
        </View>

        {/* Insight Details */}
        <View style={styles.detailsPane}>
          {renderInsightDetails()}
        </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 10,
  },
  streamToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streamToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#6c757d',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeModeButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#495057',
  },
  activeModeButtonText: {
    color: '#ffffff',
  },
  insightCount: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  insightsContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  feedContainer: {
    padding: 15,
  },
  feedItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  feedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedItemIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  feedItemTime: {
    fontSize: 11,
    color: '#999',
  },
  feedItemConfidence: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  feedItemContent: {
    gap: 4,
  },
  feedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  feedItemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  nlpTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  nlpTag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nlpTagText: {
    fontSize: 10,
    color: '#495057',
  },
  listContainer: {
    padding: 15,
  },
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedListItem: {
    borderColor: '#007bff',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  listItemType: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  listItemTime: {
    fontSize: 11,
    color: '#999',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listItemConfidence: {
    fontSize: 12,
    color: '#666',
  },
  listItemSource: {
    fontSize: 12,
    color: '#999',
  },
  graphContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  graphPlaceholder: {
    fontSize: 18,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 15,
  },
  detailsSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsSeverityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  detailsMetadata: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
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
  sectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  nlpAnalysisContainer: {
    gap: 15,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentimentLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  sentimentScore: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  keyPhrasesContainer: {
    gap: 8,
  },
  keyPhrasesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  keyPhrasesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  keyPhraseTag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keyPhraseText: {
    fontSize: 12,
    color: '#495057',
  },
  entitiesContainer: {
    gap: 8,
  },
  entitiesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  entitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  entityTag: {
    backgroundColor: '#d1ecf1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entityText: {
    fontSize: 12,
    color: '#0c5460',
    fontWeight: '600',
  },
  entityType: {
    fontSize: 10,
    color: '#6c757d',
    marginLeft: 4,
  },
  impactContainer: {
    gap: 10,
  },
  impactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  impactLabel: {
    fontSize: 14,
    color: '#666',
  },
  impactValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  recommendationItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  recommendationDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  recommendationImpact: {
    fontSize: 12,
    color: '#007bff',
    fontStyle: 'italic',
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
    marginBottom: 10,
  },
  streamStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RealTimeInsightsWidget;