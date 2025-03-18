import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import '../styles/home.css';
import BetNowButton from '../components/BetNowButton';
import BetNowPopup from '../components/BetNowPopup';
import { useBettingAffiliate } from '../../contexts/BettingAffiliateContext';

const HomePage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { showBetButton } = useBettingAffiliate();
  return (
    <>
      <Helmet>
        <title>AI Sports Edge - AI-Powered Sports Betting Predictions</title>
        <meta name="description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights." />
        <meta name="keywords" content="sports betting, AI predictions, betting analytics, sports edge" />
        <link rel="canonical" href="https://aisportsedge.app" />
        <meta property="og:title" content="AI Sports Edge - AI-Powered Sports Betting Predictions" />
        <meta property="og:description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights." />
        <meta property="og:url" content="https://aisportsedge.app" />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>AI-Powered Sports Betting Predictions</h1>
              <p className="hero-subtitle">
                Get accurate predictions, analytics, and insights for smarter betting decisions.
              </p>
              <div className="hero-buttons">
                <Link to="/download" className="button primary-button">Download App</Link>
                <Link to="/features" className="button secondary-button">Learn More</Link>
                {showBetButton('home') && (
                  <BetNowButton
                    size="large"
                    position="inline"
                    contentType="home"
                  />
                )}
              </div>
            </div>
            <div className="hero-image">
              <img src="https://expo.dev/static/images/favicon-76x76.png" alt="AI Sports Edge App" />
            </div>
          </div>
        </div>
      </section>
      
      <section className="features-overview">
        <div className="container">
          <h2 className="section-title">Why Choose AI Sports Edge?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h3>AI Predictions</h3>
              <p>Advanced machine learning algorithms analyze vast amounts of data to provide accurate betting predictions.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3>Real-Time Analytics</h3>
              <p>Get up-to-the-minute stats, odds, and analysis to make informed betting decisions.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <h3>Multi-Sport Coverage</h3>
              <p>From NFL to Formula 1, we cover all major sports with specialized prediction models for each.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Community Insights</h3>
              <p>Connect with other bettors, share strategies, and learn from the community's collective wisdom.</p>
            </div>
          </div>
          <div className="features-cta">
            <Link to="/features" className="button">Explore All Features</Link>
          </div>
        </div>
      </section>
      
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Download the App</h3>
              <p>Get AI Sports Edge on your iOS or Android device.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Select Your Sports</h3>
              <p>Choose the sports you're interested in betting on.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Get Predictions</h3>
              <p>Receive AI-powered predictions and analytics.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Make Smarter Bets</h3>
              <p>Use our insights to improve your betting strategy.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Betting Strategy?</h2>
            <p>Join thousands of users who are making smarter betting decisions with AI Sports Edge.</p>
            <div className="cta-buttons">
              <Link to="/download" className="button primary-button">Download Now</Link>
              {showBetButton('home') && (
                <BetNowButton
                  size="large"
                  position="inline"
                  contentType="home"
                />
              )}
            </div>
            <button
              className="show-popup-link"
              onClick={() => setShowPopup(true)}
            >
              See our special betting offer
            </button>
          </div>
        </div>
      </section>
      
      {/* Bet Now Popup */}
      <BetNowPopup
        show={showPopup}
        onClose={() => setShowPopup(false)}
        message="Ready to place your bets? Use our exclusive FanDuel affiliate link for a special bonus!"
      />
    </>
  );
};

export default HomePage;