# Command Routines

## System Automation Workflow

### Overview:
AI Sports Edge uses a set of `.command` files and cron jobs to automate key operational tasks. Below is the list of automation commands:

---

## ✅ Active Cron Jobs (as of April 30, 2025)

| Time      | Script                                 | Purpose |
|-----------|----------------------------------------|---------|
| 8:00 AM   | `start-my-day.command`                 | Start kickoff review, load Olive, surface overnight summaries and approvals, pull from kickoff and feature log |
| 12:00 PM  | `save-and-wrap-midday.command`         | Git push, sync tasks, update Olive on midday progress, review kickoff status |
| 5:00 PM   | `daily-wrap-evening.command`           | Clone tomorrow’s kickoff, log day’s work, prep overnight sync |
| 11:00 PM  | `overnight-sync-late-night.command`    | Run model + data integrity checks, social media prep, GPT handoff |
| 2:30 AM   | `update-model.sh`                      | Run background ML updates and performance tasks |
| 4:00 AM (Sunday) | `clean-database-weekly.command` | Weekly data hygiene and unresolved GPT thread audit |

---

## 📁 Output Log

All scripts output to:  
`~/Desktop/ai-sports-edge/cron-log.txt`

Check this file to view:
- Successful runs
- Errors or failed executions
- Timestamps for each action

---

## 📂 Kickoff Files

Kickoff files are saved to:  
`~/Desktop/ai-sports-edge/kickoffs/YYYY-MM-DD-kickoff.md`  
These are updated throughout the current day and finalized at 11:59 PM.

---

## 🔁 Instructions to Update

To update your cron schedule:
```bash
crontab -e
```
Then paste the updated block and `:wq` to save.
