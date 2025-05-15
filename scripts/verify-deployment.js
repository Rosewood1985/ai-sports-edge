#!/usr/bin/env node
/**
 * Automated Deployment Verification for AI Sports Edge
 * 
 * Verifies that a deployment was successful by:
 * 1. Fetching files from the remote environment
 * 2. Comparing them with local build artifacts
 * 3. Generating a verification report
 * 
 * Used in CI/CD pipelines for automated deployment verification.
 */

const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const environmentManager = require('./libs/remote/environment-manager');
const fileFetcher = require('./libs/remote/file-fetcher');
const hashValidator = require('./libs/remote/hash-validator');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  environment: args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'production',
  buildDir: args.find(arg => arg.startsWith('--build-dir='))?.split('=')[1] || 'dist',
  reportDir: args.find(arg => arg.startsWith('--report-dir='))?.split('=')[1] || 'reports/deployments',
  ci: args.includes('--ci'),
  verbose: args.includes('--verbose'),
  failOnError: args.includes('--fail-on-error'),
  maxFiles: parseInt(args.find(arg => arg.startsWith('--max-files='))?.split('=')[1] || '100', 10),
  sampleRate: parseFloat(args.find(arg => arg.startsWith('--sample-rate='))?.split('=')[1] || '0.5')
};

// Configuration
const CRITICAL_FILES = [
  'index.html',
  'manifest.json',
  'service-worker.js',
  'main.js',
  'styles.css'
];

/**
 * Main verification function
 */
async function verifyDeployment() {
  try {
    console.log(`🔍 Verifying deployment to ${options.environment} environment...`);
    
    // Create report directory
    await fs.mkdir(options.reportDir, { recursive: true });
    
    // Get environment configuration
    const environment = await environmentManager.getEnvironment(options.environment);
    if (!environment) {
      throw new Error(`Environment "${options.environment}" not found`);
    }
    
    // Get environment URLs
    const urls = await environmentManager.getEnvironmentUrls(options.environment);
    console.log(`📡 Target URL: ${urls.default}`);
    
    // Find build artifacts
    console.log(`📦 Finding build artifacts in ${options.buildDir}...`);
    const buildFiles = await findBuildFiles(options.buildDir);
    console.log(`📊 Found ${buildFiles.length} build files`);
    
    // Select files to verify
    const filesToVerify = selectFilesToVerify(buildFiles);
    console.log(`🔍 Selected ${filesToVerify.length} files to verify`);
    
    // Generate reference hashes
    console.log(`🔐 Generating reference hashes...`);
    const referenceHashes = await generateReferenceHashes(filesToVerify);
    
    // Fetch remote files
    console.log(`📡 Fetching files from remote environment...`);
    const fetchResults = await fetchRemoteFiles(filesToVerify, environment);
    
    // Validate files
    console.log(`✅ Validating files...`);
    const validationResults = await validateFiles(fetchResults.results, referenceHashes);
    
    // Generate report
    console.log(`📝 Generating verification report...`);
    const report = generateReport(validationResults, fetchResults, environment);
    
    // Save report
    const reportPath = await saveReport(report);
    console.log(`📄 Report saved to ${reportPath}`);
    
    // Check if verification passed
    const passed = checkVerificationPassed(report);
    
    if (passed) {
      console.log(`✅ Deployment verification passed!`);
    } else {
      const errorMessage = `❌ Deployment verification failed!`;
      console.error(errorMessage);
      
      if (options.failOnError) {
        process.exit(1);
      }
    }
    
    return {
      passed,
      report,
      reportPath
    };
  } catch (error) {
    console.error(`❌ Error verifying deployment:`, error.message);
    
    if (options.failOnError) {
      process.exit(1);
    }
    
    return {
      passed: false,
      error: error.message
    };
  }
}

/**
 * Find build files in the build directory
 * @param {string} buildDir Build directory
 * @returns {Promise<Array>} Array of file paths
 */
async function findBuildFiles(buildDir) {
  try {
    const files = [];
    
    async function scanDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else {
          const relativePath = path.relative(buildDir, fullPath);
          files.push(relativePath);
        }
      }
    }
    
    await scanDirectory(buildDir);
    return files;
  } catch (error) {
    console.error(`Error finding build files:`, error.message);
    return [];
  }
}

/**
 * Select files to verify
 * @param {Array} buildFiles Array of build files
 * @returns {Array} Array of files to verify
 */
function selectFilesToVerify(buildFiles) {
  // Always include critical files
  const criticalFilePaths = buildFiles.filter(file => 
    CRITICAL_FILES.some(criticalFile => 
      file === criticalFile || file.endsWith(`/${criticalFile}`)
    )
  );
  
  // Sample remaining files
  const remainingFiles = buildFiles.filter(file => 
    !criticalFilePaths.includes(file)
  );
  
  // Shuffle and select a sample
  const shuffled = remainingFiles.sort(() => 0.5 - Math.random());
  const sampleCount = Math.min(
    Math.floor(remainingFiles.length * options.sampleRate),
    options.maxFiles - criticalFilePaths.length
  );
  
  const sampledFiles = shuffled.slice(0, sampleCount);
  
  return [...criticalFilePaths, ...sampledFiles];
}

/**
 * Generate reference hashes for build files
 * @param {Array} filesToVerify Array of files to verify
 * @returns {Promise<Array>} Array of reference hashes
 */
async function generateReferenceHashes(filesToVerify) {
  const referenceHashes = [];
  
  for (const file of filesToVerify) {
    try {
      const fullPath = path.join(options.buildDir, file);
      const hash = await hashValidator.generateHash(fullPath, {
        algorithm: 'sha256',
        chunkSize: 4096
      });
      
      referenceHashes.push({
        ...hash,
        path: file // Use relative path
      });
    } catch (error) {
      console.error(`Error generating hash for ${file}:`, error.message);
    }
  }
  
  return referenceHashes;
}

/**
 * Fetch files from remote environment
 * @param {Array} filesToVerify Array of files to verify
 * @param {Object} environment Environment configuration
 * @returns {Promise<Object>} Fetch results
 */
async function fetchRemoteFiles(filesToVerify, environment) {
  return await fileFetcher.fetchFiles(filesToVerify, {
    environmentName: options.environment,
    saveToFile: false,
    timeout: 30000,
    retries: 3
  });
}

/**
 * Validate fetched files against reference hashes
 * @param {Array} fetchedFiles Array of fetched files
 * @param {Array} referenceHashes Array of reference hashes
 * @returns {Promise<Object>} Validation results
 */
async function validateFiles(fetchedFiles, referenceHashes) {
  return await hashValidator.validateFiles(fetchedFiles, referenceHashes, {
    compareChunks: true,
    similarityThreshold: 0.9
  });
}

/**
 * Generate verification report
 * @param {Object} validationResults Validation results
 * @param {Object} fetchResults Fetch results
 * @param {Object} environment Environment configuration
 * @returns {Object} Verification report
 */
function generateReport(validationResults, fetchResults, environment) {
  const timestamp = new Date().toISOString();
  const deploymentInfo = {
    environment: options.environment,
    timestamp,
    buildDir: options.buildDir,
    targetUrl: environment.url || 'unknown'
  };
  
  // Get deployment info from environment variables if in CI
  if (options.ci) {
    deploymentInfo.sha = process.env.GITHUB_SHA || process.env.DEPLOY_SHA || 'unknown';
    deploymentInfo.ref = process.env.GITHUB_REF || process.env.DEPLOY_REF || 'unknown';
    deploymentInfo.actor = process.env.GITHUB_ACTOR || 'unknown';
    deploymentInfo.runId = process.env.GITHUB_RUN_ID || 'unknown';
  }
  
  // Calculate summary statistics
  const totalFiles = validationResults.total;
  const matchingFiles = validationResults.matches;
  const exactMatches = validationResults.exactMatches;
  const failedFiles = validationResults.failed;
  const errorFiles = fetchResults.errors.length;
  
  const matchRate = totalFiles > 0 ? matchingFiles / totalFiles : 0;
  const exactMatchRate = totalFiles > 0 ? exactMatches / totalFiles : 0;
  const errorRate = totalFiles > 0 ? (failedFiles + errorFiles) / totalFiles : 0;
  
  // Check if critical files match
  const criticalFileResults = validationResults.results.filter(result => 
    CRITICAL_FILES.some(criticalFile => 
      result.fileHash.path === criticalFile || 
      result.fileHash.path.endsWith(`/${criticalFile}`)
    )
  );
  
  const criticalFilesMatch = criticalFileResults.every(result => result.match);
  
  return {
    deployment: deploymentInfo,
    summary: {
      totalFiles,
      matchingFiles,
      exactMatches,
      failedFiles,
      errorFiles,
      matchRate,
      exactMatchRate,
      errorRate,
      criticalFilesMatch,
      passed: matchRate >= 0.9 && criticalFilesMatch
    },
    criticalFiles: criticalFileResults.map(result => ({
      path: result.fileHash.path,
      match: result.match,
      exactMatch: result.exactMatch,
      similarity: result.similarity
    })),
    results: validationResults.results.map(result => ({
      path: result.fileHash.path,
      match: result.match,
      exactMatch: result.exactMatch,
      similarity: result.similarity
    })),
    errors: [
      ...validationResults.errors,
      ...fetchResults.errors
    ]
  };
}

/**
 * Save verification report
 * @param {Object} report Verification report
 * @returns {Promise<string>} Path to saved report
 */
async function saveReport(report) {
  const timestamp = report.deployment.timestamp.replace(/[:.]/g, '-');
  const reportFile = path.join(options.reportDir, `verification-${timestamp}.json`);
  
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  
  return reportFile;
}

/**
 * Check if verification passed
 * @param {Object} report Verification report
 * @returns {boolean} Whether verification passed
 */
function checkVerificationPassed(report) {
  return report.summary.passed;
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyDeployment().catch(error => {
    console.error(`Error:`, error.message);
    process.exit(1);
  });
}

module.exports = {
  verifyDeployment
};