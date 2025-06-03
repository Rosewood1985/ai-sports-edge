import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
} from 'react-native';

import { useMobileCamera, useHaptics } from '../../../hooks/useMobile';
import MobileButton from '../../atoms/mobile/MobileButton';

interface MobileCameraCaptureProps {
  onCapture: (photo: any) => void;
  onCancel: () => void;
  userTier: string;
  theme?: 'dark' | 'light';
}

export const MobileCameraCapture: React.FC<MobileCameraCaptureProps> = ({
  onCapture,
  onCancel,
  userTier,
  theme = 'dark',
}) => {
  const { hasPermission, isLoading, error, requestCameraPermission, capturePhoto } =
    useMobileCamera();
  const [showCamera, setShowCamera] = useState(false);
  const haptics = useHaptics();

  const handleCapture = useCallback(async () => {
    haptics.mediumImpact();

    try {
      const photo = await capturePhoto();
      if (photo) {
        onCapture(photo);
        haptics.success();
      }
    } catch (err) {
      haptics.error();
      console.error('Capture failed:', err);
    }
  }, [capturePhoto, onCapture, haptics]);

  const handleCancel = useCallback(() => {
    haptics.lightImpact();
    onCancel();
  }, [onCancel, haptics]);

  if (!hasPermission) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme === 'dark' ? '#FFFFFF' : '#111827',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Camera Permission Required
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          We need camera access to scan your bet slips automatically
        </Text>
        <MobileButton
          title="Grant Permission"
          variant="primary"
          size="lg"
          onPress={requestCameraPermission}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <MobileButton title="Cancel" variant="outline" size="sm" onPress={handleCancel} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
          }}
        >
          Scan Bet Slip
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Camera View */}
      <View style={{ flex: 1, position: 'relative' }}>
        {Platform.OS === 'web' ? (
          // PWA Camera Implementation
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#000000',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                marginBottom: 24,
              }}
            >
              Position bet slip in camera view
            </Text>
          </View>
        ) : (
          // React Native Camera Implementation
          <View style={{ flex: 1 }}>
            {/* Camera component would go here */}
            <Text
              style={{
                color: '#FFFFFF',
                textAlign: 'center',
                marginTop: 50,
              }}
            >
              Camera View (React Native)
            </Text>
          </View>
        )}

        {/* Overlay with scanning guide */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Scanning Frame */}
          <View
            style={{
              width: 280,
              height: 180,
              borderWidth: 2,
              borderColor: '#3B82F6',
              borderRadius: 12,
              backgroundColor: 'transparent',
            }}
          />

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              marginTop: 16,
              textAlign: 'center',
              paddingHorizontal: 24,
            }}
          >
            Position your bet slip within the frame
          </Text>
        </View>
      </View>

      {/* Capture Button */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 32,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={handleCapture}
          disabled={isLoading}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#3B82F6',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: '#FFFFFF',
          }}
        >
          {isLoading ? (
            <Text style={{ color: '#FFFFFF' }}>...</Text>
          ) : (
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
              }}
            />
          )}
        </TouchableOpacity>

        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 12,
            marginTop: 8,
          }}
        >
          Tap to capture
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default MobileCameraCapture;
