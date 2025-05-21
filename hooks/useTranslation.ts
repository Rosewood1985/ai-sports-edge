import { useI18n } from '../contexts/I18nContext';

/**
 * Custom hook to use translations in the app
 * This is a wrapper around useI18n to provide a more familiar API for react-i18next users
 */
export const useTranslation = () => {
  const i18n = useI18n();

  return {
    t: i18n.t,
    i18n: {
      language: i18n.language,
      changeLanguage: i18n.setLanguage,
      ...i18n,
    },
  };
};

export default useTranslation;
