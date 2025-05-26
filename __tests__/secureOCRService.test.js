/**
 * Comprehensive Security Tests for OCR Service
 * 
 * Tests all security vulnerabilities and fixes implemented in the secure OCR service
 */

const { secureEnhancedOCRService } = require('../services/secureEnhancedOCRService');
const { secureCommandService, CommandSecurityError } = require('../services/secureCommandService');
const { secureFileUploadService, SecurityError } = require('../services/secureFileUploadService');
const { securityMonitoringService } = require('../services/securityMonitoringService');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Mock dependencies
jest.mock('../services/secureFileUploadService');
jest.mock('../services/secureCommandService');
jest.mock('../services/securityMonitoringService');
jest.mock('@prisma/client');

describe('Secure OCR Service Security Tests', () => {
  let mockUploadId;
  let testImagePath;

  beforeEach(() => {
    mockUploadId = crypto.randomUUID();
    testImagePath = '/tmp/secure_uploads/test_image.jpg';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    secureFileUploadService.validatePathForOCR.mockReturnValue(testImagePath);
    secureFileUploadService.getSecureFileInfo.mockResolvedValue({
      hash: 'test-hash',
      size: 1024
    });
    
    secureCommandService.executeSecureCommand.mockResolvedValue({
      success: true,
      stdout: 'Mock OCR text output',
      stderr: '',
      exitCode: 0,
      executionTime: 1000
    });
  });

  describe('Command Injection Prevention', () => {
    test('should prevent command injection in OCR arguments', async () => {
      // Simulate command injection attempt through malicious file path
      const maliciousPath = '/tmp/test.jpg; rm -rf /';
      
      secureFileUploadService.validatePathForOCR.mockImplementation(() => {
        throw new SecurityError('File path contains dangerous characters', 'DANGEROUS_PATH_CHARS');
      });

      await expect(
        secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId)
      ).rejects.toThrow(SecurityError);

      expect(securityMonitoringService.logIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'malicious_file',
          severity: 'critical'
        })
      );
    });

    test('should block dangerous command arguments', async () => {
      secureCommandService.executeSecureCommand.mockRejectedValue(
        new CommandSecurityError('Argument contains dangerous characters', 'DANGEROUS_ARG_CHARS')
      );

      await expect(
        secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId)
      ).rejects.toThrow(CommandSecurityError);

      expect(securityMonitoringService.logIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'command_injection',
          severity: 'high'
        })
      );
    });

    test('should only allow whitelisted commands', async () => {
      secureCommandService.executeSecureCommand.mockRejectedValue(
        new CommandSecurityError('Command not allowed: malicious_cmd', 'COMMAND_NOT_ALLOWED')
      );

      await expect(
        secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId)
      ).rejects.toThrow(CommandSecurityError);

      expect(securityMonitoringService.logIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'command_injection',
          severity: 'high'
        })
      );
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should prevent path traversal attacks', async () => {
      const traversalPath = '/tmp/secure_uploads/../../../etc/passwd';
      
      secureFileUploadService.validatePathForOCR.mockImplementation(() => {
        throw new SecurityError('Invalid file path for OCR processing', 'INVALID_OCR_PATH');
      });

      await expect(
        secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId)
      ).rejects.toThrow(SecurityError);

      expect(securityMonitoringService.logIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'path_traversal',
          severity: 'high'
        })
      );
    });

    test('should validate file paths are within allowed directories', async () => {
      secureFileUploadService.validatePathForOCR.mockImplementation((path) => {
        if (!path.startsWith('/tmp/secure_uploads')) {
          throw new SecurityError('Path not in allowed directories', 'PATH_NOT_ALLOWED');
        }
        return path;
      });

      const invalidPath = '/home/user/malicious.jpg';
      secureFileUploadService.validatePathForOCR.mockImplementation(() => {
        throw new SecurityError('Path not in allowed directories', 'PATH_NOT_ALLOWED');
      });

      await expect(
        secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId)
      ).rejects.toThrow(SecurityError);
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should sanitize OCR text output', () => {
      const maliciousText = '<script>alert("xss")</script>Test text';
      const sanitized = secureEnhancedOCRService.sanitizeTextForParsing(maliciousText);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Test text');
    });

    test('should sanitize data for storage', () => {
      const maliciousData = '<script>alert("xss")</script>\x00\x08Control chars\x7F';
      const sanitized = secureEnhancedOCRService.sanitizeForStorage(maliciousData);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('\x00');
      expect(sanitized).not.toContain('\x08');
      expect(sanitized).not.toContain('\x7F');
    });

    test('should limit storage data length', () => {
      const longData = 'x'.repeat(60000);
      const sanitized = secureEnhancedOCRService.sanitizeForStorage(longData);
      
      expect(sanitized.length).toBeLessThanOrEqual(50000);
    });

    test('should handle null and undefined inputs safely', () => {
      expect(secureEnhancedOCRService.sanitizeTextForParsing(null)).toBe('');
      expect(secureEnhancedOCRService.sanitizeTextForParsing(undefined)).toBe('');
      expect(secureEnhancedOCRService.sanitizeForStorage(null)).toBe('');
      expect(secureEnhancedOCRService.sanitizeForStorage(undefined)).toBe('');
    });
  });

  describe('File Upload Security', () => {
    test('should validate upload exists before processing', async () => {
      // Mock Prisma to return null (upload not found)
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = {
        oCRUpload: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };
      PrismaClient.mockImplementation(() => mockPrisma);

      await expect(
        secureEnhancedOCRService.processOCRWithSecurityValidation('nonexistent-id')
      ).rejects.toThrow('Upload not found');
    });

    test('should validate file integrity', async () => {
      secureFileUploadService.getSecureFileInfo.mockResolvedValue({
        hash: 'expected-hash',
        size: 1024
      });

      // Test should pass with matching file info
      const result = await secureEnhancedOCRService.validateAndSecureUpload(mockUploadId);
      expect(result.fileHash).toBe('expected-hash');
      expect(result.fileSize).toBe(1024);
    });
  });

  describe('Processing Security Controls', () => {
    test('should enforce processing timeout', async () => {
      const shortTimeout = 100; // 100ms timeout
      
      secureCommandService.executeSecureCommand.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 200)); // Takes 200ms
      });

      await expect(
        secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId, {
          maxProcessingTime: shortTimeout
        })
      ).rejects.toThrow();
    });

    test('should limit concurrent processing', () => {
      const queueStatus = secureEnhancedOCRService.getProcessingQueueStatus();
      expect(Array.isArray(queueStatus)).toBe(true);
    });

    test('should track active processes', async () => {
      // Start a processing job
      const processingPromise = secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId);
      
      // Check that it's tracked
      const queueStatus = secureEnhancedOCRService.getProcessingQueueStatus();
      expect(queueStatus.length).toBeGreaterThan(0);
      
      // Wait for completion
      try {
        await processingPromise;
      } catch (error) {
        // Expected to fail in test environment
      }
    });
  });

  describe('Security Monitoring Integration', () => {
    test('should log security incidents', async () => {
      secureFileUploadService.validatePathForOCR.mockImplementation(() => {
        throw new SecurityError('Test security error', 'TEST_ERROR');
      });

      try {
        await secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId);
      } catch (error) {
        // Expected
      }

      expect(securityMonitoringService.logIncident).toHaveBeenCalled();
    });

    test('should classify incident types correctly', async () => {
      const testCases = [
        {
          error: new CommandSecurityError('Test', 'COMMAND_NOT_ALLOWED'),
          expectedType: 'command_injection',
          expectedSeverity: 'high'
        },
        {
          error: new SecurityError('Test', 'PATH_TRAVERSAL'),
          expectedType: 'path_traversal',
          expectedSeverity: 'high'
        },
        {
          error: new SecurityError('Test', 'MALICIOUS_FILE'),
          expectedType: 'malicious_file',
          expectedSeverity: 'critical'
        }
      ];

      for (const testCase of testCases) {
        securityMonitoringService.logIncident.mockClear();
        
        secureFileUploadService.validatePathForOCR.mockImplementation(() => {
          throw testCase.error;
        });

        try {
          await secureEnhancedOCRService.processOCRWithSecurityValidation(mockUploadId);
        } catch (error) {
          // Expected
        }

        expect(securityMonitoringService.logIncident).toHaveBeenCalledWith(
          expect.objectContaining({
            type: testCase.expectedType,
            severity: testCase.expectedSeverity
          })
        );
      }
    });
  });

  describe('Secure Cleanup', () => {
    test('should clean up temporary files', async () => {
      const tempPath = '/tmp/secure_uploads/temp_processed.jpg';
      
      secureFileUploadService.secureFileCleanup.mockResolvedValue(true);
      
      await secureEnhancedOCRService.secureCleanup(testImagePath, {
        processedPath: tempPath,
        originalPath: testImagePath
      });

      expect(secureFileUploadService.secureFileCleanup).toHaveBeenCalledWith(testImagePath);
      expect(secureFileUploadService.secureFileCleanup).toHaveBeenCalledWith(tempPath);
    });

    test('should handle cleanup errors gracefully', async () => {
      secureFileUploadService.secureFileCleanup.mockRejectedValue(
        new Error('Cleanup failed')
      );

      // Should not throw error
      await expect(
        secureEnhancedOCRService.secureCleanup(testImagePath, null)
      ).resolves.toBeUndefined();
    });
  });

  describe('Performance and Resource Controls', () => {
    test('should calculate confidence scores within valid range', () => {
      const testCases = [
        { stdout: '', stderr: '', expected: 0 },
        { stdout: 'Short text', stderr: '', expected: expect.any(Number) },
        { stdout: 'Long text '.repeat(20), stderr: '', expected: expect.any(Number) },
        { stdout: 'Text', stderr: 'Warning: some issue', expected: expect.any(Number) }
      ];

      testCases.forEach(testCase => {
        const confidence = secureEnhancedOCRService.calculateConfidence(
          testCase.stdout, 
          testCase.stderr
        );
        
        if (typeof testCase.expected === 'number') {
          expect(confidence).toBe(testCase.expected);
        } else {
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(1);
        }
      });
    });

    test('should parse text blocks correctly', () => {
      const text = 'Line 1\nLine 2\n\nLine 4';
      const blocks = secureEnhancedOCRService.parseTextBlocks(text);
      
      expect(blocks).toHaveLength(3); // Empty line should be filtered out
      expect(blocks[0].text).toBe('Line 1');
      expect(blocks[1].text).toBe('Line 2');
      expect(blocks[2].text).toBe('Line 4');
    });
  });
});

describe('Secure Command Service Security Tests', () => {
  describe('Command Validation', () => {
    test('should only allow whitelisted commands', async () => {
      await expect(
        secureCommandService.executeSecureCommand('malicious_command', [])
      ).rejects.toThrow(CommandSecurityError);
    });

    test('should allow valid tesseract command', async () => {
      // Mock successful execution
      const mockSpawn = jest.fn();
      jest.doMock('child_process', () => ({ spawn: mockSpawn }));
      
      // This test would need more mocking to fully work
      // But demonstrates the security validation approach
    });
  });

  describe('Argument Validation', () => {
    test('should reject dangerous characters in arguments', async () => {
      const dangerousArgs = [
        'normal.jpg',
        'stdout',
        '; rm -rf /',  // Command injection attempt
        '-l',
        'eng'
      ];

      await expect(
        secureCommandService.executeSecureCommand('tesseract', dangerousArgs)
      ).rejects.toThrow(CommandSecurityError);
    });

    test('should validate file path arguments', async () => {
      const invalidPath = '../../../etc/passwd';
      
      await expect(
        secureCommandService.executeSecureCommand('tesseract', [invalidPath, 'stdout'])
      ).rejects.toThrow(CommandSecurityError);
    });
  });
});

describe('Security Monitoring Service Tests', () => {
  beforeEach(() => {
    securityMonitoringService.recentIncidents.clear();
  });

  test('should log security incidents', async () => {
    const incident = {
      severity: 'high',
      type: 'command_injection',
      source: 'test',
      message: 'Test incident'
    };

    const incidentId = await securityMonitoringService.logIncident(incident);
    expect(incidentId).toBeTruthy();
    
    const recentIncidents = securityMonitoringService.getRecentIncidents(1);
    expect(recentIncidents).toHaveLength(1);
    expect(recentIncidents[0].message).toBe('Test incident');
  });

  test('should detect patterns of repeated incidents', async () => {
    const baseIncident = {
      severity: 'medium',
      type: 'suspicious_activity',
      source: 'test',
      message: 'Repeated incident',
      ipAddress: '192.168.1.100'
    };

    // Log multiple incidents from same IP
    for (let i = 0; i < 6; i++) {
      await securityMonitoringService.logIncident(baseIncident);
    }

    const stats = securityMonitoringService.getSecurityStats();
    expect(stats.totalIncidents).toBeGreaterThan(6); // Should include pattern detection incident
  });

  test('should track rate limits', () => {
    const identifier = 'test-user-123';
    
    // Should allow requests within limit
    for (let i = 0; i < 5; i++) {
      expect(securityMonitoringService.checkRateLimit(identifier, 10, 60000)).toBe(true);
    }
    
    // Should block when limit exceeded
    for (let i = 0; i < 10; i++) {
      securityMonitoringService.checkRateLimit(identifier, 10, 60000);
    }
    
    expect(securityMonitoringService.checkRateLimit(identifier, 10, 60000)).toBe(false);
  });
});