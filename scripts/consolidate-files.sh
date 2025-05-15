#!/bin/bash
#
# consolidate-files.sh
#
# This script handles the consolidation of multiple files into a single file,
# automatically tagging the consolidated file and archiving the original files.
#
# Usage: ./scripts/consolidate-files.sh output_file.ts input_file1.ts input_file2.ts ...

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if enough arguments are provided
if [ $# -lt 2 ]; then
  echo -e "${RED}Error: Not enough arguments${NC}"
  echo "Usage: $0 output_file.ts input_file1.ts input_file2.ts ..."
  exit 1
fi

# Get output file and input files
OUTPUT_FILE="$1"
shift
INPUT_FILES=("$@")

# Check if all input files exist
for file in "${INPUT_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}Error: Input file '$file' does not exist${NC}"
    exit 1
  fi
done

# Create a list of input files for the header
INPUT_FILES_LIST=$(printf "%s, " "${INPUT_FILES[@]}")
INPUT_FILES_LIST=${INPUT_FILES_LIST%, } # Remove trailing comma and space

echo -e "${BLUE}Consolidating files:${NC}"
for file in "${INPUT_FILES[@]}"; do
  echo "  - $file"
done
echo -e "${BLUE}Into:${NC} $OUTPUT_FILE"

# Ask for confirmation
echo -e "${YELLOW}Do you want to proceed? (y/n)${NC}"
read -r confirm

if [[ "$confirm" != "y" ]]; then
  echo -e "${RED}Consolidation cancelled by user${NC}"
  exit 0
fi

# Create output directory if it doesn't exist
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$OUTPUT_DIR"

# Consolidate files
echo -e "${BLUE}Consolidating files...${NC}"

# Start with an empty file
> "$OUTPUT_FILE"

# Add a consolidated header
if [ -f "scripts/tag-headers.sh" ]; then
  echo -e "${BLUE}Tagging consolidated file...${NC}"
  bash scripts/tag-headers.sh consolidated "$OUTPUT_FILE" "$INPUT_FILES_LIST"
else
  echo -e "${YELLOW}Warning: tag-headers.sh not found, adding basic header${NC}"
  echo "// 🧩 CONSOLIDATED: Merged from [$INPUT_FILES_LIST] on $(date +"%Y-%m-%d")" > "$OUTPUT_FILE"
fi

# Add a separator and description
echo "" >> "$OUTPUT_FILE"
echo "/**" >> "$OUTPUT_FILE"
echo " * This file is a consolidation of the following files:" >> "$OUTPUT_FILE"
for file in "${INPUT_FILES[@]}"; do
  echo " * - $file" >> "$OUTPUT_FILE"
done
echo " */" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Process each input file
for file in "${INPUT_FILES[@]}"; do
  echo -e "${BLUE}Processing $file...${NC}"
  
  # Add file separator
  echo "" >> "$OUTPUT_FILE"
  echo "// ===== From: $file =====" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  
  # Extract imports
  grep -E "^import " "$file" >> "$OUTPUT_FILE.imports.tmp" || true
  
  # Add content without imports
  grep -v -E "^import " "$file" >> "$OUTPUT_FILE.content.tmp" || true
done

# Deduplicate imports
if [ -f "$OUTPUT_FILE.imports.tmp" ]; then
  echo -e "${BLUE}Deduplicating imports...${NC}"
  sort -u "$OUTPUT_FILE.imports.tmp" > "$OUTPUT_FILE.imports.sorted.tmp"
  
  # Add imports to the beginning of the file (after the header)
  sed -i '2r '"$OUTPUT_FILE.imports.sorted.tmp" "$OUTPUT_FILE"
  
  # Add a separator after imports
  sed -i '/^import /!{:a;n;/^import /!{s/^/\n/;p;b done};ba};:done' "$OUTPUT_FILE"
fi

# Append content
if [ -f "$OUTPUT_FILE.content.tmp" ]; then
  cat "$OUTPUT_FILE.content.tmp" >> "$OUTPUT_FILE"
fi

# Clean up temporary files
rm -f "$OUTPUT_FILE.imports.tmp" "$OUTPUT_FILE.imports.sorted.tmp" "$OUTPUT_FILE.content.tmp"

echo -e "${GREEN}Files consolidated successfully into $OUTPUT_FILE${NC}"

# Archive original files
echo -e "${BLUE}Archiving original files...${NC}"
if [ -f "scripts/archive-redundant-files.sh" ]; then
  bash scripts/archive-redundant-files.sh "${INPUT_FILES[@]}"
else
  echo -e "${YELLOW}Warning: archive-redundant-files.sh not found, skipping archiving${NC}"
  echo -e "${YELLOW}You should manually archive or delete the original files${NC}"
fi

echo -e "${GREEN}Consolidation complete!${NC}"