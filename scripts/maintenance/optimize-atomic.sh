#!/bin/bash

# Script to optimize the performance of atomic components
# This script applies performance optimizations to atomic components

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="optimize-atomic-$TIMESTAMP.log"

# Start logging
echo "Starting atomic optimization at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Function to add React.memo to functional components
add_memo_to_component() {
    local file=$1
    local component_name=$(basename "$file" .js)
    
    # Skip if already memoized
    if grep -q "export default React.memo" "$file"; then
        echo "Component $component_name is already memoized, skipping..." | tee -a $LOG_FILE
        return
    fi
    
    # Skip if not a functional component
    if ! grep -q "const $component_name = " "$file" && ! grep -q "function $component_name" "$file"; then
        echo "Component $component_name is not a functional component, skipping..." | tee -a $LOG_FILE
        return
    fi
    
    echo "Adding React.memo to $component_name..." | tee -a $LOG_FILE
    
    # Add React.memo to export
    sed -i.bak "s/export default $component_name;/export default React.memo($component_name);/g" "$file"
    
    # Format with Prettier
    npx prettier --write "$file" >> $LOG_FILE 2>&1
}

# Function to add useCallback to event handlers
add_use_callback() {
    local file=$1
    
    # Skip if not a React component
    if ! grep -q "import React" "$file"; then
        echo "File $file is not a React component, skipping..." | tee -a $LOG_FILE
        return
    fi
    
    echo "Adding useCallback to event handlers in $file..." | tee -a $LOG_FILE
    
    # Find all handler functions
    grep -n "const handle[A-Z]" "$file" | while read -r line; do
        line_number=$(echo "$line" | cut -d: -f1)
        handler_name=$(echo "$line" | sed -E 's/.*const (handle[A-Za-z0-9_]+).*/\1/')
        
        # Skip if already using useCallback
        if grep -q "useCallback.*$handler_name" "$file"; then
            echo "Handler $handler_name is already using useCallback, skipping..." | tee -a $LOG_FILE
            continue
        fi
        
        # Find the end of the handler function
        end_line=$(tail -n +$line_number "$file" | grep -n "^  };" | head -1 | cut -d: -f1)
        end_line=$((line_number + end_line - 1))
        
        # Extract the handler function
        handler_function=$(sed -n "${line_number},${end_line}p" "$file")
        
        # Create the useCallback version
        callback_function=$(echo "$handler_function" | sed -E "s/const ($handler_name) = (async )?\(\) => \{/const \1 = React.useCallback(\2() => {/")
        callback_function="${callback_function}  }, []);"
        
        # Replace the handler function with the useCallback version
        sed -i.bak "${line_number},${end_line}c\\
$callback_function" "$file"
    done
    
    # Format with Prettier
    npx prettier --write "$file" >> $LOG_FILE 2>&1
}

# Function to add useMemo for computed values
add_use_memo() {
    local file=$1
    
    # Skip if not a React component
    if ! grep -q "import React" "$file"; then
        echo "File $file is not a React component, skipping..." | tee -a $LOG_FILE
        return
    fi
    
    echo "Adding useMemo for computed values in $file..." | tee -a $LOG_FILE
    
    # Find all computed values
    grep -n "const [a-z][A-Za-z0-9_]* = " "$file" | grep -v "useState\|useRef\|useCallback\|useMemo\|useEffect\|useContext\|handle[A-Z]" | while read -r line; do
        line_number=$(echo "$line" | cut -d: -f1)
        value_name=$(echo "$line" | sed -E 's/.*const ([a-z][A-Za-z0-9_]*).*/\1/')
        
        # Skip if already using useMemo
        if grep -q "useMemo.*$value_name" "$file"; then
            echo "Value $value_name is already using useMemo, skipping..." | tee -a $LOG_FILE
            continue
        fi
        
        # Skip if it's a simple assignment
        if grep -q "const $value_name = [^{(\[]" "$file"; then
            echo "Value $value_name is a simple assignment, skipping..." | tee -a $LOG_FILE
            continue
        fi
        
        # Extract the value expression
        value_expression=$(sed -n "${line_number}p" "$file" | sed -E "s/.*const $value_name = (.*)/\1/")
        
        # Create the useMemo version
        memo_expression="  const $value_name = React.useMemo(() => $value_expression, []);"
        
        # Replace the value expression with the useMemo version
        sed -i.bak "${line_number}c\\
$memo_expression" "$file"
    done
    
    # Format with Prettier
    npx prettier --write "$file" >> $LOG_FILE 2>&1
}

# Function to optimize imports
optimize_imports() {
    local file=$1
    
    echo "Optimizing imports in $file..." | tee -a $LOG_FILE
    
    # Add React.memo, React.useCallback, and React.useMemo imports if needed
    if grep -q "React.memo\|React.useCallback\|React.useMemo" "$file" && ! grep -q "{ memo, useCallback, useMemo }" "$file"; then
        # Check if React is imported
        if grep -q "import React" "$file"; then
            # Add named imports
            if grep -q "import React from 'react';" "$file"; then
                sed -i.bak "s/import React from 'react';/import React, { memo, useCallback, useMemo } from 'react';/g" "$file"
            elif grep -q "import React, {" "$file"; then
                sed -i.bak "s/import React, { /import React, { memo, useCallback, useMemo, /g" "$file"
            fi
            
            # Replace React.memo with memo, etc.
            sed -i.bak "s/React.memo/memo/g" "$file"
            sed -i.bak "s/React.useCallback/useCallback/g" "$file"
            sed -i.bak "s/React.useMemo/useMemo/g" "$file"
        fi
    fi
    
    # Format with Prettier
    npx prettier --write "$file" >> $LOG_FILE 2>&1
}

# Function to add PureComponent for class components
convert_to_pure_component() {
    local file=$1
    local component_name=$(basename "$file" .js)
    
    # Skip if not a class component
    if ! grep -q "class $component_name extends React.Component" "$file"; then
        echo "Component $component_name is not a class component, skipping..." | tee -a $LOG_FILE
        return
    fi
    
    # Skip if already a PureComponent
    if grep -q "class $component_name extends React.PureComponent" "$file"; then
        echo "Component $component_name is already a PureComponent, skipping..." | tee -a $LOG_FILE
        return
    fi
    
    echo "Converting $component_name to PureComponent..." | tee -a $LOG_FILE
    
    # Convert to PureComponent
    sed -i.bak "s/class $component_name extends React.Component/class $component_name extends React.PureComponent/g" "$file"
    
    # Remove shouldComponentUpdate if present
    sed -i.bak '/shouldComponentUpdate/,/}/d' "$file"
    
    # Format with Prettier
    npx prettier --write "$file" >> $LOG_FILE 2>&1
}

# Function to add lazy loading for components
add_lazy_loading() {
    local file=$1
    local component_name=$(basename "$file" .js)
    
    # Skip if already lazy loaded
    if grep -q "React.lazy" "$file"; then
        echo "Component $component_name is already lazy loaded, skipping..." | tee -a $LOG_FILE
        return
    fi
    
    echo "Adding lazy loading to $component_name..." | tee -a $LOG_FILE
    
    # Create a new file with lazy loading
    cat > "$file.lazy.js" << EOL
import React, { lazy, Suspense } from 'react';

// Lazy load the component
const $component_name = lazy(() => import('./$component_name'));

// Export a wrapped version with Suspense
export default function Lazy$component_name(props) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <$component_name {...props} />
    </Suspense>
  );
}
EOL
    
    # Format with Prettier
    npx prettier --write "$file.lazy.js" >> $LOG_FILE 2>&1
}

# Optimize atoms
echo "Optimizing atoms..." | tee -a $LOG_FILE
find atomic/atoms -name "*.js" | while read file; do
    add_memo_to_component "$file"
    add_use_callback "$file"
    add_use_memo "$file"
    optimize_imports "$file"
    convert_to_pure_component "$file"
done

# Optimize molecules
echo "Optimizing molecules..." | tee -a $LOG_FILE
find atomic/molecules -name "*.js" | while read file; do
    add_memo_to_component "$file"
    add_use_callback "$file"
    add_use_memo "$file"
    optimize_imports "$file"
    convert_to_pure_component "$file"
done

# Optimize organisms
echo "Optimizing organisms..." | tee -a $LOG_FILE
find atomic/organisms -name "*.js" | while read file; do
    add_memo_to_component "$file"
    add_use_callback "$file"
    add_use_memo "$file"
    optimize_imports "$file"
    convert_to_pure_component "$file"
done

# Optimize templates
echo "Optimizing templates..." | tee -a $LOG_FILE
find atomic/templates -name "*.js" | while read file; do
    add_memo_to_component "$file"
    add_use_callback "$file"
    add_use_memo "$file"
    optimize_imports "$file"
    convert_to_pure_component "$file"
done

# Optimize pages
echo "Optimizing pages..." | tee -a $LOG_FILE
find atomic/pages -name "*.js" | while read file; do
    add_memo_to_component "$file"
    add_use_callback "$file"
    add_use_memo "$file"
    optimize_imports "$file"
    convert_to_pure_component "$file"
    add_lazy_loading "$file"
done

# Remove backup files
find atomic -name "*.bak" -delete

# Run ESLint to fix any issues
echo "Running ESLint to fix any issues..." | tee -a $LOG_FILE
npx eslint --config .eslintrc.atomic.js --fix atomic/**/*.js >> $LOG_FILE 2>&1

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git add atomic
git commit -m "Optimize atomic components for performance

- Add React.memo to functional components
- Add useCallback to event handlers
- Add useMemo for computed values
- Convert class components to PureComponent
- Add lazy loading for pages
- Optimize imports"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push origin $(git rev-parse --abbrev-ref HEAD)

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Atomic optimization completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Optimization completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Optimization Summary:

1. Performance optimizations:
   - Added React.memo to functional components
   - Added useCallback to event handlers
   - Added useMemo for computed values
   - Converted class components to PureComponent
   - Added lazy loading for pages

2. Code quality improvements:
   - Optimized imports
   - Fixed ESLint issues
   - Formatted code with Prettier

The atomic components have been optimized for performance!
"