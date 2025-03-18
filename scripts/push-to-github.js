/**
 * Push to GitHub
 * This script pushes all changes to the GitHub repository
 */

const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Execute a command and log the output
 * @param {string} command - Command to execute
 * @param {string} label - Label for the command
 */
function executeCommand(command, label) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${label} ===${colors.reset}\n`);
  console.log(`${colors.dim}$ ${command}${colors.reset}\n`);
  
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    console.log(output);
    console.log(`${colors.green}✓ Command completed successfully${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Command failed with error:${colors.reset}\n`);
    console.error(error.message);
    return false;
  }
}

/**
 * Main function to push changes to GitHub
 */
async function pushToGitHub() {
  console.log(`${colors.bright}${colors.magenta}Pushing Changes to GitHub${colors.reset}\n`);
  
  // Step 1: Check git status
  console.log(`${colors.yellow}Checking git status...${colors.reset}`);
  executeCommand('git status', 'Git Status');
  
  // Step 2: Add all changes
  console.log(`${colors.yellow}Adding all changes...${colors.reset}`);
  if (!executeCommand('git add .', 'Git Add')) {
    console.error(`${colors.red}Failed to add changes${colors.reset}`);
    process.exit(1);
  }
  
  // Step 3: Commit changes
  const commitMessage = 'Add ML API integration with multiple sports APIs';
  console.log(`${colors.yellow}Committing changes...${colors.reset}`);
  if (!executeCommand(`git commit -m "${commitMessage}"`, 'Git Commit')) {
    console.error(`${colors.red}Failed to commit changes${colors.reset}`);
    process.exit(1);
  }
  
  // Step 4: Push to GitHub
  console.log(`${colors.yellow}Pushing to GitHub...${colors.reset}`);
  if (!executeCommand('git push origin main', 'Git Push')) {
    console.error(`${colors.red}Failed to push to GitHub${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${colors.bright}${colors.green}Successfully pushed changes to GitHub!${colors.reset}\n`);
}

// Run the push function
pushToGitHub().catch(error => {
  console.error(`${colors.red}Error pushing to GitHub:${colors.reset}`, error);
  process.exit(1);
});