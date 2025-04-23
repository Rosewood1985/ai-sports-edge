// Script to update package.json with build:optimized script
const fs = require('fs');

try {
  // Read the package.json file
  const packageJsonPath = './package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Add the build:optimized script if it doesn't exist
  if (!packageJson.scripts['build:optimized']) {
    packageJson.scripts['build:optimized'] = 'NODE_ENV=production webpack --config webpack.prod.optimized.js';
    
    // Write the updated package.json back to disk
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Added build:optimized script to package.json');
  } else {
    console.log('build:optimized script already exists in package.json');
  }
} catch (error) {
  console.error('Error updating package.json:', error.message);
  process.exit(1);
}