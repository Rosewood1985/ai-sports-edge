# AI Sports Edge Documentation Consolidation

This directory contains the consolidated documentation for the AI Sports Edge project. The documentation has been organized into categories based on content and purpose, making it easier to find and reference information.

## Directory Structure

- **00-MASTER-INDEX.md** - Master index file with links to all categories
- **01-gpt-personas/** - GPT instructions and persona definitions
  - **consolidated/** - Organized GPT instructions by model and purpose
    - **00-MASTER-GPT-INSTRUCTIONS.md** - Master index for all GPT instructions
    - **claude/** - Claude-specific instructions
    - **chatgpt/** - ChatGPT-specific instructions
    - **specialized/** - Task-specific instructions
    - **archived/** - Deprecated instruction files
- **02-architecture/** - System design and technical architecture
- **03-implementation/** - Roadmaps and implementation strategies
- **04-features/** - Feature specifications and requirements
- **05-business/** - Business plans, revenue models, and analytics
- **06-deployment/** - Deployment guides and configurations
- **07-ui-ux/** - Design systems and user experience guides
- **08-workflows/** - Process automation and task management
- **99-archive/** - Historical versions and deprecated docs

## Usage

1. Start with the [Master Index](00-MASTER-INDEX.md) for an overview of all categories
2. Navigate to the specific category directory for detailed documentation
3. Check the archive directory for historical versions of documents
4. For GPT instructions, refer to the [GPT Instructions Master Index](01-gpt-personas/consolidated/00-MASTER-GPT-INSTRUCTIONS.md)

## Maintenance

The documentation is maintained using automated scripts:

- `automate-doc-consolidation.sh` - Sets up the documentation consolidation system
- `~/.roocode/scripts/run-full-consolidation.sh` - Runs the full consolidation process
- `~/.roocode/scripts/categorize-docs.sh` - Categorizes markdown files based on content
- `~/.roocode/scripts/deduplicate-docs.sh` - Removes duplicate files
- `./scripts/update-consolidation-script.sh` - Updates the consolidation script to properly format dates
- `./scripts/setup-docs-cron.sh` - Sets up automated cron jobs for regular consolidation
- `./scripts/consolidate-gpt-instructions.sh` - Consolidates GPT instruction files
- `./scripts/consolidate-gpt-instructions.command` - GUI-friendly wrapper for GPT instruction consolidation

### Script Permissions

Ensure all scripts are executable:

```bash
chmod +x ~/.roocode/scripts/run-full-consolidation.sh
chmod +x ~/.roocode/scripts/categorize-docs.sh
chmod +x ~/.roocode/scripts/deduplicate-docs.sh
chmod +x ./scripts/update-consolidation-script.sh
chmod +x ./scripts/setup-docs-cron.sh
chmod +x ./scripts/consolidate-gpt-instructions.sh
chmod +x ./scripts/consolidate-gpt-instructions.command
```

### Manual Update

To update the consolidated documentation manually, run:

```bash
~/.roocode/scripts/run-full-consolidation.sh
```

To update the GPT instructions specifically:

```bash
./scripts/consolidate-gpt-instructions.sh
```

Or double-click the `consolidate-gpt-instructions.command` file in Finder.

### Automated Updates

The documentation is automatically consolidated on the following schedule:

- **Weekly**: Every Monday at 3:00 AM
- **Monthly**: On the 1st of each month at 2:00 AM

To set up or update the automated schedule, run:

```bash
./scripts/setup-docs-cron.sh
```

### Backup Process

To create a backup of the consolidated documentation with a date stamp:

```bash
./scripts/backup-docs-consolidated.sh
```

This will create a backup at `~/Desktop/ai-sports-edge/docs-consolidated-backup-YYYYMMDD/` and log the backup in the status directory.

## Last Consolidation

May 10, 2025