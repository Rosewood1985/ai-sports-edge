/**
 * DDoS Protection Module
 *
 * This module provides DDoS protection for the AI Sports Edge application.
 * It uses rate limiting, IP filtering, and other techniques to prevent denial of service attacks.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const ipFilter = require('express-ipfilter').IpFilter;

const { createLogger } = require('./loggingService');

// Create a logger for security events
const securityLogger = createLogger('security');

/**
 * Configure DDoS protection middleware
 * @param {Object} options - Configuration options
 * @returns {Array} Array of middleware functions
 */
const configureDdosProtection = (options = {}) => {
  const {
    rateWindow = 15 * 60 * 1000, // 15 minutes
    rateMax = 100, // 100 requests per window
    speedWindow = 15 * 60 * 1000, // 15 minutes
    speedDelay = 500, // 500ms delay after threshold
    speedDelayAfter = 50, // Start delaying after 50 requests
    trustProxy = true, // Trust X-Forwarded-For header
    blacklist = [], // IP blacklist
    whitelist = [], // IP whitelist
  } = options;

  // Array to hold middleware
  const middleware = [];

  // Trust proxy if enabled
  if (trustProxy) {
    middleware.push((req, res, next) => {
      req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      next();
    });
  }

  // IP filtering middleware
  if (blacklist.length > 0 || whitelist.length > 0) {
    const ipFilterOptions = {
      mode: whitelist.length > 0 ? 'allow' : 'deny',
      log: false, // We'll handle logging ourselves
      allowedHeaders: ['x-forwarded-for'],
    };

    middleware.push(ipFilter(whitelist.length > 0 ? whitelist : blacklist, ipFilterOptions));

    // Custom IP filter error handler
    middleware.push((err, req, res, next) => {
      if (err.name === 'IpDeniedError') {
        securityLogger.warn('IP Blocked', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent'],
        });

        return res.status(403).json({
          error: 'Access Denied',
          message: 'Your IP address is not allowed to access this resource',
        });
      }

      next(err);
    });
  }

  // Rate limiting middleware
  const limiter = rateLimit({
    windowMs: rateWindow,
    max: rateMax,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      securityLogger.warn('Rate Limit Exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      });
    },
  });

  middleware.push(limiter);

  // Speed limiting middleware
  const speedLimiter = slowDown({
    windowMs: speedWindow,
    delayAfter: speedDelayAfter,
    delayMs: speedDelay,
    onLimitReached: (req, res, options) => {
      securityLogger.info('Speed Limit Reached', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        delay: options.delayMs,
      });
    },
  });

  middleware.push(speedLimiter);

  // Helmet middleware for security headers
  middleware.push(helmet());

  // Detect and log suspicious requests
  middleware.push((req, res, next) => {
    // Check for suspicious query parameters
    const suspiciousParams = Object.keys(req.query).some(
      param =>
        param.includes('script') ||
        param.includes('exec') ||
        param.includes('sql') ||
        param.includes('eval')
    );

    // Check for suspicious headers
    const suspiciousHeaders = Object.keys(req.headers).some(
      header => header.includes('x-forwarded-host') || header.includes('x-host')
    );

    // Check for suspicious paths
    const suspiciousPath =
      req.path.includes('..') ||
      req.path.includes('admin') ||
      req.path.includes('wp-') ||
      req.path.includes('phpMyAdmin');

    if (suspiciousParams || suspiciousHeaders || suspiciousPath) {
      securityLogger.warn('Suspicious Request Detected', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        query: req.query,
        headers: req.headers,
        userAgent: req.headers['user-agent'],
        suspiciousParams,
        suspiciousHeaders,
        suspiciousPath,
      });
    }

    next();
  });

  return middleware;
};

/**
 * Apply DDoS protection to an Express app
 * @param {Object} app - Express app
 * @param {Object} options - Configuration options
 */
const applyDdosProtection = (app, options = {}) => {
  const middleware = configureDdosProtection(options);

  middleware.forEach(mw => {
    app.use(mw);
  });

  securityLogger.info('DDoS protection configured', {
    rateWindow: options.rateWindow || '15 minutes',
    rateMax: options.rateMax || 100,
    speedWindow: options.speedWindow || '15 minutes',
    speedDelay: options.speedDelay || 500,
    speedDelayAfter: options.speedDelayAfter || 50,
    blacklistCount: (options.blacklist || []).length,
    whitelistCount: (options.whitelist || []).length,
  });
};

module.exports = {
  configureDdosProtection,
  applyDdosProtection,
};
