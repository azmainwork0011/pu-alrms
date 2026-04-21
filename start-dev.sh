#!/bin/bash
cd /home/z/my-project
while true; do
  npx next dev -p 3000
  echo "Dev server exited, restarting in 3s..."
  sleep 3
done
