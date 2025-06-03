/**
 * BetNowPopup Component for Web
 * Displays a popup with a "Bet Now" button after a purchase or other conversion event
 * Enhanced for seamless transitions after purchases
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { FANDUEL_CONFIG } from '../../config/affiliateConfig';

/**
 * BetNowPopup Component
 */
const BetNowPopup = ({
  show,
  onClose,
  teamId,
  userId,
  gameId,
  message = 'Ready to place your bet? Get started now!',
  autoShow = false,
}) => {
  // Get current location
  const location = useLocation();

  // State
  const [visible, setVisible] = useState(autoShow);
  const [animationClass, setAnimationClass] = useState(autoShow ? 'instant-show' : '');

  // Close popup when navigating away from the page
  useEffect(() => {
    // When location changes, close the popup
    handleClose();
  }, [location.pathname]);

  // Handle visibility changes
  useEffect(() => {
    if (show || autoShow) {
      setVisible(true);
      setAnimationClass(autoShow ? 'instant-show' : 'fade-in');

      // Track impression
      if (window.bettingAffiliateService) {
        window.bettingAffiliateService.trackButtonImpression('popup', teamId, userId, gameId);
      }

      // Add class to body to indicate popup is open
      document.body.classList.add('bet-now-popup-open');
    } else {
      setAnimationClass('fade-out');

      // Delay hiding to allow animation to complete
      const timer = setTimeout(() => {
        setVisible(false);
        // Remove class from body when popup is closed
        document.body.classList.remove('bet-now-popup-open');
      }, 300);

      // Store the timer ID to clear it if needed
      if (window.globalTimeouts) {
        window.globalTimeouts.push(timer);
      } else {
        window.globalTimeouts = [timer];
      }

      return () => {
        clearTimeout(timer);
        // Ensure class is removed when component unmounts
        document.body.classList.remove('bet-now-popup-open');
      };
    }
  }, [show, autoShow, teamId, userId, gameId]);

  // Auto-close timer for autoShow mode
  useEffect(() => {
    let timer;
    if (autoShow && visible) {
      // Auto-close after 5 minutes if not interacted with
      timer = setTimeout(
        () => {
          handleClose();
        },
        5 * 60 * 1000
      );
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoShow, visible]);

  // Handle close
  const handleClose = () => {
    // Only proceed if the popup is visible
    if (!visible) return;

    setAnimationClass('fade-out');

    // Delay hiding to allow animation to complete
    const timer = setTimeout(() => {
      setVisible(false);
      // Ensure the body class is removed
      document.body.classList.remove('bet-now-popup-open');
      if (onClose) onClose();
    }, 300);

    // Store the timer ID to clear it if needed
    if (window.globalTimeouts) {
      window.globalTimeouts.push(timer);
    } else {
      window.globalTimeouts = [timer];
    }
  };

  // Handle bet now click
  const handleBetNowClick = () => {
    try {
      // Track affiliate link click
      if (window.bettingAffiliateService) {
        window.bettingAffiliateService.trackButtonClick(
          'popup',
          FANDUEL_CONFIG.AFFILIATE_ID,
          teamId,
          userId,
          gameId
        );
      }

      // Use the direct affiliate link from environment variables
      const affiliateUrl = FANDUEL_CONFIG.AFFILIATE_URL;

      // Track conversion
      if (window.bettingAffiliateService) {
        window.bettingAffiliateService.trackConversion('popup_to_bet', 0, userId);
      }

      // Open URL in new tab
      window.open(affiliateUrl, '_blank');

      // Close popup
      handleClose();
    } catch (error) {
      console.error('Error redirecting to FanDuel:', error);
      alert('Unable to open FanDuel. Please try again.');
    }
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <div className={`bet-now-popup-overlay ${animationClass}`}>
      <div className={`bet-now-popup ${animationClass}`}>
        <button className="bet-now-popup-close" onClick={handleClose}>
          ×
        </button>
        <div className="bet-now-popup-content">
          <h3>Boost Your Winnings!</h3>
          <p>{message}</p>
          <div className="bet-now-popup-button">
            <button className="bet-now-button bet-now-button--large" onClick={handleBetNowClick}>
              BET NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetNowPopup;
