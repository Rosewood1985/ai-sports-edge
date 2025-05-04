# 🌀 Boomerang Mode Operational Standards (AI Sports Edge)

Boomerang Mode is for rapid iteration on core systems: Firebase (auth, Firestore, config), React Native (Expo), Stripe integration, and betting logic. You must maintain a **lean, deduplicated file structure** with no clutter or redundant files.

## ✅ Directory Structure (Strict)
```
/scripts     → CLI and automation scripts  
/functions   → Firebase functions  
/public      → Static assets  
/status      → Logs (e.g. status-log.md)  
/tasks       → Task and changelog files  
/docs        → Technical/user documentation  
/src         → React Native and web frontend code  
```

## ❗ Rules

- **Do NOT** create file copies with suffixes like `-copy`, `-old`, `-final`, or timestamps (`index-20250422.js`)
- **USE** Git branches or tags for backups — not file duplication
- **MOVE** deprecated files to `/archive` (create the folder if missing)

## 🔁 Duplicate Detection (Pre-write Check)
```bash
if cmp -s ./dist/index.html ./public/index.html; then
  echo "Identical file exists – skipping copy"
else
  cp ./dist/index.html ./public/index.html
fi
```

## 🧼 Cleanup in Deploy/Gen Scripts
```bash
rm -rf ./temp-deploy/* ./legacy-builds/*
```

## 🏷️ Naming Conventions

- Scripts: `lowercase-with-dashes.command`
- JS/TS files: `camelCase.js`
- No suffixes or versioned filenames in-place

## 🧪 Optional Enforcement

Run `clean-docs-folder.command` to:
- Purge `.bak`, duplicate `.md`, or unnecessary logs
- Log all cleanup in `/status/status-log.md`

## 🧭 If In Doubt

Check the `README.md` or confirm before committing.