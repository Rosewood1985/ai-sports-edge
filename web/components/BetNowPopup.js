/**
 * BetNowPopup Component
 * Displays a popup with a "Bet Now" button after a purchase or other conversion event
 */

import React, { useState, useEffect } from 'react';
import { useBettingAffiliate } from '../../contexts/BettingAffiliateContext';
import BetNowButton from './BetNowButton';
import '../styles/BetNowPopup.css';

/**
 * BetNowPopup component
 * @param {Object} props Component props
 * @param {boolean} props.show Whether to show the popup
 * @param {function} props.onClose Function to call when popup is closed
 * @param {string} props.teamId Optional team ID for team-colored buttons
 * @param {string} props.message Custom message to display in the popup
 * @returns {JSX.Element} Rendered component
 */
const BetNowPopup = ({
  show,
  onClose,
  teamId,
  message = "Ready to place your bet? Get started now!"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { trackButtonImpression } = useBettingAffiliate();
  
  // Handle visibility changes
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      trackButtonImpression('popup', teamId);
    } else {
      setIsVisible(false);
    }
  }, [show, teamId, trackButtonImpression]);
  
  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  return (
    <div className="bet-now-popup-overlay">
      <div className="bet-now-popup">
        <button className="bet-now-popup-close" onClick={handleClose}>×</button>
        <div className="bet-now-popup-content">
          <h3>Boost Your Winnings!</h3>
          <p>{message}</p>
          <div className="bet-now-popup-button">
            <BetNowButton 
              size="large" 
              position="inline" 
              contentType="popup" 
              teamId={teamId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetNowPopup;