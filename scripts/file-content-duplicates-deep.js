#!/usr/bin/env node
/**
 * Deep Learning-Enhanced Content-Based Duplicate Detection for AI Sports Edge
 * 
 * Finds duplicate files by content using deep learning techniques.
 * Uses TensorFlow.js for advanced text and code embedding.
 * 
 * Note: Requires TensorFlow.js to be installed:
 * npm install @tensorflow/tfjs @tensorflow/tfjs-node @tensorflow-models/universal-sentence-encoder
 */

const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Import modules
const contentAnalyzer = require('./libs/content/content-analyzer');
const deepSimilarityDetector = require('./libs/similarity/deep-similarity-detector');
const decisionEngine = require('./libs/decision/decision-engine');
const duplicateVisualizer = require('./libs/visualization/duplicates/duplicate-visualizer');

// Constants and configuration
const DEFAULT_CONFIG = {
  similarityThreshold: 0.8,
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
  useUniversalSentenceEncoder: true, // Whether to use USE or a custom model
  modelPath: null, // Path to custom model
  fallbackToTfIdf: true // Whether to fall back to TF-IDF if TensorFlow is not available
};

/**
 * Find duplicate files by content using deep learning
 */
async function findContentDuplicatesDeep(options = {}) {
  // Merge default config with provided options
  const config = { ...DEFAULT_CONFIG, ...options };
  
  console.log('🔍 Finding duplicate files by content with deep learning enhancement...');
  
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
  
  // Initialize deep similarity detector
  console.log('🧠 Initializing deep learning model...');
  
  const initResult = await deepSimilarityDetector.initialize(fileAnalyses, {
    useUniversalSentenceEncoder: config.useUniversalSentenceEncoder,
    modelPath: config.modelPath,
    similarityThreshold: config.similarityThreshold,
    fallbackToTfIdf: config.fallbackToTfIdf
  });
  
  if (!initResult) {
    console.error('❌ Failed to initialize deep learning model. Aborting.');
    return {
      success: false,
      error: 'Failed to initialize deep learning model'
    };
  }
  
  // Detect duplicates using deep learning
  console.log('🧠 Detecting duplicate files with deep learning...');
  
  const duplicateGroups = await deepSimilarityDetector.findSimilarFiles({
    similarityThreshold: config.similarityThreshold,
    minFileSize: config.minFileSize,
    ignorePatterns: config.ignorePatterns
  });
  
  console.log(`✅ Found ${duplicateGroups.length} groups of duplicate files!`);
  
  if (duplicateGroups.length === 0) {
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
    duplicateGroups,
    {
      safetyThreshold: config.similarityThreshold + 0.05, // Higher threshold for safety
      ignorePatterns: config.ignorePatterns
    }
  );
  
  // Calculate summary statistics
  const totalWastedSize = duplicateGroups.reduce(
    (sum, group) => sum + group.wastedSize, 
    0
  );
  
  const automaticDecisions = recommendations.filter(
    r => r.automaticDecision
  ).length;
  
  console.log(`✅ Found ${duplicateGroups.length} duplicate groups with ${_formatSize(totalWastedSize)} wasted space!`);
  console.log(`✅ ${automaticDecisions} groups can be automatically resolved.`);
  
  // Generate visualization
  console.log('📊 Generating report...');
  
  const reportPath = await duplicateVisualizer.generateReport(
    duplicateGroups,
    recommendations,
    {
      outputDir: config.reportDir,
      includeFileContents: config.includeFileContents,
      maxFileSizeForContent: config.maxFileSizeForContent,
      projectRoot: process.cwd()
    }
  );
  
  // Show summary
  const summary = duplicateVisualizer.generateSummary(duplicateGroups, recommendations);
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
    duplicateGroups,
    recommendations,
    reportPath
  };
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
    useUniversalSentenceEncoder: !args.includes('--no-use'),
    fallbackToTfIdf: !args.includes('--no-fallback'),
    includeFileContents: args.includes('--include-contents'),
    modelPath: args.find(arg => arg.startsWith('--model='))?.split('=')[1] || null,
    similarityThreshold: args.includes('--threshold') ? 
      parseFloat(args[args.indexOf('--threshold') + 1]) : 
      DEFAULT_CONFIG.similarityThreshold
  };
  
  // Run the function
  findContentDuplicatesDeep(options).catch(error => {
    console.error('Error finding duplicates:', error);
    process.exit(1);
  });
}

// Export the function for use in other scripts
module.exports = {
  findContentDuplicatesDeep
};