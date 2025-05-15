import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageStyle } from 'react-native';

export interface AdminHeaderProps {
  title: string;
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  notifications?: {
    count: number;
    onClick: () => void;
  };
  onLogout: () => void;
  onSettings: () => void;
}

/**
 * AdminHeader - An organism component for the admin dashboard header
 * 
 * @param title - The header title
 * @param user - User information
 * @param notifications - Optional notification information
 * @param onLogout - Logout handler
 * @param onSettings - Settings handler
 */
export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  user,
  notifications,
  onLogout,
  onSettings,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.actions}>
        {notifications && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={notifications.onClick}
          >
            {/* Notification icon would go here */}
            <View style={styles.notificationIcon}>
              {/* Icon placeholder */}
              <View style={styles.iconPlaceholder} />
            </View>
            
            {notifications.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notifications.count > 99 ? '99+' : notifications.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
          {/* Settings icon would go here */}
          <View style={styles.iconPlaceholder} />
        </TouchableOpacity>
        
        <View style={styles.userContainer}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.role}</Text>
          </View>
          
          <View style={styles.avatar}>
            {user.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                style={styles.avatarImage as ImageStyle} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  notificationButton: {
    position: 'relative',
    marginRight: 16,
  },
  notificationIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: '#6B7280',
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  logoutText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});