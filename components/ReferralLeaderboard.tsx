import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import LeaderboardPositionChange from './LeaderboardPositionChange';
import ReferralBadge from './ReferralBadge';
import { useThemeColor } from '../hooks/useThemeColor';
import { LeaderboardEntry } from '../types/rewards';
import NeonText from './ui/NeonText';

interface ReferralLeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  period: 'weekly' | 'monthly' | 'allTime';
  onPeriodChange: (period: 'weekly' | 'monthly' | 'allTime') => void;
  onPrivacySettingsPress?: () => void;
}

/**
 * ReferralLeaderboard component displays a leaderboard of top referrers
 * @param {ReferralLeaderboardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralLeaderboard: React.FC<ReferralLeaderboardProps> = ({
  entries,
  loading,
  period,
  onPeriodChange,
  onPrivacySettingsPress,
}) => {
  // State to track previous entries for position change animations
  const [previousEntries, setPreviousEntries] = useState<LeaderboardEntry[]>([]);
  const [showPositionChanges, setShowPositionChanges] = useState<boolean>(false);

  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const { width } = Dimensions.get('window');

  // Update previous entries when entries change
  useEffect(() => {
    if (!loading && entries.length > 0) {
      // Wait a bit before showing position changes to allow the list to render
      setTimeout(() => {
        setShowPositionChanges(true);
      }, 500);

      // Store current entries as previous for next update
      setPreviousEntries([...entries]);
    }
  }, [entries, period]);

  // Reset position change animation when period changes
  useEffect(() => {
    setShowPositionChanges(false);
  }, [period]);

  // Find previous rank for a user
  const getPreviousRank = (userId: string): number => {
    const previousEntry = previousEntries.find(entry => entry.userId === userId);
    return previousEntry?.rank || 0;
  };

  // Render top 3 podium
  const renderPodium = () => {
    const top3 = entries.slice(0, 3);

    // If we don't have 3 entries, pad with empty ones
    while (top3.length < 3) {
      top3.push({
        userId: `empty-${top3.length}`,
        displayName: '',
        referralCount: 0,
        rank: top3.length + 1,
        badgeType: 'rookie',
        isCurrentUser: false,
      });
    }

    // Sort by rank (2nd place, 1st place, 3rd place) for display
    const displayOrder = [top3[1], top3[0], top3[2]];

    return (
      <View style={styles.podiumContainer}>
        {displayOrder.map((entry, index) => {
          const position = index === 0 ? 2 : index === 1 ? 1 : 3;
          const isEmpty = entry.userId.startsWith('empty-');

          // Determine podium height based on position
          const podiumHeight = position === 1 ? 120 : position === 2 ? 100 : 80;

          // Determine medal color based on position
          const medalColor =
            position === 1
              ? (['#f1c40f', '#e67e22'] as const) // Gold
              : position === 2
                ? (['#bdc3c7', '#95a5a6'] as const) // Silver
                : (['#cd7f32', '#a04000'] as const); // Bronze

          return (
            <View key={entry.userId} style={[styles.podiumItem, { width: width / 3.5 }]}>
              {!isEmpty && (
                <View style={styles.podiumUser}>
                  <ReferralBadge type={entry.badgeType} size="small" />

                  <Text
                    style={[styles.podiumName, { color: textColor }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {entry.isCurrentUser ? 'You' : entry.displayName}
                  </Text>

                  <Text style={[styles.podiumCount, { color: primaryColor }]}>
                    {entry.referralCount}
                  </Text>
                </View>
              )}

              <LinearGradient
                colors={medalColor}
                style={[styles.podiumPlatform, { height: podiumHeight }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.podiumPosition}>{position}</Text>
              </LinearGradient>
            </View>
          );
        })}
      </View>
    );
  };

  // Render leaderboard entry
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    // Skip top 3 as they're shown in the podium
    if (index < 3) return null;

    // Get previous rank for position change animation
    const previousRank = getPreviousRank(item.userId);

    return (
      <View
        style={[
          styles.leaderboardItem,
          item.isCurrentUser && { backgroundColor: 'rgba(52, 152, 219, 0.1)' },
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: textColor }]}>{item.rank}</Text>

          {showPositionChanges && previousRank > 0 && (
            <LeaderboardPositionChange
              previousRank={previousRank}
              currentRank={item.rank}
              showAnimation={showPositionChanges}
            />
          )}
        </View>

        <ReferralBadge type={item.badgeType} size="small" />

        <Text
          style={[
            styles.displayName,
            { color: textColor },
            item.isCurrentUser && { fontWeight: 'bold' },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.isCurrentUser ? 'You' : item.displayName}
        </Text>

        <Text style={[styles.referralCount, { color: primaryColor }]}>{item.referralCount}</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={textColor} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyText, { color: textColor }]}>No leaderboard data yet</Text>
      <Text style={[styles.emptySubtext, { color: textColor }]}>
        Start referring friends to appear on the leaderboard
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Period Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, period === 'weekly' && { borderBottomColor: primaryColor }]}
          onPress={() => onPeriodChange('weekly')}
        >
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              period === 'weekly' && { color: primaryColor },
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, period === 'monthly' && { borderBottomColor: primaryColor }]}
          onPress={() => onPeriodChange('monthly')}
        >
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              period === 'monthly' && { color: primaryColor },
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, period === 'allTime' && { borderBottomColor: primaryColor }]}
          onPress={() => onPeriodChange('allTime')}
        >
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              period === 'allTime' && { color: primaryColor },
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Settings Button */}
      {onPrivacySettingsPress && (
        <TouchableOpacity style={styles.privacyButton} onPress={onPrivacySettingsPress}>
          <Ionicons name="settings-outline" size={16} color={textColor} />
          <Text style={[styles.privacyButtonText, { color: textColor }]}>Privacy Settings</Text>
        </TouchableOpacity>
      )}

      {/* Leaderboard Title */}
      <NeonText type="subheading" glow style={styles.title}>
        {period === 'weekly'
          ? 'Weekly Leaderboard'
          : period === 'monthly'
            ? 'Monthly Leaderboard'
            : 'All-Time Leaderboard'}
      </NeonText>

      {/* Podium for Top 3 */}
      {!loading && entries.length > 0 && renderPodium()}

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderLeaderboardItem}
          keyExtractor={item => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  privacyButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  podiumItem: {
    alignItems: 'center',
  },
  podiumUser: {
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
    maxWidth: 80,
  },
  podiumCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  podiumPlatform: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumPosition: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  rankContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 30,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  displayName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  referralCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ReferralLeaderboard;
