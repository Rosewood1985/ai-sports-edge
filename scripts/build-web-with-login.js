const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const publicDir = path.resolve(__dirname, '../public');
const webDir = path.resolve(__dirname, '../web');

// Create a simple static website with login page
console.log('Creating static website with login page...');

// Ensure the public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create index.html with login page
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
  
  <title>AI Sports Edge - Login</title>
  
  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCbHVlIGJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMDQyRkYiLz4KICAKICA8IS0tIEdyYXBoL2NoYXJ0IHNpbGhvdWV0dGUgLS0+CiAgPHBhdGggZD0iTTE2MCAxMjAgTDE2MCAyNTAgUTE2NSAyNDUgMTcwIDI0OCBRMTc1IDI1MCAxODAgMjQ1IFExODUgMjQwIDE5MCAyNDIgUTE5NSAyNDQgMjAwIDI0MCAKICAgICAgICAgICBRMjEwIDIzNSAyMjAgMjM4IFEyMzAgMjQwIDI0MCAyMzUgUTI1MCAyMzAgMjYwIDIzMiBRMjcwIDIzNCAyODAgMjMwIFEyOTAgMjI1IDMwMCAyMjggCiAgICAgICAgICAgUTMxMCAyMzAgMzIwIDIyNSBMMzIwIDEyMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDwhLS0gQUkgU3BvcnRzIEVkZ2UgdGV4dCAtLT4KICA8cGF0aCBkPSJNMTAwIDMwMCBMMTMwIDMwMCBMMTQ1IDM0MCBMMTY1IDMwMCBMMTkwIDMwMCBMMTYwIDM2MCBMMTM1IDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMDAgMzAwIEwyMzAgMzAwIEwyMzAgMzYwIEwyMDAgMzYwIFoiIGZpbGw9IndoaXRlIi8+CiAgCiAgPHBhdGggZD0iTTI0MCAzMDAgUTI3MCAyOTAgMjcwIDMyMCBRMjcwIDM1MCAyNDAgMzQwIEwyNDAgMzYwIFEyOTAgMzcwIDI5MCAzMjAgUTI5MCAyNzAgMjQwIDI4MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0zMDAgMzAwIFEzMzAgMjkwIDMzMCAzMjAgUTMzMCAzNTAgMzAwIDM0MCBMMzAwIDM2MCBRMzUwIDM3MCAzNTAgMzIwIFEzNTAgMjcwIDMwMCAyODAgWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMzYwIDMwMCBMNDAwIDMwMCBMNDAwIDMzMCBMNDMwIDMzMCBMNDMwIDMwMCBMNDUwIDMwMCBMNDUwIDM2MCBMNDMwIDM2MCBMNDMwIDM0MCBMNDAwIDM0MCBMNDAwIDM2MCBMMzYwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDxwYXRoIGQ9Ik0xNTAgMzgwIEwxODAgMzgwIEwxODAgNDQwIEwxNTAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE5MCAzODAgUTIyMCAzNzAgMjIwIDQwMCBRMjIwIDQzMCAxOTAgNDIwIEwxOTAgNDQwIFEyNDAgNDUwIDI0MCA0MDAgUTI0MCAzNTAgMTkwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yNTAgMzgwIEwyODAgMzgwIEwyOTUgNDIwIEwzMTAgMzgwIEwzNDAgMzgwIEwzMTAgNDQwIEwyODAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTM1MCAzODAgUTM4MCAzNzAgMzgwIDQwMCBRMzgwIDQzMCAzNTAgNDIwIEwzNTAgNDQwIFE0MDAgNDUwIDQwMCA0MDAgUTQwMCAzNTAgMzUwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=">
  <link rel="apple-touch-icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCbHVlIGJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMDQyRkYiLz4KICAKICA8IS0tIEdyYXBoL2NoYXJ0IHNpbGhvdWV0dGUgLS0+CiAgPHBhdGggZD0iTTE2MCAxMjAgTDE2MCAyNTAgUTE2NSAyNDUgMTcwIDI0OCBRMTc1IDI1MCAxODAgMjQ1IFExODUgMjQwIDE5MCAyNDIgUTE5NSAyNDQgMjAwIDI0MCAKICAgICAgICAgICBRMjEwIDIzNSAyMjAgMjM4IFEyMzAgMjQwIDI0MCAyMzUgUTI1MCAyMzAgMjYwIDIzMiBRMjcwIDIzNCAyODAgMjMwIFEyOTAgMjI1IDMwMCAyMjggCiAgICAgICAgICAgUTMxMCAyMzAgMzIwIDIyNSBMMzIwIDEyMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDwhLS0gQUkgU3BvcnRzIEVkZ2UgdGV4dCAtLT4KICA8cGF0aCBkPSJNMTAwIDMwMCBMMTMwIDMwMCBMMTQ1IDM0MCBMMTY1IDMwMCBMMTkwIDMwMCBMMTYwIDM2MCBMMTM1IDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMDAgMzAwIEwyMzAgMzAwIEwyMzAgMzYwIEwyMDAgMzYwIFoiIGZpbGw9IndoaXRlIi8+CiAgCiAgPHBhdGggZD0iTTI0MCAzMDAgUTI3MCAyOTAgMjcwIDMyMCBRMjcwIDM1MCAyNDAgMzQwIEwyNDAgMzYwIFEyOTAgMzcwIDI5MCAzMjAgUTI5MCAyNzAgMjQwIDI4MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0zMDAgMzAwIFEzMzAgMjkwIDMzMCAzMjAgUTMzMCAzNTAgMzAwIDM0MCBMMzAwIDM2MCBRMzUwIDM3MCAzNTAgMzIwIFEzNTAgMjcwIDMwMCAyODAgWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMzYwIDMwMCBMNDAwIDMwMCBMNDAwIDMzMCBMNDMwIDMzMCBMNDMwIDMwMCBMNDUwIDMwMCBMNDUwIDM2MCBMNDMwIDM2MCBMNDMwIDM0MCBMNDAwIDM0MCBMNDAwIDM2MCBMMzYwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDxwYXRoIGQ9Ik0xNTAgMzgwIEwxODAgMzgwIEwxODAgNDQwIEwxNTAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE5MCAzODAgUTIyMCAzNzAgMjIwIDQwMCBRMjIwIDQzMCAxOTAgNDIwIEwxOTAgNDQwIFEyNDAgNDUwIDI0MCA0MDAgUTI0MCAzNTAgMTkwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yNTAgMzgwIEwyODAgMzgwIEwyOTUgNDIwIEwzMTAgMzgwIEwzNDAgMzgwIEwzMTAgNDQwIEwyODAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTM1MCAzODAgUTM4MCAzNzAgMzgwIDQwMCBRMzgwIDQzMCAzNTAgNDIwIEwzNTAgNDQwIFE0MDAgNDUwIDQwMCA0MDAgUTQwMCAzNTAgMzUwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
  <!-- Styles -->
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="login.css">
  
  <!-- Sports API -->
  <script src="sports-api.js"></script>
  
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
<body class="login-body">
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">AI Sports Edge</h1>
        <p class="login-subtitle">POWERED BY ADVANCED AI</p>
      </div>

      <div class="login-card">
        <div class="login-card-header">
          <h2>Sign In</h2>
        </div>
        <div class="login-card-body">
          <form id="loginForm">
            <div class="input-group">
              <span class="input-icon">
                <i class="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                class="login-input"
                placeholder="Email"
                required
              />
            </div>
            
            <div class="input-group">
              <span class="input-icon">
                <i class="fas fa-lock"></i>
              </span>
              <input
                type="password"
                class="login-input"
                placeholder="Password"
                required
              />
            </div>
            
            <button 
              type="submit" 
              class="login-button"
            >
              Sign In
            </button>
          </form>
          
          <div class="forgot-password">
            <a href="#">Forgot Password?</a>
          </div>
        </div>
      </div>
      
      <div class="login-footer">
        <p>Don't have an account? <a href="#">Sign Up</a></p>
      </div>
      
      <div class="feature-icons">
        <div class="feature-icon">
          <div class="icon-circle">
            <i class="fas fa-robot"></i>
          </div>
          <span class="icon-text">AI Picks</span>
        </div>
        
        <div class="feature-icon">
          <div class="icon-circle">
            <i class="fas fa-chart-line"></i>
          </div>
          <span class="icon-text">Track Bets</span>
        </div>
        
        <div class="feature-icon">
          <div class="icon-circle">
            <i class="fas fa-trophy"></i>
          </div>
          <span class="icon-text">Rewards</span>
        </div>
        
        <div class="feature-icon">
          <div class="icon-circle">
            <i class="fas fa-bullseye"></i>
          </div>
          <span class="icon-text">Pro Analysis</span>
        </div>
        
        <div class="feature-icon">
          <div class="icon-circle">
            <i class="fas fa-question-circle"></i>
          </div>
          <span class="icon-text">Help & FAQ</span>
        </div>
      </div>
    </div>
    
    <!-- News Ticker -->
    <div class="news-ticker-container">
      <div class="news-ticker">
        <div class="news-ticker-content">
          <!-- Sports data will be loaded from the API -->
          <div class="news-item loading-message">
            <span>Loading sports data...</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Handle login form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Store authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      
      // Redirect to home page
      window.location.href = '/home.html';
    });
  </script>
</body>
</html>`;

// Create home.html (the original index.html content)
const homeHtml = `<!DOCTYPE html>
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
  <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCbHVlIGJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMDQyRkYiLz4KICAKICA8IS0tIEdyYXBoL2NoYXJ0IHNpbGhvdWV0dGUgLS0+CiAgPHBhdGggZD0iTTE2MCAxMjAgTDE2MCAyNTAgUTE2NSAyNDUgMTcwIDI0OCBRMTc1IDI1MCAxODAgMjQ1IFExODUgMjQwIDE5MCAyNDIgUTE5NSAyNDQgMjAwIDI0MCAKICAgICAgICAgICBRMjEwIDIzNSAyMjAgMjM4IFEyMzAgMjQwIDI0MCAyMzUgUTI1MCAyMzAgMjYwIDIzMiBRMjcwIDIzNCAyODAgMjMwIFEyOTAgMjI1IDMwMCAyMjggCiAgICAgICAgICAgUTMxMCAyMzAgMzIwIDIyNSBMMzIwIDEyMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDwhLS0gQUkgU3BvcnRzIEVkZ2UgdGV4dCAtLT4KICA8cGF0aCBkPSJNMTAwIDMwMCBMMTMwIDMwMCBMMTQ1IDM0MCBMMTY1IDMwMCBMMTkwIDMwMCBMMTYwIDM2MCBMMTM1IDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMDAgMzAwIEwyMzAgMzAwIEwyMzAgMzYwIEwyMDAgMzYwIFoiIGZpbGw9IndoaXRlIi8+CiAgCiAgPHBhdGggZD0iTTI0MCAzMDAgUTI3MCAyOTAgMjcwIDMyMCBRMjcwIDM1MCAyNDAgMzQwIEwyNDAgMzYwIFEyOTAgMzcwIDI5MCAzMjAgUTI5MCAyNzAgMjQwIDI4MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0zMDAgMzAwIFEzMzAgMjkwIDMzMCAzMjAgUTMzMCAzNTAgMzAwIDM0MCBMMzAwIDM2MCBRMzUwIDM3MCAzNTAgMzIwIFEzNTAgMjcwIDMwMCAyODAgWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMzYwIDMwMCBMNDAwIDMwMCBMNDAwIDMzMCBMNDMwIDMzMCBMNDMwIDMwMCBMNDUwIDMwMCBMNDUwIDM2MCBMNDMwIDM2MCBMNDMwIDM0MCBMNDAwIDM0MCBMNDAwIDM2MCBMMzYwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDxwYXRoIGQ9Ik0xNTAgMzgwIEwxODAgMzgwIEwxODAgNDQwIEwxNTAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE5MCAzODAgUTIyMCAzNzAgMjIwIDQwMCBRMjIwIDQzMCAxOTAgNDIwIEwxOTAgNDQwIFEyNDAgNDUwIDI0MCA0MDAgUTI0MCAzNTAgMTkwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yNTAgMzgwIEwyODAgMzgwIEwyOTUgNDIwIEwzMTAgMzgwIEwzNDAgMzgwIEwzMTAgNDQwIEwyODAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTM1MCAzODAgUTM4MCAzNzAgMzgwIDQwMCBRMzgwIDQzMCAzNTAgNDIwIEwzNTAgNDQwIFE0MDAgNDUwIDQwMCA0MDAgUTQwMCAzNTAgMzUwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=">
  <link rel="apple-touch-icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCbHVlIGJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMDQyRkYiLz4KICAKICA8IS0tIEdyYXBoL2NoYXJ0IHNpbGhvdWV0dGUgLS0+CiAgPHBhdGggZD0iTTE2MCAxMjAgTDE2MCAyNTAgUTE2NSAyNDUgMTcwIDI0OCBRMTc1IDI1MCAxODAgMjQ1IFExODUgMjQwIDE5MCAyNDIgUTE5NSAyNDQgMjAwIDI0MCAKICAgICAgICAgICBRMjEwIDIzNSAyMjAgMjM4IFEyMzAgMjQwIDI0MCAyMzUgUTI1MCAyMzAgMjYwIDIzMiBRMjcwIDIzNCAyODAgMjMwIFEyOTAgMjI1IDMwMCAyMjggCiAgICAgICAgICAgUTMxMCAyMzAgMzIwIDIyNSBMMzIwIDEyMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDwhLS0gQUkgU3BvcnRzIEVkZ2UgdGV4dCAtLT4KICA8cGF0aCBkPSJNMTAwIDMwMCBMMTMwIDMwMCBMMTQ1IDM0MCBMMTY1IDMwMCBMMTkwIDMwMCBMMTYwIDM2MCBMMTM1IDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMDAgMzAwIEwyMzAgMzAwIEwyMzAgMzYwIEwyMDAgMzYwIFoiIGZpbGw9IndoaXRlIi8+CiAgCiAgPHBhdGggZD0iTTI0MCAzMDAgUTI3MCAyOTAgMjcwIDMyMCBRMjcwIDM1MCAyNDAgMzQwIEwyNDAgMzYwIFEyOTAgMzcwIDI5MCAzMjAgUTI5MCAyNzAgMjQwIDI4MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0zMDAgMzAwIFEzMzAgMjkwIDMzMCAzMjAgUTMzMCAzNTAgMzAwIDM0MCBMMzAwIDM2MCBRMzUwIDM3MCAzNTAgMzIwIFEzNTAgMjcwIDMwMCAyODAgWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMzYwIDMwMCBMNDAwIDMwMCBMNDAwIDMzMCBMNDMwIDMzMCBMNDMwIDMwMCBMNDUwIDMwMCBMNDUwIDM2MCBMNDMwIDM2MCBMNDMwIDM0MCBMNDAwIDM0MCBMNDAwIDM2MCBMMzYwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDxwYXRoIGQ9Ik0xNTAgMzgwIEwxODAgMzgwIEwxODAgNDQwIEwxNTAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE5MCAzODAgUTIyMCAzNzAgMjIwIDQwMCBRMjIwIDQzMCAxOTAgNDIwIEwxOTAgNDQwIFEyNDAgNDUwIDI0MCA0MDAgUTI0MCAzNTAgMTkwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yNTAgMzgwIEwyODAgMzgwIEwyOTUgNDIwIEwzMTAgMzgwIEwzNDAgMzgwIEwzMTAgNDQwIEwyODAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTM1MCAzODAgUTM4MCAzNzAgMzgwIDQwMCBRMzgwIDQzMCAzNTAgNDIwIEwzNTAgNDQwIFE0MDAgNDUwIDQwMCA0MDAgUTQwMCAzNTAgMzUwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
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
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCbHVlIGJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMDQyRkYiLz4KICAKICA8IS0tIEdyYXBoL2NoYXJ0IHNpbGhvdWV0dGUgLS0+CiAgPHBhdGggZD0iTTE2MCAxMjAgTDE2MCAyNTAgUTE2NSAyNDUgMTcwIDI0OCBRMTc1IDI1MCAxODAgMjQ1IFExODUgMjQwIDE5MCAyNDIgUTE5NSAyNDQgMjAwIDI0MCAKICAgICAgICAgICBRMjEwIDIzNSAyMjAgMjM4IFEyMzAgMjQwIDI0MCAyMzUgUTI1MCAyMzAgMjYwIDIzMiBRMjcwIDIzNCAyODAgMjMwIFEyOTAgMjI1IDMwMCAyMjggCiAgICAgICAgICAgUTMxMCAyMzAgMzIwIDIyNSBMMzIwIDEyMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDwhLS0gQUkgU3BvcnRzIEVkZ2UgdGV4dCAtLT4KICA8cGF0aCBkPSJNMTAwIDMwMCBMMTMwIDMwMCBMMTQ1IDM0MCBMMTY1IDMwMCBMMTkwIDMwMCBMMTYwIDM2MCBMMTM1IDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMDAgMzAwIEwyMzAgMzAwIEwyMzAgMzYwIEwyMDAgMzYwIFoiIGZpbGw9IndoaXRlIi8+CiAgCiAgPHBhdGggZD0iTTI0MCAzMDAgUTI3MCAyOTAgMjcwIDMyMCBRMjcwIDM1MCAyNDAgMzQwIEwyNDAgMzYwIFEyOTAgMzcwIDI5MCAzMjAgUTI5MCAyNzAgMjQwIDI4MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0zMDAgMzAwIFEzMzAgMjkwIDMzMCAzMjAgUTMzMCAzNTAgMzAwIDM0MCBMMzAwIDM2MCBRMzUwIDM3MCAzNTAgMzIwIFEzNTAgMjcwIDMwMCAyODAgWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMzYwIDMwMCBMNDAwIDMwMCBMNDAwIDMzMCBMNDMwIDMzMCBMNDMwIDMwMCBMNDUwIDMwMCBMNDUwIDM2MCBMNDMwIDM2MCBMNDMwIDM0MCBMNDAwIDM0MCBMNDAwIDM2MCBMMzYwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDxwYXRoIGQ9Ik0xNTAgMzgwIEwxODAgMzgwIEwxODAgNDQwIEwxNTAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE5MCAzODAgUTIyMCAzNzAgMjIwIDQwMCBRMjIwIDQzMCAxOTAgNDIwIEwxOTAgNDQwIFEyNDAgNDUwIDI0MCA0MDAgUTI0MCAzNTAgMTkwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yNTAgMzgwIEwyODAgMzgwIEwyOTUgNDIwIEwzMTAgMzgwIEwzNDAgMzgwIEwzMTAgNDQwIEwyODAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTM1MCAzODAgUTM4MCAzNzAgMzgwIDQwMCBRMzgwIDQzMCAzNTAgNDIwIEwzNTAgNDQwIFE0MDAgNDUwIDQwMCA0MDAgUTQwMCAzNTAgMzUwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=" alt="AI Sports Edge Logo" style="width: 40px; height: 40px;">
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
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCbHVlIGJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMDQyRkYiLz4KICAKICA8IS0tIEdyYXBoL2NoYXJ0IHNpbGhvdWV0dGUgLS0+CiAgPHBhdGggZD0iTTE2MCAxMjAgTDE2MCAyNTAgUTE2NSAyNDUgMTcwIDI0OCBRMTc1IDI1MCAxODAgMjQ1IFExODUgMjQwIDE5MCAyNDIgUTE5NSAyNDQgMjAwIDI0MCAKICAgICAgICAgICBRMjEwIDIzNSAyMjAgMjM4IFEyMzAgMjQwIDI0MCAyMzUgUTI1MCAyMzAgMjYwIDIzMiBRMjcwIDIzNCAyODAgMjMwIFEyOTAgMjI1IDMwMCAyMjggCiAgICAgICAgICAgUTMxMCAyMzAgMzIwIDIyNSBMMzIwIDEyMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDwhLS0gQUkgU3BvcnRzIEVkZ2UgdGV4dCAtLT4KICA8cGF0aCBkPSJNMTAwIDMwMCBMMTMwIDMwMCBMMTQ1IDM0MCBMMTY1IDMwMCBMMTkwIDMwMCBMMTYwIDM2MCBMMTM1IDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMDAgMzAwIEwyMzAgMzAwIEwyMzAgMzYwIEwyMDAgMzYwIFoiIGZpbGw9IndoaXRlIi8+CiAgCiAgPHBhdGggZD0iTTI0MCAzMDAgUTI3MCAyOTAgMjcwIDMyMCBRMjcwIDM1MCAyNDAgMzQwIEwyNDAgMzYwIFEyOTAgMzcwIDI5MCAzMjAgUTI5MCAyNzAgMjQwIDI4MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0zMDAgMzAwIFEzMzAgMjkwIDMzMCAzMjAgUTMzMCAzNTAgMzAwIDM0MCBMMzAwIDM2MCBRMzUwIDM3MCAzNTAgMzIwIFEzNTAgMjcwIDMwMCAyODAgWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMzYwIDMwMCBMNDAwIDMwMCBMNDAwIDMzMCBMNDMwIDMzMCBMNDMwIDMwMCBMNDUwIDMwMCBMNDUwIDM2MCBMNDMwIDM2MCBMNDMwIDM0MCBMNDAwIDM0MCBMNDAwIDM2MCBMMzYwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDxwYXRoIGQ9Ik0xNTAgMzgwIEwxODAgMzgwIEwxODAgNDQwIEwxNTAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE5MCAzODAgUTIyMCAzNzAgMjIwIDQwMCBRMjIwIDQzMCAxOTAgNDIwIEwxOTAgNDQwIFEyNDAgNDUwIDI0MCA0MDAgUTI0MCAzNTAgMTkwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yNTAgMzgwIEwyODAgMzgwIEwyOTUgNDIwIEwzMTAgMzgwIEwzNDAgMzgwIEwzMTAgNDQwIEwyODAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTM1MCAzODAgUTM4MCAzNzAgMzgwIDQwMCBRMzgwIDQzMCAzNTAgNDIwIEwzNTAgNDQwIFE0MDAgNDUwIDQwMCA0MDAgUTQwMCAzNTAgMzUwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=" alt="AI Sports Edge" style="width: 150px; height: 150px;">
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
  
  <!-- Rest of the content remains the same as in the original index.html -->
  <!-- ... -->
  
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">AI Sports Edge</h3>
          <p class="footer-description">
            Your ultimate sports betting companion powered by AI. Get predictions, analytics, and insights for smarter betting decisions.
          </p>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} AI Sports Edge. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script>
    // Check if user is authenticated
    document.addEventListener('DOMContentLoaded', function() {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!isAuthenticated) {
        // Redirect to login page if not authenticated
        window.location.href = '/';
      }
    });
    
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
    });
  </script>
</body>
</html>`;

// Create login.css
const loginCss = `/* Login Page Styles */
.login-body {
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #000428 0%, #004e92 100%);
  min-height: 100vh;
  font-family: var(--font-family);
}

.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCbHVlIGJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMDQyRkYiLz4KICAKICA8IS0tIEdyYXBoL2NoYXJ0IHNpbGhvdWV0dGUgLS0+CiAgPHBhdGggZD0iTTE2MCAxMjAgTDE2MCAyNTAgUTE2NSAyNDUgMTcwIDI0OCBRMTc1IDI1MCAxODAgMjQ1IFExODUgMjQwIDE5MCAyNDIgUTE5NSAyNDQgMjAwIDI0MCAKICAgICAgICAgICBRMjEwIDIzNSAyMjAgMjM4IFEyMzAgMjQwIDI0MCAyMzUgUTI1MCAyMzAgMjYwIDIzMiBRMjcwIDIzNCAyODAgMjMwIFEyOTAgMjI1IDMwMCAyMjggCiAgICAgICAgICAgUTMxMCAyMzAgMzIwIDIyNSBMMzIwIDEyMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDwhLS0gQUkgU3BvcnRzIEVkZ2UgdGV4dCAtLT4KICA8cGF0aCBkPSJNMTAwIDMwMCBMMTMwIDMwMCBMMTQ1IDM0MCBMMTY1IDMwMCBMMTkwIDMwMCBMMTYwIDM2MCBMMTM1IDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMDAgMzAwIEwyMzAgMzAwIEwyMzAgMzYwIEwyMDAgMzYwIFoiIGZpbGw9IndoaXRlIi8+CiAgCiAgPHBhdGggZD0iTTI0MCAzMDAgUTI3MCAyOTAgMjcwIDMyMCBRMjcwIDM1MCAyNDAgMzQwIEwyNDAgMzYwIFEyOTAgMzcwIDI5MCAzMjAgUTI5MCAyNzAgMjQwIDI4MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0zMDAgMzAwIFEzMzAgMjkwIDMzMCAzMjAgUTMzMCAzNTAgMzAwIDM0MCBMMzAwIDM2MCBRMzUwIDM3MCAzNTAgMzIwIFEzNTAgMjcwIDMwMCAyODAgWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMzYwIDMwMCBMNDAwIDMwMCBMNDAwIDMzMCBMNDMwIDMzMCBMNDMwIDMwMCBMNDUwIDMwMCBMNDUwIDM2MCBMNDMwIDM2MCBMNDMwIDM0MCBMNDAwIDM0MCBMNDAwIDM2MCBMMzYwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIAogIDxwYXRoIGQ9Ik0xNTAgMzgwIEwxODAgMzgwIEwxODAgNDQwIEwxNTAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE5MCAzODAgUTIyMCAzNzAgMjIwIDQwMCBRMjIwIDQzMCAxOTAgNDIwIEwxOTAgNDQwIFEyNDAgNDUwIDI0MCA0MDAgUTI0MCAzNTAgMTkwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yNTAgMzgwIEwyODAgMzgwIEwyOTUgNDIwIEwzMTAgMzgwIEwzNDAgMzgwIEwzMTAgNDQwIEwyODAgNDQwIFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTM1MCAzODAgUTM4MCAzNzAgMzgwIDQwMCBRMzgwIDQzMCAzNTAgNDIwIEwzNTAgNDQwIFE0MDAgNDUwIDQwMCA0MDAgUTQwMCAzNTAgMzUwIDM2MCBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=') no-repeat center center;
  background-size: 300px;
  opacity: 0.05;
  z-index: 0;
}

.login-container {
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  z-index: 1;
}

.login-title {
  color: #ffffff;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.7), 
               0 0 20px rgba(0, 229, 255, 0.5),
               0 0 30px rgba(0, 229, 255, 0.3);
  animation: glow 1.5s ease-in-out infinite alternate;
}

.login-subtitle {
  color: #00e5ff;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 0.875rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.7);
}

.login-card {
  background: rgba(30, 30, 30, 0.8);
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.3),
              0 0 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 0 25px rgba(0, 229, 255, 0.4),
              0 0 50px rgba(0, 0, 0, 0.1);
}

.login-card-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.login-card-header h2 {
  color: #ffffff;
  font-size: 1.5rem;
  margin-bottom: 0;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.5);
}

.login-card-body {
  padding: 2rem;
}

.input-group {
  position: relative;
  margin-bottom: 1.5rem;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaaaaa;
  font-size: 1.2rem;
}

.login-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 3rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.login-input:focus {
  outline: none;
  border-color: #00e5ff;
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.2);
}

.login-input::placeholder {
  color: #666666;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #0066ff 0%, #00e5ff 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
  margin-top: 1rem;
}

.login-button:hover {
  background: linear-gradient(135deg, #00e5ff 0%, #0066ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}

.login-button:active {
  transform: translateY(0);
}

.forgot-password {
  text-align: center;
  margin-top: 1rem;
}

.forgot-password a {
  color: #aaaaaa;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.forgot-password a:hover {
  color: #00e5ff;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.5);
}

.login-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.login-footer p {
  color: #aaaaaa;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.login-footer a {
  color: #00e5ff;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.3);
}

.login-footer a:hover {
  color: #ffffff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.7);
}

.feature-icons {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding: 0 1rem;
}

.feature-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-icon:hover {
  transform: translateY(-5px);
}

.icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 102, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  color: #00e5ff;
  font-size: 1.5rem;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
  transition: all 0.3s ease;
}

.feature-icon:hover .icon-circle {
  background: rgba(0, 229, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}

.icon-text {
  color: #aaaaaa;
  font-size: 0.75rem;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-icon:hover .icon-text {
  color: #ffffff;
}

/* News Ticker Styles */
.news-ticker-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.5rem 0;
  z-index: 10;
  border-top: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.3);
}

.news-ticker {
  white-space: nowrap;
  overflow: hidden;
  position: relative;
}

.news-ticker-content {
  display: inline-block;
  animation: ticker 45s linear infinite; /* Slowed down from 30s to 45s */
  padding-left: 100%;
}

.news-ticker-content:hover {
  animation-play-state: paused;
}

.news-item {
  display: inline-block;
  margin-right: 1.5rem;
  color: #ffffff;
  font-size: 0.875rem;
}

.news-date {
  color: #00e5ff;
  font-weight: 600;
  margin-right: 0.5rem;
}

.news-teams {
  color: #ffffff;
}

.news-time {
  color: #aaaaaa;
  margin-left: 0.5rem;
}

.news-sport {
  color: #00e5ff;
}

.loading-message {
  color: #aaaaaa;
  text-align: center;
  width: 100%;
  padding: 0.5rem 0;
}

@keyframes ticker {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* Animations */
@keyframes glow {
  from {
    text-shadow: 0 0 5px rgba(0, 229, 255, 0.7),
                 0 0 10px rgba(0, 229, 255, 0.5),
                 0 0 15px rgba(0, 229, 255, 0.3);
  }
  to {
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.7),
                 0 0 20px rgba(0, 229, 255, 0.5),
                 0 0 30px rgba(0, 229, 255, 0.3);
  }
}

/* Responsive styles */
@media (max-width: 575.98px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-title {
    font-size: 2rem;
  }
  
  .feature-icons {
    margin-top: 1.5rem;
  }
  
  .feature-icon {
    width: 25%;
  }
  
  .icon-circle {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
}`;

// Write files to public directory
try {
  // Clear the public directory first (except for README.md and sports API files)
  const publicFiles = fs.readdirSync(publicDir);
  for (const file of publicFiles) {
    if (file !== 'README.md' && !file.startsWith('sports-api')) {
      const filePath = path.join(publicDir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  }

  // Write index.html (login page)
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);
  
  // Write home.html
  fs.writeFileSync(path.join(publicDir, 'home.html'), homeHtml);
  
  // Write login.css
  fs.writeFileSync(path.join(publicDir, 'login.css'), loginCss);
  
  // Copy the global.css from the original build script
  const stylesCss = `
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #0088ff;
  --primary-dark: #0066cc;
  --accent-color: #00e676;
  --accent-dark: #00c853;
  --neon-glow: 0 0 10px rgba(0, 136, 255, 0.7);
  --neon-text-glow: 0 0 5px rgba(0, 136, 255, 0.9);
  --background-dark: #121212;
  --background-card: #1e1e1e;
  --text-light: #ffffff;
  --text-gray: #b0b0b0;
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
  color: var(--text-light);
  background-color: var(--background-dark);
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
  color: var(--text-light);
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
  color: var(--text-gray);
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
  transition: all 0.3s ease;
  box-shadow: var(--neon-glow);
}

.button:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 15px rgba(0, 136, 255, 0.9);
}

.primary-button {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--white);
}

.secondary-button {
  background-color: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.secondary-button:hover {
  background-color: rgba(0, 136, 255, 0.1);
}

/* Header */
.header {
  background-color: var(--background-dark);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: var(--text-light);
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
  color: var(--text-gray);
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.nav-item a:hover,
.nav-item a.active {
  color: var(--primary-color);
  text-shadow: var(--neon-text-glow);
}

.nav-item a.active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
  box-shadow: var(--neon-glow);
}

.download-button {
  background-color: var(--primary-color);
  color: var(--white) !important;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-sm);
  transition: all 0.3s ease;
  box-shadow: var(--neon-glow);
}

.download-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(0, 136, 255, 0.9);
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
  color: var(--primary-color);
  text-shadow: var(--neon-text-glow);
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-6);
  opacity: 0.9;
  color: var(--text-light);
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
    background-color: var(--background-dark);
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
}

@media (max-width: 576px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    gap: var(--spacing-2);
  }
}`;

  // Write styles.css
  fs.writeFileSync(path.join(publicDir, 'styles.css'), stylesCss);
  
  console.log('Static website with login page created successfully!');
} catch (error) {
  console.error('Error creating static website:', error);
  process.exit(1);
}

console.log('Web app build and deployment to public directory completed successfully!');