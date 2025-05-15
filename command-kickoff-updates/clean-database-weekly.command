#!/bin/bash
# Weekly Database + Thread Cleanup – Sunday 4:00 AM

cd ~/Desktop/ai-sports-edge

# Trigger data cleaning processes (adjust to your infra)
bash ./scripts/clean-database.sh >> cron-log.txt 2>&1

# Prompt Olive to check all unresolved conversation threads
open "https://chat.openai.com/?message=Weekly+review+with+Olive%3A+Audit+unresolved+conversations+and+task+threads+from+the+past+7+days%2C+cross-check+against+team+completions+and+kickoff+files%2C+flag+open+items+for+Founder+and+CEO"
