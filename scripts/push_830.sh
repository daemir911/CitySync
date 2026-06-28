#!/bin/bash
cd /home/meet/Documents/CitySync-main
git config user.name "Meet8376"
git config user.email "Meet8376@users.noreply.github.com"
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add . && git commit -m "chore: scheduled update $(date '+%Y-%m-%d %H:%M')"
else
  git commit --allow-empty -m "chore: scheduled sync $(date '+%Y-%m-%d %H:%M')"
fi
git push origin meet:main --force
crontab -l | grep -v "push_830.sh" | crontab -
