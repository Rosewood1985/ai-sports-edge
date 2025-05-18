/**
 * Security Manager
 *
 * This organism-level component integrates all security features into a single interface.
 * It provides a comprehensive security solution for the application, including:
 * - API key and secret detection
 * - Input validation and sanitization
 * - Authentication and authorization
 */

// Import atomic components
const atomicSecurity = require('../../atoms/security');

// Import molecular components
const {
  // API Key Scanner
  scanFile,
  scanDirectory,
  scanProject,
  formatScanResults,
  saveScanResults,

  // Input Validator
  VALIDATION_SCHEMAS,
  validateForm,
  createValidationSchema,
  sanitizeForDisplay,
  sanitizeForDatabase,

  // Auth Manager
  AuthManager,
  authManager,
  PERMISSION_LEVELS,
  DEFAULT_ROLES,
} = require('../../molecules/security');

/**
 * Security Manager class
 */
class SecurityManager {
  constructor(options = {}) {
    this.options = {
      // Default options
      autoScanEnabled: false,
      scanInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      scanExclusions: [],
      validationOptions: {},
      authOptions: {},
      ...options,
    };

    // Initialize auth manager
    this.auth = authManager;

    // Initialize scan interval if auto-scan is enabled
    if (this.options.autoScanEnabled) {
      this.startAutoScan();
    }
  }

  /**
   * Initializes the security manager
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Initialize auth manager
      await this.auth.initialize();

      return true;
    } catch (error) {
      console.error('Error initializing security manager:', error);
      return false;
    }
  }

  /**
   * Starts automatic scanning for API keys and secrets
   * @param {number} interval - Scan interval in milliseconds
   */
  startAutoScan(interval = this.options.scanInterval) {
    // Clear any existing interval
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
    }

    // Set up new interval
    this.scanIntervalId = setInterval(() => {
      this.scanForSecrets();
    }, interval);

    // Run an initial scan
    this.scanForSecrets();
  }

  /**
   * Stops automatic scanning
   */
  stopAutoScan() {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
  }

  /**
   * Scans for API keys and secrets
   * @param {string} path - Path to scan (default: current directory)
   * @param {object} options - Scan options
   * @returns {Promise<object>} Scan results
   */
  async scanForSecrets(path = '.', options = {}) {
    try {
      // Merge default exclusions with user-provided exclusions
      const scanOptions = {
        ...options,
        exclusions: [...(options.exclusions || []), ...this.options.scanExclusions],
      };

      // Run the scan
      const results = scanProject(path, scanOptions);

      // Save results if specified
      if (options.saveResults) {
        const outputPath = options.outputPath || 'security-scan-results.json';
        saveScanResults(results, outputPath);
      }

      return results;
    } catch (error) {
      console.error('Error scanning for secrets:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validates form data
   * @param {object} formData - Form data to validate
   * @param {string} schemaName - Name of the validation schema
   * @returns {object} Validation result
   */
  validateForm(formData, schemaName) {
    try {
      return validateForm(formData, schemaName);
    } catch (error) {
      console.error('Error validating form:', error);
      return {
        sanitized: {},
        errors: { _general: error.message },
      };
    }
  }

  /**
   * Creates a custom validation schema
   * @param {object} schemaDefinition - Schema definition
   * @returns {object} Validation schema
   */
  createValidationSchema(schemaDefinition) {
    return createValidationSchema(schemaDefinition);
  }

  /**
   * Sanitizes user input for display
   * @param {string|object} input - Input to sanitize
   * @returns {string|object} Sanitized input
   */
  sanitizeForDisplay(input) {
    return sanitizeForDisplay(input);
  }

  /**
   * Sanitizes user input for database
   * @param {string|object} input - Input to sanitize
   * @returns {string|object} Sanitized input
   */
  sanitizeForDatabase(input) {
    return sanitizeForDatabase(input);
  }

  /**
   * Logs in a user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<object>} Login result
   */
  async login(email, password) {
    return this.auth.login(email, password);
  }

  /**
   * Logs in a user with a social provider
   * @param {string} provider - Social provider (e.g., 'google', 'facebook')
   * @returns {Promise<object>} Login result
   */
  async socialLogin(provider) {
    return this.auth.socialLogin(provider);
  }

  /**
   * Registers a new user
   * @param {object} userData - User data
   * @returns {Promise<object>} Registration result
   */
  async register(userData) {
    // Validate user data
    const { sanitized, errors } = this.validateForm(userData, 'USER_REGISTRATION');

    if (errors) {
      return {
        success: false,
        errors,
      };
    }

    // Register user
    return this.auth.register(sanitized);
  }

  /**
   * Logs out the current user
   * @returns {Promise<boolean>} Whether logout was successful
   */
  async logout() {
    return this.auth.logout();
  }

  /**
   * Checks if a user is authenticated
   * @returns {boolean} Whether a user is authenticated
   */
  isAuthenticated() {
    return this.auth.isUserAuthenticated();
  }

  /**
   * Gets the current user
   * @returns {object|null} Current user
   */
  getCurrentUser() {
    return this.auth.getCurrentUser();
  }

  /**
   * Checks if the current user has a specific permission
   * @param {number} requiredLevel - Required permission level
   * @returns {boolean} Whether the user has the required permission
   */
  hasPermission(requiredLevel) {
    return this.auth.hasPermission(requiredLevel);
  }

  /**
   * Checks if the current user has access to a specific resource
   * @param {object} resource - Resource to check access for
   * @param {string} action - Action to perform (read, write, delete, etc.)
   * @returns {boolean} Whether the user has access
   */
  hasResourceAccess(resource, action) {
    return this.auth.hasResourceAccess(resource, action);
  }

  /**
   * Adds an authentication state change listener
   * @param {Function} listener - Listener function
   * @returns {Function} Function to remove the listener
   */
  onAuthStateChanged(listener) {
    return this.auth.addAuthStateChangeListener(listener);
  }

  /**
   * Gets the authentication token
   * @returns {string|null} Authentication token
   */
  getAuthToken() {
    return this.auth.getAuthToken();
  }
}

// Create a singleton instance
const securityManager = new SecurityManager();

module.exports = {
  SecurityManager,
  securityManager,
  PERMISSION_LEVELS,
  DEFAULT_ROLES,
  VALIDATION_SCHEMAS,
};
