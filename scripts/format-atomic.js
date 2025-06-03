/**
 * Format Atomic Components Script
 *
 * This script formats all files in the atomic directory structure
 * using the project's Prettier configuration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const ATOMIC_DIR = path.join(__dirname, '..', 'atomic');
const PRETTIER_CONFIG = path.join(__dirname, '..', '.prettierrc');

// Ensure the atomic directory exists
if (!fs.existsSync(ATOMIC_DIR)) {
  console.error(`Error: Atomic directory not found at ${ATOMIC_DIR}`);
  process.exit(1);
}

// Ensure the Prettier config exists
if (!fs.existsSync(PRETTIER_CONFIG)) {
  console.error(`Error: Prettier config not found at ${PRETTIER_CONFIG}`);
  process.exit(1);
}

/**
 * Format files in a directory
 * @param {string} dir - Directory to format
 */
function formatDirectory(dir) {
  try {
    console.log(`Formatting files in ${dir}...`);

    // Format all JavaScript and TypeScript files in the directory
    const command = `npx prettier --config ${PRETTIER_CONFIG} --write "${dir}/**/*.{js,jsx,ts,tsx}"`;
    execSync(command, { stdio: 'inherit' });

    console.log(`Successfully formatted files in ${dir}`);
  } catch (error) {
    console.error(`Error formatting files in ${dir}:`, error.message);
  }
}

// Format each atomic level
const atomicLevels = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];

atomicLevels.forEach(level => {
  const levelDir = path.join(ATOMIC_DIR, level);

  if (fs.existsSync(levelDir)) {
    formatDirectory(levelDir);
  } else {
    console.log(`Skipping ${level} - directory not found`);
  }
});

console.log('All atomic components formatted successfully!');
