import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { BettingAffiliateProvider } from '../contexts/BettingAffiliateContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import DownloadPage from './pages/DownloadPage';
import OddsPage from './pages/OddsPage';
import PredictionsPage from './pages/PredictionsPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  const location = useLocation();
  
  // Add page-specific class to body based on current route
  useEffect(() => {
    // Remove all page-specific classes
    document.body.classList.remove(
      'home-page',
      'features-page',
      'pricing-page',
      'about-page',
      'download-page',
      'odds-page',
      'predictions-page'
    );
    
    // Add class based on current path
    if (location.pathname === '/') {
      document.body.classList.add('home-page');
    } else if (location.pathname === '/features') {
      document.body.classList.add('features-page');
    } else if (location.pathname === '/pricing') {
      document.body.classList.add('pricing-page');
    } else if (location.pathname === '/about') {
      document.body.classList.add('about-page');
    } else if (location.pathname === '/download') {
      document.body.classList.add('download-page');
    } else if (location.pathname === '/odds') {
      document.body.classList.add('odds-page');
    } else if (location.pathname === '/predictions') {
      document.body.classList.add('predictions-page');
    }
    
    // Clean up any overlays or modals when navigating between pages
    // Use a more aggressive approach to find and remove all pricing-related elements
    const overlayElements = document.querySelectorAll(
      '.pricing-overlay, .pricing-modal, .elite-plan-modal, .pro-plan-modal, ' +
      '.bet-now-popup-overlay, [id^="pricing-"], [class^="pricing-"], ' +
      '.elite, .pro, .annual-discount, .plan-comparison'
    );
    
    overlayElements.forEach(element => {
      if (element && element.parentNode) {
        console.log('Removing overlay element:', element.className || element.id);
        element.parentNode.removeChild(element);
      }
    });
    
    // Also remove any inline styles that might be causing issues
    const allElements = document.querySelectorAll('*[style*="z-index"]');
    if (location.pathname !== '/pricing') {
      allElements.forEach(element => {
        if (element.style.zIndex > 100) {
          console.log('Resetting high z-index on element:', element.className || element.id);
          element.style.zIndex = 'auto';
        }
      });
    }
    
    // Reset any additional body classes or styles that might have been added
    document.body.classList.remove('modal-open');
    
    // Clear any timeouts
    const timeoutIds = window.globalTimeouts || [];
    timeoutIds.forEach(id => clearTimeout(id));
    window.globalTimeouts = [];
    
    // Force z-index reset for all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      if (section.style.zIndex) {
        section.style.zIndex = 'auto';
      }
    });
    
    // Add cleanup class to force remove any stuck elements
    document.body.classList.add('pricing-cleanup');
    setTimeout(() => {
      document.body.classList.remove('pricing-cleanup');
    }, 100);
    
    // Return cleanup function
    return () => {
      // Ensure all timeouts are cleared
      const allTimeouts = window.globalTimeouts || [];
      allTimeouts.forEach(id => clearTimeout(id));
      window.globalTimeouts = [];
      
      // Remove any bet-now-popup-open class
      document.body.classList.remove('bet-now-popup-open');
    };
  }, [location.pathname]);
  
  // Check if the current route is the login page
  const isLoginPage = location.pathname === '/login';

  return (
    <BettingAffiliateProvider>
      <div className="app">
        {/* Only show Header and Footer if not on login page */}
        {!isLoginPage && <Header />}
        <main className={`main-content ${isLoginPage ? 'login-main' : ''}`}>
          <Routes>
            {/* Login route */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/features" element={
              <ProtectedRoute>
                <FeaturesPage />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            } />
            <Route path="/about" element={
              <ProtectedRoute>
                <AboutPage />
              </ProtectedRoute>
            } />
            <Route path="/download" element={
              <ProtectedRoute>
                <DownloadPage />
              </ProtectedRoute>
            } />
            <Route path="/odds" element={
              <ProtectedRoute>
                <OddsPage />
              </ProtectedRoute>
            } />
            <Route path="/predictions" element={
              <ProtectedRoute>
                <PredictionsPage />
              </ProtectedRoute>
            } />
            
            {/* Not found route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {!isLoginPage && <Footer />}
      </div>
    </BettingAffiliateProvider>
  );
};

export default App;