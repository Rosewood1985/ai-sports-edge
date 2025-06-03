import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import '../styles/home.css';
import BetNowButton from '../components/BetNowButton';
import BetNowPopup from '../components/BetNowPopup';
import ThemeToggle from '../components/ThemeToggle';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';

const HomePage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { showBetButton } = useBettingAffiliate();
  const { t, i18n } = useTranslation(['home', 'common']);
  const isSpanish = i18n.language === 'es';

  // Base URL for canonical and alternate links
  const baseUrl = 'https://aisportsedge.app';
  return (
    <>
      <Helmet>
        <html lang={isSpanish ? 'es' : 'en'} />
        <title>{t('home:meta.title')}</title>
        <meta name="description" content={t('home:meta.description')} />
        <meta name="keywords" content={t('home:meta.keywords')} />

        {/* Canonical URL */}
        <link rel="canonical" href={isSpanish ? `${baseUrl}/es/` : baseUrl} />

        {/* Hreflang annotations */}
        <link rel="alternate" hrefLang="en" href={baseUrl} />
        <link rel="alternate" hrefLang="es" href={`${baseUrl}/es/`} />
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />

        {/* Open Graph tags */}
        <meta property="og:title" content={t('home:meta.ogTitle')} />
        <meta property="og:description" content={t('home:meta.ogDescription')} />
        <meta property="og:url" content={isSpanish ? `${baseUrl}/es/` : baseUrl} />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>{t('home:hero.title')}</h1>
              <p className="hero-subtitle">{t('home:hero.subtitle')}</p>
              <div className="hero-buttons">
                <Link
                  to={isSpanish ? '/es/download' : '/download'}
                  className="button primary-button"
                >
                  {t('common:buttons.downloadApp')}
                </Link>
                <Link
                  to={isSpanish ? '/es/features' : '/features'}
                  className="button secondary-button"
                >
                  {t('common:buttons.learnMore')}
                </Link>
                {showBetButton('home') && (
                  <BetNowButton size="large" position="inline" contentType="home" />
                )}
              </div>
            </div>
            <div className="hero-image">
              <img
                src="https://expo.dev/static/images/favicon-76x76.png"
                alt={t('home:hero.imageAlt')}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="features-overview">
        <div className="container">
          <h2 className="section-title">{t('home:features.title')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3>{t('home:features.feature1.title')}</h3>
              <p>{t('home:features.feature1.description')}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>{t('home:features.feature2.title')}</h3>
              <p>{t('home:features.feature2.description')}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <h3>{t('home:features.feature3.title')}</h3>
              <p>{t('home:features.feature3.description')}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>{t('home:features.feature4.title')}</h3>
              <p>{t('home:features.feature4.description')}</p>
            </div>
          </div>
          <div className="features-cta">
            <Link to={isSpanish ? '/es/features' : '/features'} className="button">
              {t('home:features.exploreButton')}
            </Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">{t('home:howItWorks.title')}</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>{t('home:howItWorks.step1.title')}</h3>
              <p>{t('home:howItWorks.step1.description')}</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>{t('home:howItWorks.step2.title')}</h3>
              <p>{t('home:howItWorks.step2.description')}</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>{t('home:howItWorks.step3.title')}</h3>
              <p>{t('home:howItWorks.step3.description')}</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>{t('home:howItWorks.step4.title')}</h3>
              <p>{t('home:howItWorks.step4.description')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="theme-toggle-container">
              <ThemeToggle />
            </div>
            <h2>{t('home:cta.title')}</h2>
            <p>{t('home:cta.description')}</p>
            <div className="cta-buttons">
              <Link to={isSpanish ? '/es/download' : '/download'} className="button primary-button">
                {t('home:cta.downloadButton')}
              </Link>
              {showBetButton('home') && (
                <BetNowButton size="large" position="inline" contentType="home" />
              )}
            </div>
            <button className="show-popup-link" onClick={() => setShowPopup(true)}>
              {t('home:cta.specialOfferButton')}
            </button>
          </div>
        </div>
      </section>

      {/* Bet Now Popup */}
      <BetNowPopup
        show={showPopup}
        onClose={() => setShowPopup(false)}
        message={t('home:betNowPopup.message')}
      />
    </>
  );
};

export default HomePage;
