# 맥미니 백그라운드 영상 워커 운영 가이드

## 목적
- 웹 서비스는 Vercel에 유지한다.
- 맥미니는 영상 렌더링 워커만 담당한다.
- 웹은 Supabase에 작업을 `QUEUED`로 넣고, 맥미니 워커가 이를 처리한다.

## 현재 전제
- 워커 진입점: `scripts/video-job-worker.mjs`
- 운영용 래퍼: `scripts/run-video-worker.sh`
- `launchd` 템플릿: `ops/launchd/com.daonview.video-worker.plist`
- 고정 프로젝트 경로: `/Volumes/data/Dev/daonview`

## 1. 맥미니 필수 설치
```bash
brew install node ffmpeg
```

확인:
```bash
which node
which npm
which ffmpeg
which ffprobe
```

기대 경로:
- `node`: `/opt/homebrew/bin/node`
- `npm`: `/opt/homebrew/bin/npm`
- `ffmpeg`: `/opt/homebrew/bin/ffmpeg`
- `ffprobe`: `/opt/homebrew/bin/ffprobe`

## 2. 프로젝트 배치
```bash
cd /Volumes/data/Dev
git clone <YOUR_REPOSITORY_URL> daonview
cd /Volumes/data/Dev/daonview
npm install
chmod +x scripts/run-video-worker.sh
```

이미 저장소가 있다면:
```bash
cd /Volumes/data/Dev/daonview
git pull
npm install
chmod +x scripts/run-video-worker.sh
```

## 3. 환경변수
`.env.local`에 아래 값을 넣는다.

필수:
```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

선택:
```bash
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
FFPROBE_PATH=/opt/homebrew/bin/ffprobe
SUBTITLE_FONTS_DIR=/Users/tenjung/Library/Fonts
COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_WORKFLOW_PATH=/Volumes/data/Dev/daonview/config/comfyui/video-storyboard-workflow.json
COMFYUI_TIMEOUT_MS=180000
COMFYUI_NEGATIVE_PROMPT=text, caption, watermark, logo, low quality, blurry, distorted face
OPENAI_VIDEO_STORYBOARD_MODEL=gpt-4o-mini
```

주의:
- 워커는 `.env.local`을 직접 읽는다.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 워커 필수값이 아니다.
- Vercel에도 같은 계열 키가 필요하지만, 맥미니에서 웹 서버를 띄우지는 않는다.
- 대본만 모드의 자동 챕터 이미지 생성은 ComfyUI 설정이 완료돼야 동작한다.
- ComfyUI 워크플로우 템플릿 규칙은 `docs/comfyui-video-storyboard-setup.md` 를 따른다.

## 4. 수동 단발 검증
작업 등록 후 아래 명령으로 직접 워커를 실행한다.
```bash
cd /Volumes/data/Dev/daonview
npm run video:worker:prod
```

검증 기준:
- `ai_video_jobs.status`가 `QUEUED`에서 다음 단계로 변한다.
- 최종적으로 `COMPLETED` 또는 `FAILED`가 된다.
- 성공 시 `video_url`, `audio_url`, `subtitle_url`, `thumbnail_url` 이 채워진다.
- 실패 시 `error_message`가 남는다.

## 5. launchd 등록
로그 디렉터리를 먼저 만든다.
```bash
mkdir -p /Users/tenjung/Library/Logs/daonview
mkdir -p /Users/tenjung/Library/LaunchAgents
```

템플릿을 LaunchAgents로 복사한다.
```bash
cp /Volumes/data/Dev/daonview/ops/launchd/com.daonview.video-worker.plist /Users/tenjung/Library/LaunchAgents/com.daonview.video-worker.plist
```

등록 및 시작:
```bash
launchctl bootstrap gui/$(id -u) /Users/tenjung/Library/LaunchAgents/com.daonview.video-worker.plist
launchctl kickstart -k gui/$(id -u)/com.daonview.video-worker
```

이미 등록된 경우 재적용:
```bash
launchctl bootout gui/$(id -u) /Users/tenjung/Library/LaunchAgents/com.daonview.video-worker.plist
launchctl bootstrap gui/$(id -u) /Users/tenjung/Library/LaunchAgents/com.daonview.video-worker.plist
launchctl kickstart -k gui/$(id -u)/com.daonview.video-worker
```

## 6. 운영 명령
배포 반영:
```bash
cd /Volumes/data/Dev/daonview
git pull
npm install
launchctl kickstart -k gui/$(id -u)/com.daonview.video-worker
```

워커 코드 수정 반영:
```bash
cd /Volumes/data/Dev/daonview
launchctl kickstart -k gui/$(id -u)/com.daonview.video-worker
```

의미:
- `launchd` 운영 워커는 파일 변경을 자동 감지하지 않는다.
- `scripts/video-job-worker.mjs`, `scripts/run-video-worker.sh`, `.env.local` 변경 후에는 반드시 `kickstart`로 재시작한다.
- `npm run dev`의 HMR은 Next.js 개발 서버 전용이며, 워커에는 적용되지 않는다.

상태 확인:
```bash
launchctl print gui/$(id -u)/com.daonview.video-worker
tail -f /Users/tenjung/Library/Logs/daonview/video-worker.log
tail -f /Users/tenjung/Library/Logs/daonview/video-worker.error.log
```

중지:
```bash
launchctl bootout gui/$(id -u) /Users/tenjung/Library/LaunchAgents/com.daonview.video-worker.plist
```

## 6-1. 개발 모드와 운영 모드 전환
운영 모드:
- `launchd` 워커만 사용한다.
- Vercel 또는 로컬 웹에서 들어온 `QUEUED` 작업을 백그라운드에서 계속 처리한다.
- 운영 중 워커 코드 수정 시에는 `launchctl kickstart -k ...` 로 재시작한다.

개발 모드:
- 워커 로직을 자주 수정할 때만 `npm run video:worker:dev` 를 사용한다.
- `nodemon` 이 `scripts/video-job-worker.mjs` 와 `.env.local` 변경을 감지해 자동 재시작한다.
- 개발 모드 진입 전에는 반드시 `launchd` 워커를 내려서 중복 처리를 막는다.

개발 모드 진입:
```bash
launchctl bootout gui/$(id -u) /Users/tenjung/Library/LaunchAgents/com.daonview.video-worker.plist
cd /Volumes/data/Dev/daonview
npm run video:worker:dev
```

운영 모드 복귀:
```bash
launchctl bootstrap gui/$(id -u) /Users/tenjung/Library/LaunchAgents/com.daonview.video-worker.plist
launchctl kickstart -k gui/$(id -u)/com.daonview.video-worker
```

주의:
- `launchd` 워커와 `npm run video:worker:dev` 를 동시에 실행하면 안 된다.
- 둘 다 동일한 `QUEUED` 작업을 집어갈 수 있어 작업 경쟁과 중복 처리 위험이 생긴다.
- 개발 모드에서 테스트한 뒤 종료하지 않으면 운영 워커가 비활성 상태로 남을 수 있다.

## 7. 검증 시나리오
1. Vercel 배포본에서 `/ai-service/video-assistant`로 작업을 생성한다.
2. Supabase `ai_video_jobs`에서 새 레코드가 `QUEUED`인지 확인한다.
3. 워커 로그에서 작업 ID를 잡아 처리하는지 확인한다.
4. 상태가 `PROCESSING_TTS` 또는 `PROCESSING_SUBTITLE`로 진행되는지 확인한다.
5. 완료 시 생성 파일 URL 4개가 저장되는지 확인한다.
6. 맥미니를 재부팅한 뒤 `launchctl print`로 워커가 다시 살아났는지 확인한다.

## 8. 장애 기준
- `ffmpeg not found`: Homebrew 설치 누락 또는 PATH 누락이다.
- `OPENAI_API_KEY가 설정되지 않았습니다.`: `.env.local` 누락이다.
- `Supabase 환경변수가 설정되지 않았습니다.`: `.env.local`에 URL 또는 서비스 롤 키가 없다.
- 작업이 계속 `QUEUED`: `launchd` 미기동, 로그 경로 오류, 또는 워커 프로세스 즉시 종료다.
- 작업이 `FAILED`: `ai_video_jobs.error_message`와 에러 로그를 같이 본다.

## 9. 운영 원칙
- 외부에서 맥미니 웹 포트를 열지 않는다.
- 워커는 1개만 돌린다.
- 개발 중에는 `npm run video:worker:dev`, 운영 중에는 `launchd`만 사용한다.
- `npm run video:worker`와 `npm run video:worker:dev`를 동시에 띄우지 않는다.
- `launchd` 운영 워커가 살아 있는 동안 별도 수동 워커를 띄우지 않는다.
- 워커 코드 변경 후 반영이 안 된다고 느껴지면 먼저 `launchctl kickstart -k gui/$(id -u)/com.daonview.video-worker` 여부부터 확인한다.
- ComfyUI 설치 루트는 `/Volumes/data/ComfyUI` 로 유지한다.
- ComfyUI 작업물은 `/Volumes/data/ComfyUI/output`, `/Volumes/data/ComfyUI/temp`, `/Volumes/data/ComfyUI/input`, `/Volumes/data/ComfyUI/user` 로 고정한다.
- ComfyUI 임시 디렉터리와 라이브러리 캐시는 `/Volumes/data/ComfyUI/tmp`, `/Volumes/data/ComfyUI/cache` 로 고정한다.
- ComfyUI 관련 캐시·생성물·업로드용 입력 파일을 사용자 홈이나 내부 SSD 기본 경로로 분산시키지 않는다.
- `TMPDIR`, `XDG_CACHE_HOME`, `HF_HOME`, `TORCH_HOME`, `TRANSFORMERS_CACHE`, `HF_DATASETS_CACHE` 는 모두 외장 SSD 경로를 사용한다.
- ComfyUI 경로 정책 변경 시에는 `scripts/run-comfyui.sh` 수정 후 `launchctl kickstart -k gui/$(id -u)/com.daonview.comfyui` 로 재시작한다.
