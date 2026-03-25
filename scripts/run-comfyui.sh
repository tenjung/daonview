#!/bin/bash

# ComfyUI 백그라운드 구동 래퍼 스크립트

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

COMFYUI_ROOT="${COMFYUI_ROOT:-/Volumes/data/ComfyUI}"
COMFYUI_OUTPUT_DIR="$COMFYUI_ROOT/output"
COMFYUI_TEMP_DIR="$COMFYUI_ROOT/temp"
COMFYUI_INPUT_DIR="$COMFYUI_ROOT/input"
COMFYUI_USER_DIR="$COMFYUI_ROOT/user"
COMFYUI_TMP_DIR="$COMFYUI_ROOT/tmp"
COMFYUI_CACHE_DIR="$COMFYUI_ROOT/cache"

export TMPDIR="$COMFYUI_TMP_DIR"
export XDG_CACHE_HOME="$COMFYUI_CACHE_DIR/xdg"
export HF_HOME="$COMFYUI_CACHE_DIR/huggingface"
export TORCH_HOME="$COMFYUI_CACHE_DIR/torch"
export TRANSFORMERS_CACHE="$COMFYUI_CACHE_DIR/transformers"
export HF_DATASETS_CACHE="$COMFYUI_CACHE_DIR/datasets"

mkdir -p "$COMFYUI_OUTPUT_DIR" "$COMFYUI_TEMP_DIR" "$COMFYUI_INPUT_DIR" "$COMFYUI_USER_DIR" \
  "$COMFYUI_TMP_DIR" "$COMFYUI_CACHE_DIR" "$XDG_CACHE_HOME" "$HF_HOME" "$TORCH_HOME" \
  "$TRANSFORMERS_CACHE" "$HF_DATASETS_CACHE" \
  || { echo "ComfyUI 작업 디렉터리 생성에 실패했습니다."; exit 1; }

cd "$COMFYUI_ROOT" || { echo "ComfyUI 디렉토리를 찾을 수 없습니다."; exit 1; }

exec ./venv/bin/python main.py \
  --listen 127.0.0.1 \
  --port 8188 \
  --base-directory "$COMFYUI_ROOT" \
  --output-directory "$COMFYUI_OUTPUT_DIR" \
  --temp-directory "$COMFYUI_TEMP_DIR" \
  --input-directory "$COMFYUI_INPUT_DIR" \
  --user-directory "$COMFYUI_USER_DIR"
