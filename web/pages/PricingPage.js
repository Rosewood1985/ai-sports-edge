import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import '../styles/pricing.css';
import BetNowButton from '../components/BetNowButton';
import { useBettingAffiliate } from '../../contexts/BettingAffiliateContext';

const PricingPage = () => {
  const { showBetButton } = useBettingAffiliate();
  const location = useLocation();
  
  // Clean up any pricing-related elements when navigating away
  useEffect(() => {
    // This effect runs when the component mounts
    
    // Return a cleanup function that runs when the component unmounts
    return () => {
      // Remove any pricing-related elements that might be overlaying other content
      const pricingElements = document.querySelectorAll('.pricing-overlay, .pricing-modal');
      pricingElements.forEach(element => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      
      // Reset any body classes or styles that might have been added
      document.body.classList.remove('pricing-page-active');
      
      // Clear any pricing-related timeouts
      const timeoutIds = window.pricingTimeouts || [];
      timeoutIds.forEach(id => clearTimeout(id));
      window.pricingTimeouts = [];
    };
  }, [location]);
  return (
    <>
      <Helmet>
        <title>Pricing - AI Sports Edge</title>
        <meta name="description" content="Explore AI Sports Edge subscription plans. Choose the plan that fits your betting strategy and budget." />
        <meta name="keywords" content="AI Sports Edge pricing, subscription plans, sports betting app pricing" />
        <link rel="canonical" href="https://aisportsedge.app/pricing" />
      </Helmet>
      
      <section className="pricing-hero">
        <div className="container">
          <div className="pricing-hero-content">
            <h1>Simple, Transparent Pricing</h1>
            <p>Choose the plan that fits your betting strategy and budget.</p>
          </div>
        </div>
      </section>
      
      <section className="pricing-plans">
        <div className="container">
          <div className="plans-grid">
            <div className="plan-card">
              <div className="plan-header">
                <h2 className="plan-name">Free</h2>
                <p className="plan-price">$0<span>/month</span></p>
              </div>
              <div className="plan-features">
                <ul>
                  <li>Basic AI predictions</li>
                  <li>Limited sports coverage</li>
                  <li>Daily free pick</li>
                  <li>Community access</li>
                  <li>Basic stats and odds</li>
                </ul>
              </div>
              <div className="plan-cta">
                <Link to="/download" className="button secondary-button">Get Started</Link>
                {showBetButton('pricing') && (
                  <div className="plan-bet-button">
                    <BetNowButton
                      size="medium"
                      position="inline"
                      contentType="pricing"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="plan-card popular">
              <div className="popular-badge">Most Popular</div>
              <div className="plan-header">
                <h2 className="plan-name">Pro</h2>
                <p className="plan-price">$19.99<span>/month</span></p>
              </div>
              <div className="plan-features">
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
              <div className="plan-cta">
                <Link to="/download" className="button primary-button">Get Started</Link>
                {showBetButton('pricing') && (
                  <div className="plan-bet-button">
                    <BetNowButton
                      size="medium"
                      position="inline"
                      contentType="pricing"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="plan-card">
              <div className="plan-header">
                <h2 className="plan-name">Elite</h2>
                <p className="plan-price">$39.99<span>/month</span></p>
              </div>
              <div className="plan-features">
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
              <div className="plan-cta">
                <Link to="/download" className="button secondary-button">Get Started</Link>
                {showBetButton('pricing') && (
                  <div className="plan-bet-button">
                    <BetNowButton
                      size="medium"
                      position="inline"
                      contentType="pricing"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="annual-discount" id="annual-discount-section">
        <div className="container">
          <div className="discount-content">
            <h2>Save 20% with Annual Plans</h2>
            <p>Get two months free when you subscribe to an annual plan.</p>
            <div className="discount-buttons">
              <Link to="/download" className="button primary-button">View Annual Plans</Link>
              {showBetButton('pricing') && (
                <BetNowButton
                  size="large"
                  position="inline"
                  contentType="pricing"
                />
              )}
            </div>
          </div>
        </div>
      </section>
      
      <section className="pricing-faq">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Can I cancel my subscription at any time?</h3>
              <p>Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is there a free trial available?</h3>
              <p>Yes, we offer a 7-day free trial for all new users. You can experience all the features of the Pro plan before deciding to subscribe.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I upgrade or downgrade my plan?</h3>
              <p>You can easily upgrade or downgrade your plan at any time through the app's settings menu. Changes will take effect at the start of your next billing cycle.</p>
            </div>
            
            <div className="faq-item">
              <h3>Do you offer refunds?</h3>
              <p>We offer a 30-day money-back guarantee if you're not satisfied with your subscription. Contact our support team to request a refund.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I share my account with others?</h3>
              <p>Our subscriptions are for individual use only. Sharing accounts is against our terms of service and may result in account termination.</p>
            </div>
            
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We accept all major credit cards, PayPal, and Apple Pay/Google Pay for mobile subscriptions.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="pricing-cta">
        <div className="container">
          <h2>Ready to Elevate Your Betting Strategy?</h2>
          <p>Join thousands of users who are making smarter betting decisions with AI Sports Edge.</p>
          <div className="cta-buttons">
            <Link to="/download" className="button primary-button">Download Now</Link>
            {showBetButton('pricing') && (
              <BetNowButton
                size="large"
                position="inline"
                contentType="pricing"
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingPage;