# ComfyUI 영상 챕터 이미지 자동화 설정

## 목적
- `/ai-service/video-assistant` 의 `대본만` 모드에서 웹 트리거 후 맥미니 워커가 ComfyUI로 챕터 이미지를 자동 생성하게 한다.

## 필수 환경변수
`.env.local` 또는 맥미니 워커 환경에 아래 값을 넣는다.

```bash
COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_WORKFLOW_PATH=/Volumes/data/Dev/daonview/config/comfyui/video-storyboard-workflow.json
COMFYUI_TIMEOUT_MS=180000
COMFYUI_NEGATIVE_PROMPT=text, caption, watermark, logo, low quality, blurry, distorted face, extra fingers, duplicated objects, deformed hands
OPENAI_VIDEO_STORYBOARD_MODEL=gpt-4o-mini
```

## 워크플로우 준비
1. ComfyUI에서 `FLUX.1 [schnell] + LoRA` 조합으로 실제 생성이 되는 워크플로우를 만든다.
2. `Save (API Format)` 또는 API JSON 내보내기로 워크플로우를 저장한다.
3. 저장된 JSON 안에서 아래 값을 플레이스홀더로 바꾼다.

필수 플레이스홀더:
- `{{PROMPT}}`
- `{{NEGATIVE_PROMPT}}`
- `{{WIDTH}}`
- `{{HEIGHT}}`
- `{{SEED}}`
- `{{OUTPUT_PREFIX}}`

예시:
- 긍정 프롬프트 노드 텍스트 -> `{{PROMPT}}`
- 네거티브 프롬프트 노드 텍스트 -> `{{NEGATIVE_PROMPT}}`
- latent width -> `{{WIDTH}}`
- latent height -> `{{HEIGHT}}`
- seed -> `{{SEED}}`
- SaveImage filename_prefix -> `{{OUTPUT_PREFIX}}`

## 동작 방식
- 웹에서 `대본만` 모드로 작업 생성
- 워커가 대본을 최대 4개 챕터로 분석
- 각 챕터별 영어 이미지 프롬프트 생성
- ComfyUI API `/prompt` 로 큐 등록
- `/history/{prompt_id}` 결과 대기
- 생성 이미지 다운로드 후 Supabase Storage 업로드
- 이후 같은 이미지를 배경으로 영상 렌더링

## 실패 기준
- `COMFYUI_WORKFLOW_PATH가 설정되지 않았습니다.`: 템플릿 경로 누락
- `ComfyUI 프롬프트 등록 실패`: ComfyUI 서버 미기동 또는 API 포트 불일치
- `ComfyUI 이미지 생성 대기 시간이 초과되었습니다.`: 모델 로딩 지연 또는 워크플로우 오류
- 챕터 상태가 `FAILED`: `ai_video_job_chapters.error_message` 와 워커 로그를 함께 확인

## 운영 원칙
- ComfyUI는 맥미니에서 항상 켜져 있어야 한다.
- `대본만` 모드에서만 자동 챕터 이미지 생성을 기본 사용한다.
- 워크플로우 JSON을 바꾸면 워커 재시작이 필요하다.
- ComfyUI 설치 루트는 `/Volumes/data/ComfyUI` 로 고정한다.
- ComfyUI 작업물은 반드시 `/Volumes/data/ComfyUI/output`, `/Volumes/data/ComfyUI/temp`, `/Volumes/data/ComfyUI/input`, `/Volumes/data/ComfyUI/user` 하위만 사용한다.
- ComfyUI 런타임 임시 파일과 라이브러리 캐시는 `/Volumes/data/ComfyUI/tmp`, `/Volumes/data/ComfyUI/cache` 하위로 고정한다.
- 내부 SSD 기본 경로나 사용자 홈 디렉터리 아래에 ComfyUI 작업물을 두지 않는다.
- `TMPDIR`, `XDG_CACHE_HOME`, `HF_HOME`, `TORCH_HOME`, `TRANSFORMERS_CACHE`, `HF_DATASETS_CACHE` 는 모두 `/Volumes/data/ComfyUI` 하위로 강제한다.
- ComfyUI 경로 규칙을 바꿀 때는 `scripts/run-comfyui.sh` 를 먼저 수정하고, launchd 재시작 전 실제 디렉터리 생성 여부를 확인한다.
