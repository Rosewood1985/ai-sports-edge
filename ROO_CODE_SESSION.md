# ⚠️ IMPORTANT: NEW ROO CODE SESSION REMINDER ⚠️

## Run Context Loader at Start of Each Session

```bash
/workspaces/ai-sports-edge/load-context.sh
```

## Why This Is Critical

When starting a new Roo Code session, the AI assistant loses all previous context about the AI Sports Edge project. Running the context loader script is **essential** to provide Roo with:

1. **Project Master Context** - Overall architecture and current implementation status
2. **Quick Reference Commands** - Commonly used commands for the project
3. **File Consolidation Phase** - Current phase-specific information

## What the Context Loader Does

The script loads critical project information from:
- `.context/master-context.md` - Core project context
- `.context/quick-commands.md` - Essential commands reference
- `.context/prompts/file-consolidation.md` - Current phase details

## Consequences of Skipping This Step

Without running this script at the start of each session:
- Roo will lack critical project knowledge
- You'll need to repeatedly explain project architecture
- Implementation quality and consistency may suffer
- Development velocity will be significantly reduced

---

**ALWAYS run the context loader at the beginning of each new Roo Code session!**