import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../i18n/mock';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Props for the AIPickCard component
 */
interface AIPickCardProps {
  gameId: string;
  teamA: string;
  teamB: string;
  confidence: number;
  momentumScore: number;
  aiInsightText: string;
  onFollow?: (gameId: string) => void;
  isFollowed?: boolean;
  isPremium?: boolean;
}

/**
 * AIPickCard component displays an AI prediction for a game
 * with confidence indicator, momentum score, and insight text
 */
const AIPickCard: React.FC<AIPickCardProps> = ({
  gameId,
  teamA,
  teamB,
  confidence,
  momentumScore,
  aiInsightText,
  onFollow,
  isFollowed = false,
  isPremium = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Determine confidence level color
  const getConfidenceColor = (confidence: number): [string, string] => {
    if (confidence >= 80) {
      return ['#34D399', '#10B981'] as [string, string]; // Green gradient
    } else if (confidence >= 60) {
      return ['#FBBF24', '#F59E0B'] as [string, string]; // Yellow gradient
    } else {
      return ['#F87171', '#EF4444'] as [string, string]; // Red gradient
    }
  };

  // Determine confidence level text
  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 80) {
      return t('High Confidence');
    } else if (confidence >= 60) {
      return t('Medium Confidence');
    } else {
      return t('Low Confidence');
    }
  };

  // Handle follow button press
  const handleFollow = () => {
    if (onFollow) {
      onFollow(gameId);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      {/* Header with AI Pick of the Day */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="sports" size={24} color="white" />
          <Text style={styles.headerText}>{t('AI Pick of the Day')}</Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Teams Matchup */}
      <View style={styles.matchupContainer}>
        <Text style={[styles.teamText, { color: theme.text }]}>{teamA}</Text>
        <View style={styles.vsContainer}>
          <Text style={[styles.vsText, { color: theme.textSecondary }]}>vs</Text>
        </View>
        <Text style={[styles.teamText, { color: theme.text }]}>{teamB}</Text>
      </View>

      {/* Confidence Indicator */}
      <View style={styles.confidenceContainer}>
        <Text style={[styles.confidenceLabel, { color: theme.textSecondary }]}>
          {t('AI Confidence')}
        </Text>
        <View style={styles.confidenceBarContainer}>
          <LinearGradient
            colors={getConfidenceColor(confidence)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.confidenceBar, { width: `${confidence}%` }]}
          />
          <View style={styles.confidenceValueContainer}>
            <Text style={styles.confidenceValue}>{Math.round(confidence)}%</Text>
          </View>
        </View>
        <Text style={[styles.confidenceText, { color: getConfidenceColor(confidence)[1] }]}>
          {getConfidenceText(confidence)}
        </Text>
      </View>

      {/* Momentum Score */}
      <View style={styles.momentumContainer}>
        <Text style={[styles.momentumLabel, { color: theme.textSecondary }]}>
          {t('Momentum Score')}
        </Text>
        <View style={styles.momentumValueContainer}>
          <Text
            style={[
              styles.momentumValue,
              {
                color:
                  momentumScore > 10
                    ? '#10B981'
                    : momentumScore < -10
                    ? '#EF4444'
                    : theme.text,
              },
            ]}
          >
            {momentumScore > 0 ? '+' : ''}
            {momentumScore}
          </Text>
        </View>
      </View>

      {/* AI Insight */}
      <View style={styles.insightContainer}>
        <View style={styles.insightHeader}>
          <FontAwesome name="lightbulb-o" size={16} color="#F59E0B" />
          <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
            {t('AI Insight')}
          </Text>
        </View>
        <Text style={[styles.insightText, { color: theme.text }]}>{aiInsightText}</Text>
      </View>

      {/* Follow Button */}
      {onFollow && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowed ? styles.followedButton : { backgroundColor: theme.primary },
          ]}
          onPress={handleFollow}
        >
          <FontAwesome
            name={isFollowed ? 'star' : 'star-o'}
            size={16}
            color={isFollowed ? '#F59E0B' : 'white'}
          />
          <Text style={styles.followButtonText}>
            {isFollowed ? t('Following') : t('Follow Pick')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  premiumText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  matchupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  teamText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
  },
  confidenceContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  confidenceBarContainer: {
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 12,
  },
  confidenceValueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'right',
  },
  momentumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  momentumLabel: {
    fontSize: 14,
  },
  momentumValueContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  momentumValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    padding: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  followedButton: {
    backgroundColor: '#F3F4F6',
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AIPickCard;