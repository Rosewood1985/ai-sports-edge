import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';

import ReferralLeaderboard from '../components/ReferralLeaderboard';
import ReferralPrivacySettings from '../components/ReferralPrivacySettings';
import { useThemeColor } from '../hooks/useThemeColor';
import { rewardsService } from '../services/rewardsService';
import { LeaderboardEntry, LeaderboardPrivacy } from '../types/rewards';

type RootStackParamList = {
  RewardsScreen: undefined;
  ReferralRewards: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * ReferralLeaderboardScreen displays the leaderboard of top referrers
 * @returns {JSX.Element} - Rendered component
 */
const ReferralLeaderboardScreen: React.FC = () => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('allTime');
  const [loading, setLoading] = useState<boolean>(true);
  const [privacyModalVisible, setPrivacyModalVisible] = useState<boolean>(false);
  const [currentPrivacy, setCurrentPrivacy] = useState<LeaderboardPrivacy>('public');

  const navigation = useNavigation<NavigationProp>();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadLeaderboardData();
    loadPrivacySettings();
  }, [period]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);

      // Get leaderboard data for the selected period
      const leaderboardData = await rewardsService.getLeaderboardData();

      // Set the entries based on the selected period
      switch (period) {
        case 'weekly':
          setLeaderboardEntries(leaderboardData.weekly);
          break;
        case 'monthly':
          setLeaderboardEntries(leaderboardData.monthly);
          break;
        case 'allTime':
        default:
          setLeaderboardEntries(leaderboardData.allTime);
          break;
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      Alert.alert('Error', 'Failed to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPrivacySettings = async () => {
    try {
      // In a real app, this would fetch from the user's settings
      const userId = 'current-user-id'; // In a real app, get from auth
      const userRewards = await rewardsService.getUserRewards(userId);

      if (userRewards && userRewards.leaderboardPrivacy) {
        setCurrentPrivacy(userRewards.leaderboardPrivacy);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handlePeriodChange = (newPeriod: 'weekly' | 'monthly' | 'allTime') => {
    setPeriod(newPeriod);
  };

  const handlePrivacySettingsPress = () => {
    setPrivacyModalVisible(true);
  };

  const handlePrivacyChange = async (privacy: LeaderboardPrivacy) => {
    try {
      // In a real app, this would update the user's settings
      const userId = 'current-user-id'; // In a real app, get from auth
      await rewardsService.updateLeaderboardPrivacy(userId, privacy);

      setCurrentPrivacy(privacy);
      setPrivacyModalVisible(false);

      // Reload leaderboard data to reflect privacy changes
      loadLeaderboardData();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
    }
  };

  // Handle privacy change from the settings component
  const handlePrivacySettingsChanged = (privacy: LeaderboardPrivacy) => {
    setCurrentPrivacy(privacy);
    loadLeaderboardData();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: textColor }]}>Referral Leaderboard</Text>

        <TouchableOpacity
          style={styles.rewardsButton}
          onPress={() => navigation.navigate('ReferralRewards')}
        >
          <Ionicons name="gift" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ReferralLeaderboard
        entries={leaderboardEntries}
        loading={loading}
        period={period}
        onPeriodChange={handlePeriodChange}
        onPrivacySettingsPress={handlePrivacySettingsPress}
      />

      <ReferralPrivacySettings
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        onPrivacyChanged={handlePrivacySettingsChanged}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  rewardsButton: {
    padding: 8,
  },
});

export default ReferralLeaderboardScreen;
