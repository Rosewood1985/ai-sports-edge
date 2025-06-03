import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

interface LeaderboardEntry {
  date: string;
  aiAccuracy: number;
  publicAccuracy: number;
  isPremium: boolean;
}

interface AILeaderboardProps {
  entries: LeaderboardEntry[];
  isPremium: boolean;
}

/**
 * AILeaderboard component shows AI vs public betting performance
 * @param {AILeaderboardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const AILeaderboard: React.FC<AILeaderboardProps> = ({ entries, isPremium }) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // Navigate to subscription screen
  const handleUpgrade = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Subscription');
  };

  // Render leaderboard entry
  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    // Calculate AI edge
    const aiEdge = item.aiAccuracy - item.publicAccuracy;

    // Determine if entry is locked (premium-only)
    const isLocked = item.isPremium && !isPremium;

    return (
      <View style={[styles.entryContainer, isLocked && styles.lockedEntry]}>
        {/* Date */}
        <Text style={[styles.dateText, { color: colors.text }, isLocked && styles.lockedText]}>
          {item.date}
        </Text>

        {/* AI Accuracy */}
        <View style={styles.accuracyContainer}>
          <Text
            style={[styles.accuracyLabel, { color: colors.text }, isLocked && styles.lockedText]}
          >
            AI
          </Text>
          {isLocked ? (
            <View style={[styles.lockedAccuracy, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
          ) : (
            <Text style={[styles.accuracyValue, { color: '#4CAF50' }]}>{item.aiAccuracy}%</Text>
          )}
        </View>

        {/* Public Accuracy */}
        <View style={styles.accuracyContainer}>
          <Text
            style={[styles.accuracyLabel, { color: colors.text }, isLocked && styles.lockedText]}
          >
            Public
          </Text>
          {isLocked ? (
            <View style={[styles.lockedAccuracy, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
          ) : (
            <Text style={[styles.accuracyValue, { color: '#F44336' }]}>{item.publicAccuracy}%</Text>
          )}
        </View>

        {/* AI Edge */}
        <View style={styles.edgeContainer}>
          {isLocked ? (
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={14} color={colors.primary} />
            </View>
          ) : (
            <>
              <Text style={[styles.edgeValue, { color: aiEdge >= 0 ? '#4CAF50' : '#F44336' }]}>
                {aiEdge >= 0 ? '+' : ''}
                {aiEdge}%
              </Text>
              <Text style={[styles.edgeLabel, { color: colors.text }]}>AI Edge</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="podium" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>AI vs Public Leaderboard</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Track how AI picks perform vs. public consensus
        </Text>
      </View>

      {/* Header row */}
      <View style={[styles.headerRow, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.headerText, { color: colors.text }]}>Date</Text>
        <Text style={[styles.headerText, { color: colors.text }]}>AI</Text>
        <Text style={[styles.headerText, { color: colors.text }]}>Public</Text>
        <Text style={[styles.headerText, { color: colors.text }]}>Edge</Text>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={item => item.date}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} />
        )}
      />

      {!isPremium && (
        <View style={styles.upgradeContainer}>
          <Text style={[styles.upgradeText, { color: colors.text }]}>
            Upgrade to see real-time AI Edge and historical performance
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Get Real-Time AI Edge</Text>
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
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  lockedEntry: {
    opacity: 0.7,
  },
  dateText: {
    fontSize: 14,
    width: '25%',
  },
  accuracyContainer: {
    width: '25%',
    alignItems: 'flex-start',
  },
  accuracyLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  edgeContainer: {
    width: '25%',
    alignItems: 'flex-start',
  },
  edgeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  edgeLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
  lockedText: {
    opacity: 0.5,
  },
  lockedAccuracy: {
    height: 14,
    width: 30,
    borderRadius: 2,
  },
  lockIconContainer: {
    height: 30,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
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

export default AILeaderboard;
