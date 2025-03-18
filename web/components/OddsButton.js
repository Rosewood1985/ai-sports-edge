/**
 * OddsButton Component for Web
 * 
 * A dynamic button that changes from "Get Odds" to "Bet Now on FanDuel" after purchase.
 * Handles both Stripe payment processing and FanDuel affiliate link redirection.
 * Ensures seamless transition between states with immediate popup after purchase.
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG, FANDUEL_CONFIG } from '../../config/affiliateConfig';
import BetNowPopup from './BetNowPopup';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.PUBLIC_KEY);

/**
 * OddsButton Component
 */
const OddsButton = ({ 
  game, 
  userId, 
  hasPurchasedOdds = false,
  onPurchaseSuccess,
  size = 'medium',
  affiliateId = FANDUEL_CONFIG.AFFILIATE_ID
}) => {
  // State
  const [isPurchased, setIsPurchased] = useState(hasPurchasedOdds);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);

  // Update state when props change or when purchased odds are updated
  useEffect(() => {
    setIsPurchased(hasPurchasedOdds);
    
    // Listen for purchased odds updates from crossPlatformSyncService
    const handlePurchasedOddsUpdated = (event) => {
      const { purchasedOdds } = event.detail;
      const hasGame = purchasedOdds.some(purchase => purchase.gameId === game.id);
      if (hasGame && !isPurchased) {
        console.log('OddsButton: Detected purchase update for game', game.id);
        setIsPurchased(true);
        setJustPurchased(true);
        setShowPopup(true);
        
        // Call success callback
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      }
    };
    
    // Add event listener
    window.addEventListener('purchasedOddsUpdated', handlePurchasedOddsUpdated);
    
    // Also check directly with crossPlatformSyncService
    if (window.crossPlatformSyncService && !isPurchased) {
      const hasPurchased = window.crossPlatformSyncService.hasPurchasedOdds(game.id);
      if (hasPurchased) {
        console.log('OddsButton: Direct check found purchase for game', game.id);
        setIsPurchased(true);
      }
    }
    
    // Clean up
    return () => {
      window.removeEventListener('purchasedOddsUpdated', handlePurchasedOddsUpdated);
    };
  }, [hasPurchasedOdds, game.id, isPurchased, onPurchaseSuccess]);

  /**
   * Handle Stripe payment
   */
  const handleStripePayment = async () => {
    try {
      setIsLoading(true);
      
      // Track analytics event
      if (window.analyticsService) {
        window.analyticsService.trackEvent('odds_purchase_initiated', {
          gameId: game.id,
          userId,
          timestamp: Date.now(),
        });
      }
      
      // Create payment intent on server
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          productId: game.id,
          price: STRIPE_CONFIG.PRICING.ODDS_ACCESS,
          productName: `Odds for ${game.homeTeam} vs ${game.awayTeam}`,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }
      
      const { clientSecret } = data;
      
      // Load Stripe
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
      
      if (error) {
        // Track cancelled payment
        if (window.analyticsService) {
          window.analyticsService.trackEvent('odds_purchase_cancelled', {
            gameId: game.id,
            userId,
            error: error.message,
            timestamp: Date.now(),
          });
        }
        
        throw new Error(error.message);
      }
      
      // Track successful payment
      if (window.analyticsService) {
        window.analyticsService.trackEvent('odds_purchase_completed', {
          gameId: game.id,
          userId,
          price: STRIPE_CONFIG.PRICING.ODDS_ACCESS,
          timestamp: Date.now(),
        });
      }
      
      // Update state immediately without showing alert
      console.log('Payment successful, updating button state');
      setIsPurchased(true);
      setJustPurchased(true);
      setShowPopup(true);
      
      // Update purchase record in the background and ensure it's available to all components
      updatePurchaseRecord(game.id, userId)
        .then(success => {
          if (success) {
            console.log('Purchase record updated successfully');
          }
          
          // Call success callback immediately
          if (onPurchaseSuccess) {
            console.log('Calling onPurchaseSuccess callback');
            onPurchaseSuccess();
          }
        })
        .catch(err => console.error('Background purchase record update failed:', err));
      
      // No alert - seamless transition to bet button with popup
    } catch (error) {
      console.error('Payment error:', error);
      
      // Track payment error
      if (window.analyticsService) {
        window.analyticsService.trackEvent('odds_purchase_error', {
          gameId: game.id,
          userId,
          error: error.message || 'Unknown error',
          timestamp: Date.now(),
        });
      }
      
      alert('Unable to process payment. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update purchase record in database
   */
  const updatePurchaseRecord = async (gameId, userId) => {
    try {
      const response = await fetch('/api/update-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          gameId,
          timestamp: new Date().toISOString(),
          platform: 'web',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update purchase record');
      }
      
      // Also update local storage for cross-platform sync and broadcast to all components
      if (window.crossPlatformSyncService) {
        window.crossPlatformSyncService.recordOddsPurchase(gameId);
        
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('oddsPurchased', {
          detail: { gameId, userId }
        }));
        
        console.log('Purchase record updated and broadcast to all components');
      }
      
      // Return success
      return true;
    } catch (error) {
      console.error('Error updating purchase record:', error);
      return false;
    }
  };

  /**
   * Handle FanDuel redirection
   */
  const handleFanDuelRedirect = () => {
    try {
      setIsLoading(true);
      
      // Track affiliate link click
      if (window.bettingAffiliateService) {
        window.bettingAffiliateService.trackButtonClick('odds_button', affiliateId, game.id, userId, game.id);
      }
      
      // Generate affiliate URL
      let baseUrl = FANDUEL_CONFIG.BASE_URL;
      if (game.fanduelEventId) {
        baseUrl = `${FANDUEL_CONFIG.BASE_URL}event/${game.fanduelEventId}`;
      }
      
      // Add affiliate parameters
      const affiliateUrl = `${baseUrl}?aff_id=${affiliateId}&subId=${userId}-${game.id}&utm_source=aisportsedge&utm_medium=affiliate&utm_campaign=betbutton&utm_content=web`;
      
      // Track conversion
      if (window.bettingAffiliateService) {
        window.bettingAffiliateService.trackConversion('odds_to_bet', 0, userId);
      }
      
      // Open URL in new tab
      window.open(affiliateUrl, '_blank');
    } catch (error) {
      console.error('Error redirecting to FanDuel:', error);
      alert('Unable to open FanDuel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get button size class
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'odds-button--small';
      case 'large':
        return 'odds-button--large';
      case 'medium':
      default:
        return 'odds-button--medium';
    }
  };

  // Get button class
  const getButtonClass = () => {
    let classes = ['odds-button', getSizeClass()];
    
    if (isPurchased) {
      classes.push('bet-now-button');
    }
    
    if (isLoading) {
      classes.push('odds-button--loading');
    }
    
    return classes.join(' ');
  };

  return (
    <>
      <button
        className={getButtonClass()}
        onClick={isPurchased ? handleFanDuelRedirect : handleStripePayment}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="odds-button__spinner"></div>
        ) : (
          isPurchased ? 'BET NOW' : 'Get Odds'
        )}
      </button>
      
      {/* Auto-show popup for immediate betting after purchase */}
      {showPopup && (
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
      )}
    </>
  );
};

export default OddsButton;