#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="$PROJECT_ROOT/.runtime/share"
DEV_PID_FILE="$STATE_DIR/dev.pid"
TUNNEL_PID_FILE="$STATE_DIR/tunnel.pid"

read_pid_file() {
  local pid_file="$1"
  if [[ ! -f "$pid_file" ]]; then
    return 1
  fi
  local value
  value="$(tr -d '[:space:]' < "$pid_file")"
  if [[ -z "$value" || ! "$value" =~ ^[0-9]+$ ]]; then
    return 1
  fi
  echo "$value"
}

stop_by_pid() {
  local label="$1"
  local pid_file="$2"
  local pid

  if ! pid="$(read_pid_file "$pid_file")"; then
    echo "$label: sin PID registrado."
    return
  fi

  if ! kill -0 "$pid" >/dev/null 2>&1; then
    echo "$label: proceso no encontrado (PID $pid)."
    rm -f "$pid_file"
    return
  fi

  kill "$pid" >/dev/null 2>&1 || true
  sleep 1

  if kill -0 "$pid" >/dev/null 2>&1; then
    kill -9 "$pid" >/dev/null 2>&1 || true
    sleep 0.5
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "$label: no se pudo detener completamente (PID $pid)."
  else
    echo "$label: detenido (PID $pid)."
  fi

  rm -f "$pid_file"
}

stop_by_pid "Tunnel" "$TUNNEL_PID_FILE"
stop_by_pid "Servidor dev" "$DEV_PID_FILE"

# Fallback para procesos colgados de este repo.
if command -v pgrep >/dev/null 2>&1; then
  mapfile -t node_pids < <(pgrep -f "$PROJECT_ROOT.*(vite|server/index.js)" || true)
  for pid in "${node_pids[@]:-}"; do
    if [[ -n "$pid" ]]; then
      kill -9 "$pid" >/dev/null 2>&1 || true
      echo "Node hijo detenido (PID $pid)."
    fi
  done
fi

echo "Acceso temporal detenido. Si necesitas volver a compartir, ejecuta scripts/share/start-share.sh."
