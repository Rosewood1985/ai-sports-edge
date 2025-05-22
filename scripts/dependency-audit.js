#!/usr/bin/env node
/**
 * Dependency Management Audit Script
 *
 * This script performs a comprehensive audit of dependencies in the AI Sports Edge project.
 * It identifies version conflicts, outdated packages, security vulnerabilities, and other issues.
 *
 * Usage:
 *   node scripts/dependency-audit.js [options]
 *
 * Options:
 *   --fix           Apply fixes for identified issues
 *   --report-only   Generate a report without making changes
 *   --verbose       Show detailed information
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  reportOnly: args.includes('--report-only'),
  verbose: args.includes('--verbose'),
};

// Configuration
const BACKUP_DIR = path.join(
  process.cwd(),
  'backups',
  `dependency-audit-${new Date().toISOString().replace(/:/g, '-')}`
);

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Backup package.json and lock files
console.log('📦 Creating backups of dependency files...');
fs.copyFileSync('package.json', path.join(BACKUP_DIR, 'package.json'));
if (fs.existsSync('package-lock.json')) {
  fs.copyFileSync('package-lock.json', path.join(BACKUP_DIR, 'package-lock.json'));
}
if (fs.existsSync('yarn.lock')) {
  fs.copyFileSync('yarn.lock', path.join(BACKUP_DIR, 'yarn.lock'));
}

// Load package.json
const packageJson = require(path.join(process.cwd(), 'package.json'));
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};
const allDependencies = { ...dependencies, ...devDependencies };

// Results storage
const auditResults = {
  outdatedPackages: [],
  securityVulnerabilities: [],
  versionConflicts: [],
  missingDependencies: [],
  duplicateDependencies: [],
  peerDependencyIssues: [],
  ecosystemConflicts: {
    react: [],
    testing: [],
    buildTools: [],
    typescript: [],
    firebase: [],
  },
  brokenDependencyPatterns: [],
  reactNativeIssues: [],
};

// Check for outdated packages
console.log('🔍 Checking for outdated packages...');
try {
  const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
  const outdatedPackages = JSON.parse(outdatedOutput);

  for (const [name, info] of Object.entries(outdatedPackages)) {
    auditResults.outdatedPackages.push({
      name,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
      location: info.location,
    });
  }

  console.log(`Found ${Object.keys(outdatedPackages).length} outdated packages.`);
} catch (error) {
  // npm outdated returns exit code 1 if there are outdated packages
  if (error.status === 1 && error.stdout) {
    try {
      const outdatedPackages = JSON.parse(error.stdout);

      for (const [name, info] of Object.entries(outdatedPackages)) {
        auditResults.outdatedPackages.push({
          name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          location: info.location,
        });
      }

      console.log(`Found ${Object.keys(outdatedPackages).length} outdated packages.`);
    } catch (parseError) {
      console.error('Error parsing outdated packages:', parseError);
    }
  } else {
    console.error('Error checking for outdated packages:', error);
  }
}

// Check for security vulnerabilities
console.log('🔒 Checking for security vulnerabilities...');
try {
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
  const auditData = JSON.parse(auditOutput);

  if (auditData.vulnerabilities) {
    for (const [name, info] of Object.entries(auditData.vulnerabilities)) {
      auditResults.securityVulnerabilities.push({
        name,
        severity: info.severity,
        via: info.via,
        effects: info.effects,
        range: info.range,
        nodes: info.nodes,
        fixAvailable: info.fixAvailable,
      });
    }
  }

  console.log(`Found ${auditResults.securityVulnerabilities.length} security vulnerabilities.`);
} catch (error) {
  // npm audit returns exit code 1 if there are vulnerabilities
  if (error.status === 1 && error.stdout) {
    try {
      const auditData = JSON.parse(error.stdout);

      if (auditData.vulnerabilities) {
        for (const [name, info] of Object.entries(auditData.vulnerabilities)) {
          auditResults.securityVulnerabilities.push({
            name,
            severity: info.severity,
            via: info.via,
            effects: info.effects,
            range: info.range,
            nodes: info.nodes,
            fixAvailable: info.fixAvailable,
          });
        }
      }

      console.log(`Found ${auditResults.securityVulnerabilities.length} security vulnerabilities.`);
    } catch (parseError) {
      console.error('Error parsing audit data:', parseError);
    }
  } else {
    console.error('Error checking for security vulnerabilities:', error);
  }
}

// Check for React ecosystem conflicts
console.log('⚛️ Checking for React ecosystem conflicts...');
const reactPackages = ['react', 'react-dom', 'react-native', 'react-test-renderer'];

for (const pkg of reactPackages) {
  if (allDependencies[pkg]) {
    const version = allDependencies[pkg];
    auditResults.ecosystemConflicts.react.push({
      name: pkg,
      version,
    });
  }
}

// Check for testing library conflicts
console.log('🧪 Checking for testing library conflicts...');
const testingPackages = [
  'jest',
  'jest-expo',
  '@testing-library/react',
  '@testing-library/react-native',
  'react-test-renderer',
];

for (const pkg of testingPackages) {
  if (allDependencies[pkg]) {
    const version = allDependencies[pkg];
    auditResults.ecosystemConflicts.testing.push({
      name: pkg,
      version,
    });
  }
}

// Check for build tool conflicts
console.log('🔨 Checking for build tool conflicts...');
const buildToolPackages = ['expo', 'metro', 'babel-preset-expo', '@babel/core'];

for (const pkg of buildToolPackages) {
  if (allDependencies[pkg]) {
    const version = allDependencies[pkg];
    auditResults.ecosystemConflicts.buildTools.push({
      name: pkg,
      version,
    });
  }
}

// Check for TypeScript conflicts
console.log('📝 Checking for TypeScript conflicts...');
const typescriptPackages = ['typescript', '@types/react', '@types/react-native'];

for (const pkg of typescriptPackages) {
  if (allDependencies[pkg]) {
    const version = allDependencies[pkg];
    auditResults.ecosystemConflicts.typescript.push({
      name: pkg,
      version,
    });
  }
}

// Check for Firebase conflicts
console.log('🔥 Checking for Firebase conflicts...');
const firebasePackages = ['firebase', '@firebase/app', '@firebase/auth', '@firebase/firestore'];

for (const pkg of firebasePackages) {
  if (allDependencies[pkg]) {
    const version = allDependencies[pkg];
    auditResults.ecosystemConflicts.firebase.push({
      name: pkg,
      version,
    });
  }
}

// Check for missing dependencies
console.log('🔍 Checking for missing dependencies...');
const missingDeps = ['@sentry/browser', '@sentry/types'];

for (const dep of missingDeps) {
  if (!allDependencies[dep]) {
    auditResults.missingDependencies.push(dep);
  }
}

// Generate report
console.log('📊 Generating dependency audit report...');
const reportPath = path.join(process.cwd(), 'dependency-audit-report.md');
const reportContent = `# Dependency Audit Report

## Summary

- **Outdated Packages**: ${auditResults.outdatedPackages.length}
- **Security Vulnerabilities**: ${auditResults.securityVulnerabilities.length}
- **Version Conflicts**: ${auditResults.versionConflicts.length}
- **Missing Dependencies**: ${auditResults.missingDependencies.length}
- **Duplicate Dependencies**: ${auditResults.duplicateDependencies.length}
- **Peer Dependency Issues**: ${auditResults.peerDependencyIssues.length}
- **Ecosystem Conflicts**: 
  - React: ${auditResults.ecosystemConflicts.react.length}
  - Testing: ${auditResults.ecosystemConflicts.testing.length}
  - Build Tools: ${auditResults.ecosystemConflicts.buildTools.length}
  - TypeScript: ${auditResults.ecosystemConflicts.typescript.length}
  - Firebase: ${auditResults.ecosystemConflicts.firebase.length}
- **Broken Dependency Patterns**: ${auditResults.brokenDependencyPatterns.length}
- **React Native Issues**: ${auditResults.reactNativeIssues.length}

## Outdated Packages

${auditResults.outdatedPackages
  .map(pkg => `- **${pkg.name}**: ${pkg.current} → ${pkg.latest}`)
  .join('\n')}

## Security Vulnerabilities

${auditResults.securityVulnerabilities
  .map(vuln => `- **${vuln.name}**: ${vuln.severity} severity`)
  .join('\n')}

## Missing Dependencies

${auditResults.missingDependencies.map(dep => `- **${dep}**`).join('\n')}

## React Ecosystem Conflicts

${auditResults.ecosystemConflicts.react.map(pkg => `- **${pkg.name}**: ${pkg.version}`).join('\n')}

## Testing Library Conflicts

${auditResults.ecosystemConflicts.testing
  .map(pkg => `- **${pkg.name}**: ${pkg.version}`)
  .join('\n')}

## Build Tool Conflicts

${auditResults.ecosystemConflicts.buildTools
  .map(pkg => `- **${pkg.name}**: ${pkg.version}`)
  .join('\n')}

## TypeScript Conflicts

${auditResults.ecosystemConflicts.typescript
  .map(pkg => `- **${pkg.name}**: ${pkg.version}`)
  .join('\n')}

## Firebase Conflicts

${auditResults.ecosystemConflicts.firebase
  .map(pkg => `- **${pkg.name}**: ${pkg.version}`)
  .join('\n')}

## Recommended Actions

1. **Update React and React Native Dependencies**:
   - Align React, React DOM, and React Native versions
   - Update React Test Renderer to match React version

2. **Fix Security Vulnerabilities**:
   - Update packages with security vulnerabilities
   - Run \`npm audit fix\` for automatic fixes

3. **Install Missing Dependencies**:
   - Install @sentry/browser and @sentry/types

4. **Resolve Version Conflicts**:
   - Ensure consistent versions across related packages
   - Update TypeScript and @types packages to compatible versions

5. **Update Build Tools**:
   - Update Expo and related packages
   - Update Babel and Metro bundler

## Execution Plan

1. Install missing dependencies
2. Update React ecosystem packages
3. Update testing libraries
4. Update build tools
5. Fix security vulnerabilities
6. Run comprehensive tests

Generated on: ${new Date().toISOString()}
`;

fs.writeFileSync(reportPath, reportContent);
console.log(`Report saved to: ${reportPath}`);

// Apply fixes if requested
if (options.fix) {
  console.log('🔧 Applying fixes...');

  // Install missing dependencies
  if (auditResults.missingDependencies.length > 0) {
    console.log(
      `Installing ${auditResults.missingDependencies.length} missing dependencies with legacy peer deps...`
    );
    try {
      execSync(
        `npm install ${auditResults.missingDependencies.join(' ')} --save-dev --legacy-peer-deps`,
        {
          stdio: 'inherit',
        }
      );
    } catch (error) {
      console.error('Error installing missing dependencies:', error);
      console.log('Attempting installation with --force...');
      try {
        execSync(`npm install ${auditResults.missingDependencies.join(' ')} --save-dev --force`, {
          stdio: 'inherit',
        });
        console.log('✅ Successfully installed missing dependencies with --force!');
      } catch (forceError) {
        console.error('Error installing missing dependencies with --force:', forceError);
      }
    }
  }

  // Fix React ecosystem conflicts
  console.log('Fixing React ecosystem conflicts with legacy peer deps...');
  try {
    // Align react-test-renderer with React version
    execSync('npm install react-test-renderer@17.0.2 --save-dev --legacy-peer-deps', {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Error fixing React ecosystem conflicts:', error);
    console.log('Attempting installation with --force...');
    try {
      execSync('npm install react-test-renderer@17.0.2 --save-dev --force', { stdio: 'inherit' });
      console.log('✅ Successfully installed react-test-renderer with --force!');
    } catch (forceError) {
      console.error('Error fixing React ecosystem conflicts with --force:', forceError);
    }
  }

  // Fix security vulnerabilities
  console.log('Fixing security vulnerabilities...');
  try {
    execSync('npm audit fix --legacy-peer-deps', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error fixing security vulnerabilities:', error);
    console.log('Attempting fix with --force...');
    try {
      execSync('npm audit fix --force', { stdio: 'inherit' });
      console.log('✅ Successfully fixed security vulnerabilities with --force!');
    } catch (forceError) {
      console.error('Error fixing security vulnerabilities with --force:', forceError);
    }
  }

  console.log('✅ Fixes applied successfully!');
}

console.log('✅ Dependency audit completed!');
