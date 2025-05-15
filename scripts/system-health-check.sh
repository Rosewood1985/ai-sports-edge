#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Timestamp for logs
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Create status directory if it doesn't exist
mkdir -p status

# Initialize log files
echo "# Consolidation Compliance Log" > status/consolidation-compliance.md
echo "" >> status/consolidation-compliance.md
echo "Last updated: $TIMESTAMP" >> status/consolidation-compliance.md
echo "" >> status/consolidation-compliance.md

echo "# Consolidation Violations Log" > status/consolidation-violations.md
echo "" >> status/consolidation-violations.md
echo "Last updated: $TIMESTAMP" >> status/consolidation-violations.md
echo "" >> status/consolidation-violations.md

echo "# System Health Summary" > status/system-health-summary.md
echo "" >> status/system-health-summary.md
echo "Last updated: $TIMESTAMP" >> status/system-health-summary.md
echo "" >> status/system-health-summary.md
echo "## Module Results" >> status/system-health-summary.md
echo "" >> status/system-health-summary.md

# Function to log to system health summary
log_summary() {
  local status=$1
  local module=$2
  local message=$3
  
  echo "### $module" >> status/system-health-summary.md
  echo "" >> status/system-health-summary.md
  echo "- $status $message" >> status/system-health-summary.md
  echo "" >> status/system-health-summary.md
}

# Function to log compliance
log_compliance() {
  local module=$1
  local message=$2
  
  echo "## $module" >> status/consolidation-compliance.md
  echo "" >> status/consolidation-compliance.md
  echo "- ✅ $message" >> status/consolidation-compliance.md
  echo "" >> status/consolidation-compliance.md
}

# Function to log violation
log_violation() {
  local module=$1
  local message=$2
  
  echo "## $module" >> status/consolidation-violations.md
  echo "" >> status/consolidation-violations.md
  echo "- ⚠️ $message" >> status/consolidation-violations.md
  echo "" >> status/consolidation-violations.md
}

# Function to log observation
log_observation() {
  local module=$1
  local message=$2
  
  if [ -f "status/roo-observations.md" ]; then
    echo "" >> status/roo-observations.md
    echo "### [system-health] @ $TIMESTAMP" >> status/roo-observations.md
    echo "- 🔍 $message" >> status/roo-observations.md
    echo "" >> status/roo-observations.md
    echo "---" >> status/roo-observations.md
    echo -e "${GREEN}Observation logged successfully${NC}"
  else
    echo -e "${RED}status/roo-observations.md not found${NC}"
  fi
}

# Module: Verify Consolidation Principles
verify_consolidation_principles() {
  echo -e "${BLUE}=== Verifying Consolidation Principles ===${NC}"
  
  local violations=0
  local compliances=0
  
  # Check if systemPatterns.md exists
  if [ -f "memory-bank/systemPatterns.md" ]; then
    log_compliance "Consolidation Principles" "memory-bank/systemPatterns.md exists"
    ((compliances++))
  else
    log_violation "Consolidation Principles" "memory-bank/systemPatterns.md not found"
    ((violations++))
  fi
  
  # Check if background-consolidation-authority.md exists
  if [ -f "memory-bank/background-consolidation-authority.md" ]; then
    log_compliance "Consolidation Principles" "memory-bank/background-consolidation-authority.md exists"
    ((compliances++))
  else
    log_violation "Consolidation Principles" "memory-bank/background-consolidation-authority.md not found"
    ((violations++))
  fi
  
  # Check for duplicate files in memory-bank
  echo -e "${BLUE}Checking for duplicate files in memory-bank...${NC}"
  local duplicate_count=$(find memory-bank -type f -name "*.md" | sort | uniq -d | wc -l)
  
  if [ "$duplicate_count" -eq 0 ]; then
    log_compliance "Consolidation Principles" "No duplicate files found in memory-bank"
    ((compliances++))
  else
    log_violation "Consolidation Principles" "$duplicate_count duplicate files found in memory-bank"
    ((violations++))
  fi
  
  # Check for files with forbidden terms
  echo -e "${BLUE}Checking for files with forbidden terms...${NC}"
  local forbidden_terms=("bet" "bettor" "gamble" "wager")
  local forbidden_count=0
  
  for term in "${forbidden_terms[@]}"; do
    local count=$(grep -r "$term" --include="*.md" --include="*.js" --include="*.ts" --include="*.tsx" . | wc -l)
    forbidden_count=$((forbidden_count + count))
    
    if [ "$count" -gt 0 ]; then
      log_violation "Consolidation Principles" "Found $count occurrences of forbidden term '$term'"
      ((violations++))
    fi
  done
  
  if [ "$forbidden_count" -eq 0 ]; then
    log_compliance "Consolidation Principles" "No forbidden terms found"
    ((compliances++))
  fi
  
  # Log summary
  if [ "$violations" -eq 0 ]; then
    log_summary "✅" "Consolidation Principles" "All checks passed ($compliances compliances)"
    echo -e "${GREEN}All consolidation principles verified successfully${NC}"
  else
    log_summary "⚠️" "Consolidation Principles" "$violations violations found, $compliances compliances"
    echo -e "${YELLOW}$violations consolidation principle violations found${NC}"
  fi
}

# Module: Verify Atomic Architecture
verify_atomic_architecture() {
  echo -e "${BLUE}=== Verifying Atomic Architecture ===${NC}"
  
  local violations=0
  local compliances=0
  
  # Check if atomic directory exists
  if [ -d "atomic" ]; then
    log_compliance "Atomic Architecture" "atomic directory exists"
    ((compliances++))
  else
    log_violation "Atomic Architecture" "atomic directory not found"
    ((violations++))
  fi
  
  # Check for atomic structure (atoms, molecules, organisms)
  if [ -d "atomic/atoms" ]; then
    log_compliance "Atomic Architecture" "atomic/atoms directory exists"
    ((compliances++))
  else
    log_violation "Atomic Architecture" "atomic/atoms directory not found"
    ((violations++))
  fi
  
  if [ -d "atomic/molecules" ]; then
    log_compliance "Atomic Architecture" "atomic/molecules directory exists"
    ((compliances++))
  else
    log_violation "Atomic Architecture" "atomic/molecules directory not found"
    ((violations++))
  fi
  
  if [ -d "atomic/organisms" ]; then
    log_compliance "Atomic Architecture" "atomic/organisms directory exists"
    ((compliances++))
  else
    log_violation "Atomic Architecture" "atomic/organisms directory not found"
    ((violations++))
  fi
  
  # Check for atomic architecture documentation
  if [ -f "memory-bank/atomic-architecture-memory.md" ]; then
    log_compliance "Atomic Architecture" "memory-bank/atomic-architecture-memory.md exists"
    ((compliances++))
  else
    log_violation "Atomic Architecture" "memory-bank/atomic-architecture-memory.md not found"
    ((violations++))
  fi
  
  # Log summary
  if [ "$violations" -eq 0 ]; then
    log_summary "✅" "Atomic Architecture" "All checks passed ($compliances compliances)"
    echo -e "${GREEN}All atomic architecture checks passed${NC}"
  else
    log_summary "⚠️" "Atomic Architecture" "$violations violations found, $compliances compliances"
    echo -e "${YELLOW}$violations atomic architecture violations found${NC}"
  fi
}

# Module: Verify Memory Bank Consistency
verify_memory_bank_consistency() {
  echo -e "${BLUE}=== Verifying Memory Bank Consistency ===${NC}"
  
  local violations=0
  local compliances=0
  
  # Check if memory-bank directory exists
  if [ -d "memory-bank" ]; then
    log_compliance "Memory Bank Consistency" "memory-bank directory exists"
    ((compliances++))
  else
    log_violation "Memory Bank Consistency" "memory-bank directory not found"
    ((violations++))
  fi
  
  # Check for required memory bank files
  local required_files=("activeContext.md" "productContext.md" "systemPatterns.md" "progress.md" "decisionLog.md")
  
  for file in "${required_files[@]}"; do
    if [ -f "memory-bank/$file" ]; then
      log_compliance "Memory Bank Consistency" "memory-bank/$file exists"
      ((compliances++))
    else
      log_violation "Memory Bank Consistency" "memory-bank/$file not found"
      ((violations++))
    fi
  done
  
  # Check for memory bank file updates in the last 7 days
  echo -e "${BLUE}Checking for recent memory bank updates...${NC}"
  local recent_updates=0
  
  for file in "${required_files[@]}"; do
    if [ -f "memory-bank/$file" ]; then
      local last_modified=$(stat -c %Y "memory-bank/$file")
      local current_time=$(date +%s)
      local days_since_modified=$(( (current_time - last_modified) / 86400 ))
      
      if [ "$days_since_modified" -lt 7 ]; then
        log_compliance "Memory Bank Consistency" "memory-bank/$file updated in the last 7 days"
        ((compliances++))
        ((recent_updates++))
      else
        log_violation "Memory Bank Consistency" "memory-bank/$file not updated in the last 7 days"
        ((violations++))
      fi
    fi
  done
  
  # Log summary
  if [ "$violations" -eq 0 ]; then
    log_summary "✅" "Memory Bank Consistency" "All checks passed ($compliances compliances)"
    echo -e "${GREEN}All memory bank consistency checks passed${NC}"
  else
    log_summary "⚠️" "Memory Bank Consistency" "$violations violations found, $compliances compliances"
    echo -e "${YELLOW}$violations memory bank consistency violations found${NC}"
  fi
}

# Module: Verify Narrative Context Tagging
verify_narrative_context_tagging() {
  echo -e "${BLUE}=== Verifying Narrative Context Tagging ===${NC}"
  
  local violations=0
  local compliances=0
  
  # Check if essential-documents.md exists
  if [ -f "status/essential-documents.md" ]; then
    log_compliance "Narrative Context Tagging" "status/essential-documents.md exists"
    ((compliances++))
  else
    log_violation "Narrative Context Tagging" "status/essential-documents.md not found"
    ((violations++))
  fi
  
  # Check for narrative context tags in primary candidates
  local primary_candidates=(
    "docs/ai-sports-edge-comprehensive-documentation.md"
    "memory-bank/comprehensive-ai-sports-edge-plan.md"
    "memory-bank/combined-architecture-with-optimizations.md"
    "docs/PROJECT_HISTORY.md"
    "docs/FOUNDER_OVERVIEW_v1.0.md"
    "memory-bank/productContext.md"
    "docs/project-analysis/development-history.md"
  )
  
  local tagged_count=0
  
  for file in "${primary_candidates[@]}"; do
    if [ -f "$file" ]; then
      if grep -q "ROO-NARRATIVE-CONTEXT" "$file"; then
        log_compliance "Narrative Context Tagging" "$file is tagged with ROO-NARRATIVE-CONTEXT"
        ((compliances++))
        ((tagged_count++))
      else
        log_violation "Narrative Context Tagging" "$file is not tagged with ROO-NARRATIVE-CONTEXT"
        ((violations++))
      fi
    fi
  done
  
  # Log summary
  if [ "$violations" -eq 0 ]; then
    log_summary "✅" "Narrative Context Tagging" "All checks passed ($compliances compliances)"
    echo -e "${GREEN}All narrative context tagging checks passed${NC}"
  else
    log_summary "⚠️" "Narrative Context Tagging" "$violations violations found, $compliances compliances"
    echo -e "${YELLOW}$violations narrative context tagging violations found${NC}"
  fi
}

# Main function
main() {
  echo -e "${BLUE}=== Running System Health Check at $TIMESTAMP ===${NC}"
  
  # Run all verification modules
  verify_consolidation_principles
  verify_atomic_architecture
  verify_memory_bank_consistency
  verify_narrative_context_tagging
  
  # Log observation
  log_observation "System Health Check" "System health check completed at $TIMESTAMP"
  
  echo -e "${GREEN}System health check completed at $TIMESTAMP${NC}"
}

# Run main function
main