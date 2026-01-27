import { NextResponse } from 'next/server';
// import { sendEmail, EmailType } from '@/lib/email';

/**
 * 이메일 전송 API (임시 비활성화)
 * POST /api/send-email
 * Body: { to: string, type: EmailType, params: any }
 * 
 * ⚠️ AWS SES 샌드박스 모드로 인해 임시 비활성화
 * ✅ AWS SES 프로덕션 승인 후 아래 주석을 해제하세요
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, type, params } = body;

    // 1. 필수 값 검증
    if (!to || !type || !params) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type, or params' },
        { status: 400 }
      );
    }

    // ⚠️ 임시 비활성화: AWS SES 승인 대기 중
    console.log('[EMAIL DISABLED] Would send email:', { to, type, params });

    // 임시로 성공 응답 반환 (실제 발송은 안 됨)
    return NextResponse.json({
      success: true,
      message: 'Email queued (AWS SES sandbox mode - not actually sent)',
      messageId: `temp-${Date.now()}`
    });

    /* 
    // ✅ AWS SES 프로덕션 승인 후 아래 주석 해제
    // 2. 이메일 전송 실행
    const result = await sendEmail(to, type as EmailType, params);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
    */

  } catch (error: any) {
    console.error('Email API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send email'
      },
      { status: 500 }
    );
  }
}
