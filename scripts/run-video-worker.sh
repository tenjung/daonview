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

exec /opt/homebrew/bin/node scripts/video-job-worker.mjs watch
