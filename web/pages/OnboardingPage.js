import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '../components/ConfirmationModal';
import { markOnboardingCompleted } from '../services/onboardingService';

/**
 * OnboardingPage component for web
 * Provides a step-by-step introduction to the app's features
 */
const OnboardingPage = () => {
  const { t, i18n } = useTranslation(['common', 'onboarding']);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const languagePrefix = i18n.language === 'es' ? '/es' : '';

  // Define the onboarding steps
  const steps = [
    {
      id: 'welcome',
      title: t('onboarding:welcome.title'),
      description: t('onboarding:welcome.description'),
      image: '/images/onboarding/welcome.svg',
      backgroundColor: '#3498db',
    },
    {
      id: 'aiPredictions',
      title: t('onboarding:aiPredictions.title'),
      description: t('onboarding:aiPredictions.description'),
      image: '/images/onboarding/ai-predictions.svg',
      backgroundColor: '#2ecc71',
    },
    {
      id: 'liveOdds',
      title: t('onboarding:liveOdds.title'),
      description: t('onboarding:liveOdds.description'),
      image: '/images/onboarding/live-odds.svg',
      backgroundColor: '#9b59b6',
    },
    {
      id: 'performance',
      title: t('onboarding:performance.title'),
      description: t('onboarding:performance.description'),
      image: '/images/onboarding/performance.svg',
      backgroundColor: '#e74c3c',
    },
    {
      id: 'groupSubscription',
      title: t('onboarding:groupSubscription.title'),
      description: t('onboarding:groupSubscription.description'),
      image: '/images/onboarding/group-subscription.svg',
      backgroundColor: '#16a085',
      actionButton: {
        text: t('onboarding:groupSubscription.actionButton'),
        onClick: () => {
          // Show 24-hour registration requirement modal before navigating
          setConfirmationData({
            title: t('onboarding:groupSubscription.title'),
            message: t('onboarding:groupSubscription.timeRequirement'),
            onConfirm: () => navigate(`${languagePrefix}/group-subscription`),
          });
          setShowConfirmModal(true);
        },
      },
    },
    {
      id: 'getStarted',
      title: t('onboarding:getStarted.title'),
      description: t('onboarding:getStarted.description'),
      image: '/images/onboarding/get-started.svg',
      backgroundColor: '#f39c12',
    },
  ];

  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setAnimating(false);
      }, 300);
    } else {
      handleComplete();
    }
  };

  // Handle skip
  const handleSkip = () => {
    handleComplete();
  };

  // Handle completion
  const handleComplete = async () => {
    try {
      const success = await markOnboardingCompleted();
      if (!success) {
        // Show an error message but still allow navigation
        console.error('Failed to save onboarding status');

        // Set confirmation data for the error modal
        setConfirmationData({
          title: t('common:error'),
          message: t('onboarding:errors.saveFailed', {
            defaultValue:
              "We couldn't save your onboarding progress. Some features may ask you to complete onboarding again.",
          }),
          onConfirm: () => navigate(`${languagePrefix}/`),
        });
        setShowConfirmModal(true);
        return; // Don't navigate yet, let the modal handle it
      }

      // Success case - navigate to home
      navigate(`${languagePrefix}/`);
    } catch (error) {
      // Sanitize error message to prevent XSS
      const sanitizedError = error?.message ? error.message.replace(/[<>]/g, '') : 'Unknown error';

      console.error('Error completing onboarding:', sanitizedError);

      // Show error modal with sanitized message
      setConfirmationData({
        title: t('common:error'),
        message: t('onboarding:errors.generalError', {
          defaultValue:
            'There was a problem completing the onboarding process. You can try again later.',
          error: sanitizedError,
        }),
        onConfirm: () => navigate(`${languagePrefix}/`),
      });
      setShowConfirmModal(true);
    }
  };

  // Update document title and meta description based on language
  useEffect(() => {
    // Set page title
    document.title = t('onboarding:pageTitle');

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('onboarding:metaDescription'));
    }

    // Update Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');

    if (ogTitle) {
      ogTitle.setAttribute('content', t('onboarding:pageTitle'));
    }

    if (ogDescription) {
      ogDescription.setAttribute('content', t('onboarding:metaDescription'));
    }

    // Update canonical and hreflang links
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = `https://aisportsedge.app${languagePrefix}/onboarding`;
      document.head.appendChild(link);
    } else {
      canonicalLink.href = `https://aisportsedge.app${languagePrefix}/onboarding`;
    }

    // Update hreflang links
    const hreflangEn = document.querySelector('link[hreflang="en"]');
    const hreflangEs = document.querySelector('link[hreflang="es"]');

    if (hreflangEn) {
      hreflangEn.href = 'https://aisportsedge.app/onboarding';
    }

    if (hreflangEs) {
      hreflangEs.href = 'https://aisportsedge.app/es/onboarding';
    }
  }, [t, languagePrefix]);

  // Get current step
  const currentStepData = steps[currentStep];

  return (
    <div
      className="onboarding-page"
      style={{ backgroundColor: currentStepData.backgroundColor }}
      role="main"
      aria-label={t('onboarding:pageTitle')}
    >
      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        title={confirmationData.title}
        message={confirmationData.message}
        onConfirm={confirmationData.onConfirm}
        confirmText={t('common:confirm')}
        cancelText={t('common:cancel')}
      />
      <div
        className={`onboarding-content ${animating ? 'fade-out' : 'fade-in'}`}
        aria-live="polite"
        role="region"
        aria-label={`${t('onboarding:step', { defaultValue: 'Step' })} ${currentStep + 1} ${t('onboarding:of', { defaultValue: 'of' })} ${steps.length}`}
      >
        <div className="onboarding-image">
          <img
            src={currentStepData.image}
            alt={currentStepData.title}
            aria-hidden="true" // Decorative image, main content is in the text
          />
        </div>

        <div className="onboarding-text">
          <h1 id={`onboarding-step-${currentStep + 1}`} tabIndex="-1">
            {currentStepData.title}
          </h1>
          <p>{currentStepData.description}</p>
          {currentStepData.actionButton && (
            <button
              className="action-button"
              onClick={currentStepData.actionButton.onClick}
              aria-label={currentStepData.actionButton.text}
            >
              {currentStepData.actionButton.text}
            </button>
          )}
        </div>

        <div
          className="onboarding-progress"
          role="navigation"
          aria-label={t('onboarding:progressNav')}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              role="button"
              tabIndex={index === currentStep ? 0 : -1}
              aria-label={`${t('onboarding:step')} ${index + 1} ${index === currentStep ? t('onboarding:current') : index < currentStep ? t('onboarding:completed') : ''}`}
              aria-current={index === currentStep ? 'step' : undefined}
              onClick={() => setCurrentStep(index)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setCurrentStep(index);
                  e.preventDefault();
                }
              }}
            />
          ))}
        </div>

        <div className="onboarding-buttons">
          {currentStep < steps.length - 1 ? (
            <>
              <button
                className="skip-button"
                onClick={handleSkip}
                aria-label={t('common:skip')}
                aria-haspopup="dialog"
                aria-describedby={`onboarding-step-${currentStep + 1}`}
              >
                {t('common:skip')}
              </button>
              <button
                className="next-button"
                onClick={handleNext}
                aria-label={t('common:next')}
                aria-describedby={`onboarding-step-${currentStep + 1}`}
              >
                {t('common:next')}
              </button>
            </>
          ) : (
            <button
              className="get-started-button"
              onClick={handleComplete}
              aria-label={t('common:getStarted')}
              aria-haspopup="dialog"
              aria-describedby={`onboarding-step-${currentStep + 1}`}
            >
              {t('common:getStarted')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
