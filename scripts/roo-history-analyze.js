#!/usr/bin/env node
/**
 * Historical Code Analysis CLI for AI Sports Edge
 * 
 * Analyzes Git history to track feature development and implementation changes
 * Integrates with Progress Backfilling System for resumable operations
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
  .name('roo-history')
  .description('Analyze Git history to track feature development and implementation changes')
  .version(version);

/**
 * Main analyze command
 */
program
  .command('analyze')
  .description('Analyze repository history for features and implementations')
  .option('--timeframe <period>', 'Analyze commits from this time period', '1 year ago')
  .option('--branches <names>', 'Comma-separated list of branches to analyze', 'main,master,develop')
  .option('--output-dir <path>', 'Directory for analysis reports', 'reports/historical-analysis')
  .option('--file-patterns <patterns>', 'Comma-separated file patterns to analyze', '*.js,*.jsx,*.ts,*.tsx,*.css,*.html')
  .option('--no-progress', 'Disable progress tracking')
  .option('--checkpoint-interval <number>', 'Checkpoint interval for progress tracking', '100')
  .action(async (options) => {
    const spinner = ora('Starting historical analysis...').start();
    
    try {
      // Initialize progress tracker if enabled
      let progressTracker = null;
      const operationId = `history-analysis-${Date.now()}`;
      
      if (options.progress) {
        progressTracker = new ProgressTracker('history-analysis', {
          operationId,
          checkpointInterval: parseInt(options.checkpointInterval),
          enableBackfilling: true,
          detailedLogging: true
        });
        
        await progressTracker.initialize();
        spinner.text = 'Initialized progress tracking...';
      }
      
      // Dynamically import the HistoricalAnalyzer to avoid circular dependencies
      const { default: HistoricalAnalyzer } = await import('./libs/analysis/historical-analyzer.js');
      
      // Configure analyzer with progress callback
      const analyzer = new HistoricalAnalyzer({
        timeframe: options.timeframe,
        branches: options.branches.split(','),
        outputDir: options.outputDir,
        filePatterns: options.filePatterns.split(','),
        onProgress: options.progress ? 
          (stage, details) => handleProgressUpdate(progressTracker, stage, details) : 
          null
      });
      
      spinner.text = 'Analyzing commit history...';
      const result = await analyzer.analyze();
      
      if (progressTracker) {
        await progressTracker.complete('success');
      }
      
      spinner.succeed('Historical analysis completed!');
      
      // Display results
      console.log('\n' + chalk.green('📊 Analysis Summary:'));
      console.log(chalk.cyan('Total Commits:'), result.commits);
      console.log(chalk.cyan('Features Tracked:'), result.features);
      console.log(chalk.cyan('Contributors:'), result.contributors);
      console.log(chalk.cyan('Milestones:'), result.milestones);
      console.log(chalk.cyan('Full Report:'), result.reportPath);
      
      if (progressTracker) {
        console.log(chalk.cyan('Operation ID:'), operationId);
        console.log(chalk.cyan('Progress Log:'), progressTracker.logFile);
      }
      
      // Ask if user wants to open the report
      const { openReport } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openReport',
          message: 'Would you like to open the HTML report?',
          default: true
        }
      ]);
      
      if (openReport) {
        const open = require('open');
        await open(result.reportPath);
      }
      
    } catch (error) {
      spinner.fail('Error during historical analysis');
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
  .option('--output-dir <path>', 'Directory for analysis reports', 'reports/historical-analysis')
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
      
      // Dynamically import the HistoricalAnalyzer
      const { default: HistoricalAnalyzer } = await import('./libs/analysis/historical-analyzer.js');
      
      // Configure analyzer with progress callback
      const analyzer = new HistoricalAnalyzer({
        outputDir: options.outputDir,
        onProgress: (stage, details) => handleProgressUpdate(progressTracker, stage, details)
      });
      
      // Resume analysis
      const result = await analyzer.resumeAnalysis(progressTracker);
      
      await progressTracker.complete('success');
      
      spinner.succeed('Analysis resumed and completed!');
      
      // Display results
      console.log('\n' + chalk.green('📊 Analysis Summary:'));
      console.log(chalk.cyan('Total Commits:'), result.commits);
      console.log(chalk.cyan('Features Tracked:'), result.features);
      console.log(chalk.cyan('Contributors:'), result.contributors);
      console.log(chalk.cyan('Milestones:'), result.milestones);
      console.log(chalk.cyan('Full Report:'), result.reportPath);
      
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
        operationType: 'history-analysis'
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
          console.log(chalk.yellow(`   roo-history resume ${activeOp.operationId}`));
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
        operationType: 'history-analysis'
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
 * Handle progress updates from the analyzer
 * @param {ProgressTracker} progressTracker Progress tracker instance
 * @param {string} stage Current analysis stage
 * @param {Object} details Stage-specific details
 */
async function handleProgressUpdate(progressTracker, stage, details) {
  if (!progressTracker) return;
  
  switch (stage) {
    case 'extract_start':
      await progressTracker.recordFileOperation('git-history', 'extraction-started', details);
      break;
      
    case 'extract_found':
      await progressTracker.setTotalFiles(details.count);
      break;
      
    case 'extract_progress':
      // No need to record every progress update, just log it
      break;
      
    case 'extract_complete':
      await progressTracker.recordFileOperation('git-history', 'extraction-completed', details);
      break;
      
    case 'features_start':
      await progressTracker.recordFileOperation('features', 'analysis-started', details);
      break;
      
    case 'features_progress':
      // No need to record every progress update
      break;
      
    case 'features_complete':
      await progressTracker.recordFileOperation('features', 'analysis-completed', details);
      break;
      
    case 'merge_patterns_start':
      await progressTracker.recordFileOperation('merge-patterns', 'analysis-started', {});
      break;
      
    case 'merge_patterns_complete':
      await progressTracker.recordFileOperation('merge-patterns', 'analysis-completed', details);
      break;
      
    case 'file_evolution_start':
      await progressTracker.recordFileOperation('file-evolution', 'analysis-started', {});
      break;
      
    case 'file_evolution_progress':
      // No need to record every progress update
      break;
      
    case 'file_evolution_complete':
      await progressTracker.recordFileOperation('file-evolution', 'analysis-completed', details);
      break;
      
    case 'milestones_start':
      await progressTracker.recordFileOperation('milestones', 'analysis-started', {});
      break;
      
    case 'milestones_tags':
      await progressTracker.recordFileOperation('milestones', 'tags-processed', details);
      break;
      
    case 'milestones_complete':
      await progressTracker.recordFileOperation('milestones', 'analysis-completed', details);
      break;
      
    case 'reports_start':
      await progressTracker.recordFileOperation('reports', 'generation-started', {});
      break;
      
    case 'reports_complete':
      await progressTracker.recordFileOperation('reports', 'generation-completed', details);
      break;
  }
}

// Parse CLI arguments
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  
  console.log('\nExamples:');
  console.log('  $ roo-history analyze                    # Analyze last year of history');
  console.log('  $ roo-history analyze --timeframe "2 years ago"');
  console.log('  $ roo-history analyze --no-progress      # Disable progress tracking');
  console.log('  $ roo-history resume <operation-id>      # Resume interrupted analysis');
  console.log('  $ roo-history list --active-only         # List active operations');
  console.log('  $ roo-history clean --older-than 30      # Clean old operations');
}