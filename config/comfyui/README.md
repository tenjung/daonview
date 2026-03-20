# ComfyUI 워크플로우 템플릿 위치

- `video-storyboard-workflow.json` 파일을 이 폴더에 둔다.
- 파일은 ComfyUI에서 `API JSON` 형식으로 내보낸 워크플로우여야 한다.
- 아래 플레이스홀더를 포함해야 한다.

필수 플레이스홀더:
- `{{PROMPT}}`
- `{{NEGATIVE_PROMPT}}`
- `{{WIDTH}}`
- `{{HEIGHT}}`
- `{{SEED}}`
- `{{OUTPUT_PREFIX}}`

상세 규칙은 `docs/comfyui-video-storyboard-setup.md`를 따른다.
