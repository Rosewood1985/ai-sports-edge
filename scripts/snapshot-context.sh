#!/bin/bash

# Creates a timestamped snapshot of the current context
# Usage: /workspaces/ai-sports-edge/scripts/snapshot-context.sh [optional comment]

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
COMMENT=${1:-"regular-snapshot"}
SNAPSHOT_DIR="/workspaces/ai-sports-edge/.context/snapshots"

mkdir -p $SNAPSHOT_DIR
cp /workspaces/ai-sports-edge/.context/master-context.md "$SNAPSHOT_DIR/context_${TIMESTAMP}_${COMMENT}.md"
echo "Context snapshot created: $SNAPSHOT_DIR/context_${TIMESTAMP}_${COMMENT}.md"