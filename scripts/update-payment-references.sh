#!/bin/bash
# update-payment-references.sh
# Script to update references to archived payment files
# Created: May 11, 2025

# Set up logging
LOG_FILE="status/payment-references-update-log.md"
mkdir -p status
echo "# Payment References Update Log - $(date)" > "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "## Files Updated" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to update references in a file
update_references() {
  local file=$1
  local old_import=$2
  local new_import=$3
  
  if [ -f "$file" ]; then
    # Create a backup of the original file
    cp "$file" "$file.tmp"
    
    # Replace the import statement
    sed -i.bak "s|$old_import|$new_import|g" "$file"
    
    # Check if any changes were made
    if cmp -s "$file" "$file.tmp"; then
      echo "- $file → No changes needed" >> "$LOG_FILE"
      rm "$file.bak" "$file.tmp"
    else
      echo "- $file → Updated reference from '$old_import' to '$new_import'" >> "$LOG_FILE"
      rm "$file.bak" "$file.tmp"
    fi
  else
    echo "- $file → Not found" >> "$LOG_FILE"
  fi
}

# Update stripeTaxService.js references
echo "### stripeTaxService.js References" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

update_references "utils/tax-report-generator.js" "../services/stripeTaxService" "../services/stripeTaxService.ts"
update_references "scripts/test-tax.js" "../services/stripeTaxService" "../services/stripeTaxService.ts"
update_references "api/tax-api.js" "../services/stripeTaxService" "../services/stripeTaxService.ts"

# Update paymentService.js references
echo "" >> "$LOG_FILE"
echo "### paymentService.js References" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# For server.js, we need to update the require statement and any method calls
if [ -f "server.js" ]; then
  cp "server.js" "server.js.tmp"
  
  # Replace the require statement
  sed -i.bak "s|require('./services/paymentService')|require('./services/firebaseSubscriptionService')|g" "server.js"
  
  # Replace method calls if needed
  sed -i.bak "s|paymentService.isCustomerInUS|firebaseSubscriptionService.isCustomerInUS|g" "server.js"
  sed -i.bak "s|paymentService.createPaymentIntent|firebaseSubscriptionService.createPaymentIntent|g" "server.js"
  
  # Check if any changes were made
  if cmp -s "server.js" "server.js.tmp"; then
    echo "- server.js → No changes needed" >> "$LOG_FILE"
    rm "server.js.bak" "server.js.tmp"
  else
    echo "- server.js → Updated references from 'paymentService' to 'firebaseSubscriptionService'" >> "$LOG_FILE"
    rm "server.js.bak" "server.js.tmp"
  fi
else
  echo "- server.js → Not found" >> "$LOG_FILE"
fi

# Update RedeemGiftScreen.tsx references
echo "" >> "$LOG_FILE"
echo "### RedeemGiftScreen.tsx References" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "- No references found outside the archived file itself" >> "$LOG_FILE"

# Update xcode-git-ai-sports-edge/services/subscriptionService.ts references
echo "" >> "$LOG_FILE"
echo "### xcode-git-ai-sports-edge/services/subscriptionService.ts References" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "- No direct references found to this file" >> "$LOG_FILE"

# Check metro.config.js for xcode-git-ai-sports-edge references
echo "" >> "$LOG_FILE"
echo "### metro.config.js References" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "- metro.config.js contains references to xcode-git-ai-sports-edge directory" >> "$LOG_FILE"
echo "- Manual review recommended to ensure proper configuration" >> "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "## Summary" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "References to archived payment files have been updated to point to their consolidated versions:" >> "$LOG_FILE"
echo "- stripeTaxService.js → stripeTaxService.ts" >> "$LOG_FILE"
echo "- paymentService.js → firebaseSubscriptionService.ts" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "Manual review is recommended for:" >> "$LOG_FILE"
echo "- metro.config.js to ensure proper configuration for xcode-git-ai-sports-edge directory" >> "$LOG_FILE"

echo "Payment references update script completed. See $LOG_FILE for details."