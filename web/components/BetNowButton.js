/**
 * BetNowButton Component
 * Displays a neon-styled "Bet Now" button for affiliate links
 */

import React, { useState, useEffect, useRef } from 'react';

import { useBettingAffiliate } from '../../contexts/BettingAffiliateContext';
import { FANDUEL_CONFIG } from '../../config/affiliateConfig';
import '../styles/BetNowButton.css';

/**
 * BetNowButton component
 * @param {Object} props Component props
 * @param {string} props.size Button size ('small', 'medium', 'large')
 * @param {string} props.position Button position ('inline', 'floating', 'fixed')
 * @param {string} props.contentType Type of content where button is displayed
 * @param {string} props.teamId Optional team ID for team-colored buttons
 * @param {string} props.userId Optional user ID for tracking
 * @param {string} props.gameId Optional game ID for tracking
 * @param {string} props.className Additional CSS classes
 * @param {Object} props.style Additional inline styles
 * @returns {JSX.Element} Rendered component
 */
const BetNowButton = ({
  size = 'medium',
  position = 'inline',
  contentType = 'general',
  teamId,
  userId,
  gameId,
  className = '',
  style = {},
}) => {
  // Get context values
  const {
    affiliateCode,
    buttonSettings,
    trackButtonClick,
    trackButtonImpression,
    getButtonColors,
    primaryTeam,
  } = useBettingAffiliate();

  // State for animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlickering, setIsFlickering] = useState(false);
  const [isSurging, setIsSurging] = useState(false);
  const buttonRef = useRef(null);

  // Determine if button should use team colors
  const useTeamColors = buttonSettings.style === 'team-colored';
  const effectiveTeamId = teamId || primaryTeam;
  const teamColors = useTeamColors ? getButtonColors(effectiveTeamId) : null;

  // Track impression when button is mounted
  useEffect(() => {
    trackButtonImpression(position, teamId, userId, gameId);
  }, [position, teamId, userId, gameId, trackButtonImpression]);

  // Set up animation intervals
  useEffect(() => {
    if (buttonSettings.animation === 'none') return;

    // Pulse animation
    let pulseInterval;
    if (buttonSettings.animation === 'pulse' || buttonSettings.animation === 'surge') {
      pulseInterval = setInterval(() => {
        setIsAnimating(prev => !prev);
      }, 2000);
    }

    // Flicker animation (random)
    let flickerInterval;
    if (buttonSettings.animation === 'flicker') {
      flickerInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setIsFlickering(true);
          setTimeout(() => setIsFlickering(false), 150);
        }
      }, 3000);
    }

    // Surge animation (occasional)
    let surgeInterval;
    if (buttonSettings.animation === 'surge') {
      surgeInterval = setInterval(() => {
        if (Math.random() > 0.8) {
          setIsSurging(true);
          setTimeout(() => setIsSurging(false), 500);
        }
      }, 10000);
    }

    return () => {
      if (pulseInterval) clearInterval(pulseInterval);
      if (flickerInterval) clearInterval(flickerInterval);
      if (surgeInterval) clearInterval(surgeInterval);
    };
  }, [buttonSettings.animation]);

  // Handle button click
  const handleClick = async () => {
    // Track the click
    trackButtonClick(position, teamId, userId, gameId);

    try {
      // Import the FANDUEL_CONFIG to get the affiliate link
      const { FANDUEL_CONFIG } = await import('../../config/affiliateConfig');

      // Use the direct affiliate link from environment variables
      const affiliateUrl = FANDUEL_CONFIG.AFFILIATE_URL;

      // Track the click using the service
      const { bettingAffiliateService } = await import('../../services/bettingAffiliateService');

      // Open in new tab
      window.open(affiliateUrl, '_blank');
    } catch (error) {
      console.error('Error generating affiliate link:', error);

      // Fallback to the direct affiliate link if there's an error
      const fallbackUrl = FANDUEL_CONFIG.AFFILIATE_URL;

      window.open(fallbackUrl, '_blank');
    }
  };

  // Determine button styles
  const getButtonStyles = () => {
    // Base styles
    const styles = {
      fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
      padding: size === 'small' ? '8px 16px' : size === 'large' ? '12px 24px' : '10px 20px',
    };

    // Add team colors if applicable
    if (useTeamColors && teamColors) {
      styles.backgroundColor = teamColors.backgroundColor;
      styles.color = teamColors.textColor;
      styles.boxShadow = `0 0 10px ${teamColors.glowColor}`;

      if (isAnimating || isSurging) {
        styles.boxShadow = `0 0 ${isSurging ? '30px' : '20px'} ${teamColors.glowColor}`;
      }
    } else {
      styles.background = 'linear-gradient(90deg, #FF0055 0%, #FF3300 100%)';
      styles.color = '#FFFFFF';
      styles.boxShadow = '0 0 10px #FF3300';

      if (isAnimating || isSurging) {
        styles.boxShadow = `0 0 ${isSurging ? '30px' : '20px'} #FF3300`;
      }
    }

    // Add flickering effect
    if (isFlickering) {
      styles.opacity = 0.7;
    }

    return styles;
  };

  // Determine position class
  const positionClass = `bet-now-button--${position}`;
  const sizeClass = `bet-now-button--${size}`;

  return (
    <button
      ref={buttonRef}
      className={`bet-now-button ${positionClass} ${sizeClass} ${className} ${isAnimating ? 'animating' : ''} ${isFlickering ? 'flickering' : ''} ${isSurging ? 'surging' : ''}`}
      style={{ ...getButtonStyles(), ...style }}
      onClick={handleClick}
      aria-label="Bet Now"
    >
      BET NOW
    </button>
  );
};

export default BetNowButton;
