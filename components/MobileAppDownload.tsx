import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ThemedText } from './ThemedText';
import QRCode from 'react-native-qrcode-svg';

interface MobileAppDownloadProps {
  onClose?: () => void;
  appStoreUrl: string;
  playStoreUrl: string;
  webAppUrl: string;
}

/**
 * Component to display mobile app download options
 * Shows app store buttons on mobile devices
 * Shows QR code on tablets and desktops
 */
const MobileAppDownload: React.FC<MobileAppDownloadProps> = ({
  onClose,
  appStoreUrl,
  playStoreUrl,
  webAppUrl
}) => {
  const { colors, isDark } = useTheme();
  const [isLargeDevice, setIsLargeDevice] = useState(false);
  
  // Determine if device is a tablet or desktop
  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    const isTabletOrDesktop = width >= 768 || height >= 768;
    setIsLargeDevice(isTabletOrDesktop);
  }, []);
  
  // Determine if current platform is iOS
  const isIOS = Platform.OS === 'ios';
  
  // Determine if current platform is web
  const isWeb = Platform.OS === 'web';
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)' }
    ]}>
      {/* Close button */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="phone-portrait-outline"
            size={40}
            color={colors.primary}
            style={styles.icon}
          />
          <ThemedText style={styles.title}>Get the Mobile App</ThemedText>
          <ThemedText style={styles.subtitle}>
            Download our app for a better experience
          </ThemedText>
        </View>
        
        {/* QR Code for large devices */}
        {isLargeDevice && (
          <View style={styles.qrContainer}>
            <QRCode
              value={webAppUrl}
              size={200}
              color={isDark ? '#FFFFFF' : '#000000'}
              backgroundColor={isDark ? '#000000' : '#FFFFFF'}
            />
            <ThemedText style={styles.qrText}>
              Scan this QR code with your mobile device
            </ThemedText>
          </View>
        )}
        
        {/* Download buttons */}
        <View style={styles.buttonsContainer}>
          {/* iOS App Store button */}
          <TouchableOpacity
            style={[
              styles.downloadButton,
              { backgroundColor: isDark ? '#333333' : '#FFFFFF' }
            ]}
            onPress={() => {
              if (isWeb) {
                // @ts-ignore
                window.open(appStoreUrl, '_blank');
              }
            }}
          >
            <Ionicons
              name="logo-apple"
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
              style={styles.buttonIcon}
            />
            <View style={styles.buttonTextContainer}>
              <ThemedText style={styles.buttonSmallText}>
                Download on the
              </ThemedText>
              <ThemedText style={styles.buttonLargeText}>
                App Store
              </ThemedText>
            </View>
          </TouchableOpacity>
          
          {/* Android Play Store button */}
          <TouchableOpacity
            style={[
              styles.downloadButton,
              { backgroundColor: isDark ? '#333333' : '#FFFFFF' }
            ]}
            onPress={() => {
              if (isWeb) {
                // @ts-ignore
                window.open(playStoreUrl, '_blank');
              }
            }}
          >
            <Ionicons
              name="logo-google-playstore"
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
              style={styles.buttonIcon}
            />
            <View style={styles.buttonTextContainer}>
              <ThemedText style={styles.buttonSmallText}>
                GET IT ON
              </ThemedText>
              <ThemedText style={styles.buttonLargeText}>
                Google Play
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Additional info */}
        <ThemedText style={styles.additionalInfo}>
          Our mobile app offers exclusive features and a seamless betting experience
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 1001,
  },
  content: {
    width: '90%',
    maxWidth: 500,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
  },
  qrText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonTextContainer: {
    flexDirection: 'column',
  },
  buttonSmallText: {
    fontSize: 10,
    opacity: 0.8,
  },
  buttonLargeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  additionalInfo: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 16,
  },
});

export default MobileAppDownload;