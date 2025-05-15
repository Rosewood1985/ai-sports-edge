#!/bin/bash

# Define project documentation keywords
DOC_KEYWORDS=(
    "operating.*procedure"
    "operation.*procedure"
    "rule"
    "guideline"
    "protocol"
    "standard"
    "policy"
    "convention"
    "workflow"
    "process"
    "sop"
    "handbook"
    "manual"
    "manifesto"
    "best.*practice"
    "coding.*standard"
    "git.*workflow"
    "deployment.*guide"
    "architecture.*guide"
)

# Create search pattern
DOC_PATTERN=$(IFS='|'; echo "${DOC_KEYWORDS[*]}")

echo "=== Searching for Project Guidelines and Operating Procedures ==="
echo ""
echo "Looking for files matching: ${DOC_PATTERN}"
echo ""

# Search in various locations
SEARCH_LOCATIONS=(
    "."
    "~/Desktop"
    "~/Documents"
    "~/Downloads"
    "~/.config"
    "~/ai-projects"
    "~/projects"
    "./docs"
    "./.github"
    "./.roocode"
)

# Arrays to store results
FOUND_FILES=()
TEXT_FILES=()
MD_FILES=()

# Search for markdown files
echo "Searching for relevant markdown files..."
for location in "${SEARCH_LOCATIONS[@]}"; do
    eval "expanded_location=$location"
    if [ -d "$expanded_location" ]; then
        while IFS= read -r -d '' file; do
            if echo "$file" | grep -i -E "(${DOC_PATTERN})" >/dev/null; then
                MD_FILES+=("$file")
            fi
        done < <(find "$expanded_location" -maxdepth 3 -name "*.md" -print0 2>/dev/null)
    fi
done

# Search for text files
echo "Searching for relevant text files..."
for location in "${SEARCH_LOCATIONS[@]}"; do
    eval "expanded_location=$location"
    if [ -d "$expanded_location" ]; then
        while IFS= read -r -d '' file; do
            if echo "$file" | grep -i -E "(${DOC_PATTERN})" >/dev/null; then
                TEXT_FILES+=("$file")
            fi
        done < <(find "$expanded_location" -maxdepth 3 -name "*.txt" -print0 2>/dev/null)
    fi
done

# Content-based search for files that might not have obvious names
echo "Searching file contents for operating procedures..."
CONTENT_FILES=()
for location in "${SEARCH_LOCATIONS[@]}"; do
    eval "expanded_location=$location"
    if [ -d "$expanded_location" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ] && [ "$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)" -lt 1000000 ]; then
                if grep -l -i -E "(operating procedure|project rule|guideline|workflow)" "$file" 2>/dev/null; then
                    CONTENT_FILES+=("$file")
                fi
            fi
        done < <(find "$expanded_location" -maxdepth 2 -type f \( -name "*.md" -o -name "*.txt" \) 2>/dev/null)
    fi
done

# Combine and deduplicate all results
ALL_FOUND_FILES=($(printf '%s\n' "${MD_FILES[@]}" "${TEXT_FILES[@]}" "${CONTENT_FILES[@]}" | sort -u))

# Display results
echo ""
echo "=== Found Documentation Files ==="
echo ""

if [ ${#ALL_FOUND_FILES[@]} -eq 0 ]; then
    echo "No operating procedures or guidelines found automatically."
    echo ""
    echo "You might want to manually check these locations:"
    echo "  - Current project directory"
    echo "  - ~/Documents"
    echo "  - ~/Desktop"
    echo "  - Project-specific folders"
    echo ""
    echo "Try searching manually with:"
    echo "  find ~ -name '*.md' | grep -i -E '(operating|procedure|rule|guideline)'"
    exit 1
fi

echo "Total files found: ${#ALL_FOUND_FILES[@]}"
echo ""

# Categorize results
echo "📚 MARKDOWN FILES:"
for file in "${MD_FILES[@]}"; do
    echo "  - $file"
done

echo ""
echo "📄 TEXT FILES:"
for file in "${TEXT_FILES[@]}"; do
    echo "  - $file"
done

echo ""
echo "🔍 CONTENT-MATCHED FILES:"
for file in "${CONTENT_FILES[@]}"; do
    if [[ ! " ${MD_FILES[@]} ${TEXT_FILES[@]} " =~ " ${file} " ]]; then
        echo "  - $file"
    fi
done

echo ""
echo "=== Preview file contents? (y/n) ==="
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "=== File Contents Preview ==="
    
    for file in "${ALL_FOUND_FILES[@]}"; do
        echo ""
        echo "----------------------------------------"
        echo "📄 File: $file"
        echo "Size: $(du -sh "$file" | cut -f1)"
        echo ""
        echo "First 15 lines:"
        head -15 "$file" 2>/dev/null | sed 's/^/  /'
        echo ""
        echo "Key sections (if any):"
        grep -i -B2 -A2 -E "(^#|operating|procedure|rule|guideline|workflow)" "$file" 2>/dev/null | head -10 | sed 's/^/  /'
        echo "----------------------------------------"
    done
fi

echo ""
echo "=== Would you like to copy these to .roocode/documentation? (y/n) ==="
read -r copy_response

if [[ "$copy_response" =~ ^[Yy]$ ]]; then
    # Create directory structure
    mkdir -p .roocode/documentation/{operating-procedures,guidelines,rules,workflows,standards}
    
    # Categorize and copy files
    for file in "${ALL_FOUND_FILES[@]}"; do
        filename=$(basename "$file")
        
        if echo "$filename" | grep -i -E "(operating.*procedure|sop)"; then
            cp "$file" ".roocode/documentation/operating-procedures/"
            echo "Copied to operating-procedures: $filename"
        elif echo "$filename" | grep -i -E "(rule|policy)"; then
            cp "$file" ".roocode/documentation/rules/"
            echo "Copied to rules: $filename"
        elif echo "$filename" | grep -i -E "(workflow|process)"; then
            cp "$file" ".roocode/documentation/workflows/"
            echo "Copied to workflows: $filename"
        elif echo "$filename" | grep -i -E "(standard|convention)"; then
            cp "$file" ".roocode/documentation/standards/"
            echo "Copied to standards: $filename"
        else
            cp "$file" ".roocode/documentation/guidelines/"
            echo "Copied to guidelines: $filename"
        fi
    done
    
    # Create index file
    cat > .roocode/documentation/README.md << 'EOM'
# Project Documentation Index

## Directory Structure

- **operating-procedures/** - Standard Operating Procedures (SOPs)
- **guidelines/** - General project guidelines
- **rules/** - Project rules and policies
- **workflows/** - Process and workflow documentation
- **standards/** - Coding standards and conventions

## Quick Access

To view a specific document:
```bash
# List all documentation
find .roocode/documentation -type f -name "*.md" -o -name "*.txt"

# Search within documentation
grep -r "keyword" .roocode/documentation/
```

## Integration with GPT Instructions

GPT instructions are stored separately in `.roocode/gpt-instructions/`.
Cross-reference between documentation and GPT instructions as needed.

## Current Project Context

Project: AI Sports Edge
Status: Firebase atomic architecture complete
Next: Unit tests, service migration, commit changes
EOM
    
    echo ""
    echo "✅ Documentation copied successfully!"
    echo "Files organized in: .roocode/documentation/"
fi
