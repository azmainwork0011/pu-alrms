#!/bin/bash
cd /home/z/my-project
while true; do
  npx next dev -p 3000 2>&1 | tee /tmp/next-server.log
  echo "=== Server died at $(date), restarting in 2s ===" >> /tmp/next-server.log
  sleep 2
done
