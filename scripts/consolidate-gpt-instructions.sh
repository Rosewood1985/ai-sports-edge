#!/bin/bash
# consolidate-gpt-instructions.sh
#
# This script automates the consolidation of GPT instruction files
# into a structured directory hierarchy.
#
# Usage: ./scripts/consolidate-gpt-instructions.sh

set -e

# Define directories
BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
DOCS_DIR="${BASE_DIR}/docs-consolidated/01-gpt-personas"
CONSOLIDATED_DIR="${DOCS_DIR}/consolidated"
CLAUDE_DIR="${CONSOLIDATED_DIR}/claude"
CHATGPT_DIR="${CONSOLIDATED_DIR}/chatgpt"
SPECIALIZED_DIR="${CONSOLIDATED_DIR}/specialized"
ARCHIVED_DIR="${CONSOLIDATED_DIR}/archived"

# Create directories if they don't exist
mkdir -p "${CLAUDE_DIR}" "${CHATGPT_DIR}" "${SPECIALIZED_DIR}" "${ARCHIVED_DIR}"

# Function to copy a file with standardized naming
copy_file() {
  local source="$1"
  local dest_dir="$2"
  local new_name="$3"
  
  if [ -f "${source}" ]; then
    echo "Copying ${source} to ${dest_dir}/${new_name}"
    cp "${source}" "${dest_dir}/${new_name}"
  else
    echo "Warning: Source file ${source} not found"
  fi
}

# Function to check if files are identical
files_identical() {
  local file1="$1"
  local file2="$2"
  
  if [ -f "${file1}" ] && [ -f "${file2}" ]; then
    cmp -s "${file1}" "${file2}"
    return $?
  else
    return 1
  fi
}

echo "=== GPT Instructions Consolidation ==="
echo "Starting consolidation process..."

# Copy Claude instructions
copy_file "${DOCS_DIR}/claude-3.7-instructions-ai-sports-edge.md" "${CLAUDE_DIR}" "claude-3.7-instructions.md"
copy_file "${DOCS_DIR}/claude-support-prompts-ai-sports-edge.md" "${CLAUDE_DIR}" "claude-support-prompts.md"

# Copy ChatGPT instructions (if they exist)
if [ -f "${DOCS_DIR}/gpt-4-instructions.md" ]; then
  copy_file "${DOCS_DIR}/gpt-4-instructions.md" "${CHATGPT_DIR}" "gpt-4-instructions.md"
fi

# Copy specialized instructions
copy_file "${DOCS_DIR}/deployment-instructions.md" "${SPECIALIZED_DIR}" "deployment-instructions.md"
copy_file "${DOCS_DIR}/manual-deploy-instructions.md" "${SPECIALIZED_DIR}" "manual-deploy-instructions.md"
copy_file "${DOCS_DIR}/olive-governance-prompts.md" "${SPECIALIZED_DIR}" "olive-governance-prompts.md"
copy_file "${DOCS_DIR}/update-instructions.md" "${SPECIALIZED_DIR}" "update-instructions.md"

# Create or update the master index file
MASTER_INDEX="${CONSOLIDATED_DIR}/00-MASTER-GPT-INSTRUCTIONS.md"

if [ ! -f "${MASTER_INDEX}" ]; then
  echo "Creating master index file..."
  cat > "${MASTER_INDEX}" << 'EOF'
# AI Sports Edge - Master GPT Instructions

This document serves as the central index for all GPT instruction files used in the AI Sports Edge project. It provides an organized reference to ensure consistent AI assistance across the project.

## Overview

The AI Sports Edge project uses various AI assistants (Claude, ChatGPT, etc.) to support development, deployment, and maintenance. This document organizes all instruction files to ensure consistent AI behavior and prevent duplication.

## Directory Structure

```
/docs-consolidated/01-gpt-personas/consolidated/
├── 00-MASTER-GPT-INSTRUCTIONS.md (this file)
├── claude/
│   ├── claude-3.7-instructions.md
│   └── claude-support-prompts.md
├── chatgpt/
│   └── gpt-4-instructions.md
├── specialized/
│   ├── deployment-instructions.md
│   ├── manual-deploy-instructions.md
│   ├── olive-governance-prompts.md
│   └── update-instructions.md
└── archived/
    └── (deprecated instruction files)
```

## Core Instruction Files

### Claude Instructions

- [Claude 3.7 Instructions](./claude/claude-3.7-instructions.md) - Primary instructions for Claude 3.7 when working on the AI Sports Edge project
- [Claude Support Prompts](./claude/claude-support-prompts.md) - Specialized prompts for Claude when providing support

### ChatGPT Instructions

- [GPT-4 Instructions](./chatgpt/gpt-4-instructions.md) - Primary instructions for GPT-4 when working on the AI Sports Edge project

### Specialized Instructions

- [Deployment Instructions](./specialized/deployment-instructions.md) - Instructions for deploying the AI Sports Edge app
- [Manual Deploy Instructions](./specialized/manual-deploy-instructions.md) - Detailed manual deployment procedures
- [Olive Governance Prompts](./specialized/olive-governance-prompts.md) - Governance rules for file and execution clarity
- [Update Instructions](./specialized/update-instructions.md) - Instructions for updating the AI Sports Edge app

## Usage Guidelines

1. **Consistency**: Always use the most recent version of instruction files
2. **Categorization**: Place new instruction files in the appropriate directory
3. **Versioning**: Include version numbers in instruction file names when applicable
4. **Documentation**: Update this master index when adding new instruction files
5. **Archiving**: Move deprecated instruction files to the archived directory

## Recommended Practices

- Use Claude 3.7 for code-heavy tasks requiring deep context understanding
- Use GPT-4 for creative tasks and documentation generation
- Use specialized instructions for specific workflows
- Regularly review and update instruction files to reflect project changes

## Maintenance

This master index should be updated whenever:
- New instruction files are added
- Existing instruction files are modified significantly
- Instruction files are deprecated and archived

Last updated: $(date '+%B %d, %Y')
EOF
fi

# Update the status log
STATUS_LOG="${BASE_DIR}/status/docs-consolidation-summary.md"
echo "Updating status log..."
cat >> "${STATUS_LOG}" << EOF

## GPT Instructions Consolidation - $(date '+%Y-%m-%d')

- Consolidated GPT instruction files into structured directories
- Created master index file for all GPT instructions
- Organized files by AI model and purpose
- Standardized naming conventions
- Set up archiving system for deprecated instructions
EOF

echo "=== Consolidation Complete ==="
echo "Master index: ${MASTER_INDEX}"
echo "Status log updated: ${STATUS_LOG}"