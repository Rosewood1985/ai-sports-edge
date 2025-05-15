#!/bin/bash

# Define all GPT personas
GPT_PERSONAS=(
    "olive"
    "samuel"
    "sloane"
    "rajiv"
    "grant"
    "langford"
    "quinn"
    "mira"
    "nolan"
    "julian"
    "park"
    "lucia"
    "navarro"
)

# Create search pattern
SEARCH_PATTERN=$(IFS='|'; echo "${GPT_PERSONAS[*]}")

echo "=== Searching for GPT instruction files ==="
echo "Looking for files containing: ${SEARCH_PATTERN}"

# Search in current project
echo ""
echo "Searching in current project..."
PROJECT_FILES=($(find . -name "*.md" | grep -i -E "(${SEARCH_PATTERN})"))

# Search in common locations
echo ""
echo "Searching in home directory..."
HOME_FILES=($(find ~ -maxdepth 3 -name "*.md" 2>/dev/null | grep -i -E "(${SEARCH_PATTERN})" | head -30))

# Search in specific directories
echo ""
echo "Searching in common document locations..."
COMMON_PATHS=(
    "~/Desktop"
    "~/Documents"
    "~/Downloads"
    "~/gpt-instructions"
    "~/.gpt"
    "~/ai-projects"
)

COMMON_FILES=()
for path in "${COMMON_PATHS[@]}"; do
    eval "expanded_path=$path"
    if [ -d "$expanded_path" ]; then
        while IFS= read -r -d '' file; do
            COMMON_FILES+=("$file")
        done < <(find "$expanded_path" -maxdepth 2 -name "*.md" -print0 2>/dev/null | grep -iz -E "(${SEARCH_PATTERN})")
    fi
done

# Combine all results and remove duplicates
ALL_FILES=($(printf '%s\n' "${PROJECT_FILES[@]}" "${HOME_FILES[@]}" "${COMMON_FILES[@]}" | sort -u))

if [ ${#ALL_FILES[@]} -eq 0 ]; then
    echo "No GPT instruction files found."
    echo ""
    echo "You might need to search manually. Try:"
    echo "  find ~ -name '*.md' | grep -i -E '(olive|samuel|sloane|rajiv|grant|quinn|mira|julian|lucia)'"
    exit 1
fi

echo ""
echo "=== Found ${#ALL_FILES[@]} potential GPT instruction files ==="
for file in "${ALL_FILES[@]}"; do
    echo "  - $file"
done

echo ""
echo "=== Would you like to analyze these files for GPT personas? (y/n) ==="
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "=== Analyzing files for GPT personas ==="
    
    for file in "${ALL_FILES[@]}"; do
        echo ""
        echo "File: $file"
        echo "First few lines:"
        head -5 "$file" 2>/dev/null | sed 's/^/  /'
        echo "Contains keywords:"
        grep -i -E "(instruction|prompt|gpt|agent|persona|role)" "$file" 2>/dev/null | head -3 | sed 's/^/  /'
    done
fi
