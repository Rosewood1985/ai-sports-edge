#!/bin/bash

# Design Consistency Check Script
# This script helps identify design inconsistencies across the app

# Exit on error
set -e

# Display script header
echo "=========================================="
echo "AI Sports Edge Design Consistency Check"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "Error: app.json not found. Please run this script from the project root directory."
    exit 1
fi

# Function to extract colors from files
extract_colors() {
    grep -o "#[0-9a-fA-F]\{6\}" $1 | sort | uniq
}

# Function to extract font sizes from files
extract_font_sizes() {
    grep -o "fontSize: [0-9]\+" $1 | sort | uniq
}

# Function to extract spacing values from files
extract_spacing() {
    grep -o "margin[^:]*: [0-9]\+" $1 | sort | uniq
    grep -o "padding[^:]*: [0-9]\+" $1 | sort | uniq
}

# Function to extract border radius values from files
extract_border_radius() {
    grep -o "borderRadius: [0-9]\+" $1 | sort | uniq
}

# Function to check for design consistency in a file
check_design_consistency() {
    local file=$1
    local issues=0
    
    echo "Analyzing $file..."
    
    # Check for hardcoded colors instead of theme colors
    if grep -q "#[0-9a-fA-F]\{6\}" "$file"; then
        echo "⚠️  Hardcoded colors in $file (use theme colors instead)"
        extract_colors "$file" | head -5
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Use Colors.primary, Colors.secondary, etc. from constants/Colors.ts"
        echo ""
    fi
    
    # Check for hardcoded font sizes instead of theme font sizes
    if grep -q "fontSize: [0-9]\+" "$file"; then
        echo "⚠️  Hardcoded font sizes in $file (use theme font sizes instead)"
        extract_font_sizes "$file" | head -5
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Use Typography.heading, Typography.body, etc."
        echo ""
    fi
    
    # Check for hardcoded spacing instead of theme spacing
    if grep -q "margin[^:]*: [0-9]\+" "$file" || grep -q "padding[^:]*: [0-9]\+" "$file"; then
        echo "⚠️  Hardcoded spacing in $file (use theme spacing instead)"
        extract_spacing "$file" | head -5
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Use Spacing.small, Spacing.medium, etc."
        echo ""
    fi
    
    # Check for hardcoded border radius instead of theme border radius
    if grep -q "borderRadius: [0-9]\+" "$file"; then
        echo "⚠️  Hardcoded border radius in $file (use theme border radius instead)"
        extract_border_radius "$file" | head -5
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Use BorderRadius.small, BorderRadius.medium, etc."
        echo ""
    fi
    
    # Check for missing dark mode support
    if grep -q "backgroundColor" "$file" && ! grep -q "isDarkMode" "$file" && ! grep -q "theme" "$file"; then
        echo "⚠️  Missing dark mode support in $file"
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Use ThemeContext to support dark mode"
        echo ""
    fi
    
    # Check for missing responsive design
    if grep -q "width: [0-9]\+" "$file" || grep -q "height: [0-9]\+" "$file"; then
        if ! grep -q "Dimensions" "$file" && ! grep -q "useWindowDimensions" "$file" && ! grep -q "responsive" "$file"; then
            echo "⚠️  Missing responsive design in $file"
            issues=$((issues + 1))
            
            echo "💡 Recommendation: Use Dimensions.get('window') or useWindowDimensions()"
            echo ""
        fi
    fi
    
    # Check for missing accessibility support
    if grep -q "TouchableOpacity" "$file" || grep -q "Button" "$file" || grep -q "Pressable" "$file"; then
        if ! grep -q "accessible" "$file" || ! grep -q "accessibilityLabel" "$file"; then
            echo "⚠️  Missing accessibility support in $file"
            issues=$((issues + 1))
            
            echo "💡 Recommendation: Add accessible={true} and accessibilityLabel props"
            echo ""
        fi
    fi
    
    # Check for missing internationalization
    if grep -q "Text" "$file" && grep -q '"[^"]\+"' "$file"; then
        if ! grep -q "i18n.t" "$file" && ! grep -q "useTranslation" "$file"; then
            echo "⚠️  Missing internationalization in $file"
            issues=$((issues + 1))
            
            echo "💡 Recommendation: Use i18n.t() or useTranslation() hook"
            echo ""
        fi
    fi
    
    return $issues
}

# Function to check for component consistency
check_component_consistency() {
    # Check for consistent button styles
    echo "Checking for consistent button styles..."
    button_styles=$(grep -r "Button" --include="*.tsx" --include="*.jsx" ./components | wc -l)
    custom_buttons=$(grep -r "TouchableOpacity" --include="*.tsx" --include="*.jsx" ./components | wc -l)
    
    if [ $custom_buttons -gt $button_styles ]; then
        echo "⚠️  Inconsistent button usage: $custom_buttons TouchableOpacity vs $button_styles Button components"
        echo "💡 Recommendation: Create a consistent Button component and use it throughout the app"
        echo ""
    fi
    
    # Check for consistent card styles
    echo "Checking for consistent card styles..."
    card_components=$(grep -r "Card" --include="*.tsx" --include="*.jsx" ./components | wc -l)
    view_with_shadow=$(grep -r "shadowColor\|elevation" --include="*.tsx" --include="*.jsx" ./components | wc -l)
    
    if [ $view_with_shadow -gt $card_components ]; then
        echo "⚠️  Inconsistent card usage: $view_with_shadow Views with shadows vs $card_components Card components"
        echo "💡 Recommendation: Create a consistent Card component and use it throughout the app"
        echo ""
    fi
    
    # Check for consistent typography
    echo "Checking for consistent typography..."
    text_components=$(grep -r "<Text" --include="*.tsx" --include="*.jsx" ./components | wc -l)
    styled_text=$(grep -r "Typography\|fontFamily\|fontSize\|fontWeight" --include="*.tsx" --include="*.jsx" ./components | wc -l)
    
    if [ $styled_text -gt $text_components ]; then
        echo "⚠️  Inconsistent typography: $styled_text styled Text components vs $text_components Text components"
        echo "💡 Recommendation: Create consistent Typography components (Heading, Body, Caption, etc.)"
        echo ""
    fi
}

# Main design consistency check process
echo "Starting design consistency check process..."
echo ""

# Check components directory
echo "Checking components directory..."
component_issues=0
for file in $(find ./components -name "*.tsx" -o -name "*.jsx"); do
    check_design_consistency "$file"
    component_issues=$((component_issues + $?))
    echo ""
done

# Check screens directory
echo "Checking screens directory..."
screen_issues=0
for file in $(find ./screens -name "*.tsx" -o -name "*.jsx"); do
    check_design_consistency "$file"
    screen_issues=$((screen_issues + $?))
    echo ""
done

# Check for component consistency
echo "Checking for component consistency..."
check_component_consistency

# Check for design system usage
echo "Checking for design system usage..."
if [ ! -f "./constants/Colors.ts" ] || [ ! -f "./constants/Typography.ts" ] || [ ! -f "./constants/Spacing.ts" ]; then
    echo "⚠️  Missing design system files"
    echo "💡 Recommendation: Create a comprehensive design system with Colors, Typography, Spacing, etc."
    echo ""
fi

# Summary
total_issues=$((component_issues + screen_issues))
echo "=========================================="
echo "Design Consistency Summary"
echo "=========================================="
echo "Component issues found: $component_issues"
echo "Screen issues found: $screen_issues"
echo "Total issues found: $total_issues"
echo ""

if [ $total_issues -eq 0 ]; then
    echo "No design consistency issues found! 🎉"
else
    echo "Please address the issues listed above to improve design consistency."
fi

echo ""
echo "Next steps:"
echo "1. Create a comprehensive design system"
echo "2. Use theme variables instead of hardcoded values"
echo "3. Implement responsive design for all screen sizes"
echo "4. Support dark mode throughout the app"
echo "5. Ensure accessibility compliance"
echo ""
echo "For visual testing, run:"
echo "- Web: npm run start:web"
echo "- iOS: npx expo start --ios"
echo "- Android: npx expo start --android"