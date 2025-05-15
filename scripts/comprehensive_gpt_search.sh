#!/bin/bash

# Define GPT personas
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

# Create a temporary workspace to organize findings
mkdir -p ~/Desktop/temp-gpt-search/{found-gpts,uncertain,to-review}

# Create a log file to track what we find
echo "GPT Search Results - $(date)" > ~/Desktop/temp-gpt-search/search-log.txt
echo "=================================" >> ~/Desktop/temp-gpt-search/search-log.txt

echo "=== Comprehensive GPT Search ==="
echo "Searching for GPT personas and instruction files..."

# Search for GPT persona names in markdown files
echo -e "\n=== Searching markdown files for GPT personas ==="
MD_RESULTS=$(grep -r -i -l "$SEARCH_PATTERN" ~/Desktop/ai-sports-edge --include="*.md")
if [ -n "$MD_RESULTS" ]; then
    echo "Found GPT personas in markdown files:" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    echo "$MD_RESULTS" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    
    # Copy found files to the temp directory
    for file in $MD_RESULTS; do
        cp "$file" ~/Desktop/temp-gpt-search/found-gpts/
        echo "Copied: $file" >> ~/Desktop/temp-gpt-search/search-log.txt
    done
else
    echo "No GPT personas found in markdown files." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
fi

# Search for GPT persona names in text files
echo -e "\n=== Searching text files for GPT personas ==="
TXT_RESULTS=$(grep -r -i -l "$SEARCH_PATTERN" ~/Desktop/ai-sports-edge --include="*.txt")
if [ -n "$TXT_RESULTS" ]; then
    echo "Found GPT personas in text files:" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    echo "$TXT_RESULTS" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    
    # Copy found files to the temp directory
    for file in $TXT_RESULTS; do
        cp "$file" ~/Desktop/temp-gpt-search/found-gpts/
        echo "Copied: $file" >> ~/Desktop/temp-gpt-search/search-log.txt
    done
else
    echo "No GPT personas found in text files." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
fi

# Find files with instruction-related names
echo -e "\n=== Searching for instruction-related filenames ==="
INSTRUCTION_FILES=$(find ~/Desktop/ai-sports-edge -type f \( -name "*instruction*" -o -name "*prompt*" -o -name "*gpt*" \) -not -path "*/node_modules/*")
if [ -n "$INSTRUCTION_FILES" ]; then
    echo "Found files with instruction-related names:" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    echo "$INSTRUCTION_FILES" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    
    # Copy found files to the temp directory
    for file in $INSTRUCTION_FILES; do
        cp "$file" ~/Desktop/temp-gpt-search/uncertain/
        echo "Copied: $file" >> ~/Desktop/temp-gpt-search/search-log.txt
    done
else
    echo "No files with instruction-related names found." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
fi

# Check .roocode directory for GPT instructions
echo -e "\n=== Checking .roocode directory ==="
ROOCODE_FILES=$(find ~/Desktop/ai-sports-edge/.roocode -type f -name "*.md" 2>/dev/null)
if [ -n "$ROOCODE_FILES" ]; then
    echo "Found files in .roocode directory:" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    echo "$ROOCODE_FILES" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    
    # Copy found files to the temp directory
    for file in $ROOCODE_FILES; do
        cp "$file" ~/Desktop/temp-gpt-search/to-review/
        echo "Copied: $file" >> ~/Desktop/temp-gpt-search/search-log.txt
    done
else
    echo "No files found in .roocode directory." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
fi

# Check docs directory for GPT-related files
echo -e "\n=== Checking docs directory for GPT-related files ==="
DOCS_FILES=$(find ~/Desktop/ai-sports-edge/docs -type f -name "*.md" | grep -i -E "(instruction|prompt|gpt)")
if [ -n "$DOCS_FILES" ]; then
    echo "Found GPT-related files in docs directory:" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    echo "$DOCS_FILES" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    
    # Copy found files to the temp directory
    for file in $DOCS_FILES; do
        cp "$file" ~/Desktop/temp-gpt-search/to-review/
        echo "Copied: $file" >> ~/Desktop/temp-gpt-search/search-log.txt
    done
else
    echo "No GPT-related files found in docs directory." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
fi

# Check memory-bank for GPT-related files
echo -e "\n=== Checking memory-bank for GPT-related files ==="
if [ -d ~/Desktop/ai-sports-edge/memory-bank ]; then
    MEMORY_BANK_FILES=$(find ~/Desktop/ai-sports-edge/memory-bank -type f -name "*.md" | xargs grep -l -i "instruction\|prompt\|persona" 2>/dev/null)
    if [ -n "$MEMORY_BANK_FILES" ]; then
        echo "Found GPT-related files in memory-bank:" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
        echo "$MEMORY_BANK_FILES" | tee -a ~/Desktop/temp-gpt-search/search-log.txt
        
        # Copy found files to the temp directory
        for file in $MEMORY_BANK_FILES; do
            cp "$file" ~/Desktop/temp-gpt-search/to-review/
            echo "Copied: $file" >> ~/Desktop/temp-gpt-search/search-log.txt
        done
    else
        echo "No GPT-related files found in memory-bank." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
    fi
else
    echo "memory-bank directory not found." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
fi

# Check if Claude instructions file exists and copy it
if [ -f ~/Desktop/ai-sports-edge/claude-3.7-instructions-ai-sports-edge.md ]; then
    cp ~/Desktop/ai-sports-edge/claude-3.7-instructions-ai-sports-edge.md ~/Desktop/temp-gpt-search/found-gpts/
    echo "Copied Claude instructions file." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
else
    echo "Claude instructions file not found." | tee -a ~/Desktop/temp-gpt-search/search-log.txt
fi

# Summary
echo -e "\n=== Search Summary ==="
echo "Search complete. Results organized in ~/Desktop/temp-gpt-search/"
echo "- Found GPTs: $(ls ~/Desktop/temp-gpt-search/found-gpts/ | wc -l) files"
echo "- Uncertain: $(ls ~/Desktop/temp-gpt-search/uncertain/ | wc -l) files"
echo "- To Review: $(ls ~/Desktop/temp-gpt-search/to-review/ | wc -l) files"
echo "- Log file: ~/Desktop/temp-gpt-search/search-log.txt"

# Add summary to log file
echo -e "\n=== Search Summary ===" >> ~/Desktop/temp-gpt-search/search-log.txt
echo "Search completed at $(date)" >> ~/Desktop/temp-gpt-search/search-log.txt
echo "- Found GPTs: $(ls ~/Desktop/temp-gpt-search/found-gpts/ | wc -l) files" >> ~/Desktop/temp-gpt-search/search-log.txt
echo "- Uncertain: $(ls ~/Desktop/temp-gpt-search/uncertain/ | wc -l) files" >> ~/Desktop/temp-gpt-search/search-log.txt
echo "- To Review: $(ls ~/Desktop/temp-gpt-search/to-review/ | wc -l) files" >> ~/Desktop/temp-gpt-search/search-log.txt
