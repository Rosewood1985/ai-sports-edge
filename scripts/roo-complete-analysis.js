#!/usr/bin/env node
/**
 * Complete Analysis System for AI Sports Edge
 * 
 * Integrates Progress Backfilling System and Historical Code Analysis System
 * to provide a comprehensive analysis solution with resumable operations.
 */

const path = require('path');
const fs = require('fs').promises;
const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const ProgressTracker = require('./libs/core/progress-tracker');

// Version
const version = '1.0.0';

// Configure CLI
const program = new Command();

program
  .name('roo-complete-analysis')
  .description('Comprehensive analysis system with progress tracking and resumable operations')
  .version(version);

/**
 * Main analyze command
 */
program
  .command('analyze')
  .description('Run complete analysis with progress tracking')
  .option('--timeframe <period>', 'Analyze commits from this time period', '1 year ago')
  .option('--output-dir <path>', 'Directory for analysis reports', 'reports/complete-analysis')
  .option('--no-progress', 'Disable progress tracking')
  .option('--checkpoint-interval <number>', 'Checkpoint interval for progress tracking', '100')
  .option('--skip-duplicates', 'Skip duplicate detection')
  .option('--skip-history', 'Skip historical analysis')
  .action(async (options) => {
    const spinner = ora('Starting complete analysis...').start();
    
    try {
      // Initialize progress tracker if enabled
      let progressTracker = null;
      const operationId = `complete-analysis-${Date.now()}`;
      
      if (options.progress) {
        progressTracker = new ProgressTracker('complete-analysis', {
          operationId,
          checkpointInterval: parseInt(options.checkpointInterval),
          enableBackfilling: true,
          detailedLogging: true
        });
        
        await progressTracker.initialize();
        spinner.text = 'Initialized progress tracking...';
        
        // Log start of analysis
        await progressTracker.recordFileOperation('complete-analysis', 'started', {
          timeframe: options.timeframe,
          outputDir: options.outputDir,
          skipDuplicates: options.skipDuplicates,
          skipHistory: options.skipHistory
        });
      }
      
      // Create output directory
      await fs.mkdir(options.outputDir, { recursive: true });
      
      // Run duplicate detection if not skipped
      let duplicateResults = null;
      if (!options.skipDuplicates) {
        spinner.text = 'Running duplicate detection...';
        
        if (progressTracker) {
          await progressTracker.recordFileOperation('duplicate-detection', 'started', {});
        }
        
        // Dynamically import the duplicate detection module
        const { findContentDuplicatesWithProgress } = await import('./libs/core/progress-integration.js');
        
        // Run duplicate detection
        duplicateResults = await findContentDuplicatesWithProgress({
          checkpointInterval: parseInt(options.checkpointInterval),
          enableBackfilling: true,
          detailedLogging: true,
          outputDir: path.join(options.outputDir, 'duplicates'),
          useMachineLearning: true,
          useDeepLearning: true
        });
        
        if (progressTracker) {
          await progressTracker.recordFileOperation('duplicate-detection', 'completed', {
            success: duplicateResults.success,
            duplicateGroups: duplicateResults.duplicateGroups?.length || 0,
            reportPath: duplicateResults.reportPath
          });
        }
        
        spinner.succeed('Duplicate detection completed!');
        spinner.start('Continuing with analysis...');
      }
      
      // Run historical analysis if not skipped
      let historyResults = null;
      if (!options.skipHistory) {
        spinner.text = 'Running historical analysis...';
        
        if (progressTracker) {
          await progressTracker.recordFileOperation('historical-analysis', 'started', {});
        }
        
        // Dynamically import the HistoricalAnalyzer
        const { default: HistoricalAnalyzer } = await import('./libs/analysis/historical-analyzer.js');
        
        // Configure analyzer with progress callback
        const analyzer = new HistoricalAnalyzer({
          timeframe: options.timeframe,
          outputDir: path.join(options.outputDir, 'history'),
          onProgress: options.progress ? 
            (stage, details) => handleProgressUpdate(progressTracker, stage, details) : 
            null
        });
        
        // Run historical analysis
        historyResults = await analyzer.analyze();
        
        if (progressTracker) {
          await progressTracker.recordFileOperation('historical-analysis', 'completed', {
            commits: historyResults.commits,
            features: historyResults.features,
            contributors: historyResults.contributors,
            milestones: historyResults.milestones,
            reportPath: historyResults.reportPath
          });
        }
        
        spinner.succeed('Historical analysis completed!');
        spinner.start('Generating combined report...');
      }
      
      // Generate combined report
      await generateCombinedReport(options.outputDir, {
        duplicateResults,
        historyResults,
        operationId,
        timeframe: options.timeframe
      });
      
      if (progressTracker) {
        await progressTracker.recordFileOperation('combined-report', 'generated', {
          outputDir: options.outputDir
        });
        
        await progressTracker.complete('success');
      }
      
      spinner.succeed('Complete analysis finished!');
      
      // Display results
      console.log('\n' + chalk.green('📊 Complete Analysis Summary:'));
      
      if (duplicateResults) {
        console.log(chalk.cyan('Duplicate Groups:'), duplicateResults.duplicateGroups?.length || 0);
        console.log(chalk.cyan('Duplicate Report:'), duplicateResults.reportPath);
      }
      
      if (historyResults) {
        console.log(chalk.cyan('Commits Analyzed:'), historyResults.commits);
        console.log(chalk.cyan('Features Tracked:'), historyResults.features);
        console.log(chalk.cyan('Contributors:'), historyResults.contributors);
        console.log(chalk.cyan('History Report:'), historyResults.reportPath);
      }
      
      console.log(chalk.cyan('Combined Report:'), path.join(options.outputDir, 'complete-analysis-report.html'));
      
      if (progressTracker) {
        console.log(chalk.cyan('Operation ID:'), operationId);
        console.log(chalk.cyan('Progress Log:'), progressTracker.logFile);
      }
      
      // Ask if user wants to open the report
      const { openReport } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openReport',
          message: 'Would you like to open the combined report?',
          default: true
        }
      ]);
      
      if (openReport) {
        const open = require('open');
        await open(path.join(options.outputDir, 'complete-analysis-report.html'));
      }
      
    } catch (error) {
      spinner.fail('Error during complete analysis');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Resume command
 */
program
  .command('resume <operationId>')
  .description('Resume an interrupted analysis operation')
  .option('--output-dir <path>', 'Directory for analysis reports', 'reports/complete-analysis')
  .action(async (operationId, options) => {
    const spinner = ora(`Resuming operation: ${operationId}`).start();
    
    try {
      // Resume progress tracker
      const progressTracker = await ProgressTracker.resume(operationId, {
        enableBackfilling: true,
        detailedLogging: true
      });
      
      if (!progressTracker) {
        spinner.fail(`Could not resume operation: ${operationId}`);
        process.exit(1);
      }
      
      // Get current status
      const status = progressTracker.getStatus();
      spinner.text = `Resuming from ${status.processedFiles}/${status.totalFiles} files (${status.percentage.toFixed(2)}%)`;
      
      // Determine what needs to be resumed
      const logs = await progressTracker.getLogs();
      
      // Check if duplicate detection was completed
      const duplicateDetectionCompleted = logs.some(
        log => log.type === 'FILE_OPERATION' && 
               log.data.operation === 'duplicate-detection' && 
               log.data.details.operation === 'completed'
      );
      
      // Check if historical analysis was completed
      const historicalAnalysisCompleted = logs.some(
        log => log.type === 'FILE_OPERATION' && 
               log.data.operation === 'historical-analysis' && 
               log.data.details.operation === 'completed'
      );
      
      // Resume duplicate detection if needed
      let duplicateResults = null;
      if (!duplicateDetectionCompleted) {
        spinner.text = 'Resuming duplicate detection...';
        
        // Find duplicate detection operation ID if available
        const duplicateDetectionLog = logs.find(
          log => log.type === 'FILE_OPERATION' && 
                 log.data.operation === 'duplicate-detection' && 
                 log.data.details.operation === 'started'
        );
        
        if (duplicateDetectionLog && duplicateDetectionLog.data.details.operationId) {
          // Resume existing duplicate detection
          const { resumeContentDuplicateDetection } = await import('./libs/core/progress-integration.js');
          
          duplicateResults = await resumeContentDuplicateDetection(
            duplicateDetectionLog.data.details.operationId
          );
        } else {
          // Start new duplicate detection
          const { findContentDuplicatesWithProgress } = await import('./libs/core/progress-integration.js');
          
          duplicateResults = await findContentDuplicatesWithProgress({
            checkpointInterval: 100,
            enableBackfilling: true,
            detailedLogging: true,
            outputDir: path.join(options.outputDir, 'duplicates'),
            useMachineLearning: true,
            useDeepLearning: true
          });
        }
        
        await progressTracker.recordFileOperation('duplicate-detection', 'completed', {
          success: duplicateResults.success,
          duplicateGroups: duplicateResults.duplicateGroups?.length || 0,
          reportPath: duplicateResults.reportPath
        });
        
        spinner.succeed('Duplicate detection completed!');
        spinner.start('Continuing with analysis...');
      } else {
        // Get duplicate detection results from logs
        const duplicateDetectionResultLog = logs.find(
          log => log.type === 'FILE_OPERATION' && 
                 log.data.operation === 'duplicate-detection' && 
                 log.data.details.operation === 'completed'
        );
        
        if (duplicateDetectionResultLog) {
          duplicateResults = {
            success: duplicateDetectionResultLog.data.details.success,
            duplicateGroups: { length: duplicateDetectionResultLog.data.details.duplicateGroups },
            reportPath: duplicateDetectionResultLog.data.details.reportPath
          };
        }
      }
      
      // Resume historical analysis if needed
      let historyResults = null;
      if (!historicalAnalysisCompleted) {
        spinner.text = 'Resuming historical analysis...';
        
        // Find historical analysis operation ID if available
        const historicalAnalysisLog = logs.find(
          log => log.type === 'FILE_OPERATION' && 
                 log.data.operation === 'historical-analysis' && 
                 log.data.details.operation === 'started'
        );
        
        // Dynamically import the HistoricalAnalyzer
        const { default: HistoricalAnalyzer } = await import('./libs/analysis/historical-analyzer.js');
        
        // Configure analyzer with progress callback
        const analyzer = new HistoricalAnalyzer({
          outputDir: path.join(options.outputDir, 'history'),
          onProgress: (stage, details) => handleProgressUpdate(progressTracker, stage, details)
        });
        
        // Run or resume historical analysis
        historyResults = await analyzer.analyze();
        
        await progressTracker.recordFileOperation('historical-analysis', 'completed', {
          commits: historyResults.commits,
          features: historyResults.features,
          contributors: historyResults.contributors,
          milestones: historyResults.milestones,
          reportPath: historyResults.reportPath
        });
        
        spinner.succeed('Historical analysis completed!');
        spinner.start('Generating combined report...');
      } else {
        // Get historical analysis results from logs
        const historicalAnalysisResultLog = logs.find(
          log => log.type === 'FILE_OPERATION' && 
                 log.data.operation === 'historical-analysis' && 
                 log.data.details.operation === 'completed'
        );
        
        if (historicalAnalysisResultLog) {
          historyResults = {
            commits: historicalAnalysisResultLog.data.details.commits,
            features: historicalAnalysisResultLog.data.details.features,
            contributors: historicalAnalysisResultLog.data.details.contributors,
            milestones: historicalAnalysisResultLog.data.details.milestones,
            reportPath: historicalAnalysisResultLog.data.details.reportPath
          };
        }
      }
      
      // Generate combined report
      await generateCombinedReport(options.outputDir, {
        duplicateResults,
        historyResults,
        operationId,
        timeframe: 'resumed'
      });
      
      await progressTracker.recordFileOperation('combined-report', 'generated', {
        outputDir: options.outputDir
      });
      
      await progressTracker.complete('success');
      
      spinner.succeed('Analysis resumed and completed!');
      
      // Display results
      console.log('\n' + chalk.green('📊 Complete Analysis Summary:'));
      
      if (duplicateResults) {
        console.log(chalk.cyan('Duplicate Groups:'), duplicateResults.duplicateGroups?.length || 0);
        console.log(chalk.cyan('Duplicate Report:'), duplicateResults.reportPath);
      }
      
      if (historyResults) {
        console.log(chalk.cyan('Commits Analyzed:'), historyResults.commits);
        console.log(chalk.cyan('Features Tracked:'), historyResults.features);
        console.log(chalk.cyan('Contributors:'), historyResults.contributors);
        console.log(chalk.cyan('History Report:'), historyResults.reportPath);
      }
      
      console.log(chalk.cyan('Combined Report:'), path.join(options.outputDir, 'complete-analysis-report.html'));
      
    } catch (error) {
      spinner.fail('Error resuming analysis');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * List operations command
 */
program
  .command('list')
  .description('List all analysis operations')
  .option('--active-only', 'Show only active operations')
  .option('--limit <number>', 'Limit number of operations', '10')
  .action(async (options) => {
    const spinner = ora('Listing operations...').start();
    
    try {
      // List operations
      const operations = await ProgressTracker.listOperations({
        activeOnly: options.activeOnly,
        limit: parseInt(options.limit),
        operationType: 'complete-analysis'
      });
      
      spinner.succeed(`Found ${operations.length} operations.`);
      
      if (operations.length > 0) {
        // Create table
        console.log('\n' + chalk.green('📋 Analysis Operations:'));
        console.log(chalk.cyan('ID').padEnd(36), 
                   chalk.cyan('Start Time').padEnd(25), 
                   chalk.cyan('Progress').padEnd(15), 
                   chalk.cyan('Status').padEnd(10));
        console.log('-'.repeat(90));
        
        // Add rows
        for (const op of operations) {
          const progress = op.totalFiles > 0 ? 
            `${op.processedFiles}/${op.totalFiles} (${((op.processedFiles / op.totalFiles) * 100).toFixed(0)}%)` : 
            `${op.processedFiles}/?`;
          
          const status = op.status === 'active' ? 
            chalk.yellow(op.status) : 
            chalk.green(op.status);
          
          console.log(
            op.operationId.padEnd(36),
            new Date(op.startTime).toLocaleString().padEnd(25),
            progress.padEnd(15),
            status
          );
        }
        
        // Show resume command example
        if (operations.some(op => op.status === 'active')) {
          const activeOp = operations.find(op => op.status === 'active');
          console.log(chalk.yellow(`\n🔄 To resume an active operation:`));
          console.log(chalk.yellow(`   roo-complete-analysis resume ${activeOp.operationId}`));
        }
      } else {
        console.log(chalk.yellow(`\nNo operations found.`));
      }
    } catch (error) {
      spinner.fail('Error listing operations');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Clean command
 */
program
  .command('clean')
  .description('Clean up old analysis operations')
  .option('--older-than <days>', 'Clean operations older than days', '30')
  .option('--dry-run', 'Dry run (don\'t actually delete)')
  .action(async (options) => {
    const spinner = ora('Cleaning up old operations...').start();
    
    try {
      // Clean operations
      const result = await ProgressTracker.cleanCheckpoints({
        olderThan: parseInt(options.olderThan),
        dryRun: options.dryRun,
        operationType: 'complete-analysis'
      });
      
      if (options.dryRun) {
        spinner.succeed(`Would delete ${result.would_delete} operations (dry run).`);
      } else {
        spinner.succeed(`Deleted ${result.deleted} operations.`);
      }
      
      // Show deleted operations
      if (result.checkpoints && result.checkpoints.length > 0) {
        console.log(chalk.blue(`\n🗑️ ${options.dryRun ? 'Would delete' : 'Deleted'} operations:`));
        
        for (const checkpoint of result.checkpoints) {
          console.log(chalk.blue(`   ${checkpoint}`));
        }
      }
    } catch (error) {
      spinner.fail('Error cleaning operations');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Generate combined report
 * @param {string} outputDir Output directory
 * @param {Object} results Analysis results
 * @returns {Promise<void>}
 */
async function generateCombinedReport(outputDir, results) {
  const { duplicateResults, historyResults, operationId, timeframe } = results;
  
  // Create combined report data
  const reportData = {
    generatedAt: new Date().toISOString(),
    operationId,
    timeframe,
    duplicates: duplicateResults ? {
      groups: duplicateResults.duplicateGroups?.length || 0,
      reportPath: duplicateResults.reportPath
    } : null,
    history: historyResults ? {
      commits: historyResults.commits,
      features: historyResults.features,
      contributors: historyResults.contributors,
      milestones: historyResults.milestones,
      reportPath: historyResults.reportPath
    } : null
  };
  
  // Generate HTML report
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Analysis Report</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.6;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background: #f5f7fa;
      }
      
      .container {
        background: white;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      h1, h2, h3 {
        color: #2c3e50;
        margin-top: 0;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }
      
      .summary-card {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
      }
      
      .summary-value {
        font-size: 2.5em;
        font-weight: bold;
        color: #3498db;
        margin-bottom: 5px;
      }
      
      .summary-label {
        color: #7f8c8d;
        text-transform: uppercase;
        font-size: 0.9em;
      }
      
      .section {
        margin: 40px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .report-link {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 15px;
        background: #3498db;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
      }
      
      .report-link:hover {
        background: #2980b9;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Complete Analysis Report</h1>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      <p>Operation ID: ${operationId}</p>
      <p>Timeframe: ${timeframe}</p>
      
      <div class="summary-grid">
        ${historyResults ? `
        <div class="summary-card">
          <div class="summary-value">${historyResults.commits}</div>
          <div class="summary-label">Commits Analyzed</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${historyResults.features}</div>
          <div class="summary-label">Features Tracked</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${historyResults.contributors}</div>
          <div class="summary-label">Contributors</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${historyResults.milestones}</div>
          <div class="summary-label">Milestones</div>
        </div>
        ` : ''}
        
        ${duplicateResults ? `
        <div class="summary-card">
          <div class="summary-value">${duplicateResults.duplicateGroups?.length || 0}</div>
          <div class="summary-label">Duplicate Groups</div>
        </div>
        ` : ''}
      </div>
      
      ${historyResults ? `
      <div class="section">
        <h2>Historical Analysis</h2>
        <p>The historical analysis examined ${historyResults.commits} commits, tracking ${historyResults.features} features and ${historyResults.contributors} contributors.</p>
        <p>Key insights:</p>
        <ul>
          <li>${historyResults.milestones} development milestones identified</li>
          <li>Feature evolution and contributor patterns analyzed</li>
          <li>File lifecycle and development patterns tracked</li>
        </ul>
        <a href="${historyResults.reportPath}" class="report-link">View Historical Analysis Report</a>
      </div>
      ` : ''}
      
      ${duplicateResults ? `
      <div class="section">
        <h2>Duplicate Detection</h2>
        <p>The duplicate detection analysis found ${duplicateResults.duplicateGroups?.length || 0} groups of duplicate or similar files.</p>
        <p>Key insights:</p>
        <ul>
          <li>Content-based duplicate detection with machine learning</li>
          <li>Deep learning-enhanced similarity analysis</li>
          <li>Detailed recommendations for cleanup</li>
        </ul>
        <a href="${duplicateResults.reportPath}" class="report-link">View Duplicate Detection Report</a>
      </div>
      ` : ''}
      
      <div class="section">
        <h2>Integration Benefits</h2>
        <p>This combined analysis provides several benefits:</p>
        <ul>
          <li><strong>Comprehensive Insights:</strong> Both historical patterns and current code quality issues</li>
          <li><strong>Resumable Operations:</strong> Long-running analyses can be paused and resumed</li>
          <li><strong>Progress Tracking:</strong> Detailed logging and checkpointing</li>
          <li><strong>Integrated Reporting:</strong> Combined insights from multiple analysis types</li>
        </ul>
      </div>
    </div>
  </body>
  </html>
  `;
  
  // Write HTML report
  await fs.writeFile(path.join(outputDir, 'complete-analysis-report.html'), html);
  
  // Write JSON data
  await fs.writeFile(
    path.join(outputDir, 'complete-analysis-data.json'),
    JSON.stringify(reportData, null, 2)
  );
}

/**
 * Handle progress updates from the analyzer
 * @param {ProgressTracker} progressTracker Progress tracker instance
 * @param {string} stage Current analysis stage
 * @param {Object} details Stage-specific details
 */
async function handleProgressUpdate(progressTracker, stage, details) {
  if (!progressTracker) return;
  
  await progressTracker.recordFileOperation(`history-${stage}`, 'progress', details);
}

// Parse CLI arguments
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  
  console.log('\nExamples:');
  console.log('  $ roo-complete-analysis analyze                    # Run complete analysis');
  console.log('  $ roo-complete-analysis analyze --timeframe "2 years ago"');
  console.log('  $ roo-complete-analysis analyze --skip-duplicates  # Skip duplicate detection');
  console.log('  $ roo-complete-analysis resume <operation-id>      # Resume interrupted analysis');
  console.log('  $ roo-complete-analysis list --active-only         # List active operations');
  console.log('  $ roo-complete-analysis clean --older-than 30      # Clean old operations');
}