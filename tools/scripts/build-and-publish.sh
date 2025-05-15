#!/bin/bash

# Build and publish the AI Sports Edge CLI as a global package
# Usage: ./tools/scripts/build-and-publish.sh [--dry-run]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      ;;
    --help)
      echo "Usage: $0 [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Show what would be done without actually publishing"
      echo "  --help       Show this help message"
      exit 0
      ;;
  esac
done

# Log function
log_message() {
  local message="$1"
  local color="${2:-$BLUE}"
  echo -e "${color}${message}${NC}"
}

# Error handling
set -e
trap 'log_message "An error occurred. Exiting..." "$RED"' ERR

# Check if we're in the right directory
if [ ! -d "tools" ]; then
  log_message "This script must be run from the project root directory" "$RED"
  exit 1
fi

# Create a temporary directory for building
BUILD_DIR="tools/dist"
log_message "Creating build directory: $BUILD_DIR"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy necessary files
log_message "Copying files to build directory"
cp tools/package.json "$BUILD_DIR/"
cp tools/README-global.md "$BUILD_DIR/README.md"
cp tools/jest.config.js "$BUILD_DIR/"
cp tools/types.d.ts "$BUILD_DIR/"

# Create tsconfig for the build
cat > "$BUILD_DIR/tsconfig.json" << EOF
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.ts"
  ]
}
EOF

# Create the src directory
mkdir -p "$BUILD_DIR/src"

# Copy source files
log_message "Copying source files"
cp -r tools/utils "$BUILD_DIR/src/"
cp tools/ops.ts "$BUILD_DIR/src/"

# Create the bin file
mkdir -p "$BUILD_DIR/bin"
cat > "$BUILD_DIR/bin/aisportsedge.js" << EOF
#!/usr/bin/env node

require('../dist/ops.js');
EOF
chmod +x "$BUILD_DIR/bin/aisportsedge.js"

# Update package.json
log_message "Updating package.json"
cd "$BUILD_DIR"
# Add bin entry to package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.bin = { 'aisportsedge': './bin/aisportsedge.js' };
pkg.main = './dist/ops.js';
pkg.types = './dist/ops.d.ts';
pkg.files = ['dist', 'bin', 'README.md'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
cd ../..

# Build the package
log_message "Building the package"
cd "$BUILD_DIR"
npm install
npm run build
cd ../..

# Publish the package
if [ "$DRY_RUN" = true ]; then
  log_message "Dry run: Would publish package from $BUILD_DIR" "$YELLOW"
else
  log_message "Publishing package"
  cd "$BUILD_DIR"
  npm publish
  cd ../..
  log_message "Package published successfully" "$GREEN"
fi

log_message "Build and publish process completed" "$GREEN"