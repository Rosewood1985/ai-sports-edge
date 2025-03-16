import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  aiPrediction?: string;
}

interface CommunityPollsProps {
  polls: Poll[];
  onVote: (pollId: string, optionId: string) => void;
  isPremium: boolean;
}

/**
 * CommunityPolls component allows users to vote on games and see results
 * @param {CommunityPollsProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const CommunityPolls: React.FC<CommunityPollsProps> = ({ 
  polls,
  onVote,
  isPremium
}) => {
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // Navigate to subscription screen
  const handleUpgrade = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Subscription');
  };

  // Handle vote
  const handleVote = (pollId: string, optionId: string) => {
    setVotedPolls(prev => ({
      ...prev,
      [pollId]: optionId
    }));
    onVote(pollId, optionId);
  };

  // Render poll item
  const renderPoll = ({ item }: { item: Poll }) => {
    const hasVoted = votedPolls[item.id] !== undefined;
    const votedOptionId = votedPolls[item.id];

    return (
      <View style={[
        styles.pollContainer,
        { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)' }
      ]}>
        <Text style={[styles.pollQuestion, { color: colors.text }]}>
          {item.question}
        </Text>

        {/* Poll options */}
        <View style={styles.optionsContainer}>
          {item.options.map(option => {
            const isSelected = votedOptionId === option.id;
            const percentage = item.totalVotes > 0 
              ? Math.round((option.votes / item.totalVotes) * 100) 
              : 0;
            
            // Determine if this option matches AI prediction
            const isAIPrediction = isPremium && 
              item.aiPrediction !== undefined && 
              option.text === item.aiPrediction;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  isSelected && { borderColor: colors.primary },
                  hasVoted && { opacity: isSelected ? 1 : 0.7 }
                ]}
                onPress={() => handleVote(item.id, option.id)}
                disabled={hasVoted}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    { color: colors.text },
                    isSelected && { fontWeight: 'bold' }
                  ]}>
                    {option.text}
                  </Text>
                  
                  {hasVoted && (
                    <Text style={[styles.votePercentage, { color: colors.text }]}>
                      {percentage}%
                    </Text>
                  )}
                </View>
                
                {hasVoted && (
                  <View style={[
                    styles.percentageBar,
                    { 
                      width: `${percentage}%`,
                      backgroundColor: isSelected ? colors.primary : '#757575'
                    }
                  ]} />
                )}
                
                {isAIPrediction && (
                  <View style={styles.aiPredictionTag}>
                    <Ionicons name="flash" size={12} color="#fff" />
                    <Text style={styles.aiPredictionText}>AI PICK</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Total votes */}
        <Text style={[styles.totalVotes, { color: colors.text }]}>
          {item.totalVotes} votes
        </Text>

        {/* AI prediction for premium users */}
        {!isPremium && item.aiPrediction !== undefined && (
          <View style={styles.aiPredictionContainer}>
            <Ionicons name="lock-closed" size={14} color={colors.primary} />
            <Text style={[styles.aiPredictionPrompt, { color: colors.text }]}>
              Upgrade to see AI prediction
            </Text>
            <TouchableOpacity
              style={[styles.miniUpgradeButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
            >
              <Text style={styles.miniUpgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }
    ]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Community Polls
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Vote and see what others think
        </Text>
      </View>

      <FlatList
        data={polls}
        renderItem={renderPoll}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {!isPremium && (
        <View style={styles.upgradeContainer}>
          <Text style={[styles.upgradeText, { color: colors.text }]}>
            Premium users can compare community picks with AI predictions
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  pollContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    marginBottom: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  optionText: {
    fontSize: 14,
  },
  votePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  percentageBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    opacity: 0.2,
    zIndex: 1,
  },
  totalVotes: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 4,
  },
  aiPredictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
  aiPredictionPrompt: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  aiPredictionTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#3498db',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomLeftRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiPredictionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  miniUpgradeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  miniUpgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  upgradeContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  upgradeText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CommunityPolls;