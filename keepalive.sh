#!/bin/bash
# PU-ALRMS Dev Server Keep-Alive Script
# Automatically restarts the dev server if it crashes

LOG_FILE="/home/z/my-project/dev.log"
HEALTH_URL="http://localhost:3000/"
MAX_LOG_SIZE=5242880  # 5MB max log size

truncate_log() {
  if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
    tail -1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
    echo "=== Log rotated at $(date) ===" >> "$LOG_FILE"
  fi
}

while true; do
  truncate_log
  
  # Check if server is already running
  if curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null | grep -q "200"; then
    sleep 10
    continue
  fi
  
  echo "=== Starting dev server at $(date) ===" >> "$LOG_FILE"
  cd /home/z/my-project && bun run dev >> "$LOG_FILE" 2>&1
  
  echo "=== Server stopped at $(date), restarting in 3s ===" >> "$LOG_FILE"
  sleep 3
done
