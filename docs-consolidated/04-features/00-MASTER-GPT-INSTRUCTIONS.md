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

Last updated: May 10, 2025