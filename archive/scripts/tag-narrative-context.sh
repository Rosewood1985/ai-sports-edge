#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Scanning and Tagging Narrative Context Files ===${NC}"

# Create status/essential-documents.md if it doesn't exist
if [ ! -f "status/essential-documents.md" ]; then
  mkdir -p status
  echo "# Essential Documents" > status/essential-documents.md
  echo "" >> status/essential-documents.md
  echo "This file maintains a canonical log of key files in the project." >> status/essential-documents.md
  echo "" >> status/essential-documents.md
  echo "## Narrative Context Files" >> status/essential-documents.md
  echo "" >> status/essential-documents.md
  echo -e "${GREEN}Created status/essential-documents.md${NC}"
else
  # Check if the Narrative Context Files section exists
  if ! grep -q "## Narrative Context Files" status/essential-documents.md; then
    echo "" >> status/essential-documents.md
    echo "## Narrative Context Files" >> status/essential-documents.md
    echo "" >> status/essential-documents.md
    echo -e "${GREEN}Added Narrative Context Files section to status/essential-documents.md${NC}"
  fi
fi

# Primary candidates to tag
PRIMARY_CANDIDATES=(
  "docs/ai-sports-edge-comprehensive-documentation.md"
  "memory-bank/comprehensive-ai-sports-edge-plan.md"
  "memory-bank/combined-architecture-with-optimizations.md"
  "docs/PROJECT_HISTORY.md"
  "docs/FOUNDER_OVERVIEW_v1.0.md"
  "memory-bank/productContext.md"
  "docs/project-analysis/development-history.md"
)

# Function to tag a file with ROO-NARRATIVE-CONTEXT
tag_file() {
  local file=$1
  
  if [ -f "$file" ]; then
    # Check if file already has the tag
    if grep -q "ROO-NARRATIVE-CONTEXT" "$file"; then
      echo -e "${YELLOW}File already tagged: $file${NC}"
    else
      # Add the tag at the top of the file
      temp_file=$(mktemp)
      echo "<!-- ROO-NARRATIVE-CONTEXT -->" > "$temp_file"
      cat "$file" >> "$temp_file"
      mv "$temp_file" "$file"
      echo -e "${GREEN}Tagged file: $file${NC}"
      
      # Add to essential-documents.md
      if ! grep -q "$file" status/essential-documents.md; then
        echo "- [$file]($file) - Tagged as narrative context" >> status/essential-documents.md
        echo -e "${GREEN}Added to essential-documents.md: $file${NC}"
      fi
    fi
  else
    echo -e "${RED}File not found: $file${NC}"
  fi
}

# Tag primary candidates
echo -e "${BLUE}Tagging primary candidates...${NC}"
for file in "${PRIMARY_CANDIDATES[@]}"; do
  tag_file "$file"
done

# Update memory-bank/activeContext.md
echo -e "${BLUE}Updating memory-bank/activeContext.md...${NC}"
if [ -f "memory-bank/activeContext.md" ]; then
  # Check if Narrative Context section exists
  if ! grep -q "## Narrative Context Files" memory-bank/activeContext.md; then
    echo "" >> memory-bank/activeContext.md
    echo "## Narrative Context Files" >> memory-bank/activeContext.md
    echo "" >> memory-bank/activeContext.md
    echo "The following files contain important narrative context for the project:" >> memory-bank/activeContext.md
    echo "" >> memory-bank/activeContext.md
    
    for file in "${PRIMARY_CANDIDATES[@]}"; do
      if [ -f "$file" ]; then
        echo "- [$file]($file)" >> memory-bank/activeContext.md
      fi
    done
    
    echo -e "${GREEN}Added Narrative Context Files section to activeContext.md${NC}"
  else
    echo -e "${YELLOW}Narrative Context Files section already exists in activeContext.md${NC}"
  fi
else
  echo -e "${RED}activeContext.md not found${NC}"
fi

# Update memory-bank/progress.md
echo -e "${BLUE}Updating memory-bank/progress.md...${NC}"
if [ -f "memory-bank/progress.md" ]; then
  # Add entry to progress.md
  echo "" >> memory-bank/progress.md
  echo "## Narrative Context Files Tagging ($(date +%Y-%m-%d))" >> memory-bank/progress.md
  echo "" >> memory-bank/progress.md
  echo "Tagged the following files with ROO-NARRATIVE-CONTEXT:" >> memory-bank/progress.md
  echo "" >> memory-bank/progress.md
  
  for file in "${PRIMARY_CANDIDATES[@]}"; do
    if [ -f "$file" ]; then
      echo "- [$file]($file)" >> memory-bank/progress.md
    fi
  done
  
  echo "" >> memory-bank/progress.md
  echo "These files contain strategic vision, user flow psychology, design decisions, and investor insights." >> memory-bank/progress.md
  echo -e "${GREEN}Added entry to progress.md${NC}"
else
  echo -e "${RED}progress.md not found${NC}"
fi

# Update background-consolidation-authority.md
echo -e "${BLUE}Updating memory-bank/background-consolidation-authority.md...${NC}"
if [ -f "memory-bank/background-consolidation-authority.md" ]; then
  # Check if Document Consolidation section exists
  if ! grep -q "## Document Consolidation and Strategic Context" memory-bank/background-consolidation-authority.md; then
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "## Document Consolidation and Strategic Context" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "### Standing Instructions" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "#### Historical Context Awareness" >> memory-bank/background-consolidation-authority.md
    echo "- Always reference PROJECT_HISTORY.md, productContext.md, decisionLog.md, and any files tagged // ROO-NARRATIVE-CONTEXT" >> memory-bank/background-consolidation-authority.md
    echo "- If new documents reference prior ideas, merge or link them to the most complete historical source" >> memory-bank/background-consolidation-authority.md
    echo "- Pull summaries from app-history.md and progress.md when compiling milestone reports, dashboards, or investor summaries" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "#### Deduplication Strategy" >> memory-bank/background-consolidation-authority.md
    echo "- Do not assume the most recent document is the best" >> memory-bank/background-consolidation-authority.md
    echo "- Prioritize the file with the most refined explanation" >> memory-bank/background-consolidation-authority.md
    echo "- Use fuzzy matching and context scoring to compare documents" >> memory-bank/background-consolidation-authority.md
    echo "- Keep only one canonical version of each idea, merging fragments into it" >> memory-bank/background-consolidation-authority.md
    echo "- Archive superseded or partial versions with // ROO-CONSOLIDATED" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "#### Architecture & File Structure Guidelines" >> memory-bank/background-consolidation-authority.md
    echo "- Apply atomic architecture at all times:" >> memory-bank/background-consolidation-authority.md
    echo "  - Atoms → simple facts, functions, or concepts" >> memory-bank/background-consolidation-authority.md
    echo "  - Molecules → composed strategies or plans" >> memory-bank/background-consolidation-authority.md
    echo "  - Organisms → fully integrated feature sets or workflows" >> memory-bank/background-consolidation-authority.md
    echo "- Reflect this in both:" >> memory-bank/background-consolidation-authority.md
    echo "  - File structure (src/atomic/, docs/atomic/, etc.)" >> memory-bank/background-consolidation-authority.md
    echo "  - Documentation organization" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "#### File Reduction Principle" >> memory-bank/background-consolidation-authority.md
    echo "- Default to merging, not duplicating" >> memory-bank/background-consolidation-authority.md
    echo "- Avoid redundant .md files with similar titles or partial content" >> memory-bank/background-consolidation-authority.md
    echo "- Reuse and update existing files before creating a new one" >> memory-bank/background-consolidation-authority.md
    echo "- Maintain a canonical log of key files in status/essential-documents.md" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "#### Memory & Tagging" >> memory-bank/background-consolidation-authority.md
    echo "- All relevant findings should be reflected in:" >> memory-bank/background-consolidation-authority.md
    echo "  - progress.md" >> memory-bank/background-consolidation-authority.md
    echo "  - activeContext.md" >> memory-bank/background-consolidation-authority.md
    echo "  - todo.json" >> memory-bank/background-consolidation-authority.md
    echo "  - task-rolling-log.md" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "### Future Plan" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "Once other merges complete, consolidate narrative context files into a single, well-formatted document (likely named vision-and-system-architecture.md) with sections like:" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo "- Vision & Mission" >> memory-bank/background-consolidation-authority.md
    echo "- Design Philosophy" >> memory-bank/background-consolidation-authority.md
    echo "- Feature Summary" >> memory-bank/background-consolidation-authority.md
    echo "- Architecture Summary" >> memory-bank/background-consolidation-authority.md
    echo "- Investor Overview" >> memory-bank/background-consolidation-authority.md
    echo "- Timeline & Milestones" >> memory-bank/background-consolidation-authority.md
    echo "" >> memory-bank/background-consolidation-authority.md
    echo -e "${GREEN}Added Document Consolidation and Strategic Context section to background-consolidation-authority.md${NC}"
  else
    echo -e "${YELLOW}Document Consolidation and Strategic Context section already exists in background-consolidation-authority.md${NC}"
  fi
else
  echo -e "${RED}background-consolidation-authority.md not found${NC}"
fi

echo -e "${GREEN}Narrative context tagging completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)${NC}"

# Log observation to status/roo-observations.md
echo -e "${BLUE}Logging observation to status/roo-observations.md${NC}"
if [ -f "status/roo-observations.md" ]; then
  echo "" >> status/roo-observations.md
  echo "### [narrative-tagging] @ $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> status/roo-observations.md
  echo "- ✅ Tagged primary narrative context files" >> status/roo-observations.md
  echo "- ✅ Updated memory-bank/activeContext.md with narrative context references" >> status/roo-observations.md
  echo "- ✅ Added entry to memory-bank/progress.md" >> status/roo-observations.md
  echo "- ✅ Updated background-consolidation-authority.md with document consolidation instructions" >> status/roo-observations.md
  echo "- ✅ Created/updated status/essential-documents.md" >> status/roo-observations.md
  echo "" >> status/roo-observations.md
  echo "---" >> status/roo-observations.md
  echo -e "${GREEN}Observation logged successfully${NC}"
else
  echo -e "${RED}status/roo-observations.md not found${NC}"
fi