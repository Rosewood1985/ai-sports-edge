// External imports
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';


import * as ImagePicker from 'expo-image-picker';
import {


// Internal imports
import { MainLayout } from '../templates';
import { firebaseService } from '../organisms';
import { monitoringService } from '../organisms';
import { useI18n } from '../molecules/i18nContext';
import { useTheme } from '../molecules/themeContext';











































                user.photoURL ? { uri: user.photoURL } : require('../../assets/default-profile.png')
              resizeMode="cover"
              source={
              style={styles.profileImage}
              {stats.favoriteLeague}
              {t('common.loading')}
              {t('profile.betsLost')}
              {t('profile.betsWon')}
              {t('profile.favoriteLeague')}:
              {t('profile.favoriteTeam')}:
              {t('profile.totalBets')}
              {t('profile.winRate')}
              }
            />
            </Text>
            </Text>
            </Text>
            </Text>
            </Text>
            </Text>
            </Text>
            </Text>
            <ActivityIndicator size="large" color={colors.primary} />
            <ActivityIndicator size="large" color={colors.primary} style={styles.profileImage} />
            <Image
            <Text style={[styles.editIcon, { color: colors.onPrimary }]}>✎</Text>
            <Text style={[styles.favoriteLabel, { color: colors.textSecondary }]}>
            <Text style={[styles.favoriteLabel, { color: colors.textSecondary }]}>
            <Text style={[styles.favoriteValue, { color: colors.text }]}>
            <Text style={[styles.favoriteValue, { color: colors.text }]}>{stats.favoriteTeam}</Text>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{stats.betsLost}</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalBets}</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.winRate}%</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.betsWon}</Text>
            {loading ? t('common.loading') : t('profile.logout')}
            {renderActions}
            {renderStats}
            {renderUserInfo}
            {t('profile.bettingHistory')}
            {user.displayName || t('profile.anonymous')}
          ) : (
          )}
          ...user,
          </>
          </Text>
          </Text>
          </Text>
          </View>
          </View>
          </View>
          </View>
          </View>
          </View>
          </View>
          </View>
          <>
          <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
          <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
          <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
          <Text style={[styles.actionText, { color: colors.error }]}>
          <Text style={[styles.actionText, { color: colors.text }]}>
          <Text style={[styles.actionText, { color: colors.text }]}>{t('profile.settings')}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
          <Text style={[styles.userName, { color: colors.text }]}>
          <View style={[styles.editIconContainer, { backgroundColor: colors.primary }]}>
          <View style={styles.favoriteItem}>
          <View style={styles.favoriteItem}>
          <View style={styles.loadingContainer}>
          <View style={styles.statItem}>
          <View style={styles.statItem}>
          <View style={styles.statItem}>
          <View style={styles.statItem}>
          disabled={uploadingImage}
          navigation.navigate('Login');
          onPress={handleBettingHistory}
          onPress={handleSelectImage}
          onPress={handleSettings}
          photoURL: downloadURL,
          photoURL: downloadURL,
          return;
          setStats(userStats);
          style={[styles.actionButton, { borderBottomColor: colors.border }]}
          style={[styles.actionButton, { borderBottomColor: colors.border }]}
          style={styles.profileImageContainer}
          {t('profile.bettingStats')}
          {uploadingImage ? (
        ) : (
        )}
        )}
        )}
        // Get current user
        // Get user stats
        // Refresh user data
        // Update user profile
        // Upload image to storage
        </Text>
        </TouchableOpacity>
        </TouchableOpacity>
        </TouchableOpacity>
        </TouchableOpacity>
        </View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.actions')}</Text>
        <TouchableOpacity
        <TouchableOpacity
        <TouchableOpacity
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout} disabled={loading}>
        <View style={styles.statsGrid}>
        <View style={styles.userDetails}>
        >
        >
        >
        Alert.alert(t('common.error'), t('profile.errors.loadFailed'));
        Alert.alert(t('common.error'), t('profile.errors.permissionDenied'));
        Alert.alert(t('common.error'), t('profile.errors.uploadFailed'));
        Alert.alert(t('common.success'), t('profile.alerts.imageUpdated'));
        allowsEditing: true,
        aspect: [1, 1],
        await firebaseService.auth.updateProfile({
        await uploadProfileImage(result.assets[0].uri);
        const currentUser = firebaseService.auth.getCurrentUser();
        const downloadURL = await firebaseService.storage.uploadProfileImage(uri, user.uid);
        const userStats = await firebaseService.firestore.getUserStats(currentUser.uid);
        contentContainerStyle={styles.contentContainer}
        if (!currentUser) {
        if (userStats) {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        monitoringService.error.captureException(error);
        monitoringService.error.captureException(error);
        quality: 0.8,
        return;
        setLoading(false);
        setLoading(true);
        setUploadingImage(false);
        setUploadingImage(true);
        setUser(currentUser);
        setUser({
        style={[styles.container, { backgroundColor: colors.background }]}
        {loading && !user ? (
        {stats.favoriteLeague && (
        {stats.favoriteTeam && (
        }
        }
        });
        });
      // Launch image picker
      // Request permissions
      </ScrollView>
      </View>
      </View>
      </View>
      <Content />
      <ScrollView
      <View style={[styles.actionsContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfoContainer}>
      >
      Alert.alert(t('common.error'), t('profile.errors.imageFailed'));
      Alert.alert(t('common.error'), t('profile.errors.logoutFailed'));
      await firebaseService.auth.signOut();
      const result = await ImagePicker.launchImageLibraryAsync({
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!result.canceled && result.assets && result.assets.length > 0) {
      if (!user) return;
      if (status !== 'granted') {
      monitoringService.error.captureException(error);
      monitoringService.error.captureException(error);
      navigation.navigate('Login');
      setLoading(false);
      setLoading(true);
      try {
      try {
      }
      }
      }
      }
      } catch (error) {
      } catch (error) {
      } finally {
      } finally {
      });
    () => () => (
    ),
    );
    );
    );
    </MainLayout>
    <MainLayout scrollable={false} safeArea={true}>
    [colors, loading, user, renderUserInfo, renderStats, renderActions, t]
    [user, t]
    alignItems: 'center',
    alignItems: 'center',
    alignItems: 'center',
    alignItems: 'center',
    async uri => {
    betsLost: 0,
    betsWon: 0,
    borderBottomWidth: 1,
    borderRadius: 10,
    borderRadius: 10,
    borderRadius: 12,
    borderRadius: 40,
    bottom: 0,
    const fetchUserData = async () => {
    favoriteLeague: '',
    favoriteTeam: '',
    fetchUserData();
    flex: 1,
    flex: 1,
    flex: 1,
    flexDirection: 'row',
    flexDirection: 'row',
    flexDirection: 'row',
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: 14,
    fontSize: 14,
    fontSize: 14,
    fontSize: 14,
    fontSize: 14,
    fontSize: 16,
    fontSize: 16,
    fontSize: 18,
    fontSize: 20,
    fontSize: 20,
    fontSize: 24,
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    height: '100%',
    height: 24,
    height: 80,
    if (!user) return null;
    justifyContent: 'center',
    justifyContent: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginBottom: 16,
    marginBottom: 16,
    marginBottom: 20,
    marginBottom: 20,
    marginBottom: 4,
    marginBottom: 4,
    marginBottom: 8,
    marginRight: 16,
    marginRight: 8,
    marginTop: 12,
    navigation.navigate('BettingHistory');
    navigation.navigate('Settings');
    overflow: 'hidden',
    padding: 16,
    padding: 16,
    padding: 16,
    padding: 20,
    paddingBottom: 32,
    paddingVertical: 16,
    position: 'absolute',
    position: 'relative',
    return (
    return (
    return (
    right: 0,
    totalBets: 0,
    try {
    try {
    width: '100%',
    width: '50%',
    width: 24,
    width: 80,
    winRate: 0,
    }
    }
    } catch (error) {
    } catch (error) {
    } finally {
    },
    };
   * @param {string} uri Image URI
   * @returns {React.ReactNode} Rendered component
   * @returns {React.ReactNode} Rendered component
   * @returns {React.ReactNode} Rendered component
   * Handle logout
   * Handle profile image selection
   * Navigate to betting history
   * Navigate to settings
   * Render actions section
   * Render stats section
   * Render user info section
   * Upload profile image
   */
   */
   */
   */
   */
   */
   */
   */
  );
  );
  );
  /**
  /**
  /**
  /**
  /**
  /**
  /**
  /**
  // Content component
  // Fetch user data on mount
  // Get theme from context
  // Get translations
  // Navigation
  // Render page using MainLayout template
  // State
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  actionArrow: {
  actionButton: {
  actionText: {
  actionsContainer: {
  const Content = useMemo(
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState(null);
  const handleBettingHistory = useCallback(() => {
  const handleLogout = useCallback(async () => {
  const handleSelectImage = useCallback(async () => {
  const handleSettings = useCallback(() => {
  const navigation = useNavigation();
  const renderActions = useMemo(() => {
  const renderStats = useMemo(() => {
  const renderUserInfo = useMemo(() => {
  const uploadProfileImage = useCallback(
  const { colors } = useTheme();
  const { t } = useI18n();
  container: {
  contentContainer: {
  editIcon: {
  editIconContainer: {
  favoriteItem: {
  favoriteLabel: {
  favoriteValue: {
  loadingContainer: {
  loadingText: {
  profileImage: {
  profileImageContainer: {
  return (
  sectionTitle: {
  statItem: {
  statLabel: {
  statValue: {
  statsContainer: {
  statsGrid: {
  useEffect(() => {
  userDetails: {
  userEmail: {
  userInfoContainer: {
  userName: {
  });
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  }, [colors, handleBettingHistory, handleSettings, handleLogout, loading, t]);
  }, [navigation, t]);
  }, [navigation, t]);
  }, [navigation]);
  }, [navigation]);
  }, [stats, colors, t]);
  }, [t]);
  }, [user, uploadingImage, colors, handleSelectImage, t]);
 *
 * @returns {React.ReactNode} Rendered component
 * A page component for the user profile screen using the atomic architecture.
 * Profile Page
 * Profile Page component
 */
 */
/**
/**
// Import atomic components
// Styles
const ProfilePage = () => {
const styles = StyleSheet.create({
export default ProfilePage;
} from 'react-native';
});
};

