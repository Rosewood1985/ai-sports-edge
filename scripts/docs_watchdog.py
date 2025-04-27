#!/usr/bin/env python3

import os
import subprocess

# Define critical docs and minimal starter content
critical_docs = {
    "INTERNAL_TEAM_STRUCTURE.md": "# Internal Team Structure\n\n(Placeholder content)",
    "PRIVATE_GPTS.md": "# Private GPT Structure\n\n(Placeholder content)",
    "GIT_HELPER_CHEATSHEET.md": "# Git Helper Cheat Sheet\n\n(Placeholder content)",
    "FOUNDER_OVERVIEW_v1.0.md": "# Founder Overview\n\n(Placeholder content)"
}

docs_folder = "./docs/"

# Check and create missing docs
missing_files = []

for filename, content in critical_docs.items():
    filepath = os.path.join(docs_folder, filename)
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            f.write(content)
        missing_files.append(filepath)

# If any files were missing and created, stage, commit, and push them
if missing_files:
    subprocess.run(["git", "add"] + missing_files)
    subprocess.run(["git", "commit", "-m", "docs: Auto-create missing critical documentation files"])
    subprocess.run(["git", "push", "origin", "feature/atomic-architecture-20250422_152356"])
    print(f"✅ Created and pushed missing docs: {', '.join(missing_files)}")
else:
    print("✅ All critical docs are present.")