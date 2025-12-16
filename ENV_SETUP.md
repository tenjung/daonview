# DAONVIEW 환경 변수 설정 가이드

## 🔐 보안 주의사항
- `.env.local` 파일은 **절대** GitHub에 올리지 마세요
- 비공개 저장소라도 보안 위험이 있습니다
- 이 파일은 `.gitignore`에 의해 자동으로 제외됩니다

## 📝 설정 방법

### 새 컴퓨터에서 처음 설정할 때:

1. `.env.example` 파일을 복사:
   ```bash
   cp .env.example .env.local
   ```

2. `.env.local` 파일을 열고 실제 값으로 변경:
   - Supabase 대시보드: https://app.supabase.com/project/bjdxqauljfoncoueuwubd/settings/api
   - URL과 Anon Key를 복사해서 붙여넣기

## 💡 더 편리한 방법들

### 방법 1: 클라우드 동기화 (추천)
`.env.local` 파일을 안전한 클라우드 저장소에 보관:
- **1Password** / **Bitwarden**: 개발자용 Secure Notes 기능
- **Google Drive** (비공개 폴더): 암호화된 폴더에 저장
- **Dropbox**: 비공개 폴더에 저장

### 방법 2: 로컬 백업 스크립트
프로젝트 루트에 `backup-env.ps1` 파일 생성:
```powershell
# .env.local을 안전한 위치에 백업
Copy-Item .env.local ~\.daonview-env-backup.local
```

복원할 때:
```powershell
Copy-Item ~\.daonview-env-backup.local .env.local
```

### 방법 3: Vercel 환경 변수 사용
Vercel에 배포한 경우, 로컬에서도 Vercel 환경 변수를 가져올 수 있습니다:
```bash
vercel env pull .env.local
```

## 🚀 현재 설정된 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=https://bjdxqauljfoncoueuwubd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabase Anon Key]
```

## ❓ 문제 해결

### "supabaseUrl is required" 에러가 나는 경우:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 개발 서버를 재시작: `npm run dev`
3. 환경 변수 이름이 정확한지 확인 (NEXT_PUBLIC_ 접두사 필수)
