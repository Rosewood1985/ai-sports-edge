/**
 * Authentication and Authorization Manager
 *
 * This module provides higher-level functionality for managing authentication
 * and authorization using the atomic auth check utilities.
 */

const {
  PERMISSION_LEVELS,
  DEFAULT_ROLES,
  isTokenExpired,
  hasPermission,
  hasResourceAccess,
  validateFirebaseToken,
  generateSecureToken,
  hashPassword,
  verifyPassword,
} = require('../../atoms/security/authChecks');

/**
 * Authentication manager class
 */
class AuthManager {
  constructor(options = {}) {
    this.options = {
      tokenExpirationTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      refreshTokenExpirationTime: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      ...options,
    };

    this.currentUser = null;
    this.isAuthenticated = false;
    this.authToken = null;
    this.refreshToken = null;
    this.tokenExpiration = null;
    this.listeners = [];
  }

  /**
   * Initializes the auth manager
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Try to restore session from storage
      await this.restoreSession();
      return true;
    } catch (error) {
      console.error('Error initializing auth manager:', error);
      return false;
    }
  }

  /**
   * Restores a session from storage
   * @returns {Promise<boolean>} Whether session restoration was successful
   */
  async restoreSession() {
    try {
      // In a real implementation, this would get tokens from localStorage, AsyncStorage, etc.
      // For now, we'll just check if there are tokens in memory

      if (!this.authToken || !this.refreshToken) {
        return false;
      }

      // Check if the token is expired
      if (this.tokenExpiration && this.tokenExpiration < Date.now()) {
        // Try to refresh the token
        return await this.refreshAuthentication();
      }

      // Validate the token
      const user = await this.validateToken(this.authToken);

      if (!user) {
        return false;
      }

      this.currentUser = user;
      this.isAuthenticated = true;

      // Notify listeners
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }

  /**
   * Validates an authentication token
   * @param {string} token - Token to validate
   * @returns {Promise<object|null>} User object if token is valid, null otherwise
   */
  async validateToken(token) {
    try {
      // Check if the token is expired
      if (isTokenExpired(token)) {
        return null;
      }

      // In a real implementation, this would validate the token with the server
      // For now, we'll just decode the token

      const payload = await validateFirebaseToken(token);

      if (!payload) {
        return null;
      }

      return payload.user || null;
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  }

  /**
   * Refreshes the authentication token
   * @returns {Promise<boolean>} Whether token refresh was successful
   */
  async refreshAuthentication() {
    try {
      // In a real implementation, this would send the refresh token to the server
      // and get a new authentication token

      if (!this.refreshToken) {
        return false;
      }

      // Check if the refresh token is expired
      if (isTokenExpired(this.refreshToken)) {
        // If the refresh token is expired, the user needs to log in again
        this.logout();
        return false;
      }

      // For now, we'll just generate a new token
      this.authToken = generateSecureToken();
      this.tokenExpiration = Date.now() + this.options.tokenExpirationTime;

      // Notify listeners
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Error refreshing authentication:', error);
      return false;
    }
  }

  /**
   * Logs in a user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<object>} Login result
   */
  async login(email, password) {
    try {
      // In a real implementation, this would send the credentials to the server
      // For now, we'll just simulate a successful login

      // Simulate server validation
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      // Simulate a user object
      const user = {
        id: '123456',
        email,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
      };

      // Generate tokens
      this.authToken = generateSecureToken();
      this.refreshToken = generateSecureToken();
      this.tokenExpiration = Date.now() + this.options.tokenExpirationTime;

      // Set current user
      this.currentUser = user;
      this.isAuthenticated = true;

      // Save session
      this.saveSession();

      // Notify listeners
      this.notifyListeners();

      return {
        success: true,
        user,
        token: this.authToken,
      };
    } catch (error) {
      console.error('Error logging in:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during login',
      };
    }
  }

  /**
   * Logs in a user with a social provider
   * @param {string} provider - Social provider (e.g., 'google', 'facebook')
   * @returns {Promise<object>} Login result
   */
  async socialLogin(provider) {
    try {
      // In a real implementation, this would authenticate with the social provider
      // For now, we'll just simulate a successful login

      // Simulate a user object
      const user = {
        id: '123456',
        email: `user@${provider}.com`,
        firstName: 'Social',
        lastName: 'User',
        role: 'USER',
        socialProvider: provider,
      };

      // Generate tokens
      this.authToken = generateSecureToken();
      this.refreshToken = generateSecureToken();
      this.tokenExpiration = Date.now() + this.options.tokenExpirationTime;

      // Set current user
      this.currentUser = user;
      this.isAuthenticated = true;

      // Save session
      this.saveSession();

      // Notify listeners
      this.notifyListeners();

      return {
        success: true,
        user,
        token: this.authToken,
      };
    } catch (error) {
      console.error(`Error logging in with ${provider}:`, error);
      return {
        success: false,
        error: error.message || `An error occurred during ${provider} login`,
      };
    }
  }

  /**
   * Registers a new user
   * @param {object} userData - User data
   * @returns {Promise<object>} Registration result
   */
  async register(userData) {
    try {
      // In a real implementation, this would send the user data to the server
      // For now, we'll just simulate a successful registration

      // Simulate server validation
      if (!userData.email || !userData.password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      // Simulate a user object
      const user = {
        id: '123456',
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: 'USER',
      };

      // Generate tokens
      this.authToken = generateSecureToken();
      this.refreshToken = generateSecureToken();
      this.tokenExpiration = Date.now() + this.options.tokenExpirationTime;

      // Set current user
      this.currentUser = user;
      this.isAuthenticated = true;

      // Save session
      this.saveSession();

      // Notify listeners
      this.notifyListeners();

      return {
        success: true,
        user,
        token: this.authToken,
      };
    } catch (error) {
      console.error('Error registering:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during registration',
      };
    }
  }

  /**
   * Logs out the current user
   * @returns {Promise<boolean>} Whether logout was successful
   */
  async logout() {
    try {
      // Clear session
      this.currentUser = null;
      this.isAuthenticated = false;
      this.authToken = null;
      this.refreshToken = null;
      this.tokenExpiration = null;

      // Clear saved session
      this.clearSession();

      // Notify listeners
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  /**
   * Saves the session to storage
   */
  saveSession() {
    // In a real implementation, this would save the tokens to localStorage, AsyncStorage, etc.
    // For now, we'll just log that the session was saved
    console.log('Session saved');
  }

  /**
   * Clears the session from storage
   */
  clearSession() {
    // In a real implementation, this would clear the tokens from localStorage, AsyncStorage, etc.
    // For now, we'll just log that the session was cleared
    console.log('Session cleared');
  }

  /**
   * Adds an authentication state change listener
   * @param {Function} listener - Listener function
   * @returns {Function} Function to remove the listener
   */
  addAuthStateChangeListener(listener) {
    this.listeners.push(listener);

    // Call the listener immediately with the current state
    listener({
      user: this.currentUser,
      isAuthenticated: this.isAuthenticated,
    });

    // Return a function to remove the listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifies all listeners of an authentication state change
   */
  notifyListeners() {
    const authState = {
      user: this.currentUser,
      isAuthenticated: this.isAuthenticated,
    };

    this.listeners.forEach(listener => {
      try {
        listener(authState);
      } catch (error) {
        console.error('Error in auth state change listener:', error);
      }
    });
  }

  /**
   * Checks if the current user has a specific permission
   * @param {number} requiredLevel - Required permission level
   * @returns {boolean} Whether the user has the required permission
   */
  hasPermission(requiredLevel) {
    if (!this.isAuthenticated || !this.currentUser) {
      return false;
    }

    return hasPermission(this.currentUser, requiredLevel);
  }

  /**
   * Checks if the current user has access to a specific resource
   * @param {object} resource - Resource to check access for
   * @param {string} action - Action to perform (read, write, delete, etc.)
   * @returns {boolean} Whether the user has access
   */
  hasResourceAccess(resource, action) {
    if (!this.isAuthenticated || !this.currentUser) {
      return false;
    }

    return hasResourceAccess(this.currentUser, resource, action);
  }

  /**
   * Gets the current authentication token
   * @returns {string|null} Current authentication token
   */
  getAuthToken() {
    return this.authToken;
  }

  /**
   * Gets the current user
   * @returns {object|null} Current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Checks if a user is authenticated
   * @returns {boolean} Whether a user is authenticated
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

// Create a singleton instance
const authManager = new AuthManager();

module.exports = {
  AuthManager,
  authManager,
  PERMISSION_LEVELS,
  DEFAULT_ROLES,
};
