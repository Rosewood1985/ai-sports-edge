const axios = require('axios');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * NotificationService class
 * Handles sending notifications via OneSignal
 */
class NotificationService {
  constructor() {
    // Get OneSignal API key and app IDs from environment variables
    this.oneSignalApiKey = functions.config().onesignal?.api_key || 'YOUR_ONESIGNAL_API_KEY';
    this.oneSignalWebAppId = functions.config().onesignal?.web_app_id || 'YOUR_ONESIGNAL_WEB_APP_ID';
    this.oneSignalMobileAppId = functions.config().onesignal?.mobile_app_id || 'YOUR_ONESIGNAL_MOBILE_APP_ID';
  }

  /**
   * Send a notification to all users
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.data - Additional data to send with the notification
   * @param {string} options.url - URL to open when notification is clicked (web only)
   * @param {string} options.platform - 'web', 'mobile', or 'all'
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendToAll({ title, message, data = {}, url, platform = 'all' }) {
    const appIds = [];
    
    if (platform === 'web' || platform === 'all') {
      appIds.push(this.oneSignalWebAppId);
    }
    
    if (platform === 'mobile' || platform === 'all') {
      appIds.push(this.oneSignalMobileAppId);
    }
    
    const promises = appIds.map(appId => {
      return this.sendNotification({
        app_id: appId,
        headings: { en: title },
        contents: { en: message },
        data,
        url,
        included_segments: ['All']
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Send a notification to specific users
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.data - Additional data to send with the notification
   * @param {string} options.url - URL to open when notification is clicked (web only)
   * @param {Array<string>} options.userIds - Array of OneSignal user IDs
   * @param {string} options.platform - 'web', 'mobile', or 'all'
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendToUsers({ title, message, data = {}, url, userIds, platform = 'all' }) {
    const appIds = [];
    
    if (platform === 'web' || platform === 'all') {
      appIds.push(this.oneSignalWebAppId);
    }
    
    if (platform === 'mobile' || platform === 'all') {
      appIds.push(this.oneSignalMobileAppId);
    }
    
    const promises = appIds.map(appId => {
      return this.sendNotification({
        app_id: appId,
        headings: { en: title },
        contents: { en: message },
        data,
        url,
        include_external_user_ids: userIds
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Send a notification based on user tags/filters
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.data - Additional data to send with the notification
   * @param {string} options.url - URL to open when notification is clicked (web only)
   * @param {Array<Object>} options.filters - Array of OneSignal filters
   * @param {string} options.platform - 'web', 'mobile', or 'all'
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendToFilters({ title, message, data = {}, url, filters, platform = 'all' }) {
    const appIds = [];
    
    if (platform === 'web' || platform === 'all') {
      appIds.push(this.oneSignalWebAppId);
    }
    
    if (platform === 'mobile' || platform === 'all') {
      appIds.push(this.oneSignalMobileAppId);
    }
    
    const promises = appIds.map(appId => {
      return this.sendNotification({
        app_id: appId,
        headings: { en: title },
        contents: { en: message },
        data,
        url,
        filters
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Send a notification using the OneSignal API
   * @param {Object} payload - OneSignal notification payload
   * @returns {Promise} - Promise that resolves when notification is sent
   */
  async sendNotification(payload) {
    try {
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.oneSignalApiKey}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending OneSignal notification:', error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new NotificationService();