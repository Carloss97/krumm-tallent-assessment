#!/usr/bin/env bash
set -euo pipefail

FRONTEND_PORT="${FRONTEND_PORT:-5180}"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-90}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="$PROJECT_ROOT/.runtime/share"
DEV_PID_FILE="$STATE_DIR/dev.pid"
TUNNEL_PID_FILE="$STATE_DIR/tunnel.pid"
DEV_OUT_LOG="$STATE_DIR/dev.out.log"
DEV_ERR_LOG="$STATE_DIR/dev.err.log"
TUNNEL_OUT_LOG="$STATE_DIR/tunnel.out.log"
TUNNEL_ERR_LOG="$STATE_DIR/tunnel.err.log"
SHARE_URL_FILE="$STATE_DIR/share.url"

ensure_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "No se encontro el comando requerido: $name" >&2
    exit 1
  fi
}

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

assert_not_running() {
  local label="$1"
  local pid_file="$2"
  local pid
  if ! pid="$(read_pid_file "$pid_file")"; then
    return 0
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "$label ya esta en ejecucion (PID $pid). Ejecuta scripts/share/stop-share.sh antes de volver a iniciar." >&2
    exit 1
  fi
}

test_http_ready() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 3 "$url" || true)"
  [[ "$code" =~ ^[0-9]{3}$ && "$code" != "000" ]]
}

stop_pid_if_running() {
  local pid="$1"
  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

cleanup_on_error() {
  local dev_pid="${1:-}"
  local tunnel_pid="${2:-}"
  stop_pid_if_running "$tunnel_pid"
  stop_pid_if_running "$dev_pid"
}

ensure_command npm
ensure_command curl
ensure_command cloudflared

mkdir -p "$STATE_DIR"
assert_not_running "Servidor de desarrollo" "$DEV_PID_FILE"
assert_not_running "Tunnel" "$TUNNEL_PID_FILE"

rm -f "$DEV_OUT_LOG" "$DEV_ERR_LOG" "$TUNNEL_OUT_LOG" "$TUNNEL_ERR_LOG" "$SHARE_URL_FILE"

echo "Iniciando app local en puerto $FRONTEND_PORT..."
(
  cd "$PROJECT_ROOT"
  npm run dev
) >"$DEV_OUT_LOG" 2>"$DEV_ERR_LOG" &
DEV_PID="$!"
echo -n "$DEV_PID" > "$DEV_PID_FILE"

FRONTEND_URL="http://127.0.0.1:$FRONTEND_PORT"
DEADLINE=$((SECONDS + STARTUP_TIMEOUT_SECONDS))
while (( SECONDS < DEADLINE )); do
  if test_http_ready "$FRONTEND_URL"; then
    break
  fi
  sleep 2
done

if ! test_http_ready "$FRONTEND_URL"; then
  echo "La app no quedo disponible a tiempo. Revisa logs y corrige antes de exponer." >&2
  echo "Log salida: $DEV_OUT_LOG" >&2
  echo "Log error : $DEV_ERR_LOG" >&2
  cleanup_on_error "$DEV_PID"
  exit 1
fi

echo "Iniciando Cloudflare Quick Tunnel..."
(
  cd "$PROJECT_ROOT"
  cloudflared tunnel --url "http://localhost:$FRONTEND_PORT"
) >"$TUNNEL_OUT_LOG" 2>"$TUNNEL_ERR_LOG" &
TUNNEL_PID="$!"
echo -n "$TUNNEL_PID" > "$TUNNEL_PID_FILE"

URL_REGEX='https://[-a-zA-Z0-9]+\.trycloudflare\.com'
PUBLIC_URL=""
TUNNEL_DEADLINE=$((SECONDS + STARTUP_TIMEOUT_SECONDS))
while (( SECONDS < TUNNEL_DEADLINE )); do
  if [[ -f "$TUNNEL_OUT_LOG" ]]; then
    PUBLIC_URL="$(grep -Eo "$URL_REGEX" "$TUNNEL_OUT_LOG" | tail -n 1 || true)"
  fi
  if [[ -z "$PUBLIC_URL" && -f "$TUNNEL_ERR_LOG" ]]; then
    PUBLIC_URL="$(grep -Eo "$URL_REGEX" "$TUNNEL_ERR_LOG" | tail -n 1 || true)"
  fi
  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  sleep 2
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "No se pudo extraer la URL publica del tunnel. Revisa logs." >&2
  echo "Log salida: $TUNNEL_OUT_LOG" >&2
  echo "Log error : $TUNNEL_ERR_LOG" >&2
  cleanup_on_error "$DEV_PID" "$TUNNEL_PID"
  exit 1
fi

echo -n "$PUBLIC_URL" > "$SHARE_URL_FILE"

echo
echo "Listo. Acceso temporal activo."
echo "URL publica  : $PUBLIC_URL"
echo "Frontend local: $FRONTEND_URL"
echo "Estado        : npm PID $DEV_PID | tunnel PID $TUNNEL_PID"
echo "Logs          : $DEV_OUT_LOG, $DEV_ERR_LOG, $TUNNEL_OUT_LOG, $TUNNEL_ERR_LOG"
