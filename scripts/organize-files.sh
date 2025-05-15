#!/bin/bash
# organize-files.sh
# Script to organize files according to project structure rules
# Created: May 11, 2025

# Set up logging
LOG_FILE="status/file-organization-log.md"
mkdir -p status
echo "# File Organization Log - $(date)" > "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "## Files Moved" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Create necessary directories
mkdir -p docs
mkdir -p public
mkdir -p archive
mkdir -p archive/src/navigation
mkdir -p archive/.vscode

# Move documentation files to /docs
echo "### Documentation Files Moved to /docs" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

DOC_FILES=(
  "performance-optimization-summary.md"
  "services-debug-report.md"
  "operating-structure.md"
  "claude-support-prompts-ai-sports-edge.md"
  "template-parlay-detection.md"
  "ARCHITECTURE.md"
  "atomic-implementation-plan.md"
  "ui-ux-strategy.md"
  "firebase-auth-fix.md"
  "claude-3.7-instructions-ai-sports-edge.md"
  "project-quickstart.md"
)

for file in "${DOC_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file already exists in docs
    if [ -f "docs/$file" ]; then
      # Compare files
      if cmp -s "$file" "docs/$file"; then
        echo "- $file → Identical file exists in docs/ - skipping" >> "$LOG_FILE"
      else
        # Move with timestamp to avoid overwrite
        mv "$file" "docs/${file%.md}_$(date +%Y%m%d).md"
        echo "- $file → docs/${file%.md}_$(date +%Y%m%d).md (renamed to avoid overwrite)" >> "$LOG_FILE"
      fi
    else
      # Move file
      mv "$file" "docs/"
      echo "- $file → docs/$file" >> "$LOG_FILE"
    fi
  else
    echo "- $file → Not found" >> "$LOG_FILE"
  fi
done

# Move image files to /public
echo "" >> "$LOG_FILE"
echo "### Image Files Moved to /public" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

IMAGE_FILES=(
  "BRAND_TEMPLATE_GUIDE.png"
  "template-parlay-detection.jpg"
  "rajiv-explains-script-upload.png"
)

for file in "${IMAGE_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file already exists in public
    if [ -f "public/$file" ]; then
      # Compare files
      if cmp -s "$file" "public/$file"; then
        echo "- $file → Identical file exists in public/ - skipping" >> "$LOG_FILE"
      else
        # Move with timestamp to avoid overwrite
        mv "$file" "public/${file%.*}_$(date +%Y%m%d).${file##*.}"
        echo "- $file → public/${file%.*}_$(date +%Y%m%d).${file##*.} (renamed to avoid overwrite)" >> "$LOG_FILE"
      fi
    else
      # Move file
      mv "$file" "public/"
      echo "- $file → public/$file" >> "$LOG_FILE"
    fi
  else
    echo "- $file → Not found" >> "$LOG_FILE"
  fi
done

# Move backup files to /archive
echo "" >> "$LOG_FILE"
echo "### Backup Files Moved to /archive" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Move specific backup files
if [ -f "index.js.bak" ]; then
  mv "index.js.bak" "archive/"
  echo "- index.js.bak → archive/index.js.bak" >> "$LOG_FILE"
else
  echo "- index.js.bak → Not found" >> "$LOG_FILE"
fi

if [ -f ".vscode/settings.json.bak" ]; then
  mv ".vscode/settings.json.bak" "archive/.vscode/"
  echo "- .vscode/settings.json.bak → archive/.vscode/settings.json.bak" >> "$LOG_FILE"
else
  echo "- .vscode/settings.json.bak → Not found" >> "$LOG_FILE"
fi

if [ -f ".vscode/sftp.json.bak" ]; then
  mv ".vscode/sftp.json.bak" "archive/.vscode/"
  echo "- .vscode/sftp.json.bak → archive/.vscode/sftp.json.bak" >> "$LOG_FILE"
else
  echo "- .vscode/sftp.json.bak → Not found" >> "$LOG_FILE"
fi

if [ -f "package.json.bak" ]; then
  mv "package.json.bak" "archive/"
  echo "- package.json.bak → archive/package.json.bak" >> "$LOG_FILE"
else
  echo "- package.json.bak → Not found" >> "$LOG_FILE"
fi

# Note missing files
echo "" >> "$LOG_FILE"
echo "## Missing Files" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "The following files were referenced in tasks but not found in the repository:" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "- CTA_Phrase_Pack.md - Referenced in task-board.md" >> "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "## Summary" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "File organization completed on $(date)" >> "$LOG_FILE"
echo "Files were organized according to the project's directory structure rules:" >> "$LOG_FILE"
echo "- Documentation files → /docs" >> "$LOG_FILE"
echo "- Image files → /public" >> "$LOG_FILE"
echo "- Backup files → /archive" >> "$LOG_FILE"

echo "File organization script completed. See $LOG_FILE for details."