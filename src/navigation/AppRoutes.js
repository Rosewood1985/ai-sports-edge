import React from 'react';

import { lazyLoadRoutes } from '../utils/lazyLoad';

/**
 * App Routes
 *
 * This file defines the routes for the application using code splitting.
 * Each route component is loaded lazily when it's needed, reducing the initial bundle size.
 */

// Define routes with lazy loading
const routes = lazyLoadRoutes({
  // Auth routes
  '/login': () => import('../screens/Auth/LoginScreen'),
  '/signup': () => import('../screens/Auth/SignupScreen'),
  '/forgot-password': () => import('../screens/Auth/ForgotPasswordScreen'),
  '/reset-password': () => import('../screens/Auth/ResetPasswordScreen'),

  // Onboarding routes
  '/onboarding': () => import('../screens/Onboarding/WelcomeScreen'),
  '/onboarding/profile': () => import('../screens/Onboarding/ProfileSetupScreen'),
  '/onboarding/preferences': () => import('../screens/Onboarding/PreferencesScreen'),
  '/onboarding/gdpr': () => import('../screens/Onboarding/GDPRConsentScreen'),
  '/onboarding/cookie': () => import('../screens/Onboarding/CookieConsentScreen'),
  '/onboarding/age': () => import('../screens/Onboarding/AgeVerificationScreen'),
  '/onboarding/self-exclusion': () => import('../screens/Onboarding/SelfExclusionScreen'),
  '/onboarding/responsible-gambling': () =>
    import('../screens/Onboarding/ResponsibleGamblingScreen'),
  '/onboarding/liability': () => import('../screens/Onboarding/LiabilityWaiverScreen'),

  // Main app routes
  '/home': () => import('../screens/HomeScreen'),
  '/games': () => import('../screens/GamesScreen'),
  '/games/:id': () => import('../screens/GameDetailsScreen'),
  '/predictions': () => import('../screens/PredictionsScreen'),
  '/stats': () => import('../screens/StatsScreen'),
  '/news': () => import('../screens/NewsScreen'),

  // Profile routes
  '/profile': () => import('../screens/ProfileScreen'),
  '/profile/settings': () => import('../screens/SettingsScreen'),
  '/profile/subscription': () => import('../screens/SubscriptionScreen'),
  '/profile/purchase-history': () => import('../screens/PurchaseHistoryScreen'),
  '/profile/language': () => import('../screens/LanguageSettingsScreen'),
  '/profile/privacy': () => import('../screens/PrivacySettingsScreen'),

  // Help and support routes
  '/help': () => import('../screens/HelpScreen'),
  '/help/faq': () => import('../screens/FAQScreen'),
  '/help/contact': () => import('../screens/ContactScreen'),
  '/help/feedback': () => import('../screens/FeedbackScreen'),
  '/help/bug-report': () => import('../screens/BugReportScreen'),

  // Legal routes
  '/legal': () => import('../screens/LegalScreen'),
  '/legal/privacy': () => import('../screens/PrivacyPolicyScreen'),
  '/legal/terms': () => import('../screens/TermsOfServiceScreen'),

  // Error routes
  '/404': () => import('../screens/NotFoundScreen'),
  '/error': () => import('../screens/ErrorScreen'),
});

/**
 * Example of how to use these routes with React Router
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={routes['/login'].component()} />
      <Route path="/signup" element={routes['/signup'].component()} />
      <Route path="/forgot-password" element={routes['/forgot-password'].component()} />
      <Route path="/reset-password" element={routes['/reset-password'].component()} />

      {/* Onboarding routes */}
      <Route path="/onboarding" element={routes['/onboarding'].component()} />
      <Route path="/onboarding/profile" element={routes['/onboarding/profile'].component()} />
      <Route
        path="/onboarding/preferences"
        element={routes['/onboarding/preferences'].component()}
      />
      <Route path="/onboarding/gdpr" element={routes['/onboarding/gdpr'].component()} />
      <Route path="/onboarding/cookie" element={routes['/onboarding/cookie'].component()} />
      <Route path="/onboarding/age" element={routes['/onboarding/age'].component()} />
      <Route
        path="/onboarding/self-exclusion"
        element={routes['/onboarding/self-exclusion'].component()}
      />
      <Route
        path="/onboarding/responsible-gambling"
        element={routes['/onboarding/responsible-gambling'].component()}
      />
      <Route path="/onboarding/liability" element={routes['/onboarding/liability'].component()} />

      {/* Main app routes */}
      <Route path="/home" element={routes['/home'].component()} />
      <Route path="/games" element={routes['/games'].component()} />
      <Route path="/games/:id" element={routes['/games/:id'].component()} />
      <Route path="/predictions" element={routes['/predictions'].component()} />
      <Route path="/stats" element={routes['/stats'].component()} />
      <Route path="/news" element={routes['/news'].component()} />

      {/* Profile routes */}
      <Route path="/profile" element={routes['/profile'].component()} />
      <Route path="/profile/settings" element={routes['/profile/settings'].component()} />
      <Route path="/profile/subscription" element={routes['/profile/subscription'].component()} />
      <Route
        path="/profile/purchase-history"
        element={routes['/profile/purchase-history'].component()}
      />
      <Route path="/profile/language" element={routes['/profile/language'].component()} />
      <Route path="/profile/privacy" element={routes['/profile/privacy'].component()} />

      {/* Help and support routes */}
      <Route path="/help" element={routes['/help'].component()} />
      <Route path="/help/faq" element={routes['/help/faq'].component()} />
      <Route path="/help/contact" element={routes['/help/contact'].component()} />
      <Route path="/help/feedback" element={routes['/help/feedback'].component()} />
      <Route path="/help/bug-report" element={routes['/help/bug-report'].component()} />

      {/* Legal routes */}
      <Route path="/legal" element={routes['/legal'].component()} />
      <Route path="/legal/privacy" element={routes['/legal/privacy'].component()} />
      <Route path="/legal/terms" element={routes['/legal/terms'].component()} />

      {/* Error routes */}
      <Route path="/404" element={routes['/404'].component()} />
      <Route path="/error" element={routes['/error'].component()} />

      {/* Default route */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
