/**
 * OddsButton Component Functionality
 * Handles the seamless transition from "Get Odds" to "Bet Now" button
 */

// OddsButton functionality
function handleOddsButtonClick(button, gameId, homeTeam, awayTeam) {
  // Show loading state
  button.classList.add('odds-button--loading');
  button.innerHTML = '<div class="odds-button__spinner"></div>';
  
  // Simulate payment processing (in a real app, this would call the Stripe API)
  setTimeout(() => {
    // Payment successful - update button state immediately
    button.classList.remove('odds-button--loading');
    button.classList.remove('odds-button');
    button.classList.add('bet-now-button');
    button.innerHTML = 'BET NOW';
    
    // Update button onclick handler
    button.onclick = function() {
      handleBetNowClick(gameId, homeTeam);
    };
    
    // Show popup immediately after purchase
    showBetNowPopup(gameId, homeTeam, awayTeam);
    
    // Track analytics
    console.log('Purchase successful for game: ' + gameId);
  }, 1500); // Simulate 1.5 second payment process
}

// Handle Bet Now button click
function handleBetNowClick(gameId, teamId) {
  // Open FanDuel in a new tab (in a real app, this would use the affiliate link)
  window.open('https://fanduel.com/', '_blank');
  
  // Track analytics
  console.log('Bet Now clicked for game: ' + gameId);
}

// Show Bet Now Popup
function showBetNowPopup(gameId, homeTeam, awayTeam) {
  // Create popup element
  const popup = document.createElement('div');
  popup.className = 'bet-now-popup-overlay instant-show';
  
  popup.innerHTML = `
    <div class="bet-now-popup instant-show">
      <button class="bet-now-popup-close" onclick="closeBetNowPopup(this.parentNode.parentNode)">×</button>
      <div class="bet-now-popup-content">
        <h3>Boost Your Winnings!</h3>
        <p>Your odds are ready! Place your bet now for the best experience.</p>
        <div class="bet-now-popup-button">
          <button class="bet-now-button bet-now-button--large" onclick="handleBetNowClick('${gameId}', '${homeTeam}')">
            BET NOW
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add popup to body
  document.body.appendChild(popup);
  
  // Auto-close after 5 minutes
  setTimeout(() => {
    if (document.body.contains(popup)) {
      document.body.removeChild(popup);
    }
  }, 5 * 60 * 1000);
}

// Close Bet Now Popup
function closeBetNowPopup(popup) {
  if (document.body.contains(popup)) {
    document.body.removeChild(popup);
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('OddsButton functionality initialized');
});