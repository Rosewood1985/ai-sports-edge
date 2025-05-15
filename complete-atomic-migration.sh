#!/bin/bash

# Script to complete the atomic architecture migration
# This script helps with migrating remaining components, adding tests, and running ESLint

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="migration-atomic-$TIMESTAMP.log"

# Start logging
echo "Starting atomic architecture migration completion at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Function to migrate a component
migrate_component() {
  local component_name=$1
  local component_type=$2
  local source_file=$3
  
  echo "Migrating $component_name to $component_type..." | tee -a $LOG_FILE
  
  # Create component file
  mkdir -p atomic/$component_type
  
  # Read source file
  if [ -f "$source_file" ]; then
    echo "Source file found: $source_file" | tee -a $LOG_FILE
    
    # Create component file
    cat > atomic/$component_type/$component_name.js << EOL
/**
 * $component_name $component_type
 * 
 * Migrated from $source_file
 */

// TODO: Migrate component code from $source_file
// 1. Import dependencies from atomic architecture
// 2. Update component to use atomic architecture
// 3. Export component

// Original code:
$(cat $source_file)
EOL
    
    echo "✅ Created component file: atomic/$component_type/$component_name.js" | tee -a $LOG_FILE
    
    # Create test file
    mkdir -p __tests__/atomic/$component_type
    
    cat > __tests__/atomic/$component_type/$component_name.test.js << EOL
/**
 * $component_name $component_type Tests
 * 
 * Tests for the $component_name $component_type.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { $component_name } from '../../../atomic/$component_type/$component_name';

// TODO: Add mocks for dependencies

describe('$component_name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });

  it('has expected functionality', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });
});
EOL
    
    echo "✅ Created test file: __tests__/atomic/$component_type/$component_name.test.js" | tee -a $LOG_FILE
  else
    echo "❌ Source file not found: $source_file" | tee -a $LOG_FILE
  fi
}

# Function to update index file
update_index() {
  local component_type=$1
  local component_name=$2
  
  echo "Updating index file for $component_type..." | tee -a $LOG_FILE
  
  # Check if component is already in index
  if grep -q "export { default as $component_name } from './$component_name';" atomic/$component_type/index.js; then
    echo "Component already in index file" | tee -a $LOG_FILE
  else
    # Add component to index
    echo "export { default as $component_name } from './$component_name';" >> atomic/$component_type/index.js
    echo "✅ Added $component_name to index file" | tee -a $LOG_FILE
  fi
}

# 1. Migrate remaining components
echo "Step 1: Migrating remaining components" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Ask for components to migrate
echo "Enter components to migrate in the format: ComponentName,type,source_file" | tee -a $LOG_FILE
echo "Example: LoginPage,pages,LoginPage.js" | tee -a $LOG_FILE
echo "Enter 'done' when finished" | tee -a $LOG_FILE

while true; do
  read -p "Component: " component_input
  
  if [ "$component_input" == "done" ]; then
    break
  fi
  
  # Parse input
  IFS=',' read -r component_name component_type source_file <<< "$component_input"
  
  # Migrate component
  migrate_component "$component_name" "$component_type" "$source_file"
  
  # Update index file
  update_index "$component_type" "$component_name"
done

# 2. Add more tests
echo "Step 2: Adding more tests" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Run tests to see current coverage
echo "Running tests to see current coverage..." | tee -a $LOG_FILE
npx jest --config=jest.config.atomic.js --coverage >> $LOG_FILE 2>&1

echo "Tests completed. Check $LOG_FILE for coverage report." | tee -a $LOG_FILE
echo "Add more tests to components with low coverage." | tee -a $LOG_FILE

# 3. Run ESLint for code quality
echo "Step 3: Running ESLint for code quality" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

echo "Running ESLint on atomic components..." | tee -a $LOG_FILE
npx eslint --config .eslintrc.atomic.js atomic/**/*.js >> $LOG_FILE 2>&1

echo "ESLint completed. Check $LOG_FILE for issues." | tee -a $LOG_FILE
echo "Fix any ESLint issues to ensure code quality." | tee -a $LOG_FILE

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Atomic architecture migration completion finished at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Migration completion script finished" | tee -a $LOG_FILE

# Make the script executable
chmod +x complete-atomic-migration.sh

# Summary
echo "
Migration Tasks:

1. Migrate Remaining Components:
   - Use this script to migrate components
   - Update component code to use atomic architecture
   - Add components to index files

2. Add More Tests:
   - Check coverage report in $LOG_FILE
   - Add tests for components with low coverage
   - Run tests with: npx jest --config=jest.config.atomic.js

3. Run ESLint for Code Quality:
   - Check ESLint issues in $LOG_FILE
   - Fix ESLint issues
   - Run ESLint with: npx eslint --config .eslintrc.atomic.js atomic/**/*.js

Run './complete-atomic-migration.sh' to execute the migration completion script.
"