#!/bin/bash
# payment-systems-consolidation.sh
# Script to implement the consolidation recommendations from the payment systems inventory
# Created: May 11, 2025

# Set up logging
LOG_FILE="status/payment-systems-consolidation-log.md"
mkdir -p status
echo "# Payment Systems Consolidation Log - $(date)" > "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "## Files Archived" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Create archive directory if it doesn't exist
mkdir -p archive/services
mkdir -p archive/screens
mkdir -p archive/xcode-git-ai-sports-edge/services

# Function to archive a file
archive_file() {
  local source_file=$1
  local target_dir=$2
  
  if [ -f "$source_file" ]; then
    # Get the filename without the path
    local filename=$(basename "$source_file")
    
    # Create the target directory if it doesn't exist
    mkdir -p "$target_dir"
    
    # Move the file to the archive
    mv "$source_file" "$target_dir/$filename"
    echo "- $source_file → $target_dir/$filename" >> "$LOG_FILE"
  else
    echo "- $source_file → Not found" >> "$LOG_FILE"
  fi
}

# Archive legacy/duplicate files
echo "### Legacy JavaScript Files" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
archive_file "services/stripeTaxService.js" "archive/services"
archive_file "services/paymentService.js" "archive/services"

echo "" >> "$LOG_FILE"
echo "### Duplicate Screen Files" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
archive_file "screens/RedeemGiftScreen.tsx" "archive/screens"

echo "" >> "$LOG_FILE"
echo "### Xcode Project Duplicates" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
archive_file "xcode-git-ai-sports-edge/services/subscriptionService.ts" "archive/xcode-git-ai-sports-edge/services"

# Create payment systems documentation index
echo "" >> "$LOG_FILE"
echo "## Documentation Index Created" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Create the documentation index
DOCS_INDEX="docs/payment-systems-index.md"

cat > "$DOCS_INDEX" << 'EOL'
# AI Sports Edge Payment Systems Documentation

This index provides links to all payment-related documentation in the AI Sports Edge project.

## Core Documentation

- [Stripe Integration Plan](./stripe-integration-plan.md)
- [Stripe Implementation](./stripe-implementation.md)
- [Stripe Subscription Status](./stripe-subscription-status.md)
- [Revenue Tax Implementation Plan](./revenue-tax-implementation-plan.md)

## Subscription Features

- [Subscription Screens Implementation](./subscription-screens-implementation.md)
- [Subscription Service Implementation](./subscription-service-implementation.md)
- [Gift Subscription Implementation](./gift-subscription-implementation.md)
- [Multiuser Subscription Implementation](./multiuser-subscription-implementation.md)
- [Subscription Analytics Tracking](./subscription-analytics-tracking.md)

## Microtransactions

- [Live Parlay Odds Microtransaction Plan](./live-parlay-odds-microtransaction-plan.md)
- [Microtransaction Analytics Dashboard Plan](./microtransaction-analytics-dashboard-plan.md)
- [FanDuel Microtransaction Integration](./fanduel-microtransaction-integration.md)

## Tax & Revenue

- [Revenue Tax Implementation Plan](./revenue-tax-implementation-plan.md)
- [Stripe Tax Integration](./stripe-tax-integration.md)
- [US Only Payments](./us-only-payments.md)
- [Refund Process](./refund-process.md)

## Implementation Guides

- [Stripe SDK Integration](./stripe-sdk-integration.md)
- [Stripe Integration Checklist](./stripe-integration-checklist.md)
- [Stripe Integration Next Steps](./stripe-integration-next-steps.md)

## Related Documentation

- [FanDuel Affiliate Implementation](./fanduel-affiliate-implementation-plan.md)
- [FanDuel Integration Summary](./fanduel-integration-summary.md)
- [Freemium Implementation Plan](./freemium-implementation-plan.md)

## Comprehensive Analysis

- [Payment Systems Inventory](../analysis-results/comprehensive-payment-systems-inventory.md)

*This index was automatically generated as part of the payment systems consolidation process.*
EOL

echo "- Created payment systems documentation index at $DOCS_INDEX" >> "$LOG_FILE"

# Create a commit message template
COMMIT_MESSAGE="commit-message-payment-systems-consolidation.txt"

cat > "$COMMIT_MESSAGE" << 'EOL'
chore: Consolidate payment systems and improve documentation

- Archived legacy JavaScript implementations (stripeTaxService.js, paymentService.js)
- Archived duplicate screen implementation (RedeemGiftScreen.tsx)
- Archived duplicate Xcode project files
- Created comprehensive payment systems documentation index
- Improved organization following atomic architecture principles

This commit implements the recommendations from the payment systems inventory analysis, focusing on consolidating duplicates, archiving outdated files, and maintaining a clean structure.
EOL

echo "" >> "$LOG_FILE"
echo "## Commit Message" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "A commit message template has been created at: $COMMIT_MESSAGE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "```" >> "$LOG_FILE"
cat "$COMMIT_MESSAGE" >> "$LOG_FILE"
echo "```" >> "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "## Next Steps" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "1. Review the archived files to ensure no critical functionality was lost" >> "$LOG_FILE"
echo "2. Update imports in any files that referenced the archived files" >> "$LOG_FILE"
echo "3. Consider migrating the remaining JavaScript services to TypeScript" >> "$LOG_FILE"
echo "4. Implement atomic architecture patterns for all payment-related services" >> "$LOG_FILE"
echo "5. Update the documentation index as new payment features are added" >> "$LOG_FILE"

echo "Payment systems consolidation script completed. See $LOG_FILE for details."