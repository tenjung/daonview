# 이메일 발송 설정 가이드

## 1. Resend API 키 발급

1. [Resend](https://resend.com) 회원가입
2. Dashboard → API Keys → Create API Key
3. API 키 복사

## 2. 환경 변수 설정

`.env.local` 파일에 다음 변수를 추가하세요:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Site URL (이메일 링크용)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

로컬 개발 환경에서는:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. 도메인 인증 (프로덕션)

Resend에서 이메일을 발송하려면 도메인 인증이 필요합니다.

1. Resend Dashboard → Domains → Add Domain
2. 도메인 입력 (예: `daonview.com`)
3. DNS 레코드 추가:
   - TXT 레코드
   - CNAME 레코드
4. 인증 완료 후 `from` 주소를 실제 도메인으로 변경

## 4. 이메일 템플릿 수정

`src/app/api/send-approval-email/route.ts` 파일에서:

```typescript
from: 'DAONVIEW <noreply@daonview.com>', // 실제 도메인으로 변경
```

## 5. 테스트

1. 개발 환경에서는 Resend의 테스트 모드 사용
2. 신청자 승인 시 이메일 발송 확인
3. Resend Dashboard → Logs에서 발송 내역 확인

## 6. 주의사항

- 무료 플랜: 월 3,000통 제한
- 도메인 인증 전에는 테스트 이메일만 발송 가능
- 프로덕션 배포 시 반드시 도메인 인증 필요
