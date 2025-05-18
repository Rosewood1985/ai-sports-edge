/**
 * Input Validation and Sanitization Utilities
 *
 * This module provides utilities for validating and sanitizing user input
 * to prevent injection attacks and other security vulnerabilities.
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} The sanitized string
 */
const sanitizeString = input => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {boolean} Whether the email is valid
 */
const isValidEmail = email => {
  if (typeof email !== 'string') {
    return false;
  }

  // RFC 5322 compliant email regex
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

/**
 * Validates a URL
 * @param {string} url - The URL to validate
 * @param {boolean} requireHttps - Whether to require HTTPS
 * @returns {boolean} Whether the URL is valid
 */
const isValidUrl = (url, requireHttps = true) => {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    if (requireHttps && parsedUrl.protocol !== 'https:') {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validates a phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
const isValidPhone = phone => {
  if (typeof phone !== 'string') {
    return false;
  }

  // Basic international phone number validation
  // Allows +, spaces, dashes, and parentheses
  const phoneRegex = /^\+?[\d\s\-()]{10,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates a username
 * @param {string} username - The username to validate
 * @param {object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 3)
 * @param {number} options.maxLength - Maximum length (default: 20)
 * @param {string} options.allowedChars - Regex pattern for allowed characters (default: alphanumeric, underscore, hyphen)
 * @returns {boolean} Whether the username is valid
 */
const isValidUsername = (username, options = {}) => {
  if (typeof username !== 'string') {
    return false;
  }

  const { minLength = 3, maxLength = 20, allowedChars = '^[a-zA-Z0-9_-]+$' } = options;

  if (username.length < minLength || username.length > maxLength) {
    return false;
  }

  const regex = new RegExp(allowedChars);
  return regex.test(username);
};

/**
 * Validates a password strength
 * @param {string} password - The password to validate
 * @param {object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 8)
 * @param {boolean} options.requireUppercase - Require uppercase letters (default: true)
 * @param {boolean} options.requireLowercase - Require lowercase letters (default: true)
 * @param {boolean} options.requireNumbers - Require numbers (default: true)
 * @param {boolean} options.requireSpecial - Require special characters (default: true)
 * @returns {object} Validation result with isValid flag and reasons for failure
 */
const validatePasswordStrength = (password, options = {}) => {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      reasons: ['Password must be a string'],
    };
  }

  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = true,
  } = options;

  const reasons = [];

  if (password.length < minLength) {
    reasons.push(`Password must be at least ${minLength} characters long`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    reasons.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    reasons.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    reasons.push('Password must contain at least one number');
  }

  if (requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    reasons.push('Password must contain at least one special character');
  }

  return {
    isValid: reasons.length === 0,
    reasons,
  };
};

/**
 * Sanitizes and validates an object's properties
 * @param {object} input - The input object to sanitize
 * @param {object} schema - The validation schema
 * @returns {object} The sanitized object and validation errors
 */
const validateObject = (input, schema) => {
  if (typeof input !== 'object' || input === null) {
    return {
      sanitized: {},
      errors: { _general: 'Input must be an object' },
    };
  }

  const sanitized = {};
  const errors = {};

  Object.keys(schema).forEach(key => {
    const fieldSchema = schema[key];
    const value = input[key];

    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors[key] = `${key} is required`;
      return;
    }

    // Skip undefined optional fields
    if (value === undefined) {
      return;
    }

    // Type validation
    if (fieldSchema.type && typeof value !== fieldSchema.type) {
      errors[key] = `${key} must be a ${fieldSchema.type}`;
      return;
    }

    // Custom validation
    if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
      const validationResult = fieldSchema.validate(value);
      if (validationResult !== true) {
        errors[key] = validationResult || `${key} is invalid`;
        return;
      }
    }

    // Sanitization
    if (fieldSchema.sanitize && typeof fieldSchema.sanitize === 'function') {
      sanitized[key] = fieldSchema.sanitize(value);
    } else if (typeof value === 'string' && fieldSchema.sanitizeString !== false) {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  });

  return { sanitized, errors: Object.keys(errors).length > 0 ? errors : null };
};

/**
 * Escapes a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 */
const escapeRegExp = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitizes a string for use in SQL queries to prevent SQL injection
 * @param {string} input - The input string to sanitize
 * @returns {string} The sanitized string
 */
const sanitizeForSql = input => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\x1a/g, '\\Z');
};

module.exports = {
  sanitizeString,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidUsername,
  validatePasswordStrength,
  validateObject,
  escapeRegExp,
  sanitizeForSql,
};
