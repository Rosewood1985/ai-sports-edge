import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { usePatternDetection } from '../../../../hooks/useEnhancedInsights';
import { PatternInsight, PatternType } from '../../../../types/enhancedInsights';
import LoadingIndicator from '../../../LoadingIndicator';
import ErrorMessage from '../../../ErrorMessage';

interface PatternDetectionWidgetProps {
  dateRange: [Date, Date];
  patternTypes: PatternType[];
}

export const PatternDetectionWidget: React.FC<PatternDetectionWidgetProps> = ({
  dateRange,
  patternTypes
}) => {
  const [selectedPatternType, setSelectedPatternType] = useState<PatternType | 'all'>('all');
  const [selectedPattern, setSelectedPattern] = useState<PatternInsight | null>(null);
  
  const { patterns, isLoading, error, detectPatterns } = usePatternDetection({
    startDate: dateRange[0],
    endDate: dateRange[1],
    types: patternTypes
  });

  useEffect(() => {
    detectPatterns();
  }, [dateRange, patternTypes]);

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage message={error} />;

  const filteredPatterns = selectedPatternType === 'all' 
    ? patterns 
    : patterns.filter(p => p.type === selectedPatternType);

  const getPatternTypeColor = (type: PatternType): string => {
    const colors = {
      seasonal: '#4ECDC4',
      cyclical: '#45B7D1',
      trending: '#96CEB4',
      anomalous: '#FFEAA7',
      correlation: '#DDA0DD',
      behavioral: '#98D8C8'
    };
    return colors[type] || '#95A5A6';
  };

  const getPatternStrengthIcon = (strength: number): string => {
    if (strength >= 0.8) return '🔴'; // High
    if (strength >= 0.6) return '🟡'; // Medium
    return '🟢'; // Low
  };

  const getPatternDescription = (pattern: PatternInsight): string => {
    switch (pattern.type) {
      case 'seasonal':
        return `Seasonal pattern detected with ${(pattern.strength * 100).toFixed(1)}% confidence. Peak activity observed during specific time periods.`;
      case 'cyclical':
        return `Cyclical behavior identified with ${pattern.frequency} cycle frequency and ${(pattern.strength * 100).toFixed(1)}% reliability.`;
      case 'trending':
        return `Trending pattern showing ${pattern.direction === 'up' ? 'upward' : 'downward'} movement with ${(pattern.strength * 100).toFixed(1)}% strength.`;
      case 'anomalous':
        return `Anomalous pattern detected deviating ${(pattern.deviation * 100).toFixed(1)}% from expected behavior.`;
      case 'correlation':
        return `Strong correlation found between variables with ${(pattern.strength * 100).toFixed(1)}% correlation coefficient.`;
      case 'behavioral':
        return `User behavioral pattern identified with ${(pattern.strength * 100).toFixed(1)}% consistency across sessions.`;
      default:
        return `Pattern detected with ${(pattern.strength * 100).toFixed(1)}% confidence level.`;
    }
  };

  const renderPatternCard = ({ item: pattern }: { item: PatternInsight }) => (
    <TouchableOpacity
      style={[
        styles.patternCard,
        selectedPattern?.id === pattern.id && styles.selectedCard
      ]}
      onPress={() => setSelectedPattern(pattern)}
    >
      <View style={styles.patternHeader}>
        <View style={[
          styles.patternTypeTag,
          { backgroundColor: getPatternTypeColor(pattern.type) }
        ]}>
          <Text style={styles.patternTypeText}>{pattern.type.toUpperCase()}</Text>
        </View>
        <Text style={styles.patternStrength}>
          {getPatternStrengthIcon(pattern.strength)} {(pattern.strength * 100).toFixed(1)}%
        </Text>
      </View>
      
      <Text style={styles.patternTitle}>{pattern.name}</Text>
      <Text style={styles.patternDescription} numberOfLines={2}>
        {getPatternDescription(pattern)}
      </Text>
      
      <View style={styles.patternFooter}>
        <Text style={styles.patternMetric}>
          📊 Samples: {pattern.sampleSize}
        </Text>
        <Text style={styles.patternMetric}>
          📅 {new Date(pattern.detectedAt).toLocaleDateString()}
        </Text>
      </View>
      
      {pattern.significance && (
        <View style={[
          styles.significanceTag,
          { backgroundColor: pattern.significance === 'high' ? '#FF6B6B' : 
                          pattern.significance === 'medium' ? '#4ECDC4' : '#95A5A6' }
        ]}>
          <Text style={styles.significanceText}>
            {pattern.significance.toUpperCase()} SIGNIFICANCE
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPatternDetails = () => {
    if (!selectedPattern) {
      return (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            Select a pattern to view detailed analysis
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>{selectedPattern.name}</Text>
        
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Pattern Analysis</Text>
          <Text style={styles.sectionContent}>
            {getPatternDescription(selectedPattern)}
          </Text>
          
          {selectedPattern.metadata && (
            <View style={styles.metadataContainer}>
              <Text style={styles.metadataTitle}>Additional Insights:</Text>
              {Object.entries(selectedPattern.metadata).map(([key, value]) => (
                <Text key={key} style={styles.metadataItem}>
                  • {key}: {value}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Statistical Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{(selectedPattern.strength * 100).toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Pattern Strength</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedPattern.sampleSize}</Text>
              <Text style={styles.metricLabel}>Sample Size</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedPattern.frequency || 'N/A'}</Text>
              <Text style={styles.metricLabel}>Frequency</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {selectedPattern.confidence ? (selectedPattern.confidence * 100).toFixed(1) + '%' : 'N/A'}
              </Text>
              <Text style={styles.metricLabel}>Confidence</Text>
            </View>
          </View>
        </View>

        {selectedPattern.recommendations && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {selectedPattern.recommendations.map((rec, index) => (
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
        <Text style={styles.title}>Pattern Detection</Text>
        <Text style={styles.subtitle}>
          {filteredPatterns.length} patterns detected
        </Text>
      </View>

      {/* Pattern Type Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedPatternType === 'all' && styles.activeFilter
          ]}
          onPress={() => setSelectedPatternType('all')}
        >
          <Text style={[
            styles.filterText,
            selectedPatternType === 'all' && styles.activeFilterText
          ]}>
            All ({patterns.length})
          </Text>
        </TouchableOpacity>
        
        {patternTypes.map(type => {
          const count = patterns.filter(p => p.type === type).length;
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedPatternType === type && styles.activeFilter
              ]}
              onPress={() => setSelectedPatternType(type)}
            >
              <Text style={[
                styles.filterText,
                selectedPatternType === type && styles.activeFilterText
              ]}>
                {type} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.contentContainer}>
        {/* Pattern List */}
        <View style={styles.listContainer}>
          <FlatList
            data={filteredPatterns}
            renderItem={renderPatternCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.patternList}
          />
        </View>

        {/* Pattern Details */}
        <View style={styles.detailsPane}>
          {renderPatternDetails()}
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
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeFilter: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  activeFilterText: {
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
  patternList: {
    padding: 15,
  },
  patternCard: {
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
    borderColor: '#4ECDC4',
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patternTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  patternTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  patternStrength: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  patternDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  patternFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  patternMetric: {
    fontSize: 12,
    color: '#999',
  },
  significanceTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  significanceText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  detailsPane: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailsContainer: {
    padding: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
  metadataContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  metadataItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
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
    color: '#4ECDC4',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
    color: '#4ECDC4',
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
  },
});

export default PatternDetectionWidget;