# ✅ Roo Context Checkpoint

Last Updated: 2025-05-14

## 🧠 Current Mode

> Select one **primary mode** and any number of **optional behavior flags** below.

### 🔘 Primary Mode (select only one)
- [x] cleaning-only
- [ ] generation-allowed
- [ ] read-only
- [ ] consolidation-mode
- [ ] formatting-mode
- [ ] deployment-mode
- [ ] review-mode
- [ ] test-mode

### 🧩 Optional Behavior Flags
- [x] no new file creation allowed
- [x] memory-bank consolidation active
- [x] format with Prettier after each save
- [ ] allow code generation for missing modules
- [ ] auto-run test suite after file edits
- [ ] auto-trigger deploy after checkpoint update
- [ ] read-only for audit: no saves or formatting

---

🔁 Roo, enforce the selected primary mode and all checked behavior flags. Do not act on unchecked or empty items. Reflect these selections in your operating state and daily recap.

## 🛑 Restrictions
- No creation of new files without explicit approval
- No modification of deployment scripts without review
- Maintain atomic architecture patterns

## 🧾 Active Tracking
- 🧠 Memory: /memory-bank/activeContext.md
- ✅ Status log: /status/status-log.md
- 📈 Progress: /memory-bank/progress.md
- 📋 Batch Review: /batch-review.md

## 📦 Runtime Expectations
- Run `npm run format:memory-bank` after every save
- If Prettier fails, use fallback formatting via scripts/fallback-memory-bank-consolidation.sh
- Pause on context reload unless this file is loaded

## 🔔 Daily Recap Reminder
- At 9 AM, output recap from batch-review + status-log
