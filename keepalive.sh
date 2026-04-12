#!/bin/bash
cd /home/z/my-project
while true; do
  echo "=== $(date) Starting dev server ===" >> /home/z/my-project/dev.log
  bun --bun run dev >> /home/z/my-project/dev.log 2>&1
  EC=$?
  echo "=== $(date) Exited ($EC), restarting in 3s ===" >> /home/z/my-project/dev.log
  pkill -f "next-server" 2>/dev/null
  sleep 3
done
