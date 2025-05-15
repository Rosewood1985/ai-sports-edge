#!/bin/bash
# Protect documentation structure from unauthorized changes

PROTECTED_DIRS=(
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/01-gpt-personas"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/02-architecture"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/03-implementation"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/04-features"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/05-business"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/06-deployment"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/07-ui-ux"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/08-workflows"
    "/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/99-archive"
)

# Create a staging area for new files
STAGING_DIR="/Users/lisadario/Desktop/ai-sports-edge/docs-staging"
mkdir -p "$STAGING_DIR"

# Check for files in protected areas that weren't created by our scripts
for dir in "${PROTECTED_DIRS[@]}"; do
    find "$dir" -name "*.md" -mmin -1440 ! -path "*/consolidated/*" -print0 | while IFS= read -r -d '' file; do
        echo "Warning: New file detected in protected area: $file"
        # Optionally, move to staging
        # mv "$file" "$STAGING_DIR/"
    done
done

echo "File structure protection check complete."