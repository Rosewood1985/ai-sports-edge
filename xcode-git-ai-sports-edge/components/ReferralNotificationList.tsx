import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { referralNotificationService, ReferralNotification } from '../services/referralNotificationService';
import ReferralBadge from './ReferralBadge';

interface ReferralNotificationListProps {
  onNotificationPress?: (notification: ReferralNotification) => void;
  onMarkAllAsRead?: () => void;
}

/**
 * ReferralNotificationList component displays a list of referral notifications
 * @param {ReferralNotificationListProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralNotificationList: React.FC<ReferralNotificationListProps> = ({
  onNotificationPress,
  onMarkAllAsRead
}) => {
  const [notifications, setNotifications] = useState<ReferralNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  useEffect(() => {
    loadNotifications();
  }, []);
  
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationData = await referralNotificationService.getNotifications();
      setNotifications(notificationData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await referralNotificationService.markAllAsRead();
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        read: true
      })));
      
      if (onMarkAllAsRead) {
        onMarkAllAsRead();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  const handleNotificationPress = async (notification: ReferralNotification) => {
    try {
      if (!notification.read) {
        await referralNotificationService.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      }
      
      if (onNotificationPress) {
        onNotificationPress(notification);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };
  
  // Get icon based on notification type
  const getIcon = (type: ReferralNotification['type']) => {
    switch (type) {
      case 'milestone':
        return 'trophy';
      case 'referral':
        return 'people';
      case 'subscription_extension':
        return 'calendar';
      case 'badge':
        return 'ribbon';
      default:
        return 'gift';
    }
  };
  
  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Render notification item
  const renderNotificationItem = ({ item }: { item: ReferralNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: item.read ? 'transparent' : 'rgba(52, 152, 219, 0.1)' }
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        {item.type === 'badge' && item.badgeType ? (
          <ReferralBadge type={item.badgeType} size="small" />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: primaryColor }]}>
            <Ionicons name={getIcon(item.type)} size={20} color="#fff" />
          </View>
        )}
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: textColor }]}>
          {item.title}
        </Text>
        
        <Text style={[styles.notificationMessage, { color: textColor }]}>
          {item.message}
        </Text>
        
        <Text style={[styles.notificationTime, { color: textColor }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      {!item.read && (
        <View style={[styles.unreadIndicator, { backgroundColor: primaryColor }]} />
      )}
    </TouchableOpacity>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={textColor} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyText, { color: textColor }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptySubtext, { color: textColor }]}>
        Refer friends to start earning rewards
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Notifications
        </Text>
        
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: primaryColor }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Notification List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  notificationIcon: {
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
    alignSelf: 'center',
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

export default ReferralNotificationList;