/**
 * OddsButton Component for Web
 *
 * A dynamic button that changes from "Get Odds" to "Bet Now on FanDuel" after purchase.
 * Handles both Stripe payment processing and FanDuel affiliate link redirection.
 * Ensures seamless transition between states with immediate popup after purchase.
 */

import { loadStripe } from '@stripe/stripe-js';
import React, { useState, useEffect } from 'react';

import BetNowPopup from './BetNowPopup';
import { STRIPE_CONFIG, FANDUEL_CONFIG } from '../../config/affiliateConfig';
import { STRIPE_PUBLISHABLE_KEY } from '../../config/stripe';

// Debug logging for Stripe configuration
console.log('[OddsButton] Stripe configuration:', {
  hasPublicKey: !!STRIPE_PUBLISHABLE_KEY,
  isPlaceholder: STRIPE_PUBLISHABLE_KEY?.includes('placeholder') || false,
});

// Initialize Stripe if key is available and not a placeholder
const stripePromise =
  !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('placeholder')
    ? Promise.resolve(null)
    : loadStripe(STRIPE_PUBLISHABLE_KEY);

// Debug logging for Stripe promise
stripePromise.then(
  stripe => console.log('[OddsButton] Stripe loaded successfully:', !!stripe),
  error => console.error('[OddsButton] Failed to load Stripe:', error)
);

/**
 * OddsButton Component
 */
const OddsButton = ({
  game,
  userId,
  hasPurchasedOdds = false,
  onPurchaseSuccess,
  size = 'medium',
  affiliateId = FANDUEL_CONFIG.AFFILIATE_ID,
}) => {
  // State
  const [isPurchased, setIsPurchased] = useState(hasPurchasedOdds);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);

  // Debug logging for props
  console.log('[OddsButton] Initialized with props:', {
    gameId: game?.id,
    userId,
    hasPurchasedOdds,
    size,
    affiliateId,
  });

  // Update state when props change or when purchased odds are updated
  useEffect(() => {
    setIsPurchased(hasPurchasedOdds);

    // Debug logging for services
    console.log(
      '[OddsButton] Cross-platform sync service available:',
      !!window.crossPlatformSyncService
    );
    console.log('[OddsButton] Analytics service available:', !!window.analyticsService);
    console.log(
      '[OddsButton] Betting affiliate service available:',
      !!window.bettingAffiliateService
    );

    // Listen for purchased odds updates from crossPlatformSyncService
    const handlePurchasedOddsUpdated = event => {
      console.log('[OddsButton] Received purchasedOddsUpdated event:', event.detail);
      const { purchasedOdds } = event.detail;
      const hasGame = purchasedOdds.some(purchase => purchase.gameId === game.id);
      if (hasGame && !isPurchased) {
        console.log('[OddsButton] Detected purchase update for game', game.id);
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
      try {
        const hasPurchased = window.crossPlatformSyncService.hasPurchasedOdds(game.id);
        console.log('[OddsButton] Direct check for purchased odds:', {
          gameId: game.id,
          hasPurchased,
        });
        if (hasPurchased) {
          console.log('[OddsButton] Direct check found purchase for game', game.id);
          setIsPurchased(true);
        }
      } catch (error) {
        console.error('[OddsButton] Error checking purchased odds:', error);
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
        console.log('[OddsButton] Tracking odds_purchase_initiated event');
        window.analyticsService.trackEvent('odds_purchase_initiated', {
          gameId: game.id,
          userId,
          timestamp: Date.now(),
        });
      } else {
        console.warn('[OddsButton] Analytics service not available for tracking');
      }

      // Check if Stripe is properly configured
      if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('placeholder')) {
        console.warn('[OddsButton] Stripe not properly configured, using mock payment flow');

        // Simulate successful payment with a delay
        setTimeout(() => {
          console.log('[OddsButton] Mock payment successful');

          // Update state
          setIsPurchased(true);
          setJustPurchased(true);
          setShowPopup(true);

          // Update purchase record
          updatePurchaseRecord(game.id, userId)
            .then(success => {
              if (success) {
                console.log('[OddsButton] Purchase record updated successfully');
              }

              // Call success callback
              if (onPurchaseSuccess) {
                console.log('[OddsButton] Calling onPurchaseSuccess callback');
                onPurchaseSuccess();
              }
            })
            .catch(err =>
              console.error('[OddsButton] Background purchase record update failed:', err)
            );

          setIsLoading(false);
        }, 1500);

        return;
      }

      // Debug logging for payment request
      const paymentData = {
        userId,
        productId: game.id,
        price: STRIPE_CONFIG.PRICING.ODDS_ACCESS,
        productName: `Odds for ${game.homeTeam} vs ${game.awayTeam}`,
      };
      console.log('[OddsButton] Attempting to create payment with:', paymentData);

      // Create payment intent on server
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      console.log('[OddsButton] Payment intent created:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      const { clientSecret } = data;

      // Load Stripe
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      console.log('[OddsButton] Confirming card payment with client secret');

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

      if (error) {
        // Track cancelled payment
        console.error('[OddsButton] Payment error:', error);
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
      console.log('[OddsButton] Payment successful:', paymentIntent);
      if (window.analyticsService) {
        window.analyticsService.trackEvent('odds_purchase_completed', {
          gameId: game.id,
          userId,
          price: STRIPE_CONFIG.PRICING.ODDS_ACCESS,
          timestamp: Date.now(),
        });
      }

      // Update state immediately without showing alert
      console.log('[OddsButton] Payment successful, updating button state');
      setIsPurchased(true);
      setJustPurchased(true);
      setShowPopup(true);

      // Update purchase record in the background and ensure it's available to all components
      updatePurchaseRecord(game.id, userId)
        .then(success => {
          if (success) {
            console.log('[OddsButton] Purchase record updated successfully');
          }

          // Call success callback immediately
          if (onPurchaseSuccess) {
            console.log('[OddsButton] Calling onPurchaseSuccess callback');
            onPurchaseSuccess();
          }
        })
        .catch(err => console.error('[OddsButton] Background purchase record update failed:', err));

      // No alert - seamless transition to bet button with popup
    } catch (error) {
      console.error('[OddsButton] Payment error:', error);

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
      console.log('[OddsButton] Updating purchase record:', { gameId, userId });

      // Update local storage via crossPlatformSyncService
      if (window.crossPlatformSyncService) {
        console.log('[OddsButton] Updating cross-platform sync service');
        window.crossPlatformSyncService.recordOddsPurchase(gameId);
        console.log('[OddsButton] Purchase record updated in local storage');
      } else {
        console.warn('[OddsButton] Cross-platform sync service not available');
        // Fallback to direct localStorage update
        try {
          const purchases = JSON.parse(localStorage.getItem('purchasedOdds') || '[]');
          if (!purchases.includes(gameId)) {
            purchases.push(gameId);
            localStorage.setItem('purchasedOdds', JSON.stringify(purchases));
            console.log('[OddsButton] Purchase record updated directly in localStorage');
          }
        } catch (error) {
          console.error('[OddsButton] Error updating localStorage:', error);
        }
      }

      // Try to update server record
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
          const errorData = await response.json().catch(() => ({}));
          console.error('[OddsButton] Failed to update purchase record on server:', errorData);
          // Continue anyway since we've updated localStorage
        } else {
          const responseData = await response.json().catch(() => ({}));
          console.log('[OddsButton] Purchase record update response from server:', responseData);
        }
      } catch (serverError) {
        console.error('[OddsButton] Error updating purchase record on server:', serverError);
        // Continue anyway since we've updated localStorage
      }

      // Return success
      return true;
    } catch (error) {
      console.error('[OddsButton] Error updating purchase record:', error);
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
        console.log('[OddsButton] Tracking affiliate button click');
        window.bettingAffiliateService.trackButtonClick(
          'odds_button',
          affiliateId,
          game.id,
          userId,
          game.id
        );
      } else {
        console.warn('[OddsButton] Betting affiliate service not available for tracking');
      }

      // Use the direct affiliate link from environment variables
      const affiliateUrl = FANDUEL_CONFIG.AFFILIATE_URL;
      console.log('[OddsButton] Using affiliate URL:', affiliateUrl);

      // Track conversion
      if (window.bettingAffiliateService) {
        window.bettingAffiliateService.trackConversion('odds_to_bet', 0, userId);
      }

      // Open URL in new tab
      console.log('[OddsButton] Opening FanDuel in new tab');
      window.open(affiliateUrl, '_blank');
    } catch (error) {
      console.error('[OddsButton] Error redirecting to FanDuel:', error);
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
    const classes = ['odds-button', getSizeClass()];

    if (isPurchased) {
      classes.push('bet-now-button');
    }

    if (isLoading) {
      classes.push('odds-button--loading');
    }

    return classes.join(' ');
  };

  // Handle button click
  const handleClick = e => {
    e.preventDefault();
    e.stopPropagation();

    if (isPurchased) {
      handleFanDuelRedirect();
    } else {
      handleStripePayment();
    }

    // Also call the global handler if it exists
    if (window.handleOddsButtonClick && typeof window.handleOddsButtonClick === 'function') {
      window.handleOddsButtonClick(game.id);
    }
  };

  return (
    <>
      <button className={getButtonClass()} onClick={handleClick} disabled={isLoading}>
        {isLoading ? (
          <div className="odds-button__spinner" />
        ) : isPurchased ? (
          'BET NOW'
        ) : (
          'Get Odds'
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
          message={
            justPurchased
              ? 'Your odds are ready! Place your bet now for the best experience.'
              : 'Ready to place your bet? Get started now!'
          }
        />
      )}
    </>
  );
};

export default OddsButton;
