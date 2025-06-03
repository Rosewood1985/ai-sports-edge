/**
 * Secure Image Preprocessing Service
 *
 * SECURITY-HARDENED VERSION that replaces imagePreprocessingService.js
 * Provides secure image preprocessing with validated operations and proper file handling.
 */

const path = require('path');

const { secureCommandService, CommandSecurityError } = require('./secureCommandService');
const { secureFileUploadService, SecurityError } = require('./secureFileUploadService');

const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Secure Image Preprocessing Service
 * Uses ImageMagick commands through secure execution for image processing
 */
class SecureImagePreprocessingService {
  constructor() {
    this.tempDirectory = '/tmp/secure_uploads';
    this.allowedOperations = {
      resize: { maxValue: 4000, pattern: /^\d{1,4}x?\d{0,4}$/ },
      quality: { minValue: 1, maxValue: 100, pattern: /^\d{1,3}$/ },
      compress: { allowed: ['jpeg', 'png', 'lzw', 'zip'], pattern: /^(jpeg|png|lzw|zip)$/ },
      colorspace: { allowed: ['gray', 'rgb', 'cmyk'], pattern: /^(gray|rgb|cmyk)$/i },
      density: { maxValue: 600, pattern: /^\d{1,3}x?\d{0,3}$/ },
      blur: { maxValue: 10, pattern: /^\d(\.\d+)?x?\d?(\.\d+)?$/ },
      contrast: { minValue: -100, maxValue: 100, pattern: /^-?\d{1,3}$/ },
    };
  }

  /**
   * Preprocesses image securely for OCR accuracy improvement
   * @param {string} imageUri - Secure image URI
   * @param {Object} options - Preprocessing options
   * @returns {Promise<string>} URI of preprocessed image
   */
  async preprocessImageSecurely(imageUri, options = {}) {
    try {
      console.log('[SECURE PREPROCESSING] Starting secure image preprocessing');

      // Step 1: Validate input image path
      const validatedPath = secureFileUploadService.validatePathForOCR(imageUri);

      // Step 2: Verify image exists and is readable
      await this.validateImageFile(validatedPath);

      // Step 3: Apply secure preprocessing pipeline
      const processedPath = await this.applySecurePreprocessingPipeline(validatedPath, options);

      console.log('[SECURE PREPROCESSING] Image preprocessing completed successfully');
      return processedPath;
    } catch (error) {
      console.error('[SECURE PREPROCESSING] Error preprocessing image:', error);
      throw new SecurityError(
        `Secure image preprocessing failed: ${error.message}`,
        'PREPROCESSING_FAILED'
      );
    }
  }

  /**
   * Validates image file for processing
   * @param {string} imagePath - Path to image file
   */
  async validateImageFile(imagePath) {
    try {
      // Check file exists and get stats
      const stats = await fs.stat(imagePath);

      if (!stats.isFile()) {
        throw new SecurityError('Path is not a file', 'NOT_A_FILE');
      }

      if (stats.size === 0) {
        throw new SecurityError('Image file is empty', 'EMPTY_FILE');
      }

      if (stats.size > 50 * 1024 * 1024) {
        // 50MB limit
        throw new SecurityError('Image file too large', 'FILE_TOO_LARGE');
      }

      // Validate file format using ImageMagick identify
      await this.validateImageFormat(imagePath);
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(`Image validation failed: ${error.message}`, 'VALIDATION_FAILED');
    }
  }

  /**
   * Validates image format using secure identify command
   * @param {string} imagePath - Path to image file
   */
  async validateImageFormat(imagePath) {
    try {
      const result = await secureCommandService.executeSecureCommand(
        'identify',
        ['-ping', '-format', '%m %w %h', imagePath],
        { timeout: 10000 }
      );

      if (result.exitCode !== 0) {
        throw new CommandSecurityError(
          `Image format validation failed: ${result.stderr}`,
          'FORMAT_VALIDATION_FAILED'
        );
      }

      const formatInfo = result.stdout.trim();
      const [format, width, height] = formatInfo.split(' ');

      // Validate format
      const allowedFormats = ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WEBP'];
      if (!allowedFormats.includes(format.toUpperCase())) {
        throw new SecurityError(`Unsupported image format: ${format}`, 'UNSUPPORTED_FORMAT');
      }

      // Validate dimensions
      const w = parseInt(width);
      const h = parseInt(height);

      if (w > 10000 || h > 10000) {
        throw new SecurityError(`Image dimensions too large: ${w}x${h}`, 'DIMENSIONS_TOO_LARGE');
      }

      if (w < 10 || h < 10) {
        throw new SecurityError(`Image dimensions too small: ${w}x${h}`, 'DIMENSIONS_TOO_SMALL');
      }

      console.log(`[SECURE PREPROCESSING] Validated image: ${format} ${w}x${h}`);
    } catch (error) {
      if (error instanceof SecurityError || error instanceof CommandSecurityError) {
        throw error;
      }
      throw new SecurityError(
        `Format validation failed: ${error.message}`,
        'FORMAT_VALIDATION_ERROR'
      );
    }
  }

  /**
   * Applies secure preprocessing pipeline
   * @param {string} inputPath - Input image path
   * @param {Object} options - Preprocessing options
   * @returns {Promise<string>} Output image path
   */
  async applySecurePreprocessingPipeline(inputPath, options = {}) {
    const {
      convertToGrayscale = true,
      enhanceContrast = true,
      reduceNoise = true,
      optimizeForOCR = true,
    } = options;

    let currentPath = inputPath;
    const processedFiles = [];

    try {
      // Step 1: Convert to grayscale for better OCR
      if (convertToGrayscale) {
        currentPath = await this.secureConvertToGrayscale(currentPath);
        processedFiles.push(currentPath);
      }

      // Step 2: Enhance contrast
      if (enhanceContrast) {
        currentPath = await this.secureEnhanceContrast(currentPath);
        processedFiles.push(currentPath);
      }

      // Step 3: Reduce noise
      if (reduceNoise) {
        currentPath = await this.secureReduceNoise(currentPath);
        processedFiles.push(currentPath);
      }

      // Step 4: OCR-specific optimizations
      if (optimizeForOCR) {
        currentPath = await this.secureOptimizeForOCR(currentPath);
        processedFiles.push(currentPath);
      }

      return currentPath;
    } catch (error) {
      // Clean up any temporary files created during processing
      await this.cleanupProcessedFiles(processedFiles, inputPath);
      throw error;
    }
  }

  /**
   * Securely converts image to grayscale
   * @param {string} inputPath - Input image path
   * @returns {Promise<string>} Output image path
   */
  async secureConvertToGrayscale(inputPath) {
    try {
      const outputPath = await this.generateSecureOutputPath(inputPath, 'grayscale');

      const result = await secureCommandService.executeSecureCommand(
        'convert',
        [inputPath, '-colorspace', 'gray', '-quality', '95', outputPath],
        { timeout: 60000 }
      );

      if (result.exitCode !== 0) {
        throw new CommandSecurityError(
          `Grayscale conversion failed: ${result.stderr}`,
          'GRAYSCALE_FAILED'
        );
      }

      await this.validateOutputFile(outputPath);
      return outputPath;
    } catch (error) {
      throw new SecurityError(
        `Secure grayscale conversion failed: ${error.message}`,
        'GRAYSCALE_CONVERSION_FAILED'
      );
    }
  }

  /**
   * Securely enhances image contrast
   * @param {string} inputPath - Input image path
   * @returns {Promise<string>} Output image path
   */
  async secureEnhanceContrast(inputPath) {
    try {
      const outputPath = await this.generateSecureOutputPath(inputPath, 'contrast');

      const result = await secureCommandService.executeSecureCommand(
        'convert',
        [inputPath, '-contrast-stretch', '2%x1%', '-quality', '95', outputPath],
        { timeout: 60000 }
      );

      if (result.exitCode !== 0) {
        throw new CommandSecurityError(
          `Contrast enhancement failed: ${result.stderr}`,
          'CONTRAST_FAILED'
        );
      }

      await this.validateOutputFile(outputPath);
      return outputPath;
    } catch (error) {
      throw new SecurityError(
        `Secure contrast enhancement failed: ${error.message}`,
        'CONTRAST_ENHANCEMENT_FAILED'
      );
    }
  }

  /**
   * Securely reduces image noise
   * @param {string} inputPath - Input image path
   * @returns {Promise<string>} Output image path
   */
  async secureReduceNoise(inputPath) {
    try {
      const outputPath = await this.generateSecureOutputPath(inputPath, 'denoise');

      const result = await secureCommandService.executeSecureCommand(
        'convert',
        [inputPath, '-blur', '0x0.5', '-sharpen', '0x1', '-quality', '95', outputPath],
        { timeout: 60000 }
      );

      if (result.exitCode !== 0) {
        throw new CommandSecurityError(
          `Noise reduction failed: ${result.stderr}`,
          'DENOISE_FAILED'
        );
      }

      await this.validateOutputFile(outputPath);
      return outputPath;
    } catch (error) {
      throw new SecurityError(
        `Secure noise reduction failed: ${error.message}`,
        'NOISE_REDUCTION_FAILED'
      );
    }
  }

  /**
   * Securely optimizes image for OCR
   * @param {string} inputPath - Input image path
   * @returns {Promise<string>} Output image path
   */
  async secureOptimizeForOCR(inputPath) {
    try {
      const outputPath = await this.generateSecureOutputPath(inputPath, 'ocr');

      const result = await secureCommandService.executeSecureCommand(
        'convert',
        [
          inputPath,
          '-density',
          '300',
          '-resize',
          '200%',
          '-normalize',
          '-quality',
          '100',
          outputPath,
        ],
        { timeout: 120000 }
      );

      if (result.exitCode !== 0) {
        throw new CommandSecurityError(
          `OCR optimization failed: ${result.stderr}`,
          'OCR_OPTIMIZATION_FAILED'
        );
      }

      await this.validateOutputFile(outputPath);
      return outputPath;
    } catch (error) {
      throw new SecurityError(
        `Secure OCR optimization failed: ${error.message}`,
        'OCR_OPTIMIZATION_FAILED'
      );
    }
  }

  /**
   * Generates secure output path for processed image
   * @param {string} inputPath - Input image path
   * @param {string} suffix - Processing suffix
   * @returns {Promise<string>} Secure output path
   */
  async generateSecureOutputPath(inputPath, suffix) {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(inputPath);
    const filename = `processed_${suffix}_${timestamp}_${randomId}${extension}`;

    const outputPath = path.join(this.tempDirectory, filename);

    // Ensure path is within allowed directory
    const resolvedPath = path.resolve(outputPath);
    if (!resolvedPath.startsWith(path.resolve(this.tempDirectory))) {
      throw new SecurityError('Generated path outside allowed directory', 'INVALID_OUTPUT_PATH');
    }

    return resolvedPath;
  }

  /**
   * Validates output file after processing
   * @param {string} outputPath - Output file path
   */
  async validateOutputFile(outputPath) {
    try {
      const stats = await fs.stat(outputPath);

      if (!stats.isFile()) {
        throw new SecurityError('Output is not a file', 'INVALID_OUTPUT');
      }

      if (stats.size === 0) {
        throw new SecurityError('Output file is empty', 'EMPTY_OUTPUT');
      }

      // Quick format validation
      await this.validateImageFormat(outputPath);
    } catch (error) {
      // Clean up invalid output file
      try {
        await fs.unlink(outputPath);
      } catch (unlinkError) {
        console.warn(
          '[SECURE PREPROCESSING] Could not clean up invalid output:',
          unlinkError.message
        );
      }

      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(
        `Output validation failed: ${error.message}`,
        'OUTPUT_VALIDATION_FAILED'
      );
    }
  }

  /**
   * Cleans up processed files in case of error
   * @param {Array<string>} processedFiles - List of processed file paths
   * @param {string} originalPath - Original input path (preserve this)
   */
  async cleanupProcessedFiles(processedFiles, originalPath) {
    for (const filePath of processedFiles) {
      if (filePath !== originalPath) {
        try {
          await secureFileUploadService.secureFileCleanup(filePath);
        } catch (error) {
          console.warn(
            '[SECURE PREPROCESSING] Warning: Could not clean up processed file:',
            error.message
          );
        }
      }
    }
  }

  /**
   * Validates preprocessing operation parameters
   * @param {string} operation - Operation name
   * @param {*} value - Operation value
   * @returns {boolean} True if valid
   */
  validateOperationParameter(operation, value) {
    const config = this.allowedOperations[operation];
    if (!config) {
      return false;
    }

    if (config.pattern && !config.pattern.test(String(value))) {
      return false;
    }

    if (config.allowed && !config.allowed.includes(value)) {
      return false;
    }

    if (config.minValue !== undefined || config.maxValue !== undefined) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return false;
      }

      if (config.minValue !== undefined && numValue < config.minValue) {
        return false;
      }

      if (config.maxValue !== undefined && numValue > config.maxValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets allowed operations and their constraints
   * @returns {Object} Allowed operations configuration
   */
  getAllowedOperations() {
    return { ...this.allowedOperations };
  }

  /**
   * Enhanced bet slip preprocessing (specialized for bet slip images)
   * @param {string} imageUri - Image URI
   * @returns {Promise<string>} Processed image URI
   */
  async enhanceForBetSlipSecurely(imageUri) {
    try {
      const validatedPath = secureFileUploadService.validatePathForOCR(imageUri);

      // Apply bet slip specific preprocessing
      const processedPath = await this.applySecurePreprocessingPipeline(validatedPath, {
        convertToGrayscale: true,
        enhanceContrast: true,
        reduceNoise: true,
        optimizeForOCR: true,
      });

      return processedPath;
    } catch (error) {
      console.error('[SECURE PREPROCESSING] Bet slip enhancement failed:', error);
      throw new SecurityError(
        `Secure bet slip enhancement failed: ${error.message}`,
        'BET_SLIP_ENHANCEMENT_FAILED'
      );
    }
  }
}

// Export singleton instance
const secureImagePreprocessingService = new SecureImagePreprocessingService();

module.exports = {
  SecureImagePreprocessingService,
  secureImagePreprocessingService,
};
