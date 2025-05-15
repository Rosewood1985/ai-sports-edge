/**
 * Progress Integration for AI Sports Edge
 * 
 * Integrates the progress tracking system with existing utilities.
 * Provides seamless progress tracking and operation recovery.
 */

const ProgressTracker = require('./progress-tracker');
const contentAnalyzer = require('../content/content-analyzer');
const similarityDetector = require('../similarity/similarity-detector');
const mlSimilarityDetector = require('../similarity/ml-similarity-detector');
const deepSimilarityDetector = require('../similarity/deep-similarity-detector');
const decisionEngine = require('../decision/decision-engine');
const duplicateVisualizer = require('../visualization/duplicates/duplicate-visualizer');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Constants
const DEFAULT_CONFIG = {
  checkpointInterval: 10,
  enableBackfilling: true,
  detailedLogging: true
};

/**
 * Find content duplicates with progress tracking
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} Results and operation info
 */
async function findContentDuplicatesWithProgress(options = {}) {
  // Merge default config with provided options
  const config = { ...DEFAULT_CONFIG, ...options };
  
  // Create progress tracker
  const tracker = new ProgressTracker('duplicate-detection', {
    checkpointInterval: config.checkpointInterval,
    enableBackfilling: config.enableBackfilling,
    detailedLogging: config.detailedLogging
  });
  
  // Initialize tracker
  await tracker.initialize();
  
  try {
    console.log('🔍 Finding duplicate files by content with progress tracking...');
    
    // Create necessary directories
    const backupDir = config.backupDir || '.roocode/backups/duplicates';
    const reportDir = config.reportDir || 'reports/duplicates';
    const logFile = config.logFile || '.roocode/logs/duplicate-cleanup.log';
    
    await fs.mkdir(backupDir, { recursive: true }).catch(() => {});
    await fs.mkdir(reportDir, { recursive: true }).catch(() => {});
    await fs.mkdir(path.dirname(logFile), { recursive: true }).catch(() => {});
    
    // Find files to analyze
    console.log('📋 Finding files to analyze...');
    
    const includePattern = (config.includePatterns || [
      '.*\\.(js|jsx|ts|tsx|css|scss|html|svg|json)$'
    ]).join('|');
    
    const excludePattern = (config.ignorePatterns || [
      'node_modules',
      '\\.git',
      'dist',
      'build',
      '\\.vscode',
      '\\.idea'
    ]).map(p => `! -path "*${p}*"`).join(' ');
    
    const findCommand = `find . -type f -not -path "*/\\.*" ${excludePattern} | grep -E "${includePattern}" | head -n ${config.maxFilesToAnalyze || 10000}`;
    
    const { stdout } = await exec(findCommand);
    const filePaths = stdout.trim().split('\n').filter(Boolean);
    
    console.log(`📊 Found ${filePaths.length} files to analyze...`);
    
    // Set total files
    await tracker.setTotalFiles(filePaths.length);
    
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
          
          // Record file operation
          await tracker.recordFileOperation(filePath, 'analyzed', {
            fileSize: analysis.size,
            fileType: analysis.fileType,
            isBinary: analysis.isBinary,
            hasFingerprint: !!analysis.fingerprint,
            hasTokenFingerprint: !!analysis.tokenFingerprint
          });
        }
        
        analyzed++;
        if (analyzed % 100 === 0 || analyzed === totalFiles) {
          process.stdout.write(`\r📊 Analyzed ${analyzed}/${totalFiles} files...`);
        }
      } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error.message);
        
        // Record error
        await tracker.recordFileOperation(filePath, 'error', {
          error: error.message
        });
      }
    }
    
    console.log('\n✅ File analysis complete!');
    
    // Detect duplicates based on method
    let duplicateGroups = [];
    
    if (config.useMachineLearning && config.useDeepLearning) {
      // Use deep learning-based detection
      console.log('🧠 Detecting duplicate files with deep learning...');
      
      // Initialize deep similarity detector
      await deepSimilarityDetector.initialize(fileAnalyses, {
        useUniversalSentenceEncoder: config.useUniversalSentenceEncoder !== false,
        modelPath: config.modelPath,
        similarityThreshold: config.similarityThreshold,
        fallbackToTfIdf: config.fallbackToTfIdf !== false
      });
      
      // Find similar files
      duplicateGroups = await deepSimilarityDetector.findSimilarFiles({
        similarityThreshold: config.similarityThreshold || 0.8,
        minFileSize: config.minFileSize || 100,
        ignorePatterns: config.ignorePatterns
      });
      
      // Record detection method
      await tracker.recordFileOperation('detection-method', 'deep-learning', {
        useUniversalSentenceEncoder: config.useUniversalSentenceEncoder !== false,
        modelPath: config.modelPath,
        similarityThreshold: config.similarityThreshold || 0.8
      });
    } else if (config.useMachineLearning) {
      // Use ML-based detection
      console.log('🧠 Detecting duplicate files with ML-enhanced method...');
      
      // Initialize ML detector
      await mlSimilarityDetector.initialize(fileAnalyses);
      
      // Find similar files
      duplicateGroups = await mlSimilarityDetector.findSimilarFiles({
        similarityThreshold: config.similarityThreshold || 0.7,
        minFileSize: config.minFileSize || 100,
        ignorePatterns: config.ignorePatterns,
        clusteringMethod: config.clusteringMethod || 'hierarchical',
        maxClusters: config.maxClusters || 0
      });
      
      // Record detection method
      await tracker.recordFileOperation('detection-method', 'ml-enhanced', {
        clusteringMethod: config.clusteringMethod || 'hierarchical',
        similarityThreshold: config.similarityThreshold || 0.7
      });
    } else {
      // Use standard detection
      console.log('🔍 Detecting duplicate files with standard method...');
      
      duplicateGroups = similarityDetector.findSimilarFiles(fileAnalyses, {
        exactMatchOnly: config.exactMatchOnly || false,
        similarityThreshold: config.similarityThreshold || 0.9,
        minFileSize: config.minFileSize || 100,
        ignorePatterns: config.ignorePatterns
      });
      
      // Record detection method
      await tracker.recordFileOperation('detection-method', 'standard', {
        exactMatchOnly: config.exactMatchOnly || false,
        similarityThreshold: config.similarityThreshold || 0.9
      });
    }
    
    console.log(`✅ Found ${duplicateGroups.length} groups of duplicate files!`);
    
    // Record duplicate groups
    for (let i = 0; i < duplicateGroups.length; i++) {
      const group = duplicateGroups[i];
      const groupId = `group-${i + 1}`;
      
      await tracker.recordGroupOperation(groupId, 'duplicate-group', 
        group.files.map(f => f.path), 
        {
          type: group.type,
          similarity: group.similarity,
          totalSize: group.totalSize,
          wastedSize: group.wastedSize
        }
      );
    }
    
    if (duplicateGroups.length === 0) {
      console.log('🎉 No duplicates found! Your codebase is clean.');
      
      // Complete tracker
      await tracker.complete('success');
      
      return {
        success: true,
        duplicateGroups: [],
        recommendations: [],
        reportPath: null,
        operationId: tracker.operationId
      };
    }
    
    // Generate recommendations
    console.log('📋 Generating recommendations...');
    
    const recommendations = await decisionEngine.generateRecommendations(
      duplicateGroups,
      {
        safetyThreshold: config.safetyThreshold || 0.9,
        ignorePatterns: config.ignorePatterns
      }
    );
    
    // Record recommendations
    await tracker.recordFileOperation('recommendations', 'generated', {
      count: recommendations.length,
      automaticCount: recommendations.filter(r => r.automaticDecision).length
    });
    
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
        outputDir: reportDir,
        includeFileContents: config.includeFileContents || false,
        maxFileSizeForContent: config.maxFileSizeForContent || 10240,
        projectRoot: process.cwd()
      }
    );
    
    // Record report generation
    await tracker.recordFileOperation('report', 'generated', {
      reportPath,
      includeFileContents: config.includeFileContents || false
    });
    
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
          dryRun: config.dryRun !== false,
          backupDir,
          createBackups: config.createBackups !== false,
          onlyAutomatic: true,
          logFile
        }
      );
      
      // Record recommendation application
      await tracker.recordFileOperation('recommendations', 'applied', {
        appliedCount: results.applied.length,
        totalSaved: results.totalSaved,
        dryRun: config.dryRun !== false
      });
      
      if (config.dryRun !== false) {
        console.log(`✅ Dry run complete! ${results.applied.length} groups would be cleaned up.`);
        console.log(`💾 This would save ${_formatSize(results.totalSaved)} of disk space.`);
        console.log('To actually apply changes, run with --apply');
      } else {
        console.log(`✅ Applied changes to ${results.applied.length} groups!`);
        console.log(`💾 Saved ${_formatSize(results.totalSaved)} of disk space.`);
      }
    }
    
    // Complete tracker
    await tracker.complete('success');
    
    return {
      success: true,
      duplicateGroups,
      recommendations,
      reportPath,
      operationId: tracker.operationId
    };
  } catch (error) {
    console.error('Error finding duplicates:', error);
    
    // Record error and complete tracker
    await tracker.recordFileOperation('error', 'fatal', {
      error: error.message,
      stack: error.stack
    });
    
    await tracker.complete('error');
    
    return {
      success: false,
      error: error.message,
      operationId: tracker.operationId
    };
  }
}

/**
 * Resume content duplicate detection
 * @param {string} operationId Operation ID to resume
 * @param {Object} options Resume options
 * @returns {Promise<Object>} Results and operation info
 */
async function resumeContentDuplicateDetection(operationId, options = {}) {
  try {
    console.log(`🔄 Resuming duplicate detection operation: ${operationId}`);
    
    // Resume progress tracker
    const tracker = await ProgressTracker.resume(operationId, {
      checkpointInterval: options.checkpointInterval || DEFAULT_CONFIG.checkpointInterval,
      enableBackfilling: options.enableBackfilling !== false,
      detailedLogging: options.detailedLogging !== false
    });
    
    // Get current status
    const status = tracker.getStatus();
    console.log(`📊 Resuming from ${status.processedFiles}/${status.totalFiles} files (${status.percentage.toFixed(2)}%)`);
    
    // TODO: Implement actual resumption logic based on the current state
    // This would involve:
    // 1. Determining what phase we're in (file analysis, duplicate detection, etc.)
    // 2. Loading any intermediate results from the checkpoint
    // 3. Continuing from where we left off
    
    // For now, we'll just return the operation ID and status
    return {
      success: true,
      resumed: true,
      operationId,
      status
    };
  } catch (error) {
    console.error(`Error resuming operation:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List duplicate detection operations
 * @param {Object} options List options
 * @returns {Promise<Array>} Array of operations
 */
async function listDuplicateDetectionOperations(options = {}) {
  try {
    // List operations
    const operations = await ProgressTracker.listOperations({
      ...options,
      operationType: 'duplicate-detection'
    });
    
    return operations;
  } catch (error) {
    console.error(`Error listing operations:`, error.message);
    return [];
  }
}

/**
 * Get duplicate detection operation status
 * @param {string} operationId Operation ID
 * @returns {Promise<Object>} Operation status
 */
async function getDuplicateDetectionStatus(operationId) {
  try {
    // Resume progress tracker
    const tracker = await ProgressTracker.resume(operationId, {
      enableBackfilling: false,
      detailedLogging: false
    });
    
    // Get status
    const status = tracker.getStatus();
    
    // Generate summary report
    const summary = await tracker.generateSummaryReport();
    
    return {
      success: true,
      status,
      summary
    };
  } catch (error) {
    console.error(`Error getting operation status:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean duplicate detection checkpoints
 * @param {Object} options Cleanup options
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanDuplicateDetectionCheckpoints(options = {}) {
  try {
    // Clean checkpoints
    const results = await ProgressTracker.cleanCheckpoints(options);
    
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error(`Error cleaning checkpoints:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format file size for display
 * @param {number} size Size in bytes
 * @returns {string} Formatted size
 * @private
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

module.exports = {
  findContentDuplicatesWithProgress,
  resumeContentDuplicateDetection,
  listDuplicateDetectionOperations,
  getDuplicateDetectionStatus,
  cleanDuplicateDetectionCheckpoints
};
};