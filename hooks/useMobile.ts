import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

// Mobile Camera Hook
export const useMobileCamera = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // PWA Camera Access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        return true;
      } else {
        // React Native Camera Permissions
        const { Camera } = require('expo-camera');
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        return status === 'granted';
      }
    } catch (err) {
      setError('Camera permission denied');
      setHasPermission(false);
      return false;
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'web') {
        // PWA Implementation
        return new Promise(resolve => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';

          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target && target.files) {
              const file = target.files[0];
              resolve(file);
            }
          };

          input.click();
        });
      } else {
        // React Native Implementation
        const { Camera } = require('expo-camera');
        const { launchCameraAsync, MediaTypeOptions } = require('expo-image-picker');

        const result = await launchCameraAsync({
          mediaTypes: MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled) {
          return result.assets[0];
        }
        return null;
      }
    } catch (err) {
      setError('Failed to capture photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestCameraPermission]);

  return {
    hasPermission,
    isLoading,
    error,
    requestCameraPermission,
    capturePhoto,
  };
};

// Mobile Haptics Hook
export const useHaptics = () => {
  const lightImpact = useCallback(() => {
    if (Platform.OS === 'web') {
      // Web Vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else {
      // React Native Haptics
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const mediumImpact = useCallback(() => {
    if (Platform.OS === 'web') {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } else {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const success = useCallback(() => {
    if (Platform.OS === 'web') {
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    } else {
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const error = useCallback(() => {
    if (Platform.OS === 'web') {
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 100, 20]);
      }
    } else {
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  return {
    lightImpact,
    mediumImpact,
    success,
    error,
  };
};

// Offline Storage Hook
export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingBets, setPendingBets] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (Platform.OS === 'web') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
    } else {
      // React Native Network State
      const { NetInfo } = require('@react-native-community/netinfo');
      const unsubscribe = NetInfo.addEventListener((state: any) => {
        setIsOnline(state.isConnected);
      });
      return unsubscribe;
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const saveBetOffline = useCallback(async (betData: any) => {
    try {
      const offlineBets = await getOfflineBets();
      const newBet = {
        ...betData,
        id: `offline_${Date.now()}`,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      const updated = [...offlineBets, newBet];
      await saveOfflineBets(updated);
      setPendingBets(updated);

      return newBet;
    } catch (error) {
      console.error('Failed to save bet offline:', error);
      throw error;
    }
  }, []);

  const syncOfflineBets = useCallback(async () => {
    if (!isOnline) return;

    try {
      const offlineBets = await getOfflineBets();
      const unsyncedBets = offlineBets.filter((bet: any) => !bet.synced);

      for (const bet of unsyncedBets) {
        try {
          // Import BetSlipAPI from services
          const { default: BetSlipAPI } = require('../services/betSlipService');
          await BetSlipAPI.createBetSlip(bet);
          bet.synced = true;
        } catch (error) {
          console.error('Failed to sync bet:', bet.id, error);
        }
      }

      await saveOfflineBets(offlineBets);
      setPendingBets(offlineBets.filter((bet: any) => !bet.synced));
    } catch (error) {
      console.error('Failed to sync offline bets:', error);
    }
  }, [isOnline]);

  const getOfflineBets = async () => {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem('offline_bets');
      return stored ? JSON.parse(stored) : [];
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem('offline_bets');
      return stored ? JSON.parse(stored) : [];
    }
  };

  const saveOfflineBets = async (bets: any[]) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('offline_bets', JSON.stringify(bets));
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('offline_bets', JSON.stringify(bets));
    }
  };

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncOfflineBets();
    }
  }, [isOnline, syncOfflineBets]);

  return {
    isOnline,
    pendingBets,
    saveBetOffline,
    syncOfflineBets,
  };
};
