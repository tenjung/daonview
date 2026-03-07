#!/bin/bash

# ComfyUI 백그라운드 구동 래퍼 스크립트

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cd "$HOME/ComfyUI" || { echo "ComfyUI 디렉토리를 찾을 수 없습니다."; exit 1; }

source venv/bin/activate
exec python main.py --listen 127.0.0.1 --port 8188
