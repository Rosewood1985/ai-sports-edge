import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import featureTourService from '../services/featureTourService';

/**
 * FeatureTourPage component for web
 * Provides an interactive tour of the app's key features
 */
const FeatureTourPage = () => {
  const { t, i18n } = useTranslation(['common', 'onboarding']);
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const languagePrefix = i18n.language === 'es' ? '/es' : '';

  // Load feature tour steps
  useEffect(() => {
    const loadSteps = async () => {
      try {
        setLoading(true);
        const tourSteps = await featureTourService.getFeatureTourSteps(i18n.language);
        setSteps(tourSteps);
        
        // Track page view
        if (window.gtag) {
          window.gtag('event', 'page_view', {
            page_title: t('onboarding:featureTour.pageTitle'),
            page_location: window.location.href,
            page_path: window.location.pathname,
          });
        }
      } catch (error) {
        console.error('Error loading feature tour steps:', error);
        // Show error message
        alert(t('common:error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadSteps();
  }, [i18n.language, t]);

  // Update document title and meta description based on language
  useEffect(() => {
    // Set page title
    document.title = t('onboarding:featureTour.pageTitle');
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('onboarding:featureTour.metaDescription'));
    }
    
    // Update Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    
    if (ogTitle) {
      ogTitle.setAttribute('content', t('onboarding:featureTour.pageTitle'));
    }
    
    if (ogDescription) {
      ogDescription.setAttribute('content', t('onboarding:featureTour.metaDescription'));
    }
    
    // Update canonical and hreflang links
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = `https://aisportsedge.app${languagePrefix}/feature-tour`;
      document.head.appendChild(link);
    } else {
      canonicalLink.href = `https://aisportsedge.app${languagePrefix}/feature-tour`;
    }
    
    // Update hreflang links
    const hreflangEn = document.querySelector('link[hreflang="en"]');
    const hreflangEs = document.querySelector('link[hreflang="es"]');
    
    if (hreflangEn) {
      hreflangEn.href = 'https://aisportsedge.app/feature-tour';
    }
    
    if (hreflangEs) {
      hreflangEs.href = 'https://aisportsedge.app/es/feature-tour';
    }
  }, [t, languagePrefix]);

  // Handle completing the current step
  const handleCompleteStep = async () => {
    if (steps.length === 0 || !steps[currentStepIndex]) {
      console.error('No steps available or invalid step index');
      return;
    }
    
    const currentStep = steps[currentStepIndex];
    
    try {
      // Validate step ID to prevent security issues
      if (!currentStep.id || typeof currentStep.id !== 'string') {
        throw new Error('Invalid step ID');
      }
      
      // Mark step as completed with proper error handling
      const success = await featureTourService.markFeatureTourStepCompleted(currentStep.id);
      
      if (!success) {
        console.warn('Failed to mark step as completed, but continuing tour');
      }
      
      // Update local state - create a new array to avoid mutation
      const updatedSteps = steps.map((step, index) => {
        if (index === currentStepIndex) {
          return { ...step, completed: true };
        }
        return step;
      });
      
      setSteps(updatedSteps);
      
      // Move to next step or complete tour
      if (currentStepIndex < steps.length - 1) {
        setAnimating(true);
        
        // Use a more reliable approach for animations
        const animationTimeout = setTimeout(() => {
          setCurrentStepIndex(currentStepIndex + 1);
          setAnimating(false);
        }, 300);
        
        // Clean up timeout to prevent memory leaks
        return () => clearTimeout(animationTimeout);
      } else {
        handleCompleteTour();
      }
    } catch (error) {
      console.error('Error completing feature tour step:', error);
      
      // Show user-friendly error message
      // Use a toast notification or other non-blocking UI instead of alert in production
      alert(t('common:error'));
      
      // Continue to next step anyway to prevent user from getting stuck
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // Navigate to home as fallback
        navigate(`${languagePrefix}/`);
      }
    }
  };

  // Handle completing the entire tour
  const handleCompleteTour = async () => {
    try {
      await featureTourService.markFeatureTourCompleted();
      
      // Show completion message
      alert(t('onboarding:featureTour.completion.message'));
      
      // Navigate to home
      navigate(`${languagePrefix}/`);
    } catch (error) {
      console.error('Error completing feature tour:', error);
      alert(t('common:error'));
    }
  };

  // Handle skipping the tour
  const handleSkipTour = () => {
    if (window.confirm(t('onboarding:featureTour.skip.message'))) {
      // Track skip event
      if (window.gtag) {
        window.gtag('event', 'feature_tour_skipped', {
          'event_category': 'engagement',
          'event_label': 'feature_tour',
          'step_index': currentStepIndex,
          'step_id': steps[currentStepIndex]?.id
        });
      }
      
      // Navigate to home
      navigate(`${languagePrefix}/`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="feature-tour-loading">
        <div className="loading-spinner"></div>
        <p>{t('onboarding:featureTour.loading')}</p>
      </div>
    );
  }

  // Get current step
  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  return (
    <div
      className="feature-tour-page"
      role="main"
      aria-label={t('onboarding:featureTour.pageTitle')}
    >
      <div
        className={`feature-tour-content ${animating ? 'fade-out' : 'fade-in'}`}
        aria-live="polite"
      >
        <h1
          className="feature-tour-title"
          id="feature-tour-heading"
          tabIndex="-1"
        >
          {t('onboarding:featureTour.title')}
        </h1>
        
        <div
          className="feature-step"
          role="region"
          aria-labelledby={`feature-step-heading-${currentStepIndex}`}
        >
          <div className="feature-step-image">
            <img
              src={currentStep.image}
              alt=""
              aria-hidden="true" // Decorative image, main content is in the text
            />
          </div>
          
          <div className="feature-step-content">
            <h2
              className="feature-step-title"
              id={`feature-step-heading-${currentStepIndex}`}
            >
              {currentStep.title}
            </h2>
            <p className="feature-step-description">{currentStep.description}</p>
            
            <div
              className="feature-step-hint"
              role="note"
              aria-label={t('onboarding:featureTour.hintLabel')}
            >
              <i className="fas fa-lightbulb" aria-hidden="true"></i>
              <p>{currentStep.hint}</p>
            </div>
            
            <div className="feature-step-demo">
              <button
                className="try-it-button"
                aria-label={`${t('onboarding:featureTour.tryIt')} ${currentStep.title}`}
              >
                {t('onboarding:featureTour.tryIt')}
              </button>
            </div>
          </div>
        </div>
        
        <div
          className="feature-tour-progress"
          role="navigation"
          aria-label={t('onboarding:progressNav')}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`progress-dot ${index === currentStepIndex ? 'active' : ''} ${step.completed ? 'completed' : ''}`}
              role="button"
              tabIndex={index === currentStepIndex ? 0 : -1}
              aria-label={`${t('onboarding:step')} ${index + 1} ${index === currentStepIndex ? t('onboarding:current') : index < currentStepIndex ? t('onboarding:completed') : ''}`}
              aria-current={index === currentStepIndex ? "step" : undefined}
              onClick={() => setCurrentStepIndex(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setCurrentStepIndex(index);
                  e.preventDefault();
                }
              }}
            />
          ))}
        </div>
        
        <div
          className="feature-tour-buttons"
          role="group"
          aria-label={t('onboarding:featureTour.navigationControls')}
        >
          {currentStepIndex < steps.length - 1 ? (
            <>
              <button
                className="skip-button"
                onClick={handleSkipTour}
                aria-label={t('onboarding:featureTour.skipTour')}
              >
                {t('onboarding:featureTour.skipTour')}
              </button>
              <button
                className="next-button"
                onClick={handleCompleteStep}
                aria-label={t('onboarding:featureTour.next')}
              >
                {t('onboarding:featureTour.next')}
              </button>
            </>
          ) : (
            <button
              className="finish-button"
              onClick={handleCompleteStep}
              aria-label={t('onboarding:featureTour.finishTour')}
            >
              {t('onboarding:featureTour.finishTour')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureTourPage;