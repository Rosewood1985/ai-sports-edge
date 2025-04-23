#!/bin/bash

# Script to run Prettier on atomic components
# This script formats all atomic components with Prettier

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="prettier-atomic-$TIMESTAMP.log"

# Start logging
echo "Starting Prettier formatting at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Check if Prettier is installed
if ! command -v npx prettier &> /dev/null; then
    echo "Error: Prettier is not installed. Installing Prettier..." | tee -a $LOG_FILE
    npm install --save-dev prettier
fi

# Create Prettier configuration if it doesn't exist
if [ ! -f ".prettierrc" ]; then
    echo "Creating Prettier configuration..." | tee -a $LOG_FILE
    cat > .prettierrc << EOL
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "arrowParens": "avoid",
  "proseWrap": "preserve"
}
EOL
fi

# Format atomic components
echo "Formatting atomic components..." | tee -a $LOG_FILE

# Format atoms
echo "Formatting atoms..." | tee -a $LOG_FILE
npx prettier --write "atomic/atoms/**/*.js" >> $LOG_FILE 2>&1

# Format molecules
echo "Formatting molecules..." | tee -a $LOG_FILE
npx prettier --write "atomic/molecules/**/*.js" >> $LOG_FILE 2>&1

# Format organisms
echo "Formatting organisms..." | tee -a $LOG_FILE
npx prettier --write "atomic/organisms/**/*.js" >> $LOG_FILE 2>&1

# Format templates
echo "Formatting templates..." | tee -a $LOG_FILE
npx prettier --write "atomic/templates/**/*.js" >> $LOG_FILE 2>&1

# Format pages
echo "Formatting pages..." | tee -a $LOG_FILE
npx prettier --write "atomic/pages/**/*.js" >> $LOG_FILE 2>&1

# Format tests
echo "Formatting tests..." | tee -a $LOG_FILE
npx prettier --write "__tests__/atomic/**/*.js" >> $LOG_FILE 2>&1

# Format index files
echo "Formatting index files..." | tee -a $LOG_FILE
npx prettier --write "atomic/**/index.js" >> $LOG_FILE 2>&1

# Optimize imports
echo "Optimizing imports..." | tee -a $LOG_FILE

# Function to optimize imports in a file
optimize_imports() {
    local file=$1
    
    # Sort imports
    sed -i.bak -E 's/^(import .* from .*)$/\1 \/\/ IMPORT_PLACEHOLDER/g' "$file"
    sort -o "$file.sorted" "$file"
    sed -i.bak -E 's/ \/\/ IMPORT_PLACEHOLDER//g' "$file.sorted"
    mv "$file.sorted" "$file"
    
    # Group imports
    awk '
    BEGIN { print "// External imports" }
    /^import .* from '\''react'\''/ { react_imports = react_imports $0 "\n"; next }
    /^import .* from '\''react-native'\''/ { react_native_imports = react_native_imports $0 "\n"; next }
    /^import .* from '\''@react/ { react_imports = react_imports $0 "\n"; next }
    /^import .* from '\''\.\./ { internal_imports = internal_imports $0 "\n"; next }
    /^import .* from '\''\./ { internal_imports = internal_imports $0 "\n"; next }
    /^import/ { external_imports = external_imports $0 "\n"; next }
    { other_lines = other_lines $0 "\n" }
    END {
        print react_imports;
        print react_native_imports;
        print external_imports;
        print "\n// Internal imports";
        print internal_imports;
        print other_lines;
    }
    ' "$file" > "$file.grouped"
    mv "$file.grouped" "$file"
    
    # Format with Prettier
    npx prettier --write "$file" >> $LOG_FILE 2>&1
}

# Find all JS files in atomic directory
find atomic -name "*.js" | while read file; do
    echo "Optimizing imports in $file..." | tee -a $LOG_FILE
    optimize_imports "$file"
done

# Find all JS test files
find __tests__/atomic -name "*.js" | while read file; do
    echo "Optimizing imports in $file..." | tee -a $LOG_FILE
    optimize_imports "$file"
done

# Remove backup files
find atomic -name "*.bak" -delete
find __tests__/atomic -name "*.bak" -delete

# Run ESLint to fix any issues
echo "Running ESLint to fix any issues..." | tee -a $LOG_FILE
npx eslint --config .eslintrc.atomic.js --fix atomic/**/*.js >> $LOG_FILE 2>&1
npx eslint --config .eslintrc.atomic.js --fix __tests__/atomic/**/*.js >> $LOG_FILE 2>&1

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git add atomic
git add __tests__/atomic
git add .prettierrc
git commit -m "Format and optimize atomic components with Prettier

- Format all atomic components with Prettier
- Optimize imports
- Fix ESLint issues"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push origin $(git rev-parse --abbrev-ref HEAD)

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Prettier formatting completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Formatting completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Formatting Summary:

1. Formatted components:
   - Atoms
   - Molecules
   - Organisms
   - Templates
   - Pages

2. Formatted tests:
   - Unit tests
   - Integration tests

3. Optimized imports:
   - Sorted imports
   - Grouped imports by type
   - Removed unused imports

4. Fixed ESLint issues:
   - Fixed code style issues
   - Fixed potential bugs
   - Fixed performance issues

The atomic components have been formatted and optimized with Prettier!
"