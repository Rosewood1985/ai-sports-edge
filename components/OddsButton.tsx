/**
 * OddsButton Component
 * 
 * A dynamic button that changes from "Get Odds" to "Bet Now on FanDuel" after purchase.
 * Handles both Stripe payment processing and FanDuel affiliate link redirection.
 */

import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  View
} from 'react-native';
import * as Linking from 'expo-linking';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';

import { analyticsService } from '../services/analyticsService';
import { gameUrlService, BettingSite } from '../services/gameUrlService';
import { bettingAffiliateService } from '../services/bettingAffiliateService';
import { FANDUEL_CONFIG, STRIPE_CONFIG, API_CONFIG } from '../config/affiliateConfig';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import BetNowPopup from './BetNowPopup';

// Define the game object structure
interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  fanduelEventId?: string;
  sport?: string;
  league?: string;
  startTime?: Date;
}

// Define the component props
interface OddsButtonProps {
  game: Game;
  userId: string;
  hasPurchasedOdds: boolean;
  onPurchaseSuccess?: () => void;
  style?: any;
  size?: 'small' | 'medium' | 'large';
  affiliateId?: string; // Optional override for the default affiliate ID
}

/**
 * OddsButton Component
 */
const OddsButton: React.FC<OddsButtonProps> = ({
  game,
  userId,
  hasPurchasedOdds,
  onPurchaseSuccess,
  style,
  size = 'medium',
  affiliateId = FANDUEL_CONFIG.AFFILIATE_ID
}) => {
  // Initialize Stripe
  const stripe = useStripe();
  
  // State
  const [isPurchased, setIsPurchased] = useState(hasPurchasedOdds);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  
  // Get theme colors
  const backgroundColor = useThemeColor({
    light: isPurchased ? Colors.neon.blue : Colors.neon.orange,
    dark: isPurchased ? Colors.neon.blue : Colors.neon.orange
  }, 'background');
  
  const textColor = useThemeColor({ 
    light: '#FFFFFF', 
    dark: '#FFFFFF' 
  }, 'text');

  // Update state when props change
  useEffect(() => {
    setIsPurchased(hasPurchasedOdds);
  }, [hasPurchasedOdds]);

  /**
   * Handle Stripe payment
   */
  const handleStripePayment = async () => {
    // Check if Stripe is available
    if (!stripe) {
      Alert.alert('Error', 'Stripe is not available. Please try again later.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Track analytics event
      analyticsService.trackEvent('odds_purchase_initiated', {
        gameId: game.id,
        userId,
        timestamp: Date.now(),
      });
      
      // Create payment intent on server
      const { data } = await axios.post(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CREATE_PAYMENT, {
        userId,
        productId: game.id,
        price: STRIPE_CONFIG.PRICING.ODDS_ACCESS,
        productName: `Odds for ${game.homeTeam} vs ${game.awayTeam}`,
      });

      const { clientSecret } = data;

      // Initialize payment sheet
      const initSheet = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'AI Sports Edge',
      });

      if (initSheet.error) {
        Alert.alert('Error', initSheet.error.message);
        setIsLoading(false);
        return;
      }

      // Present payment sheet
      const { error } = await stripe.presentPaymentSheet();

      if (error) {
        // Track cancelled payment
        analyticsService.trackEvent('odds_purchase_cancelled', {
          gameId: game.id,
          userId,
          error: error.message,
          timestamp: Date.now(),
        });
        
        // Only show alert if not cancelled by user
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message);
        }
      } else {
        // Track successful payment
        analyticsService.trackEvent('odds_purchase_completed', {
          gameId: game.id,
          userId,
          price: STRIPE_CONFIG.PRICING.ODDS_ACCESS,
          timestamp: Date.now(),
        });
        
        // Update state immediately without showing alert
        console.log('Payment successful, updating button state');
        setIsPurchased(true);
        setJustPurchased(true);
        setShowPopup(true);
        
        // Update Firestore with purchase record in the background
        updatePurchaseRecord(game.id, userId).catch(err =>
          console.error('Background purchase record update failed:', err)
        );
        
        // Call success callback immediately
        if (onPurchaseSuccess) {
          console.log('Calling onPurchaseSuccess callback');
          onPurchaseSuccess();
        }
        
        // No alert - seamless transition to bet button with popup
      }
    } catch (error) {
      // Track payment error
      analyticsService.trackEvent('odds_purchase_error', {
        gameId: game.id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
      
      Alert.alert('Error', 'Unable to process payment. Please try again later.');
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update purchase record in Firestore and cross-platform sync
   */
  const updatePurchaseRecord = async (gameId: string, userId: string) => {
    try {
      // Update in backend
      await axios.post(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.UPDATE_PURCHASE, {
        userId,
        gameId,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      });
      
      // Also update in cross-platform sync service
      const { crossPlatformSyncService } = require('../services/crossPlatformSyncService');
      await crossPlatformSyncService.recordOddsPurchase(gameId);
      
      console.log('Purchase record updated in both backend and cross-platform sync');
    } catch (error) {
      console.error('Error updating purchase record:', error);
    }
  };

  /**
   * Handle FanDuel redirection
   */
  const handleFanDuelRedirect = async () => {
    try {
      setIsLoading(true);
      
      // Track affiliate link click
      bettingAffiliateService.trackButtonClick('odds_button', affiliateId, game.id, userId, game.id);
      
      // Get game-specific URL if available
      let baseUrl = FANDUEL_CONFIG.BASE_URL;
      if (game.fanduelEventId) {
        baseUrl = `${FANDUEL_CONFIG.BASE_URL}event/${game.fanduelEventId}`;
      } else {
        // Try to get URL from GameUrlService
        const gameUrl = await gameUrlService.getGameUrl(game.id, BettingSite.FANDUEL);
        if (gameUrl) {
          baseUrl = gameUrl;
        }
      }
      
      // Generate affiliate link
      const affiliateUrl = await bettingAffiliateService.generateAffiliateLink(
        baseUrl,
        affiliateId,
        undefined, // No team ID needed as we're using game-specific URL
        userId,
        game.id
      );
      
      // Track conversion
      bettingAffiliateService.trackConversion('odds_to_bet', 0, userId);
      
      // Open URL
      const supported = await Linking.canOpenURL(affiliateUrl);
      if (supported) {
        await Linking.openURL(affiliateUrl);
      } else {
        Alert.alert('Error', 'Unable to open FanDuel. Please try again.');
      }
    } catch (error) {
      console.error('Error redirecting to FanDuel:', error);
      Alert.alert('Error', 'Unable to open FanDuel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get button size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      case 'medium':
      default:
        return styles.mediumButton;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          getSizeStyles(),
          { backgroundColor },
          isPurchased ? styles.betButton : styles.oddsButton,
          style
        ]}
        onPress={isPurchased ? handleFanDuelRedirect : handleStripePayment}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={[styles.buttonText, { color: textColor }]}>
            {isPurchased ? 'Bet Now on FanDuel' : 'Get Odds'}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Auto-show popup for immediate betting after purchase */}
      <BetNowPopup
        show={showPopup}
        autoShow={justPurchased}
        onClose={() => setShowPopup(false)}
        teamId={game.homeTeam}
        userId={userId}
        gameId={game.id}
        message={justPurchased
          ? "Your odds are ready! Place your bet now for the best experience."
          : "Ready to place your bet? Get started now!"}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  oddsButton: {
    backgroundColor: Colors.neon.orange,
  },
  betButton: {
    backgroundColor: Colors.neon.blue,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OddsButton;