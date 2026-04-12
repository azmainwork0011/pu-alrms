#!/bin/bash
# Check every 30 seconds, restart if dead
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000'; then
    echo "[$(date)] Port 3000 dead, restarting..." >> /home/z/my-project/monitor.log
    cd /home/z/my-project
    pkill -f "next-server" 2>/dev/null
    nohup bun --bun run dev > /home/z/my-project/dev.log 2>&1 &
    disown 2>/dev/null
    echo "[$(date)] Restarted" >> /home/z/my-project/monitor.log
  fi
  sleep 30
done
