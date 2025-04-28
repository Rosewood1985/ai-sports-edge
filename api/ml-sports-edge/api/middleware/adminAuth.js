/**
 * Admin Authentication Middleware
 * Verifies admin privileges for protected routes
 */

const logger = require('../../utils/logger');

/**
 * Middleware to verify admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminAuth = (req, res, next) => {
  try {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if user has admin role
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      logger.warn(`Unauthorized admin access attempt by user ${req.user.id}`);
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    
    // User is an admin, continue to next middleware
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Admin authentication failed' });
  }
};

module.exports = adminAuth;