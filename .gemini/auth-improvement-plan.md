# 인증 시스템 구조 개선 계획

## 현재 문제점
1. **SSR 페이지**: 관리자 대시보드는 Server Component지만 인증 체크가 없음
2. **CSR 페이지**: 광고주/인플루언서 대시보드는 Client Component로 useEffect에서 인증 체크
3. **로그아웃 후 문제**: 로그아웃해도 페이지가 계속 보임 (인증 체크가 늦음)

## 해결 방안

### 1. Server Component 페이지 (관리자 대시보드)
- ✅ `requireAuth()` 함수 사용
- 서버에서 즉시 인증 체크 및 리다이렉트

### 2. Client Component 페이지 (광고주/인플루언서)
두 가지 옵션:
- **옵션 A**: Server Component로 전환 (권장)
- **옵션 B**: Client Component 유지하되 즉시 인증 체크 추가

### 3. 통합 인증 레이아웃
- `/dashboard` 하위에 공통 레이아웃 추가
- 모든 대시보드 페이지에 자동으로 인증 적용

## 구현 순서
1. ✅ `/lib/auth.ts` 생성 - 서버 인증 유틸리티
2. ✅ 관리자 페이지에 `requireAuth()` 추가
3. 광고주 페이지를 Server Component로 전환
4. 인플루언서 페이지에도 인증 추가
5. 공통 대시보드 레이아웃 생성

## 파일 목록
- ✅ `src/lib/auth.ts` - 서버 인증 함수
- ✅ `src/app/dashboard/admin/page.tsx` - 관리자 (SSR + 인증)
- 🔄 `src/app/dashboard/advertiser/page.tsx` - 광고주 (CSR → SSR 전환 필요)
- 🔄 `src/app/dashboard/influencer/page.tsx` - 인플루언서 (확인 필요)
- 📝 `src/app/dashboard/layout.tsx` - 공통 레이아웃 (생성 예정)
