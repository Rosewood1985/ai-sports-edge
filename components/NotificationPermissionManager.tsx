import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import notificationService, { NotificationPermissionStatus } from '../services/notificationService';
import { analyticsService } from '../services/analyticsService';

/**
 * Props for the NotificationPermissionManager component
 */
interface NotificationPermissionManagerProps {
  /**
   * Whether to show the permission prompt automatically
   * @default true
   */
  autoPrompt?: boolean;
  
  /**
   * Delay before showing the auto prompt (in milliseconds)
   * @default 2000
   */
  autoPromptDelay?: number;
  
  /**
   * Whether to show a reminder if permission is denied
   * @default true
   */
  showReminder?: boolean;
  
  /**
   * Callback when permission status changes
   */
  onPermissionChange?: (status: NotificationPermissionStatus) => void;
  
  /**
   * Children components
   */
  children?: React.ReactNode;
}

/**
 * Component to manage notification permissions
 */
const NotificationPermissionManager: React.FC<NotificationPermissionManagerProps> = ({
  autoPrompt = true,
  autoPromptDelay = 2000,
  showReminder = true,
  onPermissionChange,
  children
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(
    NotificationPermissionStatus.UNDETERMINED
  );
  const [isReminderVisible, setIsReminderVisible] = useState<boolean>(false);
  const [hasPrompted, setHasPrompted] = useState<boolean>(false);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = '#0a7ea4';
  
  // Initialize notification service and check permission status
  useEffect(() => {
    const initializeAndCheck = async () => {
      // Initialize notification service
      await notificationService.initialize();
      
      // Check permission status
      const status = await notificationService.checkPermissionStatus();
      setPermissionStatus(status);
      
      // Notify callback if provided
      if (onPermissionChange) {
        onPermissionChange(status);
      }
      
      // Show reminder if permission is denied and reminder is enabled
      if (status === NotificationPermissionStatus.DENIED && showReminder) {
        setIsReminderVisible(true);
      }
    };
    
    initializeAndCheck();
  }, [onPermissionChange, showReminder]);
  
  // Auto prompt for permission if enabled
  useEffect(() => {
    if (
      autoPrompt &&
      !hasPrompted &&
      permissionStatus === NotificationPermissionStatus.UNDETERMINED
    ) {
      const timer = setTimeout(() => {
        requestPermission();
        setHasPrompted(true);
      }, autoPromptDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoPrompt, autoPromptDelay, hasPrompted, permissionStatus]);
  
  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    try {
      // Request permission
      const status = await notificationService.requestPermission();
      
      // Update status
      setPermissionStatus(status);
      
      // Notify callback if provided
      if (onPermissionChange) {
        onPermissionChange(status);
      }
      
      // Show reminder if permission is denied and reminder is enabled
      if (status === NotificationPermissionStatus.DENIED && showReminder) {
        setIsReminderVisible(true);
      }
      
      // Track event
      analyticsService.trackEvent('notification_permission_requested', {
        status
      });
      
      return status;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return NotificationPermissionStatus.UNDETERMINED;
    }
  };
  
  /**
   * Open device settings
   */
  const openSettings = () => {
    // This would be implemented with actual settings navigation
    console.log('Opening device settings');
    
    // Track event
    analyticsService.trackEvent('notification_settings_opened');
    
    // Hide reminder
    setIsReminderVisible(false);
  };
  
  /**
   * Dismiss reminder
   */
  const dismissReminder = () => {
    setIsReminderVisible(false);
    
    // Track event
    analyticsService.trackEvent('notification_reminder_dismissed');
  };
  
  /**
   * Render permission reminder modal
   */
  const renderReminder = () => {
    return (
      <Modal
        visible={isReminderVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissReminder}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Enable Notifications</ThemedText>
              <TouchableOpacity onPress={dismissReminder}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Ionicons name="notifications" size={48} color={primaryColor} style={styles.modalIcon} />
              <ThemedText style={styles.modalText}>
                Stay updated with game alerts, betting opportunities, and results by enabling notifications.
              </ThemedText>
              
              <ThemedText style={styles.modalInstructions}>
                {Platform.OS === 'ios'
                  ? 'To enable notifications, go to Settings > Notifications > AI Sports Edge and turn on "Allow Notifications".'
                  : 'To enable notifications, go to Settings > Apps > AI Sports Edge > Notifications and turn on "Show notifications".'}
              </ThemedText>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.secondaryButton} onPress={dismissReminder}>
                <ThemedText style={styles.secondaryButtonText}>Not Now</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.primaryButton} onPress={openSettings}>
                <ThemedText style={styles.primaryButtonText}>Open Settings</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    );
  };
  
  // Render children if provided
  if (children) {
    return (
      <>
        {children}
        {renderReminder()}
      </>
    );
  }
  
  // Render nothing if no children
  return renderReminder();
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  modalInstructions: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.8,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
  },
});

export default NotificationPermissionManager;