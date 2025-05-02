#!/bin/bash
echo "🌇 AI Sports Edge — 5:00 PM Evening Wrap"
echo ""
echo "📣 FOUNDER URGENT TASK BRIEF:"
echo "- Approve Mira & Charlie's educational drafts"
echo "- Check unresolved items from midday"
echo "- Review all team check-ins and GPT task loops"
echo ""

echo "📝 Generating kickoff for tomorrow..."
TOMORROW=$(date -v+1d +"%Y-%m-%d")
KICKOFF_PATH="$HOME/Desktop/ai-sports-edge/kickoffs/${TOMORROW}-kickoff.md"

if [ ! -f "$KICKOFF_PATH" ]; then
cat <<EOF > "$KICKOFF_PATH"
# 📦 AI Sports Edge – ${TOMORROW} Kickoff

**Date:** ${TOMORROW}  
**Owner:** Chief of Staff GPT (Olive)  
**Purpose:** Prepare team and founder for daily execution.

---

## 🔁 Rolling Task Feed
- Pulled from task-board.md

## 🧠 Olive Sync Checklist
- Review model outputs
- Finalize social
- Confirm Stripe
EOF
    echo "✅ Created kickoff file for ${TOMORROW}"
else
    echo "ℹ️ Kickoff file already exists for ${TOMORROW}"
fi

open -a "Visual Studio Code" "$KICKOFF_PATH"
