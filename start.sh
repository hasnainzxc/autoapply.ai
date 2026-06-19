#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# ApplyMate — Start/Stop All Services
# ─────────────────────────────────────────────────────────────
# Usage:
#   ./start.sh          # start all services
#   ./start.sh start    # same
#   ./start.sh stop     # kill all + stop docker
# ─────────────────────────────────────────────────────────────

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
info() { echo -e "${YELLOW}[ .. ]${NC} $1"; }

# ── Service definitions ─────────────────────────────────────
# Fields: name|port|health_spec|start_cmd|workdir|logfile
# health_spec: "http://..." for curl, or "docker_health:container_name"

SERVICES=(
  "postgres|5432|docker_health:applymate-pg|docker start applymate-pg|.|/dev/null"
  "redis|6379|docker_health:applymate-redis|docker start applymate-redis|.|/dev/null"
  "backend|8000|http://localhost:8000/api/health|uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload|${PROJECT_ROOT}/backend|/tmp/backend.log|PYTHONPATH"
  "sidecar|4197|http://localhost:4197/health|npm run dev|${PROJECT_ROOT}/sidecar|/tmp/sidecar.log"
  "opencode|4196|systemd_active:opencode-serve|systemctl --user start opencode-serve|.|/dev/null"
  "frontend|3000|http://localhost:3000|npm run dev|${PROJECT_ROOT}/frontend|/tmp/frontend.log"
)

# ── Helpers ──────────────────────────────────────────────────

port_alive() {
  local port=$1
  (echo >/dev/tcp/localhost/"$port") 2>/dev/null
}

docker_alive() {
  local name=$1
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$name"
}

health_ok() {
  local spec=$1
  if [[ "$spec" == docker_health:* ]]; then
    docker_alive "${spec#docker_health:}"
    return $?
  elif [[ "$spec" == systemd_active:* ]]; then
    systemctl --user is-active "${spec#systemd_active:}" >/dev/null 2>&1
    return $?
  else
    curl -sf --max-time 3 "$spec" >/dev/null 2>&1
    return $?
  fi
}

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.5
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
    ok "Killed process(es) on port $port"
  else
    info "Nothing running on port $port"
  fi
}

# ── Stop ─────────────────────────────────────────────────────

stop() {
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║        Stopping All Services         ║"
  echo "╚══════════════════════════════════════╝"
  echo ""

  # Kill services in reverse order (skip docker — handled separately)
  for ((i = ${#SERVICES[@]} - 1; i >= 0; i--)); do
    IFS='|' read -r name port _ _ _ _ <<< "${SERVICES[$i]}"
    [[ "$name" == "postgres" || "$name" == "redis" ]] && continue
    info "Stopping $name (:${port})..."
    kill_port "$port"
  done

  echo ""
  info "Stopping Docker containers..."
  docker stop applymate-pg applymate-redis 2>/dev/null \
    && ok "Docker containers stopped" \
    || info "Docker containers not running"
  echo ""
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

# ── Start ────────────────────────────────────────────────────

start() {
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║       Starting ApplyMate Services    ║"
  echo "╚══════════════════════════════════════╝"
  echo ""

  started_ports=()

  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name port health_spec start_cmd workdir logfile envvar <<< "$entry"

    echo ""
    info "Starting $name (:${port})..."

    # Skip if already running
    if [[ "$health_spec" == docker_health:* ]]; then
      if docker_alive "${health_spec#docker_health:}"; then
        ok "$name already running"
        started_ports+=("$port")
        continue
      fi
    else
      if port_alive "$port"; then
        ok "$name already running on :$port"
        started_ports+=("$port")
        continue
      fi
    fi

    # Start
    set +e
    if [[ "$name" == "postgres" || "$name" == "redis" ]]; then
      # Docker — synchronous, fast
      if eval "$start_cmd" >/dev/null 2>&1; then
        ok "$name started"
        started_ports+=("$port")
      else
        fail "$name failed to start"
      fi
    else
      # Background with nohup + disown
      cd "$workdir"
      if [[ -n "${envvar:-}" ]]; then
        export "${envvar}=${workdir}"
      fi
      nohup $start_cmd > "$logfile" 2>&1 &
      disown
      cd "$PROJECT_ROOT"
      ok "$name starting (PID $!)"
      started_ports+=("$port")
    fi
    set -e
  done

  # ── Health check loop (max 30s) ──────────────────────────
  echo ""
  info "Waiting for services to become healthy..."
  echo ""

  local max_wait=30
  local waited=0

  while [[ $waited -lt $max_wait ]]; do
    local all_healthy=true
    for entry in "${SERVICES[@]}"; do
      IFS='|' read -r _ _ health_spec _ _ _ <<< "$entry"
      if ! health_ok "$health_spec"; then
        all_healthy=false
      fi
    done
    $all_healthy && break
    sleep 2
    waited=$((waited + 2))
  done

  # ── Final status ─────────────────────────────────────────
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║         Health Check Results         ║"
  echo "╚══════════════════════════════════════╝"
  echo ""

  local exit_code=0
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name port health_spec _ _ _ <<< "$entry"
    if health_ok "$health_spec"; then
      ok "$name (:${port})"
    else
      fail "$name (:${port})"
      exit_code=1
    fi
  done

  echo ""
  if [[ $exit_code -eq 0 ]]; then
    echo -e "${GREEN}All services are running.${NC}"
  else
    echo -e "${RED}Some services failed to start. Check logs:${NC}"
    echo "  Backend:  tail -f /tmp/backend.log"
    echo "  Sidecar:  tail -f /tmp/sidecar.log"
    echo "  OpenCode: journalctl --user -u opencode-serve -n 50 --no-pager"
    echo "  Frontend: tail -f /tmp/frontend.log"
  fi
  echo ""

  exit $exit_code
}

# ── Main ─────────────────────────────────────────────────────

case "${1:-start}" in
  start|up)     start ;;
  stop|down)    stop ;;
  restart)      stop; sleep 1; start ;;
  *)            echo "Usage: $0 {start|stop|restart}"; exit 1 ;;
esac
