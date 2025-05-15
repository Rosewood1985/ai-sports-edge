#!/bin/bash

# Create the main organization structure
mkdir -p ~/.roocode/gpt-instructions/{active,archive,workflows,governance,reference}
mkdir -p ~/.roocode/gpt-instructions/active/personas
mkdir -p ~/.roocode/gpt-instructions/active/team
mkdir -p ~/.roocode/gpt-instructions/active/workflows

# Copy Olive instructions (use the most comprehensive version)
cp ~/Desktop/ai-sports-edge/command-kickoff-updates/olive-governance-prompts.md \
   ~/.roocode/gpt-instructions/active/personas/olive-instructions.md

# Copy the simpler Olive governance rule as a standalone governance file
cp ~/Desktop/ai-sports-edge/olive-governance-prompts.md \
   ~/.roocode/gpt-instructions/governance/file-execution-clarity.md

# Copy Claude instructions
cp ~/Desktop/temp-gpt-search/uncertain/claude-3.7-instructions-ai-sports-edge.md \
   ~/.roocode/gpt-instructions/active/personas/claude-instructions.md

# Copy support prompts
cp ~/Desktop/temp-gpt-search/uncertain/claude-support-prompts-ai-sports-edge.md \
   ~/.roocode/gpt-instructions/active/personas/claude-support-prompts.md 2>/dev/null

# Copy Rajiv's partial instructions
cp ~/Desktop/ai-sports-edge/rajiv-explains-script.md \
   ~/.roocode/gpt-instructions/active/personas/rajiv-partial.md

# Copy team structure and operating procedures
cp ~/Desktop/ai-sports-edge/command-kickoff-updates/operating-structure.md \
   ~/.roocode/gpt-instructions/active/team/operating-structure.md

cp ~/Desktop/ai-sports-edge/task-board.md \
   ~/.roocode/gpt-instructions/active/workflows/task-board-template.md

# Copy command workflows
cp -r ~/Desktop/ai-sports-edge/command-kickoff-updates/*.command \
      ~/.roocode/gpt-instructions/active/workflows/ 2>/dev/null

# Create a master index file
cat > ~/.roocode/gpt-instructions/README.md << 'EOM'
# AI Sports Edge GPT Instructions Index

## Active Personas

### 🧠 Core AI Assistants
- **Olive**: Main coordinator and task manager
  - File: `active/personas/olive-instructions.md`
  - Role: Daily/weekly task coordination, approvals workflow
  
- **Claude 3.7**: Development assistant (Boomerang Mode)
  - File: `active/personas/claude-instructions.md`
  - Role: Senior developer, code review, refactoring
  
- **Rajiv**: Model integrity specialist (partial instructions)
  - File: `active/personas/rajiv-partial.md`
  - Role: ML model performance, odds generation

### 👥 Team Structure
Based on operating structure, the team includes:
- **Samuel Pepe (CTO)**: Firebase, infrastructure
- **Grant Langford**: Referral operations
- **Clarke Everett**: Finance
- **Camille Reyes**: Copy/A-B testing
- **Sloane Bennett**: Brand/social media
- **Lucía Morales**: i18n/Spanish
- **Charlie**: Short-form content
- **Mira**: Long-form content

## Governance Rules
- File Execution Clarity: `governance/file-execution-clarity.md`
- Operating Structure: `active/team/operating-structure.md`

## Workflows
- Daily workflows: `active/workflows/`
- Task board template: `active/workflows/task-board-template.md`

## Missing Persona Instructions
Note: Individual instructions for team members (Samuel, Grant, Camille, etc.) were not found as separate files but are referenced in operating structure.

## Usage
Access any persona's instructions:
```bash
cat ~/.roocode/gpt-instructions/active/personas/[persona-name]-instructions.md
```
EOM

echo "GPT instructions organized successfully at ~/.roocode/gpt-instructions/"
echo "View the index at ~/.roocode/gpt-instructions/README.md"