/**
 * Service Configuration Atom
 *
 * Provides configuration objects for various services.
 * These are primitive configurations that can be used by higher-level components.
 */

import { getEnvVar } from './envConfig';

/**
 * Firebase configuration
 */
export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID'),
};

/**
 * Stripe configuration
 */
export const stripeConfig = {
  publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  secretKey: getEnvVar('STRIPE_SECRET_KEY'),
  webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),
};

/**
 * Sports data API configuration
 */
export const sportsDataConfig = {
  sportsDataApiKey: getEnvVar('SPORTS_DATA_API_KEY'),
  oddsApiKey: getEnvVar('ODDS_API_KEY'),
  sportradarApiKey: getEnvVar('SPORTRADAR_API_KEY'),
};

/**
 * OneSignal configuration
 */
export const oneSignalConfig = {
  apiKey: getEnvVar('ONESIGNAL_API_KEY'),
  appId: getEnvVar('ONESIGNAL_APP_ID'),
};

/**
 * ML model configuration
 */
export const mlConfig = {
  modelPath: getEnvVar('ML_MODEL_PATH', 'https://ai-sports-edge-com.web.app/models/model.pkl'),
  minConfidenceThreshold: parseInt(getEnvVar('MIN_CONFIDENCE_THRESHOLD', '65'), 10),
};

/**
 * Sentry configuration
 */
export const sentryConfig = {
  dsn: getEnvVar('SENTRY_DSN', 'https://examplePublicKey@o0.ingest.sentry.io/0'),
  environment: getEnvVar('NODE_ENV', 'development'),
  release: 'ai-sports-edge@1.0.0',
  tracesSampleRate: 0.2,
};
