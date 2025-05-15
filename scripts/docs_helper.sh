#!/bin/bash

# Function to list all documentation
list_docs() {
    echo "=== Available Project Documentation ==="
    echo ""
    echo "📁 Directory Structure:"
    tree .roocode/documentation/ 2>/dev/null || find .roocode/documentation -type d | sed 's/^/  /'
    echo ""
    echo "📄 All Documentation Files:"
    find .roocode/documentation -type f -name "*.md" -o -name "*.txt" | sed 's/^/  /'
    echo ""
    echo "Usage: ./scripts/docs_helper.sh view <path-to-file>"
}

# Function to view documentation
view_doc() {
    local doc_path="$1"
    
    if [ -f "$doc_path" ]; then
        echo "=== Viewing: $doc_path ==="
        echo ""
        cat "$doc_path"
    elif [ -f ".roocode/documentation/$doc_path" ]; then
        echo "=== Viewing: .roocode/documentation/$doc_path ==="
        echo ""
        cat ".roocode/documentation/$doc_path"
    else
        echo "Document not found: $doc_path"
        echo ""
        echo "Available documents:"
        find .roocode/documentation -type f -name "*.md" -o -name "*.txt" | sed 's/^/  /'
    fi
}

# Function to search documentation
search_docs() {
    local query="$1"
    echo "=== Searching documentation for: '$query' ==="
    echo ""
    grep -r -i "$query" .roocode/documentation/ 2>/dev/null | head -20
}

# Function to show operating procedures
show_procedures() {
    echo "=== Operating Procedures ==="
    echo ""
    find .roocode/documentation/operating-procedures -type f 2>/dev/null | while read -r file; do
        echo "📋 $(basename "$file")"
        head -5 "$file" | sed 's/^/   /'
        echo ""
    done
}

# Main script logic
case "$1" in
    "list")
        list_docs
        ;;
    "view")
        if [ -z "$2" ]; then
            echo "Please specify a document to view"
            list_docs
        else
            view_doc "$2"
        fi
        ;;
    "search")
        if [ -z "$2" ]; then
            echo "Please specify a search query"
        else
            search_docs "$2"
        fi
        ;;
    "procedures")
        show_procedures
        ;;
    *)
        echo "Documentation Helper Script"
        echo ""
        echo "Usage:"
        echo "  ./scripts/docs_helper.sh list        - List all documentation"
        echo "  ./scripts/docs_helper.sh view <file> - View specific document"
        echo "  ./scripts/docs_helper.sh search <q>  - Search documentation"
        echo "  ./scripts/docs_helper.sh procedures  - Show operating procedures"
        echo ""
        list_docs
        ;;
esac
