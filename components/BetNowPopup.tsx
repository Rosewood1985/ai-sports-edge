/**
 * BetNowPopup Component for React Native
 * Displays a popup with a "Bet Now" button after a purchase or other conversion event
 */

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Platform
} from 'react-native';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';
import BetNowButton from './BetNowButton';
import { useThemeColor } from '../hooks/useThemeColor';

interface BetNowPopupProps {
  show: boolean;
  onClose: () => void;
  teamId?: string;
  message?: string;
}

const BetNowPopup: React.FC<BetNowPopupProps> = ({
  show,
  onClose,
  teamId,
  message = "Ready to place your bet? Get started now!"
}) => {
  const [visible, setVisible] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const { trackButtonImpression } = useBettingAffiliate();
  
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1A1A1A' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const accentColor = useThemeColor({ light: '#FF0055', dark: '#FF3300' }, 'tint');
  
  // Handle visibility changes
  useEffect(() => {
    if (show) {
      setVisible(true);
      trackButtonImpression('popup', teamId);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setVisible(false);
      });
    }
  }, [show, fadeAnim, slideAnim, teamId, trackButtonImpression]);
  
  // Handle close
  const handleClose = () => {
    if (onClose) onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.popup,
            { 
              backgroundColor,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={[styles.closeButtonText, { color: textColor }]}>×</Text>
          </TouchableOpacity>
          
          <View style={styles.content}>
            <Text style={[styles.title, { color: textColor }]}>Boost Your Winnings!</Text>
            <Text style={[styles.message, { color: textColor }]}>{message}</Text>
            
            <View style={styles.buttonContainer}>
              <BetNowButton 
                size="large" 
                position="inline" 
                contentType="popup" 
                teamId={teamId}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  accentBar: {
    height: 6,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
});

export default BetNowPopup;