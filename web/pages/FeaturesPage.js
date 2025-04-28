import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import '../styles/features.css';

const FeaturesPage = () => {
  return (
    <>
      <Helmet>
        <title>Features - AI Sports Edge</title>
        <meta name="description" content="Explore the powerful features of AI Sports Edge. AI predictions, real-time analytics, multi-sport coverage, and more." />
        <meta name="keywords" content="AI Sports Edge features, sports betting analytics, AI predictions, betting tools" />
        <link rel="canonical" href="https://aisportsedge.app/features" />
      </Helmet>
      
      <section className="features-hero">
        <div className="container">
          <div className="features-hero-content">
            <h1>Powerful Features for Smarter Betting</h1>
            <p>Discover how AI Sports Edge can transform your betting strategy with cutting-edge technology and data-driven insights.</p>
          </div>
        </div>
      </section>
      
      <section className="features-main">
        <div className="container">
          <div className="feature-item">
            <div className="feature-content">
              <h2>AI-Powered Predictions</h2>
              <p>Our advanced machine learning algorithms analyze vast amounts of historical data, player statistics, team performance metrics, and other relevant factors to generate accurate predictions for upcoming games.</p>
              <ul className="feature-list">
                <li>Win probability calculations</li>
                <li>Point spread predictions</li>
                <li>Over/under recommendations</li>
                <li>Prop bet analysis</li>
                <li>Parlay suggestions</li>
              </ul>
            </div>
            <div className="feature-image">
              <div className="placeholder-image" aria-label="AI Predictions Screenshot"></div>
            </div>
          </div>
          
          <div className="feature-item reverse">
            <div className="feature-content">
              <h2>Real-Time Analytics</h2>
              <p>Stay ahead of the game with up-to-the-minute statistics, odds movements, and in-game analysis that help you make informed decisions at critical moments.</p>
              <ul className="feature-list">
                <li>Live odds tracking</li>
                <li>In-game statistical analysis</li>
                <li>Momentum indicators</li>
                <li>Injury impact assessments</li>
                <li>Weather condition effects</li>
              </ul>
            </div>
            <div className="feature-image">
              <div className="placeholder-image" aria-label="Real-Time Analytics Screenshot"></div>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-content">
              <h2>Multi-Sport Coverage</h2>
              <p>Whether you're betting on football, basketball, baseball, hockey, soccer, or niche sports, AI Sports Edge has you covered with specialized prediction models for each sport.</p>
              <ul className="feature-list">
                <li>NFL, NBA, MLB, NHL coverage</li>
                <li>College sports (NCAA Basketball, Football)</li>
                <li>Soccer leagues (Premier League, La Liga, MLS)</li>
                <li>Formula 1 racing</li>
                <li>UFC and MMA events</li>
                <li>Horse racing</li>
              </ul>
            </div>
            <div className="feature-image">
              <div className="placeholder-image" aria-label="Multi-Sport Coverage Screenshot"></div>
            </div>
          </div>
          
          <div className="feature-item reverse">
            <div className="feature-content">
              <h2>Bankroll Management</h2>
              <p>Take control of your betting finances with our intelligent bankroll management tools that help you maximize returns while minimizing risks.</p>
              <ul className="feature-list">
                <li>Personalized betting unit recommendations</li>
                <li>Risk assessment for each bet</li>
                <li>Profit/loss tracking</li>
                <li>ROI analysis by sport and bet type</li>
                <li>Betting history visualization</li>
              </ul>
            </div>
            <div className="feature-image">
              <div className="placeholder-image" aria-label="Bankroll Management Screenshot"></div>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-content">
              <h2>Community Insights</h2>
              <p>Connect with other bettors, share strategies, and learn from the community's collective wisdom to improve your betting approach.</p>
              <ul className="feature-list">
                <li>Community polls and consensus picks</li>
                <li>Expert analysis and commentary</li>
                <li>Discussion forums by sport</li>
                <li>Strategy sharing</li>
                <li>Leaderboards and competitions</li>
              </ul>
            </div>
            <div className="feature-image">
              <div className="placeholder-image" aria-label="Community Insights Screenshot"></div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="features-cta">
        <div className="container">
          <h2>Ready to Experience These Features?</h2>
          <p>Download AI Sports Edge today and start making smarter betting decisions.</p>
          <Link to="/download" className="button primary-button">Download Now</Link>
        </div>
      </section>
    </>
  );
};

export default FeaturesPage;