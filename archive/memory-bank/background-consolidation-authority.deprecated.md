# ❌ Deprecated – merged into [infra-context-guide-md]

_This file was deprecated on 2025-05-13 after being consolidated into another file._

# Memory Bank Consolidation System

This document describes the automatic memory bank consolidation system that helps maintain a clean, organized, and efficient memory bank by consolidating related files.

## Overview

The memory bank consolidation system automatically identifies and merges related files in the memory bank to reduce duplication and improve knowledge organization. It follows a set of rules to determine when files should be consolidated and how the consolidation should be performed.

## Trigger Conditions

The system automatically consolidates memory bank files when:

- 2 or more files in `/roocode/memory_bank.md` or the `memory-bank` directory:
  - Share ≥75% topic overlap (similar keywords in title or content like "Firebase", "auth", "API key", "headers", "deployment", "CSP", etc.)
  - OR share system-level tags like `#infra`, `#firebase`, `#security`, `#deployment`

## Consolidation Process

When the system identifies files that should be consolidated, it follows this process:

1. **Cluster** related files using fuzzy matching to group by theme
2. **Select a base file** - the most refined and up-to-date file as the primary version
3. **Consolidate** - merge all content into one canonical file following naming conventions:
   - `firebase-[topic]-overview.md` or `deployment-security-guide.md`
   - Preserves citations and source comments at the end
4. **Archive deprecated fragments** - rename merged files with `.deprecated.md` or move to `/archive/memory-bank/`
   - Adds deprecation notice: `# ❌ Deprecated – merged into [new filename]`
5. **Log the merge** - update checkpoint and status log files:
   - `/context/latest-checkpoint.md`
   - `/status/status-log.md`
6. **Notify** if there are conflicting advice or ambiguity

## Automatic Triggers

The consolidation system is automatically triggered when:

1. **New files are added** to the memory-bank directory
   - A file watcher checks for new files every 5 minutes
2. **Context reload** occurs via the `update-memory-bank.js` script
   - The consolidation runs after each memory bank update
3. **Background consolidation** runs via the `background-consolidate.sh` script
   - Part of the regular maintenance process

## Manual Consolidation

You can also manually trigger the consolidation process by:

1. Running the consolidation script directly:
   ```bash
   ./scripts/consolidate-memory-bank.sh
   ```

2. Using the word "consolidate" in a prompt, which will automatically trigger the consolidation process

## Implementation Details

The consolidation system consists of several components:

1. **`memory-bank-consolidation.js`** - The main script that performs the consolidation
2. **`setup-memory-bank-consolidation.sh`** - Sets up the triggers and hooks
3. **`ensure-node.sh`** - Ensures Node.js is installed and properly configured
4. **`watch-memory-bank.sh`** - Watches for new files in the memory bank
5. **`context-reload-hook.sh`** - Runs after context reload
6. **`consolidate-memory-bank.sh`** - Manual trigger script

## Logs and Status

The consolidation system maintains logs and status information in:

- **`logs/memory-bank-consolidation.log`** - Detailed log of consolidation activities
- **`context/latest-checkpoint.md`** - Record of consolidation checkpoints
- **`status/status-log.md`** - Summary of consolidation activities

## Conflict Resolution

When the system detects conflicts between files (significantly different content in the same sections), it:

1. Keeps both versions of the content
2. Adds a note indicating the conflict
3. Logs the conflict in the checkpoint and status files

## Node.js Environment

The consolidation system requires Node.js to run. The system includes an automatic Node.js setup script:

1. **`ensure-node.sh`** - Checks if Node.js is installed and installs it if necessary
   - Uses nvm (Node Version Manager) to install and manage Node.js
   - Reads the `.nvmrc` file to determine which Node.js version to use
   - Falls back to Node.js v18 if no `.nvmrc` file is found
   - Enables corepack for package manager version control
   - Installs dependencies if needed

All scripts that use Node.js will automatically check for its presence and install it if necessary.

## Large File Handling

The consolidation system includes special handling for large files:

1. **Size Detection** - Files larger than 100MB are detected automatically
2. **Limited Analysis** - Large files are analyzed using system tags and filenames only
3. **Grep-Based Scanning** - System tags are detected using grep instead of loading the entire file
4. **Metadata-Only Merging** - When consolidating large files, only metadata is merged, not content
5. **Reference Preservation** - The consolidated file includes references to the original large files
6. **Error Handling** - Files larger than 2GB are handled gracefully without crashing

This approach ensures the system can handle files of any size without running into memory limitations.

## Best Practices

To work effectively with the consolidation system:

1. **Use consistent naming** for related files
2. **Add system tags** (`#infra`, `#firebase`, etc.) to help identify related files
3. **Use clear section headings** to help the system identify and merge content correctly
4. **Include citations and sources** at the end of files to preserve attribution
5. **Maintain the `.nvmrc` file** to ensure consistent Node.js versions

## Maintenance

The consolidation system is designed to run automatically, but you can:

1. **Review the logs** periodically to ensure it's working correctly
2. **Manually trigger** consolidation if you notice duplication
3. **Update the configuration** in `memory-bank-consolidation.js` if needed

## Conclusion

The memory bank consolidation system helps maintain a clean, organized, and efficient memory bank by automatically identifying and merging related files. This reduces duplication, improves knowledge organization, and makes it easier to find and use information in the memory bank.
