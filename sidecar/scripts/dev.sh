#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CAREOPS_DIR="${CAREER_OPS_PATH:-$HOME/prods/job_automation/career-ops}"

cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "${OPENCODE_PID:-}" ] && kill "$OPENCODE_PID" 2>/dev/null || true
  [ -n "${SIDECAR_PID:-}" ] && kill "$SIDECAR_PID" 2>/dev/null || true
  wait 2>/dev/null
  echo "Done."
}

trap cleanup EXIT INT TERM

# Start opencode serve if not already running
if ! curl -sf http://127.0.0.1:4196/health >/dev/null 2>&1; then
  echo "Starting opencode serve..."
  cd "$CAREOPS_DIR"
  opencode serve --hostname 127.0.0.1 --port 4196 --print-logs --log-level INFO &
  OPENCODE_PID=$!
  cd "$ROOT_DIR"

  # Wait for opencode to be ready
  for i in $(seq 1 10); do
    if curl -sf http://127.0.0.1:4196/health >/dev/null 2>&1; then
      echo "opencode ready"
      break
    fi
    sleep 1
  done
fi

# Start sidecar
echo "Starting sidecar..."
npx tsx watch src/index.ts &
SIDECAR_PID=$!

# Wait for sidecar
for i in $(seq 1 10); do
  if curl -sf http://127.0.0.1:4197/health >/dev/null 2>&1; then
    echo "sidecar ready on :4197"
    break
  fi
  sleep 1
done

echo ""
echo "=== Services ==="
echo "  opencode:  http://127.0.0.1:4196"
echo "  sidecar:   http://127.0.0.1:4197"
echo "  sidecar WS: http://127.0.0.1:4198"
echo ""
echo "Press Ctrl+C to stop"

wait
