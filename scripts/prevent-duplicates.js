#!/usr/bin/env node

// File Duplication Prevention - Roo Code Automation
// Detects potential file duplicates before commit

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const similarityChecker = require('./libs/file-similarity');

// Add logging
fs.appendFileSync('.roocode/tool_usage.log', `${new Date()}: Running ${path.basename(__filename)}\n`);

// Get staged files (would come from git in the hook version)
function getStagedFiles() {
  try {
    // For testing, just get some representative files
    return execSync('find ./src -type f -name "*.js" -o -name "*.jsx" | head -10')
      .toString()
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    return [];
  }
}

// Main function
async function checkForDuplicates() {
  console.log('🔍 Checking for potential file duplicates...');
  
  const stagedFiles = getStagedFiles();
  let potentialDuplicatesFound = false;
  
  for (const file of stagedFiles) {
    const similarFiles = await similarityChecker.findSimilarFiles(file);
    
    if (similarFiles.length > 0) {
      potentialDuplicatesFound = true;
      console.log(`\n⚠️  Potential duplicates found for: ${file}`);
      
      similarFiles.forEach((similarFile, i) => {
        console.log(`   ${i+1}. ${similarFile.path} (Combined: ${similarFile.combinedScore}% similar)`);
        console.log(`      - Name similarity: ${similarFile.nameSimilarityScore}%`);
        console.log(`      - Content similarity: ${similarFile.contentSimilarityScore}%`);
      });
      
      console.log('\n   Recommendation:');
      console.log('   - Review these files for potential duplication');
      console.log('   - Consider merging functionality or removing duplicates');
      console.log('   - Document decision in status/status-log.md');
    }
  }
  
  if (!potentialDuplicatesFound) {
    console.log('✅ No potential duplicates found!');
  }
  
  return potentialDuplicatesFound;
}

// Run the check
checkForDuplicates().then(found => {
  if (found) {
    console.log('\n📝 Log your decision in status/status-log.md before committing.');
  }
});