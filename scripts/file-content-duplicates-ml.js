#!/usr/bin/env node
/**
 * ML-Enhanced Content-Based Duplicate Detection for AI Sports Edge
 * 
 * Finds duplicate files by content using machine learning techniques.
 * Enhances the standard duplicate detection with advanced similarity metrics.
 */

const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Import modules
const contentAnalyzer = require('./libs/content/content-analyzer');
const similarityDetector = require('./libs/similarity/similarity-detector');
const mlSimilarityDetector = require('./libs/similarity/ml-similarity-detector');
const decisionEngine = require('./libs/decision/decision-engine');
const duplicateVisualizer = require('./libs/visualization/duplicates/duplicate-visualizer');

// Constants and configuration
const DEFAULT_CONFIG = {
  exactMatchOnly: false,
  similarityThreshold: 0.7, // Lower threshold for ML-based detection
  safetyThreshold: 0.85,
  minFileSize: 100, // Ignore tiny files
  ignorePatterns: [
    'node_modules',
    '\\.git',
    'dist',
    'build',
    '\\.vscode',
    '\\.idea'
  ],
  includePatterns: [
    '.*\\.(js|jsx|ts|tsx|css|scss|html|svg|json)$'
  ],
  maxFilesToAnalyze: 10000, // Safety limit
  dryRun: true, // Don't actually delete anything by default
  createBackups: true,
  backupDir: '.roocode/backups/duplicates',
  logFile: '.roocode/logs/duplicate-cleanup.log',
  reportDir: 'reports/duplicates',
  includeFileContents: false,
  maxFileSizeForContent: 10240, // 10KB
  useMachineLearning: true,
  clusteringMethod: 'hierarchical', // 'hierarchical' or 'kmeans'
  maxClusters: 0 // 0 means auto-determine
};

/**
 * Find duplicate files by content using ML techniques
 */
async function findContentDuplicatesML(options = {}) {
  // Merge default config with provided options
  const config = { ...DEFAULT_CONFIG, ...options };
  
  console.log('🔍 Finding duplicate files by content with ML enhancement...');
  
  // Create necessary directories
  await fs.mkdir(config.backupDir, { recursive: true }).catch(() => {});
  await fs.mkdir(config.reportDir, { recursive: true }).catch(() => {});
  await fs.mkdir(path.dirname(config.logFile), { recursive: true }).catch(() => {});
  
  // Find files to analyze
  console.log('📋 Finding files to analyze...');
  
  const includePattern = config.includePatterns.join('|');
  const excludePattern = config.ignorePatterns.map(p => `! -path "*${p}*"`).join(' ');
  
  const findCommand = `find . -type f -not -path "*/\\.*" ${excludePattern} | grep -E "${includePattern}" | head -n ${config.maxFilesToAnalyze}`;
  
  const { stdout } = await execAsync(findCommand);
  const filePaths = stdout.trim().split('\n').filter(Boolean);
  
  console.log(`📊 Found ${filePaths.length} files to analyze...`);
  
  // Analyze file contents
  console.log('🔬 Analyzing file contents...');
  console.log('This may take a while for large codebases...');
  
  const fileAnalyses = [];
  let analyzed = 0;
  const totalFiles = filePaths.length;
  
  for (const filePath of filePaths) {
    try {
      const analysis = await contentAnalyzer.analyzeFile(filePath);
      if (analysis) {
        fileAnalyses.push(analysis);
      }
      
      analyzed++;
      if (analyzed % 100 === 0 || analyzed === totalFiles) {
        process.stdout.write(`\r📊 Analyzed ${analyzed}/${totalFiles} files...`);
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }
  
  console.log('\n✅ File analysis complete!');
  
  // Detect duplicates using standard method
  console.log('🔍 Detecting duplicate files with standard method...');
  
  const standardDuplicateGroups = similarityDetector.findSimilarFiles(fileAnalyses, {
    exactMatchOnly: config.exactMatchOnly,
    similarityThreshold: config.similarityThreshold,
    minFileSize: config.minFileSize,
    ignorePatterns: config.ignorePatterns
  });
  
  console.log(`✅ Found ${standardDuplicateGroups.length} groups of duplicate files with standard method!`);
  
  // Detect duplicates using ML method
  console.log('🧠 Detecting duplicate files with ML-enhanced method...');
  
  // Initialize ML detector
  await mlSimilarityDetector.initialize(fileAnalyses);
  
  // Find similar files using ML
  const mlDuplicateGroups = await mlSimilarityDetector.findSimilarFiles({
    similarityThreshold: config.similarityThreshold,
    minFileSize: config.minFileSize,
    ignorePatterns: config.ignorePatterns,
    clusteringMethod: config.clusteringMethod,
    maxClusters: config.maxClusters
  });
  
  console.log(`✅ Found ${mlDuplicateGroups.length} groups of duplicate files with ML-enhanced method!`);
  
  // Combine results, removing duplicates
  const combinedGroups = combineResults(standardDuplicateGroups, mlDuplicateGroups);
  
  console.log(`✅ Combined into ${combinedGroups.length} unique groups of duplicate files!`);
  
  if (combinedGroups.length === 0) {
    console.log('🎉 No duplicates found! Your codebase is clean.');
    return {
      success: true,
      duplicateGroups: [],
      recommendations: [],
      reportPath: null
    };
  }
  
  // Generate recommendations
  console.log('📋 Generating recommendations...');
  
  const recommendations = await decisionEngine.generateRecommendations(
    combinedGroups,
    {
      safetyThreshold: config.safetyThreshold,
      ignorePatterns: config.ignorePatterns
    }
  );
  
  // Calculate summary statistics
  const totalWastedSize = combinedGroups.reduce(
    (sum, group) => sum + group.wastedSize, 
    0
  );
  
  const automaticDecisions = recommendations.filter(
    r => r.automaticDecision
  ).length;
  
  console.log(`✅ Found ${combinedGroups.length} duplicate groups with ${_formatSize(totalWastedSize)} wasted space!`);
  console.log(`✅ ${automaticDecisions} groups can be automatically resolved.`);
  
  // Generate visualization
  console.log('📊 Generating report...');
  
  const reportPath = await duplicateVisualizer.generateReport(
    combinedGroups,
    recommendations,
    {
      outputDir: config.reportDir,
      includeFileContents: config.includeFileContents,
      maxFileSizeForContent: config.maxFileSizeForContent,
      projectRoot: process.cwd()
    }
  );
  
  // Show summary
  const summary = duplicateVisualizer.generateSummary(combinedGroups, recommendations);
  console.log(summary);
  
  console.log(`✅ Report generated: ${reportPath}`);
  
  // Apply recommendations if specified
  if (config.applyRecommendations) {
    console.log('🧹 Applying recommendations...');
    
    const results = await decisionEngine.applyRecommendations(
      recommendations,
      {
        dryRun: config.dryRun,
        backupDir: config.backupDir,
        createBackups: config.createBackups,
        onlyAutomatic: true,
        logFile: config.logFile
      }
    );
    
    if (config.dryRun) {
      console.log(`✅ Dry run complete! ${results.applied.length} groups would be cleaned up.`);
      console.log(`💾 This would save ${_formatSize(results.totalSaved)} of disk space.`);
      console.log('To actually apply changes, run with --apply');
    } else {
      console.log(`✅ Applied changes to ${results.applied.length} groups!`);
      console.log(`💾 Saved ${_formatSize(results.totalSaved)} of disk space.`);
    }
  }
  
  return {
    success: true,
    duplicateGroups: combinedGroups,
    recommendations,
    reportPath
  };
}

/**
 * Combine results from standard and ML-based detection
 * @param {Array} standardGroups Groups from standard detection
 * @param {Array} mlGroups Groups from ML-based detection
 * @returns {Array} Combined groups
 */
function combineResults(standardGroups, mlGroups) {
  // Track files that are already in standard groups
  const filesInStandardGroups = new Set();
  standardGroups.forEach(group => {
    group.files.forEach(file => {
      filesInStandardGroups.add(file.path);
    });
  });
  
  // Filter ML groups to remove those already in standard groups
  const filteredMlGroups = mlGroups.filter(group => {
    // Keep the group only if it has at least 2 files not in standard groups
    const filteredFiles = group.files.filter(
      file => !filesInStandardGroups.has(file.path)
    );
    
    if (filteredFiles.length < 2) {
      return false;
    }
    
    // Update group files
    group.files = filteredFiles;
    
    // Recalculate sizes
    group.totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);
    group.wastedSize = group.totalSize - Math.min(...filteredFiles.map(file => file.size));
    
    return true;
  });
  
  // Sort by wasted size (descending)
  return [...standardGroups, ...filteredMlGroups].sort(
    (a, b) => b.wastedSize - a.wastedSize
  );
}

/**
 * Format file size for display
 * @param {number} size Size in bytes
 * @returns {string} Formatted size
 */
function _formatSize(size) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let formattedSize = size;
  let unitIndex = 0;
  
  while (formattedSize >= 1024 && unitIndex < units.length - 1) {
    formattedSize /= 1024;
    unitIndex++;
  }
  
  return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
}

// If script is run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    applyRecommendations: args.includes('--apply'),
    dryRun: !args.includes('--apply'),
    exactMatchOnly: args.includes('--exact-only'),
    includeFileContents: args.includes('--include-contents'),
    useMachineLearning: !args.includes('--no-ml'),
    clusteringMethod: args.includes('--kmeans') ? 'kmeans' : 'hierarchical',
    similarityThreshold: args.includes('--threshold') ? 
      parseFloat(args[args.indexOf('--threshold') + 1]) : 
      DEFAULT_CONFIG.similarityThreshold
  };
  
  // Run the function
  findContentDuplicatesML(options).catch(error => {
    console.error('Error finding duplicates:', error);
    process.exit(1);
  });
}

// Export the function for use in other scripts
module.exports = {
  findContentDuplicatesML
};