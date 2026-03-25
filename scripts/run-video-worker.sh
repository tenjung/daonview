#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[video-worker] .env.local 파일이 없습니다: $ENV_FILE" >&2
  exit 1
fi

cd "$PROJECT_ROOT"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

set -a
source "$ENV_FILE"
set +a

: "${NEXT_PUBLIC_SUPABASE_URL:?NEXT_PUBLIC_SUPABASE_URL가 필요합니다.}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY가 필요합니다.}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY가 필요합니다.}"

export COMFYUI_MANAGED="${COMFYUI_MANAGED:-1}"
export COMFYUI_START_COMMAND="${COMFYUI_START_COMMAND:-/bin/zsh -lc 'cd /Volumes/data/Dev/daonview && exec ./scripts/run-comfyui.sh'}"
export COMFYUI_STOP_COMMAND="${COMFYUI_STOP_COMMAND:-pkill -f 'main.py --listen 127.0.0.1 --port 8188' >/dev/null 2>&1 || true}"
export COMFYUI_BOOT_TIMEOUT_MS="${COMFYUI_BOOT_TIMEOUT_MS:-120000}"
export COMFYUI_IDLE_TIMEOUT_MS="${COMFYUI_IDLE_TIMEOUT_MS:-300000}"
export COMFYUI_SHUTDOWN_GRACE_MS="${COMFYUI_SHUTDOWN_GRACE_MS:-15000}"
export COMFYUI_PORT="${COMFYUI_PORT:-8188}"
export COMFYUI_PROCESS_MATCH="${COMFYUI_PROCESS_MATCH:-main.py --listen 127.0.0.1 --port ${COMFYUI_PORT}}"
export COMFYUI_KILL_RETRIES="${COMFYUI_KILL_RETRIES:-20}"
export COMFYUI_KILL_RETRY_DELAY_MS="${COMFYUI_KILL_RETRY_DELAY_MS:-1000}"

exec /opt/homebrew/bin/node scripts/video-job-worker.mjs watch
