import "../../src/config/firebase";

import { firebaseService } from '../src/atomic/organisms/firebaseService';
import "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./i18n"; // Import i18n configuration
import App from "./App";
import "./styles/global.css";
import "./styles/fix-overlay.css"; // Import the fix for overlay issues
import "./styles/notification-banner.css"; // Import notification banner styles
import "./styles/onboarding.css"; // Import onboarding and feature tour styles
import "./styles/enhanced-homepage.css"; // Import enhanced homepage styles

// Initialize required global services
console.log("[Web] Initializing cross-platform services");

// Cross-platform sync service for managing purchased odds
window.crossPlatformSyncService = {
  hasPurchasedOdds: (gameId) => {
    try {
      const purchases = JSON.parse(
        localStorage.getItem("purchasedOdds") || "[]"
      );
      console.log(
        "[CrossPlatformSync] Checking if game is purchased:",
        gameId,
        purchases.includes(gameId)
      );
      return purchases.includes(gameId);
    } catch (error) {
      console.error(
        "[CrossPlatformSync] Error checking purchased odds:",
        error
      );
      return false;
    }
  },
  recordOddsPurchase: (gameId) => {
    try {
      const purchases = JSON.parse(
        localStorage.getItem("purchasedOdds") || "[]"
      );
      if (!purchases.includes(gameId)) {
        purchases.push(gameId);
        localStorage.setItem("purchasedOdds", JSON.stringify(purchases));
        console.log("[CrossPlatformSync] Recorded purchase for game:", gameId);

        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent("purchasedOddsUpdated", {
            detail: { purchasedOdds: purchases.map((id) => ({ gameId: id })) },
          })
        );
      }
    } catch (error) {
      console.error("[CrossPlatformSync] Error recording purchase:", error);
    }
  },
};

// Analytics service for tracking events
window.analyticsService = {
  trackEvent: (eventName, data) => {
    console.log(`[Analytics] ${eventName}:`, data);
    // In a real implementation, this would send data to an analytics service
  },
  trackUserAction: (action, data) => {
    console.log(`[Analytics] User Action - ${action}:`, data);
    // In a real implementation, this would send data to an analytics service
  },
};

// Betting affiliate service for tracking affiliate links
window.bettingAffiliateService = {
  trackButtonClick: (location, affiliateId, gameId, userId, eventId) => {
    console.log(`[Affiliate] Button click:`, {
      location,
      affiliateId,
      gameId,
      userId,
      eventId,
    });
    // In a real implementation, this would send data to an affiliate tracking service
  },
  trackConversion: (type, value, userId) => {
    console.log(`[Affiliate] Conversion:`, { type, value, userId });
    // In a real implementation, this would send data to an affiliate tracking service
  },
  getButtonColors: (teamId) => {
    // Simple implementation that returns default colors
    return {
      backgroundColor: "#0066ff",
      textColor: "#ffffff",
      glowColor: "#4d94ff",
      hoverColor: "#0052cc",
    };
  },
};

// Add global handler for odds button clicks
window.handleOddsButtonClick = function (gameId) {
  console.log("[Web] Odds button clicked for game:", gameId);
  // Redirect to the appropriate page or show a modal
  if (gameId) {
    window.location.href = `/odds/${gameId}`;
  }
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <App />
      </Router>
    </HelmetProvider>
  </React.StrictMode>
);
