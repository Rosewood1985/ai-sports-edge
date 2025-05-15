#!/bin/bash

# Create organized directory structure
echo "Creating documentation organization structure..."
mkdir -p ~/.roocode/consolidated-docs/gpt-personas
mkdir -p ~/.roocode/consolidated-docs/architecture
mkdir -p ~/.roocode/consolidated-docs/implementation-plans
mkdir -p ~/.roocode/consolidated-docs/features
mkdir -p ~/.roocode/consolidated-docs/business
mkdir -p ~/.roocode/consolidated-docs/deployment
mkdir -p ~/.roocode/consolidated-docs/ui-ux
mkdir -p ~/.roocode/consolidated-docs/workflows
mkdir -p ~/.roocode/consolidated-docs/archive
mkdir -p ~/.roocode/consolidated-docs/review

# Create comprehensive categorization script
cat > ~/.roocode/scripts/categorize-docs.sh << 'CATEGORIZE'
#!/bin/bash

# Define categories and their patterns
declare -A CATEGORIES
CATEGORIES[gpt-personas]="instruct|prompt|gpt|claude|olive|samuel|rajiv|persona"
CATEGORIES[architecture]="atomic|architecture|structure|design|system|technical"
CATEGORIES[implementation-plans]="implement|plan|roadmap|strategy|milestone"
CATEGORIES[features]="feature|functional|requirement|spec|enhancement"
CATEGORIES[business]="business|revenue|subscription|pricing|market|analytics"
CATEGORIES[deployment]="deploy|hosting|setup|config|ci/cd|firebase"
CATEGORIES[ui-ux]="ui|ux|design|mockup|wireframe|user|interface|neon"
CATEGORIES[workflows]="workflow|process|automation|cron|task|board"

# Process all markdown files in the project
find ~/Desktop/ai-sports-edge -name "*.md" | while read file; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        content=$(cat "$file" | tr '[:upper:]' '[:lower:]')
        
        # Check each category
        for category in "${!CATEGORIES[@]}"; do
            if echo "$content" | grep -qi "${CATEGORIES[$category]}"; then
                # Copy with timestamp if duplicate exists
                target=~/.roocode/consolidated-docs/$category/$(basename "$file")
                if [ -f "$target" ]; then
                    timestamp=$(date +%Y%m%d_%H%M%S)
                    target=~/.roocode/consolidated-docs/$category/${filename%.*}_$timestamp.${filename##*.}
                fi
                cp "$file" "$target"
                echo "Categorized: $filename -> $category"
            fi
        done
    fi
done
CATEGORIZE

chmod +x ~/.roocode/scripts/categorize-docs.sh

# Create deduplication script
cat > ~/.roocode/scripts/deduplicate-docs.sh << 'DEDUPE'
#!/bin/bash

# Deduplicate files in each category
for category in ~/.roocode/consolidated-docs/*; do
    if [ -d "$category" ]; then
        echo "Deduplicating in $(basename "$category")..."
        
        # Group files by base name
        for file in "$category"/*.md; do
            [ -f "$file" ] || continue
            base_name=$(basename "$file" | sed 's/_[0-9]\{8\}_[0-9]\{6\}//g')
            
            # Find all versions of this file
            versions=($(find "$category" -name "${base_name%.*}*" | sort -r))
            
            if [ ${#versions[@]} -gt 1 ]; then
                # Keep the largest file (likely most complete)
                largest_file=""
                largest_size=0
                
                for version in "${versions[@]}"; do
                    size=$(stat -f%z "$version" 2>/dev/null || stat -c%s "$version" 2>/dev/null)
                    if [ $size -gt $largest_size ]; then
                        largest_size=$size
                        largest_file="$version"
                    fi
                done
                
                # Move duplicates to archive
                for version in "${versions[@]}"; do
                    if [ "$version" != "$largest_file" ]; then
                        mkdir -p ~/.roocode/consolidated-docs/archive/$(basename "$category")
                        mv "$version" ~/.roocode/consolidated-docs/archive/$(basename "$category")/
                        echo "Archived duplicate: $(basename "$version")"
                    fi
                done
            fi
        done
    fi
done
DEDUPE

chmod +x ~/.roocode/scripts/deduplicate-docs.sh

# Create master consolidation script
cat > ~/.roocode/scripts/run-full-consolidation.sh << 'MASTER'
#!/bin/bash

echo "Starting full documentation consolidation..."

# Ensure scripts directory exists
mkdir -p ~/.roocode/scripts

# Step 1: Categorize
echo "1/3: Categorizing documents..."
~/.roocode/scripts/categorize-docs.sh

# Step 2: Deduplicate
echo "2/3: Removing duplicates..."
~/.roocode/scripts/deduplicate-docs.sh

# Step 3: Create final structure
echo "3/3: Creating final documentation structure..."
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/01-gpt-personas
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/02-architecture
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/03-implementation
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/04-features
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/05-business
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/06-deployment
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/07-ui-ux
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/08-workflows
mkdir -p ~/Desktop/ai-sports-edge/docs-consolidated/99-archive

# Copy organized files
for category in ~/.roocode/consolidated-docs/*; do
    if [ -d "$category" ]; then
        cat_name=$(basename "$category")
        case $cat_name in
            gpt-personas) target_dir="01-gpt-personas" ;;
            architecture) target_dir="02-architecture" ;;
            implementation-plans) target_dir="03-implementation" ;;
            features) target_dir="04-features" ;;
            business) target_dir="05-business" ;;
            deployment) target_dir="06-deployment" ;;
            ui-ux) target_dir="07-ui-ux" ;;
            workflows) target_dir="08-workflows" ;;
            archive) target_dir="99-archive" ;;
            *) target_dir="99-archive" ;;
        esac
        
        cp -r "$category"/* ~/Desktop/ai-sports-edge/docs-consolidated/$target_dir/ 2>/dev/null
    fi
done

# Create master index
cat > ~/Desktop/ai-sports-edge/docs-consolidated/00-MASTER-INDEX.md << 'INDEX'
# AI Sports Edge - Master Documentation Index

*Generated: $(date)*

## Document Categories

1. [GPT Personas](01-gpt-personas/) - All GPT instructions and persona definitions
2. [Architecture](02-architecture/) - System design and technical architecture
3. [Implementation Plans](03-implementation/) - Roadmaps and implementation strategies
4. [Features](04-features/) - Feature specifications and requirements
5. [Business](05-business/) - Business plans, revenue models, and analytics
6. [Deployment](06-deployment/) - Deployment guides and configurations
7. [UI/UX](07-ui-ux/) - Design systems and user experience guides
8. [Workflows](08-workflows/) - Process automation and task management
9. [Archive](99-archive/) - Historical versions and deprecated docs

## Search Tips

- Use file names for quick navigation
- Check consolidated files in review directory
- Original files preserved in archive

## Last Consolidation
$(date)

INDEX

echo ""
echo "=== Consolidation Complete ==="
echo "Documentation available at: ~/Desktop/ai-sports-edge/docs-consolidated/"
MASTER

chmod +x ~/.roocode/scripts/run-full-consolidation.sh

echo "=== Documentation Automation System Created ==="
echo ""
echo "To run the full consolidation:"
echo "  ~/.roocode/scripts/run-full-consolidation.sh"