import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import '../styles/pricing.css';
import BetNowButton from '../components/BetNowButton';
import { useBettingAffiliate } from '../../contexts/BettingAffiliateContext';
import { SUBSCRIPTION_PLANS, getMonthlyPlans, getYearlyPlans, getGroupPlan } from '../services/subscriptionService';

const PricingPage = () => {
  const { showBetButton } = useBettingAffiliate();
  const location = useLocation();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [annualPlan, setAnnualPlan] = useState(null);
  const [groupPlan, setGroupPlan] = useState(null);
  
  useEffect(() => {
    // Get monthly plans (excluding group plan)
    const monthlyPlans = getMonthlyPlans().filter(plan => plan.id !== 'group-pro-monthly');
    setSubscriptionPlans(monthlyPlans);
    
    // Get annual plan
    const yearlyPlans = getYearlyPlans();
    if (yearlyPlans.length > 0) {
      setAnnualPlan(yearlyPlans[0]);
    }
    
    // Get group plan
    const group = getGroupPlan();
    if (group) {
      setGroupPlan(group);
    }
    
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
            {subscriptionPlans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={`plan-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <div className="plan-header">
                  <h2 className="plan-name">{plan.name}</h2>
                  <p className="plan-price">
                    ${plan.price}<span>/{plan.interval}</span>
                  </p>
                </div>
                <div className="plan-description">
                  <p>{plan.description}</p>
                </div>
                <div className="plan-features">
                  <ul>
                    {plan.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="plan-cta">
                  <Link 
                    to="/download" 
                    className={`button ${plan.popular ? 'primary-button' : 'secondary-button'}`}
                  >
                    Get Started
                  </Link>
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
            ))}
          </div>
        </div>
      </section>
      
      {annualPlan && (
        <section className="annual-discount" id="annual-discount-section">
          <div className="container">
            <div className="discount-content">
              <h2>Save with our Annual Plan</h2>
              <p>Get {annualPlan.name} for ${annualPlan.price}/year and save compared to monthly billing.</p>
              <div className="discount-buttons">
                <Link to="/download" className="button primary-button">View Annual Plan</Link>
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
      )}
      
      {groupPlan && (
        <section className="group-subscription" id="group-subscription-section">
          <div className="container">
            <div className="group-content">
              <h2>Group Subscription</h2>
              <div className="group-plan-card">
                <div className="group-plan-header">
                  <h3 className="group-plan-name">{groupPlan.name}</h3>
                  <p className="group-plan-price">
                    ${groupPlan.price}<span>/month</span>
                  </p>
                </div>
                <div className="group-plan-description">
                  <p>{groupPlan.description}</p>
                </div>
                <div className="group-plan-features">
                  <ul>
                    {groupPlan.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="group-plan-cta">
                  <Link to="/download" className="button group-button">Create Group Subscription</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
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
              <p>Yes, we offer a 7-day free trial for all new users. You can experience all the features of the Premium plan before deciding to subscribe.</p>
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
              <p>Individual subscriptions are for personal use only. For sharing with friends or family, check out our Group Subscription option which allows up to 3 users.</p>
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