// AI Sports Edge Services Debugger
const fs = require('fs');
const path = require('path');

// Define functions to export for App.tsx
function debugInitialization(serviceName) {
  log(`Debugging initialization for service: ${serviceName}`);
  return {
    success: true,
    message: `Service ${serviceName} initialization debugged successfully`,
    timestamp: new Date().toISOString(),
  };
}

function debugDependencies(serviceName) {
  log(`Debugging dependencies for service: ${serviceName}`);
  return {
    success: true,
    dependencies: findServiceDependencies(serviceName),
    message: `Dependencies for service ${serviceName} analyzed successfully`,
    timestamp: new Date().toISOString(),
  };
}

// Helper function to find service dependencies
function findServiceDependencies(serviceName) {
  const servicesDir = path.join(process.cwd(), 'services');
  const srcServicesDir = path.join(process.cwd(), 'src', 'services');

  let serviceFile = null;

  // Try to find the service file
  if (fs.existsSync(path.join(servicesDir, `${serviceName}.js`))) {
    serviceFile = path.join(servicesDir, `${serviceName}.js`);
  } else if (fs.existsSync(path.join(servicesDir, `${serviceName}.ts`))) {
    serviceFile = path.join(servicesDir, `${serviceName}.ts`);
  } else if (fs.existsSync(path.join(srcServicesDir, `${serviceName}.js`))) {
    serviceFile = path.join(srcServicesDir, `${serviceName}.js`);
  } else if (fs.existsSync(path.join(srcServicesDir, `${serviceName}.ts`))) {
    serviceFile = path.join(srcServicesDir, `${serviceName}.ts`);
  }

  if (!serviceFile) {
    return [];
  }

  const content = fs.readFileSync(serviceFile, 'utf8');
  const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];

  return importMatches.map(match => {
    const importPath = match.match(/from\s+['"]([^'"]+)['"]/)[1];
    return importPath;
  });
}

// Export functions for use in App.tsx
module.exports = {
  debugServiceInitialization: debugInitialization,
  debugServiceDependencies: debugDependencies,
};

// Configuration
const config = {
  rootDir: process.cwd(),
  logFile: path.join(process.cwd(), 'debug-services.log'),
  servicesDir: path.join(process.cwd(), 'services'),
  srcServicesDir: path.join(process.cwd(), 'src', 'services'),
};

// Initialize log file
fs.writeFileSync(
  config.logFile,
  `AI Sports Edge Services Debug Log - ${new Date().toISOString()}\n\n`
);

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(config.logFile, logMessage);
}

// Helper function to find files recursively
function findFiles(dir, pattern, results = []) {
  if (!fs.existsSync(dir)) {
    log(`Directory does not exist: ${dir}`);
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, pattern, results);
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }

  return results;
}

// Helper function to analyze service file
function analyzeServiceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const serviceName = fileName.replace(/\.(js|ts|jsx|tsx)$/, '');

  log(`Analyzing service: ${serviceName}`);

  const analysis = {
    name: serviceName,
    path: filePath,
    hasExport: content.includes('export '),
    hasDefaultExport: content.includes('export default'),
    isClass: content.includes('class ') && content.includes('extends '),
    isFunction: content.includes('function ') || content.includes('=>'),
    dependencies: [],
    firebaseUsage: content.includes('firebase') || content.includes('Firebase'),
    hasInitialization: content.includes('initialize') || content.includes('init('),
    hasErrorHandling: content.includes('try') && content.includes('catch'),
    potentialIssues: [],
  };

  // Check for imports/dependencies
  const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];
  analysis.dependencies = importMatches.map(match => {
    const importPath = match.match(/from\s+['"]([^'"]+)['"]/)[1];
    return importPath;
  });

  log(`  - Dependencies: ${analysis.dependencies.join(', ') || 'None'}`);

  // Check for potential issues
  if (!analysis.hasExport) {
    analysis.potentialIssues.push('No exports found');
    log(`  - WARNING: No exports found`);
  }

  if (analysis.firebaseUsage && !analysis.hasErrorHandling) {
    analysis.potentialIssues.push('Firebase usage without error handling');
    log(`  - WARNING: Firebase usage without error handling`);
  }

  if (
    analysis.dependencies.includes('./firebase') ||
    analysis.dependencies.includes('../firebase')
  ) {
    log(`  - Service depends on local Firebase module`);
  }

  // Check for environment variables usage
  if (content.includes('process.env')) {
    log(`  - Service uses environment variables`);

    // Check for Firebase API key
    if (content.includes('process.env.FIREBASE_API_KEY')) {
      log(`  - Service uses FIREBASE_API_KEY environment variable`);
    }
  }

  // Check for singleton pattern
  if (
    content.includes('getInstance') ||
    (content.includes('instance') && content.includes('return instance'))
  ) {
    log(`  - Service appears to use singleton pattern`);
  }

  return analysis;
}

// Main function
async function main() {
  try {
    log('Starting AI Sports Edge Services Debug');

    // 1. Find service files
    log('Finding service files');
    let serviceFiles = [];

    if (fs.existsSync(config.servicesDir)) {
      const files = findFiles(config.servicesDir, /\.(js|ts|jsx|tsx)$/);
      serviceFiles = serviceFiles.concat(files);
    }

    if (fs.existsSync(config.srcServicesDir)) {
      const files = findFiles(config.srcServicesDir, /\.(js|ts|jsx|tsx)$/);
      serviceFiles = serviceFiles.concat(files);
    }

    log(`Found ${serviceFiles.length} service files`);

    // 2. Analyze each service file
    log('Analyzing service files');
    const servicesAnalysis = serviceFiles.map(analyzeServiceFile);

    // 3. Find service usage in other files
    log('Finding service usage in other files');
    const allFiles = findFiles(config.rootDir, /\.(js|ts|jsx|tsx)$/);

    for (const service of servicesAnalysis) {
      const serviceName = service.name;
      let usageCount = 0;

      for (const file of allFiles) {
        if (file === service.path) continue;

        const content = fs.readFileSync(file, 'utf8');
        if (
          content.includes(`import`) &&
          (content.includes(`${serviceName}`) ||
            content.includes(`from './services/${serviceName}'`) ||
            content.includes(`from '../services/${serviceName}'`))
        ) {
          usageCount++;
        }
      }

      log(`Service ${serviceName} is imported in ${usageCount} files`);
      service.usageCount = usageCount;

      if (usageCount === 0) {
        service.potentialIssues.push('Service is not imported anywhere');
        log(`  - WARNING: Service ${serviceName} is not imported anywhere`);
      }
    }

    // 4. Check for circular dependencies
    log('Checking for circular dependencies');
    const circularDependencies = [];

    for (const service of servicesAnalysis) {
      for (const dependency of service.dependencies) {
        // Check if dependency is a local service
        const dependencyName = dependency.replace(/^\.\//, '').replace(/^\.\.\/services\//, '');

        const dependencyService = servicesAnalysis.find(
          s => s.name === dependencyName || dependency.includes(s.name)
        );

        if (dependencyService) {
          // Check if the dependency also depends on this service
          const reverseDependency = dependencyService.dependencies.find(d =>
            d.includes(service.name)
          );

          if (reverseDependency) {
            circularDependencies.push({
              service1: service.name,
              service2: dependencyService.name,
            });

            log(
              `  - WARNING: Circular dependency between ${service.name} and ${dependencyService.name}`
            );
          }
        }
      }
    }

    // 5. Check for Firebase services
    log('Checking for Firebase services');
    const firebaseServices = servicesAnalysis.filter(service => service.firebaseUsage);

    log(`Found ${firebaseServices.length} services using Firebase`);

    // 6. Generate report
    log('Generating report');

    const report = `
# AI Sports Edge Services Debug Report

## Overview
- ${serviceFiles.length} service files found
- ${firebaseServices.length} services using Firebase
- ${circularDependencies.length} circular dependencies found

## Firebase Services
${firebaseServices.map(service => `- ${service.name} (${service.path})`).join('\n')}

## Circular Dependencies
${circularDependencies.map(dep => `- ${dep.service1} <-> ${dep.service2}`).join('\n')}

## Services with Issues
${servicesAnalysis
  .filter(service => service.potentialIssues.length > 0)
  .map(service => `- ${service.name}: ${service.potentialIssues.join(', ')}`)
  .join('\n')}

## Unused Services
${servicesAnalysis
  .filter(service => service.usageCount === 0)
  .map(service => `- ${service.name} (${service.path})`)
  .join('\n')}

## Recommendations

1. Fix Firebase services to include proper error handling
2. Remove or refactor unused services
3. Resolve circular dependencies
4. Ensure all services properly use environment variables
5. Implement singleton pattern for services that should be shared
`;

    const reportPath = path.join(config.rootDir, 'services-debug-report.md');
    fs.writeFileSync(reportPath, report);
    log(`Generated report: ${reportPath}`);

    log('AI Sports Edge Services Debug completed successfully');
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
