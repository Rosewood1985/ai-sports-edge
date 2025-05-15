# GPT Management System

This document provides an overview of the GPT Management System for AI Sports Edge, which helps organize, track, and maintain GPT instructions across the project.

## System Overview

The GPT Management System consists of:

1. **Consolidated Directory Structure**: Organized categories for different types of GPT instructions
2. **Usage Tracking**: Tools to monitor how instructions are used
3. **Templates**: Standardized formats for creating new instructions
4. **Review Process**: Regular evaluation of instruction effectiveness
5. **Automation**: Scripts to streamline management tasks

## Directory Structure

```
/docs-consolidated/01-gpt-personas/consolidated/
├── 00-MASTER-GPT-INSTRUCTIONS.md
├── claude/
│   ├── claude-3.7-instructions.md
│   ├── claude-support-prompts.md
│   └── ...
├── chatgpt/
│   ├── gpt-4-instructions.md
│   ├── gpt-3.5-instructions.md
│   └── ...
├── specialized/
│   ├── deployment-instructions.md
│   ├── update-instructions.md
│   └── ...
├── templates/
│   ├── claude-instruction-template.md
│   ├── chatgpt-instruction-template.md
│   ├── specialized-instruction-template.md
│   └── ...
├── usage-tracking/
│   ├── usage-log.md
│   ├── monthly-stats.md
│   └── ...
├── reviews/
│   ├── review-2025-05.md
│   └── ...
└── archived/
    ├── deprecated-instructions.md
    └── ...
```

## Scripts

The system includes several scripts to automate management tasks:

### 1. Track GPT Usage

```bash
./scripts/track-gpt-usage.sh [instruction-file]
```

This script logs the usage of GPT instructions and can generate monthly statistics.

**Options:**
- No arguments: Just initialize the log file
- `[instruction-file]`: Log the usage of a specific instruction file
- `--stats`: Generate monthly usage statistics

### 2. Create New GPT Instruction

```bash
./scripts/create-new-gpt-instruction.sh
```

This interactive script helps create new GPT instruction files from templates.

The script will:
1. Prompt for template type (Claude, ChatGPT, or Specialized)
2. Ask for instruction name and purpose
3. Create a properly formatted file in the appropriate directory
4. Update the master index
5. Log the creation in the usage tracking system

### 3. Review GPT Instructions

```bash
./scripts/review-gpt-instructions.sh
```

This script performs a monthly review of GPT instructions, checking for:
- Outdated instructions
- Naming consistency
- Usage patterns
- Potential improvements

It generates a review file with a checklist for manual completion.

### 4. Setup GPT Review Cron Job

```bash
./scripts/setup-gpt-review-cron.sh
```

This script sets up a cron job to automatically run the review script on the 1st of each month at 1:00 AM.

## Usage Workflow

### Creating a New Instruction

1. Run `./scripts/create-new-gpt-instruction.sh`
2. Follow the prompts to select template and provide details
3. Edit the created file to add specific instruction content
4. Commit the changes to the repository

### Using Instructions

1. Find the appropriate instruction in the master index
2. Use the instruction with the relevant AI model
3. Log the usage with `./scripts/track-gpt-usage.sh [instruction-file]`

### Monthly Review Process

1. The review script runs automatically on the 1st of each month
2. Review the generated checklist in the reviews directory
3. Complete the manual review steps
4. Implement any necessary changes or improvements
5. Commit the completed review

## Maintenance

- Keep the master index updated with all instruction files
- Run the usage tracking script whenever instructions are used
- Complete monthly reviews thoroughly
- Archive outdated instructions rather than deleting them
- Use templates for all new instructions

## Last Updated

May 10, 2025