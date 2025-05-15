#!/bin/bash
# analyze-component-relationships.sh
# Script to analyze component relationships and generate a component inventory
# Created: May 11, 2025

# Set up output directory
OUTPUT_DIR="docs/project-analysis"
mkdir -p "$OUTPUT_DIR"

echo "Analyzing AI Sports Edge component relationships..."

# Function to generate component inventory
generate_component_inventory() {
  echo "# Component Inventory" > "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "**Generated:** $(date)" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Count components by directory
  echo "## Components by Directory" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Directory | Component Count |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|-----------|----------------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Count components in /components
  components_count=$(find ./components -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)
  echo "| /components | $components_count |" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Count components in /screens
  screens_count=$(find ./screens -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)
  echo "| /screens | $screens_count |" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Count components in /atomic
  atomic_count=$(find ./atomic -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)
  echo "| /atomic | $atomic_count |" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Count components in /src
  src_count=$(find ./src -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)
  echo "| /src | $src_count |" >> "$OUTPUT_DIR/component-inventory.md"
  
  # List all components
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component List" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Component | Type | Directory | Lines | Props |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|-----------|------|-----------|-------|-------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Find all component files
  find . -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules" | sort | while read file; do
    component=$(basename "$file" | sed 's/\.[^.]*$//')
    directory=$(dirname "$file" | sed 's/\.\///')
    lines=$(wc -l < "$file")
    
    # Determine component type
    if [[ "$directory" == "screens" || "$directory" == */screens ]]; then
      type="Screen"
    elif [[ "$directory" == "components/ui" || "$directory" == */ui ]]; then
      type="UI Component"
    elif [[ "$directory" == "atomic/atoms" || "$directory" == */atoms ]]; then
      type="Atom"
    elif [[ "$directory" == "atomic/molecules" || "$directory" == */molecules ]]; then
      type="Molecule"
    elif [[ "$directory" == "atomic/organisms" || "$directory" == */organisms ]]; then
      type="Organism"
    elif [[ "$component" == *"Provider"* || "$component" == *"Context"* ]]; then
      type="Provider/Context"
    elif [[ "$component" == *"Screen"* || "$component" == *"Page"* ]]; then
      type="Screen"
    else
      type="Component"
    fi
    
    # Count props
    props_count=$(grep -o "props\." "$file" | wc -l)
    if [ $props_count -eq 0 ]; then
      # Try alternative prop patterns
      props_count=$(grep -o "{ *[a-zA-Z0-9_, ]*} *:" "$file" | wc -l)
    fi
    
    echo "| $component | $type | $directory | $lines | $props_count |" >> "$OUTPUT_DIR/component-inventory.md"
  done
}

# Function to analyze component usage
analyze_component_usage() {
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component Usage" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Component | Used In | Usage Count |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|-----------|---------|-------------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Find all component files
  find . -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules" | sort | while read file; do
    component=$(basename "$file" | sed 's/\.[^.]*$//')
    
    # Skip if component name is too generic (less than 4 characters)
    if [ ${#component} -lt 4 ]; then
      continue
    fi
    
    # Find usage of this component in other files
    usage_count=$(grep -r "<$component" --include="*.tsx" --include="*.jsx" . | grep -v "$file" | wc -l)
    
    # Only include components that are used in other files
    if [ $usage_count -gt 0 ]; then
      # Find where the component is used
      usage_files=$(grep -r "<$component" --include="*.tsx" --include="*.jsx" . | grep -v "$file" | cut -d':' -f1 | sort | uniq | sed 's/\.\///' | tr '\n' ', ' | sed 's/,$//')
      
      echo "| $component | $usage_files | $usage_count |" >> "$OUTPUT_DIR/component-inventory.md"
    fi
  done
}

# Function to analyze component dependencies
analyze_component_dependencies() {
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component Dependencies" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Component | Dependencies |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|-----------|--------------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Find all component files
  find . -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules" | sort | head -50 | while read file; do
    component=$(basename "$file" | sed 's/\.[^.]*$//')
    
    # Extract import statements
    imports=$(grep "import " "$file" | grep -v "from 'react'" | grep -v "from \"react\"" | sed 's/import//' | sed 's/from.*//' | tr '\n' ', ' | sed 's/,$//')
    
    echo "| $component | $imports |" >> "$OUTPUT_DIR/component-inventory.md"
  done
  
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "*Note: Only showing dependencies for the first 50 components.*" >> "$OUTPUT_DIR/component-inventory.md"
}

# Function to analyze component complexity
analyze_component_complexity() {
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component Complexity" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Component | Lines | Hooks | State Variables | Effects | Complexity Score |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|-----------|-------|-------|----------------|---------|-----------------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Find all component files
  find . -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules" | sort | while read file; do
    component=$(basename "$file" | sed 's/\.[^.]*$//')
    lines=$(wc -l < "$file")
    
    # Count hooks
    hooks_count=$(grep -o "use[A-Z][a-zA-Z]*" "$file" | wc -l)
    
    # Count state variables
    state_count=$(grep -o "useState" "$file" | wc -l)
    
    # Count effects
    effects_count=$(grep -o "useEffect" "$file" | wc -l)
    
    # Calculate complexity score (simple heuristic)
    complexity=$((lines / 10 + hooks_count * 2 + state_count * 3 + effects_count * 2))
    
    # Only include components with non-zero complexity
    if [ $complexity -gt 0 ]; then
      echo "| $component | $lines | $hooks_count | $state_count | $effects_count | $complexity |" >> "$OUTPUT_DIR/component-inventory.md"
    fi
  done | sort -t'|' -k6 -nr | head -20 >> "$OUTPUT_DIR/component-inventory.md"
  
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "*Note: Only showing the 20 most complex components based on a heuristic score.*" >> "$OUTPUT_DIR/component-inventory.md"
}

# Function to analyze component props
analyze_component_props() {
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component Props Analysis" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Component | Props Interface | Prop Count |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|-----------|----------------|------------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Find all TypeScript component files
  find . -name "*.tsx" | grep -v "node_modules" | sort | head -30 | while read file; do
    component=$(basename "$file" | sed 's/\.[^.]*$//')
    
    # Extract props interface
    props_interface=$(grep -A 20 "interface.*Props" "$file" | grep -v "export default" | head -10 | tr '\n' ' ' | sed 's/}/}\\n/g' | tr -s ' ')
    
    # Count props
    prop_count=$(echo "$props_interface" | grep -o ":" | wc -l)
    
    # Only include components with props
    if [ -n "$props_interface" ]; then
      echo "| $component | \`$props_interface\` | $prop_count |" >> "$OUTPUT_DIR/component-inventory.md"
    fi
  done
  
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "*Note: Only showing props for the first 30 TypeScript components.*" >> "$OUTPUT_DIR/component-inventory.md"
}

# Function to create component relationship diagram
create_component_relationship_diagram() {
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component Relationship Diagram" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "The following is a text-based representation of key component relationships:" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo '```' >> "$OUTPUT_DIR/component-inventory.md"
  echo "App" >> "$OUTPUT_DIR/component-inventory.md"
  echo "├── Navigation" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   ├── AuthNavigator" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   │   ├── LoginScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   │   ├── SignupScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   │   └── ForgotPasswordScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   └── MainNavigator" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│       ├── HomeScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│       ├── OddsScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│       ├── BettingScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│       ├── ProfileScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│       └── SettingsScreen" >> "$OUTPUT_DIR/component-inventory.md"
  echo "├── Providers" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   ├── AuthProvider" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   ├── ThemeProvider" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   ├── StripeProvider" >> "$OUTPUT_DIR/component-inventory.md"
  echo "│   └── LanguageProvider" >> "$OUTPUT_DIR/component-inventory.md"
  echo "└── Shared Components" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    ├── Atoms" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    │   ├── Button" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    │   ├── Input" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    │   └── Text" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    ├── Molecules" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    │   ├── Card" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    │   ├── Form" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    │   └── Modal" >> "$OUTPUT_DIR/component-inventory.md"
  echo "    └── Organisms" >> "$OUTPUT_DIR/component-inventory.md"
  echo "        ├── Header" >> "$OUTPUT_DIR/component-inventory.md"
  echo "        ├── Footer" >> "$OUTPUT_DIR/component-inventory.md"
  echo "        └── Sidebar" >> "$OUTPUT_DIR/component-inventory.md"
  echo '```' >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "*Note: This is a simplified representation of the component hierarchy. The actual relationships may be more complex.*" >> "$OUTPUT_DIR/component-inventory.md"
}

# Function to analyze component reuse
analyze_component_reuse() {
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component Reuse Analysis" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Component | Reuse Count | Reused In |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|-----------|-------------|-----------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Find all component files
  find . -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules" | sort | while read file; do
    component=$(basename "$file" | sed 's/\.[^.]*$//')
    
    # Skip if component name is too generic (less than 4 characters)
    if [ ${#component} -lt 4 ]; then
      continue
    fi
    
    # Find usage of this component in other files
    reuse_count=$(grep -r "<$component" --include="*.tsx" --include="*.jsx" . | grep -v "$file" | wc -l)
    
    # Only include components that are reused multiple times
    if [ $reuse_count -gt 2 ]; then
      # Find where the component is reused
      reuse_files=$(grep -r "<$component" --include="*.tsx" --include="*.jsx" . | grep -v "$file" | cut -d':' -f1 | sort | uniq | sed 's/\.\///' | head -5 | tr '\n' ', ' | sed 's/,$//')
      
      echo "| $component | $reuse_count | $reuse_files |" >> "$OUTPUT_DIR/component-inventory.md"
    fi
  done | sort -t'|' -k2 -nr | head -20 >> "$OUTPUT_DIR/component-inventory.md"
  
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "*Note: Only showing the 20 most reused components.*" >> "$OUTPUT_DIR/component-inventory.md"
}

# Function to analyze component patterns
analyze_component_patterns() {
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "## Component Patterns" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Analyze functional vs class components
  functional_count=$(grep -r "const.*:.*React\.FC" --include="*.tsx" --include="*.jsx" . | grep -v "node_modules" | wc -l)
  class_count=$(grep -r "class.*extends.*Component" --include="*.tsx" --include="*.jsx" . | grep -v "node_modules" | wc -l)
  
  echo "### Component Types" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "- Functional Components: $functional_count" >> "$OUTPUT_DIR/component-inventory.md"
  echo "- Class Components: $class_count" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  
  # Analyze hook usage
  echo "### Hook Usage" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Hook | Usage Count |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|------|-------------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  hooks=(
    "useState"
    "useEffect"
    "useContext"
    "useReducer"
    "useCallback"
    "useMemo"
    "useRef"
    "useImperativeHandle"
    "useLayoutEffect"
    "useDebugValue"
    "useAuth"
    "useNavigation"
    "useRoute"
    "useTheme"
    "useTranslation"
  )
  
  for hook in "${hooks[@]}"; do
    count=$(grep -r "$hook" --include="*.tsx" --include="*.jsx" . | grep -v "node_modules" | wc -l)
    echo "| $hook | $count |" >> "$OUTPUT_DIR/component-inventory.md"
  done
  
  # Analyze common patterns
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "### Common Patterns" >> "$OUTPUT_DIR/component-inventory.md"
  echo "" >> "$OUTPUT_DIR/component-inventory.md"
  echo "| Pattern | Count |" >> "$OUTPUT_DIR/component-inventory.md"
  echo "|---------|-------|" >> "$OUTPUT_DIR/component-inventory.md"
  
  patterns=(
    "Higher-Order Component (HOC)"
    "Render Props"
    "Compound Components"
    "Custom Hooks"
    "Context API"
    "Controlled Components"
  )
  
  pattern_regexes=(
    "export default [a-zA-Z0-9_]*\(.*\)"
    "render[pP]rop"
    "props\.children"
    "export const use[A-Z]"
    "createContext"
    "onChange.*value.*"
  )
  
  for i in "${!patterns[@]}"; do
    pattern=${patterns[$i]}
    regex=${pattern_regexes[$i]}
    count=$(grep -r "$regex" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" . | grep -v "node_modules" | wc -l)
    echo "| $pattern | $count |" >> "$OUTPUT_DIR/component-inventory.md"
  done
}

# Run all analysis functions
generate_component_inventory
analyze_component_usage
analyze_component_dependencies
analyze_component_complexity
analyze_component_props
create_component_relationship_diagram
analyze_component_reuse
analyze_component_patterns

echo "Component relationship analysis complete. Report generated in $OUTPUT_DIR/component-inventory.md"