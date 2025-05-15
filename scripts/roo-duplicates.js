#!/usr/bin/env node
/**
 * Roo Duplicates CLI
 * 
 * Command-line interface for the Progress Backfilling System.
 * Provides comprehensive progress tracking, checkpoint management,
 * and automatic recovery for duplicate detection operations.
 */

const path = require('path');
const fs = require('fs').promises;
const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const prettyBytes = require('pretty-bytes');
const prettyMs = require('pretty-ms');

// Import progress integration
const {
  findContentDuplicatesWithProgress,
  resumeContentDuplicateDetection,
  listDuplicateDetectionOperations,
  getDuplicateDetectionStatus,
  cleanDuplicateDetectionCheckpoints
} = require('./libs/core/progress-integration');

// Version
const version = '1.0.0';

// Configure CLI
program
  .name('roo-duplicates')
  .description('Roo Duplicates CLI with Progress Backfilling System')
  .version(version);

/**
 * Find command
 */
program
  .command('find')
  .description('Find duplicate files with progress tracking')
  .option('--apply', 'Apply recommendations (default: dry run)')
  .option('--checkpoint-interval <number>', 'Checkpoint interval (default: 10)', parseInt)
  .option('--no-backfilling', 'Disable backfilling')
  .option('--no-detailed-logging', 'Disable detailed logging')
  .option('--ml', 'Use machine learning-based detection')
  .option('--deep', 'Use deep learning-based detection')
  .option('--threshold <number>', 'Similarity threshold (default: 0.9)', parseFloat)
  .option('--backup-dir <path>', 'Backup directory')
  .option('--report-dir <path>', 'Report directory')
  .option('--include-contents', 'Include file contents in report')
  .action(async (options) => {
    const spinner = ora('Finding duplicate files...').start();
    
    try {
      // Configure options
      const config = {
        applyRecommendations: options.apply,
        dryRun: !options.apply,
        checkpointInterval: options.checkpointInterval || 10,
        enableBackfilling: options.backfilling !== false,
        detailedLogging: options.detailedLogging !== false,
        useMachineLearning: options.ml || options.deep,
        useDeepLearning: options.deep,
        similarityThreshold: options.threshold || 0.9,
        backupDir: options.backupDir,
        reportDir: options.reportDir,
        includeFileContents: options.includeContents
      };
      
      // Find duplicates
      spinner.text = 'Finding duplicate files...';
      const result = await findContentDuplicatesWithProgress(config);
      
      if (!result.success) {
        spinner.fail(`Error finding duplicates: ${result.error}`);
        process.exit(1);
      }
      
      // Show results
      spinner.succeed(`Found ${result.duplicateGroups.length} duplicate groups!`);
      
      if (result.duplicateGroups.length > 0) {
        // Calculate total wasted space
        const totalWastedSize = result.duplicateGroups.reduce(
          (sum, group) => sum + group.wastedSize, 
          0
        );
        
        // Show summary
        console.log(chalk.green(`\n✅ Found ${result.duplicateGroups.length} duplicate groups with ${prettyBytes(totalWastedSize)} wasted space!`));
        
        if (result.reportPath) {
          console.log(chalk.blue(`📊 Report generated: ${result.reportPath}`));
        }
        
        // Show operation ID
        console.log(chalk.yellow(`\n🔄 Operation ID: ${result.operationId}`));
        console.log(chalk.yellow(`   Use this ID to resume the operation if interrupted.`));
        console.log(chalk.yellow(`   Example: roo-duplicates resume ${result.operationId}`));
      } else {
        console.log(chalk.green(`\n🎉 No duplicates found! Your codebase is clean.`));
      }
    } catch (error) {
      spinner.fail(`Error finding duplicates: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  });

/**
 * Resume command
 */
program
  .command('resume <operationId>')
  .description('Resume an interrupted operation')
  .option('--apply', 'Apply recommendations (default: dry run)')
  .option('--checkpoint-interval <number>', 'Checkpoint interval (default: 10)', parseInt)
  .option('--no-backfilling', 'Disable backfilling')
  .option('--no-detailed-logging', 'Disable detailed logging')
  .action(async (operationId, options) => {
    const spinner = ora(`Resuming operation: ${operationId}`).start();
    
    try {
      // Configure options
      const config = {
        applyRecommendations: options.apply,
        dryRun: !options.apply,
        checkpointInterval: options.checkpointInterval || 10,
        enableBackfilling: options.backfilling !== false,
        detailedLogging: options.detailedLogging !== false
      };
      
      // Resume operation
      spinner.text = `Resuming operation: ${operationId}`;
      const result = await resumeContentDuplicateDetection(operationId, config);
      
      if (!result.success) {
        spinner.fail(`Error resuming operation: ${result.error}`);
        process.exit(1);
      }
      
      // Show results
      spinner.succeed(`Resumed operation: ${operationId}`);
      
      // Show status
      console.log(chalk.green(`\n📊 Current status:`));
      console.log(chalk.green(`   Processed files: ${result.status.processedFiles}/${result.status.totalFiles} (${result.status.percentage.toFixed(2)}%)`));
      console.log(chalk.green(`   State: ${result.status.state}`));
      console.log(chalk.green(`   Checkpoints: ${result.status.checkpointCount}`));
    } catch (error) {
      spinner.fail(`Error resuming operation: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  });

/**
 * List command
 */
program
  .command('list')
  .description('List all operations and checkpoints')
  .option('--active-only', 'Show only active operations')
  .option('--limit <number>', 'Limit number of operations (default: 10)', parseInt)
  .action(async (options) => {
    const spinner = ora('Listing operations...').start();
    
    try {
      // Configure options
      const config = {
        activeOnly: options.activeOnly,
        limit: options.limit || 10,
        sortBy: 'startTime',
        sortDirection: 'desc'
      };
      
      // List operations
      const operations = await listDuplicateDetectionOperations(config);
      
      spinner.succeed(`Found ${operations.length} operations.`);
      
      if (operations.length > 0) {
        // Create table
        const table = new Table({
          head: [
            chalk.cyan('Operation ID'),
            chalk.cyan('Type'),
            chalk.cyan('Start Time'),
            chalk.cyan('Progress'),
            chalk.cyan('Status')
          ],
          colWidths: [36, 15, 25, 15, 10]
        });
        
        // Add rows
        for (const op of operations) {
          const progress = op.totalFiles > 0 ? 
            `${op.processedFiles}/${op.totalFiles} (${((op.processedFiles / op.totalFiles) * 100).toFixed(0)}%)` : 
            `${op.processedFiles}/?`;
          
          const status = op.status === 'active' ? 
            chalk.yellow(op.status) : 
            chalk.green(op.status);
          
          table.push([
            op.operationId,
            op.operationType,
            new Date(op.startTime).toLocaleString(),
            progress,
            status
          ]);
        }
        
        console.log(table.toString());
        
        // Show resume command example
        if (operations.some(op => op.status === 'active')) {
          const activeOp = operations.find(op => op.status === 'active');
          console.log(chalk.yellow(`\n🔄 To resume an active operation:`));
          console.log(chalk.yellow(`   roo-duplicates resume ${activeOp.operationId}`));
        }
      } else {
        console.log(chalk.yellow(`\nNo operations found.`));
      }
    } catch (error) {
      spinner.fail(`Error listing operations: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command('status <operationId>')
  .description('Get detailed status of an operation')
  .action(async (operationId) => {
    const spinner = ora(`Getting status for operation: ${operationId}`).start();
    
    try {
      // Get status
      const result = await getDuplicateDetectionStatus(operationId);
      
      if (!result.success) {
        spinner.fail(`Error getting status: ${result.error}`);
        process.exit(1);
      }
      
      spinner.succeed(`Got status for operation: ${operationId}`);
      
      // Show status
      console.log(chalk.green(`\n📊 Operation Status:`));
      console.log(chalk.green(`   Operation ID: ${result.status.operationId}`));
      console.log(chalk.green(`   Operation Type: ${result.status.operationType}`));
      console.log(chalk.green(`   Start Time: ${new Date(result.status.startTime).toLocaleString()}`));
      console.log(chalk.green(`   Last Checkpoint: ${new Date(result.status.lastCheckpointTime).toLocaleString()}`));
      console.log(chalk.green(`   Progress: ${result.status.processedFiles}/${result.status.totalFiles} (${result.status.percentage.toFixed(2)}%)`));
      console.log(chalk.green(`   State: ${result.status.state}`));
      console.log(chalk.green(`   Checkpoints: ${result.status.checkpointCount}`));
      console.log(chalk.green(`   Operations: ${result.status.operationCount}`));
      
      // Show summary
      if (result.summary) {
        console.log(chalk.blue(`\n📈 Operation Summary:`));
        
        // Show timeline
        if (result.summary.timeline && result.summary.timeline.length > 0) {
          console.log(chalk.blue(`\n⏱️ Timeline:`));
          
          const timelineTable = new Table({
            head: [
              chalk.cyan('Timestamp'),
              chalk.cyan('Processed Files'),
              chalk.cyan('Percentage')
            ],
            colWidths: [25, 15, 15]
          });
          
          for (const point of result.summary.timeline) {
            timelineTable.push([
              new Date(point.timestamp).toLocaleString(),
              point.processedFiles,
              `${point.percentage.toFixed(2)}%`
            ]);
          }
          
          console.log(timelineTable.toString());
        }
        
        // Show operation counts
        if (result.summary.operationCounts) {
          console.log(chalk.blue(`\n🔢 Operation Counts:`));
          
          const countsTable = new Table({
            head: [
              chalk.cyan('Operation Type'),
              chalk.cyan('Count')
            ],
            colWidths: [30, 10]
          });
          
          for (const [type, count] of Object.entries(result.summary.operationCounts)) {
            countsTable.push([type, count]);
          }
          
          console.log(countsTable.toString());
        }
      }
      
      // Show resume command
      if (result.status.state !== 'completed') {
        console.log(chalk.yellow(`\n🔄 To resume this operation:`));
        console.log(chalk.yellow(`   roo-duplicates resume ${operationId}`));
      }
    } catch (error) {
      spinner.fail(`Error getting status: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  });

/**
 * Clean command
 */
program
  .command('clean')
  .description('Clean up old checkpoints')
  .option('--older-than <days>', 'Clean checkpoints older than days (default: 30)', parseInt)
  .option('--dry-run', 'Dry run (don\'t actually delete)')
  .action(async (options) => {
    const spinner = ora('Cleaning up old checkpoints...').start();
    
    try {
      // Configure options
      const config = {
        olderThan: options.olderThan || 30,
        dryRun: options.dryRun
      };
      
      // Clean checkpoints
      const result = await cleanDuplicateDetectionCheckpoints(config);
      
      if (!result.success) {
        spinner.fail(`Error cleaning checkpoints: ${result.error}`);
        process.exit(1);
      }
      
      if (config.dryRun) {
        spinner.succeed(`Would delete ${result.would_delete} checkpoints (dry run).`);
      } else {
        spinner.succeed(`Deleted ${result.deleted} checkpoints.`);
      }
      
      // Show deleted checkpoints
      if (result.checkpoints && result.checkpoints.length > 0) {
        console.log(chalk.blue(`\n🗑️ ${config.dryRun ? 'Would delete' : 'Deleted'} checkpoints:`));
        
        for (const checkpoint of result.checkpoints) {
          console.log(chalk.blue(`   ${checkpoint}`));
        }
      }
    } catch (error) {
      spinner.fail(`Error cleaning checkpoints: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}