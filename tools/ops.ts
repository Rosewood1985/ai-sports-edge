#!/usr/bin/env node
/**
 * AI Sports Edge Operations CLI
 * 
 * A centralized command-line interface for managing operations in the AI Sports Edge project,
 * including Firebase migrations, deployments, and other maintenance tasks.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Import utility functions
import { logger } from './utils/logger';
import { validateEnvironment } from './utils/environment';
import { updateStatus } from './utils/status';
import { contextAwareOperations } from './utils/context';

// Define the program
const program = new Command();

// Set up program metadata
program
  .name('ops')
  .description('AI Sports Edge Operations CLI')
  .version('1.0.0');

// Add a hook for tracking commands
(program as any).hook('preAction', (thisCommand: any, actionCommand: any) => {
    // Track the command being executed
    contextAwareOperations.updateContext({
      lastCommand: actionCommand.name(),
      lastCommandArgs: actionCommand.args,
      lastCommandOpts: actionCommand.opts(),
      timestamp: new Date().toISOString()
    });
  });

// Firebase Migration Commands
program
  .command('firebase:migrate')
  .description('Migrate Firebase services to atomic architecture')
  .option('-f, --file <file>', 'Specific file to migrate')
  .option('-b, --batch-size <size>', 'Number of files to migrate in each batch', '5')
  .option('-a, --auto-confirm', 'Automatically confirm migrations without prompting')
  .action(async (options) => {
    logger.info('Starting Firebase migration process');
    
    try {
      // Validate environment
      validateEnvironment();
      
      if (options.file) {
        // Migrate a single file
        logger.info(`Migrating single file: ${options.file}`);
        execSync(`bash scripts/migrate-and-update.sh ${options.file}`, { stdio: 'inherit' });
      } else {
        // Run the complete migration process
        const autoConfirmFlag = options.autoConfirm ? '--auto-confirm' : '';
        const batchSizeFlag = options.batchSize ? `--batch-size=${options.batchSize}` : '';
        
        execSync(`bash scripts/run-complete-migration.sh ${autoConfirmFlag} ${batchSizeFlag}`, { stdio: 'inherit' });
      }
      
      // Update status
      updateStatus('firebase-migration', 'success', 'Firebase migration completed successfully');
      
      logger.success('Firebase migration completed successfully');
    } catch (error) {
      logger.error('Firebase migration failed', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateStatus('firebase-migration', 'error', `Firebase migration failed: ${errorMessage}`);
      process.exit(1);
    }
  });

// Firebase Migration Status Command
program
  .command('firebase:status')
  .description('Check the status of Firebase migration')
  .action(async () => {
    logger.info('Checking Firebase migration status');
    
    try {
      execSync('bash scripts/update-firebase-migration-status.sh', { stdio: 'inherit' });
      logger.success('Firebase migration status updated');
    } catch (error) {
      logger.error('Failed to update Firebase migration status', error);
      process.exit(1);
    }
  });

// Firebase Tagging Command
program
  .command('firebase:tag')
  .description('Tag migrated Firebase files')
  .option('-r, --retro', 'Retroactively tag all migrated files')
  .option('-f, --file <file>', 'Specific file to tag')
  .action(async (options) => {
    logger.info('Tagging Firebase files');
    
    try {
      if (options.retro) {
        // Retroactively tag all files
        execSync('bash scripts/retro-tag-migrated.sh', { stdio: 'inherit' });
      } else if (options.file) {
        // Tag a specific file
        execSync(`bash scripts/tag-headers.sh migrated ${options.file}`, { stdio: 'inherit' });
      } else {
        logger.warn('No tagging option specified. Use --retro or --file');
      }
      
      logger.success('Firebase tagging completed');
    } catch (error) {
      logger.error('Firebase tagging failed', error);
      process.exit(1);
    }
  });

// Firebase Consolidation Command
program
  .command('firebase:consolidate')
  .description('Consolidate multiple Firebase files into one')
  .requiredOption('-o, --output <file>', 'Output file path')
  .requiredOption('-i, --input <files...>', 'Input files to consolidate')
  .action(async (options) => {
    logger.info('Consolidating Firebase files');
    
    try {
      const { output, input } = options;
      const inputFiles = input.join(' ');
      
      execSync(`bash scripts/consolidate-files.sh ${output} ${inputFiles}`, { stdio: 'inherit' });
      
      logger.success('Firebase files consolidated successfully');
    } catch (error) {
      logger.error('Firebase consolidation failed', error);
      process.exit(1);
    }
  });

// Firebase Acceleration Command
program
  .command('firebase:accelerate')
  .description('Accelerate Firebase migration process')
  .option('-b, --batch-size <size>', 'Number of files to migrate in each batch', '5')
  .option('-a, --auto-confirm', 'Automatically confirm migrations without prompting')
  .action(async (options) => {
    logger.info('Accelerating Firebase migration');
    
    try {
      const autoConfirmFlag = options.autoConfirm ? '--auto-confirm' : '';
      const batchSizeFlag = options.batchSize ? `--batch-size=${options.batchSize}` : '';
      
      execSync(`bash scripts/accelerate-firebase-migration.sh ${autoConfirmFlag} ${batchSizeFlag}`, { stdio: 'inherit' });
      
      logger.success('Firebase acceleration completed');
    } catch (error) {
      logger.error('Firebase acceleration failed', error);
      process.exit(1);
    }
  });

// Memory Bank Commands
program
  .command('memory:update')
  .description('Update memory bank with current status')
  .action(async () => {
    logger.info('Updating memory bank');
    
    try {
      execSync('bash scripts/maintain-context.sh update', { stdio: 'inherit' });
      logger.success('Memory bank updated successfully');
    } catch (error) {
      logger.error('Memory bank update failed', error);
      process.exit(1);
    }
  });

program
  .command('memory:checkpoint')
  .description('Create a memory bank checkpoint')
  .action(async () => {
    logger.info('Creating memory bank checkpoint');
    
    try {
      execSync('bash scripts/maintain-context.sh checkpoint', { stdio: 'inherit' });
      logger.success('Memory bank checkpoint created successfully');
    } catch (error) {
      logger.error('Memory bank checkpoint failed', error);
      process.exit(1);
    }
  });

// Context Commands
program
  .command('context:status')
  .description('Show the current context status')
  .action(async () => {
    logger.info('Current context status');
    
    const context = contextAwareOperations.getContext();
    const trackedFiles = contextAwareOperations.getTrackedFiles ? contextAwareOperations.getTrackedFiles() : [];
    
    logger.section('Context Data');
    console.table(context);
    
    logger.section('Tracked Files');
    console.log(`Total tracked files: ${trackedFiles.length}`);
    
    if (trackedFiles.length > 0) {
      console.table(trackedFiles.map((file: string) => ({
        file,
        changed: contextAwareOperations.hasFileChanged ? contextAwareOperations.hasFileChanged(file) : 'Unknown'
      })));
    }
  });

program
  .command('context:clear')
  .description('Clear the current context')
  .action(async () => {
    logger.info('Clearing context');
    
    contextAwareOperations.clearContext();
    
    logger.success('Context cleared');
  });

// Testing Commands
program
  .command('test:unit')
  .description('Run unit tests')
  .option('-w, --watch', 'Run tests in watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .action(async (options) => {
    logger.info('Running unit tests');
    
    try {
      const watchFlag = options.watch ? '--watch' : '';
      const coverageFlag = options.coverage ? '--coverage' : '';
      
      execSync(`jest --testPathPattern='.*\\.unit\\.test\\.(js|ts|tsx)$' ${watchFlag} ${coverageFlag}`, { stdio: 'inherit' });
      
      logger.success('Unit tests completed');
    } catch (error) {
      logger.error('Unit tests failed', error);
      process.exit(1);
    }
  });

program
  .command('test:integration')
  .description('Run integration tests')
  .option('-w, --watch', 'Run tests in watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .action(async (options) => {
    logger.info('Running integration tests');
    
    try {
      const watchFlag = options.watch ? '--watch' : '';
      const coverageFlag = options.coverage ? '--coverage' : '';
      
      execSync(`jest --testPathPattern='.*\\.integration\\.test\\.(js|ts|tsx)$' ${watchFlag} ${coverageFlag}`, { stdio: 'inherit' });
      
      logger.success('Integration tests completed');
    } catch (error) {
      logger.error('Integration tests failed', error);
      process.exit(1);
    }
  });

program
  .command('test:e2e')
  .description('Run end-to-end tests')
  .option('-h, --headless', 'Run tests in headless mode', true)
  .option('-b, --browser <browser>', 'Browser to use for testing', 'chrome')
  .action(async (options) => {
    logger.info('Running end-to-end tests');
    
    try {
      const headlessFlag = options.headless ? '--headless' : '';
      const browserFlag = `--browser=${options.browser}`;
      
      execSync(`cypress run ${headlessFlag} ${browserFlag}`, { stdio: 'inherit' });
      
      logger.success('End-to-end tests completed');
    } catch (error) {
      logger.error('End-to-end tests failed', error);
      process.exit(1);
    }
  });

program
  .command('test:coverage')
  .description('Generate test coverage report')
  .action(async () => {
    logger.info('Generating test coverage report');
    
    try {
      execSync('jest --coverage', { stdio: 'inherit' });
      
      logger.success('Test coverage report generated');
    } catch (error) {
      logger.error('Test coverage report generation failed', error);
      process.exit(1);
    }
  });

// Linting Commands
program
  .command('lint:js')
  .description('Lint JavaScript and TypeScript files')
  .option('-f, --fix', 'Automatically fix problems')
  .action(async (options) => {
    logger.info('Linting JavaScript and TypeScript files');
    
    try {
      const fixFlag = options.fix ? '--fix' : '';
      
      execSync(`eslint . --ext .js,.jsx,.ts,.tsx ${fixFlag}`, { stdio: 'inherit' });
      
      logger.success('JavaScript and TypeScript linting completed');
    } catch (error) {
      logger.error('JavaScript and TypeScript linting failed', error);
      process.exit(1);
    }
  });

program
  .command('lint:css')
  .description('Lint CSS and style files')
  .option('-f, --fix', 'Automatically fix problems')
  .action(async (options) => {
    logger.info('Linting CSS and style files');
    
    try {
      const fixFlag = options.fix ? '--fix' : '';
      
      execSync(`stylelint "**/*.{css,scss}" ${fixFlag}`, { stdio: 'inherit' });
      
      logger.success('CSS and style linting completed');
    } catch (error) {
      logger.error('CSS and style linting failed', error);
      process.exit(1);
    }
  });

program
  .command('lint:fix')
  .description('Fix all auto-fixable lint issues')
  .action(async () => {
    logger.info('Fixing all auto-fixable lint issues');
    
    try {
      execSync('eslint . --ext .js,.jsx,.ts,.tsx --fix', { stdio: 'inherit' });
      execSync('stylelint "**/*.{css,scss}" --fix', { stdio: 'inherit' });
      
      logger.success('All auto-fixable lint issues fixed');
    } catch (error) {
      logger.error('Fixing lint issues failed', error);
      process.exit(1);
    }
  });

program
  .command('lint:staged')
  .description('Lint staged files')
  .action(async () => {
    logger.info('Linting staged files');
    
    try {
      execSync('lint-staged', { stdio: 'inherit' });
      
      logger.success('Staged files linting completed');
    } catch (error) {
      logger.error('Staged files linting failed', error);
      process.exit(1);
    }
  });

// Building Commands
program
  .command('build:dev')
  .description('Build the application for development')
  .action(async () => {
    logger.info('Building for development');
    
    try {
      execSync('expo build:web --no-pwa --dev', { stdio: 'inherit' });
      
      logger.success('Development build completed');
    } catch (error) {
      logger.error('Development build failed', error);
      process.exit(1);
    }
  });

program
  .command('build:prod')
  .description('Build the application for production')
  .action(async () => {
    logger.info('Building for production');
    
    try {
      execSync('expo build:web --no-pwa', { stdio: 'inherit' });
      
      logger.success('Production build completed');
    } catch (error) {
      logger.error('Production build failed', error);
      process.exit(1);
    }
  });

program
  .command('build:analyze')
  .description('Build and analyze bundle size')
  .action(async () => {
    logger.info('Building and analyzing bundle size');
    
    try {
      execSync('ANALYZE=true expo build:web --no-pwa', { stdio: 'inherit' });
      
      logger.success('Bundle analysis completed');
    } catch (error) {
      logger.error('Bundle analysis failed', error);
      process.exit(1);
    }
  });

program
  .command('build:watch')
  .description('Build and watch for changes')
  .action(async () => {
    logger.info('Building and watching for changes');
    
    try {
      execSync('expo start --web', { stdio: 'inherit' });
      
      logger.success('Build watch completed');
    } catch (error) {
      logger.error('Build watch failed', error);
      process.exit(1);
    }
  });

// Maintenance Commands
program
  .command('clean:orphans')
  .description('Clean orphaned files and dependencies')
  .action(async () => {
    logger.info('Cleaning orphaned files and dependencies');
    
    try {
      // Clean node_modules
      execSync('npm prune', { stdio: 'inherit' });
      
      // Clean orphaned files
      execSync('find . -type f -name "*.bak" -delete', { stdio: 'inherit' });
      execSync('find . -type f -name "*.tmp" -delete', { stdio: 'inherit' });
      execSync('find . -type f -name "*.log" -not -path "*/logs/*" -delete', { stdio: 'inherit' });
      
      logger.success('Orphaned files and dependencies cleaned');
    } catch (error) {
      logger.error('Cleaning orphaned files and dependencies failed', error);
      process.exit(1);
    }
  });

program
  .command('deduplicate:files')
  .description('Find and deduplicate files')
  .action(async () => {
    logger.info('Finding and deduplicating files');
    
    try {
      execSync('node ./scripts/roo-duplicates.js find', { stdio: 'inherit' });
      
      logger.success('File deduplication completed');
    } catch (error) {
      logger.error('File deduplication failed', error);
      process.exit(1);
    }
  });

program
  .command('migrate:firebase')
  .description('Migrate Firebase services to atomic architecture')
  .option('-f, --file <file>', 'Specific file to migrate')
  .option('-a, --all', 'Migrate all files')
  .action(async (options) => {
    logger.info('Migrating Firebase services');
    
    try {
      if (options.file) {
        execSync(`node scripts/migrate-firebase-atomic.js --file=${options.file}`, { stdio: 'inherit' });
      } else if (options.all) {
        execSync('node scripts/migrate-firebase-atomic.js --all', { stdio: 'inherit' });
      } else {
        logger.warn('No file specified. Use --file or --all option');
      }
      
      logger.success('Firebase migration completed');
    } catch (error) {
      logger.error('Firebase migration failed', error);
      process.exit(1);
    }
  });

// Deployment Commands
program
  .command('deploy')
  .description('Deploy the application')
  .option('-t, --target <target>', 'Deployment target (firebase, godaddy, all)', 'all')
  .action(async (options) => {
    logger.info(`Deploying to ${options.target}`);
    
    try {
      switch (options.target) {
        case 'firebase':
          execSync('npm run deploy', { stdio: 'inherit' });
          break;
        case 'godaddy':
          execSync('bash deploy-to-godaddy.sh', { stdio: 'inherit' });
          break;
        case 'all':
          execSync('bash deploy-combined.sh', { stdio: 'inherit' });
          break;
        default:
          logger.error(`Unknown deployment target: ${options.target}`);
          process.exit(1);
      }
      
      logger.success(`Deployment to ${options.target} completed successfully`);
    } catch (error) {
      logger.error(`Deployment to ${options.target} failed`, error);
      process.exit(1);
    }
  });

// Script Management Commands
program
  .command('scripts:consolidate')
  .description('Consolidate scattered scripts into the scripts directory')
  .option('--dry-run', 'Show what would be done without actually doing it')
  .option('--no-links', 'Don\'t create symbolic links in original locations')
  .option('--comprehensive', 'Perform comprehensive consolidation including reference updates')
  .action(async (options) => {
    logger.info('Consolidating scripts');
    
    try {
      const dryRunFlag = options.dryRun ? '--dry-run' : '';
      const noLinksFlag = options.links === false ? '--no-links' : '';
      const comprehensiveFlag = options.comprehensive ? '--comprehensive' : '';
      
      execSync(`bash scripts/consolidate-scripts.sh ${dryRunFlag} ${noLinksFlag} ${comprehensiveFlag}`, { stdio: 'inherit' });
      
      if (options.comprehensive) {
        logger.success('Comprehensive script consolidation completed');
        updateStatus('script-consolidation', 'success', 'Comprehensive script consolidation completed successfully');
      } else {
        logger.success('Basic script consolidation completed');
        updateStatus('script-consolidation', 'success', 'Basic script consolidation completed successfully');
      }
    } catch (error) {
      logger.error('Script consolidation failed', error);
      process.exit(1);
    }
  });

// CLI Package Commands
program
  .command('build:cli')
  .description('Build the CLI package (dry run)')
  .action(async () => {
    logger.info('Building CLI package (dry run)');
    
    try {
      execSync('bash tools/scripts/build-and-publish.sh --dry-run', { stdio: 'inherit' });
      
      logger.success('CLI package built successfully (dry run)');
    } catch (error) {
      logger.error('CLI package build failed', error);
      process.exit(1);
    }
  });

program
  .command('publish:cli')
  .description('Build and publish the CLI package')
  .action(async () => {
    logger.info('Building and publishing CLI package');
    
    try {
      execSync('bash tools/scripts/build-and-publish.sh', { stdio: 'inherit' });
      
      logger.success('CLI package published successfully');
    } catch (error) {
      logger.error('CLI package publish failed', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length === 2) {
  program.help();
}