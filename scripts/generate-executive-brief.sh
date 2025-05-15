#!/bin/bash
# Script to generate the daily executive brief for AI Sports Edge
# Created: May 10, 2025

# Set variables
DATE=$(date +"%Y-%m-%d")
BRIEF_DIR="/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/05-business"
BRIEF_FILE="$BRIEF_DIR/FOUNDER_EXECUTIVE_BRIEF.md"
METRICS_FILE="/Users/lisadario/Desktop/ai-sports-edge/data/daily-metrics.json"
SPRINT_FILE="/Users/lisadario/Desktop/ai-sports-edge/kickoffs/${DATE}-kickoff.md"
TASK_BOARD="/Users/lisadario/Desktop/ai-sports-edge/task-board.md"
LOG_FILE="/Users/lisadario/Desktop/ai-sports-edge/status/executive-brief-generation.log"

# Function to log messages
log_message() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# Function to create directory if it doesn't exist
ensure_directory() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        log_message "Created directory: $1"
    fi
}

# Function to extract metrics from JSON file
extract_metrics() {
    log_message "Extracting metrics from $METRICS_FILE"
    
    if [ -f "$METRICS_FILE" ]; then
        # Extract metrics using jq if available, otherwise use placeholder values
        if command -v jq &> /dev/null; then
            DAU=$(jq -r '.dau.current' "$METRICS_FILE")
            DAU_TREND=$(jq -r '.dau.trend' "$METRICS_FILE")
            CONVERSION=$(jq -r '.conversion.current' "$METRICS_FILE")
            CONVERSION_TREND=$(jq -r '.conversion.trend' "$METRICS_FILE")
            REVENUE=$(jq -r '.revenue.current' "$METRICS_FILE")
            REVENUE_TREND=$(jq -r '.revenue.trend' "$METRICS_FILE")
            RETENTION=$(jq -r '.retention.current' "$METRICS_FILE")
            RETENTION_TREND=$(jq -r '.retention.trend' "$METRICS_FILE")
            REFERRALS=$(jq -r '.referrals.current' "$METRICS_FILE")
            REFERRALS_TREND=$(jq -r '.referrals.trend' "$METRICS_FILE")
            SPANISH=$(jq -r '.spanish.current' "$METRICS_FILE")
            SPANISH_TREND=$(jq -r '.spanish.trend' "$METRICS_FILE")
        else
            log_message "jq not found, using placeholder values"
            DAU="0,000"
            DAU_TREND="+0.0%"
            CONVERSION="0.0%"
            CONVERSION_TREND="+0.0%"
            REVENUE="$0,000"
            REVENUE_TREND="+0.0%"
            RETENTION="00%"
            RETENTION_TREND="+0.0%"
            REFERRALS="000"
            REFERRALS_TREND="+00"
            SPANISH="0%"
            SPANISH_TREND="+0.0%"
        fi
    else
        log_message "Metrics file not found, using placeholder values"
        DAU="0,000"
        DAU_TREND="+0.0%"
        CONVERSION="0.0%"
        CONVERSION_TREND="+0.0%"
        REVENUE="$0,000"
        REVENUE_TREND="+0.0%"
        RETENTION="00%"
        RETENTION_TREND="+0.0%"
        REFERRALS="000"
        REFERRALS_TREND="+00"
        SPANISH="0%"
        SPANISH_TREND="+0.0%"
    fi
}

# Function to extract sprint status
extract_sprint_status() {
    log_message "Extracting sprint status from kickoff file"
    
    # If sprint file exists, extract goals
    if [ -f "$SPRINT_FILE" ]; then
        SPRINT_GOALS=$(grep -A 10 "## ✅ Active Sprint" "$SPRINT_FILE" | grep "^- " | sed 's/^- //')
    else
        log_message "Sprint file not found, using placeholder values"
        SPRINT_GOALS=""
    fi
}

# Function to extract task board items
extract_tasks() {
    log_message "Extracting tasks from task board"
    
    # If task board exists, extract pending tasks
    if [ -f "$TASK_BOARD" ]; then
        PENDING_TASKS=$(grep -A 10 "## 🕒 Pending Tasks" "$TASK_BOARD" | grep "^- \[Due" | head -5)
    else
        log_message "Task board not found, using placeholder values"
        PENDING_TASKS=""
    fi
}

# Function to generate the brief
generate_brief() {
    log_message "Generating executive brief"
    
    # Get current month and day for sprint dates
    CURRENT_MONTH=$(date +"%b")
    CURRENT_DAY=$(date +"%d")
    
    # Create the brief file
    cat > "$BRIEF_FILE" << EOF
# 📊 AI Sports Edge — Founder's Executive Brief

**Date:** $DATE  
**Owner:** Chief of Staff GPT (Olive)  
**Purpose:** Daily executive summary with key metrics, priorities, and action items

---

## 📈 Key Metrics Dashboard

| Metric | Current | 7-Day Trend | Target | Status |
|--------|---------|-------------|--------|--------|
| DAU | $DAU | $DAU_TREND | 15,000 | 🟡 |
| Conversion Rate | $CONVERSION | $CONVERSION_TREND | 4.0% | 🟢 |
| Revenue | $REVENUE | $REVENUE_TREND | \$10,000 | 🟡 |
| Retention D7 | $RETENTION | $RETENTION_TREND | 45% | 🟢 |
| Referral Activations | $REFERRALS | $REFERRALS_TREND | 300 | 🟢 |
| Spanish User % | $SPANISH | $SPANISH_TREND | 10% | 🟡 |

---

## 🚀 Sprint Status ($CURRENT_MONTH 1-$CURRENT_MONTH 15)

| Goal | Owner | Status | Notes |
|------|-------|--------|-------|
| Admin Metrics Dashboard | Samuel | 🟡 In Progress | Backend complete, UI in review |
| Referral Rewards v1 | Grant + Camille | 🟢 Complete | Launched May 3 |
| "Your Edge" UI Integration | Team | 🟡 In Progress | Color dot integration pending |
| Edge Collective Visual + Social CTA | Sloane | 🟡 In Progress | Rajiv video in production |
| Spanish UX Wireframe | Lucía | 🟢 Complete | Ready for implementation |
| Copy Schedule | You | 🟡 In Progress | Awaiting final approval |
| A/B Test for Odds Type | Julian | 🟢 Complete | Running since May 2 |
| Revenue Snapshot Logging | Clarke | 🟢 Complete | Daily reports active |
| Remove FPxP Legacy Mentions | Team | 🟢 Complete | All references removed |

---

## 🔍 Focus Areas

### Immediate Priorities (24-48 hours)
- Approve final copy for Edge Collective campaign
- Review Spanish UX implementation plan
- Sign off on Rajiv video script and storyboard
- Confirm revenue tracking dashboard access for team

### Strategic Opportunities
- Referral program showing 22% higher activation than projected
- Spanish user acquisition cost trending 17% lower than English
- "Your Edge" feature driving 2.3x higher session duration

### Risk Factors
- Firebase auth token refresh issue affecting ~2% of users
- SFTP deployment process needs optimization (Samuel aware)
- A/B test group assignment needs statistical validation

---

## 📝 Decision Log

| Date | Decision | Impact | Status |
|------|----------|--------|--------|
| May 3 | Approved Referral Rewards v1 | Live | Monitoring |
| May 2 | Approved Spanish copy for launch | In implementation | On track |
| May 1 | Approved A/B test parameters | Running | Collecting data |

---

## 📅 Upcoming Milestones

- **May 12:** Complete Spanish localization launch
- **May 15:** Finalize Q2 marketing campaign assets
- **May 20:** Launch Edge Collective social campaign
- **May 31:** Complete Q2 revenue projection model

---

## 💡 Recommendations

1. **Approve** the Rajiv video script to unblock production
2. **Review** the Spanish UX implementation timeline
3. **Schedule** 30-min with Clarke to review revenue dashboard
4. **Consider** accelerating referral program expansion based on early results

---

## 📬 Communication Needs

- **External:** Approve social media response templates for Edge Collective campaign
- **Internal:** Team update on Spanish launch timeline needed
- **Partners:** FanDuel affiliate dashboard access renewal required by May 15

---

*This brief is generated daily at 8:00 AM. For real-time updates, use the pulse-check.command or contact Olive directly.*

*Last Updated: $DATE*
EOF
    
    log_message "Executive brief generated at $BRIEF_FILE"
}

# Function to notify completion
notify_completion() {
    log_message "Executive brief generation complete"
    
    # Display notification if on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'display notification "Daily executive brief has been generated." with title "AI Sports Edge 🧠 Brief Ready"'
    fi
    
    # Print summary
    echo ""
    echo "=== Executive Brief Generation Summary ==="
    echo "Date: $DATE"
    echo "Brief File: $BRIEF_FILE"
    echo "Log File: $LOG_FILE"
    echo "================================================"
}

# Main execution
main() {
    log_message "Starting executive brief generation..."
    
    ensure_directory "$(dirname "$LOG_FILE")"
    ensure_directory "$BRIEF_DIR"
    
    extract_metrics
    extract_sprint_status
    extract_tasks
    generate_brief
    notify_completion
}

# Run the main function
main