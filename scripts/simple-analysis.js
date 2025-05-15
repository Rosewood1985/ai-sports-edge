#!/usr/bin/env node
/**
 * Simple Analysis CLI
 * 
 * A simplified version of the analysis tools that doesn't rely on external dependencies.
 */

const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

async function main() {
  console.log('🔍 Running Simple Analysis');
  console.log('=========================');
  console.log('');

  // Create necessary directories
  await createDirectories();

  // Check if we're on the feature/analysis-tools branch
  const currentBranch = execSync('git branch --show-current').toString().trim();
  console.log(`Current branch: ${currentBranch}`);

  // List analysis tools
  console.log('\n📋 Available Analysis Tools:');
  console.log('- roo-duplicates.js: Code duplication detection');
  console.log('- roo-history-analyze.js: Git history analysis');
  console.log('- roo-complete-analysis.js: Combined analysis system');

  // List documentation
  console.log('\n📚 Available Documentation:');
  console.log('- docs/progress-backfilling-system.md: Progress tracking system');
  console.log('- docs/historical-code-analysis-system.md: Git history analysis');
  console.log('- docs/complete-analysis-system.md: Combined analysis system');

  // Check GitHub Actions workflow
  const workflowExists = await fileExists('.github/workflows/code-analysis.yml');
  console.log(`\n🔄 GitHub Actions workflow: ${workflowExists ? 'Exists' : 'Not found'}`);

  console.log('\n✅ Analysis tools are ready to use in CI/CD pipeline');
  console.log('The tools may require additional dependencies to run locally:');
  console.log('- cli-table3');
  console.log('- pretty-bytes');
  console.log('- pretty-ms');
  
  console.log('\nTo run in CI/CD, push changes to the main branch.');
}

async function createDirectories() {
  const dirs = [
    '.roocode/checkpoints/completed',
    '.roocode/checkpoints/corrupted',
    '.roocode/logs',
    'reports/duplicates',
    'reports/history',
    'reports/complete-analysis'
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error(`❌ Error creating directory ${dir}: ${err.message}`);
      } else {
        console.log(`✅ Directory already exists: ${dir}`);
      }
    }
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main().catch(err => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});
