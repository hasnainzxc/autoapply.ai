#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════╗"
echo "║        Stopping ApplyMate            ║"
echo "╚══════════════════════════════════════╝"

PORTS="4196 4197 8000 3000"

# Kill processes by port
for port in $PORTS; do
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
    sleep 0.3
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      kill -9 $pids 2>/dev/null || true
    fi
    echo "  [OK] Killed :$port"
  else
    echo "  [..] Nothing on :$port"
  fi
done

# Stop Docker
echo ""
echo "📦 Stopping Docker containers..."
docker stop applymate-pg applymate-redis 2>/dev/null \
  && echo "  [OK] Docker stopped" \
  || echo "  [..] Docker not running"

echo ""
echo "✅ All services stopped."
