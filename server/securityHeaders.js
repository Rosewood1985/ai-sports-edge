/**
 * Security Headers Module
 * 
 * This module provides security headers configuration for the AI Sports Edge application.
 * It implements best practices for web security headers to protect against various attacks.
 */

const helmet = require('helmet');
const { createLogger } = require('./loggingService');

// Create a logger for security events
const securityLogger = createLogger('security');

/**
 * Configure security headers middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Helmet middleware configured with security headers
 */
const configureSecurityHeaders = (options = {}) => {
  const {
    // Content Security Policy options
    enableCSP = true,
    reportOnly = false,
    // Default CSP directives
    defaultSrc = ["'self'"],
    scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.google-analytics.com', 'https://cdn.jsdelivr.net'],
    styleSrc = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc = ["'self'", 'data:', 'https://www.google-analytics.com', 'https://cdn.jsdelivr.net'],
    fontSrc = ["'self'", 'https://fonts.gstatic.com'],
    connectSrc = ["'self'", 'https://www.google-analytics.com', 'https://api.aisportsedge.com'],
    // Other security header options
    enableHSTS = true,
    hstsMaxAge = 15552000, // 180 days
    enableXFrame = true,
    xFrameOption = 'SAMEORIGIN',
    enableXContentType = true,
    enableXXSS = true,
    enableReferrerPolicy = true,
    referrerPolicy = 'strict-origin-when-cross-origin',
    enablePermissionsPolicy = true,
    // DNS prefetch control
    enableDNSPrefetchControl = true,
    // Cache control
    enableNoCache = false,
  } = options;

  // Configure Helmet options
  const helmetOptions = {};

  // Content Security Policy
  if (enableCSP) {
    helmetOptions.contentSecurityPolicy = {
      useDefaults: false,
      directives: {
        defaultSrc,
        scriptSrc,
        styleSrc,
        imgSrc,
        fontSrc,
        connectSrc,
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
      reportOnly,
    };
  } else {
    helmetOptions.contentSecurityPolicy = false;
  }

  // HTTP Strict Transport Security
  if (enableHSTS) {
    helmetOptions.hsts = {
      maxAge: hstsMaxAge,
      includeSubDomains: true,
      preload: true,
    };
  } else {
    helmetOptions.hsts = false;
  }

  // X-Frame-Options
  if (enableXFrame) {
    helmetOptions.frameguard = {
      action: xFrameOption,
    };
  } else {
    helmetOptions.frameguard = false;
  }

  // X-Content-Type-Options
  helmetOptions.noSniff = enableXContentType;

  // X-XSS-Protection
  helmetOptions.xssFilter = enableXXSS;

  // Referrer-Policy
  if (enableReferrerPolicy) {
    helmetOptions.referrerPolicy = {
      policy: referrerPolicy,
    };
  } else {
    helmetOptions.referrerPolicy = false;
  }

  // Permissions-Policy
  if (enablePermissionsPolicy) {
    helmetOptions.permittedCrossDomainPolicies = {
      permittedPolicies: 'none',
    };
  } else {
    helmetOptions.permittedCrossDomainPolicies = false;
  }

  // DNS Prefetch Control
  helmetOptions.dnsPrefetchControl = {
    allow: !enableDNSPrefetchControl,
  };

  // Cache Control
  helmetOptions.noCache = enableNoCache;

  // Create and return the configured middleware
  const middleware = helmet(helmetOptions);

  // Log the configuration
  securityLogger.info('Security headers configured', {
    csp: enableCSP,
    hsts: enableHSTS,
    xFrame: enableXFrame,
    xContentType: enableXContentType,
    xXSS: enableXXSS,
    referrerPolicy: enableReferrerPolicy,
    permissionsPolicy: enablePermissionsPolicy,
    dnsPrefetchControl: enableDNSPrefetchControl,
    noCache: enableNoCache,
  });

  return middleware;
};

/**
 * Apply security headers to an Express app
 * @param {Object} app - Express app
 * @param {Object} options - Configuration options
 */
const applySecurityHeaders = (app, options = {}) => {
  const middleware = configureSecurityHeaders(options);
  app.use(middleware);
};

/**
 * Generate Content Security Policy for HTML meta tag
 * @param {Object} options - CSP options
 * @returns {String} CSP meta tag content
 */
const generateCSPMetaTag = (options = {}) => {
  const {
    defaultSrc = ["'self'"],
    scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc = ["'self'", "'unsafe-inline'"],
    imgSrc = ["'self'", 'data:'],
    fontSrc = ["'self'"],
    connectSrc = ["'self'"],
    reportOnly = false,
  } = options;

  // Build CSP directives
  const directives = [
    `default-src ${defaultSrc.join(' ')}`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `font-src ${fontSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
  ];

  // Join directives with semicolons
  const cspContent = directives.join('; ');

  // Return meta tag content
  return `<meta http-equiv="Content-Security-Policy${reportOnly ? '-Report-Only' : ''}" content="${cspContent}">`;
};

/**
 * Generate security headers for static HTML files
 * @param {Object} options - Security header options
 * @returns {Object} Object containing meta tags and HTTP headers
 */
const generateStaticSecurityHeaders = (options = {}) => {
  // Generate CSP meta tag
  const cspMetaTag = generateCSPMetaTag(options.csp);

  // Generate other security meta tags
  const metaTags = [
    cspMetaTag,
    '<meta http-equiv="X-Content-Type-Options" content="nosniff">',
    '<meta http-equiv="X-XSS-Protection" content="1; mode=block">',
    '<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">',
  ];

  // Generate HTTP headers
  const httpHeaders = {
    'Content-Security-Policy': cspMetaTag.match(/content="([^"]+)"/)[1],
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=15552000; includeSubDomains; preload',
  };

  return {
    metaTags: metaTags.join('\n  '),
    httpHeaders,
  };
};

module.exports = {
  configureSecurityHeaders,
  applySecurityHeaders,
  generateCSPMetaTag,
  generateStaticSecurityHeaders,
};