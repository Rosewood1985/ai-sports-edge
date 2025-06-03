/**
 * Sentry Cloud Functions Integration Verification Script
 * 
 * This script verifies that Sentry is properly integrated with all Cloud Functions
 * and provides a comprehensive test of error tracking, performance monitoring,
 * and racing-specific functionality.
 */

const admin = require("firebase-admin");
const { spawn } = require("child_process");
const fs = require("fs");

// Initialize Firebase Admin (if not already initialized)
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized
}

/**
 * Check if all required Sentry files exist
 */
function checkSentryFiles() {
  console.log("🔍 Checking Sentry integration files...\n");
  
  const requiredFiles = [
    "sentryConfig.js",
    "sentryTest.js",
    "sentry-source-maps.js",
    ".sentryclirc",
    "upload-sourcemaps.sh",
    "SENTRY_SOURCE_MAPS.md"
  ];

  const results = [];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? "✅" : "❌"} ${file}`);
    results.push({ file, exists });
  });
  
  const allExist = results.every(r => r.exists);
  console.log(`\nFiles check: ${allExist ? "✅ PASSED" : "❌ FAILED"}\n`);
  
  return allExist;
}

/**
 * Verify package.json has been updated with Sentry dependencies and scripts
 */
function checkPackageJson() {
  console.log("📦 Checking package.json updates...\n");
  
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  
  const checks = [
    {
      name: "@sentry/google-cloud-serverless dependency",
      check: () => packageJson.dependencies && packageJson.dependencies["@sentry/google-cloud-serverless"]
    },
    {
      name: "@sentry/cli dev dependency",
      check: () => packageJson.devDependencies && packageJson.devDependencies["@sentry/cli"]
    },
    {
      name: "sentry:sourcemaps script",
      check: () => packageJson.scripts && packageJson.scripts["sentry:sourcemaps"]
    },
    {
      name: "build:sentry script",
      check: () => packageJson.scripts && packageJson.scripts["build:sentry"]
    },
    {
      name: "deploy:sentry script",
      check: () => packageJson.scripts && packageJson.scripts["deploy:sentry"]
    }
  ];
  
  checks.forEach(({ name, check }) => {
    const passed = check();
    console.log(`${passed ? "✅" : "❌"} ${name}`);
  });
  
  const allPassed = checks.every(({ check }) => check());
  console.log(`\nPackage.json check: ${allPassed ? "✅ PASSED" : "❌ FAILED"}\n`);
  
  return allPassed;
}

/**
 * Check if TypeScript configuration is properly set up for source maps
 */
function checkTypeScriptConfig() {
  console.log("📝 Checking TypeScript configuration...\n");
  
  if (!fs.existsSync("tsconfig.json")) {
    console.log("⚠️  tsconfig.json not found (not required if using pure JavaScript)\n");
    return true;
  }
  
  const tsConfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
  
  const checks = [
    {
      name: "sourceMap enabled",
      check: () => tsConfig.compilerOptions && tsConfig.compilerOptions.sourceMap === true
    },
    {
      name: "inlineSourceMap disabled",
      check: () => tsConfig.compilerOptions && tsConfig.compilerOptions.inlineSourceMap === false
    },
    {
      name: "sourceRoot configured",
      check: () => tsConfig.compilerOptions && tsConfig.compilerOptions.sourceRoot
    }
  ];
  
  checks.forEach(({ name, check }) => {
    const passed = check();
    console.log(`${passed ? "✅" : "❌"} ${name}`);
  });
  
  const allPassed = checks.every(({ check }) => check());
  console.log(`\nTypeScript config check: ${allPassed ? "✅ PASSED" : "❌ FAILED"}\n`);
  
  return allPassed;
}

/**
 * Verify Sentry configuration is properly set up
 */
function checkSentryConfig() {
  console.log("⚙️  Checking Sentry configuration...\n");
  
  try {
    const sentryConfig = require("./sentryConfig");
    
    const checks = [
      {
        name: "Sentry module imports",
        check: () => sentryConfig.Sentry !== undefined
      },
      {
        name: "initSentry function",
        check: () => typeof sentryConfig.initSentry === "function"
      },
      {
        name: "wrapHttpFunction",
        check: () => typeof sentryConfig.wrapHttpFunction === "function"
      },
      {
        name: "wrapEventFunction",
        check: () => typeof sentryConfig.wrapEventFunction === "function"
      },
      {
        name: "trackRacingFunction",
        check: () => typeof sentryConfig.trackRacingFunction === "function"
      },
      {
        name: "trackMLFunction",
        check: () => typeof sentryConfig.trackMLFunction === "function"
      },
      {
        name: "captureCloudFunctionError",
        check: () => typeof sentryConfig.captureCloudFunctionError === "function"
      }
    ];
    
    checks.forEach(({ name, check }) => {
      const passed = check();
      console.log(`${passed ? "✅" : "❌"} ${name}`);
    });
    
    const allPassed = checks.every(({ check }) => check());
    console.log(`\nSentry config check: ${allPassed ? "✅ PASSED" : "❌ FAILED"}\n`);
    
    return allPassed;
  } catch (error) {
    console.log(`❌ Error loading sentryConfig.js: ${error.message}\n`);
    return false;
  }
}

/**
 * Check if index.js properly initializes Sentry and exports test functions
 */
function checkIndexJs() {
  console.log("📄 Checking index.js integration...\n");
  
  const indexContent = fs.readFileSync("index.js", "utf8");
  
  const checks = [
    {
      name: "Sentry import",
      check: () => indexContent.includes("require('./sentryConfig')")
    },
    {
      name: "Sentry initialization",
      check: () => indexContent.includes("initSentry()")
    },
    {
      name: "Wrapped HTTP functions",
      check: () => indexContent.includes("wrapHttpFunction")
    },
    {
      name: "Wrapped event functions",
      check: () => indexContent.includes("wrapEventFunction")
    },
    {
      name: "Test functions exported",
      check: () => indexContent.includes("sentryTest") && indexContent.includes("exports.sentryTest")
    },
    {
      name: "Error tracking calls",
      check: () => indexContent.includes("captureCloudFunctionError")
    },
    {
      name: "Performance tracking",
      check: () => indexContent.includes("trackFunctionPerformance")
    }
  ];
  
  checks.forEach(({ name, check }) => {
    const passed = check();
    console.log(`${passed ? "✅" : "❌"} ${name}`);
  });
  
  const allPassed = checks.every(({ check }) => check());
  console.log(`\nIndex.js check: ${allPassed ? "✅ PASSED" : "❌ FAILED"}\n`);
  
  return allPassed;
}

/**
 * Check if individual Cloud Function files are properly wrapped
 */
function checkCloudFunctionFiles() {
  console.log("🔧 Checking individual Cloud Function files...\n");
  
  const functionFiles = [
    "generateReferralCode.js",
    "rewardReferrer.js",
    "database-consistency-triggers.js"
  ];
  
  const results = [];
  
  functionFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  ${file} not found`);
      return;
    }
    
    const content = fs.readFileSync(file, "utf8");
    
    const hasImport = content.includes("require('./sentryConfig')");
    const hasWrapper = content.includes("wrapEventFunction") || content.includes("wrapHttpFunction");
    const hasTracking = content.includes("track") && content.includes("Function");
    const hasErrorHandling = content.includes("captureCloudFunctionError");
    
    console.log(`${file}:`);
    console.log(`  ${hasImport ? "✅" : "❌"} Sentry import`);
    console.log(`  ${hasWrapper ? "✅" : "❌"} Function wrapper`);
    console.log(`  ${hasTracking ? "✅" : "❌"} Event tracking`);
    console.log(`  ${hasErrorHandling ? "✅" : "❌"} Error handling`);
    
    const passed = hasImport && hasWrapper && hasTracking && hasErrorHandling;
    results.push({ file, passed });
    console.log(`  ${passed ? "✅ PASSED" : "❌ FAILED"}\n`);
  });
  
  const allPassed = results.every(r => r.passed);
  console.log(`Function files check: ${allPassed ? "✅ PASSED" : "❌ FAILED"}\n`);
  
  return allPassed;
}

/**
 * Create a deployment test script
 */
function createDeploymentTest() {
  console.log("🚀 Creating deployment test script...\n");
  
  const testScript = `#!/bin/bash

# Sentry Cloud Functions Deployment Test Script
# This script tests the Sentry integration in a live environment

echo "🧪 Testing Sentry Cloud Functions Integration"
echo "============================================="

# Deploy functions to Firebase
echo "📤 Deploying Cloud Functions..."
firebase deploy --only functions

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful"

# Wait for functions to be ready
echo "⏳ Waiting for functions to be ready..."
sleep 10

# Test the Sentry test function
echo "🧪 Testing Sentry error tracking..."

# Get the project ID
PROJECT_ID=$(firebase projects:list --json | jq -r '.[0].projectId')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not determine Firebase project ID"
    exit 1
fi

echo "Using project: $PROJECT_ID"

# Test endpoints
BASE_URL="https://us-central1-$PROJECT_ID.cloudfunctions.net"

echo "Testing Sentry integration endpoints:"
echo "1. Basic Sentry test..."
curl -s "$BASE_URL/sentryTest" > /dev/null && echo "✅ sentryTest endpoint accessible" || echo "❌ sentryTest endpoint failed"

echo "2. Error tracking test..."
curl -s "$BASE_URL/sentryErrorTest" > /dev/null && echo "✅ sentryErrorTest endpoint accessible" || echo "❌ sentryErrorTest endpoint failed"

echo "3. Racing tracking test..."
curl -s "$BASE_URL/sentryRacingTest" > /dev/null && echo "✅ sentryRacingTest endpoint accessible" || echo "❌ sentryRacingTest endpoint failed"

echo "4. ML tracking test..."
curl -s "$BASE_URL/sentryMLTest" > /dev/null && echo "✅ sentryMLTest endpoint accessible" || echo "❌ sentryMLTest endpoint failed"

echo "5. Performance tracking test..."
curl -s "$BASE_URL/sentryPerformanceTest" > /dev/null && echo "✅ sentryPerformanceTest endpoint accessible" || echo "❌ sentryPerformanceTest endpoint failed"

echo ""
echo "🎉 Deployment test completed!"
echo ""
echo "Next steps:"
echo "1. Check Sentry dashboard for errors and events"
echo "2. Verify source maps are working (stack traces show original code)"
echo "3. Remove test functions when verification is complete"
echo ""
echo "Sentry Dashboard: https://sentry.io/organizations/ai-sports-edge/projects/cloud-functions/"
`;

  fs.writeFileSync("test-deployment.sh", testScript);
  fs.chmodSync("test-deployment.sh", "755");
  console.log("✅ Created test-deployment.sh script\n");
}

/**
 * Generate comprehensive verification report
 */
function generateVerificationReport() {
  console.log("📊 Generating verification report...\n");
  
  const checks = [
    { name: "Sentry Files", check: checkSentryFiles },
    { name: "Package.json", check: checkPackageJson },
    { name: "TypeScript Config", check: checkTypeScriptConfig },
    { name: "Sentry Config", check: checkSentryConfig },
    { name: "Index.js Integration", check: checkIndexJs },
    { name: "Cloud Function Files", check: checkCloudFunctionFiles }
  ];
  
  const results = checks.map(({ name, check }) => ({
    name,
    passed: check()
  }));
  
  console.log("📋 VERIFICATION SUMMARY");
  console.log("====================\n");
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? "✅" : "❌"} ${name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  
  console.log("\n" + "=".repeat(50));
  console.log(`🎯 OVERALL STATUS: ${allPassed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log("=".repeat(50) + "\n");
  
  if (allPassed) {
    console.log("🎉 Sentry integration is ready!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Set SENTRY_AUTH_TOKEN environment variable");
    console.log("2. Run: ./test-deployment.sh (to test in live environment)");
    console.log("3. Check Sentry dashboard for events");
    console.log("4. Remove test functions after verification");
  } else {
    console.log("❌ Some checks failed. Please review the issues above.");
  }
  
  return allPassed;
}

// Main execution
if (require.main === module) {
  console.log("🚀 SENTRY CLOUD FUNCTIONS INTEGRATION VERIFICATION");
  console.log("================================================\n");
  
  createDeploymentTest();
  const passed = generateVerificationReport();
  
  process.exit(passed ? 0 : 1);
}

module.exports = {
  checkSentryFiles,
  checkPackageJson,
  checkTypeScriptConfig,
  checkSentryConfig,
  checkIndexJs,
  checkCloudFunctionFiles,
  generateVerificationReport,
};