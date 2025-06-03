#!/usr/bin/env node
/**
 * Dependency Update Script for AI Sports Edge
 *
 * This script helps update project dependencies in a controlled manner.
 * It provides options for different update strategies and includes safety checks.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  // Packages that should not be automatically updated to major versions
  cautionPackages: [
    'react',
    'react-native',
    'expo',
    'firebase',
    '@react-navigation',
    'react-native-reanimated',
    'react-native-gesture-handler',
  ],

  // Packages that should be kept in sync (same version)
  syncGroups: [
    ['react', 'react-dom', 'react-test-renderer'],
    ['@react-navigation/native', '@react-navigation/stack', '@react-navigation/bottom-tabs'],
    ['firebase', '@firebase/app', '@firebase/auth', '@firebase/firestore'],
  ],

  // Dependencies to ignore during updates
  ignorePackages: [],

  // Maximum age of lockfile in days before warning
  maxLockfileAge: 30,

  // Backup directory
  backupDir: './backups/dependencies',

  // Use legacy peer deps flag (helps with React Native dependencies)
  useLegacyPeerDeps: true,

  // Known security vulnerabilities to prioritize
  securityPriorities: [
    'semver',
    'shell-quote',
    'react-native-reanimated',
    'body-parser',
    'braces',
    'minimist',
    'json5',
    'node-fetch',
  ],

  // Nested dependency patterns to check
  nestedDependencyPatterns: ['node_modules/**/node_modules/**'],
};

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompts the user with a question and returns the answer
 * @param {string} question - The question to ask
 * @returns {Promise<string>} - The user's answer
 */
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

/**
 * Executes a command and returns the output
 * @param {string} command - The command to execute
 * @param {boolean} silent - Whether to suppress output
 * @returns {string} - The command output
 */
function execute(command, silent = false) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
    });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Creates a backup of package.json and package-lock.json
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(config.backupDir, timestamp);

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }

  // Create timestamp directory
  fs.mkdirSync(backupPath, { recursive: true });

  // Copy package.json and package-lock.json
  fs.copyFileSync('package.json', path.join(backupPath, 'package.json'));

  if (fs.existsSync('package-lock.json')) {
    fs.copyFileSync('package-lock.json', path.join(backupPath, 'package-lock.json'));
  }

  if (fs.existsSync('yarn.lock')) {
    fs.copyFileSync('yarn.lock', path.join(backupPath, 'yarn.lock'));
  }

  console.log(`Backup created at ${backupPath}`);
  return backupPath;
}

/**
 * Restores a backup of package.json and package-lock.json
 * @param {string} backupPath - The path to the backup directory
 */
function restoreBackup(backupPath) {
  // Copy package.json and package-lock.json back
  fs.copyFileSync(path.join(backupPath, 'package.json'), 'package.json');

  if (fs.existsSync(path.join(backupPath, 'package-lock.json'))) {
    fs.copyFileSync(path.join(backupPath, 'package-lock.json'), 'package-lock.json');
  }

  if (fs.existsSync(path.join(backupPath, 'yarn.lock'))) {
    fs.copyFileSync(path.join(backupPath, 'yarn.lock'), 'yarn.lock');
  }

  console.log(`Restored backup from ${backupPath}`);
}

/**
 * Checks for outdated packages
 * @returns {Object} - Information about outdated packages
 */
function checkOutdated() {
  console.log('Checking for outdated packages...');

  // Use npm outdated to get information about outdated packages
  const outdatedOutput = execute('npm outdated --json', true);

  if (!outdatedOutput) {
    console.log('No outdated packages found or error occurred.');
    return {};
  }

  try {
    const outdated = JSON.parse(outdatedOutput);

    // Count packages by update type
    const counts = {
      patch: 0,
      minor: 0,
      major: 0,
      total: Object.keys(outdated).length,
    };

    // Group packages by update type
    const groups = {
      patch: [],
      minor: [],
      major: [],
    };

    // Process outdated packages
    for (const [pkg, info] of Object.entries(outdated)) {
      const current = info.current;
      const latest = info.latest;

      // Skip ignored packages
      if (config.ignorePackages.includes(pkg)) {
        continue;
      }

      // Determine update type
      const currentParts = current.split('.');
      const latestParts = latest.split('.');

      let updateType;
      if (currentParts[0] !== latestParts[0]) {
        updateType = 'major';
      } else if (currentParts[1] !== latestParts[1]) {
        updateType = 'minor';
      } else {
        updateType = 'patch';
      }

      counts[updateType]++;
      groups[updateType].push({
        name: pkg,
        current,
        latest,
        type: updateType,
      });
    }

    return { counts, groups, outdated };
  } catch (error) {
    console.error('Error parsing outdated packages:', error);
    return {};
  }
}

/**
 * Updates packages based on the specified strategy
 * @param {string} strategy - The update strategy (patch, minor, major, specific, or security)
 * @param {Array<string>} packages - Specific packages to update (for 'specific' strategy)
 */
async function updatePackages(strategy, packages = []) {
  console.log(`Updating packages using ${strategy} strategy...`);

  // Create backup before updating
  const backupPath = createBackup();

  try {
    let command;
    const legacyFlag = config.useLegacyPeerDeps ? ' --legacy-peer-deps' : '';

    switch (strategy) {
      case 'patch':
        // Update patch versions only
        command = `npm update${legacyFlag}`;
        break;

      case 'minor':
        // Get outdated info
        const { groups } = checkOutdated();

        // Update patch and minor versions
        const minorPackages = [...groups.patch.map(p => p.name), ...groups.minor.map(p => p.name)];

        if (minorPackages.length === 0) {
          console.log('No patch or minor updates available.');
          return;
        }

        command = `npm install${legacyFlag} ${minorPackages.map(p => `${p}@latest`).join(' ')}`;
        break;

      case 'major':
        // Update all packages to latest versions
        command = `npm install${legacyFlag} $(npm outdated --json | jq -r \'keys[] as $k | "\\($k)@\\(.[$k].latest)"\')`;
        break;

      case 'specific':
        // Update specific packages
        if (!packages || packages.length === 0) {
          console.log('No packages specified for update.');
          return;
        }

        command = `npm install${legacyFlag} ${packages.map(p => `${p}@latest`).join(' ')}`;
        break;

      case 'security':
        // Update security-focused packages
        await updateSecurityVulnerabilities();
        return;

      default:
        console.log(`Unknown strategy: ${strategy}`);
        return;
    }

    // Execute update command
    console.log(`Executing: ${command}`);
    execute(command);

    // Run tests to verify updates
    console.log('Running tests to verify updates...');
    const testResult = execute('npm test', true);

    if (!testResult) {
      console.log('Tests failed after update. Restoring backup...');
      restoreBackup(backupPath);
      return;
    }

    console.log('Update completed successfully!');

    // Check for peer dependency issues
    checkPeerDependencies();
  } catch (error) {
    console.error('Error updating packages:', error);
    console.log('Restoring backup...');
    restoreBackup(backupPath);
  }
}

/**
 * Updates packages with known security vulnerabilities
 */
async function updateSecurityVulnerabilities() {
  console.log('Updating packages with known security vulnerabilities...');

  // Create backup before updating
  const backupPath = createBackup();

  try {
    // Run npm audit to get vulnerability information
    console.log('Running security audit...');
    const auditOutput = execute('npm audit --json', true);

    if (!auditOutput) {
      console.log('No vulnerabilities found or error occurred.');
      return;
    }

    try {
      const auditData = JSON.parse(auditOutput);
      const vulnerabilities = auditData.vulnerabilities || {};

      // Extract vulnerable packages
      const vulnerablePackages = Object.keys(vulnerabilities);

      if (vulnerablePackages.length === 0) {
        console.log('No vulnerable packages found.');
        return;
      }

      console.log(`Found ${vulnerablePackages.length} vulnerable packages.`);

      // Prioritize packages based on security priorities
      const prioritizedPackages = [
        ...config.securityPriorities.filter(p => vulnerablePackages.includes(p)),
        ...vulnerablePackages.filter(p => !config.securityPriorities.includes(p)),
      ];

      // Group by severity
      const criticalPackages = [];
      const highPackages = [];
      const moderatePackages = [];

      for (const pkg of prioritizedPackages) {
        const vulnerability = vulnerabilities[pkg];
        if (vulnerability.severity === 'critical') {
          criticalPackages.push(pkg);
        } else if (vulnerability.severity === 'high') {
          highPackages.push(pkg);
        } else if (vulnerability.severity === 'moderate') {
          moderatePackages.push(pkg);
        }
      }

      console.log(
        `Critical: ${criticalPackages.length}, High: ${highPackages.length}, Moderate: ${moderatePackages.length}`
      );

      // Update critical packages first
      if (criticalPackages.length > 0) {
        console.log('Updating critical vulnerability packages...');
        const command = `npm install${
          config.useLegacyPeerDeps ? ' --legacy-peer-deps' : ''
        } ${criticalPackages.map(p => `${p}@latest`).join(' ')}`;
        execute(command);
      }

      // Update high severity packages
      if (highPackages.length > 0) {
        console.log('Updating high vulnerability packages...');
        const command = `npm install${
          config.useLegacyPeerDeps ? ' --legacy-peer-deps' : ''
        } ${highPackages.map(p => `${p}@latest`).join(' ')}`;
        execute(command);
      }

      // Check for nested dependencies with vulnerabilities
      console.log('Checking for nested dependencies with vulnerabilities...');
      const nestedDeps = findNestedDependencies();
      if (nestedDeps.length > 0) {
        console.log(`Found ${nestedDeps.length} nested dependencies that may need updating.`);
        console.log('Consider updating parent packages to address these nested dependencies:');
        console.log(nestedDeps.join('\n'));
      }

      // Run tests to verify updates
      console.log('Running tests to verify updates...');
      const testResult = execute('npm test', true);

      if (!testResult) {
        console.log('Tests failed after update. Restoring backup...');
        restoreBackup(backupPath);
        return;
      }

      console.log('Security updates completed successfully!');

      // Run audit again to see remaining issues
      console.log('Running audit again to check remaining issues...');
      execute('npm audit');
    } catch (error) {
      console.error('Error parsing audit data:', error);
      console.log('Restoring backup...');
      restoreBackup(backupPath);
    }
  } catch (error) {
    console.error('Error updating security vulnerabilities:', error);
    console.log('Restoring backup...');
    restoreBackup(backupPath);
  }
}

/**
 * Finds nested dependencies that might have vulnerabilities
 * @returns {Array<string>} - List of nested dependencies
 */
function findNestedDependencies() {
  console.log('Searching for nested dependencies...');

  try {
    // Use npm ls to find nested dependencies
    const nestedDeps = [];

    for (const pattern of config.nestedDependencyPatterns) {
      const command = `find node_modules -path "${pattern}" -name "package.json" | sort`;
      const output = execute(command, true);

      if (output) {
        const paths = output.trim().split('\n').filter(Boolean);

        for (const filePath of paths) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const pkg = JSON.parse(content);

            // Check if this is a package we're interested in
            if (config.securityPriorities.includes(pkg.name)) {
              nestedDeps.push(`${pkg.name}@${pkg.version} (${filePath})`);
            }
          } catch (err) {
            // Ignore errors reading individual package.json files
          }
        }
      }
    }

    return nestedDeps;
  } catch (error) {
    console.error('Error finding nested dependencies:', error);
    return [];
  }
}

/**
 * Checks for peer dependency issues
 */
function checkPeerDependencies() {
  console.log('Checking for peer dependency issues...');

  // Use npm ls to check for peer dependency issues
  const output = execute('npm ls', true);

  if (output && output.includes('peer dep missing')) {
    console.warn('Peer dependency issues detected:');
    execute('npm ls');

    console.log('\nYou may need to manually resolve these issues.');
  } else {
    console.log('No peer dependency issues detected.');
  }
}

/**
 * Checks for security vulnerabilities
 */
function checkVulnerabilities() {
  console.log('Checking for security vulnerabilities...');

  // Use npm audit to check for vulnerabilities
  execute('npm audit');
}

/**
 * Checks the age of the lockfile
 */
function checkLockfileAge() {
  console.log('Checking lockfile age...');

  const lockfilePath = fs.existsSync('package-lock.json')
    ? 'package-lock.json'
    : fs.existsSync('yarn.lock')
      ? 'yarn.lock'
      : null;

  if (!lockfilePath) {
    console.log('No lockfile found.');
    return;
  }

  const stats = fs.statSync(lockfilePath);
  const ageInDays = Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24));

  console.log(`Lockfile age: ${ageInDays} days`);

  if (ageInDays > config.maxLockfileAge) {
    console.warn(`Warning: Lockfile is older than ${config.maxLockfileAge} days.`);
    console.warn('Consider regenerating the lockfile with: npm ci --package-lock-only');
  }
}

/**
 * Displays a summary of the current dependencies
 */
function showDependencySummary() {
  console.log('Dependency Summary:');

  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // Count dependencies
  const depCount = Object.keys(packageJson.dependencies || {}).length;
  const devDepCount = Object.keys(packageJson.devDependencies || {}).length;

  console.log(`- Production dependencies: ${depCount}`);
  console.log(`- Development dependencies: ${devDepCount}`);
  console.log(`- Total: ${depCount + devDepCount}`);

  // Check for outdated packages
  const { counts } = checkOutdated();

  if (counts) {
    console.log('\nOutdated packages:');
    console.log(`- Patch updates: ${counts.patch}`);
    console.log(`- Minor updates: ${counts.minor}`);
    console.log(`- Major updates: ${counts.major}`);
    console.log(`- Total outdated: ${counts.total}`);
  }

  // Check lockfile age
  checkLockfileAge();
}

/**
 * Main function
 */
async function main() {
  console.log('AI Sports Edge Dependency Update Tool');
  console.log('====================================\n');

  showDependencySummary();

  console.log('\nUpdate strategies:');
  console.log('1. Patch updates only (safest)');
  console.log('2. Minor and patch updates (recommended)');
  console.log('3. All updates including major versions (may break compatibility)');
  console.log('4. Update specific packages');
  console.log('5. Security-focused updates (prioritizes fixing vulnerabilities)');
  console.log('6. Check for security vulnerabilities');
  console.log('7. Exit\n');

  const answer = await prompt('Select an option (1-7): ');

  switch (answer) {
    case '1':
      await updatePackages('patch');
      break;

    case '2':
      await updatePackages('minor');
      break;

    case '3':
      const confirm = await prompt(
        'Warning: Major updates may break compatibility. Continue? (y/n): '
      );
      if (confirm.toLowerCase() === 'y') {
        await updatePackages('major');
      }
      break;

    case '4':
      const packageList = await prompt('Enter package names separated by spaces: ');
      const packages = packageList.split(' ').filter(p => p.trim());
      await updatePackages('specific', packages);
      break;

    case '5':
      const securityConfirm = await prompt(
        'This will update packages with security vulnerabilities. Continue? (y/n): '
      );
      if (securityConfirm.toLowerCase() === 'y') {
        await updatePackages('security');
      }
      break;

    case '6':
      checkVulnerabilities();
      break;

    case '7':
      console.log('Exiting...');
      break;

    default:
      console.log('Invalid option. Exiting...');
      break;
  }

  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
});
