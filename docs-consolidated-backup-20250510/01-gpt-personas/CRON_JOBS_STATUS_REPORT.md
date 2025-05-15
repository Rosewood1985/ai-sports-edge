# AI Sports Edge — Cron Jobs Status Report

**Version:** v1.0  
**Last Updated:** April 27, 2025

---

## ✅ Active Cron Jobs

| Cron Job | Purpose | Frequency | Status |
|:--|:--|:--|:--|
| **Daily Project Cleanup** | Removes stale build files, cache folders, ghost files, and stale Git branches. Ensures a clean development environment. | 3:00 AM daily | ✅ Active |
| **Daily Documentation Watchdog** | Verifies critical documentation files exist (e.g., Founder Overview, Internal Team Structure, Private GPTs). Auto-recreates placeholder if missing. | 2:30 AM daily | ✅ Active |

---

## ⚙️ In Progress / Upcoming Cron Jobs

| Cron Job | Purpose | Status | Planned Actions |
|:--|:--|:--|:--|
| **Automated Firebase Health Check** | Ping Firebase endpoints to verify uptime, catch hosting errors early. | ⚠️ Partial Draft | Finalize script, activate daily ping cron, store health logs |
| **Automated Odds/Data Preloading** | Periodically preload odds snapshots into Firestore or local cache to ensure rapid odds loading for users. | 🚫 Not Started | After odds API integration stabilizes (next major feature milestone) |
| **Daily Feature/Progress Logging** (NEW) | Automatically document features added, bugs fixed, major tasks completed each day. Maintain updated progress log and feature file. | 🚧 Planning Phase | Plan script, define "progress capture" sources, generate markdown daily |

---

## 🧠 Future Ideas

- Weekly compressed snapshot of `/docs/` and critical `/src/` folders for backup.
- Automated changelog update based on Git commit parsing.
- Dynamic performance monitoring and alerting for API response times.

---

**Notes:**  
All active cron jobs are logged to `/logs/` with timestamps.  
New automation targets will further professionalize ops for investor and launch-readiness.