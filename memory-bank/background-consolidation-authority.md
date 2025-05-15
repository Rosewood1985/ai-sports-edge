# Memory Bank Consolidation Authority

This document serves as the authority for memory bank consolidation rules and processes. It defines how memory bank files are managed, consolidated, and formatted.

## Consolidation Rules

### Trigger Conditions

Automatic consolidation is triggered when:
- 2 or more files in /roocode/memory_bank.md or the memory-bank directory
- Have ≥75% topic overlap (similar keywords in title or content like "Firebase", "auth", "API key", "headers", "deployment", "CSP", etc.)
- OR share system-level tags like #infra, #firebase, #security, #deployment

### Consolidation Process

1. **Cluster** related files using fuzzy matching to group by theme
2. **Select a base file** - the most refined and up-to-date file as the primary version
3. **Consolidate** - merge all content into one canonical file following naming conventions
4. **Archive deprecated fragments** - rename merged files with `.deprecated.md` or move to `/archive/memory-bank/`
5. **Log the merge** - update checkpoint and status log files
6. **Notify** if there are conflicting advice or ambiguity

### Large File Handling

- Files larger than 100MB are treated specially:
  - Only system tags are extracted (not full content)
  - They are excluded from detailed content analysis
  - They are not formatted with Prettier
  - When used as base files, a simplified merging approach is used

## Formatting Rules

### Prettier Enforcement

All memory bank files are automatically formatted with Prettier according to the project's `.prettierrc` configuration:

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "arrowParens": "avoid"
}
```

### Formatting Process

1. Formatting is applied:
   - On every file Roo edits, creates, merges, or modifies
   - Before saving or pushing to the file system
   - During memory bank consolidation or markdown generation
   - When the `format:memory-bank` script is run

2. Large files (>100MB) are skipped during formatting to prevent memory issues

3. Formatting is applied to these file types:
   - `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.css`, `.scss`, `.html`

### Implementation

- The formatting is implemented in `scripts/format-memory-bank.js`
- A shell wrapper is available at `scripts/format-memory-bank.sh`
- The script is added to package.json as `format:memory-bank`
- The script uses the project's Node.js environment via `ensure-node.sh`

## Consolidation Implementation

The consolidation system is implemented in:
- `scripts/memory-bank-consolidation.js` - Main consolidation script
- `scripts/setup-memory-bank-consolidation.sh` - Setup script for automatic triggers
- `scripts/ensure-node.sh` - Node.js environment management
- `scripts/consolidate-memory-bank.sh` - Shell wrapper for manual consolidation

## Checkpoint and Logging

- Consolidation and formatting events are logged
- A checkpoint file is updated at `context/latest-checkpoint.md`
- Status logs are maintained in `status/status-log.md`

Last updated: 2025-05-13