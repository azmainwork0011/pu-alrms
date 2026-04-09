#!/bin/bash
cd /home/z/my-project
while true; do
  PORT=3000 NODE_ENV=production node .next/standalone/server.js
  echo "Server exited, restarting in 2s..."
  sleep 2
done
