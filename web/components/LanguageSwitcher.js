import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import '../styles/language-switcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language;

  const getAlternateUrl = () => {
    const path = location.pathname;

    if (currentLang === 'es') {
      // If we're on a Spanish page, link to English
      return path.replace(/^\/es/, '') || '/';
    } else {
      // If we're on an English page, link to Spanish
      return `/es${path}`;
    }
  };

  return (
    <div className="language-switcher">
      <Link to={getAlternateUrl()} className="language-switch-link">
        {currentLang === 'es'
          ? t('common:languageSwitcher.switchToEnglish')
          : t('common:languageSwitcher.switchToSpanish')}
      </Link>
    </div>
  );
};

export default LanguageSwitcher;
