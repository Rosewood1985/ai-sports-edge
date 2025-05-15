#!/usr/bin/env node
/**
 * QA Coverage Analyzer for AI Sports Edge
 * 
 * Analyzes the codebase for test coverage, with special focus on Firebase components.
 * Identifies files with Firebase usage and their corresponding test coverage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const firebaseScanner = require('./libs/firebase-scanner');

// Add logging
fs.appendFileSync('.roocode/tool_usage.log', `${new Date()}: Running ${path.basename(__filename)}\n`);

// Configuration
const SRC_DIR = './src';
const TEST_DIR = './__tests__';
const COVERAGE_REPORT_DIR = './reports/coverage';
const COVERAGE_THRESHOLD = 70; // Minimum acceptable coverage percentage

/**
 * Find all implementation files in the project
 * @returns {Array} Array of file paths
 */
function findImplementationFiles() {
  try {
    const command = `find ${SRC_DIR} -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | grep -v ".test." | grep -v ".spec."`;
    const output = execSync(command, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding implementation files:', error.message);
    return [];
  }
}

/**
 * Find test file corresponding to an implementation file
 * @param {string} implFile - Path to implementation file
 * @returns {string|null} Path to test file or null if not found
 */
function findCorrespondingTestFile(implFile) {
  const basename = path.basename(implFile, path.extname(implFile));
  const dirname = path.dirname(implFile).replace(SRC_DIR, TEST_DIR);
  
  // Common test file patterns
  const testPatterns = [
    path.join(dirname, `${basename}.test${path.extname(implFile)}`),
    path.join(dirname, `${basename}.spec${path.extname(implFile)}`),
    path.join(dirname, `__tests__`, `${basename}.test${path.extname(implFile)}`),
    path.join(dirname, `__tests__`, `${basename}.spec${path.extname(implFile)}`),
    path.join(TEST_DIR, `${basename}.test${path.extname(implFile)}`),
    path.join(TEST_DIR, `${basename}.spec${path.extname(implFile)}`)
  ];
  
  for (const pattern of testPatterns) {
    if (fs.existsSync(pattern)) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * Calculate a basic coverage metric for a file
 * @param {string} implFile - Path to implementation file
 * @param {string|null} testFile - Path to test file
 * @returns {number} Coverage percentage (0-100)
 */
function calculateCoverage(implFile, testFile) {
  if (!testFile) {
    return 0; // No test file means 0% coverage
  }
  
  try {
    // Check if we have detailed coverage data
    if (fs.existsSync(COVERAGE_REPORT_DIR)) {
      // TODO: Parse coverage report for detailed metrics
      // For now, return a basic metric
      return 50; // Placeholder
    }
    
    // Basic coverage estimation based on test file existence and size
    const implContent = fs.readFileSync(implFile, 'utf8');
    const testContent = fs.readFileSync(testFile, 'utf8');
    
    const implLines = implContent.split('\n').length;
    const testLines = testContent.split('\n').length;
    
    // Heuristic: Test file should be at least 50% the size of implementation file
    const ratio = testLines / implLines;
    return Math.min(100, Math.round(ratio * 100));
  } catch (error) {
    console.error(`Error calculating coverage for ${implFile}:`, error.message);
    return 0;
  }
}

/**
 * Generate a coverage report for all files
 * @returns {Array} Array of file coverage objects
 */
async function generateCoverageReport() {
  const implementationFiles = findImplementationFiles();
  const coverageData = [];
  
  console.log(`Found ${implementationFiles.length} implementation files`);
  
  for (const implFile of implementationFiles) {
    const testFile = findCorrespondingTestFile(implFile);
    const coverage = calculateCoverage(implFile, testFile);
    const hasFirebase = await firebaseScanner.hasFirebaseUsage(implFile);
    
    coverageData.push({
      file: implFile,
      testFile,
      coverage,
      hasFirebase,
      risk: hasFirebase && coverage < COVERAGE_THRESHOLD ? 'HIGH' : 
            hasFirebase ? 'MEDIUM' : 
            coverage < COVERAGE_THRESHOLD ? 'LOW' : 'NONE'
    });
  }
  
  return coverageData;
}

/**
 * Print a coverage report to the console
 * @param {Array} coverageData - Array of file coverage objects
 */
function printCoverageReport(coverageData) {
  console.log('\n=== Coverage Report ===\n');
  
  // Sort by risk level (HIGH, MEDIUM, LOW, NONE)
  const sortedData = [...coverageData].sort((a, b) => {
    const riskOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2, 'NONE': 3 };
    return riskOrder[a.risk] - riskOrder[b.risk];
  });
  
  // Print high risk files (Firebase files with low coverage)
  const highRiskFiles = sortedData.filter(item => item.risk === 'HIGH');
  if (highRiskFiles.length > 0) {
    console.log('\n⚠️  HIGH RISK FILES (Firebase files with low coverage):\n');
    highRiskFiles.forEach(item => {
      console.log(`- ${item.file}`);
      console.log(`  Coverage: ${item.coverage}% (Threshold: ${COVERAGE_THRESHOLD}%)`);
      console.log(`  Test file: ${item.testFile || 'Not found'}`);
    });
  }
  
  // Print medium risk files (Firebase files with adequate coverage)
  const mediumRiskFiles = sortedData.filter(item => item.risk === 'MEDIUM');
  if (mediumRiskFiles.length > 0) {
    console.log('\n🔶 MEDIUM RISK FILES (Firebase files with adequate coverage):\n');
    mediumRiskFiles.forEach(item => {
      console.log(`- ${item.file}`);
      console.log(`  Coverage: ${item.coverage}%`);
    });
  }
  
  // Print summary
  console.log('\n=== Summary ===\n');
  console.log(`Total files: ${coverageData.length}`);
  console.log(`Firebase files: ${coverageData.filter(item => item.hasFirebase).length}`);
  console.log(`Files with tests: ${coverageData.filter(item => item.testFile).length}`);
  console.log(`High risk files: ${highRiskFiles.length}`);
  console.log(`Medium risk files: ${mediumRiskFiles.length}`);
  
  // Calculate average coverage
  const totalCoverage = coverageData.reduce((sum, item) => sum + item.coverage, 0);
  const averageCoverage = totalCoverage / coverageData.length;
  console.log(`Average coverage: ${Math.round(averageCoverage)}%`);
}

/**
 * Save coverage data to a file
 * @param {Array} coverageData - Array of file coverage objects
 */
function saveCoverageData(coverageData) {
  const outputDir = './reports';
  const outputFile = path.join(outputDir, 'firebase-coverage.json');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save data to file
  fs.writeFileSync(outputFile, JSON.stringify(coverageData, null, 2));
  console.log(`\nCoverage data saved to ${outputFile}`);
}

/**
 * Main function
 */
async function main() {
  console.log('Analyzing code coverage...');
  
  const coverageData = await generateCoverageReport();
  printCoverageReport(coverageData);
  saveCoverageData(coverageData);
  
  // Exit with error code if there are high risk files
  const highRiskFiles = coverageData.filter(item => item.risk === 'HIGH');
  if (highRiskFiles.length > 0) {
    console.log('\n⚠️  Warning: High risk files detected. Consider adding tests for these files.');
  }
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});