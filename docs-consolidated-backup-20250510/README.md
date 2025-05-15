# AI Sports Edge Documentation Consolidation

This directory contains the consolidated documentation for the AI Sports Edge project. The documentation has been organized into categories based on content and purpose, making it easier to find and reference information.

## Directory Structure

- **00-MASTER-INDEX.md** - Master index file with links to all categories
- **01-gpt-personas/** - GPT instructions and persona definitions
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

## Maintenance

The documentation is maintained using automated scripts:

- `automate-doc-consolidation.sh` - Sets up the documentation consolidation system
- `~/.roocode/scripts/run-full-consolidation.sh` - Runs the full consolidation process
- `~/.roocode/scripts/categorize-docs.sh` - Categorizes markdown files based on content
- `~/.roocode/scripts/deduplicate-docs.sh` - Removes duplicate files

To update the consolidated documentation, run:

```bash
~/.roocode/scripts/run-full-consolidation.sh
```

## Last Consolidation

May 10, 2025