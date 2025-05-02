# 🧠 AI Sports Edge — Project Setup & Automation Guide

This folder is the core operational system for AI Sports Edge. It contains automation scripts, daily logs, and structured documentation.

---

## ✅ Folder Structure

| Folder | Purpose |
|--------|---------|
| `/kickoffs/` | Daily kickoff briefing files (auto-created at 5PM) |
| `/features/` | Feature changelog + task board |
| `/system/` | Governance structure + prompt routines |
| `cron-log.txt` | System activity and failure log |

---

## ⚙️ .command Files (Daily Automation)

| File | Runs At | Purpose |
|------|---------|---------|
| `start-my-day.command` | 8:00 AM | Kickoff review, task board + feature log |
| `save-and-wrap-midday.command` | 12:00 PM | Sync task updates, review flags |
| `daily-wrap-evening.command` | 5:00 PM | Logs day, preps kickoff for tomorrow |
| `overnight-sync-late-night.command` | 11:00 PM | Model + data checks, GPT triggers |
| `auto-archive-kickoff.command` | 12:01 AM | Moves yesterday’s kickoff to archive |
| `pulse-check.command` | Anytime | Shows live status of kickoff/tasks/features |
| `setup-all-cron.command` | Once | Installs all of the above into your Mac's cron scheduler |

---

## 📦 How to Set Up (First Time Only)

Open Terminal and run:
```bash
cd ~/Desktop/ai-sports-edge
chmod +x *.command
./setup-all-cron.command
```

---

## 🛠 Manual Utilities

- Run `./pulse-check.command` any time to get a system overview
- Review `cron-log.txt` for past execution results or errors

---

## 🧠 Maintainer: Lisa Dario
For help, contact your Chief of Staff GPT (Olive).
