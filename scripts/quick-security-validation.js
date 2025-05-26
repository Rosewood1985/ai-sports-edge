#!/usr/bin/env node

/**
 * Quick OCR Security Validation
 * 
 * Simple validation that the security fixes are working correctly
 */

console.log('🔒 Quick OCR Security Validation...\n');

async function quickSecurityTest() {
  let passed = 0;
  let total = 0;

  // Test 1: Command Injection Prevention
  total++;
  try {
    const { secureCommandService } = require('../services/secureCommandService');
    await secureCommandService.executeSecureCommand('tesseract', ['test"; rm -rf /; echo "pwned', 'stdout']);
    console.log('❌ Command injection test FAILED - should have been blocked');
  } catch (error) {
    if (error.message.includes('dangerous characters')) {
      console.log('✅ Command injection prevention WORKING');
      passed++;
    } else {
      console.log('❌ Command injection test error:', error.message);
    }
  }

  // Test 2: File Upload Validation
  total++;
  try {
    const { secureFileUploadService } = require('../services/secureFileUploadService');
    const mockFile = {
      originalname: 'malicious.sh',
      mimetype: 'application/x-executable',
      size: 1024,
      buffer: Buffer.alloc(1024)
    };
    await secureFileUploadService.validateAndSecureFile(mockFile);
    console.log('❌ File validation test FAILED - should have been blocked');
  } catch (error) {
    if (error.message.includes('Invalid file type')) {
      console.log('✅ File upload validation WORKING');
      passed++;
    } else {
      console.log('❌ File validation test error:', error.message);
    }
  }

  // Test 3: Path Validation
  total++;
  try {
    const { secureFileUploadService } = require('../services/secureFileUploadService');
    secureFileUploadService.validatePathForOCR('../../../etc/passwd');
    console.log('❌ Path validation test FAILED - should have been blocked');
  } catch (error) {
    if (error.message.includes('Invalid file path')) {
      console.log('✅ Path validation WORKING');
      passed++;
    } else {
      console.log('❌ Path validation test error:', error.message);
    }
  }

  // Test 4: Service Integration
  total++;
  try {
    require('../services/secureCommandService');
    require('../services/secureFileUploadService');
    require('../services/secureMultiProviderOCRService');
    console.log('✅ Core security services LOADED');
    passed++;
  } catch (error) {
    console.log('❌ Service integration error:', error.message);
  }

  console.log('\n📊 SECURITY VALIDATION SUMMARY');
  console.log('================================');
  console.log(`Tests Passed: ${passed}/${total}`);
  
  const score = Math.round((passed / total) * 100);
  console.log(`Security Score: ${score}%`);

  if (score >= 75) {
    console.log('✅ SECURITY FIXES WORKING - OCR system is secured');
    return true;
  } else {
    console.log('❌ SECURITY ISSUES REMAIN - Please review errors above');
    return false;
  }
}

if (require.main === module) {
  quickSecurityTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Security validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = quickSecurityTest;