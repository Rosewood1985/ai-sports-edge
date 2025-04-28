import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import networkService, { ConnectionInfo, ConnectionStatus } from '../services/networkService';

/**
 * Network status indicator props
 */
interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
  style?: any;
}

/**
 * Component to display network connection status
 */
const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  position = 'top',
  style
}) => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = '#0a7ea4';
  
  // Initialize network service on mount
  useEffect(() => {
    networkService.initialize();
    
    // Get initial connection info
    const initialConnectionInfo = networkService.getCurrentConnectionInfo();
    if (initialConnectionInfo) {
      setConnectionInfo(initialConnectionInfo);
      updateVisibility(initialConnectionInfo.status);
    }
    
    // Subscribe to network status changes
    const unsubscribe = networkService.addListener((info) => {
      setConnectionInfo(info);
      updateVisibility(info.status);
    });
    
    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  /**
   * Update visibility based on connection status
   * @param status Connection status
   */
  const updateVisibility = (status: ConnectionStatus) => {
    if (status === ConnectionStatus.DISCONNECTED) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start();
    } else if (status === ConnectionStatus.CONNECTED && isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsVisible(false);
      });
    }
  };
  
  /**
   * Get status icon based on connection status
   */
  const getStatusIcon = () => {
    if (!connectionInfo) return 'help-circle';
    
    switch (connectionInfo.status) {
      case ConnectionStatus.CONNECTED:
        return 'wifi';
      case ConnectionStatus.DISCONNECTED:
        return 'cloud-offline';
      default:
        return 'help-circle';
    }
  };
  
  /**
   * Get status color based on connection status
   */
  const getStatusColor = () => {
    if (!connectionInfo) return '#999';
    
    switch (connectionInfo.status) {
      case ConnectionStatus.CONNECTED:
        return '#4CAF50';
      case ConnectionStatus.DISCONNECTED:
        return '#F44336';
      default:
        return '#999';
    }
  };
  
  /**
   * Get status text based on connection status
   */
  const getStatusText = () => {
    if (!connectionInfo) return 'Unknown';
    
    switch (connectionInfo.status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.DISCONNECTED:
        return 'Offline';
      default:
        return 'Unknown';
    }
  };
  
  /**
   * Handle press on the indicator
   */
  const handlePress = () => {
    if (showDetails) {
      setIsModalVisible(true);
    }
  };
  
  /**
   * Render connection details modal
   */
  const renderDetailsModal = () => {
    if (!connectionInfo) return null;
    
    return (
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Network Status</ThemedText>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statusIconContainer}>
              <Ionicons name={getStatusIcon() as any} size={48} color={getStatusColor()} />
              <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Connection Type:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {connectionInfo.type.charAt(0).toUpperCase() + connectionInfo.type.slice(1)}
                </ThemedText>
              </View>
              
              {connectionInfo.type === 'cellular' && connectionInfo.details.cellularGeneration && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Network:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {connectionInfo.details.cellularGeneration.toUpperCase()}
                  </ThemedText>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Internet Reachable:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {connectionInfo.isInternetReachable === null
                    ? 'Unknown'
                    : connectionInfo.isInternetReachable
                      ? 'Yes'
                      : 'No'}
                </ThemedText>
              </View>
              
              {connectionInfo.details.isConnectionExpensive !== undefined && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Metered Connection:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {connectionInfo.details.isConnectionExpensive ? 'Yes' : 'No'}
                  </ThemedText>
                </View>
              )}
              
              {connectionInfo.details.strength !== undefined && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Signal Strength:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {`${connectionInfo.details.strength}%`}
                  </ThemedText>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Last Updated:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {new Date(connectionInfo.timestamp).toLocaleTimeString()}
                </ThemedText>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                networkService.checkNetworkStatus();
              }}
            >
              <ThemedText style={styles.refreshButtonText}>Refresh Status</ThemedText>
            </TouchableOpacity>
            
            {connectionInfo.status === ConnectionStatus.DISCONNECTED && (
              <View style={styles.offlineTips}>
                <ThemedText style={styles.offlineTipsTitle}>While Offline:</ThemedText>
                <ThemedText style={styles.offlineTip}>• You can still view cached content</ThemedText>
                <ThemedText style={styles.offlineTip}>• New actions will be queued</ThemedText>
                <ThemedText style={styles.offlineTip}>• Data will sync when back online</ThemedText>
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>
    );
  };
  
  // Don't render anything if connected and not showing details
  if (!isVisible && !showDetails) {
    return null;
  }
  
  return (
    <>
      <Animated.View
        style={[
          styles.container,
          position === 'top' ? styles.topPosition : styles.bottomPosition,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: getStatusColor(),
          },
          style
        ]}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          activeOpacity={showDetails ? 0.7 : 1}
        >
          <Ionicons name={getStatusIcon() as any} size={16} color="#fff" />
          <Text style={styles.text}>{getStatusText()}</Text>
          {showDetails && (
            <Ionicons name="chevron-down" size={16} color="#fff" style={styles.detailsIcon} />
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {showDetails && renderDetailsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  topPosition: {
    top: 0,
  },
  bottomPosition: {
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailsIcon: {
    marginLeft: 8,
  },
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
  statusIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  detailLabel: {
    fontWeight: '500',
  },
  detailValue: {
    opacity: 0.8,
  },
  refreshButton: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  offlineTips: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  offlineTipsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  offlineTip: {
    marginBottom: 4,
  },
});

export default NetworkStatusIndicator;