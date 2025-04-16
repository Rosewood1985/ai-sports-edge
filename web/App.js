import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BettingAffiliateProvider } from './contexts/BettingAffiliateContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LanguageSwitcher from './components/LanguageSwitcher';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import DownloadPage from './pages/DownloadPage';
import OddsPage from './pages/OddsPage';
import PredictionsPage from './pages/PredictionsPage';
import OnboardingPage from './pages/OnboardingPage';
import FeatureTourPage from './pages/FeatureTourPage';
import NotFoundPage from './pages/NotFoundPage';
import { isOnboardingCompleted } from './services/onboardingService';

const App = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Set language based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/es/')) {
      i18n.changeLanguage('es');
    } else {
      i18n.changeLanguage('en');
    }
  }, [location.pathname, i18n]);
  
  // Check if onboarding has been completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await isOnboardingCompleted();
        setOnboardingComplete(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to showing onboarding if there's an error
        setOnboardingComplete(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkOnboarding();
  }, []);
  
  // Redirect to onboarding if not completed
  useEffect(() => {
    if (onboardingComplete === false && !loading) {
      const currentPath = location.pathname;
      const isOnboardingPath = currentPath.endsWith('/onboarding') || currentPath.endsWith('/feature-tour');
      const languagePrefix = currentPath.startsWith('/es') ? '/es' : '';
      
      if (!isOnboardingPath && !currentPath.endsWith('/login') && !currentPath.includes('/login?')) {
        navigate(`${languagePrefix}/onboarding`);
      }
    }
  }, [onboardingComplete, loading, location.pathname, navigate]);
  
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
    
    // Normalize path by removing language prefix
    const path = location.pathname.replace(/^\/es/, '');
    
    // Add class based on normalized path
    if (path === '/' || path === '') {
      document.body.classList.add('home-page');
    } else if (path === '/features') {
      document.body.classList.add('features-page');
    } else if (path === '/pricing') {
      document.body.classList.add('pricing-page');
    } else if (path === '/about') {
      document.body.classList.add('about-page');
    } else if (path === '/download') {
      document.body.classList.add('download-page');
    } else if (path === '/odds') {
      document.body.classList.add('odds-page');
    } else if (path === '/predictions') {
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
  
  // Check if the current route is the login page (in any language)
  const isLoginPage = location.pathname === '/login' || location.pathname === '/es/login';

  // Simple notification permission component for web with translations
  const NotificationPermission = () => {
    const [showBanner, setShowBanner] = useState(false);
    const { t } = useTranslation('common');
    
    useEffect(() => {
      // Check if browser supports notifications
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        setShowBanner(true);
      }
    }, []);
    
    const requestPermission = () => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setShowBanner(false);
        }
      });
    };
    
    if (!showBanner) return null;
    
    return (
      <div className="notification-banner">
        <p>{t('notifications.enableMessage')}</p>
        <button onClick={requestPermission}>{t('notifications.enableButton')}</button>
        <button className="close-button" onClick={() => setShowBanner(false)}>×</button>
      </div>
    );
  };

  return (
    <BettingAffiliateProvider>
      <div className="app">
        {/* Only show Header, LanguageSwitcher, and Footer if not on login page */}
        {!isLoginPage && <Header />}
        {!isLoginPage && <LanguageSwitcher />}
        {!isLoginPage && <NotificationPermission />}
        <main className={`main-content ${isLoginPage ? 'login-main' : ''}`}>
          <Routes>
            {/* English routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/feature-tour" element={<FeatureTourPage />} />
            
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
            <Route path="/group-subscription" element={
              <ProtectedRoute>
                <PricingPage groupSubscription={true} />
              </ProtectedRoute>
            } />
            
            {/* Spanish routes */}
            <Route path="/es/login" element={<LoginPage />} />
            <Route path="/es/onboarding" element={<OnboardingPage />} />
            <Route path="/es/feature-tour" element={<FeatureTourPage />} />
            
            <Route path="/es/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/es/features" element={
              <ProtectedRoute>
                <FeaturesPage />
              </ProtectedRoute>
            } />
            <Route path="/es/pricing" element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            } />
            <Route path="/es/about" element={
              <ProtectedRoute>
                <AboutPage />
              </ProtectedRoute>
            } />
            <Route path="/es/download" element={
              <ProtectedRoute>
                <DownloadPage />
              </ProtectedRoute>
            } />
            <Route path="/es/odds" element={
              <ProtectedRoute>
                <OddsPage />
              </ProtectedRoute>
            } />
            <Route path="/es/predictions" element={
              <ProtectedRoute>
                <PredictionsPage />
              </ProtectedRoute>
            } />
            <Route path="/es/group-subscription" element={
              <ProtectedRoute>
                <PricingPage groupSubscription={true} />
              </ProtectedRoute>
            } />
            
            {/* Redirects */}
            <Route path="/es" element={<Navigate to="/es/" replace />} />
            
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