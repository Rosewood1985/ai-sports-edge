import { getAnalytics } from 'firebase/analytics';
import { logEvent, setUserProperties } from 'firebase/analytics';
import firebaseApp from '../atoms/firebaseApp';

/**
 * Firebase Analytics Molecule
 * Provides analytics functionality
 */

// Initialize Firebase Analytics
const analytics = getAnalytics(firebaseApp);

/**
 * Log an analytics event
 * @param eventName Name of the event
 * @param eventParams Event parameters
 */
const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>): void => {
  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.warn(`Error logging analytics event ${eventName}:`, error);
  }
};

/**
 * Set user properties for analytics
 * @param properties User properties
 */
const setUserAnalyticsProperties = (properties: Record<string, any>): void => {
  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.warn('Error setting user analytics properties:', error);
  }
};

/**
 * Standard event names for consistent analytics tracking
 */
const AnalyticsEvents = {
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  PAGE_VIEW: 'page_view',
  SCREEN_VIEW: 'screen_view',
  SEARCH: 'search',
  SELECT_CONTENT: 'select_content',
  SHARE: 'share',
  PURCHASE: 'purchase',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  VIEW_ITEM: 'view_item',
  VIEW_ITEM_LIST: 'view_item_list',
  ADD_PAYMENT_INFO: 'add_payment_info',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  GENERATE_LEAD: 'generate_lead',
  COMPLETE_REGISTRATION: 'complete_registration',
  TUTORIAL_BEGIN: 'tutorial_begin',
  TUTORIAL_COMPLETE: 'tutorial_complete',
  PLACE_BET: 'place_bet',
  VIEW_ODDS: 'view_odds',
  FOLLOW_PICK: 'follow_pick',
  SHARE_PICK: 'share_pick'
};

export {
  analytics,
  logAnalyticsEvent,
  setUserAnalyticsProperties,
  AnalyticsEvents
};