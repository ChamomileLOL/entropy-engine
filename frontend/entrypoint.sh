#!/bin/sh

# frontend/entrypoint.sh

echo "Waiting for Entropy Engine Backend..."

# 1. Start timer
start_time=$(date +%s%N)

# 2. Ping the backend
curl -s http://backend:4000/ > /dev/null

# 3. Stop timer
end_time=$(date +%s%N)
duration=$((($end_time - $start_time)/1000000))

echo "Latency Check: ${duration}ms"

# 4. UPDATED TRAP: 5000ms (Realism Adjustment)
if [ "$duration" -gt 5000 ]; then
  echo "CRITICAL FAILURE: Backend too slow."
  exit 1
else
  echo "Latency Acceptable. SYSTEM START."
  npm run dev -- --host
fi