#!/bin/bash

# API Call Optimization Script
# This script helps identify and optimize API calls to reduce loading time

# Exit on error
set -e

# Display script header
echo "=========================================="
echo "AI Sports Edge API Optimization Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "Error: app.json not found. Please run this script from the project root directory."
    exit 1
fi

# Function to check for API call optimization opportunities
find_optimization_opportunities() {
    local file=$1
    local issues=0
    
    echo "Analyzing $file..."
    
    # Check for API calls without caching
    if grep -q "fetch(" "$file" || grep -q "axios" "$file"; then
        if ! grep -q "cache" "$file" && ! grep -q "memoize" "$file" && ! grep -q "useMemo" "$file"; then
            echo "⚠️  API calls without caching in $file"
            grep -n -A 2 "fetch(" "$file" | head -5
            grep -n -A 2 "axios" "$file" | head -5
            issues=$((issues + 1))
            
            echo "💡 Recommendation: Implement caching using oddsCacheService or memoization"
            echo ""
        fi
    fi
    
    # Check for multiple API calls that could be batched
    if [ $(grep -c "fetch(" "$file") -gt 2 ] || [ $(grep -c "axios" "$file") -gt 2 ]; then
        echo "⚠️  Multiple API calls in $file (consider batching)"
        grep -n "fetch(" "$file" | head -5
        grep -n "axios" "$file" | head -5
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Use Promise.all() to batch API calls or create a dedicated endpoint"
        echo ""
    fi
    
    # Check for missing debounce/throttle on user-triggered API calls
    if (grep -q "fetch(" "$file" || grep -q "axios" "$file") && 
       (grep -q "onPress" "$file" || grep -q "onChange" "$file") && 
       ! grep -q "debounce" "$file" && ! grep -q "throttle" "$file"; then
        echo "⚠️  User-triggered API calls without debounce/throttle in $file"
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Implement debounce or throttle for user-triggered API calls"
        echo ""
    fi
    
    # Check for missing pagination
    if (grep -q "fetch(" "$file" || grep -q "axios" "$file") && 
       (grep -q "list" "$file" || grep -q "array" "$file" || grep -q "[]" "$file") && 
       ! grep -q "limit" "$file" && ! grep -q "page" "$file" && ! grep -q "offset" "$file"; then
        echo "⚠️  List API calls without pagination in $file"
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Implement pagination for list API calls"
        echo ""
    fi
    
    # Check for missing data prefetching
    if grep -q "navigation" "$file" && (grep -q "fetch(" "$file" || grep -q "axios" "$file")) && 
       ! grep -q "prefetch" "$file" && ! grep -q "preload" "$file"; then
        echo "⚠️  Navigation without data prefetching in $file"
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Implement data prefetching when navigation is likely"
        echo ""
    fi
    
    # Check for missing error handling
    if (grep -q "fetch(" "$file" || grep -q "axios" "$file") && ! grep -q "catch" "$file"; then
        echo "⚠️  Missing error handling for API calls in $file"
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Add try/catch blocks and implement errorRecoveryService"
        echo ""
    fi
    
    # Check for missing loading states
    if (grep -q "fetch(" "$file" || grep -q "axios" "$file") && 
       ! grep -q "loading" "$file" && ! grep -q "isLoading" "$file"; then
        echo "⚠️  Missing loading state for API calls in $file"
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Add loading state and skeleton screens"
        echo ""
    fi
    
    # Check for missing data transformation
    if (grep -q "fetch(" "$file" || grep -q "axios" "$file") && 
       ! grep -q "map(" "$file" && ! grep -q "reduce(" "$file" && ! grep -q "filter(" "$file"); then
        echo "⚠️  API calls without data transformation in $file"
        issues=$((issues + 1))
        
        echo "💡 Recommendation: Transform API data to minimize what's stored in state"
        echo ""
    fi
    
    return $issues
}

# Function to check for live odds optimization
check_live_odds() {
    local file=$1
    
    if grep -q "live" "$file" && grep -q "odds" "$file"; then
        echo "🔍 Live odds implementation found in $file"
        
        # Check for WebSocket usage
        if ! grep -q "WebSocket" "$file" && ! grep -q "socket" "$file"; then
            echo "⚠️  Live odds without WebSocket in $file (consider using WebSockets instead of polling)"
            echo "💡 Recommendation: Implement WebSockets for real-time updates"
            echo ""
        fi
        
        # Check for throttling
        if ! grep -q "throttle" "$file"; then
            echo "⚠️  Live odds without throttling in $file"
            echo "💡 Recommendation: Implement throttling to prevent UI jank"
            echo ""
        fi
        
        # Check for selective updates
        if ! grep -q "diff" "$file" && ! grep -q "changed" "$file"; then
            echo "⚠️  Live odds without selective updates in $file"
            echo "💡 Recommendation: Only update changed values to reduce rendering"
            echo ""
        fi
    fi
}

# Function to check for parlay optimization
check_parlay() {
    local file=$1
    
    if grep -q "parlay" "$file"; then
        echo "🔍 Parlay implementation found in $file"
        
        # Check for memoization
        if ! grep -q "useMemo" "$file" && ! grep -q "memo" "$file"; then
            echo "⚠️  Parlay calculations without memoization in $file"
            echo "💡 Recommendation: Use useMemo for parlay calculations"
            echo ""
        fi
        
        # Check for batch updates
        if ! grep -q "batch" "$file" && ! grep -q "transaction" "$file"; then
            echo "⚠️  Parlay updates without batching in $file"
            echo "💡 Recommendation: Batch state updates for better performance"
            echo ""
        fi
    fi
}

# Main optimization process
echo "Starting API optimization process..."
echo ""

# Check services directory
echo "Checking services directory..."
service_issues=0
for file in $(find ./services -name "*.ts" -o -name "*.js"); do
    find_optimization_opportunities "$file"
    service_issues=$((service_issues + $?))
    check_live_odds "$file"
    check_parlay "$file"
    echo ""
done

# Check components directory
echo "Checking components directory..."
component_issues=0
for file in $(find ./components -name "*.tsx" -o -name "*.jsx"); do
    find_optimization_opportunities "$file"
    component_issues=$((component_issues + $?))
    check_live_odds "$file"
    check_parlay "$file"
    echo ""
done

# Check screens directory
echo "Checking screens directory..."
screen_issues=0
for file in $(find ./screens -name "*.tsx" -o -name "*.jsx"); do
    find_optimization_opportunities "$file"
    screen_issues=$((screen_issues + $?))
    check_live_odds "$file"
    check_parlay "$file"
    echo ""
done

# Summary
total_issues=$((service_issues + component_issues + screen_issues))
echo "=========================================="
echo "API Optimization Summary"
echo "=========================================="
echo "Service issues found: $service_issues"
echo "Component issues found: $component_issues"
echo "Screen issues found: $screen_issues"
echo "Total issues found: $total_issues"
echo ""

if [ $total_issues -eq 0 ]; then
    echo "No API optimization issues found! 🎉"
else
    echo "Please address the issues listed above to improve API performance."
fi

echo ""
echo "Next steps:"
echo "1. Implement caching for all API calls"
echo "2. Use WebSockets for live odds updates"
echo "3. Implement pagination for list data"
echo "4. Add debounce/throttle for user-triggered API calls"
echo "5. Implement data prefetching for navigation"
echo ""
echo "For performance testing, run:"
echo "- Web: npm run analyze:web"
echo "- iOS: npx expo-cli start --ios --dev=false"