/**
 * Input Validator
 *
 * This module provides higher-level functionality for validating and sanitizing user input
 * using the atomic input validation utilities.
 */

const {
  sanitizeString,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidUsername,
  validatePasswordStrength,
  validateObject,
  escapeRegExp,
  sanitizeForSql,
} = require('../../atoms/security/inputValidation');

/**
 * Common validation schemas for different types of forms
 */
const VALIDATION_SCHEMAS = {
  /**
   * User registration form schema
   */
  USER_REGISTRATION: {
    username: {
      required: true,
      type: 'string',
      validate: value => {
        if (!isValidUsername(value)) {
          return 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens';
        }
        return true;
      },
    },
    email: {
      required: true,
      type: 'string',
      validate: value => {
        if (!isValidEmail(value)) {
          return 'Please enter a valid email address';
        }
        return true;
      },
    },
    password: {
      required: true,
      type: 'string',
      validate: value => {
        const result = validatePasswordStrength(value);
        if (!result.isValid) {
          return result.reasons.join('. ');
        }
        return true;
      },
      sanitizeString: false, // Don't sanitize passwords
    },
    confirmPassword: {
      required: true,
      type: 'string',
      validate: (value, allValues) => {
        if (value !== allValues.password) {
          return 'Passwords do not match';
        }
        return true;
      },
      sanitizeString: false, // Don't sanitize passwords
    },
    firstName: {
      required: true,
      type: 'string',
    },
    lastName: {
      required: true,
      type: 'string',
    },
    phone: {
      required: false,
      type: 'string',
      validate: value => {
        if (value && !isValidPhone(value)) {
          return 'Please enter a valid phone number';
        }
        return true;
      },
    },
    termsAccepted: {
      required: true,
      type: 'boolean',
      validate: value => {
        if (!value) {
          return 'You must accept the terms and conditions';
        }
        return true;
      },
    },
  },

  /**
   * User login form schema
   */
  USER_LOGIN: {
    email: {
      required: true,
      type: 'string',
      validate: value => {
        if (!isValidEmail(value)) {
          return 'Please enter a valid email address';
        }
        return true;
      },
    },
    password: {
      required: true,
      type: 'string',
      sanitizeString: false, // Don't sanitize passwords
    },
    rememberMe: {
      required: false,
      type: 'boolean',
    },
  },

  /**
   * Profile update form schema
   */
  PROFILE_UPDATE: {
    firstName: {
      required: true,
      type: 'string',
    },
    lastName: {
      required: true,
      type: 'string',
    },
    email: {
      required: true,
      type: 'string',
      validate: value => {
        if (!isValidEmail(value)) {
          return 'Please enter a valid email address';
        }
        return true;
      },
    },
    phone: {
      required: false,
      type: 'string',
      validate: value => {
        if (value && !isValidPhone(value)) {
          return 'Please enter a valid phone number';
        }
        return true;
      },
    },
    bio: {
      required: false,
      type: 'string',
    },
    website: {
      required: false,
      type: 'string',
      validate: value => {
        if (value && !isValidUrl(value, false)) {
          return 'Please enter a valid URL';
        }
        return true;
      },
    },
  },

  /**
   * Password change form schema
   */
  PASSWORD_CHANGE: {
    currentPassword: {
      required: true,
      type: 'string',
      sanitizeString: false, // Don't sanitize passwords
    },
    newPassword: {
      required: true,
      type: 'string',
      validate: value => {
        const result = validatePasswordStrength(value);
        if (!result.isValid) {
          return result.reasons.join('. ');
        }
        return true;
      },
      sanitizeString: false, // Don't sanitize passwords
    },
    confirmPassword: {
      required: true,
      type: 'string',
      validate: (value, allValues) => {
        if (value !== allValues.newPassword) {
          return 'Passwords do not match';
        }
        return true;
      },
      sanitizeString: false, // Don't sanitize passwords
    },
  },

  /**
   * Contact form schema
   */
  CONTACT_FORM: {
    name: {
      required: true,
      type: 'string',
    },
    email: {
      required: true,
      type: 'string',
      validate: value => {
        if (!isValidEmail(value)) {
          return 'Please enter a valid email address';
        }
        return true;
      },
    },
    subject: {
      required: true,
      type: 'string',
    },
    message: {
      required: true,
      type: 'string',
    },
  },

  /**
   * Payment form schema
   */
  PAYMENT_FORM: {
    cardholderName: {
      required: true,
      type: 'string',
    },
    cardNumber: {
      required: true,
      type: 'string',
      validate: value => {
        // Basic credit card validation (remove spaces and check length)
        const digitsOnly = value.replace(/\s+/g, '');
        if (!/^\d{13,19}$/.test(digitsOnly)) {
          return 'Please enter a valid card number';
        }

        // Luhn algorithm for credit card validation
        let sum = 0;
        let shouldDouble = false;

        for (let i = digitsOnly.length - 1; i >= 0; i--) {
          let digit = parseInt(digitsOnly.charAt(i));

          if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
              digit -= 9;
            }
          }

          sum += digit;
          shouldDouble = !shouldDouble;
        }

        if (sum % 10 !== 0) {
          return 'Please enter a valid card number';
        }

        return true;
      },
      sanitize: value => {
        // Remove all non-digit characters
        return value.replace(/\D/g, '');
      },
    },
    expiryMonth: {
      required: true,
      type: 'string',
      validate: value => {
        const month = parseInt(value, 10);
        if (isNaN(month) || month < 1 || month > 12) {
          return 'Please enter a valid month (1-12)';
        }
        return true;
      },
    },
    expiryYear: {
      required: true,
      type: 'string',
      validate: value => {
        const year = parseInt(value, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < currentYear || year > currentYear + 20) {
          return `Please enter a valid year (${currentYear}-${currentYear + 20})`;
        }
        return true;
      },
    },
    cvv: {
      required: true,
      type: 'string',
      validate: value => {
        if (!/^\d{3,4}$/.test(value)) {
          return 'Please enter a valid CVV (3-4 digits)';
        }
        return true;
      },
    },
    billingAddress: {
      required: true,
      type: 'string',
    },
    billingCity: {
      required: true,
      type: 'string',
    },
    billingState: {
      required: true,
      type: 'string',
    },
    billingZip: {
      required: true,
      type: 'string',
      validate: value => {
        // Basic ZIP code validation (5 digits or 5+4 format)
        if (!/^\d{5}(-\d{4})?$/.test(value)) {
          return 'Please enter a valid ZIP code';
        }
        return true;
      },
    },
    billingCountry: {
      required: true,
      type: 'string',
    },
  },
};

/**
 * Validates a form using a predefined schema
 * @param {object} formData - Form data to validate
 * @param {string} schemaName - Name of the schema to use (e.g., 'USER_REGISTRATION')
 * @returns {object} Validation result with sanitized data and errors
 */
const validateForm = (formData, schemaName) => {
  const schema = VALIDATION_SCHEMAS[schemaName];

  if (!schema) {
    throw new Error(`Unknown validation schema: ${schemaName}`);
  }

  return validateObject(formData, schema);
};

/**
 * Creates a custom validation schema
 * @param {object} schemaDefinition - Schema definition
 * @returns {object} Validation schema
 */
const createValidationSchema = schemaDefinition => {
  return schemaDefinition;
};

/**
 * Sanitizes user input for display in HTML
 * @param {string|object} input - Input to sanitize
 * @returns {string|object} Sanitized input
 */
const sanitizeForDisplay = input => {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};

    Object.keys(input).forEach(key => {
      if (typeof input[key] === 'string') {
        sanitized[key] = sanitizeString(input[key]);
      } else if (typeof input[key] === 'object' && input[key] !== null) {
        sanitized[key] = sanitizeForDisplay(input[key]);
      } else {
        sanitized[key] = input[key];
      }
    });

    return sanitized;
  }

  return input;
};

/**
 * Sanitizes user input for use in a database query
 * @param {string|object} input - Input to sanitize
 * @returns {string|object} Sanitized input
 */
const sanitizeForDatabase = input => {
  if (typeof input === 'string') {
    return sanitizeForSql(input);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};

    Object.keys(input).forEach(key => {
      if (typeof input[key] === 'string') {
        sanitized[key] = sanitizeForSql(input[key]);
      } else if (typeof input[key] === 'object' && input[key] !== null) {
        sanitized[key] = sanitizeForDatabase(input[key]);
      } else {
        sanitized[key] = input[key];
      }
    });

    return sanitized;
  }

  return input;
};

module.exports = {
  VALIDATION_SCHEMAS,
  validateForm,
  createValidationSchema,
  sanitizeForDisplay,
  sanitizeForDatabase,
};
