import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { rewardsService } from '../services/rewardsService';
import { useThemeColor } from '../hooks/useThemeColor';
import NeonCard from './ui/NeonCard';
import NeonText from './ui/NeonText';
import { LinearGradient } from 'expo-linear-gradient';

interface LeaderboardEntry {
  userId: string;
  username: string;
  referralCount: number;
  rank: number;
  isCurrentUser: boolean;
}

type LeaderboardColors = readonly [string, string];

interface ReferralLeaderboardProps {
  limit?: number;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

/**
 * ReferralLeaderboard component displays a leaderboard of users with the most referrals
 * @param {ReferralLeaderboardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralLeaderboard: React.FC<ReferralLeaderboardProps> = ({ 
  limit = 10,
  showViewAll = false,
  onViewAllPress
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  useEffect(() => {
    loadLeaderboard();
  }, []);
  
  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = auth.currentUser?.uid;
      const data = await rewardsService.getReferralLeaderboard(limit);
      
      // Find current user's rank
      if (userId) {
        const userEntry = data.find(entry => entry.userId === userId);
        if (userEntry) {
          setUserRank(userEntry.rank);
        }
      }
      
      setLeaderboard(data);
    } catch (err) {
      console.error('Error loading referral leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderRankBadge = (rank: number) => {
    let badgeColor: LeaderboardColors;
    let textColor = '#FFFFFF';
    
    switch (rank) {
      case 1:
        badgeColor = ['#FFD700', '#FFA500'] as LeaderboardColors; // Gold gradient
        break;
      case 2:
        badgeColor = ['#C0C0C0', '#A9A9A9'] as LeaderboardColors; // Silver gradient
        break;
      case 3:
        badgeColor = ['#CD7F32', '#8B4513'] as LeaderboardColors; // Bronze gradient
        break;
      default:
        badgeColor = ['#3498db', '#2980b9'] as LeaderboardColors; // Blue gradient
        break;
    }
    
    return (
      <LinearGradient
        colors={badgeColor}
        style={styles.rankBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.rankText, { color: textColor }]}>{rank}</Text>
      </LinearGradient>
    );
  };
  
  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    return (
      <View style={[
        styles.leaderboardItem,
        item.isCurrentUser && styles.currentUserItem
      ]}>
        {renderRankBadge(item.rank)}
        
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: textColor }]}>
            {item.username}
            {item.isCurrentUser && ' (You)'}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={[styles.referralCount, { color: primaryColor }]}>
            {item.referralCount}
          </Text>
          <Text style={[styles.referralLabel, { color: textColor }]}>
            {item.referralCount === 1 ? 'referral' : 'referrals'}
          </Text>
        </View>
      </View>
    );
  };
  
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <NeonText type="subheading" glow={true} style={styles.title}>
          Referral Leaderboard
        </NeonText>
        <Text style={[styles.subtitle, { color: textColor }]}>
          Top referrers this month
        </Text>
      </View>
    );
  };
  
  const renderFooter = () => {
    if (!showViewAll) return null;
    
    return (
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={onViewAllPress}
      >
        <Text style={[styles.viewAllText, { color: primaryColor }]}>
          View Full Leaderboard
        </Text>
        <Ionicons name="chevron-forward" size={16} color={primaryColor} />
      </TouchableOpacity>
    );
  };
  
  const renderUserRank = () => {
    if (userRank === null) return null;
    
    return (
      <View style={styles.userRankContainer}>
        <Text style={[styles.userRankText, { color: textColor }]}>
          Your current rank: 
          <Text style={{ color: primaryColor, fontWeight: 'bold' }}> #{userRank}</Text>
        </Text>
      </View>
    );
  };
  
  if (loading) {
    return (
      <NeonCard style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading leaderboard...
          </Text>
        </View>
      </NeonCard>
    );
  }
  
  if (error) {
    return (
      <NeonCard style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: primaryColor }]}
            onPress={loadLeaderboard}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </NeonCard>
    );
  }
  
  return (
    <NeonCard style={styles.container}>
      {renderHeader()}
      
      {leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy" size={40} color={primaryColor} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            No referrals yet. Be the first to refer friends and earn rewards!
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={leaderboard}
            renderItem={renderItem}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
          
          {renderUserRank()}
          {renderFooter()}
        </>
      )}
    </NeonCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  referralCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  referralLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  userRankContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    alignItems: 'center',
  },
  userRankText: {
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ReferralLeaderboard;