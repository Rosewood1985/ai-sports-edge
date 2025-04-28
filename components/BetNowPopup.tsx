/**
 * BetNowPopup Component for React Native
 * Displays a popup with a "Bet Now" button after a purchase or other conversion event
 * Enhanced for seamless transitions after purchases
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { bettingAffiliateService } from '../services/bettingAffiliateService';
import { fanduelCookieService } from '../services/fanduelCookieService';
import { microtransactionService } from '../services/microtransactionService';

interface BetNowPopupProps {
  show: boolean;
  onClose: () => void;
  teamId?: string;
  userId?: string;
  gameId?: string;
  message?: string;
  autoShow?: boolean; // Whether to show the popup automatically without animation delay
}

const BetNowPopup: React.FC<BetNowPopupProps> = ({
  show,
  onClose,
  teamId,
  userId,
  gameId,
  message = "Ready to place your bet? Get started now!",
  autoShow = false
}) => {
  const [visible, setVisible] = useState(autoShow);
  const fadeAnim = new Animated.Value(autoShow ? 1 : 0);
  const slideAnim = new Animated.Value(autoShow ? 0 : 50);
  const { trackButtonImpression } = useBettingAffiliate();
  
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1A1A1A' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const accentColor = useThemeColor({ light: '#FF0055', dark: '#FF3300' }, 'tint');
  
  // Handle visibility changes
  useEffect(() => {
    if (show || autoShow) {
      setVisible(true);
      trackButtonImpression('popup', teamId, userId, gameId);
      
      // Initialize cookies for FanDuel if this is a new popup
      if (userId && gameId && teamId) {
        fanduelCookieService.initializeCookies(userId, gameId, teamId)
          .then(() => {
            // Track popup shown with cookies
            fanduelCookieService.trackInteraction('popup_shown', {
              teamId,
              gameId,
              autoShow,
            });
            
            // Track microtransaction opportunity
            microtransactionService.trackInteraction('impression', {
              type: 'bet_now_popup',
              gameId,
              teamId,
              cookieEnabled: true,
            }, { id: userId });
          })
          .catch(error => {
            console.error('Error initializing FanDuel cookies:', error);
          });
      }
      
      // Animate in - faster for autoShow
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: autoShow ? 150 : 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: autoShow ? 150 : 300,
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
  }, [show, autoShow, fadeAnim, slideAnim, teamId, userId, gameId, trackButtonImpression]);
  
  // Track if user has interacted with the popup
  const hasInteracted = useRef(false);
  
  // Auto-close timer for autoShow mode
  useEffect(() => {
    let timer: number | undefined;
    if (autoShow && visible) {
      // Auto-close after 5 minutes if not interacted with
      timer = setTimeout(() => {
        if (!hasInteracted.current) {
          handleClose();
        }
      }, 5 * 60 * 1000) as unknown as number;
      
      // Check if this is after a purchase using cross-platform sync
      if (gameId) {
        try {
          const { crossPlatformSyncService } = require('../services/crossPlatformSyncService');
          const isPurchased = crossPlatformSyncService.hasPurchasedOdds(gameId);
          
          if (isPurchased) {
            // Track conversion opportunity
            bettingAffiliateService.trackConversion('popup_shown_after_purchase', 0, userId);
          }
        } catch (error) {
          console.warn('Could not check purchase status:', error);
        }
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoShow, visible, gameId, userId]);
  
  // Handle close
  const handleClose = () => {
    hasInteracted.current = true;
    
    // Track popup close
    if (userId && gameId) {
      // Track interaction in FanDuel cookie service
      fanduelCookieService.trackInteraction('popup_closed', {
        teamId,
        gameId,
        autoShow,
      });
      
      // Track microtransaction interaction
      microtransactionService.trackInteraction('dismiss', {
        type: 'bet_now_popup',
        gameId,
        teamId,
        cookieEnabled: true,
      }, { id: userId });
    }
    
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
                userId={userId}
                gameId={gameId}
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