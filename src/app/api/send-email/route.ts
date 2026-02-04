import { NextResponse } from 'next/server';
import { sendEmail, EmailType } from '@/lib/email';

/**
 * 이메일 전송 API
 * POST /api/send-email
 * Body: { to: string, type: EmailType, params: any }
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

    // 2. 이메일 전송 실행 (내부에서 수신 거부 체크함)
    const result = await sendEmail(to, type as EmailType, params);

    return NextResponse.json({
      success: result.success,
      message: result.message || 'Process completed',
      messageId: result.messageId
    });

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
