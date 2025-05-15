import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { referralNotificationService, ReferralNotification as NotificationType } from '../services/referralNotificationService';
import ReferralNotificationList from '../components/ReferralNotificationList';
import ReferralNotificationModal from '../components/ReferralNotification';

type RootStackParamList = {
  ReferralLeaderboard: undefined;
  RewardsScreen: undefined;
  SubscriptionManagementScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * ReferralNotificationsScreen displays a list of referral notifications
 * @returns {JSX.Element} - Rendered component
 */
const ReferralNotificationsScreen: React.FC = () => {
  const [selectedNotification, setSelectedNotification] = useState<NotificationType | null>(null);
  const [notificationVisible, setNotificationVisible] = useState<boolean>(false);
  
  const navigation = useNavigation<NavigationProp>();
  const backgroundColor = useThemeColor({}, 'background');
  
  useEffect(() => {
    // Mark notifications as read when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      referralNotificationService.getUnreadCount().then(count => {
        if (count > 0) {
          // Update badge count in tab navigator
          // This would be implemented in a real app
        }
      });
    });
    
    return unsubscribe;
  }, [navigation]);
  
  const handleNotificationPress = (notification: NotificationType) => {
    setSelectedNotification(notification);
    setNotificationVisible(true);
  };
  
  const handleCloseNotification = () => {
    setNotificationVisible(false);
  };
  
  const handleMarkAllAsRead = () => {
    // Update badge count in tab navigator
    // This would be implemented in a real app
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={useThemeColor({}, 'text')} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: useThemeColor({}, 'text') }]}>
          Notifications
        </Text>
        
        <View style={styles.headerRight} />
      </View>
      
      <ReferralNotificationList
        onNotificationPress={handleNotificationPress}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
      
      {selectedNotification && (
        <ReferralNotificationModal
          visible={notificationVisible}
          onClose={handleCloseNotification}
          type={selectedNotification.type}
          title={selectedNotification.title}
          message={selectedNotification.message}
          badgeType={selectedNotification.badgeType}
          rewardAmount={selectedNotification.rewardAmount}
          rewardType={selectedNotification.rewardType}
        />
      )}
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40, // Same width as back button for balance
  },
});

export default ReferralNotificationsScreen;