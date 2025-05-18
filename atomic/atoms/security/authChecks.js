/**
 * Authentication and Authorization Check Utilities
 *
 * This module provides utilities for verifying proper access controls
 * and implementing authentication and authorization checks.
 */

/**
 * Permission levels for role-based access control
 */
const PERMISSION_LEVELS = {
  NONE: 0,
  READ: 1,
  COMMENT: 2,
  EDIT: 3,
  CREATE: 4,
  DELETE: 5,
  ADMIN: 10,
};

/**
 * Default roles with their permission levels
 */
const DEFAULT_ROLES = {
  GUEST: {
    name: 'Guest',
    level: PERMISSION_LEVELS.READ,
    description: 'Can only view public content',
  },
  USER: {
    name: 'User',
    level: PERMISSION_LEVELS.COMMENT,
    description: 'Can view and comment on content',
  },
  CONTRIBUTOR: {
    name: 'Contributor',
    level: PERMISSION_LEVELS.CREATE,
    description: 'Can create and edit own content',
  },
  EDITOR: {
    name: 'Editor',
    level: PERMISSION_LEVELS.EDIT,
    description: 'Can edit all content',
  },
  ADMIN: {
    name: 'Admin',
    level: PERMISSION_LEVELS.ADMIN,
    description: 'Has full administrative access',
  },
};

/**
 * Checks if a token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} Whether the token is expired
 */
const isTokenExpired = token => {
  if (!token) {
    return true;
  }

  try {
    // Extract the payload from the JWT token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

    // Check if the token has an expiration time
    if (!payload.exp) {
      return false;
    }

    // Compare the expiration time with the current time
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    // If there's an error parsing the token, consider it expired
    return true;
  }
};

/**
 * Checks if a user has the required permission level
 * @param {object} user - User object with role information
 * @param {number} requiredLevel - Required permission level
 * @returns {boolean} Whether the user has the required permission
 */
const hasPermission = (user, requiredLevel) => {
  if (!user || !user.role) {
    return false;
  }

  // Get the user's permission level
  let userLevel = PERMISSION_LEVELS.NONE;

  if (typeof user.role === 'string') {
    // If role is a string, look up the permission level
    userLevel = DEFAULT_ROLES[user.role.toUpperCase()]?.level || PERMISSION_LEVELS.NONE;
  } else if (typeof user.role === 'object' && user.role.level !== undefined) {
    // If role is an object with a level property, use that
    userLevel = user.role.level;
  } else if (typeof user.permissionLevel === 'number') {
    // If user has a permissionLevel property, use that
    userLevel = user.permissionLevel;
  }

  return userLevel >= requiredLevel;
};

/**
 * Checks if a user has access to a specific resource
 * @param {object} user - User object with role and permissions
 * @param {object} resource - Resource to check access for
 * @param {string} action - Action to perform (read, write, delete, etc.)
 * @returns {boolean} Whether the user has access
 */
const hasResourceAccess = (user, resource, action) => {
  if (!user || !resource) {
    return false;
  }

  // Admin users have access to everything
  if (hasPermission(user, PERMISSION_LEVELS.ADMIN)) {
    return true;
  }

  // Check if the user is the owner of the resource
  const isOwner =
    resource.ownerId === user.id || resource.userId === user.id || resource.createdBy === user.id;

  // Map actions to required permission levels
  const actionLevels = {
    read: PERMISSION_LEVELS.READ,
    view: PERMISSION_LEVELS.READ,
    comment: PERMISSION_LEVELS.COMMENT,
    edit: PERMISSION_LEVELS.EDIT,
    update: PERMISSION_LEVELS.EDIT,
    write: PERMISSION_LEVELS.EDIT,
    create: PERMISSION_LEVELS.CREATE,
    delete: PERMISSION_LEVELS.DELETE,
  };

  const requiredLevel = actionLevels[action.toLowerCase()] || PERMISSION_LEVELS.ADMIN;

  // Owners can edit and delete their own resources
  if (
    isOwner &&
    (action === 'edit' || action === 'update' || action === 'write' || action === 'delete')
  ) {
    return true;
  }

  // Check if the user has the required permission level
  return hasPermission(user, requiredLevel);
};

/**
 * Validates a Firebase ID token
 * @param {string} idToken - Firebase ID token to validate
 * @returns {Promise<object>} Decoded token payload or null if invalid
 */
const validateFirebaseToken = async idToken => {
  if (!idToken) {
    return null;
  }

  try {
    // This is a placeholder for actual Firebase token validation
    // In a real implementation, you would use the Firebase Admin SDK
    // to verify the token and get the user information

    // Example implementation with Firebase Admin SDK:
    // const admin = require('firebase-admin');
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // return decodedToken;

    // For now, we'll just decode the token without verification
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

    // Check if the token is expired
    if (isTokenExpired(idToken)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Error validating Firebase token:', error);
    return null;
  }
};

/**
 * Generates a secure random token
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} Random token
 */
const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hashes a password using bcrypt
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async password => {
  // This is a placeholder for actual password hashing
  // In a real implementation, you would use bcrypt or a similar library

  // Example implementation with bcrypt:
  // const bcrypt = require('bcrypt');
  // const saltRounds = 10;
  // return await bcrypt.hash(password, saltRounds);

  // For now, we'll just use a simple hash function
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verifies a password against a hash
 * @param {string} password - Password to verify
 * @param {string} hash - Hash to verify against
 * @returns {Promise<boolean>} Whether the password matches the hash
 */
const verifyPassword = async (password, hash) => {
  // This is a placeholder for actual password verification
  // In a real implementation, you would use bcrypt or a similar library

  // Example implementation with bcrypt:
  // const bcrypt = require('bcrypt');
  // return await bcrypt.compare(password, hash);

  // For now, we'll just use a simple hash function
  const crypto = require('crypto');
  const [salt, storedHash] = hash.split(':');
  const calculatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === calculatedHash;
};

module.exports = {
  PERMISSION_LEVELS,
  DEFAULT_ROLES,
  isTokenExpired,
  hasPermission,
  hasResourceAccess,
  validateFirebaseToken,
  generateSecureToken,
  hashPassword,
  verifyPassword,
};
