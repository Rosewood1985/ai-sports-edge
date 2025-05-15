import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropBetPrediction } from '../types/playerProps';
import { useTheme } from '../contexts/ThemeContext';
import PremiumFeature from './PremiumFeature';

interface PropBetCardProps {
  prediction: PropBetPrediction;
  isPremium: boolean;
  onSubscribe?: () => void;
}

const PropBetCard: React.FC<PropBetCardProps> = ({ 
  prediction, 
  isPremium,
  onSubscribe 
}) => {
  const { colors, isDark } = useTheme();
  
  // Format the prop type for display
  const formatPropType = (type: string): string => {
    // Convert camelCase to Title Case with spaces
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };
  
  // Get icon for prop type
  const getPropTypeIcon = (type: string): string => {
    switch (type) {
      case 'points':
        return 'basketball';
      case 'rebounds':
        return 'basketball';
      case 'assists':
        return 'hand-right';
      case 'threePointers':
        return 'analytics';
      case 'blocks':
        return 'hand-left';
      case 'steals':
        return 'flash';
      case 'passingYards':
        return 'football';
      case 'rushingYards':
        return 'walk';
      case 'receivingYards':
        return 'radio';
      case 'touchdowns':
        return 'trophy';
      case 'goals':
        return 'football';
      case 'saves':
        return 'shield';
      case 'strikeouts':
        return 'baseball';
      case 'hits':
        return 'baseball';
      case 'homeRuns':
        return 'trending-up';
      default:
        return 'stats-chart';
    }
  };
  
  // Get color for confidence level
  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'high':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FFC107'; // Yellow
      case 'low':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };
  
  // If premium content and user doesn't have premium access
  if (prediction.isPremium && !isPremium) {
    return (
      <PremiumFeature
        message={`Unlock ${prediction.propBet.player} ${formatPropType(prediction.propBet.type)} predictions with a premium subscription`}
      >
        <View style={styles.premiumPreview}>
          <Text style={{ color: '#888888', textAlign: 'center' }}>
            Premium Player Prop Prediction
          </Text>
        </View>
      </PremiumFeature>
    );
  }
  
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
        borderColor: isDark ? '#444444' : '#E0E0E0'
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: colors.text }]}>
            {prediction.propBet.player}
          </Text>
          <Text style={[styles.teamName, { color: isDark ? '#BBBBBB' : '#666666' }]}>
            {prediction.propBet.team}
          </Text>
        </View>
        
        <View style={[
          styles.confidenceBadge,
          { backgroundColor: getConfidenceColor(prediction.confidence) }
        ]}>
          <Text style={styles.confidenceText}>
            {prediction.confidence.toUpperCase()} CONFIDENCE
          </Text>
        </View>
      </View>
      
      <View style={styles.propDetails}>
        <View style={styles.propTypeContainer}>
          <Ionicons 
            name={getPropTypeIcon(prediction.propBet.type) as any} 
            size={24} 
            color={colors.primary} 
          />
          <Text style={[styles.propType, { color: colors.text }]}>
            {formatPropType(prediction.propBet.type)}
          </Text>
        </View>
        
        <View style={styles.lineContainer}>
          <Text style={[styles.lineLabel, { color: isDark ? '#BBBBBB' : '#666666' }]}>
            Line:
          </Text>
          <Text style={[styles.lineValue, { color: colors.text }]}>
            {prediction.propBet.line}
          </Text>
        </View>
      </View>
      
      <View style={styles.predictionContainer}>
        <Text style={[styles.predictionLabel, { color: isDark ? '#BBBBBB' : '#666666' }]}>
          AI Prediction:
        </Text>
        <View style={[
          styles.predictionBadge,
          { 
            backgroundColor: prediction.prediction === 'over' 
              ? '#4CAF50' 
              : '#F44336' 
          }
        ]}>
          <Text style={styles.predictionText}>
            {prediction.prediction.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.oddsContainer}>
        <View style={styles.oddsItem}>
          <Text style={[styles.oddsLabel, { color: isDark ? '#BBBBBB' : '#666666' }]}>
            Over:
          </Text>
          <Text style={[styles.oddsValue, { color: colors.text }]}>
            {prediction.propBet.overOdds > 0 ? `+${prediction.propBet.overOdds}` : prediction.propBet.overOdds}
          </Text>
        </View>
        
        <View style={styles.oddsItem}>
          <Text style={[styles.oddsLabel, { color: isDark ? '#BBBBBB' : '#666666' }]}>
            Under:
          </Text>
          <Text style={[styles.oddsValue, { color: colors.text }]}>
            {prediction.propBet.underOdds > 0 ? `+${prediction.propBet.underOdds}` : prediction.propBet.underOdds}
          </Text>
        </View>
      </View>
      
      <View style={[
        styles.reasoningContainer,
        { backgroundColor: isDark ? '#222222' : '#F5F5F5' }
      ]}>
        <Text style={[styles.reasoningLabel, { color: isDark ? '#BBBBBB' : '#666666' }]}>
          AI Reasoning:
        </Text>
        <Text style={[styles.reasoning, { color: colors.text }]}>
          {prediction.reasoning}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.accuracyText, { color: isDark ? '#BBBBBB' : '#666666' }]}>
          Historical Accuracy: {prediction.historicalAccuracy}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamName: {
    fontSize: 14,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  propDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  propTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propType: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  lineValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  predictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  predictionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  predictionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  oddsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  oddsItem: {
    flexDirection: 'row',
    marginRight: 16,
  },
  oddsLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  oddsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reasoningContainer: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  reasoningLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  reasoning: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'flex-end',
  },
  accuracyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  premiumPreview: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
  },
});

export default PropBetCard;