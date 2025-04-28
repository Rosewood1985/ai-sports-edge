# AI Sports Edge Documentation

---

## Purpose

This folder contains the core internal documentation for AI Sports Edge.  
It supports operational management, product development, investor communications, and long-term project scaling.

✅ All critical documents are automatically monitored by the Docs Watchdog system.

---

## Contents

| File | Description |
|:--|:--|
| `INTERNAL_TEAM_STRUCTURE.md` | Defines core business and operational roles |
| `PRIVATE_GPTS.md` | Defines autonomous Private GPT roles and tasks |
| `GIT_HELPER_CHEATSHEET.md` | Daily Git workflow and best practices cheat sheet |
| `FOUNDER_OVERVIEW_v1.0.md` | 6–8 page founder document outlining product, ML model, market, roadmap |
| `README_WATCHDOG.md` | Explains Docs Watchdog automation system |
| `README_GITHUB_LABELS.md` | GitHub issue/PR label standardization guide |

---

## Automation

- The `/scripts/docs_watchdog.py` script monitors all critical documentation.
- The `/scripts/schedule_docs_watchdog.sh` script schedules a daily 2 AM cron job to automatically run the watchdog.
- Any missing documentation will be auto-created, Git staged, committed, and pushed.

✅ Ensures continuous documentation integrity.  
✅ Prevents accidental gaps during active development.

---

## Last Updated

**Version:** v1.0  
**Date:** April 27, 2025