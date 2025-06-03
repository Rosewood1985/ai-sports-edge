/**
 * Secure File Upload Service
 *
 * Provides comprehensive security validation for file uploads with special focus
 * on image files for OCR processing. Prevents command injection, path traversal,
 * and other security vulnerabilities.
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Security configuration for file uploads
 */
const SECURITY_CONFIG = {
  // Allowed MIME types for image uploads
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
  ],

  // Allowed file extensions
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'],

  // Maximum file size (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  // Maximum filename length
  MAX_FILENAME_LENGTH: 255,

  // Secure upload directory
  UPLOAD_DIR: '/tmp/secure_uploads',

  // File magic numbers for validation
  FILE_SIGNATURES: {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/bmp': [0x42, 0x4d],
    'image/tiff': [0x49, 0x49, 0x2a, 0x00], // Little endian
    'image/webp': [0x57, 0x45, 0x42, 0x50],
  },
};

/**
 * Custom security error class
 */
class SecurityError extends Error {
  constructor(message, code = 'SECURITY_VIOLATION') {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
  }
}

/**
 * Secure File Upload Service
 */
class SecureFileUploadService {
  constructor() {
    this.initializeUploadDirectory();
  }

  /**
   * Initialize secure upload directory
   */
  async initializeUploadDirectory() {
    try {
      await fs.access(SECURITY_CONFIG.UPLOAD_DIR);
    } catch {
      await fs.mkdir(SECURITY_CONFIG.UPLOAD_DIR, {
        recursive: true,
        mode: 0o700, // Owner read/write/execute only
      });
    }
  }

  /**
   * Validates and secures an uploaded file
   * @param {Object} file - File object with originalname, mimetype, size, buffer
   * @returns {Promise<Object>} Validation result with secure path
   */
  async validateAndSecureFile(file) {
    try {
      // Step 1: Basic file validation
      this.validateFileBasics(file);

      // Step 2: Filename sanitization
      const secureFilename = this.sanitizeFilename(file.originalname);

      // Step 3: MIME type validation
      this.validateMimeType(file.mimetype);

      // Step 4: File size validation
      this.validateFileSize(file.size);

      // Step 5: File content validation (magic numbers)
      await this.validateFileContent(file.buffer, file.mimetype);

      // Step 6: Generate secure file path
      const securePath = await this.generateSecurePath(secureFilename);

      // Step 7: Save file securely
      await this.saveFileSecurely(file.buffer, securePath);

      // Step 8: Verify saved file integrity
      await this.verifyFileIntegrity(securePath, file.buffer);

      return {
        success: true,
        securePath,
        originalName: file.originalname,
        secureFilename,
        size: file.size,
        mimetype: file.mimetype,
        hash: this.calculateFileHash(file.buffer),
      };
    } catch (error) {
      throw new SecurityError(`File validation failed: ${error.message}`, 'VALIDATION_FAILED');
    }
  }

  /**
   * Validates basic file properties
   * @param {Object} file - File object
   */
  validateFileBasics(file) {
    if (!file) {
      throw new SecurityError('No file provided', 'NO_FILE');
    }

    if (!file.originalname) {
      throw new SecurityError('No filename provided', 'NO_FILENAME');
    }

    if (!file.buffer) {
      throw new SecurityError('No file content provided', 'NO_CONTENT');
    }

    if (!file.mimetype) {
      throw new SecurityError('No MIME type provided', 'NO_MIMETYPE');
    }
  }

  /**
   * Sanitizes filename to prevent security issues
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    if (filename.length > SECURITY_CONFIG.MAX_FILENAME_LENGTH) {
      throw new SecurityError('Filename too long', 'FILENAME_TOO_LONG');
    }

    // Remove path separators and dangerous characters
    let sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Remove leading dots to prevent hidden files
    sanitized = sanitized.replace(/^\.+/, '');

    // Ensure filename is not empty after sanitization
    if (!sanitized || sanitized.length === 0) {
      throw new SecurityError('Invalid filename after sanitization', 'INVALID_FILENAME');
    }

    // Add timestamp prefix to prevent conflicts
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');

    return `${timestamp}_${randomSuffix}_${sanitized}`;
  }

  /**
   * Validates MIME type against allowed types
   * @param {string} mimetype - File MIME type
   */
  validateMimeType(mimetype) {
    if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase())) {
      throw new SecurityError(
        `Invalid file type: ${mimetype}. Allowed types: ${SECURITY_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`,
        'INVALID_MIME_TYPE'
      );
    }
  }

  /**
   * Validates file size
   * @param {number} size - File size in bytes
   */
  validateFileSize(size) {
    if (size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      throw new SecurityError(
        `File too large: ${size} bytes. Maximum allowed: ${SECURITY_CONFIG.MAX_FILE_SIZE} bytes`,
        'FILE_TOO_LARGE'
      );
    }

    if (size === 0) {
      throw new SecurityError('Empty file not allowed', 'EMPTY_FILE');
    }
  }

  /**
   * Validates file content using magic numbers
   * @param {Buffer} buffer - File buffer
   * @param {string} mimetype - Claimed MIME type
   */
  async validateFileContent(buffer, mimetype) {
    const signature = SECURITY_CONFIG.FILE_SIGNATURES[mimetype.toLowerCase()];

    if (!signature) {
      throw new SecurityError(`No signature validation available for ${mimetype}`, 'NO_SIGNATURE');
    }

    if (buffer.length < signature.length) {
      throw new SecurityError('File too small to contain valid header', 'INVALID_HEADER');
    }

    // Check magic numbers
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        throw new SecurityError(
          `File content doesn't match claimed type ${mimetype}`,
          'CONTENT_TYPE_MISMATCH'
        );
      }
    }
  }

  /**
   * Generates secure file path
   * @param {string} filename - Sanitized filename
   * @returns {Promise<string>} Secure file path
   */
  async generateSecurePath(filename) {
    const securePath = path.resolve(SECURITY_CONFIG.UPLOAD_DIR, filename);

    // Ensure path is within upload directory (prevent path traversal)
    if (!securePath.startsWith(path.resolve(SECURITY_CONFIG.UPLOAD_DIR))) {
      throw new SecurityError('Path traversal attempt detected', 'PATH_TRAVERSAL');
    }

    // Check if file already exists
    try {
      await fs.access(securePath);
      throw new SecurityError('File already exists', 'FILE_EXISTS');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, which is what we want
    }

    return securePath;
  }

  /**
   * Saves file with secure permissions
   * @param {Buffer} buffer - File buffer
   * @param {string} securePath - Secure file path
   */
  async saveFileSecurely(buffer, securePath) {
    try {
      await fs.writeFile(securePath, buffer, {
        mode: 0o600, // Owner read/write only
      });
    } catch (error) {
      throw new SecurityError(`Failed to save file: ${error.message}`, 'SAVE_FAILED');
    }
  }

  /**
   * Verifies file integrity after saving
   * @param {string} securePath - Secure file path
   * @param {Buffer} originalBuffer - Original file buffer
   */
  async verifyFileIntegrity(securePath, originalBuffer) {
    try {
      const savedBuffer = await fs.readFile(securePath);

      if (!savedBuffer.equals(originalBuffer)) {
        // Clean up corrupted file
        await this.secureFileCleanup(securePath);
        throw new SecurityError('File integrity check failed', 'INTEGRITY_FAILED');
      }
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(
        `Integrity verification failed: ${error.message}`,
        'VERIFICATION_FAILED'
      );
    }
  }

  /**
   * Calculates file hash for integrity checking
   * @param {Buffer} buffer - File buffer
   * @returns {string} SHA-256 hash
   */
  calculateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Securely deletes a file
   * @param {string} filePath - Path to file to delete
   */
  async secureFileCleanup(filePath) {
    try {
      // Verify path is within upload directory
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(path.resolve(SECURITY_CONFIG.UPLOAD_DIR))) {
        throw new SecurityError(
          'Attempted to delete file outside upload directory',
          'INVALID_DELETE_PATH'
        );
      }

      await fs.unlink(resolvedPath);
    } catch (error) {
      console.error('Failed to clean up file:', error);
      // Don't throw here to avoid masking original errors
    }
  }

  /**
   * Gets file information securely
   * @param {string} filePath - Secure file path
   * @returns {Promise<Object>} File information
   */
  async getSecureFileInfo(filePath) {
    try {
      // Verify path is within upload directory
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(path.resolve(SECURITY_CONFIG.UPLOAD_DIR))) {
        throw new SecurityError(
          'Attempted to access file outside upload directory',
          'INVALID_ACCESS_PATH'
        );
      }

      const stats = await fs.stat(resolvedPath);
      const buffer = await fs.readFile(resolvedPath);

      return {
        path: resolvedPath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        hash: this.calculateFileHash(buffer),
        permissions: stats.mode,
      };
    } catch (error) {
      throw new SecurityError(`Failed to get file info: ${error.message}`, 'FILE_INFO_FAILED');
    }
  }

  /**
   * Validates file path for OCR processing
   * @param {string} filePath - File path to validate
   * @returns {string} Validated file path
   */
  validatePathForOCR(filePath) {
    // Resolve absolute path
    const resolvedPath = path.resolve(filePath);

    // Ensure path is within upload directory
    if (!resolvedPath.startsWith(path.resolve(SECURITY_CONFIG.UPLOAD_DIR))) {
      throw new SecurityError('Invalid file path for OCR processing', 'INVALID_OCR_PATH');
    }

    // Check for dangerous characters that could be used in command injection
    const dangerousChars = /[;&|`$(){}[\]<>]/;
    if (dangerousChars.test(resolvedPath)) {
      throw new SecurityError('File path contains dangerous characters', 'DANGEROUS_PATH_CHARS');
    }

    return resolvedPath;
  }

  /**
   * Gets security configuration
   * @returns {Object} Security configuration
   */
  getSecurityConfig() {
    return { ...SECURITY_CONFIG };
  }
}

// Export singleton instance
const secureFileUploadService = new SecureFileUploadService();

module.exports = {
  SecureFileUploadService,
  secureFileUploadService,
  SecurityError,
  SECURITY_CONFIG,
};
