import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import networkService, { ConnectionStatus } from '../services/networkService';

/**
 * Props for the OfflineAwareView component
 */
interface OfflineAwareViewProps extends ViewProps {
  /**
   * Content to display when online
   */
  children: React.ReactNode;

  /**
   * Optional custom content to display when offline
   */
  offlineContent?: React.ReactNode;

  /**
   * Whether to show a message when offline
   * @default true
   */
  showOfflineMessage?: boolean;

  /**
   * Custom offline message
   * @default "You're offline. Some features may be limited."
   */
  offlineMessage?: string;

  /**
   * Whether to show an icon when offline
   * @default true
   */
  showOfflineIcon?: boolean;

  /**
   * Whether to completely hide content when offline
   * @default false
   */
  hideWhenOffline?: boolean;

  /**
   * Whether to fade content when offline
   * @default false
   */
  fadeWhenOffline?: boolean;

  /**
   * Whether this component requires network connectivity
   * @default true
   */
  requiresConnectivity?: boolean;

  /**
   * Callback when network status changes
   */
  onNetworkStatusChange?: (isConnected: boolean) => void;
}

/**
 * A component that is aware of the network connection status and can display
 * different content when offline.
 */
const OfflineAwareView: React.FC<OfflineAwareViewProps> = ({
  children,
  offlineContent,
  showOfflineMessage = true,
  offlineMessage = "You're offline. Some features may be limited.",
  showOfflineIcon = true,
  hideWhenOffline = false,
  fadeWhenOffline = false,
  requiresConnectivity = true,
  onNetworkStatusChange,
  style,
  ...props
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Subscribe to network status changes
  useEffect(() => {
    // Initialize network service if not already initialized
    networkService.initialize();

    // Get initial connection status
    const initialConnectionInfo = networkService.getCurrentConnectionInfo();
    const initialIsConnected = initialConnectionInfo?.status === ConnectionStatus.CONNECTED;
    setIsConnected(initialIsConnected);

    // Notify callback if provided
    if (onNetworkStatusChange) {
      onNetworkStatusChange(initialIsConnected);
    }

    // Subscribe to network status changes
    const unsubscribe = networkService.addListener(info => {
      const connected = info.status === ConnectionStatus.CONNECTED;
      setIsConnected(connected);

      // Notify callback if provided
      if (onNetworkStatusChange) {
        onNetworkStatusChange(connected);
      }
    });

    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, [onNetworkStatusChange]);

  // If connected or doesn't require connectivity, render children normally
  if (isConnected || !requiresConnectivity) {
    return (
      <View style={[styles.container, style]} {...props}>
        {children}
      </View>
    );
  }

  // If offline and should hide content, render nothing or offline content
  if (hideWhenOffline) {
    if (offlineContent) {
      return (
        <View style={[styles.container, style]} {...props}>
          {offlineContent}
        </View>
      );
    }

    if (showOfflineMessage) {
      return (
        <View style={[styles.container, styles.offlineContainer, style]} {...props}>
          {showOfflineIcon && (
            <Ionicons name="cloud-offline" size={24} color="#F44336" style={styles.offlineIcon} />
          )}
          <ThemedText style={styles.offlineText}>{offlineMessage}</ThemedText>
        </View>
      );
    }

    return null;
  }

  // If offline and should fade content, render children with overlay
  if (fadeWhenOffline) {
    return (
      <View style={[styles.container, style]} {...props}>
        <View style={styles.contentContainer}>{children}</View>

        <View style={styles.offlineOverlay}>
          {offlineContent || (
            <View style={styles.offlineMessageContainer}>
              {showOfflineIcon && (
                <Ionicons
                  name="cloud-offline"
                  size={24}
                  color="#F44336"
                  style={styles.offlineIcon}
                />
              )}
              {showOfflineMessage && (
                <ThemedText style={styles.offlineText}>{offlineMessage}</ThemedText>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  // If offline and has custom offline content, render that
  if (offlineContent) {
    return (
      <View style={[styles.container, style]} {...props}>
        {children}
        <View style={styles.offlineContentContainer}>{offlineContent}</View>
      </View>
    );
  }

  // Otherwise, render children with offline message
  return (
    <View style={[styles.container, style]} {...props}>
      {children}

      {showOfflineMessage && (
        <View style={styles.offlineMessageBanner}>
          {showOfflineIcon && (
            <Ionicons
              name="cloud-offline"
              size={16}
              color="#fff"
              style={styles.offlineBannerIcon}
            />
          )}
          <ThemedText style={styles.offlineBannerText}>{offlineMessage}</ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
  },
  offlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineIcon: {
    marginBottom: 8,
  },
  offlineText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
  },
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  offlineMessageContainer: {
    alignItems: 'center',
    padding: 20,
  },
  offlineContentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  offlineMessageBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerIcon: {
    marginRight: 8,
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OfflineAwareView;
