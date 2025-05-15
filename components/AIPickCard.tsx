import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { formatDate } from '../utils/dateUtils';

interface AIPickCardProps {
  gameId: string;
  teamA: string;
  teamB: string;
  confidence: number;
  momentumScore: number;
  aiInsightText: string;
  isAIPickOfDay?: boolean;
  sport?: string;
  league?: string;
  startTime?: any; // Timestamp
  predictedWinner?: string;
  onFollow?: (gameId: string) => void;
}

/**
 * AIPickCard Component
 * 
 * Displays an AI pick with team matchup, confidence, and insight text
 */
const AIPickCard: React.FC<AIPickCardProps> = ({
  gameId,
  teamA,
  teamB,
  confidence,
  momentumScore,
  aiInsightText,
  isAIPickOfDay = false,
  sport,
  league,
  startTime,
  predictedWinner,
  onFollow
}) => {
  const { theme, themePreset } = useTheme();
  const isDark = themePreset === 'dark';
  
  // Determine confidence level color
  const getConfidenceColor = () => {
    if (confidence >= 80) return theme.success;
    if (confidence >= 60) return theme.warning;
    return theme.error;
  };
  
  // Determine momentum indicator
  const getMomentumIndicator = () => {
    if (momentumScore >= 15) return '🔥 Hot';
    if (momentumScore >= 5) return '📈 Rising';
    if (momentumScore <= -15) return '❄️ Cold';
    if (momentumScore <= -5) return '📉 Falling';
    return '➖ Neutral';
  };
  
  // Format the game time
  const formattedTime = startTime ? formatDate(startTime.toDate()) : 'TBD';
  
  // Determine which team is predicted to win
  const winner = predictedWinner || (teamA.includes(predictedWinner || '') ? teamA : teamB);
  const loser = winner === teamA ? teamB : teamA;
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.cardBackground },
      isAIPickOfDay && styles.pickOfDayContainer
    ]}>
      {/* Pick of the Day Badge */}
      {isAIPickOfDay && (
        <View style={styles.pickOfDayBadge}>
          <Text style={styles.pickOfDayText}>AI PICK OF THE DAY</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.sportText, { color: theme.text }]}>
            {sport} {league ? `• ${league}` : ''}
          </Text>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formattedTime}
          </Text>
        </View>
        
        {/* Confidence Indicator */}
        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceText, { color: getConfidenceColor() }]}>
            {confidence}% Confidence
          </Text>
          <View 
            style={[
              styles.confidenceBar, 
              { backgroundColor: isDark ? theme.background : theme.background }
            ]}
          >
            <View 
              style={[
                styles.confidenceFill, 
                { 
                  width: `${confidence}%`, 
                  backgroundColor: getConfidenceColor() 
                }
              ]} 
            />
          </View>
        </View>
      </View>
      
      {/* Teams */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamContainer}>
          <Text 
            style={[
              styles.teamName, 
              { color: theme.text },
              winner === teamA && styles.winnerText
            ]}
          >
            {teamA}
            {winner === teamA && <Text style={styles.winnerIndicator}> ✓</Text>}
          </Text>
        </View>
        
        <Text style={[styles.vsText, { color: theme.textSecondary }]}>vs</Text>
        
        <View style={styles.teamContainer}>
          <Text 
            style={[
              styles.teamName, 
              { color: theme.text },
              winner === teamB && styles.winnerText
            ]}
          >
            {teamB}
            {winner === teamB && <Text style={styles.winnerIndicator}> ✓</Text>}
          </Text>
        </View>
      </View>
      
      {/* Momentum */}
      <View style={styles.momentumContainer}>
        <Text style={[styles.momentumLabel, { color: theme.textSecondary }]}>
          Momentum:
        </Text>
        <Text style={[styles.momentumText, { color: theme.text }]}>
          {getMomentumIndicator()}
        </Text>
      </View>
      
      {/* AI Insight */}
      <View style={styles.insightContainer}>
        <View style={styles.insightHeader}>
          <Ionicons 
            name="bulb-outline" 
            size={16} 
            color={theme.primary} 
            style={styles.insightIcon} 
          />
          <Text style={[styles.insightLabel, { color: theme.primary }]}>
            AI INSIGHT
          </Text>
        </View>
        <Text style={[styles.insightText, { color: theme.text }]}>
          {aiInsightText || `Our AI model predicts ${winner} to win against ${loser} with ${confidence}% confidence.`}
        </Text>
      </View>
      
      {/* Follow Button */}
      {onFollow && (
        <TouchableOpacity 
          style={[styles.followButton, { backgroundColor: theme.primary }]}
          onPress={() => onFollow(gameId)}
        >
          <Ionicons name="star-outline" size={16} color="#fff" style={styles.followIcon} />
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickOfDayContainer: {
    borderWidth: 2,
    borderColor: '#FFD700', // Gold
  },
  pickOfDayBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FFD700', // Gold
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pickOfDayText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sportText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    marginTop: 2,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  winnerText: {
    fontWeight: '800',
  },
  winnerIndicator: {
    color: '#4CAF50', // Green
  },
  vsText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  momentumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  momentumLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  momentumText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightContainer: {
    marginTop: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightIcon: {
    marginRight: 4,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  followIcon: {
    marginRight: 4,
  },
  followText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AIPickCard;