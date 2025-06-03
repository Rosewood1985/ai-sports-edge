/**
 * Secure Enhanced OCR Service
 *
 * SECURITY-HARDENED VERSION of the OCR service that addresses critical vulnerabilities:
 * - Command injection prevention through secure command execution
 * - File path validation and sanitization
 * - Comprehensive input validation
 * - Secure file handling with proper cleanup
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

const { secureCommandService, CommandSecurityError } = require('./secureCommandService');
const { secureFileUploadService, SecurityError } = require('./secureFileUploadService');
const {
  securityMonitoringService,
  SEVERITY_LEVELS,
  INCIDENT_TYPES,
} = require('./securityMonitoringService');

const fs = require('fs').promises;
const crypto = require('crypto');

// Import existing services (to be updated with security fixes)
const { secureImagePreprocessingService } = require('./secureImagePreprocessingService');
const IntelligentBetSlipParser = require('./intelligentBetSlipParser');

const prisma = new PrismaClient();

/**
 * Secure Enhanced OCR Service
 * Replaces the vulnerable enhancedOCRService.js with security-hardened implementation
 */
class SecureEnhancedOCRService {
  constructor() {
    this.imagePreprocessor = secureImagePreprocessingService;
    this.intelligentParser = new IntelligentBetSlipParser();
    this.activeProcesses = new Map();
    this.processingQueue = new Map();
  }

  /**
   * Processes OCR with comprehensive security validation
   * @param {string} uploadId - Upload ID from database
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processOCRWithSecurityValidation(uploadId, options = {}) {
    const {
      usePreprocessing = true,
      useMultiProvider = true,
      useIntelligentParsing = true,
      providers = ['tesseract'], // Only use local tesseract for security
      preprocessingOptions = {},
      maxProcessingTime = 300000, // 5 minutes max
    } = options;

    const processingId = crypto.randomUUID();

    try {
      console.log(`[SECURE OCR] Starting secure OCR processing for upload ${uploadId}`);

      // Step 1: Validate upload and get secure file path
      const secureUpload = await this.validateAndSecureUpload(uploadId);

      // Step 2: Add to processing queue with timeout
      this.addToProcessingQueue(processingId, uploadId, maxProcessingTime);

      // Step 3: Update status with security context
      await this.updateUploadStatus(uploadId, 'processing', {
        processingId,
        securityValidated: true,
        startTime: new Date().toISOString(),
      });

      let imagePath = secureUpload.securePath;
      let preprocessingResult = null;

      // Step 4: Secure image preprocessing
      if (usePreprocessing) {
        console.log(`[SECURE OCR] Preprocessing image with security validation`);
        preprocessingResult = await this.secureImagePreprocessing(imagePath, preprocessingOptions);
        imagePath = preprocessingResult.processedPath;
      }

      // Step 5: Secure OCR processing
      console.log(`[SECURE OCR] Running secure OCR with Tesseract`);
      const ocrResult = await this.secureOCRProcessing(imagePath, providers);

      // Step 6: Secure intelligent parsing
      let parsedResult = null;
      if (useIntelligentParsing && ocrResult.fullText) {
        console.log(`[SECURE OCR] Running secure intelligent parsing`);
        parsedResult = await this.secureIntelligentParsing(ocrResult);
      }

      // Step 7: Secure result storage
      const finalResult = await this.secureResultStorage(uploadId, {
        ocrResult,
        parsedResult,
        preprocessingResult,
        securityContext: {
          processingId,
          securityValidated: true,
          fileHash: secureUpload.fileHash,
          processingTime: Date.now() - secureUpload.processingStartTime,
        },
      });

      // Step 8: Secure cleanup
      await this.secureCleanup(imagePath, preprocessingResult);

      console.log(`[SECURE OCR] Processing completed successfully for upload ${uploadId}`);
      return finalResult;
    } catch (error) {
      console.error(`[SECURE OCR] Processing failed for upload ${uploadId}:`, error);

      // Update status with error
      await this.updateUploadStatus(uploadId, 'failed', {
        error: error.message,
        errorCode: error.code || 'PROCESSING_FAILED',
        processingId,
      });

      // Security incident logging
      if (error instanceof SecurityError || error instanceof CommandSecurityError) {
        await this.logSecurityIncident(uploadId, error, processingId);
      }

      throw error;
    } finally {
      // Remove from processing queue
      this.processingQueue.delete(processingId);
    }
  }

  /**
   * Validates upload and ensures secure file handling
   * @param {string} uploadId - Upload ID
   * @returns {Promise<Object>} Validated upload information
   */
  async validateAndSecureUpload(uploadId) {
    try {
      const upload = await prisma.oCRUpload.findUnique({
        where: { id: uploadId },
      });

      if (!upload) {
        throw new SecurityError('Upload not found', 'UPLOAD_NOT_FOUND');
      }

      if (!upload.uploadPath) {
        throw new SecurityError('Upload path not available', 'NO_UPLOAD_PATH');
      }

      // Validate file path security
      const securePath = secureFileUploadService.validatePathForOCR(upload.uploadPath);

      // Get secure file information
      const fileInfo = await secureFileUploadService.getSecureFileInfo(securePath);

      return {
        uploadId,
        securePath,
        fileHash: fileInfo.hash,
        fileSize: fileInfo.size,
        processingStartTime: Date.now(),
        originalUpload: upload,
      };
    } catch (error) {
      throw new SecurityError(
        `Upload validation failed: ${error.message}`,
        'UPLOAD_VALIDATION_FAILED'
      );
    }
  }

  /**
   * Secure image preprocessing with validation
   * @param {string} imagePath - Secure image path
   * @param {Object} options - Preprocessing options
   * @returns {Promise<Object>} Preprocessing result
   */
  async secureImagePreprocessing(imagePath, options) {
    try {
      // Validate image path before processing
      const validatedPath = secureFileUploadService.validatePathForOCR(imagePath);

      // Use secure preprocessing service
      const result = await this.imagePreprocessor.preprocessImageSecurely(validatedPath, options);

      // Validate result path
      if (result && result !== validatedPath) {
        const processedPath = secureFileUploadService.validatePathForOCR(result);
        return {
          processedPath,
          originalPath: validatedPath,
          preprocessingApplied: true,
        };
      }

      return {
        processedPath: validatedPath,
        originalPath: validatedPath,
        preprocessingApplied: false,
      };
    } catch (error) {
      throw new SecurityError(
        `Secure preprocessing failed: ${error.message}`,
        'PREPROCESSING_FAILED'
      );
    }
  }

  /**
   * Secure OCR processing using validated commands
   * @param {string} imagePath - Secure image path
   * @param {Array<string>} providers - OCR providers (only tesseract supported)
   * @returns {Promise<Object>} OCR result
   */
  async secureOCRProcessing(imagePath, providers = ['tesseract']) {
    try {
      // Validate image path
      const validatedPath = secureFileUploadService.validatePathForOCR(imagePath);

      // Only allow tesseract for security
      if (!providers.includes('tesseract')) {
        providers = ['tesseract'];
      }

      console.log(`[SECURE OCR] Processing with Tesseract: ${path.basename(validatedPath)}`);

      // Execute secure Tesseract command
      const result = await secureCommandService.executeSecureCommand(
        'tesseract',
        [validatedPath, 'stdout', '-l', 'eng'],
        {
          timeout: 60000, // 60 seconds
          cwd: path.dirname(validatedPath),
        }
      );

      if (result.exitCode !== 0) {
        throw new CommandSecurityError(
          `Tesseract failed with exit code ${result.exitCode}: ${result.stderr}`,
          'TESSERACT_FAILED'
        );
      }

      return {
        fullText: result.stdout,
        confidence: this.calculateConfidence(result.stdout, result.stderr),
        provider: 'tesseract',
        executionTime: result.executionTime,
        textBlocks: this.parseTextBlocks(result.stdout),
        securityValidated: true,
      };
    } catch (error) {
      throw new CommandSecurityError(
        `Secure OCR processing failed: ${error.message}`,
        'OCR_PROCESSING_FAILED'
      );
    }
  }

  /**
   * Secure intelligent parsing with validation
   * @param {Object} ocrResult - OCR result to parse
   * @returns {Promise<Object>} Parsed result
   */
  async secureIntelligentParsing(ocrResult) {
    try {
      // Validate OCR result
      if (!ocrResult || !ocrResult.fullText) {
        throw new SecurityError('Invalid OCR result for parsing', 'INVALID_OCR_RESULT');
      }

      // Sanitize text before parsing
      const sanitizedText = this.sanitizeTextForParsing(ocrResult.fullText);

      // Use intelligent parser with sanitized input
      const parsedResult = await this.intelligentParser.parseExtractedText(
        {
          fullText: sanitizedText,
          textBlocks: ocrResult.textBlocks || [],
          confidence: ocrResult.confidence || 0.5,
        },
        {
          useContextualAnalysis: true,
          validateConsistency: true,
          enhanceWithMLModel: false, // Disable ML for security
        }
      );

      return {
        ...parsedResult,
        securityValidated: true,
        textSanitized: true,
      };
    } catch (error) {
      throw new SecurityError(`Secure parsing failed: ${error.message}`, 'PARSING_FAILED');
    }
  }

  /**
   * Secure result storage with validation
   * @param {string} uploadId - Upload ID
   * @param {Object} results - Processing results
   * @returns {Promise<Object>} Storage result
   */
  async secureResultStorage(uploadId, results) {
    try {
      const { ocrResult, parsedResult, preprocessingResult, securityContext } = results;

      // Sanitize results before storage
      const sanitizedResults = {
        ocrText: this.sanitizeForStorage(ocrResult.fullText),
        confidence: Math.max(0, Math.min(1, ocrResult.confidence || 0)),
        provider: 'tesseract',
        processingTime: securityContext.processingTime,
        parsedData: parsedResult ? this.sanitizeForStorage(JSON.stringify(parsedResult)) : null,
        securityContext: {
          processingId: securityContext.processingId,
          fileHash: securityContext.fileHash,
          securityValidated: true,
          processingTimestamp: new Date().toISOString(),
        },
      };

      // Update database with sanitized results
      const updatedUpload = await prisma.oCRUpload.update({
        where: { id: uploadId },
        data: {
          status: 'completed',
          ocrText: sanitizedResults.ocrText,
          confidence: sanitizedResults.confidence,
          processingTime: sanitizedResults.processingTime,
          metadata: sanitizedResults,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        uploadId,
        results: sanitizedResults,
        upload: updatedUpload,
      };
    } catch (error) {
      throw new SecurityError(`Secure storage failed: ${error.message}`, 'STORAGE_FAILED');
    }
  }

  /**
   * Secure cleanup of temporary files
   * @param {string} imagePath - Image path to clean
   * @param {Object} preprocessingResult - Preprocessing result
   */
  async secureCleanup(imagePath, preprocessingResult) {
    try {
      const filesToClean = [imagePath];

      if (preprocessingResult && preprocessingResult.processedPath !== imagePath) {
        filesToClean.push(preprocessingResult.processedPath);
      }

      for (const filePath of filesToClean) {
        try {
          await secureFileUploadService.secureFileCleanup(filePath);
        } catch (error) {
          console.warn(`[SECURE OCR] Warning: Could not clean up file ${filePath}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`[SECURE OCR] Cleanup error:`, error);
      // Don't throw cleanup errors
    }
  }

  /**
   * Adds processing to queue with timeout
   * @param {string} processingId - Processing ID
   * @param {string} uploadId - Upload ID
   * @param {number} maxTime - Maximum processing time
   */
  addToProcessingQueue(processingId, uploadId, maxTime) {
    const startTime = Date.now();
    const timeoutId = setTimeout(() => {
      this.handleProcessingTimeout(processingId, uploadId);
    }, maxTime);

    this.processingQueue.set(processingId, {
      uploadId,
      startTime,
      timeoutId,
      maxTime,
    });
  }

  /**
   * Handles processing timeout
   * @param {string} processingId - Processing ID
   * @param {string} uploadId - Upload ID
   */
  async handleProcessingTimeout(processingId, uploadId) {
    try {
      console.error(`[SECURE OCR] Processing timeout for upload ${uploadId}`);

      await this.updateUploadStatus(uploadId, 'failed', {
        error: 'Processing timeout',
        errorCode: 'PROCESSING_TIMEOUT',
        processingId,
      });

      // Clean up
      this.processingQueue.delete(processingId);
    } catch (error) {
      console.error(`[SECURE OCR] Error handling timeout:`, error);
    }
  }

  /**
   * Updates upload status securely
   * @param {string} uploadId - Upload ID
   * @param {string} status - New status
   * @param {Object} metadata - Additional metadata
   */
  async updateUploadStatus(uploadId, status, metadata = {}) {
    try {
      await prisma.oCRUpload.update({
        where: { id: uploadId },
        data: {
          status,
          metadata: {
            ...metadata,
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error(`[SECURE OCR] Failed to update status:`, error);
    }
  }

  /**
   * Logs security incident
   * @param {string} uploadId - Upload ID
   * @param {Error} error - Security error
   * @param {string} processingId - Processing ID
   */
  async logSecurityIncident(uploadId, error, processingId) {
    try {
      // Determine incident type based on error
      let incidentType = INCIDENT_TYPES.OCR_SECURITY_VIOLATION;
      let severity = SEVERITY_LEVELS.MEDIUM;

      if (error instanceof CommandSecurityError) {
        if (error.code === 'COMMAND_NOT_ALLOWED' || error.code === 'DANGEROUS_ARG_CHARS') {
          incidentType = INCIDENT_TYPES.COMMAND_INJECTION;
          severity = SEVERITY_LEVELS.HIGH;
        }
      } else if (error instanceof SecurityError) {
        if (error.code === 'INVALID_OCR_PATH' || error.code === 'PATH_TRAVERSAL') {
          incidentType = INCIDENT_TYPES.PATH_TRAVERSAL;
          severity = SEVERITY_LEVELS.HIGH;
        } else if (error.code === 'MALICIOUS_FILE' || error.code === 'DANGEROUS_PATH_CHARS') {
          incidentType = INCIDENT_TYPES.MALICIOUS_FILE;
          severity = SEVERITY_LEVELS.CRITICAL;
        }
      }

      // Log incident with security monitoring service
      await securityMonitoringService.logIncident({
        severity,
        type: incidentType,
        source: 'secure_ocr_service',
        message: `OCR security violation: ${error.message}`,
        details: {
          uploadId,
          processingId,
          errorCode: error.code,
          errorType: error.constructor.name,
          stackTrace: error.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
        },
        uploadId,
        processingId,
        errorCode: error.code,
      });
    } catch (logError) {
      console.error(`[SECURE OCR] Failed to log security incident:`, logError);
    }
  }

  /**
   * Sanitizes text for parsing
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeTextForParsing(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove potential script injection attempts
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }

  /**
   * Sanitizes data for storage
   * @param {string} data - Data to sanitize
   * @returns {string} Sanitized data
   */
  sanitizeForStorage(data) {
    if (!data || typeof data !== 'string') {
      return '';
    }

    return data
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[<>]/g, '') // Remove HTML tags
      .trim()
      .substring(0, 50000); // Limit length
  }

  /**
   * Calculates confidence score
   * @param {string} stdout - OCR output
   * @param {string} stderr - OCR errors
   * @returns {number} Confidence score
   */
  calculateConfidence(stdout, stderr) {
    if (!stdout || stdout.trim().length === 0) {
      return 0;
    }

    // Basic confidence calculation
    let confidence = 0.5;

    if (stderr && stderr.includes('Warning')) {
      confidence -= 0.1;
    }

    if (stdout.length > 50) {
      confidence += 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Parses text into blocks
   * @param {string} text - Text to parse
   * @returns {Array<Object>} Text blocks
   */
  parseTextBlocks(text) {
    if (!text) return [];

    return text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, index) => ({
        text: line.trim(),
        confidence: 0.8,
        boundingBox: null,
        blockIndex: index,
      }));
  }

  /**
   * Gets processing queue status
   * @returns {Array<Object>} Queue status
   */
  getProcessingQueueStatus() {
    const status = [];
    this.processingQueue.forEach((info, processingId) => {
      status.push({
        processingId,
        uploadId: info.uploadId,
        startTime: info.startTime,
        elapsed: Date.now() - info.startTime,
        maxTime: info.maxTime,
      });
    });
    return status;
  }
}

// Export singleton instance
const secureEnhancedOCRService = new SecureEnhancedOCRService();

module.exports = {
  SecureEnhancedOCRService,
  secureEnhancedOCRService,
};
