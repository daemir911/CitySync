#!/bin/bash
# Scheduled push script for CitySync — runs once then removes itself from cron

cd /home/meet/Documents/CitySync-main

git config user.name "Meet8376"
git config user.email "Meet8376@users.noreply.github.com"

if ! git diff --quiet || ! git diff --cached --quiet; then
  git add .
  git commit -m "chore: scheduled update $(date '+%Y-%m-%d %H:%M')"
else
  git commit --allow-empty -m "chore: scheduled sync $(date '+%Y-%m-%d %H:%M')"
fi

git push origin meet:main --force

# Remove all CitySync scheduled cron jobs after the last one runs
# Each job removes itself; when all 6 have run the crontab will be empty
crontab -l 2>/dev/null | grep -v "scheduled_push.sh" | crontab -
