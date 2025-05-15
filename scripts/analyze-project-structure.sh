#!/bin/bash
# analyze-project-structure.sh
# Script to analyze the AI Sports Edge project structure and generate reports
# Created: May 11, 2025

# Set up output directory
OUTPUT_DIR="docs/project-analysis"
mkdir -p "$OUTPUT_DIR"

echo "Analyzing AI Sports Edge project structure..."

# Function to count files by extension
count_files_by_extension() {
  echo "# File Extensions Analysis" > "$OUTPUT_DIR/file-extensions.md"
  echo "" >> "$OUTPUT_DIR/file-extensions.md"
  echo "| Extension | Count | Percentage |" >> "$OUTPUT_DIR/file-extensions.md"
  echo "|-----------|-------|------------|" >> "$OUTPUT_DIR/file-extensions.md"
  
  # Get total number of files
  total_files=$(find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" | wc -l)
  
  # Count files by extension
  find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" | grep -v "^\./\." | sed 's/.*\.//' | sort | uniq -c | sort -rn | while read count ext; do
    percentage=$(echo "scale=2; $count * 100 / $total_files" | bc)
    echo "| .$ext | $count | ${percentage}% |" >> "$OUTPUT_DIR/file-extensions.md"
  done
}

# Function to analyze directory structure
analyze_directory_structure() {
  echo "# Directory Structure Analysis" > "$OUTPUT_DIR/directory-structure.md"
  echo "" >> "$OUTPUT_DIR/directory-structure.md"
  echo "## Top-Level Directories" >> "$OUTPUT_DIR/directory-structure.md"
  echo "" >> "$OUTPUT_DIR/directory-structure.md"
  echo "| Directory | Description | File Count |" >> "$OUTPUT_DIR/directory-structure.md"
  echo "|-----------|-------------|------------|" >> "$OUTPUT_DIR/directory-structure.md"
  
  # Define directory descriptions
  declare -A dir_descriptions=(
    ["src"]="React Native and web frontend code"
    ["functions"]="Firebase Cloud Functions"
    ["scripts"]="CLI and automation scripts"
    ["public"]="Static assets"
    ["docs"]="Technical/user documentation"
    ["components"]="React components"
    ["screens"]="React Native screens"
    ["services"]="Service modules"
    ["utils"]="Utility functions"
    ["hooks"]="React hooks"
    ["types"]="TypeScript type definitions"
    ["constants"]="Constant values"
    ["config"]="Configuration files"
    ["assets"]="Media assets"
    ["styles"]="Style definitions"
    ["navigation"]="Navigation configuration"
    ["contexts"]="React contexts"
    ["api"]="API endpoints"
    ["atomic"]="Atomic design components"
    ["__tests__"]="Test files"
  )
  
  # Count files in each top-level directory
  for dir in $(find . -maxdepth 1 -type d | sort | grep -v "^\./\." | grep -v "node_modules" | sed 's/\.\///'); do
    if [ -z "$dir" ]; then
      continue
    fi
    
    file_count=$(find "./$dir" -type f -not -path "*/node_modules/*" -not -path "*/\.*" | wc -l)
    description=${dir_descriptions[$dir]:-""}
    
    echo "| $dir | $description | $file_count |" >> "$OUTPUT_DIR/directory-structure.md"
  done
}

# Function to analyze React components
analyze_components() {
  echo "# React Components Analysis" > "$OUTPUT_DIR/components-analysis.md"
  echo "" >> "$OUTPUT_DIR/components-analysis.md"
  
  # Count components by type
  echo "## Component Types" >> "$OUTPUT_DIR/components-analysis.md"
  echo "" >> "$OUTPUT_DIR/components-analysis.md"
  echo "| Type | Count |" >> "$OUTPUT_DIR/components-analysis.md"
  echo "|------|-------|" >> "$OUTPUT_DIR/components-analysis.md"
  
  # Count functional components
  functional_count=$(grep -r "const.*:.*React\.FC" --include="*.tsx" --include="*.jsx" . | wc -l)
  echo "| Functional Components | $functional_count |" >> "$OUTPUT_DIR/components-analysis.md"
  
  # Count class components
  class_count=$(grep -r "class.*extends.*Component" --include="*.tsx" --include="*.jsx" . | wc -l)
  echo "| Class Components | $class_count |" >> "$OUTPUT_DIR/components-analysis.md"
  
  # Count atomic components
  echo "" >> "$OUTPUT_DIR/components-analysis.md"
  echo "## Atomic Design Components" >> "$OUTPUT_DIR/components-analysis.md"
  echo "" >> "$OUTPUT_DIR/components-analysis.md"
  echo "| Type | Count |" >> "$OUTPUT_DIR/components-analysis.md"
  echo "|------|-------|" >> "$OUTPUT_DIR/components-analysis.md"
  
  atoms_count=$(find ./atomic/atoms -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
  molecules_count=$(find ./atomic/molecules -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
  organisms_count=$(find ./atomic/organisms -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
  
  echo "| Atoms | $atoms_count |" >> "$OUTPUT_DIR/components-analysis.md"
  echo "| Molecules | $molecules_count |" >> "$OUTPUT_DIR/components-analysis.md"
  echo "| Organisms | $organisms_count |" >> "$OUTPUT_DIR/components-analysis.md"
  
  # List top 10 most complex components
  echo "" >> "$OUTPUT_DIR/components-analysis.md"
  echo "## Top 10 Most Complex Components" >> "$OUTPUT_DIR/components-analysis.md"
  echo "(Based on file size)" >> "$OUTPUT_DIR/components-analysis.md"
  echo "" >> "$OUTPUT_DIR/components-analysis.md"
  echo "| Component | Lines | Size (bytes) |" >> "$OUTPUT_DIR/components-analysis.md"
  echo "|-----------|-------|-------------|" >> "$OUTPUT_DIR/components-analysis.md"
  
  find ./components ./src -name "*.tsx" -o -name "*.jsx" | xargs wc -l | sort -nr | head -10 | while read lines file; do
    if [ "$file" = "total" ]; then
      continue
    fi
    size=$(stat -f "%z" "$file")
    component=$(basename "$file")
    echo "| $component | $lines | $size |" >> "$OUTPUT_DIR/components-analysis.md"
  done
}

# Function to analyze services
analyze_services() {
  echo "# Services Analysis" > "$OUTPUT_DIR/services-analysis.md"
  echo "" >> "$OUTPUT_DIR/services-analysis.md"
  
  # List all services
  echo "## Service Modules" >> "$OUTPUT_DIR/services-analysis.md"
  echo "" >> "$OUTPUT_DIR/services-analysis.md"
  echo "| Service | Type | Lines | Description |" >> "$OUTPUT_DIR/services-analysis.md"
  echo "|---------|------|-------|-------------|" >> "$OUTPUT_DIR/services-analysis.md"
  
  find ./services -name "*.js" -o -name "*.ts" | sort | while read file; do
    service=$(basename "$file")
    lines=$(wc -l < "$file")
    
    # Try to extract description from file
    description=$(grep -A 1 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    # Determine type
    if grep -q "firebase" "$file"; then
      type="Firebase"
    elif grep -q "stripe" "$file"; then
      type="Payment"
    elif grep -q "analytics" "$file"; then
      type="Analytics"
    elif grep -q "api" "$file"; then
      type="API"
    else
      type="Utility"
    fi
    
    echo "| $service | $type | $lines | $description |" >> "$OUTPUT_DIR/services-analysis.md"
  done
  
  # Also check atomic services
  find ./atomic -name "*.js" -o -name "*.ts" | grep -i "service" | sort | while read file; do
    service=$(basename "$file")
    lines=$(wc -l < "$file")
    
    # Try to extract description from file
    description=$(grep -A 1 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    # Determine type
    if grep -q "firebase" "$file"; then
      type="Firebase"
    elif grep -q "stripe" "$file"; then
      type="Payment"
    elif grep -q "analytics" "$file"; then
      type="Analytics"
    elif grep -q "api" "$file"; then
      type="API"
    else
      type="Utility"
    fi
    
    echo "| $service | $type | $lines | $description |" >> "$OUTPUT_DIR/services-analysis.md"
  done
}

# Function to analyze Firebase functions
analyze_firebase_functions() {
  echo "# Firebase Functions Analysis" > "$OUTPUT_DIR/firebase-functions-analysis.md"
  echo "" >> "$OUTPUT_DIR/firebase-functions-analysis.md"
  
  # List all Firebase functions
  echo "## Cloud Functions" >> "$OUTPUT_DIR/firebase-functions-analysis.md"
  echo "" >> "$OUTPUT_DIR/firebase-functions-analysis.md"
  echo "| Function | Type | Lines | Description |" >> "$OUTPUT_DIR/firebase-functions-analysis.md"
  echo "|----------|------|-------|-------------|" >> "$OUTPUT_DIR/firebase-functions-analysis.md"
  
  find ./functions -name "*.js" -o -name "*.ts" | grep -v "node_modules" | sort | while read file; do
    func=$(basename "$file")
    lines=$(wc -l < "$file")
    
    # Try to extract description from file
    description=$(grep -A 1 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    # Determine type
    if grep -q "stripe" "$file"; then
      type="Payment"
    elif grep -q "notification" "$file"; then
      type="Notification"
    elif grep -q "auth" "$file"; then
      type="Authentication"
    elif grep -q "firestore" "$file"; then
      type="Database"
    else
      type="Utility"
    fi
    
    echo "| $func | $type | $lines | $description |" >> "$OUTPUT_DIR/firebase-functions-analysis.md"
  done
}

# Function to analyze external dependencies
analyze_dependencies() {
  echo "# External Dependencies Analysis" > "$OUTPUT_DIR/dependencies-analysis.md"
  echo "" >> "$OUTPUT_DIR/dependencies-analysis.md"
  
  if [ -f "package.json" ]; then
    echo "## NPM Dependencies" >> "$OUTPUT_DIR/dependencies-analysis.md"
    echo "" >> "$OUTPUT_DIR/dependencies-analysis.md"
    echo "| Dependency | Version | Type |" >> "$OUTPUT_DIR/dependencies-analysis.md"
    echo "|------------|---------|------|" >> "$OUTPUT_DIR/dependencies-analysis.md"
    
    # Extract dependencies from package.json
    dependencies=$(grep -A 100 '"dependencies"' package.json | grep -B 100 -m 1 '},' | grep -v '"dependencies"' | grep -v '},')
    dev_dependencies=$(grep -A 100 '"devDependencies"' package.json | grep -B 100 -m 1 '}' | grep -v '"devDependencies"' | grep -v '}')
    
    # Process dependencies
    echo "$dependencies" | grep '"' | while read line; do
      dep=$(echo "$line" | cut -d'"' -f2)
      version=$(echo "$line" | cut -d'"' -f4)
      echo "| $dep | $version | Production |" >> "$OUTPUT_DIR/dependencies-analysis.md"
    done
    
    # Process dev dependencies
    echo "$dev_dependencies" | grep '"' | while read line; do
      dep=$(echo "$line" | cut -d'"' -f2)
      version=$(echo "$line" | cut -d'"' -f4)
      echo "| $dep | $version | Development |" >> "$OUTPUT_DIR/dependencies-analysis.md"
    done
  else
    echo "package.json not found. Cannot analyze dependencies." >> "$OUTPUT_DIR/dependencies-analysis.md"
  fi
  
  # Check for other external dependencies
  echo "" >> "$OUTPUT_DIR/dependencies-analysis.md"
  echo "## External Services" >> "$OUTPUT_DIR/dependencies-analysis.md"
  echo "" >> "$OUTPUT_DIR/dependencies-analysis.md"
  echo "| Service | Usage |" >> "$OUTPUT_DIR/dependencies-analysis.md"
  echo "|---------|-------|" >> "$OUTPUT_DIR/dependencies-analysis.md"
  
  # Check for Firebase
  if grep -q "firebase" $(find . -name "*.js" -o -name "*.ts" | grep -v "node_modules" | head -1); then
    echo "| Firebase | Authentication, Database, Cloud Functions |" >> "$OUTPUT_DIR/dependencies-analysis.md"
  fi
  
  # Check for Stripe
  if grep -q "stripe" $(find . -name "*.js" -o -name "*.ts" | grep -v "node_modules" | head -1); then
    echo "| Stripe | Payment Processing |" >> "$OUTPUT_DIR/dependencies-analysis.md"
  fi
  
  # Check for OneSignal
  if grep -q "onesignal" $(find . -name "*.js" -o -name "*.ts" | grep -v "node_modules" | head -1); then
    echo "| OneSignal | Push Notifications |" >> "$OUTPUT_DIR/dependencies-analysis.md"
  fi
  
  # Check for other common services
  if grep -q "analytics" $(find . -name "*.js" -o -name "*.ts" | grep -v "node_modules" | head -1); then
    echo "| Analytics | User Behavior Tracking |" >> "$OUTPUT_DIR/dependencies-analysis.md"
  fi
}

# Function to analyze technical debt
analyze_technical_debt() {
  echo "# Technical Debt Analysis" > "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  
  # Look for TODO comments
  echo "## TODO Comments" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "| File | Line | TODO Comment |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "|------|------|-------------|" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  
  grep -r "TODO" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | while read line; do
    file=$(echo "$line" | cut -d':' -f1)
    line_num=$(echo "$line" | cut -d':' -f2)
    comment=$(echo "$line" | cut -d':' -f3-)
    echo "| $file | $line_num | $comment |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  done
  
  # Look for FIXME comments
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "## FIXME Comments" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "| File | Line | FIXME Comment |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "|------|------|--------------|" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  
  grep -r "FIXME" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | while read line; do
    file=$(echo "$line" | cut -d':' -f1)
    line_num=$(echo "$line" | cut -d':' -f2)
    comment=$(echo "$line" | cut -d':' -f3-)
    echo "| $file | $line_num | $comment |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  done
  
  # Look for deprecated API usage
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "## Deprecated API Usage" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "| File | Line | Deprecated API |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "|------|------|---------------|" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  
  grep -r "deprecated" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | while read line; do
    file=$(echo "$line" | cut -d':' -f1)
    line_num=$(echo "$line" | cut -d':' -f2)
    comment=$(echo "$line" | cut -d':' -f3-)
    echo "| $file | $line_num | $comment |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  done
  
  # Look for console.log statements
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "## Console.log Statements" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "| File | Line | Console Statement |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "|------|------|------------------|" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  
  grep -r "console.log" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | head -20 | while read line; do
    file=$(echo "$line" | cut -d':' -f1)
    line_num=$(echo "$line" | cut -d':' -f2)
    comment=$(echo "$line" | cut -d':' -f3-)
    echo "| $file | $line_num | $comment |" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  done
  
  # Count console.log statements
  total_console_logs=$(grep -r "console.log" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | wc -l)
  echo "" >> "$OUTPUT_DIR/technical-debt-analysis.md"
  echo "Total console.log statements: $total_console_logs" >> "$OUTPUT_DIR/technical-debt-analysis.md"
}

# Function to create a master index
create_master_index() {
  echo "# AI Sports Edge Project Analysis" > "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "**Generated:** $(date)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "## Table of Contents" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "1. [Directory Structure Analysis](./directory-structure.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "2. [File Extensions Analysis](./file-extensions.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "3. [Components Analysis](./components-analysis.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "4. [Services Analysis](./services-analysis.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "5. [Firebase Functions Analysis](./firebase-functions-analysis.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "6. [Dependencies Analysis](./dependencies-analysis.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "7. [Technical Debt Analysis](./technical-debt-analysis.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "8. [Development History](./development-history.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "9. [Architectural Overview](./architectural-overview.md)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "## Project Summary" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "AI Sports Edge is a React Native (Expo) app using atomic architecture. The app provides sports betting analytics, odds comparison, and premium features through subscription models. It integrates with Firebase for backend services and Stripe for payment processing." >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "### Key Technologies" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- React Native (Expo)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Firebase (Authentication, Firestore, Cloud Functions)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Stripe (Payment Processing)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- TypeScript" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Atomic Design Architecture" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "### Core Features" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Sports Betting Analytics" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Odds Comparison" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Subscription Management" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- User Authentication" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Push Notifications" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
  echo "- Multilingual Support (English/Spanish)" >> "$OUTPUT_DIR/00-MASTER-INDEX.md"
}

# Run all analysis functions
count_files_by_extension
analyze_directory_structure
analyze_components
analyze_services
analyze_firebase_functions
analyze_dependencies
analyze_technical_debt
create_master_index

echo "Project structure analysis complete. Reports generated in $OUTPUT_DIR"