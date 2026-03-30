#!/usr/bin/env bash
set -euo pipefail

FRONTEND_PORT="${FRONTEND_PORT:-5180}"
BACKEND_PORT="${BACKEND_PORT:-4000}"
TIMEOUT_SEC="${TIMEOUT_SEC:-5}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="$PROJECT_ROOT/.runtime/share"
DEV_PID_FILE="$STATE_DIR/dev.pid"
TUNNEL_PID_FILE="$STATE_DIR/tunnel.pid"
SHARE_URL_FILE="$STATE_DIR/share.url"

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

test_pid_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

endpoint_status() {
  local url="$1"
  curl -sS -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT_SEC" "$url" 2>/dev/null || echo "000"
}

frontend_url="http://127.0.0.1:$FRONTEND_PORT"
backend_health_url="http://127.0.0.1:$BACKEND_PORT/health"
public_url=""

if [[ -f "$SHARE_URL_FILE" ]]; then
  public_url="$(tr -d '\r\n' < "$SHARE_URL_FILE")"
fi

dev_pid=""
tunnel_pid=""
if dev_pid="$(read_pid_file "$DEV_PID_FILE")"; then :; else dev_pid=""; fi
if tunnel_pid="$(read_pid_file "$TUNNEL_PID_FILE")"; then :; else tunnel_pid=""; fi

dev_running=false
if test_pid_running "$dev_pid"; then dev_running=true; fi

tunnel_running=false
if test_pid_running "$tunnel_pid"; then tunnel_running=true; fi

frontend_status="$(endpoint_status "$frontend_url")"
backend_status="$(endpoint_status "$backend_health_url")"
public_status="000"
public_error=""

if [[ -n "$public_url" ]]; then
  public_status="$(endpoint_status "$public_url")"
else
  public_error="No existe .runtime/share/share.url o esta vacio."
fi

echo "=== Share Health Check ==="
echo "Project root  : $PROJECT_ROOT"
echo "Frontend local: $frontend_url"
echo "Backend health: $backend_health_url"
echo "Public URL    : $public_url"
echo
echo "Dev PID       : ${dev_pid:-none} (running: $dev_running)"
echo "Tunnel PID    : ${tunnel_pid:-none} (running: $tunnel_running)"
echo "Frontend      : ok=$([[ "$frontend_status" != "000" ]] && echo true || echo false) status=$frontend_status"
echo "Backend       : ok=$([[ "$backend_status" != "000" ]] && echo true || echo false) status=$backend_status"
echo "Public URL    : ok=$([[ "$public_status" != "000" ]] && echo true || echo false) status=$public_status"

if [[ "$frontend_status" == "000" ]]; then
  echo "Frontend error: no responde" >&2
fi
if [[ "$backend_status" == "000" ]]; then
  echo "Backend error : no responde" >&2
fi
if [[ -n "$public_error" ]]; then
  echo "Public error  : $public_error" >&2
fi
if [[ "$public_status" == "403" ]]; then
  echo "Public note   : 403 puede ser normal con Quick Tunnel desde curl." >&2
fi

public_reachable=false
if [[ "$public_status" != "000" || "$public_status" == "403" ]]; then
  public_reachable=true
fi

if [[ "$dev_running" == true && "$tunnel_running" == true && "$frontend_status" != "000" && "$backend_status" != "000" && "$public_reachable" == true ]]; then
  echo
echo "Resultado: OK. La sesion de sharing esta operativa."
  exit 0
fi

echo
echo "Resultado: FALLO. Ejecuta scripts/share/stop-share.sh y luego scripts/share/start-share.sh."
exit 1
