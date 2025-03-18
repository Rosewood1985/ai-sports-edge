const fs = require('fs');
const path = require('path');

// Define paths
const publicDir = path.resolve(__dirname, '../public');
const webDir = path.resolve(__dirname, '../web');

// Create a simple static website
console.log('Creating static website...');

// Ensure the public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create index.html with OddsButton component
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#007bff">
  <meta name="description" content="AI Sports Edge - AI-Powered Sports Betting Predictions and Analytics">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aisportsedge.app/">
  <meta property="og:title" content="AI Sports Edge - AI-Powered Sports Betting Predictions">
  <meta property="og:description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights.">
  <meta property="og:image" content="https://aisportsedge.app/og-image.jpg">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://aisportsedge.app/">
  <meta property="twitter:title" content="AI Sports Edge - AI-Powered Sports Betting Predictions">
  <meta property="twitter:description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights.">
  <meta property="twitter:image" content="https://aisportsedge.app/og-image.jpg">
  
  <title>AI Sports Edge - AI-Powered Sports Betting Predictions</title>
  
  <!-- Favicon -->
  <link rel="icon" href="https://expo.dev/static/images/favicon-76x76.png">
  <link rel="apple-touch-icon" href="https://expo.dev/static/images/favicon-76x76.png">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Styles -->
  <link rel="stylesheet" href="styles.css">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "AI Sports Edge",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "19.99",
        "priceCurrency": "USD"
      },
      "description": "AI-powered sports betting predictions and analytics"
    }
  </script>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <a href="/" class="logo">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjMDA0MkZGIi8+CjxwYXRoIGQ9Ik0xNjYuNjY3IDMzMy4zMzNIMTI1VjQxNi42NjdIMTY2LjY2N1YzMzMuMzMzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI1MCAzMzMuMzMzSDIwOC4zMzNWMzc1SDI1MFYzMzMuMzMzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTMzMy4zMzMgMjkxLjY2N0gyOTEuNjY3VjQxNi42NjdIMzMzLjMzM1YyOTEuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTM3NSA0MTYuNjY3SDEyNVY0NTguMzMzSDM3NVY0MTYuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTIwOC4zMzMgMjUwQzIwOC4zMzMgMjM3LjIzOSAyMTguNTcyIDIyNyAyMzEuMzMzIDIyN0MyNDQuMDk0IDIyNyAyNTQuMzMzIDIzNy4yMzkgMjU0LjMzMyAyNTBDMjU0LjMzMyAyNjIuNzYxIDI0NC4wOTQgMjczIDIzMS4zMzMgMjczQzIxOC41NzIgMjczIDIwOC4zMzMgMjYyLjc2MSAyMDguMzMzIDI1MFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yNTAgMjA4LjMzM0MyNTAgMTk1LjU3MiAyNjAuMjM5IDE4NS4zMzMgMjczIDE4NS4zMzNDMjg1Ljc2MSAxODUuMzMzIDI5NiAxOTUuNTcyIDI5NiAyMDguMzMzQzI5NiAyMjEuMDk0IDI4NS43NjEgMjMxLjMzMyAyNzMgMjMxLjMzM0MyNjAuMjM5IDIzMS4zMzMgMjUwIDIyMS4wOTQgMjUwIDIwOC4zMzNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjkxLjY2NyAxNjYuNjY3QzI5MS42NjcgMTUzLjkwNiAzMDEuOTA2IDE0My42NjcgMzE0LjY2NyAxNDMuNjY3QzMyNy40MjggMTQzLjY2NyAzMzcuNjY3IDE1My45MDYgMzM3LjY2NyAxNjYuNjY3QzMzNy42NjcgMTc5LjQyOCAzMjcuNDI4IDE4OS42NjcgMzE0LjY2NyAxODkuNjY3QzMwMS45MDYgMTg5LjY2NyAyOTEuNjY3IDE3OS40MjggMjkxLjY2NyAxNjYuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTMxNC42NjcgMTQzLjY2N0MzMTQuNjY3IDEzMC45MDYgMzI0LjkwNiAxMjAuNjY3IDMzNy42NjcgMTIwLjY2N0MzNTAuNDI4IDEyMC42NjcgMzYwLjY2NyAxMzAuOTA2IDM2MC42NjcgMTQzLjY2N0MzNjAuNjY3IDE1Ni40MjggMzUwLjQyOCAxNjYuNjY3IDMzNy42NjcgMTY2LjY2N0MzMjQuOTA2IDE2Ni42NjcgMzE0LjY2NyAxNTYuNDI4IDMxNC42NjcgMTQzLjY2N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zMTQuNjY3IDE0My42NjdDMzE0LjY2NyAxMzAuOTA2IDMyNC45MDYgMTIwLjY2NyAzMzcuNjY3IDEyMC42NjdDMzUwLjQyOCAxMjAuNjY3IDM2MC42NjcgMTMwLjkwNiAzNjAuNjY3IDE0My42NjdDMzYwLjY2NyAxNTYuNDI4IDM1MC40MjggMTY2LjY2NyAzMzcuNjY3IDE2Ni42NjdDMzI0LjkwNiAxNjYuNjY3IDMxNC42NjcgMTU2LjQyOCAzMTQuNjY3IDE0My42NjdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzM3LjY2NyAxNjYuNjY3QzMzNy42NjcgMTUzLjkwNiAzNDcuOTA2IDE0My42NjcgMzYwLjY2NyAxNDMuNjY3QzM3My40MjggMTQzLjY2NyAzODMuNjY3IDE1My45MDYgMzgzLjY2NyAxNjYuNjY3QzM4My42NjcgMTc5LjQyOCAzNzMuNDI4IDE4OS42NjcgMzYwLjY2NyAxODkuNjY3QzM0Ny45MDYgMTg5LjY2NyAzMzcuNjY3IDE3OS40MjggMzM3LjY2NyAxNjYuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI5MS42NjcgMTY2LjY2N0MyOTEuNjY3IDE1My45MDYgMzAxLjkwNiAxNDMuNjY3IDMxNC42NjcgMTQzLjY2N0MzMjcuNDI4IDE0My42NjcgMzM3LjY2NyAxNTMuOTA2IDMzNy42NjcgMTY2LjY2N0MzMzcuNjY3IDE3OS40MjggMzI3LjQyOCAxODkuNjY3IDMxNC42NjcgMTg5LjY2N0MzMDEuOTA2IDE4OS42NjcgMjkxLjY2NyAxNzkuNDI4IDI5MS42NjcgMTY2LjY2N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zMzcuNjY3IDE2Ni42NjdDMzM3LjY2NyAxNTMuOTA2IDM0Ny45MDYgMTQzLjY2NyAzNjAuNjY3IDE0My42NjdDMzczLjQyOCAxNDMuNjY3IDM4My42NjcgMTUzLjkwNiAzODMuNjY3IDE2Ni42NjdDMzgzLjY2NyAxNzkuNDI4IDM3My40MjggMTg5LjY2NyAzNjAuNjY3IDE4OS42NjdDMzQ3LjkwNiAxODkuNjY3IDMzNy42NjcgMTc5LjQyOCAzMzcuNjY3IDE2Ni42NjdaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="AI Sports Edge Logo">
          <span>AI Sports Edge</span>
        </a>
        <nav class="nav">
          <ul class="nav-list">
            <li class="nav-item"><a href="/" class="active">Home</a></li>
            <li class="nav-item"><a href="#features">Features</a></li>
            <li class="nav-item"><a href="#pricing">Pricing</a></li>
            <li class="nav-item"><a href="#about">About</a></li>
            <li class="nav-item"><a href="#live-odds">Live Odds</a></li>
            <li class="nav-item"><a href="#download" class="download-button">Download</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-text">
          <h1>AI-Powered Sports Betting Predictions</h1>
          <p class="hero-subtitle">
            Get accurate predictions, analytics, and insights for smarter betting decisions.
          </p>
          <div class="hero-buttons">
            <a href="#download" class="button primary-button">Download App</a>
            <a href="#features" class="button secondary-button">Learn More</a>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-image">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjMDA0MkZGIi8+CjxwYXRoIGQ9Ik0xNjYuNjY3IDMzMy4zMzNIMTI1VjQxNi42NjdIMTY2LjY2N1YzMzMuMzMzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI1MCAzMzMuMzMzSDIwOC4zMzNWMzc1SDI1MFYzMzMuMzMzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTMzMy4zMzMgMjkxLjY2N0gyOTEuNjY3VjQxNi42NjdIMzMzLjMzM1YyOTEuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTM3NSA0MTYuNjY3SDEyNVY0NTguMzMzSDM3NVY0MTYuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTIwOC4zMzMgMjUwQzIwOC4zMzMgMjM3LjIzOSAyMTguNTcyIDIyNyAyMzEuMzMzIDIyN0MyNDQuMDk0IDIyNyAyNTQuMzMzIDIzNy4yMzkgMjU0LjMzMyAyNTBDMjU0LjMzMyAyNjIuNzYxIDI0NC4wOTQgMjczIDIzMS4zMzMgMjczQzIxOC41NzIgMjczIDIwOC4zMzMgMjYyLjc2MSAyMDguMzMzIDI1MFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yNTAgMjA4LjMzM0MyNTAgMTk1LjU3MiAyNjAuMjM5IDE4NS4zMzMgMjczIDE4NS4zMzNDMjg1Ljc2MSAxODUuMzMzIDI5NiAxOTUuNTcyIDI5NiAyMDguMzMzQzI5NiAyMjEuMDk0IDI4NS43NjEgMjMxLjMzMyAyNzMgMjMxLjMzM0MyNjAuMjM5IDIzMS4zMzMgMjUwIDIyMS4wOTQgMjUwIDIwOC4zMzNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjkxLjY2NyAxNjYuNjY3QzI5MS42NjcgMTUzLjkwNiAzMDEuOTA2IDE0My42NjcgMzE0LjY2NyAxNDMuNjY3QzMyNy40MjggMTQzLjY2NyAzMzcuNjY3IDE1My45MDYgMzM3LjY2NyAxNjYuNjY3QzMzNy42NjcgMTc5LjQyOCAzMjcuNDI4IDE4OS42NjcgMzE0LjY2NyAxODkuNjY3QzMwMS45MDYgMTg5LjY2NyAyOTEuNjY3IDE3OS40MjggMjkxLjY2NyAxNjYuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTMxNC42NjcgMTQzLjY2N0MzMTQuNjY3IDEzMC45MDYgMzI0LjkwNiAxMjAuNjY3IDMzNy42NjcgMTIwLjY2N0MzNTAuNDI4IDEyMC42NjcgMzYwLjY2NyAxMzAuOTA2IDM2MC42NjcgMTQzLjY2N0MzNjAuNjY3IDE1Ni40MjggMzUwLjQyOCAxNjYuNjY3IDMzNy42NjcgMTY2LjY2N0MzMjQuOTA2IDE2Ni42NjcgMzE0LjY2NyAxNTYuNDI4IDMxNC42NjcgMTQzLjY2N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zMTQuNjY3IDE0My42NjdDMzE0LjY2NyAxMzAuOTA2IDMyNC45MDYgMTIwLjY2NyAzMzcuNjY3IDEyMC42NjdDMzUwLjQyOCAxMjAuNjY3IDM2MC42NjcgMTMwLjkwNiAzNjAuNjY3IDE0My42NjdDMzYwLjY2NyAxNTYuNDI4IDM1MC40MjggMTY2LjY2NyAzMzcuNjY3IDE2Ni42NjdDMzI0LjkwNiAxNjYuNjY3IDMxNC42NjcgMTU2LjQyOCAzMTQuNjY3IDE0My42NjdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzM3LjY2NyAxNjYuNjY3QzMzNy42NjcgMTUzLjkwNiAzNDcuOTA2IDE0My42NjcgMzYwLjY2NyAxNDMuNjY3QzM3My40MjggMTQzLjY2NyAzODMuNjY3IDE1My45MDYgMzgzLjY2NyAxNjYuNjY3QzM4My42NjcgMTc5LjQyOCAzNzMuNDI4IDE4OS42NjcgMzYwLjY2NyAxODkuNjY3QzM0Ny45MDYgMTg5LjY2NyAzMzcuNjY3IDE3OS40MjggMzM3LjY2NyAxNjYuNjY3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI5MS42NjcgMTY2LjY2N0MyOTEuNjY3IDE1My45MDYgMzAxLjkwNiAxNDMuNjY3IDMxNC42NjcgMTQzLjY2N0MzMjcuNDI4IDE0My42NjcgMzM3LjY2NyAxNTMuOTA2IDMzNy42NjcgMTY2LjY2N0MzMzcuNjY3IDE3OS40MjggMzI3LjQyOCAxODkuNjY3IDMxNC42NjcgMTg5LjY2N0MzMDEuOTA2IDE4OS42NjcgMjkxLjY2NyAxNzkuNDI4IDI5MS42NjcgMTY2LjY2N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zMzcuNjY3IDE2Ni42NjdDMzM3LjY2NyAxNTMuOTA2IDM0Ny45MDYgMTQzLjY2NyAzNjAuNjY3IDE0My42NjdDMzczLjQyOCAxNDMuNjY3IDM4My42NjcgMTUzLjkwNiAzODMuNjY3IDE2Ni42NjdDMzgzLjY2NyAxNzkuNDI4IDM3My40MjggMTg5LjY2NyAzNjAuNjY3IDE4OS42NjdDMzQ3LjkwNiAxODkuNjY3IDMzNy42NjcgMTc5LjQyOCAzMzcuNjY3IDE2Ni42NjdaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="AI Sports Edge" style="width: 150px; height: 150px;">
          </div>
          <div class="news-feed">
            <h3 class="news-feed-title">Latest Sports News</h3>
            <div class="news-item">
              <span class="news-date">MAR 17</span>
              <p class="news-headline">Lakers secure playoff spot with win over Nuggets</p>
            </div>
            <div class="news-item">
              <span class="news-date">MAR 16</span>
              <p class="news-headline">NFL Draft: Top QB prospects showcase skills at Pro Day</p>
            </div>
            <div class="news-item">
              <span class="news-date">MAR 15</span>
              <p class="news-headline">Formula 1: Hamilton dominates in Australian GP qualifying</p>
            </div>
            <a href="#" class="news-more">More News →</a>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  <section id="features" class="features-overview">
    <div class="container">
      <h2 class="section-title">Why Choose AI Sports Edge?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">AI</div>
          <h3>AI Predictions</h3>
          <p>Advanced machine learning algorithms analyze vast amounts of data to provide accurate betting predictions.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">RT</div>
          <h3>Real-Time Analytics</h3>
          <p>Get up-to-the-minute stats, odds, and analysis to make informed betting decisions.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">MS</div>
          <h3>Multi-Sport Coverage</h3>
          <p>From NFL to Formula 1, we cover all major sports with specialized prediction models for each.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">CI</div>
          <h3>Community Insights</h3>
          <p>Connect with other bettors, share strategies, and learn from the community's collective wisdom.</p>
        </div>
      </div>
      
      <div class="features-detail">
        <div class="feature-detail-item">
          <h3>Advanced AI Algorithms</h3>
          <p>Our proprietary machine learning models are trained on millions of historical data points, including player statistics, team performance, weather conditions, and more. These models are continuously refined to improve prediction accuracy.</p>
          <ul>
            <li>Neural networks for pattern recognition</li>
            <li>Ensemble methods for robust predictions</li>
            <li>Bayesian inference for probability estimation</li>
            <li>Reinforcement learning for adaptive strategies</li>
          </ul>
        </div>
        
        <div class="feature-detail-item">
          <h3>Comprehensive Sports Coverage</h3>
          <p>We cover all major sports leagues and events, with specialized models for each sport's unique characteristics:</p>
          <div class="sports-grid">
            <div class="sport-item">
              <h4>NFL</h4>
              <p>Point spreads, over/unders, player props</p>
            </div>
            <div class="sport-item">
              <h4>NBA</h4>
              <p>Game winners, point totals, player performance</p>
            </div>
            <div class="sport-item">
              <h4>MLB</h4>
              <p>Moneylines, run totals, pitcher analysis</p>
            </div>
            <div class="sport-item">
              <h4>NHL</h4>
              <p>Puck lines, goal totals, power play predictions</p>
            </div>
            <div class="sport-item">
              <h4>Soccer</h4>
              <p>Match results, goal totals, corner kicks</p>
            </div>
            <div class="sport-item">
              <h4>Formula 1</h4>
              <p>Race winners, podium finishes, qualifying results</p>
            </div>
            <div class="sport-item">
              <h4>UFC/MMA</h4>
              <p>Fight outcomes, method of victory, round predictions</p>
            </div>
            <div class="sport-item">
              <h4>Horse Racing</h4>
              <p>Race winners, exactas, trifectas</p>
            </div>
          </div>
        </div>
        
        <div class="feature-detail-item">
          <h3>Personalized Betting Insights</h3>
          <p>Our app learns from your betting history to provide personalized recommendations and insights tailored to your preferences and betting style.</p>
          <ul>
            <li>Custom risk assessment based on your bankroll</li>
            <li>Personalized betting unit recommendations</li>
            <li>Tailored notifications for your favorite teams and leagues</li>
            <li>Performance tracking and analysis of your betting patterns</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
  
  <section id="pricing" class="pricing-section">
    <div class="container">
      <h2 class="section-title">Simple, Transparent Pricing</h2>
      <p class="section-subtitle">Choose the plan that fits your betting strategy and budget.</p>
      
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-header">
            <h3>Free</h3>
            <p class="pricing-price">$0<span>/month</span></p>
          </div>
          <div class="pricing-features">
            <ul>
              <li>Basic AI predictions</li>
              <li>Limited sports coverage</li>
              <li>Daily free pick</li>
              <li>Community access</li>
              <li>Basic stats and odds</li>
            </ul>
          </div>
          <div class="pricing-cta">
            <a href="#download" class="button secondary-button">Get Started</a>
          </div>
        </div>
        
        <div class="pricing-card popular">
          <div class="popular-badge">Most Popular</div>
          <div class="pricing-header">
            <h3>Pro</h3>
            <p class="pricing-price">$19.99<span>/month</span></p>
          </div>
          <div class="pricing-features">
            <ul>
              <li>Advanced AI predictions</li>
              <li>All major sports coverage</li>
              <li>Unlimited daily picks</li>
              <li>Community access</li>
              <li>Real-time analytics</li>
              <li>Bankroll management tools</li>
              <li>Betting history tracking</li>
            </ul>
          </div>
          <div class="pricing-cta">
            <a href="#download" class="button primary-button">Get Started</a>
          </div>
        </div>
        
        <div class="pricing-card">
          <div class="pricing-header">
            <h3>Elite</h3>
            <p class="pricing-price">$39.99<span>/month</span></p>
          </div>
          <div class="pricing-features">
            <ul>
              <li>Premium AI predictions</li>
              <li>All sports coverage (including niche)</li>
              <li>Unlimited daily picks</li>
              <li>VIP community access</li>
              <li>Advanced real-time analytics</li>
              <li>Advanced bankroll management</li>
              <li>Betting history tracking</li>
              <li>Personalized betting strategy</li>
              <li>Priority customer support</li>
            </ul>
          </div>
          <div class="pricing-cta">
            <a href="#download" class="button secondary-button">Get Started</a>
          </div>
        </div>
      </div>
      
      <div class="annual-discount">
        <h3>Save 20% with Annual Plans</h3>
        <p>Get two months free when you subscribe to an annual plan.</p>
        <a href="#download" class="button primary-button">View Annual Plans</a>
      </div>
    </div>
  </section>
  
  <section id="about" class="about-section">
    <div class="container">
      <h2 class="section-title">About AI Sports Edge</h2>
      <p class="section-subtitle">Revolutionizing sports betting with artificial intelligence and data science.</p>
      
      <div class="about-grid">
        <div class="about-item">
          <h3>Our Mission</h3>
          <p>At AI Sports Edge, we're on a mission to transform the sports betting landscape by combining cutting-edge artificial intelligence with comprehensive sports analytics. We believe that informed betting decisions lead to better outcomes, and our goal is to provide bettors of all experience levels with the tools and insights they need to succeed.</p>
          <p>We're committed to promoting responsible gambling practices while helping our users make data-driven decisions that maximize their chances of success.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="live-odds" class="app-section">
    <div class="container">
      <h2 class="section-title">Live Odds & Predictions</h2>
      <p class="section-subtitle">Get AI-powered insights for upcoming games. Purchase odds to see our detailed predictions and analysis.</p>
      
      <div class="games-grid">
        <!-- Game Card 1 -->
        <div class="game-card">
          <div class="game-header">
            <span class="game-sport">NFL</span>
            <span class="game-time">Tomorrow, 3:30 PM</span>
          </div>
          
          <div class="game-teams">
            <div class="team home">
              <span class="team-name">Kansas City Chiefs</span>
              <span class="team-score">24</span>
            </div>
            <div class="vs">VS</div>
            <div class="team away">
              <span class="team-name">San Francisco 49ers</span>
              <span class="team-score">17</span>
            </div>
          </div>
          
          <div class="game-odds">
            <div class="odds-item">
              <span class="odds-label">Spread:</span>
              <span class="odds-value">Chiefs -3.5</span>
            </div>
            <div class="odds-item">
              <span class="odds-label">Total:</span>
              <span class="odds-value">O/U 49.5</span>
            </div>
          </div>
          
          <div class="game-actions">
            <button class="odds-button odds-button--medium" onclick="handleOddsButtonClick(this, 'game1', 'Kansas City Chiefs', 'San Francisco 49ers')">
              Get Odds
            </button>
          </div>
        </div>
        
        <!-- Game Card 2 -->
        <div class="game-card">
          <div class="game-header">
            <span class="game-sport">NBA</span>
            <span class="game-time">2 days from now, 7:00 PM</span>
          </div>
          
          <div class="game-teams">
            <div class="team home">
              <span class="team-name">Los Angeles Lakers</span>
              <span class="team-score">112</span>
            </div>
            <div class="vs">VS</div>
            <div class="team away">
              <span class="team-name">Boston Celtics</span>
              <span class="team-score">108</span>
            </div>
          </div>
          
          <div class="game-odds">
            <div class="odds-item">
              <span class="odds-label">Spread:</span>
              <span class="odds-value">Lakers -2.5</span>
            </div>
            <div class="odds-item">
              <span class="odds-label">Total:</span>
              <span class="odds-value">O/U 220.5</span>
            </div>
          </div>
          
          <div class="game-actions">
            <button class="odds-button odds-button--medium" onclick="handleOddsButtonClick(this, 'game2', 'Los Angeles Lakers', 'Boston Celtics')">
              Get Odds
            </button>
          </div>
        </div>
        
        <!-- Game Card 3 -->
        <div class="game-card">
          <div class="game-header">
            <span class="game-sport">MLB</span>
            <span class="game-time">3 days from now, 1:05 PM</span>
          </div>
          
          <div class="game-teams">
            <div class="team home">
              <span class="team-name">New York Yankees</span>
              <span class="team-score">5</span>
            </div>
            <div class="vs">VS</div>
            <div class="team away">
              <span class="team-name">Boston Red Sox</span>
              <span class="team-score">3</span>
            </div>
          </div>
          
          <div class="game-odds">
            <div class="odds-item">
              <span class="odds-label">Spread:</span>
              <span class="odds-value">Yankees -1.5</span>
            </div>
            <div class="odds-item">
              <span class="odds-label">Total:</span>
              <span class="odds-value">O/U 8.5</span>
            </div>
          </div>
          
          <div class="game-actions">
            <button class="odds-button odds-button--medium" onclick="handleOddsButtonClick(this, 'game3', 'New York Yankees', 'Boston Red Sox')">
              Get Odds
            </button>
          </div>
        </div>
      </div>
      
      <div class="odds-cta">
        <h2>Want More Predictions?</h2>
        <p>Download our mobile app for comprehensive coverage and advanced features.</p>
        <a href="#download" class="button primary-button">Download App</a>
      </div>
    </div>
  </section>
  
  <section id="download" class="download-section">
    <div class="container">
      <h2 class="section-title">Download AI Sports Edge</h2>
      <p class="section-subtitle">Get started with AI-powered sports betting predictions today.</p>
      
      <div class="download-options">
        <div class="qr-code">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=exp://exp.host/@aisportsedge/ai-sports-edge" alt="Expo Go QR Code">
          <p>Scan with your phone camera or Expo Go app</p>
        </div>
        
        <div class="download-steps">
          <div class="step">
            <div class="step-number">1</div>
            <p>Download <a href="https://expo.dev/client" target="_blank">Expo Go</a> from the App Store or Google Play</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <p>Open Expo Go and scan the QR code</p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <p>Enjoy AI Sports Edge with all features enabled</p>
          </div>
        </div>
      </div>
      
      <div class="download-button-container">
        <a href="exp://exp.host/@aisportsedge/ai-sports-edge" class="button primary-button">Open in Expo Go</a>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">AI Sports Edge</h3>
          <p class="footer-description">
            Your ultimate sports betting companion powered by AI. Get predictions, analytics, and insights for smarter betting decisions.
          </p>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">Contact</h3>
          <ul class="footer-contact">
            <li>
              <a href="mailto:samuel@aisportsedge.app">samuel@aisportsedge.app</a>
            </li>
            <li>
              <span>San Francisco, CA</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} AI Sports Edge. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;

// Create styles.css
const stylesCss = `
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #007bff;
  --primary-dark: #0056b3;
  --secondary-color: #6c757d;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  --white: #ffffff;
  --black: #000000;
  --gray-100: #f8f9fa;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-600: #6c757d;
  --gray-700: #495057;
  --gray-800: #343a40;
  
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 2rem;
  --spacing-8: 3rem;
  
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 1rem;
  
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition-speed: 0.3s;
}

body {
  font-family: var(--font-family);
  font-size: 16px;
  line-height: 1.6;
  color: var(--gray-800);
  background-color: var(--light-color);
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-speed);
}

a:hover {
  color: var(--primary-dark);
}

h1, h2, h3, h4, h5, h6 {
  margin-bottom: var(--spacing-4);
  font-weight: 700;
  line-height: 1.2;
}

h1 {
  font-size: 3rem;
}

h2 {
  font-size: 2rem;
}

h3 {
  font-size: 1.5rem;
}

p {
  margin-bottom: var(--spacing-4);
}

img {
  max-width: 100%;
  height: auto;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.button {
  display: inline-block;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  text-align: center;
  transition: background-color var(--transition-speed);
}

.primary-button {
  background-color: var(--primary-color);
  color: var(--white);
}

.primary-button:hover {
  background-color: var(--primary-dark);
}

.secondary-button {
  background-color: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.secondary-button:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

/* Header */
.header {
  background-color: var(--white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--dark-color);
}

.logo img {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-sm);
}

.nav-list {
  display: flex;
  list-style: none;
  gap: var(--spacing-6);
  align-items: center;
}

.nav-item a {
  color: var(--gray-700);
  font-weight: 500;
  transition: color var(--transition-speed);
  position: relative;
}

.nav-item a:hover,
.nav-item a.active {
  color: var(--primary-color);
}

.nav-item a.active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
}

.download-button {
  background-color: var(--primary-color);
  color: var(--white) !important;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-speed);
}

.download-button:hover {
  background-color: var(--primary-dark);
}

/* Hero Section */
.hero {
  padding: var(--spacing-8) 0;
  background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%);
  color: var(--white);
}

.hero-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-8);
}

.hero-text {
  flex: 1;
}

.hero-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.hero h1 {
  font-size: 3rem;
  line-height: 1.2;
  margin-bottom: var(--spacing-4);
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-6);
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: var(--spacing-4);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

/* News Feed */
.news-feed {
  background-color: var(--background-card);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.news-feed-title {
  color: var(--primary-color);
  text-shadow: var(--neon-text-glow);
  margin-bottom: var(--spacing-4);
  font-size: 1.25rem;
  text-align: center;
}

.news-item {
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.news-date {
  font-size: 0.8rem;
  color: var(--primary-color);
  font-weight: bold;
}

.news-headline {
  color: var(--text-light);
  margin: var(--spacing-1) 0;
  font-size: 0.9rem;
}

.news-more {
  display: block;
  text-align: right;
  margin-top: var(--spacing-2);
  color: var(--primary-color);
  font-size: 0.9rem;
  text-decoration: none;
}

.news-more:hover {
  text-shadow: var(--neon-text-glow);
}

.hero-image img {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
}

/* Features Section */
.features-overview {
  padding: var(--spacing-8) 0;
  background-color: var(--white);
}

.section-title {
  text-align: center;
  margin-bottom: var(--spacing-8);
  font-size: 2rem;
  color: var(--gray-800);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.feature-card {
  background-color: var(--white);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform var(--transition-speed), box-shadow var(--transition-speed);
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  margin: 0 auto var(--spacing-4);
  background-color: var(--primary-color);
  color: var(--white);
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
}

.feature-card h3 {
  margin-bottom: var(--spacing-2);
  font-size: 1.25rem;
}

.feature-card p {
  color: var(--gray-600);
  font-size: 0.875rem;
}

/* Download Section */
.download-section {
  padding: var(--spacing-8) 0;
  background-color: var(--gray-100);
  text-align: center;
}

.section-subtitle {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-6);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  color: var(--gray-600);
}

.download-options {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-8);
  margin-bottom: var(--spacing-6);
}

.qr-code {
  text-align: center;
}

.qr-code img {
  border: 1px solid var(--gray-300);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm);
  background-color: var(--white);
  margin-bottom: var(--spacing-2);
}

.qr-code p {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.download-steps {
  text-align: left;
}

.step {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.step-number {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  background-color: var(--primary-color);
  color: var(--white);
  border-radius: 50%;
  font-weight: bold;
  margin-right: var(--spacing-3);
}

.download-button-container {
  margin-top: var(--spacing-6);
}

/* Footer */
.footer {
  background-color: var(--gray-800);
  color: var(--gray-300);
  padding: var(--spacing-8) 0 var(--spacing-4);
  margin-top: var(--spacing-8);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-6);
}

.footer-title {
  color: var(--white);
  font-size: 1.25rem;
  margin-bottom: var(--spacing-4);
}

.footer-description {
  margin-bottom: var(--spacing-4);
  font-size: 0.875rem;
  line-height: 1.6;
}

.footer-contact {
  list-style: none;
}

.footer-contact li {
  margin-bottom: var(--spacing-2);
  font-size: 0.875rem;
}

.footer-contact a {
  color: var(--gray-400);
  transition: color var(--transition-speed);
}

.footer-contact a:hover {
  color: var(--white);
}

.footer-bottom {
  border-top: 1px solid var(--gray-700);
  padding-top: var(--spacing-4);
  text-align: center;
  font-size: 0.875rem;
  color: var(--gray-500);
}

/* Responsive Styles */
@media (max-width: 992px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
  }
  
  .hero h1 {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
  }
  
  .hero-buttons {
    justify-content: center;
  }
  
  .download-options {
    flex-direction: column;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
  }
  
  .nav-list {
    display: none;
  }
}

@media (max-width: 576px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-buttons {
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  .hero h1 {
    font-size: 2rem;
  }
}
`;

// Write files to public directory
try {
  // Clear the public directory first (except for README.md if it exists)
  const publicFiles = fs.readdirSync(publicDir);
  for (const file of publicFiles) {
    if (file !== 'README.md') {
      const filePath = path.join(publicDir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  }

  // Add Google Analytics script
  const googleAnalyticsScript = `
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
`;

  // Insert Google Analytics script before </head>
  const indexHtmlWithAnalytics = indexHtml.replace('</head>', `${googleAnalyticsScript}\n</head>`);

  // Create DNS propagation check script
  const dnsCheckScript = `
// DNS Propagation Check
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the custom domain
  const isCustomDomain = window.location.hostname === 'aisportsedge.app';
  
  if (!isCustomDomain) {
    // Create DNS status banner
    const dnsBanner = document.createElement('div');
    dnsBanner.className = 'dns-banner';
    dnsBanner.innerHTML = '<p>⚠️ You are viewing this site on a temporary URL. DNS propagation for aisportsedge.app is in progress.</p>';
    
    // Add banner to the top of the body
    document.body.insertBefore(dnsBanner, document.body.firstChild);
    
    // Add banner styles
    const bannerStyles = document.createElement('style');
    bannerStyles.textContent = \`
      .dns-banner {
        background-color: #fff3cd;
        color: #856404;
        padding: 10px;
        text-align: center;
        font-size: 14px;
        position: relative;
        z-index: 1000;
      }
    \`;
    document.head.appendChild(bannerStyles);
  }
});
`;

  // Create enhanced mobile functionality script with pricing carousel
  const mobileScript = `
// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
  // Add mobile menu toggle
  const header = document.querySelector('.header');
  const nav = document.querySelector('.nav');
  
  // Create mobile menu button
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.innerHTML = '<span></span><span></span><span></span>';
  mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');
  
  // Add mobile menu button to header
  header.querySelector('.header-content').insertBefore(mobileMenuBtn, nav);
  
  // Toggle mobile menu
  mobileMenuBtn.addEventListener('click', function() {
    nav.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
  });
  
  // Add smooth scrolling to anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      // Close mobile menu if open
      nav.classList.remove('active');
      mobileMenuBtn.classList.remove('active');
      
      // Scroll to target
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
  
  // Add active class to nav items based on scroll position
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', function() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100;
      const sectionId = section.getAttribute('id');
      
      if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        document.querySelector('.nav-item a[href="#' + sectionId + '"]')?.classList.add('active');
      } else {
        document.querySelector('.nav-item a[href="#' + sectionId + '"]')?.classList.remove('active');
      }
    });
  });
  
  // Add loading animation for QR code
  const qrCode = document.querySelector('.qr-code');
  const qrCodeImg = qrCode?.querySelector('img');
  
  if (qrCodeImg) {
    qrCodeImg.addEventListener('click', function() {
      qrCode.classList.add('loading');
      setTimeout(() => {
        qrCode.classList.remove('loading');
      }, 2000);
    });
  }
  
  // Setup pricing carousel
  setupPricingCarousel();
});

// Pricing carousel functionality
function setupPricingCarousel() {
  const pricingSection = document.getElementById('pricing');
  if (!pricingSection) return;
  
  const pricingGrid = pricingSection.querySelector('.pricing-grid');
  if (!pricingGrid) return;
  
  // Get all pricing cards
  const pricingCards = pricingGrid.querySelectorAll('.pricing-card');
  if (pricingCards.length < 2) return;
  
  // Create carousel container
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'carousel-container';
  
  // Create carousel track
  const carouselTrack = document.createElement('div');
  carouselTrack.className = 'carousel-track';
  
  // Create navigation buttons
  const prevButton = document.createElement('button');
  prevButton.className = 'carousel-button prev';
  prevButton.innerHTML = '&lt;';
  prevButton.setAttribute('aria-label', 'Previous plan');
  
  const nextButton = document.createElement('button');
  nextButton.className = 'carousel-button next';
  nextButton.innerHTML = '&gt;';
  nextButton.setAttribute('aria-label', 'Next plan');
  
  // Add elements to DOM
  carouselContainer.appendChild(prevButton);
  carouselContainer.appendChild(carouselTrack);
  carouselContainer.appendChild(nextButton);
  
  // Replace pricing grid with carousel
  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'pricing-carousel';
  carouselWrapper.appendChild(carouselContainer);
  
  pricingGrid.parentNode.insertBefore(carouselWrapper, pricingGrid);
  
  // Move pricing cards to carousel track
  pricingCards.forEach(card => {
    carouselTrack.appendChild(card);
  });
  
  // Remove original pricing grid
  pricingGrid.remove();
  
  // Set initial state
  let currentIndex = 0;
  const totalCards = pricingCards.length;
  
  // Function to update carousel display
  function updateCarousel() {
    pricingCards.forEach((card, index) => {
      // Remove all classes
      card.classList.remove('active', 'prev', 'next');
      
      if (index === currentIndex) {
        card.classList.add('active');
      } else if (index === (currentIndex - 1 + totalCards) % totalCards) {
        card.classList.add('prev');
      } else if (index === (currentIndex + 1) % totalCards) {
        card.classList.add('next');
      }
    });
  }
  
  // Initialize carousel
  updateCarousel();
  
  // Add event listeners for navigation
  prevButton.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalCards) % totalCards;
    updateCarousel();
  });
  
  nextButton.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalCards;
    updateCarousel();
  });
  
  // Auto-rotate every 5 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalCards;
    updateCarousel();
  }, 5000);
}
`;

  // Combine scripts
  const combinedScript = dnsCheckScript + mobileScript;

  // Write index.html with Google Analytics
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtmlWithAnalytics.replace('</body>', `<script>${combinedScript}</script>\n</body>`));
  
  // Update color scheme to match mobile app
  const updatedStylesCss = stylesCss.replace(
    `:root {
    --primary-color: #007bff;
    --primary-dark: #0056b3;`,
    `:root {
    --primary-color: #0088ff;
    --primary-dark: #0066cc;
    --accent-color: #00e676;
    --accent-dark: #00c853;
    --neon-glow: 0 0 10px rgba(0, 136, 255, 0.7);
    --neon-text-glow: 0 0 5px rgba(0, 136, 255, 0.9);
    --background-dark: #121212;
    --background-card: #1e1e1e;
    --text-light: #ffffff;
    --text-gray: #b0b0b0;`
  );
  
  // Add mobile-specific CSS and enhanced animations
  const mobileAndAnimationCSS = `
  /* Force dark theme */
  html, body,
  .features-overview,
  .pricing-section,
  .about-section,
  .app-section,
  .download-section {
    background-color: #121212 !important;
    color: #ffffff !important;
  }
  
  .feature-card,
  .pricing-card,
  .about-item,
  .app-card,
  .team-member {
    background-color: #1e1e1e !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  
  .feature-card p,
  .pricing-features ul li,
  .about-item p,
  .team-member p,
  .section-subtitle {
    color: #b0b0b0 !important;
  }
  
  .feature-card h3,
  .pricing-header h3,
  .about-item h3,
  .team-member h4,
  .section-title {
    color: #0088ff !important;
    text-shadow: 0 0 5px rgba(0, 136, 255, 0.9) !important;
  }
  
  /* Header and navigation */
  .header {
    background-color: #121212 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  
  .logo {
    color: #ffffff !important;
  }
  
  .nav-item a {
    color: #b0b0b0 !important;
  }
  
  .nav-item a:hover,
  .nav-item a.active {
    color: #0088ff !important;
    text-shadow: 0 0 5px rgba(0, 136, 255, 0.9) !important;
  }
  
  /* Game rows */
  .game-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  
  /* Mobile menu styles */
  .mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
    z-index: 1000;
  }
  
  .mobile-menu-btn span {
    display: block;
    width: 25px;
    height: 3px;
    background-color: var(--primary-color);
    margin: 5px 0;
    transition: all 0.3s;
  }
  
  .mobile-menu-btn.active span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  .mobile-menu-btn.active span:nth-child(2) {
    opacity: 0;
  }
  
  .mobile-menu-btn.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
  }
  
  @media (max-width: 768px) {
    .mobile-menu-btn {
      display: block;
    }
    
    .nav {
      position: fixed;
      top: 70px;
      left: 0;
      width: 100%;
      background-color: var(--white);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
      transform: translateY(-100%);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
    }
    
    .nav.active {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }
    
    .nav-list {
      flex-direction: column;
      gap: 15px;
      display: flex !important;
    }
    
    .nav-item {
      width: 100%;
      text-align: center;
    }
  }
  
  /* Add loading animation for QR code */
  .qr-code {
    position: relative;
  }
  
  .qr-code img {
    transition: opacity 0.3s;
  }
  
  .qr-code.loading img {
    opacity: 0.5;
  }
  
  .qr-code.loading::after {
    content: 'Loading...';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--primary-color);
    font-weight: bold;
  }
  
  /* Enhanced UI Elements */
  .button {
    box-shadow: var(--neon-glow);
    transition: all 0.3s ease;
  }
  
  .button:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 15px rgba(0, 136, 255, 0.9);
  }
  
  .primary-button {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  }
  
  /* Pricing Carousel Animation */
  .pricing-grid {
    perspective: 1000px;
  }
  
  .pricing-carousel {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-6);
  }
  
  .carousel-container {
    width: 100%;
    max-width: 1000px;
    position: relative;
    height: 650px;
    perspective: 1000px;
    margin-bottom: 100px;
  }
  
  .carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    font-size: 24px;
    cursor: pointer;
    z-index: 10;
    box-shadow: var(--neon-glow);
    transition: all 0.3s ease;
  }
  
  .carousel-button:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 0 15px rgba(0, 136, 255, 0.9);
  }
  
  .carousel-button.prev {
    left: -25px;
  }
  
  .carousel-button.next {
    right: -25px;
  }
  
  .carousel-track {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.5s ease-in-out;
  }
  
  .pricing-card {
    position: relative;
    width: 320px;
    height: 500px;
    margin: 0 auto;
    background: linear-gradient(145deg, var(--background-card), #252525);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    transition: all 0.3s ease;
    z-index: 50;
  }
  
  .pricing-card:before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    z-index: -1;
    background: linear-gradient(45deg, var(--primary-color), transparent, var(--primary-color));
    border-radius: var(--border-radius-md);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .pricing-card:hover:before {
    opacity: 1;
  }
  
  .pricing-card.popular {
    border-color: var(--primary-color);
  }
  
  .popular-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--primary-color);
    color: var(--text-light);
    padding: 8px 15px;
    font-size: 0.8rem;
    font-weight: bold;
    border-bottom-left-radius: var(--border-radius-sm);
    box-shadow: var(--neon-glow);
  }
  
  .pricing-header {
    padding: var(--spacing-4);
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .pricing-price {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--text-light);
    margin: var(--spacing-2) 0;
  }
  
  .pricing-price span {
    font-size: 1rem;
    opacity: 0.7;
  }
  
  .pricing-features {
    padding: var(--spacing-4);
  }
  
  .pricing-features ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .pricing-features ul li {
    padding: var(--spacing-2) 0;
    position: relative;
    padding-left: 25px;
  }
  
  .pricing-features ul li:before {
    content: '✓';
    color: var(--accent-color);
    position: absolute;
    left: 0;
  }
  
  .pricing-cta {
    padding: var(--spacing-4);
    text-align: center;
    position: absolute;
    bottom: 0;
    width: 100%;
  }
  
  .plan-card {
    position: absolute;
    width: 320px;
    height: 500px;
    left: 50%;
    top: 0;
    transform-origin: center center;
    transition: all 0.5s ease-in-out;
    backface-visibility: hidden;
  }
  
  .plan-card.active {
    z-index: 5;
    transform: translateX(-50%) translateZ(200px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), var(--neon-glow);
  }
  
  .plan-card.prev {
    z-index: 4;
    transform: translateX(-150%) translateZ(100px) rotateY(10deg);
    opacity: 0.5;
    filter: blur(1px);
  }
  
  .plan-card.next {
    z-index: 4;
    transform: translateX(50%) translateZ(100px) rotateY(-10deg);
    opacity: 0.5;
    filter: blur(1px);
  }
  
  /* Feature Card Hover Effects */
  .feature-card {
    transition: all 0.3s ease;
    border: 1px solid transparent;
  }
  
  .feature-card:hover {
    border-color: var(--primary-color);
    box-shadow: var(--neon-glow);
  }
  
  .feature-icon {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    box-shadow: var(--neon-glow);
  }
  
  /* Mobile App-like UI Elements */
  body {
    background-color: var(--background-dark);
    color: var(--text-light);
  }
  
  .header {
    background-color: var(--background-dark);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .logo {
    color: var(--text-light);
  }
  
  .nav-item a {
    color: var(--text-gray);
  }
  
  .nav-item a:hover,
  .nav-item a.active {
    color: var(--primary-color);
    text-shadow: var(--neon-text-glow);
  }
  
  .section-title {
    color: var(--primary-color);
    text-shadow: var(--neon-text-glow);
  }
  
  .section-subtitle {
    color: var(--text-gray);
  }
  
  .features-overview,
  .pricing-section,
  .about-section,
  .app-section,
  .download-section {
    background-color: var(--background-dark);
  }
  
  .feature-card,
  .pricing-card,
  .about-item,
  .app-card {
    background-color: var(--background-card);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .feature-card:hover,
  .pricing-card:hover,
  .about-item:hover,
  .app-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--neon-glow);
    border-color: var(--primary-color);
  }
  
  .app-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-3);
  }
  
  .app-card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary-color);
    text-shadow: var(--neon-text-glow);
  }
  
  .app-card-content {
    color: var(--text-light);
  }
  
  .feature-card p,
  .pricing-features ul li,
  .about-item p {
    color: var(--text-gray);
  }
  
  .feature-card h3,
  .pricing-header h3,
  .about-item h3 {
    color: var(--primary-color);
    text-shadow: var(--neon-text-glow);
  }
  
  .app-toggle {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }
  
  .app-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .app-toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--gray-300);
    transition: .4s;
    border-radius: 24px;
  }
  
  .app-toggle-slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  .app-toggle input:checked + .app-toggle-slider {
    background-color: var(--primary-color);
  }
  
  .app-toggle input:checked + .app-toggle-slider:before {
    transform: translateX(26px);
  }
  
  /* Stats Card */
  .stats-card {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    color: white;
    border-radius: var(--border-radius-md);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    box-shadow: var(--box-shadow);
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .stats-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--neon-glow), 0 15px 30px rgba(0, 0, 0, 0.2);
  }
  
  .stats-value {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: var(--spacing-1);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  
  .stats-label {
    font-size: var(--font-size-sm);
    opacity: 0.9;
    letter-spacing: 0.5px;
  }
  
  /* Stats Cards Grid */
  .stats-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-4);
    margin: var(--spacing-8) 0;
  }
  
  /* App Section */
  .app-section {
    padding: var(--spacing-8) 0;
    background-color: var(--background-dark);
  }
  
  .app-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-6);
    margin-bottom: var(--spacing-6);
  }
  
  /* Game Row Styles */
  .game-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3) 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .game-row:last-child {
    border-bottom: none;
  }
  
  .team {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 45%;
  }
  
  .team-name {
    font-weight: 500;
  }
  
  .team-score {
    font-weight: 700;
    color: var(--primary-color);
  }
  
  .odds {
    font-weight: 700;
    color: var(--accent-color);
    background-color: rgba(0, 230, 118, 0.1);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--border-radius-sm);
  }
  
  @media (max-width: 992px) {
    .app-cards-grid,
    .stats-cards-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 768px) {
    .stats-cards-grid {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 576px) {
    .app-cards-grid {
      grid-template-columns: 1fr;
    }
  }
  
  /* Notification Badge */
  .notification-badge {
    position: relative;
  }
  
  .notification-badge::after {
    content: '';
    position: absolute;
    top: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    background-color: var(--accent-color);
    border-radius: 50%;
  }
  `;

  // Write styles.css with mobile enhancements and updated color scheme
  fs.writeFileSync(path.join(publicDir, 'styles.css'), updatedStylesCss + mobileAndAnimationCSS);
  
  console.log('Static website created successfully!');
} catch (error) {
  console.error('Error creating static website:', error);
  process.exit(1);
}

console.log('Web app build and deployment to public directory completed successfully!');