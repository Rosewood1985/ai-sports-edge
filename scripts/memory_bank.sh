#!/bin/bash
# memory_bank.sh - Script to manage the memory bank

set -e

MEMORY_BANK=".roocode/memory_bank.md"

# Ensure memory bank exists
if [ ! -f "$MEMORY_BANK" ]; then
  mkdir -p "$(dirname "$MEMORY_BANK")"
  cat > "$MEMORY_BANK" << END
# AI Sports Edge Memory Bank

This file serves as a memory bank for the AI Sports Edge project. It contains important information about the project that can be referenced by the team.
END
fi

# Add an entry to the memory bank
add() {
  local section="$1"
  local subsection="$2"
  local content="$3"
  
  # Check if section exists
  if ! grep -q "^## $section$" "$MEMORY_BANK"; then
    # Add section
    echo -e "\n## $section" >> "$MEMORY_BANK"
  fi
  
  # Check if subsection exists
  if ! grep -q "^### $subsection$" "$MEMORY_BANK"; then
    # Add subsection
    echo -e "\n### $subsection" >> "$MEMORY_BANK"
  fi
  
  # Add content
  echo -e "\n$content" >> "$MEMORY_BANK"
  
  echo "Added '$subsection' to section '$section'"
}

# Get an entry from the memory bank
get() {
  local section="$1"
  local subsection="$2"
  
  # Extract content between subsection and next subsection or section
  sed -n "/^## $section$/,/^## /p" "$MEMORY_BANK" | sed -n "/^### $subsection$/,/^### /p" | sed '1d;$d'
}

# List all sections in the memory bank
list_sections() {
  grep "^## " "$MEMORY_BANK" | sed 's/^## //'
}

# List all subsections in a section
list_subsections() {
  local section="$1"
  
  sed -n "/^## $section$/,/^## /p" "$MEMORY_BANK" | grep "^### " | sed 's/^### //'
}

# Show help message
show_help() {
  echo "Memory Bank"
  echo "Usage: $0 <command> [arguments]"
  echo ""
  echo "Commands:"
  echo "  add <section> <subsection> <content>  Add an entry to the memory bank"
  echo "  get <section> <subsection>           Get an entry from the memory bank"
  echo "  list                                 List all sections in the memory bank"
  echo "  list <section>                       List all subsections in a section"
  echo "  help                                 Show this help message"
}

# Main command handler
case "$1" in
  add)
    add "$2" "$3" "$4"
    ;;
  get)
    get "$2" "$3"
    ;;
  list)
    if [ -z "$2" ]; then
      list_sections
    else
      list_subsections "$2"
    fi
    ;;
  help|*)
    show_help
    ;;
esac