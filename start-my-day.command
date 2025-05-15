#!/bin/bash
# AI Sports Edge - Daily Startup Script
# This script helps you start your day with AI Sports Edge

# Change to the project directory
cd "$(dirname "$0")"

# Display welcome message
echo "🚀 AI Sports Edge - Daily Startup - $(date '+%Y-%m-%d')"
echo "=================================================="
echo ""

# Display today's schedule
echo "📅 Today's Schedule:"
echo "-------------------"
echo "09:00 AM - Team standup (Zoom)"
echo "10:30 AM - Review Spanish UX wireframes with Lucía"
echo "01:00 PM - Edge Collective campaign planning with Sloane"
echo "03:30 PM - Revenue dashboard review with Clarke"
echo ""

# Display pending tasks
echo "📋 Pending Tasks:"
echo "---------------"
echo "- Approve Rajiv video script"
echo "- Finalize Spanish UX implementation timeline"
echo "- Review A/B test results for odds display variants"
echo "- Renew FanDuel affiliate dashboard access"
echo ""

# Display system status
echo "🖥️ System Status:"
echo "--------------"
echo "- Active servers: $(ps aux | grep -i server | grep -v grep | wc -l)"
echo "- Firebase status: Online"
echo "- Stripe webhooks: Active"
echo "- Latest deployment: $(ls -lt ./deploy | head -2 | tail -1 | awk '{print $6, $7, $8}')"
echo ""

# Display quick actions
echo "⚡ Quick Actions:"
echo "--------------"
echo "1. Run './pulse-check.command' for system overview"
echo "2. Run './generate-executive-brief.command' for latest metrics"
echo "3. Run './notification-system/test-daily-email.command' to test email system"
echo ""

echo "Have a productive day! 🚀"