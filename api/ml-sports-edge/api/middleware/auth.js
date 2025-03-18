/**
 * Authentication Middleware
 * Handles user authentication and authorization
 */

const jwt = require('jsonwebtoken');

/**
 * Authenticate user based on JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: { 
          message: 'Authentication required',
          status: 401
        } 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: { 
          message: 'Token expired',
          status: 401
        } 
      });
    }
    
    return res.status(401).json({ 
      error: { 
        message: 'Invalid token',
        status: 401
      } 
    });
  }
};

/**
 * Authorize admin access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: { 
        message: 'Admin access required',
        status: 403
      } 
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin
};