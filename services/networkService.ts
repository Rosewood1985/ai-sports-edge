import { Platform } from 'react-native';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { analyticsService } from './analyticsService';

/**
 * Network connection status
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  UNKNOWN = 'unknown'
}

/**
 * Network connection type
 */
export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  UNKNOWN = 'unknown',
  NONE = 'none'
}

/**
 * Network connection info
 */
export interface ConnectionInfo {
  status: ConnectionStatus;
  type: ConnectionType;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  details: {
    isConnectionExpensive?: boolean;
    cellularGeneration?: string;
    strength?: number;
  };
  timestamp: number;
}

/**
 * Network status change listener
 */
export type NetworkStatusListener = (info: ConnectionInfo) => void;

/**
 * Service for monitoring network connectivity and handling offline mode
 */
class NetworkService {
  private currentStatus: ConnectionStatus = ConnectionStatus.UNKNOWN;
  private currentConnectionInfo: ConnectionInfo | null = null;
  private listeners: NetworkStatusListener[] = [];
  private netInfoSubscription: NetInfoSubscription | null = null;
  private reconnectionAttempts: number = 0;
  private readonly MAX_RECONNECTION_ATTEMPTS = 5;
  private reconnectionTimer: any = null;
  private isReconnecting: boolean = false;
  
  /**
   * Initialize the network service
   */
  initialize(): void {
    // Subscribe to network info changes
    this.netInfoSubscription = NetInfo.addEventListener(this.handleNetInfoChange);
    
    // Get initial network state
    this.checkNetworkStatus();
    
    console.log('Network service initialized');
  }
  
  /**
   * Clean up the network service
   */
  cleanup(): void {
    // Unsubscribe from network info changes
    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }
    
    // Clear reconnection timer
    this.clearReconnectionTimer();
    
    console.log('Network service cleaned up');
  }
  
  /**
   * Check current network status
   * @returns Promise with connection info
   */
  async checkNetworkStatus(): Promise<ConnectionInfo> {
    try {
      const netInfo = await NetInfo.fetch();
      const connectionInfo = this.createConnectionInfo(netInfo);
      
      // Update current status
      this.currentStatus = connectionInfo.status;
      this.currentConnectionInfo = connectionInfo;
      
      return connectionInfo;
    } catch (error) {
      console.error('Error checking network status:', error);
      analyticsService.trackError(error as Error, { method: 'checkNetworkStatus' });
      
      // Return unknown status
      const unknownConnectionInfo: ConnectionInfo = {
        status: ConnectionStatus.UNKNOWN,
        type: ConnectionType.UNKNOWN,
        isConnected: false,
        isInternetReachable: null,
        details: {},
        timestamp: Date.now()
      };
      
      this.currentStatus = ConnectionStatus.UNKNOWN;
      this.currentConnectionInfo = unknownConnectionInfo;
      
      return unknownConnectionInfo;
    }
  }
  
  /**
   * Get current connection info
   * @returns Current connection info or null if not available
   */
  getCurrentConnectionInfo(): ConnectionInfo | null {
    return this.currentConnectionInfo;
  }
  
  /**
   * Check if device is currently connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.currentStatus === ConnectionStatus.CONNECTED;
  }
  
  /**
   * Add network status change listener
   * @param listener Function to call when network status changes
   * @returns Function to remove the listener
   */
  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.push(listener);
    
    // If we already have connection info, notify the listener immediately
    if (this.currentConnectionInfo) {
      listener(this.currentConnectionInfo);
    }
    
    // Return function to remove the listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Handle NetInfo state change
   * @param state New NetInfo state
   */
  private handleNetInfoChange = (state: NetInfoState): void => {
    const connectionInfo = this.createConnectionInfo(state);
    const previousStatus = this.currentStatus;
    
    // Update current status
    this.currentStatus = connectionInfo.status;
    this.currentConnectionInfo = connectionInfo;
    
    // Track status change in analytics
    if (previousStatus !== connectionInfo.status) {
      analyticsService.trackEvent('network_status_change', {
        previousStatus,
        currentStatus: connectionInfo.status,
        connectionType: connectionInfo.type
      });
      
      // Handle reconnection if needed
      if (previousStatus === ConnectionStatus.DISCONNECTED && 
          connectionInfo.status === ConnectionStatus.CONNECTED) {
        this.handleReconnection();
      } else if (previousStatus === ConnectionStatus.CONNECTED && 
                connectionInfo.status === ConnectionStatus.DISCONNECTED) {
        this.handleDisconnection();
      }
    }
    
    // Notify listeners
    this.notifyListeners(connectionInfo);
  };
  
  /**
   * Create connection info from NetInfo state
   * @param state NetInfo state
   * @returns Connection info
   */
  private createConnectionInfo(state: NetInfoState): ConnectionInfo {
    // Determine connection status
    let status: ConnectionStatus;
    if (state.isConnected === true && state.isInternetReachable === true) {
      status = ConnectionStatus.CONNECTED;
    } else if (state.isConnected === false) {
      status = ConnectionStatus.DISCONNECTED;
    } else {
      status = ConnectionStatus.UNKNOWN;
    }
    
    // Determine connection type
    let type: ConnectionType;
    switch (state.type) {
      case 'wifi':
        type = ConnectionType.WIFI;
        break;
      case 'cellular':
        type = ConnectionType.CELLULAR;
        break;
      case 'ethernet':
        type = ConnectionType.ETHERNET;
        break;
      case 'none':
        type = ConnectionType.NONE;
        break;
      default:
        type = ConnectionType.UNKNOWN;
    }
    
    // Create connection info
    return {
      status,
      type,
      isConnected: state.isConnected === true,
      isInternetReachable: state.isInternetReachable,
      details: {
        isConnectionExpensive: state.details?.isConnectionExpensive,
        cellularGeneration: state.details?.cellularGeneration,
        strength: state.details?.strength
      },
      timestamp: Date.now()
    };
  }
  
  /**
   * Notify all listeners of network status change
   * @param connectionInfo Current connection info
   */
  private notifyListeners(connectionInfo: ConnectionInfo): void {
    this.listeners.forEach(listener => {
      try {
        listener(connectionInfo);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }
  
  /**
   * Handle reconnection to network
   */
  private handleReconnection(): void {
    console.log('Network reconnected');
    
    // Reset reconnection attempts
    this.reconnectionAttempts = 0;
    this.isReconnecting = false;
    
    // Clear reconnection timer
    this.clearReconnectionTimer();
    
    // Trigger sync of offline data
    this.triggerOfflineSync();
  }
  
  /**
   * Handle disconnection from network
   */
  private handleDisconnection(): void {
    console.log('Network disconnected');
    
    // Start reconnection attempts if not already reconnecting
    if (!this.isReconnecting) {
      this.isReconnecting = true;
      this.reconnectionAttempts = 0;
      this.scheduleReconnectionCheck();
    }
  }
  
  /**
   * Schedule reconnection check
   */
  private scheduleReconnectionCheck(): void {
    // Clear any existing timer
    this.clearReconnectionTimer();
    
    // Calculate delay based on attempts (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, this.reconnectionAttempts), 30000);
    
    // Schedule reconnection check
    this.reconnectionTimer = setTimeout(() => {
      this.attemptReconnection();
    }, delay);
  }
  
  /**
   * Attempt to reconnect to network
   */
  private attemptReconnection(): void {
    if (this.reconnectionAttempts >= this.MAX_RECONNECTION_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      this.isReconnecting = false;
      return;
    }
    
    console.log(`Attempting to reconnect (attempt ${this.reconnectionAttempts + 1}/${this.MAX_RECONNECTION_ATTEMPTS})`);
    
    // Increment attempts
    this.reconnectionAttempts++;
    
    // Check network status
    this.checkNetworkStatus()
      .then(connectionInfo => {
        if (connectionInfo.status === ConnectionStatus.CONNECTED) {
          console.log('Reconnection successful');
          this.handleReconnection();
        } else {
          console.log('Reconnection failed, scheduling next attempt');
          this.scheduleReconnectionCheck();
        }
      })
      .catch(error => {
        console.error('Error during reconnection attempt:', error);
        this.scheduleReconnectionCheck();
      });
  }
  
  /**
   * Clear reconnection timer
   */
  private clearReconnectionTimer(): void {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
  }
  
  /**
   * Trigger sync of offline data
   */
  private triggerOfflineSync(): void {
    // This will be implemented as part of the offline actions queue
    console.log('Triggering offline data sync');
    
    // For now, just track the event
    analyticsService.trackEvent('offline_sync_triggered', {
      reconnectionAttempts: this.reconnectionAttempts,
      timestamp: Date.now()
    });
  }
}

export const networkService = new NetworkService();
export default networkService;