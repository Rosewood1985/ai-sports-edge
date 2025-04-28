#!/bin/bash

# UI Debugging Script
# This script helps identify and fix UI issues across the app

# Exit on error
set -e

# Display script header
echo "=========================================="
echo "AI Sports Edge UI Debugging Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "Error: app.json not found. Please run this script from the project root directory."
    exit 1
fi

# Function to check for UI issues in a file
check_ui_issues() {
    local file=$1
    local issues=0
    
    # Check for hardcoded dimensions without responsive considerations
    if grep -q "width: [0-9]\+" "$file" || grep -q "height: [0-9]\+" "$file"; then
        echo "⚠️  Potential non-responsive dimensions in $file"
        grep -n "width: [0-9]\+" "$file" | head -5
        grep -n "height: [0-9]\+" "$file" | head -5
        issues=$((issues + 1))
    fi
    
    # Check for absolute positioning without responsive considerations
    if grep -q "position: 'absolute'" "$file"; then
        echo "⚠️  Absolute positioning detected in $file (may cause overlap issues)"
        grep -n "position: 'absolute'" "$file" | head -5
        issues=$((issues + 1))
    fi
    
    # Check for hardcoded font sizes without responsive considerations
    if grep -q "fontSize: [0-9]\+" "$file"; then
        echo "⚠️  Potential non-responsive font sizes in $file"
        grep -n "fontSize: [0-9]\+" "$file" | head -5
        issues=$((issues + 1))
    fi
    
    # Check for missing accessibility props
    if grep -q "TouchableOpacity" "$file" || grep -q "Button" "$file" || grep -q "Pressable" "$file"; then
        if ! grep -q "accessible" "$file" || ! grep -q "accessibilityLabel" "$file"; then
            echo "⚠️  Missing accessibility props in $file"
            issues=$((issues + 1))
        fi
    fi
    
    # Check for potential z-index conflicts
    if grep -q "zIndex:" "$file"; then
        echo "⚠️  Multiple z-index values in $file (potential stacking issues)"
        grep -n "zIndex:" "$file" | head -5
        issues=$((issues + 1))
    fi
    
    # Check for potential overflow issues
    if ! grep -q "overflow:" "$file" && (grep -q "absolute" "$file" || grep -q "ScrollView" "$file"); then
        echo "⚠️  Potential overflow issues in $file"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# Function to check for API call optimization issues
check_api_optimization() {
    local file=$1
    local issues=0
    
    # Check for API calls without caching
    if grep -q "fetch(" "$file" || grep -q "axios" "$file"; then
        if ! grep -q "cache" "$file" && ! grep -q "memoize" "$file"; then
            echo "⚠️  API calls without caching in $file"
            issues=$((issues + 1))
        fi
    fi
    
    # Check for multiple API calls that could be batched
    if [ $(grep -c "fetch(" "$file") -gt 2 ] || [ $(grep -c "axios" "$file") -gt 2 ]; then
        echo "⚠️  Multiple API calls in $file (consider batching)"
        issues=$((issues + 1))
    fi
    
    # Check for missing error handling in API calls
    if (grep -q "fetch(" "$file" || grep -q "axios" "$file") && ! grep -q "catch" "$file"; then
        echo "⚠️  Missing error handling for API calls in $file"
        issues=$((issues + 1))
    fi
    
    # Check for missing loading states
    if (grep -q "fetch(" "$file" || grep -q "axios" "$file") && ! grep -q "loading" "$file" && ! grep -q "isLoading" "$file"; then
        echo "⚠️  Missing loading state for API calls in $file"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# Function to check for performance issues
check_performance() {
    local file=$1
    local issues=0
    
    # Check for missing memo or useMemo
    if grep -q "function" "$file" && grep -q "props" "$file" && ! grep -q "memo" "$file" && ! grep -q "useMemo" "$file"; then
        echo "⚠️  Component without memoization in $file"
        issues=$((issues + 1))
    fi
    
    # Check for inline function definitions in render
    if grep -q "=>" "$file" && grep -q "render" "$file"; then
        echo "⚠️  Inline function definitions in render method in $file"
        issues=$((issues + 1))
    fi
    
    # Check for large images without resizing
    if grep -q "Image" "$file" && ! grep -q "resizeMode" "$file"; then
        echo "⚠️  Images without resizeMode in $file"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# Main debugging process
echo "Starting UI debugging process..."
echo ""

# Check components directory
echo "Checking components directory..."
component_issues=0
for file in $(find ./components -name "*.tsx" -o -name "*.jsx"); do
    echo "Analyzing $file..."
    check_ui_issues "$file"
    component_issues=$((component_issues + $?))
    check_api_optimization "$file"
    component_issues=$((component_issues + $?))
    check_performance "$file"
    component_issues=$((component_issues + $?))
    echo ""
done

# Check screens directory
echo "Checking screens directory..."
screen_issues=0
for file in $(find ./screens -name "*.tsx" -o -name "*.jsx"); do
    echo "Analyzing $file..."
    check_ui_issues "$file"
    screen_issues=$((screen_issues + $?))
    check_api_optimization "$file"
    screen_issues=$((screen_issues + $?))
    check_performance "$file"
    screen_issues=$((screen_issues + $?))
    echo ""
done

# Check services directory for API optimization
echo "Checking services directory for API optimization..."
service_issues=0
for file in $(find ./services -name "*.ts" -o -name "*.js"); do
    echo "Analyzing $file..."
    check_api_optimization "$file"
    service_issues=$((service_issues + $?))
    echo ""
done

# Summary
total_issues=$((component_issues + screen_issues + service_issues))
echo "=========================================="
echo "UI Debugging Summary"
echo "=========================================="
echo "Component issues found: $component_issues"
echo "Screen issues found: $screen_issues"
echo "Service issues found: $service_issues"
echo "Total issues found: $total_issues"
echo ""

if [ $total_issues -eq 0 ]; then
    echo "No UI issues found! 🎉"
else
    echo "Please address the issues listed above to improve UI quality."
fi

echo ""
echo "Next steps:"
echo "1. Run the app on different screen sizes to verify responsive design"
echo "2. Test with VoiceOver/TalkBack to verify accessibility"
echo "3. Check for color contrast issues using a contrast checker"
echo "4. Verify that all text is properly internationalized"
echo "5. Test performance with the Performance Monitor"
echo ""
echo "For live testing, run:"
echo "- Web: npm run start:web"
echo "- iOS: npx expo start --ios"
echo "- Android: npx expo start --android"