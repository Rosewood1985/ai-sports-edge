#!/bin/bash
# generate-api-documentation.sh
# Script to generate API documentation for all services in the AI Sports Edge project
# Created: May 11, 2025

# Set up output directory
OUTPUT_DIR="docs/project-analysis/api-docs"
mkdir -p "$OUTPUT_DIR"

echo "Generating API documentation for AI Sports Edge services..."

# Function to extract JSDoc comments from a file
extract_jsdoc_comments() {
  local file=$1
  local output_file=$2
  local service_name=$(basename "$file" | sed 's/\.[^.]*$//')
  
  echo "# $service_name API Documentation" > "$output_file"
  echo "" >> "$output_file"
  echo "**File:** \`$file\`" >> "$output_file"
  echo "" >> "$output_file"
  
  # Extract file description if available
  file_description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
  if [ -n "$file_description" ]; then
    echo "## Description" >> "$output_file"
    echo "" >> "$output_file"
    echo "$file_description" >> "$output_file"
    echo "" >> "$output_file"
  fi
  
  # Extract exported functions/methods
  echo "## API Reference" >> "$output_file"
  echo "" >> "$output_file"
  
  # Look for export declarations
  grep -n "export " "$file" | while read -r line; do
    line_num=$(echo "$line" | cut -d':' -f1)
    export_line=$(echo "$line" | cut -d':' -f2-)
    
    # Extract function/method name
    if [[ "$export_line" =~ export[[:space:]]+(const|function|class|interface|type|enum)[[:space:]]+([a-zA-Z0-9_]+) ]]; then
      export_type="${BASH_REMATCH[1]}"
      export_name="${BASH_REMATCH[2]}"
      
      # Look for JSDoc comment above the export
      jsdoc_start=$((line_num - 20))
      if [ $jsdoc_start -lt 1 ]; then
        jsdoc_start=1
      fi
      
      jsdoc_comment=$(sed -n "${jsdoc_start},${line_num}p" "$file" | grep -A 20 "/\*\*" | grep -B 20 "\*/")
      
      if [ -n "$jsdoc_comment" ]; then
        echo "### $export_name" >> "$output_file"
        echo "" >> "$output_file"
        
        # Extract description
        description=$(echo "$jsdoc_comment" | grep -v "/\*\*" | grep -v "\*/" | grep -v "@" | sed 's/\*//g' | sed 's/^ *//')
        if [ -n "$description" ]; then
          echo "$description" >> "$output_file"
          echo "" >> "$output_file"
        fi
        
        # Extract parameters
        params=$(echo "$jsdoc_comment" | grep "@param" | sed 's/\*//g' | sed 's/^ *//')
        if [ -n "$params" ]; then
          echo "**Parameters:**" >> "$output_file"
          echo "" >> "$output_file"
          echo "$params" | while read -r param; do
            echo "- $param" >> "$output_file"
          done
          echo "" >> "$output_file"
        fi
        
        # Extract return value
        returns=$(echo "$jsdoc_comment" | grep "@return" | sed 's/\*//g' | sed 's/^ *//')
        if [ -n "$returns" ]; then
          echo "**Returns:**" >> "$output_file"
          echo "" >> "$output_file"
          echo "$returns" | while read -r ret; do
            echo "- $ret" >> "$output_file"
          done
          echo "" >> "$output_file"
        fi
        
        # Extract example
        example=$(echo "$jsdoc_comment" | grep -A 10 "@example" | grep -v "@example" | sed 's/\*//g' | sed 's/^ *//')
        if [ -n "$example" ]; then
          echo "**Example:**" >> "$output_file"
          echo "" >> "$output_file"
          echo '```javascript' >> "$output_file"
          echo "$example" >> "$output_file"
          echo '```' >> "$output_file"
          echo "" >> "$output_file"
        fi
      else
        # No JSDoc comment, just add the export line
        echo "### $export_name" >> "$output_file"
        echo "" >> "$output_file"
        echo "```typescript" >> "$output_file"
        echo "$export_line" >> "$output_file"
        echo "```" >> "$output_file"
        echo "" >> "$output_file"
      fi
    fi
  done
  
  # If no exports were found, try to extract function declarations
  if [ ! -s "$output_file" ]; then
    grep -n "function " "$file" | while read -r line; do
      line_num=$(echo "$line" | cut -d':' -f1)
      function_line=$(echo "$line" | cut -d':' -f2-)
      
      # Extract function name
      if [[ "$function_line" =~ function[[:space:]]+([a-zA-Z0-9_]+) ]]; then
        function_name="${BASH_REMATCH[1]}"
        
        echo "### $function_name" >> "$output_file"
        echo "" >> "$output_file"
        echo "```typescript" >> "$output_file"
        echo "$function_line" >> "$output_file"
        echo "```" >> "$output_file"
        echo "" >> "$output_file"
      fi
    done
  fi
}

# Function to generate service documentation
generate_service_docs() {
  echo "## Services" > "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "| Service | Description | File |" >> "$OUTPUT_DIR/index.md"
  echo "|---------|-------------|------|" >> "$OUTPUT_DIR/index.md"
  
  # Process services directory
  mkdir -p "$OUTPUT_DIR/services"
  find ./services -name "*.js" -o -name "*.ts" | sort | while read file; do
    service_name=$(basename "$file" | sed 's/\.[^.]*$//')
    output_file="$OUTPUT_DIR/services/$service_name.md"
    
    extract_jsdoc_comments "$file" "$output_file"
    
    # Extract description for index
    description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    echo "| [$service_name](./services/$service_name.md) | $description | $file |" >> "$OUTPUT_DIR/index.md"
  done
  
  # Process atomic services
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "## Atomic Services" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "| Service | Type | Description | File |" >> "$OUTPUT_DIR/index.md"
  echo "|---------|------|-------------|------|" >> "$OUTPUT_DIR/index.md"
  
  mkdir -p "$OUTPUT_DIR/atomic"
  
  # Process atoms
  find ./atomic/atoms -name "*.js" -o -name "*.ts" 2>/dev/null | sort | while read file; do
    service_name=$(basename "$file" | sed 's/\.[^.]*$//')
    output_file="$OUTPUT_DIR/atomic/atom-$service_name.md"
    
    extract_jsdoc_comments "$file" "$output_file"
    
    # Extract description for index
    description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    echo "| [$service_name](./atomic/atom-$service_name.md) | Atom | $description | $file |" >> "$OUTPUT_DIR/index.md"
  done
  
  # Process molecules
  find ./atomic/molecules -name "*.js" -o -name "*.ts" 2>/dev/null | sort | while read file; do
    service_name=$(basename "$file" | sed 's/\.[^.]*$//')
    output_file="$OUTPUT_DIR/atomic/molecule-$service_name.md"
    
    extract_jsdoc_comments "$file" "$output_file"
    
    # Extract description for index
    description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    echo "| [$service_name](./atomic/molecule-$service_name.md) | Molecule | $description | $file |" >> "$OUTPUT_DIR/index.md"
  done
  
  # Process organisms
  find ./atomic/organisms -name "*.js" -o -name "*.ts" 2>/dev/null | sort | while read file; do
    service_name=$(basename "$file" | sed 's/\.[^.]*$//')
    output_file="$OUTPUT_DIR/atomic/organism-$service_name.md"
    
    extract_jsdoc_comments "$file" "$output_file"
    
    # Extract description for index
    description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    echo "| [$service_name](./atomic/organism-$service_name.md) | Organism | $description | $file |" >> "$OUTPUT_DIR/index.md"
  done
}

# Function to generate Firebase functions documentation
generate_firebase_docs() {
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "## Firebase Functions" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "| Function | Description | File |" >> "$OUTPUT_DIR/index.md"
  echo "|----------|-------------|------|" >> "$OUTPUT_DIR/index.md"
  
  mkdir -p "$OUTPUT_DIR/firebase"
  find ./functions -name "*.js" -o -name "*.ts" | grep -v "node_modules" | sort | while read file; do
    function_name=$(basename "$file" | sed 's/\.[^.]*$//')
    output_file="$OUTPUT_DIR/firebase/$function_name.md"
    
    extract_jsdoc_comments "$file" "$output_file"
    
    # Extract description for index
    description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    echo "| [$function_name](./firebase/$function_name.md) | $description | $file |" >> "$OUTPUT_DIR/index.md"
  done
}

# Function to generate utility documentation
generate_utility_docs() {
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "## Utilities" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "| Utility | Description | File |" >> "$OUTPUT_DIR/index.md"
  echo "|---------|-------------|------|" >> "$OUTPUT_DIR/index.md"
  
  mkdir -p "$OUTPUT_DIR/utils"
  find ./utils -name "*.js" -o -name "*.ts" | sort | while read file; do
    utility_name=$(basename "$file" | sed 's/\.[^.]*$//')
    output_file="$OUTPUT_DIR/utils/$utility_name.md"
    
    extract_jsdoc_comments "$file" "$output_file"
    
    # Extract description for index
    description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    echo "| [$utility_name](./utils/$utility_name.md) | $description | $file |" >> "$OUTPUT_DIR/index.md"
  done
}

# Function to generate hooks documentation
generate_hooks_docs() {
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "## React Hooks" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "| Hook | Description | File |" >> "$OUTPUT_DIR/index.md"
  echo "|------|-------------|------|" >> "$OUTPUT_DIR/index.md"
  
  mkdir -p "$OUTPUT_DIR/hooks"
  find ./hooks -name "*.js" -o -name "*.ts" | sort | while read file; do
    hook_name=$(basename "$file" | sed 's/\.[^.]*$//')
    output_file="$OUTPUT_DIR/hooks/$hook_name.md"
    
    extract_jsdoc_comments "$file" "$output_file"
    
    # Extract description for index
    description=$(grep -A 5 "/**" "$file" | grep -v "/**" | grep -v "*/" | head -1 | sed 's/\*//g' | sed 's/^ *//')
    if [ -z "$description" ]; then
      description="No description available"
    fi
    
    echo "| [$hook_name](./hooks/$hook_name.md) | $description | $file |" >> "$OUTPUT_DIR/index.md"
  done
}

# Function to create master API documentation index
create_api_docs_index() {
  echo "# AI Sports Edge API Documentation" > "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "**Generated:** $(date)" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "This documentation provides a comprehensive reference for all services, functions, utilities, and hooks in the AI Sports Edge project." >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "## Table of Contents" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "1. [Services](./api-docs/index.md#services)" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "2. [Atomic Services](./api-docs/index.md#atomic-services)" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "3. [Firebase Functions](./api-docs/index.md#firebase-functions)" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "4. [Utilities](./api-docs/index.md#utilities)" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "5. [React Hooks](./api-docs/index.md#react-hooks)" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "## How to Use This Documentation" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "Each section contains links to detailed documentation for individual modules. The documentation includes:" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Function/method signatures" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Parameter descriptions" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Return value descriptions" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Usage examples (where available)" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "## Updating This Documentation" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "This documentation is automatically generated from JSDoc comments in the source code. To update the documentation:" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "1. Add or update JSDoc comments in your code" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "2. Run the documentation generator script: \`./scripts/generate-api-documentation.sh\`" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "## Best Practices for API Documentation" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Use JSDoc comments for all exported functions, classes, and interfaces" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Include descriptions for all parameters" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Document return values" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Provide usage examples for complex functions" >> "$OUTPUT_DIR/../api-documentation.md"
  echo "- Keep documentation up-to-date when changing code" >> "$OUTPUT_DIR/../api-documentation.md"
}

# Run all documentation generation functions
generate_service_docs
generate_firebase_docs
generate_utility_docs
generate_hooks_docs
create_api_docs_index

echo "API documentation generation complete. Documentation available in $OUTPUT_DIR"